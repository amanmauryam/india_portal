from typing import List, Optional
from app.cache import CacheManager


async def invalidate_entity_cache(entity_type: str, slug: Optional[str] = None) -> None:
    tags = [entity_type]
    if slug:
        tags.append(f"{entity_type}:{slug}")
    await CacheManager.invalidate(tags)


async def invalidate_all_content() -> None:
    await CacheManager.invalidate(["states", "districts", "services", "blogs"])
