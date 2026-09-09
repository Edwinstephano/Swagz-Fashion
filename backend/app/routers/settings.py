from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import ShopSettings
from ..schemas import ShopSettingsUpdate, ShopSettingsResponse
from ..auth import require_role

router = APIRouter(prefix="/api/settings", tags=["settings"])

@router.get("", response_model=ShopSettingsResponse)
def get_settings(db: Session = Depends(get_db)):
    settings = db.query(ShopSettings).first()
    if not settings:
        settings = ShopSettings()
        db.add(settings)
        db.commit()
        db.refresh(settings)
    return settings

@router.put("", response_model=ShopSettingsResponse)
def update_settings(
    req: ShopSettingsUpdate,
    db: Session = Depends(get_db),
    current_user = Depends(require_role(["admin"]))
):
    settings = db.query(ShopSettings).first()
    if not settings:
        settings = ShopSettings()
        db.add(settings)
    
    update_data = req.dict(exclude_unset=True)
    for key, val in update_data.items():
        setattr(settings, key, val)
    
    db.commit()
    db.refresh(settings)
    return settings
