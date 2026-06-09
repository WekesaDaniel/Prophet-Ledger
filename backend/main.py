# backend/app/main.py
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
import os
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

print(f"Supabase configured: {SUPABASE_URL is not None}")
print(f"Groq configured: {GROQ_API_KEY is not None}")
print(f"Models: {hf_loader.get_model_status()}")

# Initialize clients
supabase: Client = create_client(SUPABASE_URL, SUPABASE_ANON_KEY) if SUPABASE_URL and SUPABASE_ANON_KEY else None
groq_client = Groq(api_key=GROQ_API_KEY) if GROQ_API_KEY else None

# ============================================
# FASTAPI APP
# ============================================
app = FastAPI(title="ProphetLedger API", version="1.0.0")

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
# INVOICE TEXT EXTRACTION ENDPOINTS
# ============================================

import re
import io
from fastapi import UploadFile, File, Form

# Try to import optional dependencies for file parsing
try:
    import PyPDF2
    PDF_SUPPORT = True
except ImportError:
    PDF_SUPPORT = False
    print("⚠️ PyPDF2 not installed. PDF support disabled.")

try:
    from docx import Document
    DOCX_SUPPORT = True
except ImportError:
    DOCX_SUPPORT = False
    print("⚠️ python-docx not installed. Word document support disabled.")

try:
    import openpyxl
    XLSX_SUPPORT = True
except ImportError:
    XLSX_SUPPORT = False
    print("⚠️ openpyxl not installed. Excel support disabled.")


def extract_text_from_pdf(file_content: bytes) -> str:
    """Extract text from PDF using PyPDF2"""
    if not PDF_SUPPORT:
        return ""
    try:
        pdf_reader = PyPDF2.PdfReader(io.BytesIO(file_content))
        text = ""
        for page in pdf_reader.pages:
            page_text = page.extract_text()
            if page_text:
                text += page_text + "\n"
        return text
    except Exception as e:
        print(f"PDF extraction error: {e}")
        return ""


def extract_text_from_docx(file_content: bytes) -> str:
    """Extract text from Word document"""
    if not DOCX_SUPPORT:
        return ""
    try:
        doc = Document(io.BytesIO(file_content))
        text = "\n".join([paragraph.text for paragraph in doc.paragraphs if paragraph.text])
        for table in doc.tables:
            for row in table.rows:
                row_text = " ".join([cell.text for cell in row.cells if cell.text])
                if row_text:
                    text += "\n" + row_text
        return text
    except Exception as e:
        print(f"DOCX extraction error: {e}")
        return ""


def extract_text_from_xlsx(file_content: bytes) -> str:
    """Extract text from Excel file"""
    if not XLSX_SUPPORT:
        return ""
    try:
        workbook = openpyxl.load_workbook(io.BytesIO(file_content), data_only=True)
        text = ""
        for sheet_name in workbook.sheetnames:
            sheet = workbook[sheet_name]
            text += f"\n--- Sheet: {sheet_name} ---\n"
            for row in sheet.iter_rows(values_only=True):
                row_text = " ".join([str(cell) for cell in row if cell])
                if row_text:
                    text += row_text + "\n"
        return text
    except Exception as e:
        print(f"XLSX extraction error: {e}")
        return ""


