import re
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.future import select
from sqlalchemy.ext.asyncio import AsyncSession
from uuid import UUID
from typing import List, Optional

from app.database import get_db
from app.models import ContentTemplate, User
from app.schemas import ContentTemplateCreate, ContentTemplateUpdate, ContentTemplateOut
from app.auth import RoleChecker

router = APIRouter(prefix="/api/templates", tags=["templates"])
admin_router = APIRouter(prefix="/api/admin/templates", tags=["admin-templates"])


@router.get("", response_model=List[ContentTemplateOut])
async def get_templates(
    template_type: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
):
    stmt = select(ContentTemplate).order_by(ContentTemplate.name)
    if template_type:
        stmt = stmt.where(ContentTemplate.template_type == template_type)
    result = await db.execute(stmt)
    return result.scalars().all()


@router.get("/{template_id}", response_model=ContentTemplateOut)
async def get_template(template_id: UUID, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(ContentTemplate).where(ContentTemplate.id == template_id))
    template = result.scalars().first()
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")
    return template


@admin_router.post("", response_model=ContentTemplateOut, status_code=status.HTTP_201_CREATED)
async def create_template(
    tpl_in: ContentTemplateCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(RoleChecker(["SUPER_ADMIN", "ADMIN"])),
):
    slug = tpl_in.slug or re.sub(r'[^a-z0-9-]', '', tpl_in.name.lower().replace(" ", "-"))

    existing = await db.execute(select(ContentTemplate).where(ContentTemplate.slug == slug))
    if existing.scalars().first():
        raise HTTPException(status_code=400, detail="Slug already exists")

    tpl = ContentTemplate(
        name=tpl_in.name, slug=slug, description=tpl_in.description,
        template_type=tpl_in.template_type, content_blocks=tpl_in.content_blocks,
        seo=tpl_in.seo, thumbnail=tpl_in.thumbnail, created_by=current_user.id,
    )
    db.add(tpl)
    await db.commit()
    await db.refresh(tpl)
    return tpl


@admin_router.put("/{template_id}", response_model=ContentTemplateOut)
async def update_template(
    template_id: UUID,
    tpl_in: ContentTemplateUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(RoleChecker(["SUPER_ADMIN", "ADMIN"])),
):
    result = await db.execute(select(ContentTemplate).where(ContentTemplate.id == template_id))
    tpl = result.scalars().first()
    if not tpl:
        raise HTTPException(status_code=404, detail="Template not found")

    for field, value in tpl_in.model_dump(exclude_unset=True).items():
        setattr(tpl, field, value)

    await db.commit()
    await db.refresh(tpl)
    return tpl


@admin_router.delete("/{template_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_template(
    template_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(RoleChecker(["SUPER_ADMIN", "ADMIN"])),
):
    result = await db.execute(select(ContentTemplate).where(ContentTemplate.id == template_id))
    tpl = result.scalars().first()
    if not tpl:
        raise HTTPException(status_code=404, detail="Template not found")
    await db.delete(tpl)
    await db.commit()
    return None
