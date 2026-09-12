# 👔 Swagz Fashion — Billing & Auto-Print POS System

A modern Point-of-Sale (POS) and inventory management system designed specifically for **menswear retail shops**. Built with **React 18 (Vite)**, **FastAPI (Python)**, **PostgreSQL / SQLite**, and a local **ESC/POS Thermal Print Agent**.

---
cd /opt/projects/Swagz-Fashion
./start.sh

## ⚡ Quick Start Guide (Run Project)

Follow these steps to run all components of the system on your machine:

### Prerequisites
- **Python 3.10+**
- **Node.js 18+** & **npm**

---

### Step 1: Initialize Database & Seed Sample Menswear Catalog

```bash
# 1. Navigate to project root
cd /opt/projects/Swagz-Fashion

# 2. (Optional) Create Python Virtual Environment if not created
python3 -m venv backend/venv
./backend/venv/bin/pip install -r backend/requirements.txt

# 3. Seed Users, Products, Variants, and Default Printer settings
./backend/venv/bin/python backend/seed.py
```

---

### Step 2: Start the Local Thermal Print Agent (Port 9100)

The Print Agent listens on port 9100 to receive print jobs and send formatted ESC/POS commands to USB/LAN thermal receipt printers (or renders live virtual receipt previews).

```bash
# Run in Terminal 1:
./backend/venv/bin/python print_agent/agent.py
```

---

### Step 3: Start the FastAPI Backend API (Port 8005)

```bash
# Run in Terminal 2:
./backend/venv/bin/uvicorn backend.app.main:app --host 127.0.0.1 --port 8005 --reload
```

---

### Step 4: Start the React POS Frontend (Port 3005)

```bash
# Run in Terminal 3:
cd frontend
npm run dev
```

Open your browser at **`http://localhost:3005`** to start using the system!

---

## 🔒 Staff Authentication & Roles

Staff members must sign in using their registered account credentials:

- 👑 **Admin Director**: Full Access (Products, Uploads, Reports, Printers, Settings)
- 🏬 **Store Manager**: Access to POS Billing, Products, Returns & Reports
- 💳 **Cashier Staff**: Access to POS Billing Counter, Parked Carts, Alterations & Returns

### ➕ Creating Users Manually

You can create new staff accounts directly using the CLI tool:

```bash
# Example: Create a new Store Manager account
./backend/venv/bin/python backend/create_user.py --name "Jane Doe" --username jane --password "securepassword" --role manager
```

Roles available: `admin`, `manager`, `cashier`.

---

## 🏗️ System Architecture

```
┌─────────────────────────────────────┐
│    React 18 + Vite POS Frontend     │  • Menswear POS UI (Ink, Gold & Charcoal theme)
│         (http://localhost:3005)     │  • Barcode Search, Ticket Cart & Split Payments
└──────────────────┬──────────────────┘
                   │ REST APIs & JWT Auth
                   ▼
┌─────────────────────────────────────┐
│          FastAPI Backend            │  • Auth & Roles (Admin, Manager, Cashier)
│         (http://localhost:8005)     │  • Products, Variant Matrix, Stock & Invoices
└─────────┬─────────────────┬─────────┘
          │                 │ SQL
          │ Print Job       ▼
          │ Payload    ┌──────────────┐
          ▼            │ PostgreSQL / │
┌──────────────────┐   │ SQLite DB    │
│Local Print Agent │   └──────────────┘
│ (Port 9100)      │
└─────────┬────────┘
     ┌────┴────┐
    USB       LAN
     │         │
     ▼         ▼
  Thermal   Thermal
  Printer   Printer
```

---

## 🌟 Key Features

1. **POS Billing Counter**:
   - Barcode scanner support (e.g. type/scan `SWZ-SH-WHT-M` to auto-add size M white shirt).
   - persistent ticket cart with receipt perforation.
   - Hold / Park Cart drawer for Trial Room management.
   - Split Payment modal (Cash, UPI QR code, Card) with cash change calculator.
   - Receipt tear-off signature animation on checkout.

2. **Auto-Print Thermal Receipt Engine**:
   - Sends printable receipt payload directly to the local Print Agent on port 9100.
   - Supports 58mm & 80mm ESC/POS paper formats.
   - Built-in Virtual Thermal Receipt Preview tab for instant verification without physical hardware attached.

3. **Menswear Product Catalog & Variant Builder**:
   - Multi-variant matrix generator (Sizes S/M/L/XL/XXL × Colors).
   - Product image file upload & preview.
   - Barcode SKU auto-generation.

4. **Alteration Desk**:
   - Track tailoring requests (trouser length shorten, waist adjustment, pickup date, status tracker).

5. **Returns & Size Exchanges**:
   - Process garment returns against invoice numbers with automatic inventory restock.

6. **Reports & Analytics**:
   - Sales KPIs, Sales by Category, Brand, Size performance, and Low-Stock inventory alerts.
