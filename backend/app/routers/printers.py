import requests
from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import Printer, PrintJob, ShopSettings
from ..schemas import PrinterCreate, PrinterResponse, PrintJobResponse
from ..auth import get_current_user, require_role

router = APIRouter(prefix="/api/printers", tags=["printers"])

PRINT_AGENT_TEST_URL = "http://127.0.0.1:9100/test-print"

@router.get("", response_model=List[PrinterResponse])
def list_printers(db: Session = Depends(get_db)):
    return db.query(Printer).all()

@router.post("", response_model=PrinterResponse)
def create_printer(
    req: PrinterCreate,
    db: Session = Depends(get_db),
    current_user = Depends(require_role(["admin"]))
):
    if req.is_default:
        db.query(Printer).update({Printer.is_default: False})

    printer = Printer(
        name=req.name,
        connection_type=req.connection_type,
        ip_address=req.ip_address,
        port=req.port,
        device_path=req.device_path,
        paper_width_mm=req.paper_width_mm,
        is_default=req.is_default
    )
    db.add(printer)
    db.commit()
    db.refresh(printer)
    return printer

@router.post("/{printer_id}/test-print")
def test_print(printer_id: int, db: Session = Depends(get_db)):
    printer = db.query(Printer).filter(Printer.id == printer_id).first()
    if not printer:
        raise HTTPException(status_code=404, detail="Printer not found")
    
    settings = db.query(ShopSettings).first()

    payload = {
        "shop_name": settings.shop_name if settings else "SWAGZ FASHION",
        "printer_name": printer.name,
        "connection_type": printer.connection_type,
        "ip_address": printer.ip_address,
        "port": printer.port,
        "device_path": printer.device_path,
        "paper_width_mm": printer.paper_width_mm
    }

    try:
        res = requests.post(PRINT_AGENT_TEST_URL, json=payload, timeout=3)
        if res.status_code == 200:
            return {"status": "success", "message": f"Test print sent to '{printer.name}'", "response": res.json()}
        return {"status": "failed", "error": res.text}
    except Exception as e:
        return {"status": "failed", "error": f"Print Agent offline or unreachable: {str(e)}"}

@router.get("/jobs", response_model=List[PrintJobResponse])
def list_print_jobs(db: Session = Depends(get_db)):
    return db.query(PrintJob).order_by(PrintJob.created_at.desc()).limit(50).all()
