from typing import Any, Dict, Optional
from uuid import UUID
from fastapi.encoders import jsonable_encoder
from sqlalchemy.ext.asyncio import AsyncSession
from app.models import AuditLog


def safe_audit_data(data: Optional[Dict[str, Any]]) -> Optional[Dict[str, Any]]:
    """Convert dict values to JSON-safe types (handles UUID, datetime, Enum, Decimal, etc.)."""
    if data is None:
        return None
    return jsonable_encoder(data)


async def log_audit(
    db: AsyncSession,
    action: str,
    entity_type: str,
    entity_id: Optional[UUID] = None,
    old_values: Optional[Dict[str, Any]] = None,
    new_values: Optional[Dict[str, Any]] = None,
    user_id: Optional[UUID] = None,
    ip_address: Optional[str] = None,
) -> AuditLog:
    log = AuditLog(
        user_id=user_id,
        action=action,
        entity_type=entity_type,
        entity_id=entity_id,
        old_values=safe_audit_data(old_values),
        new_values=safe_audit_data(new_values),
        ip_address=ip_address,
    )
    db.add(log)
    return log


def compute_diff(old: Dict[str, Any], new: Dict[str, Any]) -> Dict[str, Any]:
    diff = {}
    all_keys = set(list(old.keys()) + list(new.keys()))
    for key in all_keys:
        old_val = old.get(key)
        new_val = new.get(key)
        if old_val != new_val:
            diff[key] = {"old": old_val, "new": new_val}
    return diff
