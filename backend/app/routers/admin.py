import io
import os
import uuid
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status
from sqlalchemy.future import select
from sqlalchemy import desc, func
from sqlalchemy.ext.asyncio import AsyncSession
from uuid import UUID
from typing import List, Optional
from PIL import Image

from app.database import get_db
from app.models import (
    AdSlot, IngestionLog, AuditLog, User, MediaFile,
    Task, Notification, UserSession, ContentVersion, RolePermission
)
from app.schemas import (
    AdSlotCreate, AdSlotUpdate, AdSlotOut,
    IngestionLogOut, AuditLogOut,
    UserCreate, UserUpdate, UserOut, UserRoleOut,
    MediaFileOut, TaskCreate, TaskUpdate, TaskOut,
    NotificationOut, ContentVersionOut, ContentVersionCreate,
    UserSessionOut,
)
from app.auth import RoleChecker, get_current_user, get_password_hash
from app.services.cache_service import invalidate_entity_cache

router = APIRouter(prefix="/api/admin", tags=["admin"])


# ==========================================
# User Management
# ==========================================
@router.get("/users", response_model=List[UserOut])
async def get_users(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(RoleChecker(["SUPER_ADMIN", "ADMIN"])),
):
    result = await db.execute(select(User).order_by(User.created_at.desc()))
    return result.scalars().all()


@router.post("/users", response_model=UserOut, status_code=status.HTTP_201_CREATED)
async def create_user(
    user_in: UserCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(RoleChecker(["SUPER_ADMIN", "ADMIN"])),
):
    result = await db.execute(select(User).where(User.email == user_in.email))
    if result.scalars().first():
        raise HTTPException(status_code=400, detail="Email already registered")

    if current_user.role != "SUPER_ADMIN" and user_in.role in ("SUPER_ADMIN", "ADMIN"):
        raise HTTPException(status_code=403, detail="Only Super Admin can assign SUPER_ADMIN or ADMIN roles")

    user = User(
        email=user_in.email,
        hashed_password=get_password_hash(user_in.password),
        full_name=user_in.full_name,
        role=user_in.role,
        is_active=user_in.is_active,
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return user


@router.get("/users/{user_id}", response_model=UserOut)
async def get_user(
    user_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(RoleChecker(["SUPER_ADMIN", "ADMIN"])),
):
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalars().first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


@router.put("/users/{user_id}", response_model=UserOut)
async def update_user(
    user_id: UUID,
    user_in: UserUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(RoleChecker(["SUPER_ADMIN", "ADMIN"])),
):
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalars().first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    update_data = user_in.model_dump(exclude_unset=True)

    if current_user.id == user.id and "is_active" in update_data and not update_data["is_active"]:
        raise HTTPException(status_code=400, detail="You cannot deactivate your own account")

    if "password" in update_data and update_data["password"]:
        update_data["hashed_password"] = get_password_hash(update_data.pop("password"))
    elif "password" in update_data:
        update_data.pop("password")

    if current_user.role != "SUPER_ADMIN":
        update_data.pop("role", None)
        update_data.pop("is_active", None)

    for field, value in update_data.items():
        setattr(user, field, value)

    await db.commit()
    await db.refresh(user)
    return user


# ==========================================
# Media Library
# ==========================================
UPLOAD_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)


IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".gif", ".bmp", ".tiff", ".tif", ".webp"}


