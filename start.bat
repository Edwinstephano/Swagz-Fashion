@echo off
title Swagz Fashion POS & Auto-Print System (Windows)
cls
echo =========================================================
echo   👔 Starting Swagz Fashion POS & Auto-Print System
echo =========================================================

REM 1. Start Local Print Agent (Port 9100)
echo 🖨️  Starting Local Thermal Print Agent on port 9100...
start /b python print_agent/agent.py

REM 2. Start FastAPI Backend (Port 8005)
echo ⚙️  Starting FastAPI Backend API on port 8005...
start /b python -m uvicorn backend.app.main:app --host 127.0.0.1 --port 8005 --reload

timeout /t 2 >nul

REM 3. Start React POS Frontend (Port 3005)
echo 💻 Starting React POS Frontend UI on port 3005...
echo =========================================================
echo  ✅ SYSTEM ONLINE!
echo  🌐 POS Web App:  http://localhost:3005
echo  ⚙️  Backend API:  http://127.0.0.1:8005/docs
echo  🖨️  Print Agent: http://127.0.0.1:9100
echo =========================================================

cd frontend
npm run dev
