from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import Customer
from ..schemas import CustomerCreate, CustomerResponse
from ..auth import get_current_user

router = APIRouter(prefix="/api/customers", tags=["customers"])

@router.get("", response_model=List[CustomerResponse])
def list_customers(phone: Optional[str] = None, search: Optional[str] = None, db: Session = Depends(get_db)):
    query = db.query(Customer)
    if phone:
        query = query.filter(Customer.phone.ilike(f"%{phone}%"))
    if search:
        query = query.filter((Customer.name.ilike(f"%{search}%")) | (Customer.phone.ilike(f"%{search}%")))
    return query.all()

@router.post("", response_model=CustomerResponse)
def create_customer(req: CustomerCreate, db: Session = Depends(get_db)):
    existing = db.query(Customer).filter(Customer.phone == req.phone).first()
    if existing:
        return existing
    
    customer = Customer(
        name=req.name,
        phone=req.phone,
        email=req.email,
        address=req.address
    )
    db.add(customer)
    db.commit()
    db.refresh(customer)
    return customer

@router.get("/{customer_id}", response_model=CustomerResponse)
def get_customer(customer_id: int, db: Session = Depends(get_db)):
    customer = db.query(Customer).filter(Customer.id == customer_id).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    return customer
