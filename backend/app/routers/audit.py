from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import AuditLog, User
from ..schemas import AuditLogResponse
from ..auth import get_current_user

router = APIRouter(prefix="/api/audit-logs", tags=["audit"])

@router.get("", response_model=List[AuditLogResponse])
def list_audit_logs(
    action: Optional[str] = None,
    user_id: Optional[int] = None,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Restrict audit log view to manager and admin
    if current_user.role not in ["admin", "manager"]:
        raise HTTPException(status_code=403, detail="Access denied. Audit logs restricted to Managers and Admin.")

    query = db.query(AuditLog).order_by(AuditLog.created_at.desc())
    if action:
        query = query.filter(AuditLog.action == action)
    if user_id:
        query = query.filter(AuditLog.user_id == user_id)

    return query.limit(limit).all()
