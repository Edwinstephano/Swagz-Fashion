#!/bin/bash

# Swagz Fashion - Single Unified Startup Script
echo "========================================================="
echo "  👔 Starting Swagz Fashion POS & Auto-Print System"
echo "========================================================="

PROJECT_DIR="/opt/projects/Swagz-Fashion"
cd "$PROJECT_DIR" || exit 1

# Kill any previous processes on ports 8000, 9100, 3000
echo "🧹 Clearing previous background processes..."
fuser -k 8000/tcp 9100/tcp 3000/tcp 2>/dev/null || true
sleep 1

# 1. Start Local Print Agent (Port 9100)
echo "🖨️  Starting Local Thermal Print Agent on port 9100..."
./backend/venv/bin/python print_agent/agent.py > print_agent.log 2>&1 &
AGENT_PID=$!

# 2. Start FastAPI Backend (Port 8000)
echo "⚙️  Starting FastAPI Backend API on port 8000..."
./backend/venv/bin/uvicorn backend.app.main:app --host 127.0.0.1 --port 8000 --reload > backend.log 2>&1 &
BACKEND_PID=$!

sleep 2

# 3. Start React POS Frontend (Port 3000)
echo "💻 Starting React POS Frontend UI on port 3000..."
echo ""
echo "========================================================="
echo " ✅ SYSTEM ONLINE!"
echo " 🌐 POS Web App:  http://localhost:3000"
echo " ⚙️  Backend API:  http://127.0.0.1:8000/docs"
echo " 🖨️  Print Agent: http://127.0.0.1:9100"
echo "========================================================="
echo "Press CTRL+C to stop all services."

cleanup() {
  echo -e "\nStopping all Swagz Fashion services..."
  kill $AGENT_PID $BACKEND_PID 2>/dev/null || true
  fuser -k 8000/tcp 9100/tcp 3000/tcp 2>/dev/null || true
  exit 0
}

trap cleanup INT TERM

cd frontend && npm run dev
