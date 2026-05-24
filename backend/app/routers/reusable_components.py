import re
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.future import select
from sqlalchemy.ext.asyncio import AsyncSession
from uuid import UUID
from typing import List, Optional

from app.database import get_db
from app.models import ReusableComponent, User
from app.schemas import ReusableComponentCreate, ReusableComponentUpdate, ReusableComponentOut
from app.auth import RoleChecker

router = APIRouter(prefix="/api/reusable-components", tags=["reusable-components"])
admin_router = APIRouter(prefix="/api/admin/reusable-components", tags=["admin-reusable-components"])


@router.get("", response_model=List[ReusableComponentOut])
async def get_reusable_components(
    component_type: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
):
    stmt = select(ReusableComponent).order_by(ReusableComponent.name)
    if component_type:
        stmt = stmt.where(ReusableComponent.component_type == component_type)
    result = await db.execute(stmt)
    return result.scalars().all()


@router.get("/{component_id}", response_model=ReusableComponentOut)
async def get_reusable_component(component_id: UUID, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(ReusableComponent).where(ReusableComponent.id == component_id))
    comp = result.scalars().first()
    if not comp:
        raise HTTPException(status_code=404, detail="Reusable component not found")
    return comp


@admin_router.post("", response_model=ReusableComponentOut, status_code=status.HTTP_201_CREATED)
async def create_reusable_component(
    comp_in: ReusableComponentCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(RoleChecker(["SUPER_ADMIN", "ADMIN", "STATE_MANAGER"])),
):
    slug = comp_in.slug or re.sub(r'[^a-z0-9-]', '', comp_in.name.lower().replace(" ", "-"))

    existing = await db.execute(select(ReusableComponent).where(ReusableComponent.slug == slug))
    if existing.scalars().first():
        raise HTTPException(status_code=400, detail="Slug already exists")

    comp = ReusableComponent(
        name=comp_in.name, slug=slug, component_type=comp_in.component_type,
        content_data=comp_in.content_data, created_by=current_user.id,
    )
    db.add(comp)
    await db.commit()
    await db.refresh(comp)
    return comp


@admin_router.put("/{component_id}", response_model=ReusableComponentOut)
async def update_reusable_component(
    component_id: UUID,
    comp_in: ReusableComponentUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(RoleChecker(["SUPER_ADMIN", "ADMIN", "STATE_MANAGER"])),
):
    result = await db.execute(select(ReusableComponent).where(ReusableComponent.id == component_id))
    comp = result.scalars().first()
    if not comp:
        raise HTTPException(status_code=404, detail="Reusable component not found")

    for field, value in comp_in.model_dump(exclude_unset=True).items():
        setattr(comp, field, value)

    await db.commit()
    await db.refresh(comp)
    return comp


@admin_router.delete("/{component_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_reusable_component(
    component_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(RoleChecker(["SUPER_ADMIN", "ADMIN"])),
):
    result = await db.execute(select(ReusableComponent).where(ReusableComponent.id == component_id))
    comp = result.scalars().first()
    if not comp:
        raise HTTPException(status_code=404, detail="Reusable component not found")
    await db.delete(comp)
    await db.commit()
    return None
