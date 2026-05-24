from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.future import select
from sqlalchemy import func, desc
from sqlalchemy.ext.asyncio import AsyncSession
from uuid import UUID
from typing import List, Optional

import re

from app.database import get_db
from app.models import ServiceCategory, Service, User
from app.schemas import CategoryCreate, CategoryUpdate, CategoryOut, CategoryTreeOut, CategoryReorder, CategoryBulkAction
from app.auth import RoleChecker, get_current_user
from app.cache import cached_api_response
from app.services.cache_service import invalidate_entity_cache

router = APIRouter(prefix="/api/categories", tags=["categories"])
admin_router = APIRouter(prefix="/api/admin/categories", tags=["admin-categories"])


# ==========================================
# Public Endpoints
# ==========================================

@router.get("", response_model=List[CategoryTreeOut])
@cached_api_response(expire=3600, tags=["categories"])
async def get_categories(
    parent_id: Optional[UUID] = None,
    flat: bool = False,
    status_filter: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
):
    stmt = select(ServiceCategory)
    if status_filter:
        stmt = stmt.where(ServiceCategory.status == status_filter)
    if flat:
        if parent_id is not None:
            stmt = stmt.where(ServiceCategory.parent_id == parent_id)
        stmt = stmt.order_by(ServiceCategory.sort_order, ServiceCategory.name)
        result = await db.execute(stmt)
        cats = result.scalars().all()
        return await _enrich_with_counts(cats, db)

    stmt = stmt.order_by(ServiceCategory.sort_order, ServiceCategory.name)
    result = await db.execute(stmt)
    all_cats = result.scalars().all()

    if parent_id is not None:
        cats = [c for c in all_cats if c.parent_id == parent_id]
        return await _enrich_tree(cats, all_cats, db)

    roots = [c for c in all_cats if c.parent_id is None]
    return await _enrich_tree(roots, all_cats, db)


@router.get("/{category_id}", response_model=CategoryOut)
@cached_api_response(expire=3600, tags=["categories"])
async def get_category(category_id: UUID, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(ServiceCategory).where(ServiceCategory.id == category_id))
    cat = result.scalars().first()
    if not cat:
        raise HTTPException(status_code=404, detail="Category not found")
    count_result = await db.execute(
        select(func.count(Service.id)).where(Service.category_id == category_id)
    )
    count = count_result.scalar() or 0
    cat_dict = {c.name: getattr(cat, c.name) for c in cat.__table__.columns}
    cat_dict["service_count"] = count
    return cat_dict


# ==========================================
# Admin Endpoints
# ==========================================

@admin_router.get("", response_model=List[CategoryTreeOut])
async def admin_get_categories(
    flat: bool = False,
    status_filter: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(RoleChecker(["SUPER_ADMIN", "ADMIN", "STATE_MANAGER"])),
):
    stmt = select(ServiceCategory).order_by(ServiceCategory.sort_order, ServiceCategory.name)
    if status_filter:
        stmt = stmt.where(ServiceCategory.status == status_filter)
    result = await db.execute(stmt)
    all_cats = result.scalars().all()

    if flat:
        return await _enrich_with_counts(all_cats, db)

    roots = [c for c in all_cats if c.parent_id is None]
    return await _enrich_tree(roots, all_cats, db)


@admin_router.post("", response_model=CategoryOut, status_code=status.HTTP_201_CREATED)
async def create_category(
    cat_in: CategoryCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(RoleChecker(["SUPER_ADMIN", "ADMIN"])),
):
    slug = cat_in.slug or re.sub(r'[^a-z0-9-]', '', cat_in.name.lower().replace(" ", "-"))

    existing = await db.execute(select(ServiceCategory).where(ServiceCategory.slug == slug))
    if existing.scalars().first():
        raise HTTPException(status_code=400, detail="Slug already exists")

    cat = ServiceCategory(
        name=cat_in.name,
        slug=slug,
        description=cat_in.description,
        parent_id=cat_in.parent_id,
        icon=cat_in.icon,
        sort_order=cat_in.sort_order,
        status=cat_in.status,
    )
    db.add(cat)
    await db.commit()
    await db.refresh(cat)
    await invalidate_entity_cache("categories")
    cat_dict = {c.name: getattr(cat, c.name) for c in cat.__table__.columns}
    cat_dict["service_count"] = 0
    return cat_dict


