import json
import os
from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import text
from ..database import get_db
from ..models import (
    Bill, BillItem, Payment, ProductVariant, Product, Customer,
    User, ShopSettings, Printer, PrintJob, PrintJobStatus, BillStatus,
    ReceiptType, AuditLog, InvoiceSequence
)
from ..schemas import BillCreate, BillResponse, PaymentCreate
from ..auth import get_current_user

router = APIRouter(prefix="/api/bills", tags=["bills"])

def generate_invoice_number(db: Session) -> str:
    """
    Transaction-safe invoice sequencing with gapless numbering for committed invoices.
    Uses row-level locking (with_for_update()) inside the active invoice creation transaction.
    Cancelled or voided bills retain their assigned invoice number with status='void'
    and are never deleted or re-used, guaranteeing complete GST compliance.
    """
    settings = db.query(ShopSettings).first()
    prefix = settings.invoice_prefix if settings else "SWZ-2026-"

    # Use atomic Sequence table with row lock
    seq = db.query(InvoiceSequence).filter(InvoiceSequence.prefix == prefix).with_for_update().first()
    if not seq:
        seq = InvoiceSequence(prefix=prefix, current_val=0)
        db.add(seq)
        db.flush()

    seq.current_val += 1
    return f"{prefix}{seq.current_val:05d}"

def queue_print_job(bill: Bill, db: Session) -> PrintJob:
    settings = db.query(ShopSettings).first()
    printer = db.query(Printer).filter(Printer.is_default == True, Printer.is_active == True).first()
    if not printer:
        printer = db.query(Printer).filter(Printer.is_active == True).first()

    items_payload = []
    for item in bill.items:
        variant = db.query(ProductVariant).filter(ProductVariant.id == item.variant_id).first()
        product = db.query(Product).filter(Product.id == variant.product_id).first() if variant else None
        item_name = f"{product.name if product else 'Item'}"
        items_payload.append({
            "name": item_name,
            "size": variant.size if variant else "",
            "color": variant.color if variant else "",
            "qty": item.qty,
            "unit_price": item.unit_price,
            "line_total": item.line_total
        })

    payments_payload = [{"mode": p.mode.upper(), "amount": p.amount, "ref": p.reference_no} for p in bill.payments]

    payload = {
        "bill_id": bill.id,
        "shop_name": settings.shop_name if settings else "SWAGZ FASHION",
        "shop_address": settings.address if settings else "",
        "shop_phone": settings.phone if settings else "",
        "gstin": settings.gstin if settings else "",
        "invoice_number": bill.invoice_number,
        "date": bill.created_at.strftime("%Y-%m-%d %H:%M:%S"),
        "customer_name": bill.customer.name if bill.customer else "Walk-in Customer",
        "customer_phone": bill.customer.phone if bill.customer else "",
        "items": items_payload,
        "subtotal": bill.subtotal,
        "discount": bill.discount_amount,
        "tax": bill.tax_amount,
        "cgst": bill.cgst_amount,
        "sgst": bill.sgst_amount,
        "total": bill.total_amount,
        "payments": payments_payload,
        "footer": settings.receipt_footer if settings else "Thank you for shopping at Swagz!",
        "paper_width_mm": printer.paper_width_mm if printer else 80,
        "connection_type": printer.connection_type if printer else "usb",
        "device_path": printer.device_path if printer else None,
        "ip_address": printer.ip_address if printer else None,
        "port": printer.port if printer else 9100
    }

    print_job = PrintJob(
        bill_id=bill.id,
        printer_id=printer.id if printer else None,
        receipt_type=ReceiptType.BILL.value,
        status=PrintJobStatus.QUEUED.value,
        payload_json=json.dumps(payload),
        attempt_count=0
    )

    print_status = "queued"
    detail = "Print job added to PostgreSQL queue"
    try:
        import requests
        res = requests.post("http://127.0.0.1:9101/print", json=payload, timeout=2.5)
        if res.status_code == 200:
            print_status = "success"
            detail = "Thermal receipt auto-printed successfully via Print Agent"
            print_job.status = PrintJobStatus.PRINTED.value
            print_job.printed_at = datetime.utcnow()
    except Exception as e:
        detail = f"Print Agent dispatch offline, job queued in database"

    db.add(print_job)
    return print_job, {"print_status": print_status, "print_job_id": print_job.id, "detail": detail}

