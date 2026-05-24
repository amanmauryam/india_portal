from fastapi import APIRouter, Depends, HTTPException, Request, status, Query
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession
from uuid import UUID
from typing import List, Optional

from app.database import get_db
from app.models import State, User
from app.schemas import StateCreate, StateUpdate, StateOut, StateDetailOut, PaginatedStatesOut
from app.auth import RoleChecker, get_current_user
from app.services.audit_service import log_audit
from app.services.cache_service import invalidate_entity_cache
from app.cache import cached_api_response

router = APIRouter(prefix="/api/states", tags=["states"])

# Public endpoints
@router.get("", response_model=PaginatedStatesOut)
@cached_api_response(expire=3600, tags=["states"])
async def get_states(
    limit: Optional[int] = Query(None, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: AsyncSession = Depends(get_db)
):
    total_q = await db.execute(select(State))
    total = len(total_q.scalars().all())

    stmt = select(State).order_by(State.name)
    if limit is not None:
        stmt = stmt.offset(offset).limit(limit)
    result = await db.execute(stmt)
    items = result.scalars().all()
    return PaginatedStatesOut(items=items, total=total)

@router.get("/{slug_or_id}", response_model=StateDetailOut)
@cached_api_response(expire=3600, tags=["states"])
async def get_state(slug_or_id: str, db: AsyncSession = Depends(get_db)):
    # Try slug first, then UUID
    try:
        uuid_val = UUID(slug_or_id)
        stmt = select(State).where(State.id == uuid_val)
    except ValueError:
        stmt = select(State).where(State.slug == slug_or_id)
        
    stmt = stmt.options(selectinload(State.districts))
    result = await db.execute(stmt)
    state = result.scalars().first()
    if not state:
        raise HTTPException(status_code=404, detail="State not found")
    return state

# Protected CRUD endpoints
@router.post("", response_model=StateOut, status_code=status.HTTP_201_CREATED)
async def create_state(
    state_in: StateCreate,
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(RoleChecker(["SUPER_ADMIN", "STATE_MANAGER"]))
):
    # Check if slug or name exists
    result = await db.execute(select(State).where((State.slug == state_in.slug) | (State.name == state_in.name)))
    if result.scalars().first():
        raise HTTPException(status_code=400, detail="State name or slug already exists")
        
    new_state = State(**state_in.model_dump())
    db.add(new_state)
    await db.flush()

    ip_address = request.client.host if request.client else None
    await log_audit(
        db=db,
        action="CREATE",
        entity_type="STATE",
        entity_id=new_state.id,
        new_values=state_in.model_dump(),
        user_id=current_user.id,
        ip_address=ip_address,
    )

    await db.commit()
    await db.refresh(new_state)
    await invalidate_entity_cache("states")
    return new_state

@router.put("/{state_id}", response_model=StateOut)
async def update_state(
    state_id: UUID,
    state_in: StateUpdate,
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(RoleChecker(["SUPER_ADMIN", "STATE_MANAGER"]))
):
    result = await db.execute(select(State).where(State.id == state_id))
    state = result.scalars().first()
    if not state:
        raise HTTPException(status_code=404, detail="State not found")

    old_values = {"name": state.name, "slug": state.slug, "description": state.description}
    update_data = state_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(state, field, value)

    ip_address = request.client.host if request.client else None
    await log_audit(
        db=db,
        action="UPDATE",
        entity_type="STATE",
        entity_id=state.id,
        old_values=old_values,
        new_values=update_data,
        user_id=current_user.id,
        ip_address=ip_address,
    )

    await db.commit()
    await db.refresh(state)
    await invalidate_entity_cache("states")
    return state

@router.delete("/{state_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_state(
    state_id: UUID,
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(RoleChecker(["SUPER_ADMIN"]))
):
    result = await db.execute(select(State).where(State.id == state_id))
    state = result.scalars().first()
    if not state:
        raise HTTPException(status_code=404, detail="State not found")

    old_values = {"name": state.name, "slug": state.slug}
    ip_address = request.client.host if request.client else None
    await log_audit(
        db=db,
        action="DELETE",
        entity_type="STATE",
        entity_id=state.id,
        old_values=old_values,
        user_id=current_user.id,
        ip_address=ip_address,
    )

    await db.delete(state)
    await db.commit()
    await invalidate_entity_cache("states")
    return None
