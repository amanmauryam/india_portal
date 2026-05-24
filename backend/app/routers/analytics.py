from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, Query, Request, status
from sqlalchemy.future import select
from sqlalchemy import func, desc, and_
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Dict, Any, Optional
from uuid import UUID
from app.database import get_db
from app.models import AnalyticsLog, District, Service, State, User
from app.schemas import AnalyticsLogCreate, AnalyticsMetricSummary
from app.auth import RoleChecker, get_current_user

router = APIRouter(prefix="/api/analytics", tags=["analytics"])


@router.post("/log", status_code=status.HTTP_201_CREATED)
async def log_event(
    event_in: AnalyticsLogCreate,
    request: Request,
    db: AsyncSession = Depends(get_db)
):
    ip_address = request.client.host if request.client else None
    user_agent = request.headers.get("User-Agent", None)

    log = AnalyticsLog(
        event_type=event_in.event_type,
        target_type=event_in.target_type,
        target_id=event_in.target_id,
        state_slug=event_in.state_slug,
        district_slug=event_in.district_slug,
        service_slug=event_in.service_slug,
        query_text=event_in.query_text,
        ip_address=ip_address,
        user_agent=user_agent
    )

    db.add(log)
    await db.commit()
    return {"status": "success", "message": "Event logged successfully"}


@router.get("/admin/metrics", response_model=AnalyticsMetricSummary)
async def get_analytics_metrics(
    days: int = Query(30, ge=1, le=365),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(RoleChecker(["SUPER_ADMIN", "STATE_MANAGER"]))
):
    since = datetime.utcnow() - timedelta(days=days)

    time_filter = AnalyticsLog.timestamp >= since

    views_stmt = select(func.count(AnalyticsLog.id)).where(
        and_(AnalyticsLog.event_type == "PAGE_VIEW", time_filter)
    )
    views_res = await db.execute(views_stmt)
    total_views = views_res.scalar() or 0

    search_stmt = (
        select(AnalyticsLog.query_text, func.count(AnalyticsLog.id).label("count"))
        .where(and_(AnalyticsLog.event_type == "SEARCH_QUERY", time_filter))
        .group_by(AnalyticsLog.query_text)
        .order_by(desc("count"))
        .limit(10)
    )
    search_res = await db.execute(search_stmt)
    trending_queries = [{"query": row[0], "count": row[1]} for row in search_res.all() if row[0]]

    dist_stmt = (
        select(AnalyticsLog.district_slug, func.count(AnalyticsLog.id).label("count"))
        .where(and_(AnalyticsLog.event_type == "PAGE_VIEW", AnalyticsLog.district_slug.isnot(None), time_filter))
        .group_by(AnalyticsLog.district_slug)
        .order_by(desc("count"))
        .limit(5)
    )
    dist_res = await db.execute(dist_stmt)
    top_districts = []
    for dist_slug, count in dist_res.all():
        d_res = await db.execute(select(District).where(District.slug == dist_slug))
        d_obj = d_res.scalars().first()
        dist_name = d_obj.name if d_obj else dist_slug.capitalize()
        top_districts.append({"name": dist_name, "slug": dist_slug, "count": count})

    srv_stmt = (
        select(AnalyticsLog.service_slug, func.count(AnalyticsLog.id).label("count"))
        .where(and_(AnalyticsLog.event_type == "PAGE_VIEW", AnalyticsLog.service_slug.isnot(None), time_filter))
        .group_by(AnalyticsLog.service_slug)
        .order_by(desc("count"))
        .limit(5)
    )
    srv_res = await db.execute(srv_stmt)
    top_services = []
    for srv_slug, count in srv_res.all():
        s_res = await db.execute(select(Service).where(Service.slug == srv_slug))
        s_obj = s_res.scalars().first()
        srv_name = s_obj.name if s_obj else srv_slug.replace("-", " ").title()
        top_services.append({"name": srv_name, "slug": srv_slug, "count": count})

    clicks_stmt = (
        select(AnalyticsLog.service_slug, func.count(AnalyticsLog.id).label("count"))
        .where(and_(AnalyticsLog.event_type == "LINK_CLICK", time_filter))
        .group_by(AnalyticsLog.service_slug)
        .order_by(desc("count"))
        .limit(5)
    )
    clicks_res = await db.execute(clicks_stmt)
    clicks_ctr = []
    for srv_slug, clicks_count in clicks_res.all():
        views_count_stmt = select(func.count(AnalyticsLog.id)).where(
            and_(AnalyticsLog.event_type == "PAGE_VIEW", AnalyticsLog.service_slug == srv_slug, time_filter)
        )
        views_count_res = await db.execute(views_count_stmt)
        impressions = views_count_res.scalar() or 1

        s_res = await db.execute(select(Service).where(Service.slug == srv_slug))
        s_obj = s_res.scalars().first()
        srv_name = s_obj.name if s_obj else srv_slug.replace("-", " ").title()

        ctr_percentage = round((clicks_count / impressions) * 100, 2)
        clicks_ctr.append({
            "name": srv_name,
            "clicks": clicks_count,
            "impressions": impressions,
            "ctr": ctr_percentage
        })

    return {
        "total_views": total_views,
        "top_districts": top_districts,
        "top_services": top_services,
        "trending_queries": trending_queries,
        "clicks_ctr": clicks_ctr
    }


@router.delete("/admin/cleanup")
async def cleanup_analytics(
    older_than_days: int = Query(90, ge=30),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(RoleChecker(["SUPER_ADMIN"]))
):
    cutoff = datetime.utcnow() - timedelta(days=older_than_days)
    stmt = select(func.count(AnalyticsLog.id)).where(AnalyticsLog.timestamp < cutoff)
    res = await db.execute(stmt)
    count = res.scalar() or 0

    delete_stmt = AnalyticsLog.__table__.delete().where(AnalyticsLog.timestamp < cutoff)
    await db.execute(delete_stmt)
    await db.commit()

    return {
        "status": "success",
        "deleted_records": count,
        "older_than_days": older_than_days,
    }


@router.get("/admin/per-page")
async def get_per_page_metrics(
    days: int = Query(7, ge=1, le=365),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(RoleChecker(["SUPER_ADMIN", "STATE_MANAGER"])),
):
    since = datetime.utcnow() - timedelta(days=days)

    state_stmt = (
        select(AnalyticsLog.state_slug, func.count(AnalyticsLog.id).label("views"))
        .where(and_(AnalyticsLog.event_type == "PAGE_VIEW", AnalyticsLog.state_slug.isnot(None), AnalyticsLog.timestamp >= since))
        .group_by(AnalyticsLog.state_slug)
        .order_by(desc("views"))
    )
    state_res = await db.execute(state_stmt)
    per_state = [{"slug": row[0], "views": row[1]} for row in state_res.all()]

    dist_stmt = (
        select(AnalyticsLog.district_slug, func.count(AnalyticsLog.id).label("views"))
        .where(and_(AnalyticsLog.event_type == "PAGE_VIEW", AnalyticsLog.district_slug.isnot(None), AnalyticsLog.timestamp >= since))
        .group_by(AnalyticsLog.district_slug)
        .order_by(desc("views"))
    )
    dist_res = await db.execute(dist_stmt)
    per_district = [{"slug": row[0], "views": row[1]} for row in dist_res.all()]

    return {
        "per_state": per_state,
        "per_district": per_district,
        "since_days": days,
    }
