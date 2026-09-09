from pydantic import BaseModel, Field
from typing import List, Optional, Any
from datetime import datetime

# --- Auth Schemas ---
class Token(BaseModel):
    access_token: str
    token_type: str
    role: str
    user_id: int
    name: str
    username: str

class LoginRequest(BaseModel):
    username: str
    password: str

class UserCreate(BaseModel):
    name: str
    username: str
    password: str
    role: str = "cashier"

class UserResponse(BaseModel):
    id: int
    name: str
    username: str
    role: str
    created_at: datetime

    class Config:
        from_attributes = True

# --- Variant Schemas ---
class VariantCreate(BaseModel):
    size: str
    color: str
    sku_barcode: str
    price_override: Optional[float] = None
    stock_qty: int = 0

class VariantResponse(BaseModel):
    id: int
    product_id: int
    size: str
    color: str
    sku_barcode: str
    price_override: Optional[float] = None
    stock_qty: int
    created_at: datetime

    class Config:
        from_attributes = True

# --- Product Schemas ---
class ProductCreate(BaseModel):
    name: str
    brand: str
    category: str
    description: Optional[str] = None
    base_price: float
    cost_price: float = 0.0
    tax_percent: float = 5.0
    image_url: Optional[str] = None
    variants: List[VariantCreate] = []

class ProductUpdate(BaseModel):
    name: Optional[str] = None
    brand: Optional[str] = None
    category: Optional[str] = None
    description: Optional[str] = None
    base_price: Optional[float] = None
    cost_price: Optional[float] = None
    tax_percent: Optional[float] = None
    image_url: Optional[str] = None
    is_active: Optional[bool] = None

class ProductResponse(BaseModel):
    id: int
    name: str
    brand: str
    category: str
    description: Optional[str] = None
    base_price: float
    cost_price: float
    tax_percent: float
    image_url: Optional[str] = None
    is_active: bool
    created_at: datetime
    variants: List[VariantResponse] = []

    class Config:
        from_attributes = True

# --- Customer Schemas ---
class CustomerCreate(BaseModel):
    name: str
    phone: str
    email: Optional[str] = None
    address: Optional[str] = None

class CustomerResponse(BaseModel):
    id: int
    name: str
    phone: str
    email: Optional[str] = None
    address: Optional[str] = None
    loyalty_points: int
    created_at: datetime

    class Config:
        from_attributes = True

# --- Billing Schemas ---
class BillItemCreate(BaseModel):
    variant_id: int
    qty: int = 1
    unit_price: float
    discount: float = 0.0
    tax: float = 0.0

class PaymentCreate(BaseModel):
    mode: str # cash, upi, card, wallet
    amount: float
    reference_no: Optional[str] = None

class BillCreate(BaseModel):
    customer_id: Optional[int] = None
    items: List[BillItemCreate]
    payments: List[PaymentCreate]
    discount_amount: float = 0.0
    notes: Optional[str] = None
    status: str = "confirmed" # draft, parked, confirmed

class BillItemResponse(BaseModel):
    id: int
    bill_id: int
    variant_id: int
    qty: int
    unit_price: float
    discount: float
    tax: float
    line_total: float
    variant: Optional[VariantResponse] = None

    class Config:
        from_attributes = True

class PaymentResponse(BaseModel):
    id: int
    bill_id: int
    mode: str
    amount: float
    reference_no: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

class BillResponse(BaseModel):
    id: int
    invoice_number: str
    customer_id: Optional[int] = None
    cashier_id: int
    subtotal: float
    discount_amount: float
    tax_amount: float
    total_amount: float
    status: str
    notes: Optional[str] = None
    created_at: datetime
    items: List[BillItemResponse] = []
    payments: List[PaymentResponse] = []
    customer: Optional[CustomerResponse] = None

    class Config:
        from_attributes = True

# --- Alteration Schemas ---
class AlterationCreate(BaseModel):
    bill_id: int
    customer_name: str
    customer_phone: str
    garment_details: str
    alteration_notes: str
    pickup_date: Optional[datetime] = None

class AlterationUpdateStatus(BaseModel):
    status: str # pending, in_progress, ready, delivered

class AlterationResponse(BaseModel):
    id: int
    bill_id: int
    customer_name: str
    customer_phone: str
    garment_details: str
    alteration_notes: str
    status: str
    pickup_date: Optional[datetime] = None
    created_at: datetime

    class Config:
        from_attributes = True

# --- Return/Exchange Schemas ---
class ReturnItemCreate(BaseModel):
    variant_id: int
    qty: int
    refund_amount: float

class ReturnCreate(BaseModel):
    original_bill_id: int
    reason: str
    return_items: List[ReturnItemCreate]
    exchange_bill: Optional[BillCreate] = None

# --- Stock Adjustment ---
class StockAdjustmentCreate(BaseModel):
    variant_id: int
    change_qty: int
    reason: str

# --- Printer Schemas ---
class PrinterCreate(BaseModel):
    name: str
    connection_type: str = "usb"
    ip_address: Optional[str] = None
    port: int = 9100
    device_path: Optional[str] = None
    paper_width_mm: int = 80
    is_default: bool = False

class PrinterResponse(BaseModel):
    id: int
    name: str
    connection_type: str
    ip_address: Optional[str] = None
    port: int
    device_path: Optional[str] = None
    paper_width_mm: int
    is_default: bool
    created_at: datetime

    class Config:
        from_attributes = True

class PrintJobResponse(BaseModel):
    id: int
    bill_id: int
    printer_id: Optional[int]
    status: str
    attempts: int
    last_error: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True

# --- Shop Settings Schema ---
class ShopSettingsUpdate(BaseModel):
    shop_name: Optional[str] = None
    address: Optional[str] = None
    phone: Optional[str] = None
    gstin: Optional[str] = None
    logo_url: Optional[str] = None
    invoice_prefix: Optional[str] = None
    tax_default: Optional[float] = None
    receipt_footer: Optional[str] = None

class ShopSettingsResponse(BaseModel):
    id: int
    shop_name: str
    address: str
    phone: str
    gstin: str
    logo_url: Optional[str] = None
    invoice_prefix: str
    tax_default: float
    receipt_footer: str

    class Config:
        from_attributes = True
