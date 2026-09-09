from datetime import datetime, timedelta
from typing import List, Optional
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func, cast, Date
from ..database import get_db
from ..models import Bill, BillItem, ProductVariant, Product, Payment, Customer, User, BillStatus
from ..auth import get_current_user

router = APIRouter(prefix="/api/reports", tags=["reports"])

@router.get("/kpis")
def get_kpis(db: Session = Depends(get_db)):
    now = datetime.utcnow()
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    week_start = today_start - timedelta(days=now.weekday()) # Start of current week (Monday)
    month_start = today_start.replace(day=1) # Start of current month

    # Confirmed bills
    confirmed_bills = db.query(Bill).filter(Bill.status == BillStatus.CONFIRMED.value).all()

    today_sales = sum(b.total_amount for b in confirmed_bills if b.created_at >= today_start)
    week_sales = sum(b.total_amount for b in confirmed_bills if b.created_at >= week_start)
    month_sales = sum(b.total_amount for b in confirmed_bills if b.created_at >= month_start)
    total_sales = sum(b.total_amount for b in confirmed_bills)

    today_count = sum(1 for b in confirmed_bills if b.created_at >= today_start)
    total_count = len(confirmed_bills)
    aov = (total_sales / total_count) if total_count > 0 else 0.0

    low_stock_count = db.query(ProductVariant).filter(ProductVariant.stock_qty <= 5).count()
    active_products = db.query(Product).filter(Product.is_active == True).count()

    return {
        "today_sales": round(today_sales, 2),
        "today_count": today_count,
        "week_sales": round(week_sales, 2),
        "month_sales": round(month_sales, 2),
        "total_sales": round(total_sales, 2),
        "total_count": total_count,
        "aov": round(aov, 2),
        "low_stock_count": low_stock_count,
        "active_products": active_products
    }

@router.get("/daily-trend")
def daily_revenue_trend(days: int = 14, db: Session = Depends(get_db)):
    start_date = datetime.utcnow().date() - timedelta(days=days - 1)
    
    # Generate last N days list
    daily_data = { (start_date + timedelta(days=i)).strftime("%Y-%m-%d"): {"date": (start_date + timedelta(days=i)).strftime("%b %d"), "revenue": 0.0, "count": 0} for i in range(days) }

    bills = db.query(Bill).filter(
        Bill.status == BillStatus.CONFIRMED.value,
        Bill.created_at >= datetime.combine(start_date, datetime.min.time())
    ).all()

    for b in bills:
        day_str = b.created_at.strftime("%Y-%m-%d")
        if day_str in daily_data:
            daily_data[day_str]["revenue"] += b.total_amount
            daily_data[day_str]["count"] += 1

    return list(daily_data.values())

@router.get("/monthly-trend")
def monthly_revenue_trend(months: int = 6, db: Session = Depends(get_db)):
    # Aggregated monthly sales
    bills = db.query(Bill).filter(Bill.status == BillStatus.CONFIRMED.value).all()
    monthly_map = {}

    for b in bills:
        month_key = b.created_at.strftime("%b %Y")
        if month_key not in monthly_map:
            monthly_map[month_key] = {"month": month_key, "revenue": 0.0, "count": 0}
        monthly_map[month_key]["revenue"] += b.total_amount
        monthly_map[month_key]["count"] += 1

    return list(monthly_map.values())

@router.get("/sales-by-category")
def sales_by_category(db: Session = Depends(get_db)):
    results = db.query(
        Product.category,
        func.sum(BillItem.qty).label("total_qty"),
        func.sum(BillItem.line_total).label("total_revenue")
    ).join(ProductVariant, Product.id == ProductVariant.product_id)\
     .join(BillItem, ProductVariant.id == BillItem.variant_id)\
     .join(Bill, BillItem.bill_id == Bill.id)\
     .filter(Bill.status == BillStatus.CONFIRMED.value)\
     .group_by(Product.category).all()

    return [{"category": r[0], "qty": r[1], "revenue": round(r[2], 2)} for r in results]

@router.get("/sales-by-brand")
def sales_by_brand(db: Session = Depends(get_db)):
    results = db.query(
        Product.brand,
        func.sum(BillItem.qty).label("total_qty"),
        func.sum(BillItem.line_total).label("total_revenue")
    ).join(ProductVariant, Product.id == ProductVariant.product_id)\
     .join(BillItem, ProductVariant.id == BillItem.variant_id)\
     .join(Bill, BillItem.bill_id == Bill.id)\
     .filter(Bill.status == BillStatus.CONFIRMED.value)\
     .group_by(Product.brand).all()

    return [{"brand": r[0], "qty": r[1], "revenue": round(r[2], 2)} for r in results]

@router.get("/sales-by-size")
def sales_by_size(db: Session = Depends(get_db)):
    results = db.query(
        ProductVariant.size,
        func.sum(BillItem.qty).label("total_qty")
    ).join(BillItem, ProductVariant.id == BillItem.variant_id)\
     .join(Bill, BillItem.bill_id == Bill.id)\
     .filter(Bill.status == BillStatus.CONFIRMED.value)\
     .group_by(ProductVariant.size).all()

    return [{"size": r[0], "qty": r[1]} for r in results]

@router.get("/payment-modes")
def payment_modes_breakdown(db: Session = Depends(get_db)):
    results = db.query(
        Payment.mode,
        func.sum(Payment.amount).label("total_amount")
    ).join(Bill, Payment.bill_id == Bill.id)\
     .filter(Bill.status == BillStatus.CONFIRMED.value)\
     .group_by(Payment.mode).all()

    return [{"mode": r[0].upper(), "amount": round(r[1], 2)} for r in results]

@router.get("/cashier-performance")
def cashier_performance(db: Session = Depends(get_db)):
    results = db.query(
        User.name,
        func.count(Bill.id).label("total_bills"),
        func.sum(Bill.total_amount).label("total_revenue")
    ).join(Bill, User.id == Bill.cashier_id)\
     .filter(Bill.status == BillStatus.CONFIRMED.value)\
     .group_by(User.name).all()

    return [{"cashier": r[0], "bills": r[1], "revenue": round(r[2], 2)} for r in results]

@router.get("/low-stock")
def low_stock_report(threshold: int = 5, db: Session = Depends(get_db)):
    variants = db.query(ProductVariant).filter(ProductVariant.stock_qty <= threshold).all()
    output = []
    for v in variants:
        p = db.query(Product).filter(Product.id == v.product_id).first()
        output.append({
            "variant_id": v.id,
            "product_name": p.name if p else "Unknown",
            "brand": p.brand if p else "",
            "category": p.category if p else "",
            "size": v.size,
            "color": v.color,
            "sku_barcode": v.sku_barcode,
            "stock_qty": v.stock_qty
        })
    return output
