from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.future import select
from sqlalchemy.ext.asyncio import AsyncSession
from uuid import UUID
from typing import List, Optional

from app.database import get_db
from app.models import VerifiedPortal, District, User
from app.schemas import VerifiedPortalCreate, VerifiedPortalUpdate, VerifiedPortalOut
from app.auth import RoleChecker

router = APIRouter(prefix="/api/admin/verified-portals", tags=["verified-portals"])


@router.get("", response_model=List[VerifiedPortalOut])
async def get_verified_portals(
    district_id: Optional[UUID] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(RoleChecker(["SUPER_ADMIN", "ADMIN", "STATE_MANAGER", "DISTRICT_EDITOR"])),
):
    stmt = select(VerifiedPortal).order_by(VerifiedPortal.name)
    if district_id:
        stmt = stmt.where(VerifiedPortal.district_id == district_id)
    result = await db.execute(stmt)
    return result.scalars().all()


@router.post("", response_model=VerifiedPortalOut, status_code=status.HTTP_201_CREATED)
async def create_verified_portal(
    portal_in: VerifiedPortalCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(RoleChecker(["SUPER_ADMIN", "ADMIN", "STATE_MANAGER"])),
):
    dist_result = await db.execute(select(District).where(District.id == portal_in.district_id))
    if not dist_result.scalars().first():
        raise HTTPException(status_code=400, detail="District does not exist")

    portal = VerifiedPortal(**portal_in.model_dump())
    db.add(portal)
    await db.commit()
    await db.refresh(portal)
    return portal


@router.put("/{portal_id}", response_model=VerifiedPortalOut)
async def update_verified_portal(
    portal_id: UUID,
    portal_in: VerifiedPortalUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(RoleChecker(["SUPER_ADMIN", "ADMIN", "STATE_MANAGER"])),
):
    result = await db.execute(select(VerifiedPortal).where(VerifiedPortal.id == portal_id))
    portal = result.scalars().first()
    if not portal:
        raise HTTPException(status_code=404, detail="Verified portal not found")

    update_data = portal_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(portal, field, value)

    await db.commit()
    await db.refresh(portal)
    return portal


@router.delete("/{portal_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_verified_portal(
    portal_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(RoleChecker(["SUPER_ADMIN", "ADMIN", "STATE_MANAGER"])),
):
    result = await db.execute(select(VerifiedPortal).where(VerifiedPortal.id == portal_id))
    portal = result.scalars().first()
    if not portal:
        raise HTTPException(status_code=404, detail="Verified portal not found")

    await db.delete(portal)
    await db.commit()
    return None
