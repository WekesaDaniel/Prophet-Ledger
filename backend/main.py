# backend/main.py
from fastapi import FastAPI, HTTPException, Request, UploadFile, File, Form, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
import os
import re
import io
import numpy as np
from datetime import datetime, timedelta
from supabase import create_client, Client
from groq import Groq



from app.services.hf_model_loader import hf_loader

# ============================================
# ENVIRONMENT VARIABLES
# ============================================
SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_ANON_KEY = os.environ.get("SUPABASE_ANON_KEY")
GROQ_API_KEY = os.environ.get("GROQ_API_KEY")

print(f"🔐 Supabase: {SUPABASE_URL is not None}, Groq: {GROQ_API_KEY is not None}")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_ANON_KEY) if SUPABASE_URL and SUPABASE_ANON_KEY else None
groq_client = Groq(api_key=GROQ_API_KEY) if GROQ_API_KEY else None

app = FastAPI(title="ProphetLedger API", version="1.0.0")

# CORS
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
# AUTH HELPER
# ============================================
def get_current_user(request: Request):
    auth_header = request.headers.get("Authorization")
    if not auth_header:
        raise HTTPException(status_code=401, detail="Not authenticated")
    token = auth_header.replace("Bearer ", "")
    if not supabase:
        raise HTTPException(status_code=500, detail="Supabase not configured")
    try:
        return supabase.auth.get_user(token).user
    except:
        raise HTTPException(status_code=401, detail="Invalid token")

# ============================================
# FILE PARSING DEPENDENCIES
# ============================================
try:
    import PyPDF2
    from docx import Document
    import openpyxl
    PDF_SUPPORT = DOCX_SUPPORT = XLSX_SUPPORT = True
except ImportError:
    PDF_SUPPORT = DOCX_SUPPORT = XLSX_SUPPORT = False

def extract_text_from_pdf(content: bytes) -> str:
    if not PDF_SUPPORT:
        return ""
    try:
        text = ""
        for page in PyPDF2.PdfReader(io.BytesIO(content)).pages:
            if page_text := page.extract_text():
                text += page_text + "\n"
        return text
    except:
        return ""

def extract_text_from_docx(content: bytes) -> str:
    if not DOCX_SUPPORT:
        return ""
    try:
        doc = Document(io.BytesIO(content))
        text = "\n".join([p.text for p in doc.paragraphs if p.text])
        for table in doc.tables:
            for row in table.rows:
                if row_text := " ".join([c.text for c in row.cells if c.text]):
                    text += "\n" + row_text
        return text
    except:
        return ""

def extract_text_from_xlsx(content: bytes) -> str:
    if not XLSX_SUPPORT:
        return ""
    try:
        text = ""
        for sheet in openpyxl.load_workbook(io.BytesIO(content), data_only=True).worksheets:
            text += f"\n--- Sheet: {sheet.title} ---\n"
            for row in sheet.iter_rows(values_only=True):
                if row_text := " ".join([str(c) for c in row if c]):
                    text += row_text + "\n"
        return text
    except:
        return ""

def extract_invoice_data(text: str) -> dict:
    if not text or len(text.strip()) < 10:
        return {'vendor': 'Unknown', 'total': 0.0, 'tax': 0.0, 
                'date': datetime.now().strftime('%Y-%m-%d'), 
                'invoiceNumber': f'INV-{datetime.now().strftime("%Y%m%d%H%M%S")}'}
    
    data = {}
    
    for pattern in [r'(?:Vendor|From|Company|Store|Merchant|Seller|Supplier)[:\s]+([^\n]+)', 
                    r'^([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s+Invoice', 
                    r'Bill To:?\s*([^\n]+)']:
        if match := re.search(pattern, text, re.IGNORECASE):
            data['vendor'] = match.group(1).strip()[:100]
            break
    data.setdefault('vendor', 'Unknown')
    
    for pattern in [r'(?:Total|Amount Due|Invoice Total|Grand Total|Balance Due)[:\s]*[\$£€]?\s*([\d,]+\.?\d*)', 
                    r'(?:Total|Amount)[:\s]*[\$£€]?\s*([\d,]+\.?\d*)', 
                    r'[\$£€]\s*([\d,]+\.?\d*)\s*(?:Total|Amount)']:
        if match := re.search(pattern, text, re.IGNORECASE):
            try:
                data['total'] = float(match.group(1).replace(',', ''))
                break
            except:
                continue
    data.setdefault('total', 0.0)
    
    for pattern in [r'(?:Tax|GST|VAT|HST)[:\s]*[\$£€]?\s*([\d,]+\.?\d*)', 
                    r'(?:Sales Tax|Tax Amount)[:\s]*[\$£€]?\s*([\d,]+\.?\d*)']:
        if match := re.search(pattern, text, re.IGNORECASE):
            try:
                data['tax'] = float(match.group(1).replace(',', ''))
                break
            except:
                continue
    data.setdefault('tax', 0.0)
    
    for pattern in [r'(?:Date|Invoice Date|Issue Date|Created)[:\s]+(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})', 
                    r'(?:Date)[:\s]+(\d{4}-\d{2}-\d{2})', 
                    r'(\d{1,2}/\d{1,2}/\d{4})']:
        if match := re.search(pattern, text, re.IGNORECASE):
            data['date'] = match.group(1)
            break
    data.setdefault('date', datetime.now().strftime('%Y-%m-%d'))
    
    for pattern in [r'(?:Invoice|Invoice Number|INV|Bill|Receipt Number)[:\s#]+([A-Z0-9-]+)', 
                    r'Invoice\s*#?\s*([A-Z0-9-]+)', 
                    r'INV-\d+']:
        if match := re.search(pattern, text, re.IGNORECASE):
            data['invoiceNumber'] = match.group(1) if match.groups() else match.group(0)
            break
    data.setdefault('invoiceNumber', f'INV-{datetime.now().strftime("%Y%m%d%H%M%S")}')
    
    return data