def extract_invoice_data(text: str) -> dict:
    """Extract invoice data using regex patterns"""
    data = {}
    
    if not text or len(text.strip()) < 10:
        return {
            'vendor': 'Unknown',
            'total': 0.0,
            'tax': 0.0,
            'date': datetime.now().strftime('%Y-%m-%d'),
            'invoiceNumber': f'INV-{datetime.now().strftime("%Y%m%d%H%M%S")}'
        }
    
    # Extract vendor name
    vendor_patterns = [
        r'(?:Vendor|From|Company|Store|Merchant|Seller|Supplier)[:\s]+([^\n]+)',
        r'^([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s+Invoice',
        r'Bill To:?\s*([^\n]+)',
    ]
    for pattern in vendor_patterns:
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            data['vendor'] = match.group(1).strip()[:100]
            break
    if 'vendor' not in data:
        data['vendor'] = 'Unknown'

    # Extract total amount
    total_patterns = [
        r'(?:Total|Amount Due|Invoice Total|Grand Total|Balance Due)[:\s]*[\$£€]?\s*([\d,]+\.?\d*)',
        r'(?:Total|Amount)[:\s]*[\$£€]?\s*([\d,]+\.?\d*)',
        r'[\$£€]\s*([\d,]+\.?\d*)\s*(?:Total|Amount)',
    ]
    for pattern in total_patterns:
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            try:
                data['total'] = float(match.group(1).replace(',', ''))
                break
            except:
                continue
    if 'total' not in data:
        data['total'] = 0.0

    # Extract tax
    tax_patterns = [
        r'(?:Tax|GST|VAT|HST)[:\s]*[\$£€]?\s*([\d,]+\.?\d*)',
        r'(?:Sales Tax|Tax Amount)[:\s]*[\$£€]?\s*([\d,]+\.?\d*)'
    ]
    for pattern in tax_patterns:
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            try:
                data['tax'] = float(match.group(1).replace(',', ''))
                break
            except:
                continue
    if 'tax' not in data:
        data['tax'] = 0.0

    # Extract date
    date_patterns = [
        r'(?:Date|Invoice Date|Issue Date|Created)[:\s]+(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})',
        r'(?:Date)[:\s]+(\d{4}-\d{2}-\d{2})',
        r'(\d{1,2}/\d{1,2}/\d{4})',
    ]
    for pattern in date_patterns:
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            data['date'] = match.group(1)
            break
    if 'date' not in data:
        data['date'] = datetime.now().strftime('%Y-%m-%d')

    # Extract invoice number
    inv_patterns = [
        r'(?:Invoice|Invoice Number|INV|Bill|Receipt Number)[:\s#]+([A-Z0-9-]+)',
        r'Invoice\s*#?\s*([A-Z0-9-]+)',
        r'INV-\d+',
    ]
    for pattern in inv_patterns:
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            data['invoiceNumber'] = match.group(1) if match.groups() else match.group(0)
            break
    if 'invoiceNumber' not in data:
        data['invoiceNumber'] = f'INV-{datetime.now().strftime("%Y%m%d%H%M%S")}'

    return data


@app.post("/api/invoices/extract-text")
async def extract_text_only(
    file: UploadFile = File(...),
    current_user = Depends(get_current_user)
):
    """Extract raw text from uploaded file (PDF, DOCX, XLSX)"""
    try:
        contents = await file.read()
        file_type = file.content_type
        text = ""
        
        print(f"Processing file: {file.filename}, Type: {file_type}, Size: {len(contents)} bytes")
        
        if file_type == 'application/pdf':
            text = extract_text_from_pdf(contents)
        elif file_type in [
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/msword'
        ]:
            text = extract_text_from_docx(contents)
        elif file_type in [
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'application/vnd.ms-excel'
        ]:
            text = extract_text_from_xlsx(contents)
        else:
            # Try to decode as plain text
            text = contents.decode('utf-8', errors='ignore')
        
        if not text or len(text.strip()) < 10:
            raise HTTPException(status_code=400, detail="Could not extract sufficient text from file")
        
        print(f"Extracted {len(text)} characters from {file.filename}")
        
        return {"text": text, "filename": file.filename, "file_type": file_type}
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Extraction error: {str(e)}")
        raise HTTPException(status_code=400, detail=f"Failed to extract text: {str(e)}")


@app.post("/api/invoices/process")
async def process_invoice(
    file: UploadFile = File(...),
    extracted_text: str = Form(...),
    current_user = Depends(get_current_user)
):
    """Process extracted text and return structured invoice data"""
    try:
        extracted_data = extract_invoice_data(extracted_text)
        
        extracted_data['file_name'] = file.filename
        extracted_data['file_type'] = file.content_type
        extracted_data['extraction_method'] = 'regex'
        extracted_data['text_length'] = len(extracted_text)
        
        print(f"Successfully extracted: Vendor={extracted_data['vendor']}, Total={extracted_data['total']}")
        
        return extracted_data
        
    except Exception as e:
        print(f"Processing error: {str(e)}")
        raise HTTPException(status_code=400, detail=f"Failed to process invoice data: {str(e)}")
