import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from .database import engine, Base
from .routers import auth, products, customers, bills, returns, alterations, reports, printers, settings, shifts, audit

# Ensure tables exist
Base.metadata.create_all(bind=engine)

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
