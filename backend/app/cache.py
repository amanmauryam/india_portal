import os
import json
import time
import asyncio
import logging
from functools import wraps
from typing import Any, Callable, Dict, List, Optional, Union
import urllib.request
import urllib.parse

logger = logging.getLogger("cache")

# Configuration settings
REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")
ENABLE_CACHE = os.getenv("ENABLE_CACHE", "true").lower() == "true"
NEXTJS_REVALIDATE_URL = os.getenv("NEXTJS_REVALIDATE_URL", "http://localhost:3000/api/revalidate")
NEXTJS_REVALIDATE_TOKEN = os.getenv("NEXTJS_REVALIDATE_TOKEN", "super-secret-revalidation-token-2026")

# In-memory dictionary for local dev fallback
_local_cache: Dict[str, Dict[str, Any]] = {}
# Tag index for local dev cache invalidation: tag -> set of keys
_local_tags: Dict[str, set] = {}

# Try to import redis
redis_client = None
if ENABLE_CACHE:
    try:
        import redis.asyncio as aioredis
        redis_client = aioredis.from_url(REDIS_URL, decode_responses=True)
        logger.info(f"Attempting to connect to Redis cache at {REDIS_URL}")
    except ImportError:
        logger.warning("redis package not found. Caching will fall back to high-performance in-memory cache.")
    except Exception as e:
        logger.warning(f"Failed to initialize Redis client ({str(e)}). Caching will fall back to high-performance in-memory cache.")

class CacheManager:
    @staticmethod
    async def get(key: str) -> Optional[Any]:
        if not ENABLE_CACHE:
            return None
        
        # 1. Try Redis
        if redis_client:
            try:
                val = await redis_client.get(key)
                if val:
                    return json.loads(val)
            except Exception as e:
                logger.warning(f"Redis get failed: {str(e)}. Falling back to in-memory.")
                
        # 2. Try In-memory fallback
        cached = _local_cache.get(key)
        if cached:
            # Check expiration
            if cached["expire_at"] is None or cached["expire_at"] > time.time():
                return cached["value"]
            else:
                # Evict expired key
                _local_cache.pop(key, None)
        return None

    @staticmethod
    async def set(key: str, value: Any, expire: Optional[int] = 3600, tags: Optional[List[str]] = None) -> None:
        if not ENABLE_CACHE:
            return
        
        serialized_val = json.dumps(value, default=str)
        
        # 1. Save to Redis
        if redis_client:
            try:
                if expire:
                    await redis_client.set(key, serialized_val, ex=expire)
                else:
                    await redis_client.set(key, serialized_val)
                
                # Tag tracking in Redis
                if tags:
                    for tag in tags:
                        await redis_client.sadd(f"tag:{tag}", key)
                return
            except Exception as e:
                logger.warning(f"Redis set failed: {str(e)}. Saving to in-memory fallback.")
                
        # 2. Save to In-memory fallback
        expire_at = time.time() + expire if expire else None
        _local_cache[key] = {
            "value": value,
            "expire_at": expire_at
        }
        
        # Tag tracking in memory
        if tags:
            for tag in tags:
                if tag not in _local_tags:
                    _local_tags[tag] = set()
                _local_tags[tag].add(key)

    @staticmethod
    async def invalidate(tags: List[str]) -> None:
        if not ENABLE_CACHE:
            return
        
        logger.info(f"Invalidating cache for tags: {tags}")
        
        # 1. Invalidate Redis
        if redis_client:
            try:
                for tag in tags:
                    keys = await redis_client.smembers(f"tag:{tag}")
                    if keys:
                        # Delete all tagged keys
                        await redis_client.delete(*keys)
                        # Clear the tag set itself
                        await redis_client.delete(f"tag:{tag}")
            except Exception as e:
                logger.warning(f"Redis invalidation failed: {str(e)}.")
                
        # 2. Invalidate In-memory fallback
        for tag in tags:
            keys = _local_tags.get(tag, set())
            for key in list(keys):
                _local_cache.pop(key, None)
            _local_tags.pop(tag, None)
            
        # 3. Trigger Next.js ISR Dynamic Revalidation (Webhooks)
        asyncio.create_task(trigger_nextjs_revalidation(tags))