# ============================================
# HEALTH & MODEL STATUS
# ============================================
@app.get("/")
def root():
    return {"message": "ProphetLedger API is running on Vercel!", "status": "healthy", "version": "1.0.0"}

@app.get("/api/health")
def health():
    return {
        "status": "healthy",
        "services": {"supabase": supabase is not None, "groq": groq_client is not None},
        "environment": "production"
    }

@app.get("/api/models/status")
async def get_model_status():
    return hf_loader.get_model_status()

@app.get("/api/models/health")
async def models_health():
    status = hf_loader.get_model_status()
    all_loaded = status.get("isolation_forest", False) and status.get("scaler", False)
    return {"status": "healthy" if all_loaded else "degraded", "models": status}

# ============================================
# AUTH PYDANTIC MODELS
# ============================================
class LoginRequest(BaseModel):
    email: str
    password: str

class RegisterRequest(BaseModel):
    email: str
    full_name: str
    password: str

class ResendVerificationRequest(BaseModel):
    email: str

# ============================================
# AUTH ENDPOINTS
# ============================================
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
        
        if response.user and not response.user.confirmed_at:
            return {
                "success": True,
                "message": "Registration successful! Please check your email to confirm your account.",
                "user_id": response.user.id,
                "requires_confirmation": True
            }
        
        return {
            "success": True,
            "message": "User created successfully",
            "user_id": response.user.id,
            "requires_confirmation": False
        }
    except Exception as e:
        error_msg = str(e)
        if "User already registered" in error_msg:
            raise HTTPException(status_code=400, detail="Email already registered. Please login or reset password.")
        raise HTTPException(status_code=400, detail=error_msg)

@app.post("/api/auth/login")
async def login(request: LoginRequest):
    if not supabase:
        raise HTTPException(status_code=500, detail="Supabase not configured")
    
    try:
        response = supabase.auth.sign_in_with_password({
            "email": request.email,
            "password": request.password
        })
        
        if response.user and not response.user.confirmed_at:
            raise HTTPException(
                status_code=401,
                detail="Please verify your email address before logging in. Check your inbox for the confirmation link."
            )
        
        return {
            "success": True,
            "access_token": response.session.access_token,
            "token_type": "bearer",
            "user": {
                "id": response.user.id,
                "email": response.user.email,
                "full_name": response.user.user_metadata.get("full_name", ""),
                "role": "user",
                "mode_preference": "personal",
                "email_confirmed": response.user.confirmed_at is not None
            }
        }
    except Exception as e:
        error_msg = str(e)
        if "Invalid login credentials" in error_msg:
            raise HTTPException(
                status_code=401,
                detail="Invalid email or password. If you just registered, please verify your email first."
            )
        raise HTTPException(status_code=401, detail=error_msg)

@app.get("/api/auth/me")
async def get_current_user(request: Request):
    if not supabase:
        raise HTTPException(status_code=500, detail="Supabase not configured")
    
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
            "is_active": True,
            "email_confirmed": user.user.confirmed_at is not None
        }
    except Exception as e:
        raise HTTPException(status_code=401, detail="Invalid token")

@app.post("/api/auth/resend-verification")
async def resend_verification(request: ResendVerificationRequest):
    if not supabase:
        raise HTTPException(status_code=500, detail="Supabase not configured")
    
    try:
        user_response = supabase.auth.admin.get_user_by_email(request.email)
        if not user_response.user:
            raise HTTPException(status_code=404, detail="User not found")
        
        supabase.auth.sign_up({
            "email": request.email,
            "password": "temp_resend_password",
            "options": {"email_redirect_to": "https://prophet-ledger.vercel.app/login"}
        })
        
        return {"success": True, "message": "Verification email sent successfully"}
    except Exception as e:
        error_msg = str(e)
        print(f"Resend verification error: {error_msg}")
        if "User already registered" in error_msg or "already exists" in error_msg:
            return {"success": True, "message": "If your email is registered, a verification link has been sent"}
        raise HTTPException(status_code=400, detail=str(e))

