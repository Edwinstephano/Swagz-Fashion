from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import Shift, ShiftStatus, User, Bill, Payment, Return, ReturnItem, AuditLog
from ..schemas import ShiftOpenRequest, ShiftCloseRequest, ShiftResponse
from ..auth import get_current_user

router = APIRouter(prefix="/api/shifts", tags=["shifts"])

@router.get("/current", response_model=Optional[ShiftResponse])
def get_current_shift(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    shift = db.query(Shift).filter(
        Shift.cashier_id == current_user.id,
        Shift.status == ShiftStatus.OPEN.value
    ).order_by(Shift.opened_at.desc()).first()

    if not shift:
        return None

    # Calculate live sales tally for this shift
    bills = db.query(Bill).filter(
        Bill.cashier_id == current_user.id,
        Bill.created_at >= shift.opened_at,
        Bill.status == "confirmed"
    ).all()

    bill_ids = [b.id for b in bills]

    cash_sales = 0.0
    card_sales = 0.0
    upi_sales = 0.0

    if bill_ids:
        payments = db.query(Payment).filter(Payment.bill_id.in_(bill_ids)).all()
        for p in payments:
            if p.mode.lower() == "cash":
                cash_sales += p.amount
            elif p.mode.lower() == "card":
                card_sales += p.amount
            elif p.mode.lower() in ["upi", "wallet"]:
                upi_sales += p.amount

    # Returns sum
    returns_sum = 0.0
    returns = db.query(Return).filter(Return.created_at >= shift.opened_at).all()
    for r in returns:
        for item in r.items:
            returns_sum += item.refund_amount

    shift.cash_sales = round(cash_sales, 2)
    shift.card_sales = round(card_sales, 2)
    shift.upi_sales = round(upi_sales, 2)
    shift.returns_amount = round(returns_sum, 2)
    shift.expected_cash = round(shift.opening_cash + cash_sales - returns_sum, 2)

    db.commit()
    db.refresh(shift)
    return shift

@router.post("/open", response_model=ShiftResponse)
def open_shift(
    req: ShiftOpenRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Check if cashier already has an open shift
    existing = db.query(Shift).filter(
        Shift.cashier_id == current_user.id,
        Shift.status == ShiftStatus.OPEN.value
    ).first()

    if existing:
        raise HTTPException(status_code=400, detail="Cashier already has an active open shift")

    shift = Shift(
        cashier_id=current_user.id,
        opening_cash=round(req.opening_cash, 2),
        expected_cash=round(req.opening_cash, 2),
        status=ShiftStatus.OPEN.value,
        opened_at=datetime.utcnow()
    )
    db.add(shift)

    audit = AuditLog(
        user_id=current_user.id,
        action="SHIFT_OPENED",
        entity_type="Shift",
        details=f"Opened shift with initial cash float ₹{req.opening_cash:.2f}"
    )
    db.add(audit)

    db.commit()
    db.refresh(shift)
    return shift

@router.post("/close", response_model=ShiftResponse)
def close_shift(
    req: ShiftCloseRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    shift = db.query(Shift).filter(
        Shift.cashier_id == current_user.id,
        Shift.status == ShiftStatus.OPEN.value
    ).first()

    if not shift:
        raise HTTPException(status_code=404, detail="No active open shift found to close")

    # Final tally recalculation
    bills = db.query(Bill).filter(
        Bill.cashier_id == current_user.id,
        Bill.created_at >= shift.opened_at,
        Bill.status == "confirmed"
    ).all()

    bill_ids = [b.id for b in bills]
    cash_sales = 0.0
    card_sales = 0.0
    upi_sales = 0.0

    if bill_ids:
        payments = db.query(Payment).filter(Payment.bill_id.in_(bill_ids)).all()
        for p in payments:
            if p.mode.lower() == "cash":
                cash_sales += p.amount
            elif p.mode.lower() == "card":
                card_sales += p.amount
            elif p.mode.lower() in ["upi", "wallet"]:
                upi_sales += p.amount

    returns_sum = 0.0
    returns = db.query(Return).filter(Return.created_at >= shift.opened_at).all()
    for r in returns:
        for item in r.items:
            returns_sum += item.refund_amount

    expected = round(shift.opening_cash + cash_sales - returns_sum, 2)
    actual = round(req.actual_cash, 2)
    discrepancy = round(actual - expected, 2)

    shift.cash_sales = round(cash_sales, 2)
    shift.card_sales = round(card_sales, 2)
    shift.upi_sales = round(upi_sales, 2)
    shift.returns_amount = round(returns_sum, 2)
    shift.expected_cash = expected
    shift.actual_cash = actual
    shift.discrepancy = discrepancy
    shift.notes = req.notes
    shift.status = ShiftStatus.CLOSED.value
    shift.closed_at = datetime.utcnow()

    audit = AuditLog(
        user_id=current_user.id,
        action="SHIFT_CLOSED",
        entity_type="Shift",
        entity_id=shift.id,
        details=f"Closed shift. Expected: ₹{expected:.2f}, Actual: ₹{actual:.2f}, Discrepancy: ₹{discrepancy:.2f}"
    )
    db.add(audit)

    db.commit()
    db.refresh(shift)
    return shift