async def trigger_nextjs_revalidation(tags: List[str]) -> None:
    """
    Fires non-blocking async webhook calls to the Next.js frontend to clear ISR caches.
    """
    for tag in tags:
        try:
            # We use urllib in a separate thread/executor to prevent event loop blocking
            def make_request():
                params = urllib.parse.urlencode({"tag": tag, "token": NEXTJS_REVALIDATE_TOKEN})
                url = f"{NEXTJS_REVALIDATE_URL}?{params}"
                req = urllib.request.Request(url, method="POST")
                try:
                    with urllib.request.urlopen(req, timeout=5) as response:
                        return response.status
                except Exception as e:
                    return str(e)
            
            logger.info(f"Triggering Next.js revalidation for tag '{tag}' at {NEXTJS_REVALIDATE_URL}")
            loop = asyncio.get_event_loop()
            res = await loop.run_in_executor(None, make_request)
            logger.info(f"Next.js ISR revalidation response for '{tag}': {res}")
        except Exception as e:
            logger.warning(f"Failed to fire Next.js revalidation webhook: {str(e)}")


def _make_json_safe(data: Any, _seen: Optional[set] = None) -> Any:
    """Convert ORM objects / Pydantic models to JSON-safe dicts recursively.

    Includes eagerly loaded SQLAlchemy relationships while preventing
    infinite recursion from bidirectional back-references.
    """
    if data is None:
        return None
    if _seen is None:
        _seen = set()
    # Pydantic v2 model
    if hasattr(data, "model_dump"):
        return data.model_dump()
    # SQLAlchemy ORM object
    if hasattr(data, "__table__"):
        obj_id = id(data)
        if obj_id in _seen:
            # Circular reference guard – return a lightweight stub
            pk = getattr(data, "id", None)
            return {"__ref__": type(data).__name__, "id": str(pk)} if pk else None
        _seen.add(obj_id)
        result = {}
        for c in data.__table__.columns:
            result[c.name] = _make_json_safe(getattr(data, c.name), _seen)
        # Include loaded relationships (those already in __dict__)
        for rel in data.__mapper__.relationships:
            if rel.key in data.__dict__:
                result[rel.key] = _make_json_safe(getattr(data, rel.key), _seen)
        return result
    # List
    if isinstance(data, list):
        return [_make_json_safe(item, _seen) for item in data]
    # Dict
    if isinstance(data, dict):
        return {k: _make_json_safe(v, _seen) for k, v in data.items()}
    return data


def cached_api_response(expire: Optional[int] = 3600, tags: Optional[List[str]] = None):
    """
    FastAPI Route Decorator for automatic JSON caching.
    """
    def decorator(func: Callable[..., Any]):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            if not ENABLE_CACHE:
                return await func(*args, **kwargs)
                
            # Build cache key based on function name and args/kwargs
            # Skip dependency injection objects (like DB session or current user)
            filtered_kwargs = {
                k: str(v) for k, v in kwargs.items() 
                if k not in ("db", "current_user", "session", "request", "background_tasks")
            }
            key_parts = [func.__name__]
            if args:
                key_parts.append(str(args))
            if filtered_kwargs:
                key_parts.append(str(sorted(filtered_kwargs.items())))
            
            cache_key = f"api:{':'.join(key_parts)}"
            
            # Try to get from cache
            cached_data = await CacheManager.get(cache_key)
            if cached_data is not None:
                logger.info(f"Cache HIT for key: {cache_key}")
                return cached_data
                
            # Call original endpoint
            logger.info(f"Cache MISS for key: {cache_key}. Loading from DB.")
            data = await func(*args, **kwargs)
            
            # Cache the result (convert to JSON-safe first)
            if data is not None:
                safe_data = _make_json_safe(data)
                await CacheManager.set(cache_key, safe_data, expire=expire, tags=tags)
                
            return data
        return wrapper
    return decorator