@admin_router.put("/{category_id}", response_model=CategoryOut)
async def update_category(
    category_id: UUID,
    cat_in: CategoryUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(RoleChecker(["SUPER_ADMIN", "ADMIN"])),
):
    result = await db.execute(select(ServiceCategory).where(ServiceCategory.id == category_id))
    cat = result.scalars().first()
    if not cat:
        raise HTTPException(status_code=404, detail="Category not found")

    update_data = cat_in.model_dump(exclude_unset=True)
    if "slug" in update_data:
        existing = await db.execute(
            select(ServiceCategory).where(ServiceCategory.slug == update_data["slug"], ServiceCategory.id != category_id)
        )
        if existing.scalars().first():
            raise HTTPException(status_code=400, detail="Slug already exists")

    for field, value in update_data.items():
        setattr(cat, field, value)

    await db.commit()
    await db.refresh(cat)
    await invalidate_entity_cache("categories")

    count_result = await db.execute(
        select(func.count(Service.id)).where(Service.category_id == category_id)
    )
    count = count_result.scalar() or 0
    cat_dict = {c.name: getattr(cat, c.name) for c in cat.__table__.columns}
    cat_dict["service_count"] = count
    return cat_dict


@router.delete("", deprecated=True)
@admin_router.delete("/{category_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_category(
    category_id: UUID,
    move_to_id: Optional[UUID] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(RoleChecker(["SUPER_ADMIN", "ADMIN"])),
):
    result = await db.execute(select(ServiceCategory).where(ServiceCategory.id == category_id))
    cat = result.scalars().first()
    if not cat:
        raise HTTPException(status_code=404, detail="Category not found")

    service_count_result = await db.execute(
        select(func.count(Service.id)).where(Service.category_id == category_id)
    )
    service_count = service_count_result.scalar() or 0

    if service_count > 0 and move_to_id:
        stmt = select(Service).where(Service.category_id == category_id)
        result = await db.execute(stmt)
        services = result.scalars().all()
        for svc in services:
            svc.category_id = move_to_id
        await db.commit()

    children_result = await db.execute(
        select(ServiceCategory).where(ServiceCategory.parent_id == category_id)
    )
    children = children_result.scalars().all()
    for child in children:
        child.parent_id = cat.parent_id

    await db.delete(cat)
    await db.commit()
    await invalidate_entity_cache("categories")
    return None


@admin_router.put("/reorder/all")
async def reorder_categories(
    items: List[CategoryReorder],
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(RoleChecker(["SUPER_ADMIN", "ADMIN"])),
):
    for item in items:
        result = await db.execute(select(ServiceCategory).where(ServiceCategory.id == item.id))
        cat = result.scalars().first()
        if cat:
            cat.sort_order = item.sort_order
            if item.parent_id is not None:
                cat.parent_id = item.parent_id
    await db.commit()
    await invalidate_entity_cache("categories")
    return {"status": "success"}


@admin_router.post("/bulk")
async def bulk_category_action(
    bulk: CategoryBulkAction,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(RoleChecker(["SUPER_ADMIN", "ADMIN"])),
):
    result = await db.execute(select(ServiceCategory).where(ServiceCategory.id.in_(bulk.ids)))
    cats = result.scalars().all()

    if bulk.action == "delete":
        if bulk.target_category_id:
            svc_result = await db.execute(select(Service).where(Service.category_id.in_(bulk.ids)))
            for svc in svc_result.scalars().all():
                svc.category_id = bulk.target_category_id
        for cat in cats:
            await db.delete(cat)
    elif bulk.action == "activate":
        for cat in cats:
            cat.status = "ACTIVE"
    elif bulk.action == "deactivate":
        for cat in cats:
            cat.status = "INACTIVE"

    await db.commit()
    await invalidate_entity_cache("categories")
    return {"status": "success", "affected": len(cats)}


# ==========================================
# Helpers
# ==========================================

async def _enrich_with_counts(cats, db):
    result = []
    for cat in cats:
        count_result = await db.execute(
            select(func.count(Service.id)).where(Service.category_id == cat.id)
        )
        count = count_result.scalar() or 0
        d = {c.name: getattr(cat, c.name) for c in cat.__table__.columns}
        d["service_count"] = count
        result.append(d)
    return result


async def _enrich_tree(roots, all_cats, db):
    result = []
    for root in roots:
        d = {c.name: getattr(root, c.name) for c in root.__table__.columns}
        count_result = await db.execute(
            select(func.count(Service.id)).where(Service.category_id == root.id)
        )
        d["service_count"] = count_result.scalar() or 0
        children = [c for c in all_cats if c.parent_id == root.id]
        if children:
            d["children"] = await _enrich_tree(children, all_cats, db)
        else:
            d["children"] = []
        result.append(d)
    return result
