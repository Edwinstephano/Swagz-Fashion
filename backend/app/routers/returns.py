from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import Bill, ProductVariant, Return, ReturnItem, User
from ..schemas import ReturnCreate
from ..auth import get_current_user

router = APIRouter(prefix="/api/returns", tags=["returns"])

@router.post("", response_model=dict)
def process_return(
    req: ReturnCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    original_bill = db.query(Bill).filter(Bill.id == req.original_bill_id).first()
    if not original_bill:
        raise HTTPException(status_code=404, detail="Original bill not found")

    return_record = Return(
        original_bill_id=req.original_bill_id,
        reason=req.reason
    )
    db.add(return_record)
    db.commit()
    db.refresh(return_record)

    total_refund = 0.0
    for item in req.return_items:
        ret_item = ReturnItem(
            return_id=return_record.id,
            variant_id=item.variant_id,
            qty=item.qty,
            refund_amount=item.refund_amount
        )
        db.add(ret_item)
        total_refund += item.refund_amount

        # Restock returned variant
        variant = db.query(ProductVariant).filter(ProductVariant.id == item.variant_id).first()
        if variant:
            variant.stock_qty += item.qty

    db.commit()
    return {
        "return_id": return_record.id,
        "original_invoice": original_bill.invoice_number,
        "total_refund": total_refund,
        "message": "Return processed and items restocked successfully"
    }
