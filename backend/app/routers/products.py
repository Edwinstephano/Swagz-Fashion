import os
import shutil
import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import Product, ProductVariant, User
from ..schemas import ProductCreate, ProductUpdate, ProductResponse, VariantCreate, VariantResponse
from ..auth import get_current_user, require_role

router = APIRouter(prefix="/api/products", tags=["products"])

UPLOAD_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "static", "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

@router.get("", response_model=List[ProductResponse])
def list_products(
    category: Optional[str] = None,
    brand: Optional[str] = None,
    search: Optional[str] = None,
    status: Optional[str] = "active",
    db: Session = Depends(get_db)
):
    query = db.query(Product)
    if status == "active":
        query = query.filter(Product.is_active == True)
    elif status == "archived":
        query = query.filter(Product.is_active == False)

    if category and category != "All":
        query = query.filter(Product.category.ilike(f"%{category}%"))
    if brand:
        query = query.filter(Product.brand.ilike(f"%{brand}%"))
    if search:
        query = query.filter(
            (Product.name.ilike(f"%{search}%")) | 
            (Product.brand.ilike(f"%{search}%")) |
            (Product.category.ilike(f"%{search}%"))
        )
    return query.all()

@router.get("/{product_id}", response_model=ProductResponse)
def get_product(product_id: int, db: Session = Depends(get_db)):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return product

@router.post("", response_model=ProductResponse)
def create_product(
    req: ProductCreate,
    db: Session = Depends(get_db)
):
    product = Product(
        name=req.name,
        brand=req.brand,
        category=req.category,
        description=req.description,
        base_price=req.base_price,
        cost_price=req.cost_price,
        tax_percent=req.tax_percent,
        image_url=req.image_url
    )
    db.add(product)
    db.commit()
    db.refresh(product)

    for v in req.variants:
        variant = ProductVariant(
            product_id=product.id,
            size=v.size,
            color=v.color,
            sku_barcode=v.sku_barcode,
            price_override=v.price_override,
            stock_qty=v.stock_qty
        )
        db.add(variant)

    db.commit()
    db.refresh(product)
    return product

@router.put("/{product_id}", response_model=ProductResponse)
def update_product(
    product_id: int,
    req: ProductUpdate,
    db: Session = Depends(get_db)
):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    update_data = req.dict(exclude_unset=True)
    for key, val in update_data.items():
        setattr(product, key, val)
    
    db.commit()
    db.refresh(product)
    return product

@router.put("/{product_id}/archive")
def archive_product(
    product_id: int,
    db: Session = Depends(get_db)
):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    product.is_active = False
    db.commit()
    return {"message": "Product archived successfully", "is_active": False}

@router.put("/{product_id}/reopen")
def reopen_product(
    product_id: int,
    db: Session = Depends(get_db)
):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    product.is_active = True
    db.commit()
    return {"message": "Product reopened successfully", "is_active": True}

@router.delete("/{product_id}")
def delete_product(
    product_id: int,
    permanent: bool = True,
    db: Session = Depends(get_db)
):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    if permanent:
        db.query(ProductVariant).filter(ProductVariant.product_id == product_id).delete()
        db.delete(product)
        db.commit()
        return {"message": "Product permanently deleted"}
    else:
        product.is_active = False
        db.commit()
        return {"message": "Product archived successfully"}

@router.post("/{product_id}/variants", response_model=VariantResponse)
def add_variant(
    product_id: int,
    req: VariantCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["admin", "manager"]))
):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    existing = db.query(ProductVariant).filter(ProductVariant.sku_barcode == req.sku_barcode).first()
    if existing:
        raise HTTPException(status_code=400, detail=f"Barcode/SKU '{req.sku_barcode}' already exists")
    
    variant = ProductVariant(
        product_id=product_id,
        size=req.size,
        color=req.color,
        sku_barcode=req.sku_barcode,
        price_override=req.price_override,
        stock_qty=req.stock_qty
    )
    db.add(variant)
    db.commit()
    db.refresh(variant)
    return variant

@router.get("/variant-by-barcode/{barcode}")
def get_variant_by_barcode(barcode: str, db: Session = Depends(get_db)):
    variant = db.query(ProductVariant).filter(ProductVariant.sku_barcode == barcode).first()
    if not variant:
        raise HTTPException(status_code=404, detail="Variant with barcode not found")
    product = db.query(Product).filter(Product.id == variant.product_id).first()
    return {
        "variant": variant,
        "product": product
    }

@router.post("/upload-image")
def upload_product_image(
    file: UploadFile = File(...),
    current_user: User = Depends(require_role(["admin", "manager"]))
):
    extension = os.path.splitext(file.filename)[1]
    filename = f"prod_{uuid.uuid4().hex}{extension}"
    filepath = os.path.join(UPLOAD_DIR, filename)

    with open(filepath, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    return {"image_url": f"/static/uploads/{filename}"}
