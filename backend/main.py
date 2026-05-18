from fastapi import FastAPI, HTTPException, Depends, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List, Dict
import os
from supabase import create_client, Client
from groq import Groq
import numpy as np
from datetime import datetime, timedelta

# Initialize clients with environment variables (Vercel will inject these)
SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_ANON_KEY = os.environ.get("SUPABASE_ANON_KEY")
GROQ_API_KEY = os.environ.get("GROQ_API_KEY")

# Log which services are available (for debugging)
print(f"Supabase configured: {SUPABASE_URL is not None}")
print(f"Groq configured: {GROQ_API_KEY is not None}")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_ANON_KEY) if SUPABASE_URL and SUPABASE_ANON_KEY else None
groq_client = Groq(api_key=GROQ_API_KEY) if GROQ_API_KEY else None

app = FastAPI(title="ProphetLedger API", version="1.0.0")

# CORS - Allow frontend domains
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://prophetledger.vercel.app",
        "https://prophet-ledger.vercel.app",
        "http://localhost:3000",
        "http://localhost:3001"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ============================================
# HEALTH CHECK
# ============================================
@app.get("/")
def root():
    return {
        "message": "ProphetLedger API is running on Vercel!", 
        "status": "healthy",
        "version": "1.0.0"
    }

@app.get("/api/health")
def health():
    return {
        "status": "healthy", 
        "services": {
            "supabase": supabase is not None,
            "groq": groq_client is not None
        },
        "environment": "production"
    }

# ============================================
# AUTH ENDPOINTS (Supabase)
# ============================================
class LoginRequest(BaseModel):
    email: str
    password: str

class RegisterRequest(BaseModel):
    email: str
    full_name: str
    password: str

@app.post("/api/auth/register")
async def register(request: RegisterRequest):
    if not supabase:
        raise HTTPException(status_code=500, detail="Supabase not configured. Add SUPABASE_URL and SUPABASE_ANON_KEY to environment variables.")
    
    try:
        response = supabase.auth.sign_up({
            "email": request.email,
            "password": request.password,
            "options": {
                "data": {"full_name": request.full_name}
            }
        })
        return {"message": "User created successfully", "user_id": response.user.id}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/api/auth/login")
async def login(request: LoginRequest):
    if not supabase:
        raise HTTPException(status_code=500, detail="Supabase not configured")
    
    try:
        response = supabase.auth.sign_in_with_password({
            "email": request.email,
            "password": request.password
        })
        return {
            "access_token": response.session.access_token,
            "token_type": "bearer",
            "user": {
                "id": response.user.id,
                "email": response.user.email,
                "full_name": response.user.user_metadata.get("full_name", ""),
                "role": "user",
                "mode_preference": "personal"
            }
        }
    except Exception as e:
        raise HTTPException(status_code=401, detail="Invalid credentials")

@app.get("/api/auth/me")
async def get_current_user(request: Request):
    auth_header = request.headers.get("Authorization")
    if not auth_header:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    token = auth_header.replace("Bearer ", "")
    try:
        user = supabase.auth.get_user(token)
        return {
            "id": user.user.id,
            "email": user.user.email,
            "full_name": user.user.user_metadata.get("full_name", ""),
            "is_active": True
        }
    except Exception as e:
        raise HTTPException(status_code=401, detail="Invalid token")

# ============================================
# CHATBOT ENDPOINT (Groq API)
# ============================================
class ChatRequest(BaseModel):
    query: str
    user_id: Optional[str] = None

@app.post("/api/chatbot/query")
async def chat(request: ChatRequest):
    if not groq_client:
        return mock_chat_response(request.query)
    
    try:
        completion = groq_client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {
                    "role": "system",
                    "content": "You are a helpful financial assistant for ProphetLedger. Help users with their financial questions about spending, balance, forecasts, and anomalies. Keep responses concise and actionable."
                },
                {
                    "role": "user",
                    "content": request.query
                }
            ],
            temperature=0.7,
            max_tokens=500
        )
        
        return {
            "query": request.query,
            "response": completion.choices[0].message.content,
            "intent": "llm",
            "confidence": 0.95
        }
    except Exception as e:
        return mock_chat_response(request.query)

def mock_chat_response(query):
    lower_query = query.lower()
    if "spent" in lower_query or "spend" in lower_query:
        return {"query": query, "response": "You've spent $3,247 in the last 30 days. Your top category is Dining at $780.", "intent": "spending", "confidence": 0.8}
    elif "balance" in lower_query:
        return {"query": query, "response": "Your current balance is $12,845.", "intent": "balance", "confidence": 0.9}
    elif "forecast" in lower_query or "predict" in lower_query:
        return {"query": query, "response": "Based on your patterns, next month you'll spend around $3,200.", "intent": "forecast", "confidence": 0.85}
    else:
        return {"query": query, "response": "I can help with spending, balances, forecasts, and anomalies. Try asking 'How much did I spend on food?'", "intent": "unknown", "confidence": 0.5}

# ============================================
# TRANSACTIONS ENDPOINTS
# ============================================
@app.get("/api/transactions")
async def get_transactions(limit: int = 50):
    return [
        {"id": 1, "date": "2024-05-15", "description": "Starbucks", "amount": 5.75, "category": "Dining", "type": "expense"},
        {"id": 2, "date": "2024-05-14", "description": "Salary", "amount": 5000, "category": "Income", "type": "income"},
    ][:limit]

@app.post("/api/transactions")
async def create_transaction(transaction: dict):
    return {"message": "Transaction created", "id": 999}

# ============================================
# FORECAST ENDPOINTS
# ============================================
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

# ============================================
# ANOMALY DETECTION
# ============================================
@app.get("/api/anomalies")
async def get_anomalies(limit: int = 10):
    return [
        {"id": 1, "date": "2024-05-15", "description": "Amazon Purchase", "amount": 1249.99, "category": "Shopping", "anomaly_score": 92, "status": "pending"},
    ][:limit]

# ============================================
# KPI ENDPOINTS
# ============================================
@app.get("/api/dss/kpis")
async def get_kpis(mode: str = "personal"):
    return [
        {"id": 1, "title": "Financial Health", "value": 78, "change": 5.2, "trend": "up", "benchmark": 75, "status": "good", "recommendation": "Keep saving!"},
        {"id": 2, "title": "Cash Runway", "value": 12, "change": -2, "trend": "down", "benchmark": 12, "status": "warning", "recommendation": "Watch spending"},
    ]

@app.get("/api/dss/risk/score")
async def get_risk_score():
    return {"risk_score": 68, "risk_level": "medium", "active_anomalies": 2, "recommendation": "Review pending anomalies"}

# ============================================
# INVOICE ENDPOINTS
# ============================================
@app.post("/api/invoices/scan")
async def scan_invoice():
    return {"message": "Invoice scanned", "vendor": "Sample Vendor", "total": 125.50, "date": "2024-05-15"}

@app.get("/api/invoices")
async def get_invoices():
    return [
        {"id": 1, "vendor": "Amazon", "amount": 1249.99, "date": "2024-05-15", "status": "paid"},
    ]
