import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from .database import engine, Base, SessionLocal
from .models import User, UserRole
from .auth import get_password_hash
from .routers import auth, products, customers, bills, returns, alterations, reports, printers, settings, shifts, audit

# Ensure tables exist
Base.metadata.create_all(bind=engine)

def ensure_default_admin():
    try:
        db = SessionLocal()
        admin_user = db.query(User).filter(User.username == "admin").first()
        if not admin_user:
            print("👑 Automatically creating default admin user (admin / admin@123)...")
            admin_user = User(
                name="Admin Director",
                username="admin",
                password_hash=get_password_hash("admin@123"),
                role=UserRole.ADMIN.value
            )
            db.add(admin_user)
            db.commit()
    except Exception as e:
        print(f"Error checking default admin: {e}")
    finally:
        db.close()

ensure_default_admin()

app = FastAPI(
    title="Swagz Fashion — POS & Billing API",
    description="Point-of-Sale & Auto-Print Backend for Menswear Retail",
    version="1.0.0"
)

# Enable CORS for React Frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static folder for product images
static_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "static")
uploads_dir = os.path.join(static_dir, "uploads")
os.makedirs(uploads_dir, exist_ok=True)
app.mount("/static", StaticFiles(directory=static_dir), name="static")

# Include Routers
app.include_router(auth.router)
app.include_router(products.router)
app.include_router(bills.router)
app.include_router(returns.router)
app.include_router(reports.router)
app.include_router(printers.router)
app.include_router(settings.router)
app.include_router(shifts.router)
app.include_router(audit.router)

@app.get("/")
def root():
    return {
        "status": "online",
        "app": "Swagz Fashion POS API",
        "version": "1.0.0",
        "docs_url": "/docs"
    }