@router.post("/media/upload", response_model=MediaFileOut, status_code=status.HTTP_201_CREATED)
async def upload_media(
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(RoleChecker(["SUPER_ADMIN", "ADMIN", "STATE_MANAGER"])),
):
    content = await file.read()
    ext = os.path.splitext(file.filename or "file")[1].lower()

    is_image = (file.content_type and file.content_type.startswith("image/")) or ext in IMAGE_EXTENSIONS

    if is_image:
        try:
            img = Image.open(io.BytesIO(content))
            webp_buffer = io.BytesIO()
            save_kwargs = {"format": "WEBP", "quality": 80, "optimize": True}
            if img.mode in ("RGBA", "LA", "P"):
                save_kwargs["lossless"] = False
            img.save(webp_buffer, **save_kwargs)
            webp_content = webp_buffer.getvalue()

            unique_name = f"{uuid.uuid4()}.webp"
            file_path = os.path.join(UPLOAD_DIR, unique_name)
            with open(file_path, "wb") as f:
                f.write(webp_content)

            media = MediaFile(
                filename=unique_name,
                original_name=file.filename or "unknown",
                mime_type="image/webp",
                file_size=len(webp_content),
                url=f"/uploads/{unique_name}",
                uploaded_by=current_user.id,
            )
            db.add(media)
            await db.commit()
            await db.refresh(media)
            return media
        except Exception:
            pass

    ext = ext or ".bin"
    unique_name = f"{uuid.uuid4()}{ext}"
    file_path = os.path.join(UPLOAD_DIR, unique_name)

    with open(file_path, "wb") as f:
        f.write(content)

    url = f"/uploads/{unique_name}"

    media = MediaFile(
        filename=unique_name,
        original_name=file.filename or "unknown",
        mime_type=file.content_type or "application/octet-stream",
        file_size=len(content),
        url=url,
        uploaded_by=current_user.id,
    )
    db.add(media)
    await db.commit()
    await db.refresh(media)
    return media


@router.get("/media", response_model=List[MediaFileOut])
async def get_media(
    search: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(RoleChecker(["SUPER_ADMIN", "ADMIN", "STATE_MANAGER"])),
):
    stmt = select(MediaFile).order_by(desc(MediaFile.created_at))
    if search:
        stmt = stmt.where(MediaFile.original_name.ilike(f"%{search}%"))
    result = await db.execute(stmt)
    return result.scalars().all()


@router.delete("/media/{media_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_media(
    media_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(RoleChecker(["SUPER_ADMIN", "ADMIN"])),
):
    result = await db.execute(select(MediaFile).where(MediaFile.id == media_id))
    media = result.scalars().first()
    if not media:
        raise HTTPException(status_code=404, detail="Media not found")

    file_path = os.path.join(UPLOAD_DIR, media.filename)
    if os.path.exists(file_path):
        os.remove(file_path)

    await db.delete(media)
    await db.commit()
    return None


# ==========================================
# Task Management
# ==========================================
@router.get("/tasks", response_model=List[TaskOut])
async def get_tasks(
    status_filter: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(RoleChecker(["SUPER_ADMIN", "ADMIN", "STATE_MANAGER"])),
):
    stmt = select(Task).order_by(desc(Task.created_at))
    if status_filter:
        stmt = stmt.where(Task.status == status_filter)
    result = await db.execute(stmt)
    return result.scalars().all()


@router.post("/tasks", response_model=TaskOut, status_code=status.HTTP_201_CREATED)
async def create_task(
    task_in: TaskCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(RoleChecker(["SUPER_ADMIN", "ADMIN", "STATE_MANAGER"])),
):
    task = Task(
        **task_in.model_dump(),
        created_by=current_user.id,
    )
    db.add(task)
    await db.commit()
    await db.refresh(task)

    if task.assigned_to:
        notif = Notification(
            user_id=task.assigned_to,
            type="task_assigned",
            title=f"Task Assigned: {task.title}",
            message=f"You have been assigned a new task by {current_user.full_name}",
        )
        db.add(notif)
        await db.commit()
        await db.refresh(task)

    return task


@router.put("/tasks/{task_id}", response_model=TaskOut)
async def update_task(
    task_id: UUID,
    task_in: TaskUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(RoleChecker(["SUPER_ADMIN", "ADMIN", "STATE_MANAGER"])),
):
    result = await db.execute(select(Task).where(Task.id == task_id))
    task = result.scalars().first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    update_data = task_in.model_dump(exclude_unset=True)
    old_status = task.status
    for field, value in update_data.items():
        setattr(task, field, value)

    await db.commit()
    await db.refresh(task)

    if task.assigned_to and update_data.get("status") and update_data["status"] != old_status:
        notif = Notification(
            user_id=task.assigned_to,
            type="task_completed" if update_data["status"] == "COMPLETED" else "task_updated",
            title=f"Task {update_data['status']}: {task.title}",
            message=f"Task status changed to {update_data['status']}",
        )
        db.add(notif)
        await db.commit()
        await db.refresh(task)

    return task


