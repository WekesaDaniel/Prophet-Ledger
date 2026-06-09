<div align="center">
  
  <img src="https://img.shields.io/badge/version-1.0.0-blue.svg" alt="Version">
  <img src="https://img.shields.io/badge/python-3.11+-green.svg" alt="Python">
  <img src="https://img.shields.io/badge/react-18.2.0-61dafb.svg" alt="React">
  <img src="https://img.shields.io/badge/fastapi-0.104.1-009688.svg" alt="FastAPI">
  <img src="https://img.shields.io/badge/license-MIT-purple.svg" alt="License">
  <img src="https://img.shields.io/badge/branch-dev-orange.svg" alt="Branch">
  
  <h1>🔮 ProphetLedger</h1>
  <h3>AI-Driven Financial Intelligence Platform</h3>
  <p><em>Personal · Small Business · Enterprise</em></p>
  
  <p>
    <strong>Scan. Predict. Profit.</strong>
  </p>
  
</div>

---

## 📖 Table of Contents

- [Project Status](#-project-status)
- [Team & Responsibilities](#-team--responsibilities)
- [File Structure](#-file-structure)
- [Recent Updates](#-recent-updates)
- [Hardcoded Values Guide](#-hardcoded-values-guide)
- [Development Setup](#-development-setup)
- [Quick Start](#-quick-start)
- [API Integration Guide](#-api-integration-guide)
- [Git Workflow](#-git-workflow)
- [Deployment](#-deployment)

---

## 🚦 Project Status

| Component | Status | Owner | Hardcoded Location |
|-----------|--------|-------|---------------------|
| KPI Grid | ✅ API Integrated | 🧠 Daniel | Real-time from DB |
| Trend Chart | ✅ Mock Data Ready | 👤 Josiah | `MOCK_TREND_DATA` |
| Anomaly Table | ✅ API Integrated | 🔒 Arnold | Real-time from DB |
| Chatbot | ✅ AI-Powered | 💬 Geoffrey | Groq + User Data |
| PDF Scanner | ✅ Working | 🧠 Daniel | OCR + Extraction |
| Transaction Form | ✅ API Integrated | 🧠 Daniel | Supabase CRUD |
| Scenario Simulator | ✅ Mock Ready | 🧠 Daniel | `results` |
| Recommendation Panel | ✅ AI-Powered | 🧠 Daniel | Groq + User Data |
| Alert Center | ✅ Real-time | 🔒 Arnold | Supabase Alerts |
| Risk Heatmap | ✅ API Integrated | 🧠 Daniel | Real-time from DB |
| Invoice List | ✅ API Integrated | 🧠 Daniel | Supabase Storage |

---

## 👥 Team & Responsibilities

### 🧠 Daniel (Lead Architect / DSS / UI)

| Component | File Path | Status | API Endpoint |
|-----------|-----------|--------|--------------|
| KPI Grid | `src/components/dashboard/KpiGrid.jsx` | ✅ Live | `GET /api/dss/kpis` |
| Risk Heatmap | `src/components/dashboard/RiskHeatmap.jsx` | ✅ Live | `GET /api/dss/risk/heatmap` |
| Recommendation Panel | `src/components/dashboard/RecommendationPanel.jsx` | ✅ AI | `POST /api/chatbot/query` |
| Scenario Simulator | `src/components/dss/ScenarioSimulator.jsx` | ⚠️ Mock | `POST /api/dss/what-if` |
| Score Meter | `src/components/dss/ScoreMeter.jsx` | ⚠️ Mock | `GET /api/dss/risk/score` |
| PDF Uploader | `src/components/invoices/PDFUploader.jsx` | ✅ Live | Supabase Storage |
| Invoice List | `src/components/invoices/InvoiceList.jsx` | ✅ Live | `GET /api/invoices` |
| Transaction Form | `src/components/transactions/TransactionForm.jsx` | ✅ Live | Supabase CRUD |
| Transaction List | `src/components/transactions/TransactionList.jsx` | ✅ Live | `GET /api/transactions` |
| Layout | `src/components/layout/Layout.jsx` | ✅ Complete | Persistent sidebar |
| Sidebar | `src/components/layout/Sidebar.jsx` | ✅ Complete | Navigation |
| Alert Center | `src/components/dashboard/AlertCenter.jsx` | ✅ Live | Supabase Alerts |

### 👤 Josiah (AI/ML - Forecasting)

| Component | File Path | Status | API Endpoint |
|-----------|-----------|--------|--------------|
| Trend Chart | `src/components/dashboard/TrendChart.jsx` | ⚠️ Mock | `GET /api/forecasts/trend` |
| Forecast Service | `src/services/forecastService.js` | ⚠️ Mock | `GET /api/forecasts/predict` |

### 💬 Geoffrey (NLP & Chatbot)

| Component | File Path | Status | API Endpoint |
|-----------|-----------|--------|--------------|
| Chatbot | `src/components/chat/Chatbot.jsx` | ✅ AI | `POST /api/chatbot/query` |
| Chat Service | `src/services/chatService.js` | ✅ AI | Groq + User Data |
| Scoring Engine | `backend/app/services/dss/scoring_engine.py` | ⚠️ Mock | N/A - ML model |

### 🔒 Arnold (Security & Anomaly)

| Component | File Path | Status | API Endpoint |
|-----------|-----------|--------|--------------|
| Anomaly Table | `src/components/dashboard/AnomalyTable.jsx` | ✅ Live | `GET /api/anomalies` |
| Alert Center | `src/components/dashboard/AlertCenter.jsx` | ✅ Live | `GET /api/alerts` |
| Auth Middleware | `backend/app/middleware/auth.py` | ✅ Complete | JWT validation |
| Audit Logs | `backend/app/middleware/audit.py` | ✅ Complete | Request logging |

---

## 📁 Complete File Structure
prophetledger/
│
├── backend/
│ ├── app/
│ │ ├── main.py # FastAPI entry point
│ │ ├── config.py # Configuration
│ │ ├── database.py # DB connection
│ │ │
│ │ ├── api/
│ │ │ ├── auth.py # 🔒 Arnold (JWT, login, register)
│ │ │ ├── users.py # 🔒 Arnold (user management)
│ │ │ ├── transactions.py # 🧠 Daniel (CRUD)
│ │ │ ├── invoices.py # 🧠 Daniel (PDF processing)
│ │ │ ├── forecasts.py # 👤 Josiah (predictions)
│ │ │ ├── anomalies.py # 🔒 Arnold (fraud detection)
│ │ │ ├── chatbot.py # 💬 Geoffrey (Groq API)
│ │ │ └── dss.py # 🧠 Daniel (decision support)
│ │ │
│ │ ├── services/
│ │ │ ├── scanner.py # 🧠 Daniel (PDF extraction)
│ │ │ ├── forecast.py # 👤 Josiah (ARIMA/LSTM)
│ │ │ ├── anomaly.py # 🔒 Arnold (Isolation Forest)
│ │ │ ├── chatbot.py # 💬 Geoffrey (NLP + classification)
│ │ │ ├── hf_model_loader.py # 🧠 Daniel (Hugging Face)
│ │ │ │
│ │ │ └── dss/ # 🧠 Daniel
│ │ │ ├── risk_engine.py
│ │ │ ├── kpi_engine.py
│ │ │ ├── alert_engine.py
│ │ │ └── what_if_evaluator.py
│ │ │
│ │ └── middleware/ # 🔒 Arnold
│ │ ├── auth.py
│ │ └── audit.py
│ │
│ ├── requirements.txt
│ ├── Dockerfile
│ └── .env
│
└── frontend/
└── src/
├── App.js # Routing with Layout
├── index.js
├── index.css
│
├── contexts/
│ ├── AuthContext.jsx # Supabase auth
│ └── ModeContext.jsx # Mode & currency
│
├── pages/
│ ├── Login.jsx
│ ├── Register.jsx
│ ├── ModeSelector.jsx
│ ├── Dashboard.jsx
│ ├── Transactions.jsx
│ ├── Invoices.jsx
│ ├── Forecasts.jsx
│ ├── Anomalies.jsx
│ ├── DSS.jsx
│ ├── Reports.jsx
│ ├── Settings.jsx
│ └── Admin.jsx
│
├── components/
│ ├── layout/
│ │ ├── Layout.jsx ✅ Persistent sidebar
│ │ ├── Header.jsx
│ │ └── Sidebar.jsx ✅ Navigation
│ │
│ ├── dashboard/
│ │ ├── KpiGrid.jsx ✅ Live data
│ │ ├── RiskHeatmap.jsx ✅ Live data
│ │ ├── TrendChart.jsx ⚠️ Mock
│ │ ├── AnomalyTable.jsx ✅ Live + limits
│ │ ├── AlertCenter.jsx ✅ Live + auto-create
│ │ └── RecommendationPanel.jsx ✅ AI-powered
│ │
│ ├── dss/
│ │ ├── ScenarioSimulator.jsx ⚠️ Mock
│ │ └── ScoreMeter.jsx ⚠️ Mock
│ │
│ ├── invoices/
│ │ ├── PDFUploader.jsx ✅ OCR + Supabase
│ │ └── InvoiceList.jsx ✅ Live data
│ │
│ ├── transactions/
│ │ ├── TransactionForm.jsx ✅ Supabase CRUD
│ │ └── TransactionList.jsx ✅ Live data
│ │
│ ├── chat/
│ │ └── Chatbot.jsx ✅ AI-powered + page-aware
│ │
│ └── shared/
│ ├── PrivateRoute.jsx
│ ├── LoadingSpinner.jsx
│ └── ErrorBoundary.jsx
│
├── services/
│ ├── api.js
│ ├── authService.js
│ ├── chatService.js ✅ Groq + user context
│ ├── dssService.js
│ ├── forecastService.js
│ ├── anomalyService.js
│ ├── uploadService.js ✅ File uploads
│ └── supabaseClient.js
│
├── hooks/
│ ├── useAuth.js
│ └── useDSS.js
│
└── utils/
├── formatters.js
└── charts.js

Legend:
✅ = Production-ready / API integrated
⚠️ = Contains mock data needing integration
🔧 = In progress

text

---

## 🆕 Recent Updates

| Date | Component | Change | Owner |
|------|-----------|--------|-------|
| June 2024 | Alert Center | Auto-create alerts from anomalies & limits | 🔒 Arnold |
| June 2024 | Anomaly Table | Limit-based anomaly detection | 🔒 Arnold |
| June 2024 | Chatbot | Page-aware responses + user data access | 💬 Geoffrey |
| June 2024 | Recommendation Panel | AI-powered via Groq | 🧠 Daniel |
| June 2024 | PDF Uploader | OCR + multi-format support | 🧠 Daniel |
| June 2024 | KPI Grid | Real-time database integration | 🧠 Daniel |
| June 2024 | Risk Heatmap | Live transaction analysis | 🧠 Daniel |
| June 2024 | Hugging Face Integration | Model hosting | 🧠 Daniel |

---

## 🔧 Hardcoded Values Guide

### How to Identify Hardcoded Values

Look for these patterns in the code:

```javascript
// 🔴 HARDCODED - Replace with API call
const MOCK_DATA = [...] 

// 🔴 HARDCODED - Replace with actual extracted data
const extractedData = { ... }

// ✅ TO DO: Uncomment when API is ready
// const response = await api.get('/endpoint')
API Integration Checklist
For 🧠 Daniel:

KpiGrid.jsx - Integrated with Supabase

RiskHeatmap.jsx - Integrated with Supabase

RecommendationPanel.jsx - AI-powered

PDFUploader.jsx - OCR + Supabase

InvoiceList.jsx - Supabase CRUD

TransactionForm.jsx - Supabase CRUD

TransactionList.jsx - Supabase CRUD

ScenarioSimulator.jsx - Needs API

For 👤 Josiah:

TrendChart.jsx - Needs forecast API

forecastService.js - Needs ML models

For 💬 Geoffrey:

Chatbot.jsx - Groq API integrated

chatService.js - User context aware

For 🔒 Arnold:

AnomalyTable.jsx - Supabase + limits

AlertCenter.jsx - Auto-create alerts

auth.py - JWT validation

🚀 Development Setup
Prerequisites
Python 3.11+

Node.js 18+

PostgreSQL 15+ (or SQLite for development)

Git

Tesseract OCR (for image invoice scanning)

Quick Start
bash
# Clone and switch to dev branch
git clone https://github.com/WekesaDanielJkuat/ProphetLedger.git
cd ProphetLedger
git checkout dev

# Backend setup
cd backend
python -m venv venv
# Windows
venv\Scripts\activate
# Mac/Linux
source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000

# Frontend setup (new terminal)
cd frontend
npm install
npm install tesseract.js  # For OCR
npm start
Environment Variables
Backend (.env in /backend)

env
DATABASE_URL=postgresql://postgres:secret@localhost:5432/prophetledger
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
GROQ_API_KEY=your_groq_api_key
HF_TOKEN=your_huggingface_token
SECRET_KEY=your-secret-key-here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
Frontend (.env in /frontend)

env
REACT_APP_API_URL=http://localhost:8000/api
REACT_APP_SUPABASE_URL=your_supabase_url
REACT_APP_SUPABASE_ANON_KEY=your_supabase_anon_key
Verify Installation
Service	URL	Expected
Backend API	http://localhost:8000	{"message":"ProphetLedger API is running!"}
API Docs	http://localhost:8000/docs	Swagger UI
Frontend	http://localhost:3000	Login page
Health Check	http://localhost:8000/health	{"status":"healthy"}
🤖 Chatbot Page Awareness
The chatbot now understands which page you're on and provides context-aware responses:

Page	Chatbot Knows	Example Response
Dashboard	Key metrics, KPIs, anomalies	"Your financial health score is 78. You have 2 pending anomalies."
Transactions	Recent transactions, spending patterns	"You've spent $3,247 this month. Dining is your top category."
Invoices	Uploaded invoices, scan status	"You have 5 invoices. The latest is from Amazon for $1,249."
Forecasts	Prediction data, trends	"Your cash flow is projected to increase by 8% next month."
Anomalies	Detected anomalies, risk scores	"You have 2 pending anomalies. One is an Amazon purchase for $1,249."
DSS	Risk scores, what-if scenarios	"Your risk score is 68 (medium). Review pending anomalies."
Settings	User preferences, currency	"Your currency is set to USD. Dark mode is enabled."
🔌 API Integration Guide
Step-by-Step to Replace Hardcoded Data
Find the hardcoded section (look for 🔴 comments)

Uncomment the API call (look for ✅ TODO comments)

Comment out or delete the mock data

Test the integration

Example Transformation
javascript
// BEFORE (Hardcoded)
const MOCK_DATA = [...]
setData(MOCK_DATA);

// AFTER (API-integrated)
const response = await api.get('/endpoint');
setData(response.data);
Key API Endpoints
Method	Endpoint	Description
POST	/api/auth/register	User registration
POST	/api/auth/login	User login
GET	/api/auth/me	Get current user
GET	/api/dss/kpis	Get KPI data
GET	/api/dss/risk/heatmap	Risk heatmap
GET	/api/forecasts/trend/{metric}	Forecast data
GET	/api/anomalies	Anomalies list
POST	/api/anomalies/detect	ML anomaly detection
POST	/api/chatbot/query	Groq AI chat
POST	/api/invoices/extract-text	PDF text extraction
POST	/api/invoices/process	Invoice processing
GET	/api/invoices	Invoice list
POST	/api/transactions	Add transaction
GET	/api/transactions	Transaction list
GET	/api/alerts	User alerts
POST	/api/alerts/{id}/read	Mark alert read
🔀 Git Workflow
Branch Strategy
text
main                    # Production (stable)
  └── dev               # Development integration
       ├── feature/dss-daniel      # Daniel's DSS features
       ├── feature/forecast-josiah # Josiah's forecasting
       ├── feature/chatbot-geoffrey # Geoffrey's chatbot
       └── feature/security-arnold # Arnold's security
Daily Workflow
bash
# 1. Always start from updated dev
git checkout dev
git pull origin dev

# 2. Create your feature branch
git checkout -b feature/your-name-feature-name

# 3. Make changes and commit
git add .
git commit -m "feat: add component"

# 4. Push your branch
git push origin feature/your-name-feature-name

# 5. Create Pull Request
Commit Convention
Type	Description
feat:	New feature
fix:	Bug fix
docs:	Documentation
style:	Formatting
refactor:	Code restructure
test:	Add tests
chore:	Maintenance
🚢 Deployment
Backend (Vercel)
bash
cd backend
vercel --prod
Frontend (Vercel)
bash
cd frontend
vercel --prod
Environment Variables in Vercel
Variable	Purpose
SUPABASE_URL	Database connection
SUPABASE_ANON_KEY	Supabase auth
GROQ_API_KEY	AI chatbot
HF_TOKEN	Hugging Face models
📝 Code Review Checklist
All hardcoded sections marked with 🔴 comments

API integration sections marked with ✅ TODO

Component handles loading and error states

Follows project structure

No console errors or warnings

📄 License
MIT License - see LICENSE file for details.

<div align="center">
Made by the ProphetLedger Team

Daniel (Lead/DSS)	Josiah (AI/ML)	Arnold (Security)
Report Bug ·
Request Feature ·
Dev Branch

</div> ```