# ============================================
# ANOMALY DETECTION
# ============================================
class TransactionForDetection(BaseModel):
    amount: float
    frequency: Optional[int] = 1

@app.post("/api/anomalies/detect")
async def detect_anomaly(transaction: TransactionForDetection):
    model = hf_loader.load_isolation_forest()
    scaler = hf_loader.load_scaler()
    
    if model is None or scaler is None:
        is_anomaly = transaction.amount > 1000
        return {
            "is_anomaly": is_anomaly,
            "anomaly_score": 0.8 if is_anomaly else 0.2,
            "reason": "Amount unusually high" if is_anomaly else "Normal transaction",
            "method": "fallback"
        }
    
    try:
        features = np.array([[transaction.amount, transaction.frequency]])
        features_scaled = scaler.transform(features)
        prediction = model.predict(features_scaled)
        score = model.score_samples(features_scaled)[0]
        is_anomaly = prediction[0] == -1
        anomaly_score = max(0, min(100, (1 - score) * 100))
        
        return {
            "is_anomaly": is_anomaly,
            "anomaly_score": round(anomaly_score, 2),
            "reason": "Transaction detected as anomalous" if is_anomaly else "Transaction appears normal",
            "method": "isolation_forest"
        }
    except Exception as e:
        return {"is_anomaly": False, "anomaly_score": 0, "reason": f"Error: {str(e)}", "method": "error"}

@app.get("/api/anomalies")
async def get_anomalies(limit: int = 10):
    return [{"id": 1, "date": "2024-05-15", "description": "Amazon Purchase", "amount": 1249.99, "category": "Shopping", "anomaly_score": 92, "status": "pending"}][:limit]

# ============================================
# TRANSACTION CLASSIFICATION
# ============================================
class TransactionToClassify(BaseModel):
    description: str
    amount: float

@app.post("/api/transactions/classify")
async def classify_transaction(transaction: TransactionToClassify):
    model, tokenizer, label_encoder = hf_loader.load_bert_classifier()
    
    if model is None or tokenizer is None:
        return _fallback_classify(transaction.description, transaction.amount)
    
    try:
        import torch
        inputs = tokenizer(transaction.description.lower(), return_tensors="pt", truncation=True, max_length=64, padding=True)
        with torch.no_grad():
            outputs = model(**inputs)
        
        pred = torch.argmax(outputs.logits, dim=1).item()
        confidence = float(torch.softmax(outputs.logits, dim=1).max().item())
        category = label_encoder.inverse_transform([pred])[0] if label_encoder else f"class_{pred}"
        
        return {"category": category, "confidence": round(confidence, 2), "method": "bert"}
    except Exception as e:
        return _fallback_classify(transaction.description, transaction.amount)

def _fallback_classify(description: str, amount: float) -> dict:
    description_lower = description.lower()
    
    keywords = {
        'Groceries': ['walmart', 'target', 'kroger', 'safeway', 'costco', 'aldi', 'trader joe', 'whole foods', 'cvs'],
        'Dining': ['starbucks', 'mcdonalds', 'chipotle', 'restaurant', 'cafe', 'burger', 'pizza'],
        'Transport': ['uber', 'lyft', 'taxi', 'gas', 'shell', 'exxon', 'parking'],
        'Utilities': ['electric', 'water', 'internet', 'phone', 'comcast', 'att', 'verizon'],
        'Entertainment': ['netflix', 'spotify', 'disney', 'hulu', 'cinema', 'movie'],
        'Shopping': ['amazon', 'ebay', 'nike', 'adidas', 'clothing', 'shoes', 'best buy'],
        'Health': ['doctor', 'dental', 'hospital', 'pharmacy', 'gym'],
        'Rent': ['rent', 'apartment', 'lease', 'property'],
        'Income': ['salary', 'payroll', 'deposit', 'freelance', 'payment']
    }
    
    for category, words in keywords.items():
        if any(word in description_lower for word in words):
            confidence = 0.85 if amount > 1000 and category == 'Income' else 0.7
            return {"category": category, "confidence": confidence, "method": "keyword"}
    
    if amount > 1000:
        return {"category": "Income", "confidence": 0.6, "method": "keyword"}
    return {"category": "Other", "confidence": 0.4, "method": "keyword"}

