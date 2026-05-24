from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession
from uuid import UUID
from typing import List

from app.database import get_db
from app.models import District, Service, State, SEOMetadata, User
from app.schemas import SEOMetadataOut
from app.auth import RoleChecker, get_current_user
from app.services.seo_pipeline import auto_generate_district_content, auto_generate_service_content
from app.services.cache_service import invalidate_entity_cache

router = APIRouter(prefix="/api/admin/seo", tags=["seo"])


@router.post("/generate/district/{district_id}")
async def generate_district_content(
    district_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(RoleChecker(["SUPER_ADMIN", "STATE_MANAGER"])),
):
    result = await db.execute(
        select(District).options(selectinload(District.state)).where(District.id == district_id)
    )
    district = result.scalars().first()
    if not district:
        raise HTTPException(status_code=404, detail="District not found")

    generated = await auto_generate_district_content(db, district, district.state)
    await db.commit()
    await invalidate_entity_cache("districts", district.slug)

    return {
        "status": "success",
        "message": f"Auto-generated content for district '{district.name}'",
        "generated_fields": list(generated.keys()),
    }


@router.post("/generate/service/{service_id}")
async def generate_service_content(
    service_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(RoleChecker(["SUPER_ADMIN", "STATE_MANAGER"])),
):
    result = await db.execute(
        select(Service)
        .options(selectinload(Service.district).selectinload(District.state))
        .where(Service.id == service_id)
    )
    service = result.scalars().first()
    if not service:
        raise HTTPException(status_code=404, detail="Service not found")

    generated = await auto_generate_service_content(db, service, service.district, service.district.state if service.district else None)
    await db.commit()
    await invalidate_entity_cache("services", service.slug)

    return {
        "status": "success",
        "message": f"Auto-generated content for service '{service.name}'",
        "generated_fields": list(generated.keys()),
    }


@router.post("/generate/all-districts")
async def generate_all_districts(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(RoleChecker(["SUPER_ADMIN", "STATE_MANAGER"])),
):
    result = await db.execute(select(District))
    districts = result.scalars().all()
    generated_count = 0

    for district in districts:
        state_res = await db.execute(select(State).where(State.id == district.state_id))
        state = state_res.scalars().first()
        if state:
            gen = await auto_generate_district_content(db, district, state)
            if gen:
                generated_count += 1

    await db.commit()
    await invalidate_entity_cache("districts")

    return {
        "status": "success",
        "message": f"Auto-generated content for {generated_count} districts",
        "total_districts": len(districts),
        "generated_count": generated_count,
    }


@router.post("/generate/all-services")
async def generate_all_services(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(RoleChecker(["SUPER_ADMIN", "STATE_MANAGER"])),
):
    result = await db.execute(select(Service))
    services = result.scalars().all()
    generated_count = 0

    for service in services:
        dist_res = await db.execute(
            select(District).options(selectinload(District.state)).where(District.id == service.district_id)
        )
        district = dist_res.scalars().first()
        if district:
            gen = await auto_generate_service_content(db, service, district, district.state)
            if gen:
                generated_count += 1

    await db.commit()
    await invalidate_entity_cache("services")

    return {
        "status": "success",
        "message": f"Auto-generated content for {generated_count} services",
        "total_services": len(services),
        "generated_count": generated_count,
    }


@router.get("/metadata", response_model=List[SEOMetadataOut])
async def get_seo_metadata(
    page_type: str = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(RoleChecker(["SUPER_ADMIN", "STATE_MANAGER"])),
):
    stmt = select(SEOMetadata).order_by(SEOMetadata.created_at.desc())
    if page_type:
        stmt = stmt.where(SEOMetadata.page_type == page_type)
    result = await db.execute(stmt)
    return result.scalars().all()