@router.get("", response_model=List[BillResponse])
def list_bills(
    status: Optional[str] = None,
    customer_id: Optional[int] = None,
    invoice_number: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(Bill).order_by(Bill.created_at.desc())
    if invoice_number:
        query = query.filter(Bill.invoice_number == invoice_number)
    if status:
        query = query.filter(Bill.status == status)
    if customer_id:
        query = query.filter(Bill.customer_id == customer_id)
    return query.all()

@router.get("/parked", response_model=List[BillResponse])
def list_parked_bills(db: Session = Depends(get_db)):
    return db.query(Bill).filter(Bill.status == BillStatus.PARKED.value).order_by(Bill.created_at.desc()).all()

@router.get("/{bill_id}", response_model=BillResponse)
def get_bill(bill_id: int, db: Session = Depends(get_db)):
    bill = db.query(Bill).filter(Bill.id == bill_id).first()
    if not bill:
        raise HTTPException(status_code=404, detail="Bill not found")
    return bill

@router.post("", response_model=dict)
def create_bill(
    req: BillCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if not req.items:
        raise HTTPException(status_code=400, detail="Cart cannot be empty")

    try:
        invoice_no = generate_invoice_number(db)

        # Compute calculations
        subtotal = 0.0
        total_item_disc = 0.0
        total_tax = 0.0

        bill_items_to_create = []
        for item in req.items:
            variant = db.query(ProductVariant).filter(ProductVariant.id == item.variant_id).first()
            if not variant:
                raise HTTPException(status_code=404, detail=f"Variant ID {item.variant_id} not found")

            # Check stock
            if req.status == BillStatus.CONFIRMED.value and variant.stock_qty < item.qty:
                product = db.query(Product).filter(Product.id == variant.product_id).first()
                raise HTTPException(
                    status_code=400, 
                    detail=f"Insufficient stock for {product.name if product else 'Item'} ({variant.size}/{variant.color}). Available: {variant.stock_qty}, Requested: {item.qty}"
                )

            line_subtotal = item.unit_price * item.qty
            line_disc = item.discount
            after_disc = max(0.0, line_subtotal - line_disc)
            
            product = db.query(Product).filter(Product.id == variant.product_id).first()
            tax_pct = product.tax_percent if product else 5.0
            line_tax = round(after_disc * (tax_pct / 100.0), 2)
            line_total = round(after_disc + line_tax, 2)

            subtotal += line_subtotal
            total_item_disc += line_disc
            total_tax += line_tax

            bill_items_to_create.append({
                "variant_id": variant.id,
                "qty": item.qty,
                "unit_price": item.unit_price,
                "discount": line_disc,
                "tax": line_tax,
                "line_total": line_total,
                "variant_obj": variant
            })

        overall_discount = round(total_item_disc + req.discount_amount, 2)
        if overall_discount > round(subtotal, 2) + 0.01:
            raise HTTPException(
                status_code=400,
                detail=f"Total discount (₹{overall_discount:.2f}) cannot exceed subtotal (₹{subtotal:.2f})"
            )
        total_amount = round(max(0.0, subtotal - overall_discount + total_tax), 2)
        cgst = round(total_tax / 2.0, 2)
        sgst = round(total_tax / 2.0, 2)

        # Validate payments for confirmed bill
        if req.status == BillStatus.CONFIRMED.value:
            total_paid = sum(p.amount for p in req.payments)
            if total_paid < total_amount - 0.01:
                raise HTTPException(
                    status_code=400,
                    detail=f"Insufficient payment. Total payable: ₹{total_amount:.2f}, Total paid: ₹{total_paid:.2f}"
                )

        bill = Bill(
            invoice_number=invoice_no,
            customer_id=req.customer_id,
            cashier_id=current_user.id,
            subtotal=round(subtotal, 2),
            discount_amount=overall_discount,
            tax_amount=round(total_tax, 2),
            cgst_amount=cgst,
            sgst_amount=sgst,
            total_amount=total_amount,
            status=req.status,
            notes=req.notes
        )
        db.add(bill)
        db.flush()

        # Save Items & Atomic Stock Deduction
        for bi in bill_items_to_create:
            bill_item = BillItem(
                bill_id=bill.id,
                variant_id=bi["variant_id"],
                qty=bi["qty"],
                unit_price=bi["unit_price"],
                discount=bi["discount"],
                tax=bi["tax"],
                line_total=bi["line_total"]
            )
            db.add(bill_item)

            # Atomic stock deduction in database
            if req.status == BillStatus.CONFIRMED.value:
                variant_id = bi["variant_id"]
                qty_deduct = bi["qty"]
                
                res = db.execute(
                    text("UPDATE product_variants SET stock_qty = stock_qty - :qty WHERE id = :id AND stock_qty >= :qty"),
                    {"id": variant_id, "qty": qty_deduct}
                )
                if res.rowcount == 0:
                    db.rollback()
                    raise HTTPException(
                        status_code=400,
                        detail=f"Stock condition race failure for variant ID {variant_id}. Insufficient stock."
                    )

        # Save Payments
        for p in req.payments:
            pm = Payment(
                bill_id=bill.id,
                mode=p.mode.lower(),
                amount=p.amount,
                reference_no=p.reference_no
            )
            db.add(pm)

        # Award Loyalty Points (1 point per ₹100)
        if req.status == BillStatus.CONFIRMED.value and req.customer_id:
            cust = db.query(Customer).filter(Customer.id == req.customer_id).first()
            if cust:
                earned_points = int(total_amount // 100)
                cust.loyalty_points += earned_points

        # Queue Thermal Print Job
        print_info = {"print_status": "none", "print_job_id": None, "detail": "Parked bill - no print job"}
        if req.status == BillStatus.CONFIRMED.value:
            p_job, print_info = queue_print_job(bill, db)
            db.flush()

        # Audit Log Entry
        audit = AuditLog(
            user_id=current_user.id,
            action="BILL_CREATED",
            entity_type="Bill",
            entity_id=bill.id,
            details=f"Created Invoice {invoice_no} Total ₹{total_amount:.2f} Status: {req.status}"
        )
        db.add(audit)

        db.commit()
        db.refresh(bill)

        return {
            "bill": BillResponse.from_orm(bill),
            "print_info": print_info
        }
    except Exception as e:
        db.rollback()
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail=f"Billing transaction failed: {str(e)}")

@router.post("/{bill_id}/confirm", response_model=dict)
def confirm_parked_bill(
    bill_id: int,
    payments: List[PaymentCreate],
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    bill = db.query(Bill).filter(Bill.id == bill_id).first()
    if not bill:
        raise HTTPException(status_code=404, detail="Bill not found")

    if bill.status == BillStatus.CONFIRMED.value:
        raise HTTPException(status_code=400, detail="Bill is already confirmed")

    # Payment validation
    total_paid = sum(p.amount for p in payments)
    if total_paid < bill.total_amount - 0.01:
        raise HTTPException(
            status_code=400,
            detail=f"Insufficient payment. Total payable: ₹{bill.total_amount:.2f}, Total paid: ₹{total_paid:.2f}"
        )

    try:
        # Atomic Stock Deduction
        for item in bill.items:
            res = db.execute(
                text("UPDATE product_variants SET stock_qty = stock_qty - :qty WHERE id = :id AND stock_qty >= :qty"),
                {"id": item.variant_id, "qty": item.qty}
            )
            if res.rowcount == 0:
                db.rollback()
                raise HTTPException(status_code=400, detail=f"Insufficient stock to confirm bill item ID {item.id}")

        # Save Payments
        bill.payments.clear()
        for p in payments:
            pm = Payment(
                bill_id=bill.id,
                mode=p.mode.lower(),
                amount=p.amount,
                reference_no=p.reference_no
            )
            db.add(pm)

        bill.status = BillStatus.CONFIRMED.value
        p_job, print_info = queue_print_job(bill, db)
        db.flush()

        audit = AuditLog(
            user_id=current_user.id,
            action="BILL_CONFIRMED",
            entity_type="Bill",
            entity_id=bill.id,
            details=f"Confirmed parked invoice {bill.invoice_number}"
        )
        db.add(audit)

        db.commit()
        db.refresh(bill)

        return {
            "bill": BillResponse.from_orm(bill),
            "print_info": print_info
        }
    except Exception as e:
        db.rollback()
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail=f"Failed to confirm bill: {str(e)}")

@router.post("/{bill_id}/reprint")
def reprint_bill(bill_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    bill = db.query(Bill).filter(Bill.id == bill_id).first()
    if not bill:
        raise HTTPException(status_code=404, detail="Bill not found")

    p_job = queue_print_job(bill, db)

    audit = AuditLog(
        user_id=current_user.id,
        action="BILL_REPRINT_REQUESTED",
        entity_type="Bill",
        entity_id=bill.id,
        details=f"Reprint requested for Invoice {bill.invoice_number}"
    )
    db.add(audit)

    db.commit()
    return {"message": "Reprint job queued", "print_job_id": p_job.id}