# ============================================
# CHATBOT ENDPOINT
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
                {"role": "system", "content": "You are a helpful financial assistant for ProphetLedger. Help users with their financial questions about spending, balance, forecasts, and anomalies. Keep responses concise and actionable."},
                {"role": "user", "content": request.query}
            ],
            temperature=0.7,
            max_tokens=500
        )
        return {"query": request.query, "response": completion.choices[0].message.content, "intent": "llm", "confidence": 0.95}
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
# TRANSACTIONS
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
# FORECASTS
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
# KPI & DSS
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
# INVOICES
# ============================================
@app.post("/api/invoices/scan")
async def scan_invoice():
    return {"message": "Invoice scanned", "vendor": "Sample Vendor", "total": 125.50, "date": "2024-05-15"}

@app.get("/api/invoices")
async def get_invoices():
    return [{"id": 1, "vendor": "Amazon", "amount": 1249.99, "date": "2024-05-15", "status": "paid"}]


# Add these endpoints to your main.py

# ============================================
# ANOMALY DETECTION ENDPOINTS
# ============================================
@app.get("/api/anomalies")
async def get_anomalies(request: Request, limit: int = 50):
    """Get anomalies for current user"""
    if not supabase:
        raise HTTPException(status_code=500, detail="Supabase not configured")
    
    auth_header = request.headers.get("Authorization")
    if not auth_header:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    token = auth_header.replace("Bearer ", "")
    try:
        user = supabase.auth.get_user(token)
        
        # Fetch from database
        response = supabase.table("anomalies")\
            .select("*")\
            .eq("user_id", user.user.id)\
            .order("created_at", desc=True)\
            .limit(limit)\
            .execute()
        
        if response.data:
            return response.data
        else:
            # Return mock data for testing
            return [
                {"id": "1", "date": "2024-05-15", "description": "Amazon Purchase", "amount": 1249.99, 
                 "category": "Shopping", "anomaly_score": 92, "status": "pending", "reason": "3x above normal spending"},
                {"id": "2", "date": "2024-05-10", "description": "Uber Rides", "amount": 187.50, 
                 "category": "Transport", "anomaly_score": 78, "status": "pending", "reason": "Unusual frequency of rides"},
            ]
    except Exception as e:
        print(f"Error fetching anomalies: {e}")
        return []

