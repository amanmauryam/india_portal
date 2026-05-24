from fastapi import APIRouter, Depends, Query, BackgroundTasks
from sqlalchemy.future import select
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Dict, Any
from app.database import get_db
from app.models import State, District, Service, BlogPost, AnalyticsLog
from app.cache import cached_api_response

router = APIRouter(prefix="/api/search", tags=["search"])

async def log_search_query(query: str, db_session_maker) -> None:
    """Logs the search query to analytics in a non-blocking background process"""
    if not query or len(query.strip()) < 2:
        return
    # Obtain a fresh session specifically for this background task execution
    async with db_session_maker() as db:
        log = AnalyticsLog(
            event_type="SEARCH_QUERY",
            query_text=query.strip().lower()
        )
        db.add(log)
        await db.commit()

@router.get("")
@cached_api_response(expire=600, tags=["search"])
async def unified_search(
    q: str = Query(..., min_length=1),
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    background_tasks: BackgroundTasks = BackgroundTasks(),
    db: AsyncSession = Depends(get_db)
):
    """
    Unified Search Engine searching across States, Districts, Services, and Blogs in parallel.
    Features relevance scoring, pagination, and clean URL building.
    """
    term = q.strip().lower()
    results = []

    if not term:
        return {"results": [], "total": 0, "query": q}

    # Track search query inside background tasks to optimize API response speed
    from app.database import async_session
    background_tasks.add_task(log_search_query, q, async_session)

    # 1. Search States
    state_stmt = select(State).where(State.name.ilike(f"%{term}%") | State.description.ilike(f"%{term}%"))
    state_res = await db.execute(state_stmt)
    for state in state_res.scalars().all():
        score = 0
        if term in state.name.lower():
            score += 10
            if state.name.lower().startswith(term):
                score += 5
        if state.description and term in state.description.lower():
            score += 2
            
        results.append({
            "id": str(state.id),
            "type": "STATE",
            "title": state.name,
            "subtitle": state.description[:100] + "..." if state.description else "",
            "slug": state.slug,
            "url": f"/{state.slug}",
            "score": score
        })

    # 2. Search Districts (Load State for URL construction)
    dist_stmt = select(District, State).join(State, District.state_id == State.id).where(
        District.name.ilike(f"%{term}%") | 
        District.overview.ilike(f"%{term}%")
    )
    dist_res = await db.execute(dist_stmt)
    for dist, state in dist_res.all():
        score = 0
        if term in dist.name.lower():
            score += 10
            if dist.name.lower().startswith(term):
                score += 5
        if dist.overview and term in dist.overview.lower():
            score += 2
            
        results.append({
            "id": str(dist.id),
            "type": "DISTRICT",
            "title": f"{dist.name} District ({state.name})",
            "subtitle": dist.overview[:100] + "..." if dist.overview else "",
            "slug": dist.slug,
            "url": f"/{state.slug}/{dist.slug}",
            "score": score
        })

    # 3. Search Services
    srv_stmt = (
        select(Service, District, State)
        .join(District, Service.district_id == District.id)
        .join(State, District.state_id == State.id)
        .where(
            Service.name.ilike(f"%{term}%") | 
            Service.category.ilike(f"%{term}%") | 
            Service.warning_notes.ilike(f"%{term}%")
        )
    )
    srv_res = await db.execute(srv_stmt)
    for srv, dist, state in srv_res.all():
        score = 0
        if term in srv.name.lower():
            score += 10
            if srv.name.lower().startswith(term):
                score += 5
        if term in srv.category.lower():
            score += 4
        if srv.warning_notes and term in srv.warning_notes.lower():
            score += 1
            
        results.append({
            "id": str(srv.id),
            "type": "SERVICE",
            "title": srv.name,
            "subtitle": f"Utility service in {dist.name}, {state.name} ({srv.category})",
            "slug": srv.slug,
            "url": f"/{state.slug}/{dist.slug}/{srv.slug}",
            "score": score,
            "is_sponsored": srv.is_sponsored,
            "sponsor_link": srv.sponsor_link
        })

    # 4. Search Blogs
    blog_stmt = select(BlogPost).where(
        BlogPost.title.ilike(f"%{term}%") | 
        BlogPost.meta_description.ilike(f"%{term}%")
    ).where(BlogPost.status == "PUBLISHED")
    blog_res = await db.execute(blog_stmt)
    for blog in blog_res.scalars().all():
        score = 0
        if term in blog.title.lower():
            score += 10
            if blog.title.lower().startswith(term):
                score += 5
        if blog.meta_description and term in blog.meta_description.lower():
            score += 2
            
        results.append({
            "id": str(blog.id),
            "type": "BLOG",
            "title": blog.title,
            "subtitle": blog.meta_description[:100] + "..." if blog.meta_description else "",
            "slug": blog.slug,
            "url": f"/blogs/{blog.slug}",
            "score": score
        })

    # Sort results by relevance score in descending order
    results.sort(key=lambda x: x["score"], reverse=True)
    total = len(results)
    paginated = results[offset:offset + limit]

    return {
        "results": paginated,
        "total": total,
        "query": q,
        "limit": limit,
        "offset": offset,
    }
