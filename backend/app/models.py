from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, ForeignKey, Text, Enum
from sqlalchemy.orm import relationship
import enum
from .database import Base

class UserRole(str, enum.Enum):
    ADMIN = "admin"
    MANAGER = "manager"
    CASHIER = "cashier"

class BillStatus(str, enum.Enum):
    DRAFT = "draft"
    PARKED = "parked"
    CONFIRMED = "confirmed"
    VOID = "void"

class PrintJobStatus(str, enum.Enum):
    PENDING = "pending"
    SUCCESS = "success"
    FAILED = "failed"

class AlterationStatus(str, enum.Enum):
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    READY = "ready"
    DELIVERED = "delivered"

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    username = Column(String(50), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    role = Column(String(20), default=UserRole.CASHIER.value, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    bills = relationship("Bill", back_populates="cashier")

class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), nullable=False, index=True)
    brand = Column(String(100), nullable=False, index=True)
    category = Column(String(100), nullable=False, index=True) # Shirts, T-Shirts, Trousers, Suits, Ethnic, Accessories
    description = Column(Text, nullable=True)
    base_price = Column(Float, nullable=False, default=0.0)
    cost_price = Column(Float, nullable=False, default=0.0)
    tax_percent = Column(Float, nullable=False, default=5.0)
    image_url = Column(String(500), nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    variants = relationship("ProductVariant", back_populates="product", cascade="all, delete-orphan")

class ProductVariant(Base):
    __tablename__ = "product_variants"

    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    size = Column(String(20), nullable=False) # S, M, L, XL, XXL, 28, 30, 32, 34, 36, 38
    color = Column(String(50), nullable=False) # Black, Navy, White, Olive, Maroon, etc.
    sku_barcode = Column(String(100), unique=True, index=True, nullable=False)
    price_override = Column(Float, nullable=True) # Optional variant-specific price
    stock_qty = Column(Integer, default=0, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    product = relationship("Product", back_populates="variants")
    bill_items = relationship("BillItem", back_populates="variant")

class Customer(Base):
    __tablename__ = "customers"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    phone = Column(String(20), unique=True, index=True, nullable=False)
    email = Column(String(100), nullable=True)
    address = Column(Text, nullable=True)
    loyalty_points = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)

    bills = relationship("Bill", back_populates="customer")

class Bill(Base):
    __tablename__ = "bills"

    id = Column(Integer, primary_key=True, index=True)
    invoice_number = Column(String(100), unique=True, index=True, nullable=False)
    customer_id = Column(Integer, ForeignKey("customers.id"), nullable=True)
    cashier_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    subtotal = Column(Float, default=0.0)
    discount_amount = Column(Float, default=0.0)
    tax_amount = Column(Float, default=0.0)
    total_amount = Column(Float, default=0.0)
    status = Column(String(20), default=BillStatus.CONFIRMED.value) # draft, parked, confirmed, void
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    customer = relationship("Customer", back_populates="bills")
    cashier = relationship("User", back_populates="bills")
    items = relationship("BillItem", back_populates="bill", cascade="all, delete-orphan")
    payments = relationship("Payment", back_populates="bill", cascade="all, delete-orphan")
    alterations = relationship("Alteration", back_populates="bill", cascade="all, delete-orphan")
    print_jobs = relationship("PrintJob", back_populates="bill", cascade="all, delete-orphan")

class BillItem(Base):
    __tablename__ = "bill_items"

    id = Column(Integer, primary_key=True, index=True)
    bill_id = Column(Integer, ForeignKey("bills.id"), nullable=False)
    variant_id = Column(Integer, ForeignKey("product_variants.id"), nullable=False)
    qty = Column(Integer, nullable=False, default=1)
    unit_price = Column(Float, nullable=False)
    discount = Column(Float, default=0.0)
    tax = Column(Float, default=0.0)
    line_total = Column(Float, nullable=False)

    bill = relationship("Bill", back_populates="items")
    variant = relationship("ProductVariant", back_populates="bill_items")

class Payment(Base):
    __tablename__ = "payments"

    id = Column(Integer, primary_key=True, index=True)
    bill_id = Column(Integer, ForeignKey("bills.id"), nullable=False)
    mode = Column(String(20), nullable=False) # cash, upi, card, wallet
    amount = Column(Float, nullable=False)
    reference_no = Column(String(100), nullable=True) # UTR or Card Auth code
    created_at = Column(DateTime, default=datetime.utcnow)

    bill = relationship("Bill", back_populates="payments")

class Return(Base):
    __tablename__ = "returns"

    id = Column(Integer, primary_key=True, index=True)
    original_bill_id = Column(Integer, ForeignKey("bills.id"), nullable=False)
    new_bill_id = Column(Integer, ForeignKey("bills.id"), nullable=True)
    reason = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    items = relationship("ReturnItem", back_populates="return_record", cascade="all, delete-orphan")

class ReturnItem(Base):
    __tablename__ = "return_items"

    id = Column(Integer, primary_key=True, index=True)
    return_id = Column(Integer, ForeignKey("returns.id"), nullable=False)
    variant_id = Column(Integer, ForeignKey("product_variants.id"), nullable=False)
    qty = Column(Integer, nullable=False, default=1)
    refund_amount = Column(Float, nullable=False)

    return_record = relationship("Return", back_populates="items")

class StockAdjustment(Base):
    __tablename__ = "stock_adjustments"

    id = Column(Integer, primary_key=True, index=True)
    variant_id = Column(Integer, ForeignKey("product_variants.id"), nullable=False)
    change_qty = Column(Integer, nullable=False)
    reason = Column(String(255), nullable=False) # Damage, Theft, Purchase, Audit Correction
    adjusted_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

class Printer(Base):
    __tablename__ = "printers"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    connection_type = Column(String(20), default="usb") # usb, lan
    ip_address = Column(String(50), nullable=True)
    port = Column(Integer, default=9100)
    device_path = Column(String(200), nullable=True) # e.g. /dev/usb/lp0 or COM3
    paper_width_mm = Column(Integer, default=80) # 58 or 80
    is_default = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

class PrintJob(Base):
    __tablename__ = "print_jobs"

    id = Column(Integer, primary_key=True, index=True)
    bill_id = Column(Integer, ForeignKey("bills.id"), nullable=False)
    printer_id = Column(Integer, ForeignKey("printers.id"), nullable=True)
    status = Column(String(20), default=PrintJobStatus.PENDING.value)
    attempts = Column(Integer, default=0)
    last_error = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    bill = relationship("Bill", back_populates="print_jobs")

class ShopSettings(Base):
    __tablename__ = "shop_settings"

    id = Column(Integer, primary_key=True)
    shop_name = Column(String(200), default="SWAGZ FASHION")
    address = Column(Text, default="123 Fashion Street, Style Avenue, City")
    phone = Column(String(50), default="+91 98765 43210")
    gstin = Column(String(50), default="33AAAAA0000A1Z5")
    logo_url = Column(String(500), nullable=True)
    invoice_prefix = Column(String(20), default="SWZ-2026-")
    tax_default = Column(Float, default=5.0)
    receipt_footer = Column(Text, default="Thank you for shopping at Swagz! Goods once sold can be exchanged within 7 days with original tag & receipt.")

class Alteration(Base):
    __tablename__ = "alterations"

    id = Column(Integer, primary_key=True, index=True)
    bill_id = Column(Integer, ForeignKey("bills.id"), nullable=False)
    customer_name = Column(String(100), nullable=False)
    customer_phone = Column(String(20), nullable=False)
    garment_details = Column(String(255), nullable=False) # e.g. Navy Slim Fit Trouser Size 32
    alteration_notes = Column(Text, nullable=False) # e.g. Length shorten by 2 inches, waist loosen by 0.5 inch
    status = Column(String(20), default=AlterationStatus.PENDING.value)
    pickup_date = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    bill = relationship("Bill", back_populates="alterations")
