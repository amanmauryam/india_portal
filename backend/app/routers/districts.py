from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession
from uuid import UUID
from typing import List, Optional

from app.database import get_db
from app.models import District, State, User
from app.schemas import DistrictCreate, DistrictUpdate, DistrictOut, DistrictDetailOut
from app.auth import RoleChecker, get_current_user
from app.services.audit_service import log_audit
from app.services.cache_service import invalidate_entity_cache
from app.cache import cached_api_response
from app.services.seo_pipeline import auto_generate_district_content
from app.services.internal_link_service import generate_internal_links_for_district

router = APIRouter(prefix="/api/districts", tags=["districts"])


@router.get("", response_model=List[DistrictOut])
@cached_api_response(expire=3600, tags=["districts"])
async def get_districts(state_id: Optional[UUID] = None, db: AsyncSession = Depends(get_db)):
    if state_id:
        stmt = select(District).where(District.state_id == state_id).order_by(District.name)
    else:
        stmt = select(District).order_by(District.name)
    result = await db.execute(stmt)
    return result.scalars().all()


@router.get("/by-slug/{state_slug}/{district_slug}", response_model=DistrictDetailOut)
@cached_api_response(expire=3600, tags=["districts"])
async def get_district_by_slug(state_slug: str, district_slug: str, db: AsyncSession = Depends(get_db)):
    state_stmt = select(State).where(State.slug == state_slug)
    state_res = await db.execute(state_stmt)
    state = state_res.scalars().first()
    if not state:
        raise HTTPException(status_code=404, detail="State not found")

    dist_stmt = (
        select(District)
        .where((District.state_id == state.id) & (District.slug == district_slug))
        .options(selectinload(District.services), selectinload(District.verified_portals))
    )
    dist_res = await db.execute(dist_stmt)
    district = dist_res.scalars().first()
    if not district:
        raise HTTPException(status_code=404, detail="District not found")

    district_data = DistrictDetailOut.model_validate(district)
    district_data.state_name = state.name
    district_data.state_slug = state.slug
    return district_data


@router.get("/{slug_or_id}", response_model=DistrictDetailOut)
@cached_api_response(expire=3600, tags=["districts"])
async def get_district(slug_or_id: str, db: AsyncSession = Depends(get_db)):
    try:
        uuid_val = UUID(slug_or_id)
        stmt = select(District).where(District.id == uuid_val)
    except ValueError:
        stmt = select(District).where(District.slug == slug_or_id)

    stmt = stmt.options(selectinload(District.services), selectinload(District.verified_portals), selectinload(District.state))
    result = await db.execute(stmt)
    district = result.scalars().first()
    if not district:
        raise HTTPException(status_code=404, detail="District not found")

    district_data = DistrictDetailOut.model_validate(district)
    if district.state:
        district_data.state_name = district.state.name
        district_data.state_slug = district.state.slug
    return district_data


@router.post("", response_model=DistrictOut, status_code=status.HTTP_201_CREATED)
async def create_district(
    district_in: DistrictCreate,
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(RoleChecker(["SUPER_ADMIN", "STATE_MANAGER"]))
):
    state_res = await db.execute(select(State).where(State.id == district_in.state_id))
    if not state_res.scalars().first():
        raise HTTPException(status_code=400, detail="Associated state does not exist")

    dup_res = await db.execute(
        select(District).where(
            (District.state_id == district_in.state_id) &
            ((District.slug == district_in.slug) | (District.name == district_in.name))
        )
    )
    if dup_res.scalars().first():
        raise HTTPException(status_code=400, detail="District with this name or slug already exists in this state")

    new_district = District(**district_in.model_dump())
    db.add(new_district)
    await db.flush()

    ip_address = request.client.host if request.client else None
    await log_audit(
        db=db,
        action="CREATE",
        entity_type="DISTRICT",
        entity_id=new_district.id,
        new_values=district_in.model_dump(),
        user_id=current_user.id,
        ip_address=ip_address,
    )

    await db.commit()
    await db.refresh(new_district)

    await auto_generate_district_content(db, new_district, await db.get(State, new_district.state_id))
    await generate_internal_links_for_district(db, new_district)
    await db.commit()
    await db.refresh(new_district)

    await invalidate_entity_cache("districts")
    return new_district


@router.put("/{district_id}", response_model=DistrictOut)
async def update_district(
    district_id: UUID,
    district_in: DistrictUpdate,
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(RoleChecker(["SUPER_ADMIN", "STATE_MANAGER"]))
):
    result = await db.execute(select(District).where(District.id == district_id))
    district = result.scalars().first()
    if not district:
        raise HTTPException(status_code=404, detail="District not found")

    old_values = {"name": district.name, "slug": district.slug, "status": district.status}
    update_data = district_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(district, field, value)

    ip_address = request.client.host if request.client else None
    await log_audit(
        db=db,
        action="UPDATE",
        entity_type="DISTRICT",
        entity_id=district.id,
        old_values=old_values,
        new_values=update_data,
        user_id=current_user.id,
        ip_address=ip_address,
    )

    await db.commit()
    await db.refresh(district)
    await invalidate_entity_cache("districts")
    return district


@router.delete("/{district_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_district(
    district_id: UUID,
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(RoleChecker(["SUPER_ADMIN", "STATE_MANAGER"]))
):
    result = await db.execute(select(District).where(District.id == district_id))
    district = result.scalars().first()
    if not district:
        raise HTTPException(status_code=404, detail="District not found")

    old_values = {"name": district.name, "slug": district.slug}
    ip_address = request.client.host if request.client else None
    await log_audit(
        db=db,
        action="DELETE",
        entity_type="DISTRICT",
        entity_id=district.id,
        old_values=old_values,
        user_id=current_user.id,
        ip_address=ip_address,
    )

    await db.delete(district)
    await db.commit()
    await invalidate_entity_cache("districts")
    return None
