from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession
from uuid import UUID
from typing import List, Optional

from app.database import get_db
from app.models import Service, District, State, User
from app.schemas import ServiceCreate, ServiceUpdate, ServiceOut, ServiceDetailOut
from app.auth import RoleChecker, get_current_user
from app.services.audit_service import log_audit
from app.services.cache_service import invalidate_entity_cache
from app.cache import cached_api_response
from app.services.seo_pipeline import auto_generate_service_content
from app.services.internal_link_service import generate_internal_links_for_service

router = APIRouter(prefix="/api/services", tags=["services"])


@router.get("", response_model=List[ServiceOut])
@cached_api_response(expire=3600, tags=["services"])
async def get_services(district_id: Optional[UUID] = None, db: AsyncSession = Depends(get_db)):
    if district_id:
        stmt = select(Service).where(Service.district_id == district_id).order_by(Service.name)
    else:
        stmt = select(Service).order_by(Service.name)
    result = await db.execute(stmt)
    return result.scalars().all()


@router.get("/by-slug/{state_slug}/{district_slug}/{service_slug}", response_model=ServiceDetailOut)
@cached_api_response(expire=3600, tags=["services"])
async def get_service_by_slug(
    state_slug: str, district_slug: str, service_slug: str, db: AsyncSession = Depends(get_db)
):
    state_res = await db.execute(select(State).where(State.slug == state_slug))
    state = state_res.scalars().first()
    if not state:
        raise HTTPException(status_code=404, detail="State not found")

    dist_res = await db.execute(
        select(District).where((District.state_id == state.id) & (District.slug == district_slug))
    )
    district = dist_res.scalars().first()
    if not district:
        raise HTTPException(status_code=404, detail="District not found")

    serv_res = await db.execute(
        select(Service).where((Service.district_id == district.id) & (Service.slug == service_slug))
    )
    service = serv_res.scalars().first()
    if not service:
        raise HTTPException(status_code=404, detail="Service not found")

    service_data = ServiceDetailOut.model_validate(service)
    service_data.district_name = district.name
    service_data.district_slug = district.slug
    service_data.state_name = state.name
    service_data.state_slug = state.slug
    return service_data


@router.get("/{service_id}", response_model=ServiceDetailOut)
@cached_api_response(expire=3600, tags=["services"])
async def get_service(service_id: UUID, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Service)
        .options(selectinload(Service.district).selectinload(District.state))
        .where(Service.id == service_id)
    )
    service = result.scalars().first()
    if not service:
        raise HTTPException(status_code=404, detail="Service not found")

    service_data = ServiceDetailOut.model_validate(service)
    if service.district:
        service_data.district_name = service.district.name
        service_data.district_slug = service.district.slug
        if service.district.state:
            service_data.state_name = service.district.state.name
            service_data.state_slug = service.district.state.slug

    return service_data


@router.post("", response_model=ServiceOut, status_code=status.HTTP_201_CREATED)
async def create_service(
    service_in: ServiceCreate,
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(RoleChecker(["SUPER_ADMIN", "STATE_MANAGER", "DISTRICT_EDITOR"]))
):
    dist_res = await db.execute(select(District).where(District.id == service_in.district_id))
    if not dist_res.scalars().first():
        raise HTTPException(status_code=400, detail="Associated district does not exist")

    dup_res = await db.execute(
        select(Service).where(
            (Service.district_id == service_in.district_id) & (Service.slug == service_in.slug)
        )
    )
    if dup_res.scalars().first():
        raise HTTPException(status_code=400, detail="Service with this slug already exists in this district")

    new_service = Service(**service_in.model_dump())
    db.add(new_service)
    await db.flush()

    ip_address = request.client.host if request.client else None
    await log_audit(
        db=db,
        action="CREATE",
        entity_type="SERVICE",
        entity_id=new_service.id,
        new_values=service_in.model_dump(),
        user_id=current_user.id,
        ip_address=ip_address,
    )

    await db.commit()
    await db.refresh(new_service)

    district_obj = await db.get(District, new_service.district_id, options=[selectinload(District.state)])
    await auto_generate_service_content(db, new_service, district_obj, district_obj.state if district_obj else None)
    await generate_internal_links_for_service(db, new_service, district_obj)
    await db.commit()
    await db.refresh(new_service)

    await invalidate_entity_cache("services")
    return new_service


@router.put("/{service_id}", response_model=ServiceOut)
async def update_service(
    service_id: UUID,
    service_in: ServiceUpdate,
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(RoleChecker(["SUPER_ADMIN", "STATE_MANAGER", "DISTRICT_EDITOR"]))
):
    result = await db.execute(select(Service).where(Service.id == service_id))
    service = result.scalars().first()
    if not service:
        raise HTTPException(status_code=404, detail="Service not found")

    old_values = {"name": service.name, "slug": service.slug, "category": service.category, "status": service.status}
    update_data = service_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(service, field, value)

    ip_address = request.client.host if request.client else None
    await log_audit(
        db=db,
        action="UPDATE",
        entity_type="SERVICE",
        entity_id=service.id,
        old_values=old_values,
        new_values=update_data,
        user_id=current_user.id,
        ip_address=ip_address,
    )

    await db.commit()
    await db.refresh(service)
    await invalidate_entity_cache("services")
    return service


@router.delete("/{service_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_service(
    service_id: UUID,
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(RoleChecker(["SUPER_ADMIN", "STATE_MANAGER", "DISTRICT_EDITOR"]))
):
    result = await db.execute(select(Service).where(Service.id == service_id))
    service = result.scalars().first()
    if not service:
        raise HTTPException(status_code=404, detail="Service not found")

    old_values = {"name": service.name, "slug": service.slug}
    ip_address = request.client.host if request.client else None
    await log_audit(
        db=db,
        action="DELETE",
        entity_type="SERVICE",
        entity_id=service.id,
        old_values=old_values,
        user_id=current_user.id,
        ip_address=ip_address,
    )

    await db.delete(service)
    await db.commit()
    await invalidate_entity_cache("services")
    return None
