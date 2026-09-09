import requests
from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import (
    Bill, BillItem, Payment, ProductVariant, Product, Customer,
    User, ShopSettings, Printer, PrintJob, PrintJobStatus, BillStatus
)
from ..schemas import BillCreate, BillResponse, PaymentCreate
from ..auth import get_current_user

router = APIRouter(prefix="/api/bills", tags=["bills"])

PRINT_AGENT_URL = "http://127.0.0.1:9100/print"

def generate_invoice_number(db: Session) -> str:
    settings = db.query(ShopSettings).first()
    prefix = settings.invoice_prefix if settings else "SWZ-2026-"
    count = db.query(Bill).count() + 1
    return f"{prefix}{count:05d}"

def send_to_print_agent(bill: Bill, db: Session) -> dict:
    settings = db.query(ShopSettings).first()
    printer = db.query(Printer).filter(Printer.is_default == True).first()
    if not printer:
        printer = db.query(Printer).first()

    # Build print job row
    print_job = PrintJob(
        bill_id=bill.id,
        printer_id=printer.id if printer else None,
        status=PrintJobStatus.PENDING.value
    )
    db.add(print_job)
    db.commit()
    db.refresh(print_job)

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
        "total": bill.total_amount,
        "payments": payments_payload,
        "footer": settings.receipt_footer if settings else "Thank you for shopping at Swagz!",
        "paper_width_mm": printer.paper_width_mm if printer else 80,
        "connection_type": printer.connection_type if printer else "usb",
        "device_path": printer.device_path if printer else None,
        "ip_address": printer.ip_address if printer else None,
        "port": printer.port if printer else 9100
    }

    try:
        res = requests.post(PRINT_AGENT_URL, json=payload, timeout=3)
        if res.status_code == 200 and res.json().get("status") == "success":
            print_job.status = PrintJobStatus.SUCCESS.value
            print_job.last_error = None
            db.commit()
            return {"print_status": "success", "detail": "Printed automatically via Print Agent (port 9100)"}
        else:
            err = res.json().get("error", f"Print Agent HTTP {res.status_code}")
            print_job.status = PrintJobStatus.FAILED.value
            print_job.last_error = err
            db.commit()
            return {"print_status": "failed", "detail": err}
    except Exception as e:
        print_job.status = PrintJobStatus.FAILED.value
        print_job.last_error = str(e)
        db.commit()
        return {"print_status": "failed", "detail": f"Print Agent offline or unreachable: {str(e)}"}

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

    invoice_no = generate_invoice_number(db)

    # Compute calculations
    subtotal = 0.0
    total_tax = 0.0

    bill_items_to_create = []
    for item in req.items:
        variant = db.query(ProductVariant).filter(ProductVariant.id == item.variant_id).first()
        if not variant:
            raise HTTPException(status_code=404, detail=f"Variant ID {item.variant_id} not found")
        
        if req.status == BillStatus.CONFIRMED.value and variant.stock_qty < item.qty:
            product = db.query(Product).filter(Product.id == variant.product_id).first()
            raise HTTPException(
                status_code=400, 
                detail=f"Insufficient stock for {product.name if product else 'Item'} ({variant.size}/{variant.color}). Available: {variant.stock_qty}, Requested: {item.qty}"
            )

        line_subtotal = item.unit_price * item.qty
        line_disc = item.discount
        after_disc = max(0.0, line_subtotal - line_disc)
        
        # Calculate GST/Tax based on product
        product = db.query(Product).filter(Product.id == variant.product_id).first()
        tax_pct = product.tax_percent if product else 5.0
        line_tax = round(after_disc * (tax_pct / 100.0), 2)
        line_total = round(after_disc + line_tax, 2)

        subtotal += line_subtotal
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

    total_amount = round(max(0.0, subtotal - req.discount_amount + total_tax), 2)

    bill = Bill(
        invoice_number=invoice_no,
        customer_id=req.customer_id,
        cashier_id=current_user.id,
        subtotal=round(subtotal, 2),
        discount_amount=round(req.discount_amount, 2),
        tax_amount=round(total_tax, 2),
        total_amount=total_amount,
        status=req.status,
        notes=req.notes
    )
    db.add(bill)
    db.commit()
    db.refresh(bill)

    # Save Items
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

        # Decrement stock if confirmed
        if req.status == BillStatus.CONFIRMED.value:
            bi["variant_obj"].stock_qty = max(0, bi["variant_obj"].stock_qty - bi["qty"])

    # Save Payments
    for p in req.payments:
        pm = Payment(
            bill_id=bill.id,
            mode=p.mode.lower(),
            amount=p.amount,
            reference_no=p.reference_no
        )
        db.add(pm)

    # Award Loyalty Points (1 point for every ₹100 spent)
    if req.status == BillStatus.CONFIRMED.value and req.customer_id:
        cust = db.query(Customer).filter(Customer.id == req.customer_id).first()
        if cust:
            earned_points = int(total_amount // 100)
            cust.loyalty_points += earned_points

    db.commit()
    db.refresh(bill)

    # Auto-Print trigger if confirmed
    print_result = {"print_status": "skipped", "detail": "Bill saved as draft/parked"}
    if req.status == BillStatus.CONFIRMED.value:
        print_result = send_to_print_agent(bill, db)

    return {
        "bill": BillResponse.from_orm(bill),
        "print_info": print_result
    }

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

    # Stock validation
    for item in bill.items:
        variant = db.query(ProductVariant).filter(ProductVariant.id == item.variant_id).first()
        if variant and variant.stock_qty < item.qty:
            raise HTTPException(status_code=400, detail=f"Insufficient stock for variant ID {variant.id}")
        if variant:
            variant.stock_qty = max(0, variant.stock_qty - item.qty)

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
    db.commit()
    db.refresh(bill)

    print_result = send_to_print_agent(bill, db)
    return {
        "bill": BillResponse.from_orm(bill),
        "print_info": print_result
    }

@router.post("/{bill_id}/reprint")
def reprint_bill(bill_id: int, db: Session = Depends(get_db)):
    bill = db.query(Bill).filter(Bill.id == bill_id).first()
    if not bill:
        raise HTTPException(status_code=404, detail="Bill not found")
    print_result = send_to_print_agent(bill, db)
    return {"message": "Reprint job initiated", "print_info": print_result}
