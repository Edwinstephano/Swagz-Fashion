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
    
    # Backfill default values if columns are empty
    updated = False
    if not getattr(settings, 'categories', None):
        settings.categories = "Shirts, Jeans, Suits, Ethnic, T-Shirts, Accessories, Footwear"
        updated = True
    if not getattr(settings, 'available_sizes', None):
        settings.available_sizes = "S, M, L, XL, XXL, 38, 40, 42, 44"
        updated = True
    if not getattr(settings, 'available_colors', None):
        settings.available_colors = "White, Navy Blue, Black, Olive, Maroon, Beige"
        updated = True
    
    if updated:
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
