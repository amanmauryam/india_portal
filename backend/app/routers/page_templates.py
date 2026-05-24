from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.future import select
from sqlalchemy.ext.asyncio import AsyncSession
from uuid import UUID
from typing import List

from app.database import get_db
from app.models import PageTemplate, User
from app.schemas import PageTemplateCreate, PageTemplateUpdate, PageTemplateOut
from app.auth import RoleChecker, get_current_user
from app.services.cache_service import invalidate_entity_cache
from app.cache import cached_api_response

router = APIRouter(prefix="/api/admin/page-templates", tags=["page-templates"])


@router.get("", response_model=List[PageTemplateOut])
async def get_page_templates(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(RoleChecker(["SUPER_ADMIN", "STATE_MANAGER"])),
):
    result = await db.execute(select(PageTemplate).order_by(PageTemplate.page_type))
    return result.scalars().all()


@router.get("/{template_id}", response_model=PageTemplateOut)
async def get_page_template(
    template_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(RoleChecker(["SUPER_ADMIN", "STATE_MANAGER"])),
):
    result = await db.execute(select(PageTemplate).where(PageTemplate.id == template_id))
    template = result.scalars().first()
    if not template:
        raise HTTPException(status_code=404, detail="Page template not found")
    return template


@router.get("/by-type/{page_type}", response_model=PageTemplateOut)
@cached_api_response(expire=3600, tags=["page_templates"])
async def get_page_template_by_type(
    page_type: str,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(PageTemplate).where(
            (PageTemplate.page_type == page_type) & (PageTemplate.is_active == True)
        )
    )
    template = result.scalars().first()
    if not template:
        raise HTTPException(status_code=404, detail=f"No active template found for type: {page_type}")
    return template


@router.post("", response_model=PageTemplateOut, status_code=status.HTTP_201_CREATED)
async def create_page_template(
    template_in: PageTemplateCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(RoleChecker(["SUPER_ADMIN"])),
):
    result = await db.execute(select(PageTemplate).where(PageTemplate.page_type == template_in.page_type))
    if result.scalars().first():
        raise HTTPException(status_code=400, detail=f"Template for type '{template_in.page_type}' already exists")

    template = PageTemplate(**template_in.model_dump())
    db.add(template)
    await db.commit()
    await db.refresh(template)
    await invalidate_entity_cache("page_templates")
    return template


@router.put("/{template_id}", response_model=PageTemplateOut)
async def update_page_template(
    template_id: UUID,
    template_in: PageTemplateUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(RoleChecker(["SUPER_ADMIN"])),
):
    result = await db.execute(select(PageTemplate).where(PageTemplate.id == template_id))
    template = result.scalars().first()
    if not template:
        raise HTTPException(status_code=404, detail="Page template not found")

    update_data = template_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(template, field, value)

    await db.commit()
    await db.refresh(template)
    await invalidate_entity_cache("page_templates")
    return template


@router.delete("/{template_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_page_template(
    template_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(RoleChecker(["SUPER_ADMIN"])),
):
    result = await db.execute(select(PageTemplate).where(PageTemplate.id == template_id))
    template = result.scalars().first()
    if not template:
        raise HTTPException(status_code=404, detail="Page template not found")

    await db.delete(template)
    await db.commit()
    await invalidate_entity_cache("page_templates")
    return None
