from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.future import select
from sqlalchemy.ext.asyncio import AsyncSession
from uuid import UUID

from app.database import get_db
from app.models import District, Service, BlogPost, User
from app.schemas import WorkflowAction, ContentStatus
from app.auth import RoleChecker, get_current_user
from app.services.audit_service import log_audit
from app.services.cache_service import invalidate_entity_cache

router = APIRouter(prefix="/api/admin/workflow", tags=["workflow"])

ENTITY_MAP = {
    "district": (District, "districts"),
    "service": (Service, "services"),
    "blog": (BlogPost, "blogs"),
}

ALLOWED_TRANSITIONS = {
    ContentStatus.DRAFT: [ContentStatus.PENDING_REVIEW, ContentStatus.ARCHIVED],
    ContentStatus.PENDING_REVIEW: [ContentStatus.APPROVED, ContentStatus.DRAFT, ContentStatus.ARCHIVED],
    ContentStatus.APPROVED: [ContentStatus.PUBLISHED, ContentStatus.DRAFT],
    ContentStatus.PUBLISHED: [ContentStatus.ARCHIVED, ContentStatus.DRAFT],
    ContentStatus.ARCHIVED: [ContentStatus.DRAFT],
}

EDITOR_CAN_SET = {ContentStatus.DRAFT, ContentStatus.PENDING_REVIEW}
APPROVER_ROLES = ("SUPER_ADMIN", "STATE_MANAGER", "ADMIN")


async def get_entity(entity_type: str, entity_id: UUID, db: AsyncSession):
    model_info = ENTITY_MAP.get(entity_type)
    if not model_info:
        raise HTTPException(status_code=400, detail=f"Unknown entity type: {entity_type}")

    model = model_info[0]
    result = await db.execute(select(model).where(model.id == entity_id))
    entity = result.scalars().first()
    if not entity:
        raise HTTPException(status_code=404, detail=f"{entity_type.title()} not found")
    return entity, model_info[1]


@router.post("/{entity_type}/{entity_id}/transition")
async def transition_workflow(
    entity_type: str,
    entity_id: UUID,
    action: WorkflowAction,
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    entity, cache_tag = await get_entity(entity_type, entity_id, db)

    new_status = None
    if action.action == "submit_for_review":
        new_status = ContentStatus.PENDING_REVIEW
    elif action.action == "approve":
        if current_user.role not in APPROVER_ROLES:
            raise HTTPException(status_code=403, detail="Only SUPER_ADMIN, ADMIN, or STATE_MANAGER can approve content")
        new_status = ContentStatus.APPROVED
    elif action.action == "publish":
        if current_user.role not in APPROVER_ROLES:
            raise HTTPException(status_code=403, detail="Only SUPER_ADMIN, ADMIN, or STATE_MANAGER can publish content")
        new_status = ContentStatus.PUBLISHED
    elif action.action == "reject":
        if current_user.role not in APPROVER_ROLES:
            raise HTTPException(status_code=403, detail="Only SUPER_ADMIN, ADMIN, or STATE_MANAGER can reject content")
        new_status = ContentStatus.DRAFT
    elif action.action == "request_changes":
        if current_user.role not in APPROVER_ROLES:
            raise HTTPException(status_code=403, detail="Only SUPER_ADMIN, ADMIN, or STATE_MANAGER can request changes")
        new_status = ContentStatus.DRAFT
    elif action.action == "archive":
        new_status = ContentStatus.ARCHIVED
    else:
        raise HTTPException(status_code=400, detail=f"Unknown action: {action.action}")

    current_status = ContentStatus(entity.status)
    if new_status not in ALLOWED_TRANSITIONS.get(current_status, set()):
        raise HTTPException(
            status_code=400,
            detail=f"Cannot transition from {current_status.value} to {new_status.value}",
        )

    if current_user.role == "DISTRICT_EDITOR" and new_status not in EDITOR_CAN_SET:
        raise HTTPException(status_code=403, detail="District Editors cannot publish content directly")

    old_values = {"status": entity.status}
    entity.status = new_status.value
    if action.reviewer_notes:
        entity.reviewer_notes = action.reviewer_notes

    ip_address = request.client.host if request.client else None
    await log_audit(
        db=db,
        action=action.action.upper(),
        entity_type=entity_type.upper(),
        entity_id=entity_id,
        old_values=old_values,
        new_values={"status": entity.status, "reviewer_notes": entity.reviewer_notes},
        user_id=current_user.id,
        ip_address=ip_address,
    )

    await db.commit()
    await db.refresh(entity)
    await invalidate_entity_cache(cache_tag)

    return {
        "status": "success",
        "action": action.action,
        "new_status": entity.status,
        "entity_id": str(entity_id),
    }
