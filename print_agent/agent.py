import uvicorn
import socket
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import time

app = FastAPI(
    title="Swagz Central Print Agent Service",
    description="Thermal Printer Service listening on Port 9101 (targeting Printers on Port 9100)",
    version="2.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Store recent virtual prints for browser testing preview
last_printed_receipt = {
    "timestamp": None,
    "payload": None,
    "virtual_rendered_html": None
}

class PrintItem(BaseModel):
    name: str
    size: Optional[str] = ""
    color: Optional[str] = ""
    qty: int
    unit_price: float
    line_total: float

class PaymentItem(BaseModel):
    mode: str
    amount: float
    ref: Optional[str] = None

class PrintJobPayload(BaseModel):
    bill_id: Optional[int] = None
    shop_name: str = "SWAGZ FASHION"
    shop_address: Optional[str] = ""
    shop_phone: Optional[str] = ""
    gstin: Optional[str] = ""
    invoice_number: str
    date: str
    customer_name: Optional[str] = "Walk-in Customer"
    customer_phone: Optional[str] = ""
    items: List[PrintItem]
    subtotal: float
    discount: float = 0.0
    tax: float = 0.0
    cgst: float = 0.0
    sgst: float = 0.0
    total: float
    payments: List[PaymentItem]
    footer: Optional[str] = "Thank you for shopping at Swagz!"
    paper_width_mm: int = 80
    connection_type: str = "usb"
    device_path: Optional[str] = None
    ip_address: Optional[str] = None
    port: int = 9100

def generate_virtual_receipt_html(data: PrintJobPayload) -> str:
    width_px = 300 if data.paper_width_mm == 58 else 380
    
    items_html = ""
    for item in data.items:
        items_html += f"""
        <div style="display:flex; justify-content:space-between; font-size:12px; margin-top:4px;">
            <div>
                <strong>{item.name}</strong><br/>
                <span style="color:#666;">Size: {item.size} | Color: {item.color} | Qty: {item.qty} x ₹{item.unit_price:.2f}</span>
            </div>
            <div style="font-weight:bold; text-align:right;">₹{item.line_total:.2f}</div>
        </div>
        """

    payments_html = ""
    for p in data.payments:
        ref_text = f" ({p.ref})" if p.ref else ""
        payments_html += f"""
        <div style="display:flex; justify-content:space-between; font-size:11px; color:#444;">
            <span>Payment Mode: {p.mode}{ref_text}</span>
            <span>₹{p.amount:.2f}</span>
        </div>
        """

    cgst_val = data.cgst if data.cgst > 0 else round(data.tax / 2.0, 2)
    sgst_val = data.sgst if data.sgst > 0 else round(data.tax / 2.0, 2)

    return f"""
    <div style="max-width:100%; width:100%; box-sizing:border-box; font-family:'Courier New', monospace; background:#fff; color:#000; padding:10px; border:1px dashed #aaa; border-radius:4px; box-shadow: 0 4px 12px rgba(0,0,0,0.15); margin:0 auto;">
        <div style="text-align:center;">
            <h2 style="margin:0; font-size:18px; letter-spacing:1px;">{data.shop_name.upper()}</h2>
            <div style="font-size:11px; margin-top:3px;">{data.shop_address}</div>
            <div style="font-size:11px;">Ph: {data.shop_phone} | GSTIN: {data.gstin}</div>
        </div>
        
        <div style="border-bottom:1px dashed #000; margin:8px 0;"></div>
        
        <div style="font-size:11px; display:flex; justify-content:space-between;">
            <span>Inv: <strong>{data.invoice_number}</strong></span>
            <span>{data.date}</span>
        </div>
        <div style="font-size:11px; margin-top:2px;">
            Customer: {data.customer_name} {f'({data.customer_phone})' if data.customer_phone else ''}
        </div>

        <div style="border-bottom:1px dashed #000; margin:8px 0;"></div>

        <div>
            {items_html}
        </div>

        <div style="border-bottom:1px dashed #000; margin:8px 0;"></div>

        <div style="font-size:12px;">
            <div style="display:flex; justify-content:space-between;"><span>Subtotal:</span><span>₹{data.subtotal:.2f}</span></div>
            <div style="display:flex; justify-content:space-between; color:#d9534f;"><span>Discount:</span><span>-₹{data.discount:.2f}</span></div>
            <div style="display:flex; justify-content:space-between;"><span>CGST (2.5%):</span><span>₹{cgst_val:.2f}</span></div>
            <div style="display:flex; justify-content:space-between;"><span>SGST (2.5%):</span><span>₹{sgst_val:.2f}</span></div>
            <div style="display:flex; justify-content:space-between; font-weight:bold; font-size:15px; margin-top:4px; border-top:1px solid #000; padding-top:4px;">
                <span>NET TOTAL:</span><span>₹{data.total:.2f}</span>
            </div>
        </div>

        <div style="border-bottom:1px dashed #000; margin:8px 0;"></div>
        {payments_html}
        <div style="border-bottom:1px dashed #000; margin:8px 0;"></div>

        <div style="text-align:center; font-size:10px; font-style:italic; margin-top:8px;">
            {data.footer}
        </div>
        <div style="text-align:center; font-size:9px; font-weight:bold; margin-top:10px; background:#f0f0f0; padding:2px;">
            [ ESC/POS AUTO-CUT COMMAND EXECUTED ]
        </div>
    </div>
    """

@app.post("/print")
def print_receipt(data: PrintJobPayload):
    # Render Virtual HTML preview
    html = generate_virtual_receipt_html(data)
    
    last_printed_receipt["timestamp"] = time.strftime("%Y-%m-%d %H:%M:%S")
    last_printed_receipt["payload"] = data.dict()
    last_printed_receipt["virtual_rendered_html"] = html

    hardware_status = "simulated"
    error_msg = None

    try:
        if data.connection_type == "usb" and data.device_path:
            dev_path = data.device_path.strip()
            p = None

            if dev_path.upper().startswith("COM"):
                try:
                    from escpos.printer import Serial
                    p = Serial(dev_path)
                except Exception:
                    from escpos.printer import File
                    p = File(dev_path)
            elif "\\" in dev_path or not dev_path.startswith("/"):
                try:
                    from escpos.printer import Win32Raw
                    p = Win32Raw(dev_path)
                except Exception:
                    from escpos.printer import File
                    p = File(dev_path)
            else:
                from escpos.printer import File
                p = File(dev_path)

            if p:
                p.set(align='center', bold=True, double_height=True)
                p.text(f"{data.shop_name}\n")
                p.set(align='center', bold=False, double_height=False)
                p.text(f"{data.shop_address}\nGSTIN: {data.gstin}\n")
                p.text("--------------------------------\n")
                p.text(f"Invoice: {data.invoice_number}\n")
                p.text("--------------------------------\n")
                for item in data.items:
                    p.text(f"{item.name[:20]:<20} x{item.qty} {item.line_total:>8.2f}\n")
                p.text("--------------------------------\n")
                p.text(f"CGST: Rs. {data.cgst:.2f} | SGST: Rs. {data.sgst:.2f}\n")
                p.text(f"TOTAL: Rs. {data.total:.2f}\n")
                p.text(f"{data.footer}\n\n")
                p.cut()
                hardware_status = f"printed_to_device ({dev_path})"
        elif data.connection_type == "lan" and data.ip_address:
            from escpos.printer import Network
            p = Network(data.ip_address, port=data.port or 9100)
            p.text(f"{data.shop_name}\nInvoice: {data.invoice_number}\nTotal: Rs.{data.total}\n")
            p.cut()
            hardware_status = f"printed_to_network_device ({data.ip_address}:{data.port})"
    except Exception as e:
        error_msg = f"Physical printer connection skipped/error: {str(e)}"
        hardware_status = "virtual_fallback"

    return {
        "status": "success",
        "mode": hardware_status,
        "invoice_number": data.invoice_number,
        "note": error_msg or "Receipt sent to printer and stored in virtual preview cache",
        "virtual_preview_url": "http://127.0.0.1:9101/latest-receipt"
    }

@app.get("/health")
def health_check(ip: Optional[str] = None, port: int = 9100):
    if not ip:
        return {"agent_status": "online", "port": 9101}
    
    # TCP socket ping to thermal printer IP on port 9100
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        s.settimeout(2.0)
        s.connect((ip, port))
        s.close()
        return {"agent_status": "online", "printer_ip": ip, "printer_port": port, "printer_status": "online"}
    except Exception as e:
        return {"agent_status": "online", "printer_ip": ip, "printer_port": port, "printer_status": "offline", "error": str(e)}

@app.get("/latest-receipt")
def get_latest_receipt():
    if not last_printed_receipt["virtual_rendered_html"]:
        return {"status": "no_receipts_yet"}
    return {
        "timestamp": last_printed_receipt["timestamp"],
        "payload": last_printed_receipt["payload"],
        "html": last_printed_receipt["virtual_rendered_html"]
    }

@app.post("/test-print")
def test_print(payload: dict):
    test_data = PrintJobPayload(
        shop_name=payload.get("shop_name", "SWAGZ FASHION"),
        invoice_number="TEST-00001",
        date=time.strftime("%Y-%m-%d %H:%M:%S"),
        items=[
            PrintItem(name="Test Item Thermal Print", size="L", color="Navy", qty=1, unit_price=999.0, line_total=999.0)
        ],
        subtotal=999.0,
        discount=0.0,
        tax=49.95,
        cgst=24.97,
        sgst=24.97,
        total=1048.95,
        payments=[PaymentItem(mode="TEST", amount=1048.95)],
        footer="*** HARDWARE / VIRTUAL TEST PRINT OK ***",
        paper_width_mm=payload.get("paper_width_mm", 80)
    )
    return print_receipt(test_data)

if __name__ == "__main__":
    uvicorn.run(app, host="127.0.0.1", port=9101)
