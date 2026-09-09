from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import Alteration, Bill
from ..schemas import AlterationCreate, AlterationUpdateStatus, AlterationResponse
from ..auth import get_current_user

router = APIRouter(prefix="/api/alterations", tags=["alterations"])

@router.get("", response_model=List[AlterationResponse])
def list_alterations(status: Optional[str] = None, db: Session = Depends(get_db)):
    query = db.query(Alteration).order_by(Alteration.created_at.desc())
    if status:
        query = query.filter(Alteration.status == status)
    return query.all()

@router.post("", response_model=AlterationResponse)
def create_alteration(req: AlterationCreate, db: Session = Depends(get_db)):
    bill = db.query(Bill).filter(Bill.id == req.bill_id).first()
    if not bill:
        raise HTTPException(status_code=404, detail="Associated bill not found")
    
    alt = Alteration(
        bill_id=req.bill_id,
        customer_name=req.customer_name,
        customer_phone=req.customer_phone,
        garment_details=req.garment_details,
        alteration_notes=req.alteration_notes,
        pickup_date=req.pickup_date
    )
    db.add(alt)
    db.commit()
    db.refresh(alt)
    return alt

@router.put("/{alteration_id}/status", response_model=AlterationResponse)
def update_alteration_status(
    alteration_id: int,
    req: AlterationUpdateStatus,
    db: Session = Depends(get_db)
):
    alt = db.query(Alteration).filter(Alteration.id == alteration_id).first()
    if not alt:
        raise HTTPException(status_code=404, detail="Alteration request not found")
    
    alt.status = req.status
    db.commit()
    db.refresh(alt)
    return alt