# ============================================
# HEALTH & STATUS
# ============================================
@app.get("/")
def root():
    return {"message": "ProphetLedger API is running!", "status": "healthy"}

@app.get("/api/health")
def health():
    return {"status": "healthy", "services": {"supabase": supabase is not None, "groq": groq_client is not None}}

@app.get("/api/models/status")
async def get_model_status():
    return hf_loader.get_model_status()

# ============================================
# INVOICE ENDPOINTS
# ============================================
@app.post("/api/invoices/extract-text")
async def extract_text_only(file: UploadFile = File(...), current_user=Depends(get_current_user)):
    contents = await file.read()
    file_type = file.content_type
    text = ""
    
    if file_type == 'application/pdf':
        text = extract_text_from_pdf(contents)
    elif file_type in ['application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/msword']:
        text = extract_text_from_docx(contents)
    elif file_type in ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-excel']:
        text = extract_text_from_xlsx(contents)
    else:
        text = contents.decode('utf-8', errors='ignore')
    
    if not text or len(text.strip()) < 10:
        raise HTTPException(status_code=400, detail="Could not extract sufficient text")
    
    return {"text": text, "filename": file.filename, "file_type": file_type}

@app.post("/api/invoices/process")
async def process_invoice(file: UploadFile = File(...), extracted_text: str = Form(...), current_user=Depends(get_current_user)):
    extracted_data = extract_invoice_data(extracted_text)
    extracted_data['file_name'] = file.filename
    extracted_data['file_type'] = file.content_type
    return extracted_data

# ============================================
# AUTH ENDPOINTS
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
        raise HTTPException(status_code=500, detail="Supabase not configured")
    try:
        response = supabase.auth.sign_up({
            "email": request.email,
            "password": request.password,
            "options": {"data": {"full_name": request.full_name}}
        })
        return {"message": "User created successfully", "user_id": response.user.id}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/api/auth/login")
async def login(request: LoginRequest):
    if not supabase:
        raise HTTPException(status_code=500, detail="Supabase not configured")
    try:
        response = supabase.auth.sign_in_with_password({"email": request.email, "password": request.password})
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
async def get_current_user_route(current_user=Depends(get_current_user)):
    return {"id": current_user.id, "email": current_user.email, 
            "full_name": current_user.user_metadata.get("full_name", ""), "is_active": True}

# ============================================
# CHATBOT
# ============================================
class ChatRequest(BaseModel):
    query: str

@app.post("/api/chatbot/query")
async def chat(request: ChatRequest):
    if not groq_client:
        return {"query": request.query, "response": "Chatbot unavailable", "intent": "error", "confidence": 0}
    try:
        completion = groq_client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[{"role": "system", "content": "You are a helpful financial assistant."}, 
                      {"role": "user", "content": request.query}],
            temperature=0.7,
            max_tokens=500
        )
        return {"query": request.query, "response": completion.choices[0].message.content, "intent": "llm", "confidence": 0.95}
    except Exception as e:
        return {"query": request.query, "response": str(e), "intent": "error", "confidence": 0}

# ============================================
# RISK SCORE (DYNAMIC)
# ============================================
@app.get("/api/dss/risk/score")
async def get_risk_score(request: Request):
    if not supabase:
        return {"risk_score": 50, "risk_level": "medium", "active_anomalies": 0, "recommendation": "Risk scoring unavailable"}
    
    auth_header = request.headers.get("Authorization")
    if not auth_header:
        return {"risk_score": 50, "risk_level": "medium", "active_anomalies": 0, "recommendation": "Please login"}
    
    token = auth_header.replace("Bearer ", "")
    try:
        user_data = supabase.auth.get_user(token)
        user_id = user_data.user.id
    except:
        return {"risk_score": 50, "risk_level": "medium", "active_anomalies": 0, "recommendation": "Invalid token"}
    
    try:
        anomalies = supabase.table("anomalies").select("status").eq("user_id", user_id).execute().data or []
        pending_count = len([a for a in anomalies if a.get('status') == 'pending'])
        
        if pending_count == 0:
            return {"risk_score": 25, "risk_level": "low", "active_anomalies": 0, "recommendation": "No anomalies detected!"}
        elif pending_count <= 2:
            return {"risk_score": 50, "risk_level": "medium", "active_anomalies": pending_count, 
                    "recommendation": f"Review {pending_count} pending anomaly(s)."}
        else:
            return {"risk_score": 75, "risk_level": "high", "active_anomalies": pending_count, 
                    "recommendation": f"Urgent: Review {pending_count} pending anomalies."}
    except:
        return {"risk_score": 50, "risk_level": "medium", "active_anomalies": 0, "recommendation": "Unable to calculate"}