# ==========================================
# Notifications
# ==========================================
@router.get("/notifications", response_model=List[NotificationOut])
async def get_notifications(
    limit: int = 20,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    stmt = (
        select(Notification)
        .where(Notification.user_id == current_user.id)
        .order_by(desc(Notification.created_at))
        .limit(limit)
    )
    result = await db.execute(stmt)
    return result.scalars().all()


@router.post("/notifications/read-all")
async def mark_all_read(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    stmt = (
        select(Notification)
        .where(Notification.user_id == current_user.id, Notification.read == False)
    )
    result = await db.execute(stmt)
    for notif in result.scalars().all():
        notif.read = True
    await db.commit()
    return {"status": "success"}


# ==========================================
# Online User Count
# ==========================================
@router.get("/online-count")
async def get_online_count(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(RoleChecker(["SUPER_ADMIN", "ADMIN"])),
):
    five_min_ago = datetime.utcnow() - timedelta(minutes=5)
    stmt = select(func.count(UserSession.id)).where(
        UserSession.is_active == True,
        UserSession.last_activity >= five_min_ago,
    )
    result = await db.execute(stmt)
    count = result.scalar() or 0
    return {"count": count}


# ==========================================
# Audit Logs
# ==========================================
@router.get("/audit-logs", response_model=List[AuditLogOut])
async def get_audit_logs(
    limit: int = 50,
    offset: int = 0,
    entity_type: Optional[str] = None,
    action: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(RoleChecker(["SUPER_ADMIN", "ADMIN"])),
):
    stmt = select(AuditLog).order_by(desc(AuditLog.timestamp))
    if entity_type:
        stmt = stmt.where(AuditLog.entity_type == entity_type.upper())
    if action:
        stmt = stmt.where(AuditLog.action == action.upper())
    stmt = stmt.offset(offset).limit(limit)
    result = await db.execute(stmt)
    return result.scalars().all()


@router.get("/audit-logs/stats")
async def get_audit_log_stats(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(RoleChecker(["SUPER_ADMIN", "ADMIN"])),
):
    stmt = select(
        AuditLog.action,
        func.count(AuditLog.id).label("count"),
    ).group_by(AuditLog.action).order_by(desc("count"))
    result = await db.execute(stmt)
    return [{"action": row[0], "count": row[1]} for row in result.all()]


# ==========================================
# Ingestion Logs
# ==========================================
@router.get("/ingestion-logs", response_model=List[IngestionLogOut])
async def get_ingestion_logs(
    limit: int = 20,
    offset: int = 0,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(RoleChecker(["SUPER_ADMIN", "STATE_MANAGER"])),
):
    stmt = select(IngestionLog).order_by(desc(IngestionLog.created_at)).offset(offset).limit(limit)
    result = await db.execute(stmt)
    return result.scalars().all()


# ==========================================
# Ad Slots
# ==========================================
@router.post("/ad-slots", response_model=AdSlotOut, status_code=status.HTTP_201_CREATED)
async def create_ad_slot(
    slot_in: AdSlotCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(RoleChecker(["SUPER_ADMIN"])),
):
    slot = AdSlot(**slot_in.model_dump())
    db.add(slot)
    await db.commit()
    await db.refresh(slot)
    await invalidate_entity_cache("ad_slots")
    return slot


@router.get("/ad-slots", response_model=List[AdSlotOut])
async def get_ad_slots(
    page_type: Optional[str] = None,
    is_active: Optional[bool] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(RoleChecker(["SUPER_ADMIN", "STATE_MANAGER"])),
):
    stmt = select(AdSlot).order_by(AdSlot.priority.desc(), AdSlot.created_at.desc())
    if page_type:
        stmt = stmt.where(AdSlot.page_type == page_type)
    if is_active is not None:
        stmt = stmt.where(AdSlot.is_active == is_active)
    result = await db.execute(stmt)
    return result.scalars().all()


@router.put("/ad-slots/{slot_id}", response_model=AdSlotOut)
async def update_ad_slot(
    slot_id: UUID,
    slot_in: AdSlotUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(RoleChecker(["SUPER_ADMIN"])),
):
    result = await db.execute(select(AdSlot).where(AdSlot.id == slot_id))
    slot = result.scalars().first()
    if not slot:
        raise HTTPException(status_code=404, detail="Ad slot not found")

    update_data = slot_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(slot, field, value)

    await db.commit()
    await db.refresh(slot)
    await invalidate_entity_cache("ad_slots")
    return slot


@router.delete("/ad-slots/{slot_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_ad_slot(
    slot_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(RoleChecker(["SUPER_ADMIN"])),
):
    result = await db.execute(select(AdSlot).where(AdSlot.id == slot_id))
    slot = result.scalars().first()
    if not slot:
        raise HTTPException(status_code=404, detail="Ad slot not found")

    await db.delete(slot)
    await db.commit()
    await invalidate_entity_cache("ad_slots")
    return None


# ==========================================
# Avatar Upload
# ==========================================
@router.post("/avatar", response_model=UserOut)
async def upload_avatar(
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    ext = os.path.splitext(file.filename or "file")[1] or ".png"
    unique_name = f"avatar_{current_user.id}{ext}"
    file_path = os.path.join(UPLOAD_DIR, unique_name)

    content = await file.read()
    with open(file_path, "wb") as f:
        f.write(content)

    current_user.avatar_url = f"/uploads/{unique_name}"
    await db.commit()
    await db.refresh(current_user)
    return current_user


# ==========================================
# User Sessions
# ==========================================
@router.get("/sessions", response_model=List[UserSessionOut])
async def get_sessions(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(RoleChecker(["SUPER_ADMIN", "ADMIN"])),
):
    five_min_ago = datetime.utcnow() - timedelta(minutes=5)
    stmt = (
        select(UserSession, User.full_name, User.role)
        .join(User, UserSession.user_id == User.id)
        .where(
            UserSession.is_active == True,
            UserSession.last_activity >= five_min_ago,
        )
        .order_by(desc(UserSession.last_activity))
    )
    result = await db.execute(stmt)
    sessions = []
    for row in result.all():
        session, user_name, user_role = row
        sessions.append({
            "id": session.id,
            "user_id": session.user_id,
            "user_name": user_name,
            "user_role": user_role,
            "ip_address": session.ip_address,
            "user_agent": session.user_agent,
            "current_page": session.current_page,
            "editing_status": session.editing_status,
            "is_active": session.is_active,
            "last_activity": session.last_activity,
            "created_at": session.created_at,
        })
    return sessions


@router.get("/me/sessions", response_model=List[UserSessionOut])
async def get_my_sessions(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    stmt = (
        select(UserSession, User.full_name, User.role)
        .join(User, UserSession.user_id == User.id)
        .where(UserSession.user_id == current_user.id)
        .order_by(desc(UserSession.last_activity))
    )
    result = await db.execute(stmt)
    sessions = []
    for row in result.all():
        session, user_name, user_role = row
        sessions.append({
            "id": session.id,
            "user_id": session.user_id,
            "user_name": user_name,
            "user_role": user_role,
            "ip_address": session.ip_address,
            "user_agent": session.user_agent,
            "current_page": session.current_page,
            "editing_status": session.editing_status,
            "is_active": session.is_active,
            "last_activity": session.last_activity,
            "created_at": session.created_at,
        })
    return sessions


# ==========================================
# Content Versions
# ==========================================
@router.get("/versions", response_model=List[ContentVersionOut])
async def get_versions(
    entity_type: Optional[str] = None,
    entity_id: Optional[UUID] = None,
    offset: int = 0,
    limit: int = 50,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(RoleChecker(["SUPER_ADMIN", "ADMIN", "STATE_MANAGER"])),
):
    stmt = select(ContentVersion, User.full_name).join(
        User, ContentVersion.created_by == User.id, isouter=True
    ).order_by(desc(ContentVersion.created_at))

    if entity_type:
        stmt = stmt.where(ContentVersion.entity_type == entity_type)
    if entity_id:
        stmt = stmt.where(ContentVersion.entity_id == entity_id)

    stmt = stmt.offset(offset).limit(limit)
    result = await db.execute(stmt)
    versions = []
    for row in result.all():
        version, creator_name = row
        versions.append({
            "id": version.id,
            "entity_type": version.entity_type,
            "entity_id": version.entity_id,
            "content_data": version.content_data,
            "version_note": version.version_note,
            "created_by": version.created_by,
            "created_by_name": creator_name,
            "created_at": version.created_at,
        })
    return versions


@router.get("/versions/{version_id}", response_model=ContentVersionOut)
async def get_version(
    version_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(RoleChecker(["SUPER_ADMIN", "ADMIN", "STATE_MANAGER"])),
):
    stmt = select(ContentVersion, User.full_name).join(
        User, ContentVersion.created_by == User.id, isouter=True
    ).where(ContentVersion.id == version_id)
    result = await db.execute(stmt)
    row = result.first()
    if not row:
        raise HTTPException(status_code=404, detail="Version not found")
    version, creator_name = row
    return {
        "id": version.id,
        "entity_type": version.entity_type,
        "entity_id": version.entity_id,
        "content_data": version.content_data,
        "version_note": version.version_note,
        "created_by": version.created_by,
        "created_by_name": creator_name,
        "created_at": version.created_at,
    }


@router.post("/versions/{version_id}/restore")
async def restore_version(
    version_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(RoleChecker(["SUPER_ADMIN", "ADMIN"])),
):
    stmt = select(ContentVersion).where(ContentVersion.id == version_id)
    result = await db.execute(stmt)
    version = result.scalars().first()
    if not version:
        raise HTTPException(status_code=404, detail="Version not found")

    from app.models import (
        District, Service, BlogPost, PageTemplate, AdSlot
    )

    entity_map = {
        "DISTRICT": District,
        "SERVICE": Service,
        "BLOG": BlogPost,
        "PAGE_TEMPLATE": PageTemplate,
        "AD_SLOT": AdSlot,
    }

    model_class = entity_map.get(version.entity_type)
    if not model_class:
        raise HTTPException(status_code=400, detail=f"Unknown entity type: {version.entity_type}")

    stmt_entity = select(model_class).where(model_class.id == version.entity_id)
    result_entity = await db.execute(stmt_entity)
    entity = result_entity.scalars().first()

    if not entity:
        raise HTTPException(status_code=404, detail="Entity not found")

    if version.content_data:
        for field, value in version.content_data.items():
            if hasattr(entity, field):
                setattr(entity, field, value)

    await db.commit()

    audit = AuditLog(
        entity_type=version.entity_type,
        entity_id=version.entity_id,
        action="RESTORE",
        performed_by=current_user.id,
        new_values={"restored_from_version": str(version_id)},
    )
    db.add(audit)
    await db.commit()

    return {"status": "success", "message": f"Version {version_id} restored"}


# ==========================================
# Permissions
# ==========================================
PERMISSIONS_LIST = [
    "users.manage",
    "media.upload",
    "media.delete",
    "tasks.create",
    "tasks.assign",
    "content.create",
    "content.publish",
    "content.delete",
    "seo.manage",
    "analytics.view",
    "monetization.manage",
    "settings.manage",
]

ROLES_LIST = ["SUPER_ADMIN", "ADMIN", "STATE_MANAGER", "DISTRICT_EDITOR", "CONTRIBUTOR", "VIEWER"]


@router.get("/permissions")
async def get_permissions(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(RoleChecker(["SUPER_ADMIN", "ADMIN"])),
):
    result = await db.execute(select(RolePermission))
    rows = result.scalars().all()

    perm_map: dict = {}
    for r in rows:
        if r.role not in perm_map:
            perm_map[r.role] = []
        perm_map[r.role].append(r.permission)

    roles_output = []
    for role in ROLES_LIST:
        roles_output.append({
            "role": role,
            "permissions": perm_map.get(role, []),
        })

    return {
        "roles": roles_output,
        "all_permissions": PERMISSIONS_LIST,
    }


@router.put("/permissions")
async def update_permissions(
    data: dict,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(RoleChecker(["SUPER_ADMIN"])),
):
    roles_data = data.get("roles", [])

    result = await db.execute(select(RolePermission))
    existing = result.scalars().all()
    for r in existing:
        await db.delete(r)
    await db.commit()

    for role_entry in roles_data:
        role_name = role_entry.get("role")
        permissions = role_entry.get("permissions", [])
        for perm in permissions:
            rp = RolePermission(role=role_name, permission=perm)
            db.add(rp)

    await db.commit()
    return {"status": "success"}