@app.post("/api/anomalies/{anomaly_id}/review")
async def review_anomaly(anomaly_id: str, request: Request):
    """Mark anomaly as reviewed"""
    if not supabase:
        raise HTTPException(status_code=500, detail="Supabase not configured")
    
    auth_header = request.headers.get("Authorization")
    if not auth_header:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    token = auth_header.replace("Bearer ", "")
    try:
        user = supabase.auth.get_user(token)
        
        supabase.table("anomalies")\
            .update({"status": "reviewed", "reviewed_at": datetime.now().isoformat(), "reviewed_by": user.user.id})\
            .eq("id", anomaly_id)\
            .eq("user_id", user.user.id)\
            .execute()
        
        return {"success": True, "message": "Anomaly reviewed"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

# ============================================
# RISK SCORE ENDPOINTS
# ============================================
@app.get("/api/dss/risk/score")
async def get_risk_score(request: Request):
    """Get user's risk score"""
    model = hf_loader.load_isolation_forest()
    scaler = hf_loader.load_scaler()
    
    # Calculate risk score (simplified)
    risk_score = 68
    risk_level = "medium"
    
    if model and scaler:
        # Use ML model for more accurate scoring
        pass
    
    return {
        "risk_score": risk_score,
        "risk_level": risk_level,
        "active_anomalies": 2,
        "recommendation": "Review pending anomalies",
        "trend": "improving"
    }

# ============================================
# KPI ENDPOINTS
# ============================================
@app.get("/api/dss/kpis")
async def get_kpis(request: Request, mode: str = "personal"):
    """Get KPI data based on user mode"""
    return [
        {"id": 1, "title": "Financial Health", "value": 78, "change": 5.2, "trend": "up", 
         "benchmark": 75, "status": "good", "recommendation": "Keep saving!"},
        {"id": 2, "title": "Cash Runway", "value": 12, "change": -2, "trend": "down", 
         "benchmark": 12, "status": "warning", "recommendation": "Watch spending"},
        {"id": 3, "title": "Burn Rate", "value": 15000, "change": 8, "trend": "up", 
         "benchmark": 10000, "status": "critical", "recommendation": "Cut expenses"},
        {"id": 4, "title": "Savings Rate", "value": 18, "change": 3, "trend": "up", 
         "benchmark": 20, "status": "warning", "recommendation": "Save more"}
    ][:4]

# ============================================
# RISK HEATMAP ENDPOINTS
# ============================================
@app.get("/api/dss/risk/heatmap")
async def get_risk_heatmap(request: Request):
    """Get risk heatmap data by category"""
    return [
        {"name": "Groceries", "risk": 25, "amount": 450, "status": "low"},
        {"name": "Dining", "risk": 65, "amount": 780, "status": "medium"},
        {"name": "Transport", "risk": 35, "amount": 320, "status": "low"},
        {"name": "Shopping", "risk": 85, "amount": 1250, "status": "high"},
        {"name": "Entertainment", "risk": 45, "amount": 280, "status": "medium"},
        {"name": "Utilities", "risk": 15, "amount": 350, "status": "low"},
        {"name": "Health", "risk": 55, "amount": 180, "status": "medium"},
        {"name": "Rent", "risk": 10, "amount": 1500, "status": "low"},
        {"name": "Income", "risk": 5, "amount": 5000, "status": "low"}
    ]

# ============================================
# ALERTS ENDPOINTS
# ============================================
@app.get("/api/alerts")
async def get_alerts(request: Request):
    """Get user alerts"""
    return [
        {"id": 1, "title": "Welcome to ProphetLedger!", "message": "Start by uploading your first invoice", 
         "severity": "info", "read": False, "created_at": datetime.now().isoformat()}
    ]

@app.post("/api/alerts/{alert_id}/read")
async def mark_alert_read(alert_id: str, request: Request):
    """Mark alert as read"""
    return {"success": True}

# ============================================
# TRANSACTION CLASSIFICATION (Groq + HF Fallback)
# ============================================
class TransactionToClassify(BaseModel):
    description: str
    amount: float

@app.post("/api/transactions/classify")
async def classify_transaction(transaction: TransactionToClassify):
    """Classify transaction using Groq with Hugging Face fallback"""
    
    # Try Hugging Face Inference API first
    hf_result = hf_loader.classify_with_hf_inference(transaction.description)
    if hf_result:
        return hf_result
    
    # Fallback to Groq
    if groq_client:
        try:
            completion = groq_client.chat.completions.create(
                model="llama-3.3-70b-versatile",
                messages=[
                    {"role": "system", "content": "Categorize the transaction into: Groceries, Dining, Transport, Utilities, Entertainment, Shopping, Health, Rent, Income, Other. Return ONLY the category name."},
                    {"role": "user", "content": f"Transaction: {transaction.description}, Amount: ${transaction.amount}"}
                ],
                temperature=0.3,
                max_tokens=20
            )
            category = completion.choices[0].message.content.strip()
            valid_categories = ['Groceries', 'Dining', 'Transport', 'Utilities', 'Entertainment', 'Shopping', 'Health', 'Rent', 'Income', 'Other']
            if category not in valid_categories:
                category = 'Other'
            return {"category": category, "confidence": 0.85, "method": "groq"}
        except Exception as e:
            print(f"Groq error: {e}")
    
    # Final fallback to keyword matching
    return _fallback_classify(transaction.description, transaction.amount)

def _fallback_classify(description: str, amount: float) -> dict:
    description_lower = description.lower()
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
    for category, words in keywords.items():
        if any(word in description_lower for word in words):
            return {"category": category, "confidence": 0.7, "method": "keyword"}
    if amount > 1000:
        return {"category": "Income", "confidence": 0.6, "method": "keyword"}
    return {"category": "Other", "confidence": 0.4, "method": "keyword"}