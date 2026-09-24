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
    items_html = ""
    for item in data.items:
        detail_parts = []
        if item.size:
            detail_parts.append(f"({item.size})")
        elif item.color:
            detail_parts.append(f"({item.color})")
        detail_str = f" {' '.join(detail_parts)}" if detail_parts else ""

        items_html += f"""
        <div style="display:flex; justify-content:space-between; font-weight:bold; font-size:12px; margin-bottom:8px; color:#090d16;">
            <span>{item.qty}x {item.name}{detail_str}</span>
            <span>₹{item.line_total:,.2f}</span>
        </div>
        """

    payments_html = ""
    if data.payments:
        modes = " / ".join([p.mode for p in data.payments])
        total_paid = sum([p.amount for p in data.payments])
        payments_html = f"""
        <div style="display:flex; justify-content:space-between; font-size:11px; color:#334155; margin-top:4px;">
            <span>Paid via {modes}:</span>
            <span>₹{total_paid:,.2f}</span>
        </div>
        """
    else:
        payments_html = f"""
        <div style="display:flex; justify-content:space-between; font-size:11px; color:#334155; margin-top:4px;">
            <span>Paid via UPI / Cash:</span>
            <span>₹{data.total:,.2f}</span>
        </div>
        """

    tax_val = data.tax if data.tax > 0 else (data.cgst + data.sgst)
    tax_label = "GST (5%):" if tax_val > 0 else "GST:"
    
    discount_html = f"""
    <div style="display:flex; justify-content:space-between; color:#e11d48; font-weight:600; font-size:11px; margin-bottom:4px;">
        <span>Discount:</span>
        <span>-₹{data.discount:,.2f}</span>
    </div>
    """

    shop_address_text = data.shop_address or "Sankarapuram, Kallakurichi District, TamilNadu-605801"
    shop_phone_text = data.shop_phone or "+91 9345611791"
    footer_text = data.footer or "Thank you for shopping at Swagz! Menswear items once sold can be exchanged within 7 days with original tag & invoice."
    date_str = data.date if data.date else time.strftime("%d/%m/%Y")

    return f"""
    <div style="font-family:'Courier New', Courier, monospace; color:#090d16; width:100%; box-sizing:border-box;">
        
        <div style="text-align:center; padding-bottom:12px; border-bottom:1px dashed #94a3b8;">
            <div style="font-weight:800; font-size:14px; text-transform:uppercase; letter-spacing:0.5px;">{data.shop_name}</div>
            <div style="font-size:10px; color:#334155; margin-top:4px; max-width:260px; margin-left:auto; margin-right:auto; line-height:1.3;">{shop_address_text}</div>
            <div style="font-size:10px; color:#334155; font-weight:bold; margin-top:4px;">Ph: {shop_phone_text}</div>
        </div>

        <div style="display:flex; justify-content:space-between; font-weight:bold; font-size:11px; padding:10px 0; border-bottom:1px dashed #cbd5e1;">
            <span>INVOICE: #{data.invoice_number}</span>
            <span>{date_str}</span>
        </div>

        <div style="padding:10px 0; border-bottom:1px dashed #94a3b8;">
            {items_html}
        </div>

        <div style="padding:10px 0; border-bottom:1px dashed #94a3b8;">
            <div style="display:flex; justify-content:space-between; font-size:11px; color:#334155; margin-bottom:4px;">
                <span>Subtotal:</span>
                <span style="font-weight:bold; color:#090d16;">₹{data.subtotal:,.2f}</span>
            </div>
            {discount_html}
            <div style="display:flex; justify-content:space-between; font-size:11px; color:#334155; margin-bottom:4px;">
                <span>{tax_label}</span>
                <span style="font-weight:bold; color:#090d16;">₹{tax_val:,.2f}</span>
            </div>

            <div style="display:flex; justify-content:space-between; font-weight:800; font-size:13px; color:#090d16; padding-top:6px; margin-top:4px; border-top:1px solid #94a3b8;">
                <span>NET TOTAL:</span>
                <span>₹{data.total:,.2f}</span>
            </div>
            {payments_html}
        </div>

        <div style="text-align:center; font-size:9px; color:#475569; font-style:italic; line-height:1.4; padding:10px 0 4px 0;">
            {footer_text}
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
                gstin_str = f" | GSTIN: {data.gstin}" if data.gstin else ""
                p.text(f"{data.shop_address}\nPh: {data.shop_phone}{gst_str if 'gst_str' in locals() else gstin_str}\n")
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
        shop_name=payload.get("shop_name") or "SWAGZ FASHION — MENSWEAR",
        shop_address=payload.get("shop_address") or "Sankarapuram, Kallakurichi District, TamilNadu-605801",
        shop_phone=payload.get("shop_phone") or "+91 9345611791",
        gstin=payload.get("gstin") or "07SWAGZ9999F1Z9",
        invoice_number="TEST-00001",
        date=time.strftime("%d/%m/%Y"),
        items=[
            PrintItem(name="Signature Linen Shirt", size="L", color="White", qty=1, unit_price=2499.0, line_total=2499.0),
            PrintItem(name="Slim Chino Trousers", size="32", color="Navy", qty=1, unit_price=1899.0, line_total=1899.0)
        ],
        subtotal=4398.0,
        discount=200.0,
        tax=209.90,
        cgst=104.95,
        sgst=104.95,
        total=4407.90,
        payments=[PaymentItem(mode="UPI / Cash", amount=4407.90)],
        footer="Thank you for shopping at Swagz! Menswear items once sold can be exchanged within 7 days with original tag & invoice.",
        paper_width_mm=payload.get("paper_width_mm", 80)
    )
    return print_receipt(test_data)

if __name__ == "__main__":
    uvicorn.run(app, host="127.0.0.1", port=9101)
