from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List
import os
import numpy as np
from datetime import datetime, timedelta
from fastapi import FastAPI

app = FastAPI()

@app.get("/")
def home():
    return {"message": "API working"}

app = FastAPI(title="ProphetLedger API", version="1.0.0")

# CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def root():
    return {"message": "ProphetLedger API is running on Vercel!", "status": "healthy"}

@app.get("/api/health")
def health():
    return {"status": "healthy", "services": {"vercel": "ok"}}

# Auth endpoints
class LoginRequest(BaseModel):
    email: str
    password: str

class RegisterRequest(BaseModel):
    email: str
    full_name: str
    password: str

@app.post("/api/auth/register")
async def register(request: RegisterRequest):
    return {"message": "User created successfully", "user_id": "123"}

@app.post("/api/auth/login")
async def login(request: LoginRequest):
    return {
        "access_token": "mock-token-123",
        "token_type": "bearer",
        "user": {
            "id": "123",
            "email": request.email,
            "full_name": "Test User",
            "role": "user",
            "mode_preference": "personal"
        }
    }

@app.get("/api/auth/me")
async def get_current_user():
    return {"id": "123", "email": "user@example.com", "full_name": "Test User"}

# Chatbot endpoint
class ChatRequest(BaseModel):
    query: str
    user_id: Optional[str] = None

@app.post("/api/chatbot/query")
async def chat(request: ChatRequest):
    query_lower = request.query.lower()
    if "spent" in query_lower:
        return {"query": request.query, "response": "You've spent $3,247 in the last 30 days.", "intent": "spending"}
    elif "balance" in query_lower:
        return {"query": request.query, "response": "Your current balance is $12,845.", "intent": "balance"}
    else:
        return {"query": request.query, "response": "I can help with spending, balances, and forecasts. Try asking 'How much did I spend?'", "intent": "unknown"}

# Transactions
@app.get("/api/transactions")
async def get_transactions(limit: int = 50):
    return [
        {"id": 1, "date": "2024-05-15", "description": "Starbucks", "amount": 5.75, "category": "Dining", "type": "expense"},
        {"id": 2, "date": "2024-05-14", "description": "Salary", "amount": 5000, "category": "Income", "type": "income"},
    ][:limit]

# Forecasts
@app.get("/api/forecasts/trend/{metric}")
async def get_trend(metric: str, days: int = 90):
    dates = [(datetime.now() - timedelta(days=i)).strftime('%Y-%m-%d') for i in range(days, 0, -1)]
    base = 50000 if metric == "cashflow" else 32000
    values = np.cumsum(np.random.normal(100, 500, days)) + base
    
    history = [{"date": dates[i], "actual": round(float(values[i]), 2)} for i in range(len(dates))]
    
    last = values[-1]
    forecast_dates = [(datetime.now() + timedelta(days=i)).strftime('%Y-%m-%d') for i in range(1, 31)]
    forecast_values = np.linspace(last, last * 1.05, 30)
    
    for i in range(30):
        history.append({"date": forecast_dates[i], "actual": None, "forecast": round(float(forecast_values[i]), 2)})
    
    return {"metric": metric, "history": history, "anomalies": []}

# Anomalies
@app.get("/api/anomalies")
async def get_anomalies(limit: int = 10):
    return [
        {"id": 1, "date": "2024-05-15", "description": "Amazon Purchase", "amount": 1249.99, "category": "Shopping", "anomaly_score": 92, "status": "pending"},
    ][:limit]

# DSS / KPI
@app.get("/api/dss/kpis")
async def get_kpis(mode: str = "personal"):
    return [
        {"id": 1, "title": "Financial Health", "value": 78, "change": 5.2, "trend": "up", "benchmark": 75, "status": "good", "recommendation": "Keep saving!"},
        {"id": 2, "title": "Cash Runway", "value": 12, "change": -2, "trend": "down", "benchmark": 12, "status": "warning", "recommendation": "Watch spending"},
    ]

@app.get("/api/dss/risk/score")
async def get_risk_score():
    return {"risk_score": 68, "risk_level": "medium", "active_anomalies": 2, "recommendation": "Review pending anomalies"}

# Invoices
@app.post("/api/invoices/scan")
async def scan_invoice():
    return {"message": "Invoice scanned", "vendor": "Sample Vendor", "total": 125.50, "date": "2024-05-15"}

@app.get("/api/invoices")
async def get_invoices():
    return [
        {"id": 1, "vendor": "Amazon", "amount": 1249.99, "date": "2024-05-15", "status": "paid"},
    ]