# ============================================
# KPI
# ============================================
@app.get("/api/dss/kpis")
async def get_kpis(mode: str = "personal"):
    return [
        {"id": 1, "title": "Financial Health", "value": 78, "change": 5.2, "trend": "up", "benchmark": 75, "status": "good", "recommendation": "Keep saving!"},
        {"id": 2, "title": "Cash Runway", "value": 12, "change": -2, "trend": "down", "benchmark": 12, "status": "warning", "recommendation": "Watch spending"},
        {"id": 3, "title": "Burn Rate", "value": 15000, "change": 8, "trend": "up", "benchmark": 10000, "status": "critical", "recommendation": "Cut expenses"},
        {"id": 4, "title": "Savings Rate", "value": 18, "change": 3, "trend": "up", "benchmark": 20, "status": "warning", "recommendation": "Save more"}
    ]

# ============================================
# FORECASTS
# ============================================
@app.get("/api/forecasts/trend/{metric}")
async def get_trend(metric: str, days: int = 90):
    dates = [(datetime.now() - timedelta(days=i)).strftime('%Y-%m-%d') for i in range(days, 0, -1)]
    base = 50000 if metric == "cashflow" else 32000
    values = np.cumsum(np.random.normal(100, 500, days)) + base
    history = [{"date": dates[i], "actual": round(float(values[i]), 2)} for i in range(len(dates))]
    last = values[-1]
    for i in range(1, 31):
        history.append({"date": (datetime.now() + timedelta(days=i)).strftime('%Y-%m-%d'), 
                        "actual": None, "forecast": round(last * (1 + 0.05 * i / 30), 2)})
    return {"metric": metric, "history": history, "anomalies": []}

# ============================================
# ANOMALIES
# ============================================
@app.get("/api/anomalies")
async def get_anomalies(limit: int = 10):
    return [{"id": 1, "date": "2024-05-15", "description": "Amazon Purchase", 
             "amount": 1249.99, "category": "Shopping", "anomaly_score": 92, "status": "pending"}][:limit]

# ============================================
# TRANSACTIONS
# ============================================
@app.get("/api/transactions")
async def get_transactions(limit: int = 50):
    return [
        {"id": 1, "date": "2024-05-15", "description": "Starbucks", "amount": 5.75, "category": "Dining", "type": "expense"},
        {"id": 2, "date": "2024-05-14", "description": "Salary", "amount": 5000, "category": "Income", "type": "income"},
    ][:limit]

# ============================================
# CLASSIFICATION
# ============================================
class TransactionToClassify(BaseModel):
    description: str
    amount: float

@app.post("/api/transactions/classify")
async def classify_transaction(transaction: TransactionToClassify):
    keywords = {
        'Groceries': ['walmart', 'target', 'kroger', 'costco', 'aldi', 'whole foods'],
        'Dining': ['starbucks', 'mcdonalds', 'chipotle', 'restaurant', 'cafe', 'burger', 'pizza'],
        'Transport': ['uber', 'lyft', 'taxi', 'gas', 'shell', 'exxon', 'parking'],
        'Utilities': ['electric', 'water', 'internet', 'phone', 'comcast', 'att', 'verizon'],
        'Entertainment': ['netflix', 'spotify', 'disney', 'hulu', 'cinema', 'movie'],
        'Shopping': ['amazon', 'ebay', 'nike', 'adidas', 'clothing', 'shoes', 'best buy'],
        'Health': ['doctor', 'dental', 'hospital', 'pharmacy', 'gym'],
        'Rent': ['rent', 'apartment', 'lease', 'property'],
        'Income': ['salary', 'payroll', 'deposit', 'freelance', 'payment']
    }
    desc = transaction.description.lower()
    for cat, words in keywords.items():
        if any(w in desc for w in words):
            return {"category": cat, "confidence": 0.7, "method": "keyword"}
    if transaction.amount > 1000:
        return {"category": "Income", "confidence": 0.6, "method": "keyword"}
    return {"category": "Other", "confidence": 0.4, "method": "keyword"}



@app.get("/api/models/status")
async def get_model_status():
    """Get status of all ML models including ARIMA"""
    return hf_loader.get_model_status()