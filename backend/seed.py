import os
import sys

# Ensure backend package import path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.database import Base, engine, SessionLocal
from app.models import User, Product, ProductVariant, Customer, Printer, ShopSettings, UserRole
from app.auth import get_password_hash

def seed():
    print("Recreating database tables...")
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    try:
        # 1. Users
        if db.query(User).count() == 0:
            print("Seeding Users...")
            admin = User(name="Admin Director", username="admin", password_hash=get_password_hash("admin@123"), role=UserRole.ADMIN.value)
            manager = User(name="Store Manager", username="manager", password_hash=get_password_hash("manager123"), role=UserRole.MANAGER.value)
            cashier = User(name="Cashier Staff", username="cashier", password_hash=get_password_hash("cashier123"), role=UserRole.CASHIER.value)
            db.add_all([admin, manager, cashier])
            db.commit()

        # 2. Shop Settings
        if db.query(ShopSettings).count() == 0:
            print("Seeding Shop Settings...")
            settings = ShopSettings(
                shop_name="SWAGZ FASHION — MENSWEAR",
                address="74 Luxury Boulevard, Tailor District, New Delhi - 110001",
                phone="+91 98765 43210",
                gstin="07SWAGZ9999F1Z9",
                invoice_prefix="SWZ-2026-",
                tax_default=5.0,
                receipt_footer="Thank you for shopping at Swagz! Menswear items once sold can be exchanged within 7 days with original tag & invoice."
            )
            db.add(settings)
            db.commit()

        # 3. Default Printer
        if db.query(Printer).count() == 0:
            print("Seeding Printer...")
            printer = Printer(
                name="Main Counter Thermal Printer",
                connection_type="usb",
                device_path="/dev/usb/lp0",
                paper_width_mm=80,
                is_default=True
            )
            db.add(printer)
            db.commit()

        # 4. Customers
        if db.query(Customer).count() == 0:
            print("Seeding Customers...")
            c1 = Customer(name="Rahul Sharma", phone="9876543210", email="rahul@example.com", address="Block B, Connaught Place", loyalty_points=120)
            c2 = Customer(name="Vikram Singh", phone="9812345678", email="vikram@example.com", address="Vasant Kunj, New Delhi", loyalty_points=350)
            c3 = Customer(name="Amit Patel", phone="9988776655", email="amit@example.com", address="Gurugram Cyber Hub", loyalty_points=45)
            db.add_all([c1, c2, c3])
            db.commit()

        # 5. Menswear Products & Variant Matrix
        if db.query(Product).count() == 0:
            print("Seeding Menswear Catalog & Variants...")
            
            p1 = Product(
                name="Slim Fit Oxford Cotton Shirt",
                brand="Swagz Signature",
                category="Shirts",
                description="100% Premium Egyptian Cotton, Button-down collar, Tailored slim fit.",
                base_price=1499.0,
                cost_price=650.0,
                tax_percent=5.0,
                image_url="https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=500&q=80",
                is_active=True
            )
            db.add(p1)
            db.commit()

            variants_p1 = [
                ProductVariant(product_id=p1.id, size="S", color="Crisp White", sku_barcode="SWZ-SH-WHT-S", stock_qty=15),
                ProductVariant(product_id=p1.id, size="M", color="Crisp White", sku_barcode="SWZ-SH-WHT-M", stock_qty=22),
                ProductVariant(product_id=p1.id, size="L", color="Crisp White", sku_barcode="SWZ-SH-WHT-L", stock_qty=18),
                ProductVariant(product_id=p1.id, size="XL", color="Crisp White", sku_barcode="SWZ-SH-WHT-XL", stock_qty=8),
                ProductVariant(product_id=p1.id, size="M", color="Navy Blue", sku_barcode="SWZ-SH-NVY-M", stock_qty=12),
                ProductVariant(product_id=p1.id, size="L", color="Navy Blue", sku_barcode="SWZ-SH-NVY-L", stock_qty=10),
            ]
            db.add_all(variants_p1)

            p2 = Product(
                name="Stretch Denim Slim Fit Jeans",
                brand="Urban Edge",
                category="Jeans",
                description="Heavyweight indigo denim with 2% elastane for maximum daily comfort.",
                base_price=2299.0,
                cost_price=1100.0,
                tax_percent=5.0,
                image_url="https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=500&q=80",
                is_active=True
            )
            db.add(p2)
            db.commit()

            variants_p2 = [
                ProductVariant(product_id=p2.id, size="30", color="Dark Indigo", sku_barcode="SWZ-JN-IND-30", stock_qty=10),
                ProductVariant(product_id=p2.id, size="32", color="Dark Indigo", sku_barcode="SWZ-JN-IND-32", stock_qty=16),
                ProductVariant(product_id=p2.id, size="34", color="Dark Indigo", sku_barcode="SWZ-JN-IND-34", stock_qty=14),
                ProductVariant(product_id=p2.id, size="36", color="Dark Indigo", sku_barcode="SWZ-JN-IND-36", stock_qty=6),
                ProductVariant(product_id=p2.id, size="32", color="Washed Grey", sku_barcode="SWZ-JN-GRY-32", stock_qty=9),
            ]
            db.add_all(variants_p2)

            p3 = Product(
                name="Classic Notch Lapel Tuxedo Blazer",
                brand="Swagz Luxe",
                category="Suits",
                description="Formal wool blend blazer with satin lapels, ideal for weddings and formal galas.",
                base_price=5999.0,
                cost_price=2800.0,
                tax_percent=12.0,
                image_url="https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=500&q=80",
                is_active=True
            )
            db.add(p3)
            db.commit()

            variants_p3 = [
                ProductVariant(product_id=p3.id, size="38", color="Midnight Black", sku_barcode="SWZ-SU-BLK-38", stock_qty=5),
                ProductVariant(product_id=p3.id, size="40", color="Midnight Black", sku_barcode="SWZ-SU-BLK-40", stock_qty=7),
                ProductVariant(product_id=p3.id, size="42", color="Midnight Black", sku_barcode="SWZ-SU-BLK-42", stock_qty=4),
            ]
            db.add_all(variants_p3)

            p4 = Product(
                name="Indo-Western Silk Bandhgala Jacket",
                brand="Royal Heritage",
                category="Ethnic",
                description="Hand-embroidered festive Bandhgala suit with brass engraved buttons.",
                base_price=4499.0,
                cost_price=2100.0,
                tax_percent=12.0,
                image_url="https://images.unsplash.com/photo-1617137984095-74e4e5e3613f?w=500&q=80",
                is_active=True
            )
            db.add(p4)
            db.commit()

            variants_p4 = [
                ProductVariant(product_id=p4.id, size="M", color="Royal Maroon", sku_barcode="SWZ-ETH-MRN-M", stock_qty=6),
                ProductVariant(product_id=p4.id, size="L", color="Royal Maroon", sku_barcode="SWZ-ETH-MRN-L", stock_qty=8),
                ProductVariant(product_id=p4.id, size="XL", color="Antique Gold", sku_barcode="SWZ-ETH-GLD-XL", stock_qty=3),
            ]
            db.add_all(variants_p4)

            p5 = Product(
                name="Pique Cotton Polo T-Shirt",
                brand="Casual Craft",
                category="T-Shirts",
                description="Breathable honeycomb pique knit polo with ribbed cuffs.",
                base_price=899.0,
                cost_price=350.0,
                tax_percent=5.0,
                image_url="https://images.unsplash.com/photo-1581655353564-df123a1eb820?w=500&q=80",
                is_active=True
            )
            db.add(p5)
            db.commit()

            variants_p5 = [
                ProductVariant(product_id=p5.id, size="M", color="Olive Green", sku_barcode="SWZ-TS-OLV-M", stock_qty=20),
                ProductVariant(product_id=p5.id, size="L", color="Olive Green", sku_barcode="SWZ-TS-OLV-L", stock_qty=25),
                ProductVariant(product_id=p5.id, size="L", color="Jet Black", sku_barcode="SWZ-TS-BLK-L", stock_qty=30),
            ]
            db.add_all(variants_p5)

            p6 = Product(
                name="Italian Leather Belt & Cufflink Set",
                brand="Swagz Accessories",
                category="Accessories",
                description="Reversible full-grain leather belt with nickel buckle and matching stainless cufflinks.",
                base_price=1299.0,
                cost_price=450.0,
                tax_percent=18.0,
                image_url="https://images.unsplash.com/photo-1624222247344-550fb60583dc?w=500&q=80",
                is_active=True
            )
            db.add(p6)
            db.commit()

            variants_p6 = [
                ProductVariant(product_id=p6.id, size="Free", color="Tan Brown", sku_barcode="SWZ-ACC-TAN-FREE", stock_qty=20)
            ]
            db.add_all(variants_p6)

            # Footwear / Chappals & Shoes
            p7 = Product(
                name="Handcrafted Pure Leather Chappals",
                brand="Royal Footwear",
                category="Footwear",
                description="Authentic handcrafted genuine leather chappals with cushioned footbed for ethnic and daily wear.",
                base_price=1299.0,
                cost_price=550.0,
                tax_percent=5.0,
                image_url="https://images.unsplash.com/photo-1603808033192-082d6919d3e1?w=500&q=80",
                is_active=True
            )
            db.add(p7)
            db.commit()

            variants_p7 = [
                ProductVariant(product_id=p7.id, size="7", color="Tan Brown", sku_barcode="SWZ-FT-CHP-TAN-7", stock_qty=12),
                ProductVariant(product_id=p7.id, size="8", color="Tan Brown", sku_barcode="SWZ-FT-CHP-TAN-8", stock_qty=15),
                ProductVariant(product_id=p7.id, size="9", color="Tan Brown", sku_barcode="SWZ-FT-CHP-TAN-9", stock_qty=10),
                ProductVariant(product_id=p7.id, size="9", color="Jet Black", sku_barcode="SWZ-FT-CHP-BLK-9", stock_qty=8),
            ]
            db.add_all(variants_p7)

            p8 = Product(
                name="Classic Italian Leather Oxford Shoes",
                brand="Swagz Luxe",
                category="Footwear",
                description="Premium full-grain leather lace-up formal Oxford shoes with handcrafted leather sole.",
                base_price=3499.0,
                cost_price=1600.0,
                tax_percent=12.0,
                image_url="https://images.unsplash.com/photo-1614252235316-8c857d38b5f4?w=500&q=80",
                is_active=True
            )
            db.add(p8)
            db.commit()

            variants_p8 = [
                ProductVariant(product_id=p8.id, size="8", color="Mahogany Brown", sku_barcode="SWZ-FT-OXF-BRN-8", stock_qty=6),
                ProductVariant(product_id=p8.id, size="9", color="Mahogany Brown", sku_barcode="SWZ-FT-OXF-BRN-9", stock_qty=10),
                ProductVariant(product_id=p8.id, size="10", color="Onyx Black", sku_barcode="SWZ-FT-OXF-BLK-10", stock_qty=7),
            ]
            db.add_all(variants_p8)

            p9 = Product(
                name="Casual Ethnic Kolhapuri Slippers",
                brand="Urban Edge",
                category="Footwear",
                description="Lightweight traditional braided leather slippers designed for comfort and festive style.",
                base_price=1499.0,
                cost_price=600.0,
                tax_percent=5.0,
                image_url="https://images.unsplash.com/photo-1560769629-975ec94e6a86?w=500&q=80",
                is_active=True
            )
            db.add(p9)
            db.commit()

            variants_p9 = [
                ProductVariant(product_id=p9.id, size="8", color="Camel Brown", sku_barcode="SWZ-FT-KOL-BRN-8", stock_qty=9),
                ProductVariant(product_id=p9.id, size="9", color="Camel Brown", sku_barcode="SWZ-FT-KOL-BRN-9", stock_qty=11),
            ]
            db.add_all(variants_p9)

            db.commit()

        print("Database seed completed successfully!")

    except Exception as e:
        db.rollback()
        print(f"Error seeding database: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    seed()
