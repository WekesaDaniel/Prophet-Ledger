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

##  Table of Contents

- [Project Status](#-project-status)
- [Team & Responsibilities](#-team--responsibilities)
- [File Structure](#-file-structure)
- [Hardcoded Values Guide](#-hardcoded-values-guide)
- [Development Setup](#-development-setup)
- [Quick Start](#-quick-start)
- [API Integration Guide](#-api-integration-guide)
- [Git Workflow](#-git-workflow)

---

##  Project Status

| Component | Status | Owner | Hardcoded Location |
|-----------|--------|-------|---------------------|
| KPI Grid |  Mock Data Ready | Daniel | `MOCK_KPIS` in KpiGrid.jsx |
| Trend Chart |  Mock Data Ready |  Josiah | `MOCK_TREND_DATA` in TrendChart.jsx |
| Anomaly Table |  Mock Data Ready |  Arnold | `MOCK_ANOMALIES` in AnomalyTable.jsx |
| Chatbot |  Mock Responses Ready |  Geoffrey | `MOCK_RESPONSES` in Chatbot.jsx |
| PDF Scanner |  Mock Extraction Ready |  Daniel | `extractedData` in PDFUploader.jsx |
| Transaction Form |  Mock Submit Ready |  Daniel | `console.log` in TransactionForm.jsx |
| Scenario Simulator |  Mock Results Ready |  Daniel | `results` in ScenarioSimulator.jsx |
| Sidebar Navigation |  Complete |  Daniel | NavLinks configured |
| Layout Component |  Complete |  Daniel | Persistent sidebar layout |
| Invoice List |  Mock Data Ready |  Daniel | `MOCK_INVOICES` in InvoiceList.jsx |

---

##  Team & Responsibilities

###  Daniel (Lead Architect / DSS / UI)

| Component | File Path | Hardcoded Section | Future API Endpoint |
|-----------|-----------|-------------------|---------------------|
| KPI Grid | `src/components/dashboard/KpiGrid.jsx` | `MOCK_KPIS` | `GET /api/dss/kpis?mode={mode}` |
| Risk Heatmap | `src/components/dashboard/RiskHeatmap.jsx` | `mockRiskData` | `GET /api/dss/risk/heatmap` |
| Scenario Simulator | `src/components/dss/ScenarioSimulator.jsx` | `results` | `POST /api/dss/what-if/evaluate` |
| Score Meter | `src/components/dss/ScoreMeter.jsx` | `score` | `GET /api/dss/risk/score` |
| PDF Uploader | `src/components/invoices/PDFUploader.jsx` | `extractedData` | `POST /api/invoices/scan` |
| Invoice List | `src/components/invoices/InvoiceList.jsx` | `mockInvoices` | `GET /api/invoices` |
| Transaction Form | `src/components/transactions/TransactionForm.jsx` | `console.log` | `POST /api/transactions` |
| Transaction List | `src/components/transactions/TransactionList.jsx` | `mockTransactions` | `GET /api/transactions` |
| Layout | `src/components/layout/Layout.jsx` | N/A | Persistent sidebar wrapper |
| Sidebar | `src/components/layout/Sidebar.jsx` | `navItems` | Navigation routes |

###  Josiah (AI/ML - Forecasting)

| Component | File Path | Hardcoded Section | Future API Endpoint |
|-----------|-----------|-------------------|---------------------|
| Trend Chart | `src/components/dashboard/TrendChart.jsx` | `mockData` | `GET /api/forecasts/trend/{metric}` |
| Forecast Service | `src/services/forecastService.js` | Mock responses | `GET /api/forecasts/predict` |

###  Geoffrey (NLP & Chatbot)

| Component | File Path | Hardcoded Section | Future API Endpoint |
|-----------|-----------|-------------------|---------------------|
| Chatbot | `src/components/chat/Chatbot.jsx` | `mockResponses` | `POST /api/chatbot/query` |
| Scoring Engine | `backend/app/services/dss/scoring_engine.py` | Keyword dictionary | N/A - ML model |

###  Arnold (Security & Anomaly)

| Component | File Path | Hardcoded Section | Future API Endpoint |
|-----------|-----------|-------------------|---------------------|
| Anomaly Table | `src/components/dashboard/AnomalyTable.jsx` | `mockAnomalies` | `GET /api/anomalies` |
| Alert Center | `src/components/dashboard/AlertCenter.jsx` | `alerts` | `GET /api/alerts` |
| Auth Middleware | `backend/app/middleware/auth.py` | N/A | JWT validation |

---


## 📁 File Structure

prophetledger/
│
├── backend/
│ │
│ ├── app/
│ │ ├── main.py # FastAPI entry point
│ │ ├── config.py # Configuration
│ │ ├── database.py # DB connection
│ │ │
│ │ ├── api/
│ │ │ ├── auth.py #  Arnold
│ │ │ ├── users.py #  Arnold
│ │ │ ├── transactions.py #  Daniel
│ │ │ ├── invoices.py #  Daniel
│ │ │ ├── forecasts.py #  Josiah
│ │ │ ├── anomalies.py #  Arnold
│ │ │ ├── chatbot.py #  Geoffrey
│ │ │ └── dss.py #  Daniel
│ │ │
│ │ ├── services/
│ │ │ ├── scanner.py #  Daniel
│ │ │ ├── forecast.py #  Josiah
│ │ │ ├── anomaly.py #  Arnold
│ │ │ ├── chatbot.py #  Geoffrey
│ │ │ │
│ │ │ └── dss/ #  Daniel
│ │ │ ├── risk_engine.py
│ │ │ ├── kpi_engine.py
│ │ │ ├── alert_engine.py
│ │ │ └── what_if_evaluator.py
│ │ │
│ │ └── middleware/ #  Arnold
│ │ ├── auth.py
│ │ └── audit.py
│ │
│ ├── requirements.txt
│ ├── Dockerfile
│ └── .env
│
└── frontend/
│
└── src/
├── App.js
├── index.js
├── index.css
│
├── contexts/
│ ├── AuthContext.jsx
│ └── ModeContext.jsx
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
│ │ ├── Layout.jsx ✅
│ │ ├── Header.jsx
│ │ └── Sidebar.jsx ✅
│ │
│ ├── dashboard/
│ │ ├── KpiGrid.jsx ⚠️ 
│ │ ├── RiskHeatmap.jsx ⚠️ 
│ │ ├── TrendChart.jsx ⚠️ 
│ │ ├── AnomalyTable.jsx ⚠️ 
│ │ └── AlertCenter.jsx ⚠️ 
│ │
│ ├── dss/
│ │ ├── ScenarioSimulator.jsx ⚠️ 
│ │ └── ScoreMeter.jsx ⚠️ 
│ │
│ ├── invoices/
│ │ ├── PDFUploader.jsx ⚠️ 
│ │ └── InvoiceList.jsx ⚠️ 
│ │
│ ├── transactions/
│ │ ├── TransactionForm.jsx ⚠️ 
│ │ └── TransactionList.jsx ⚠️ 
│ │
│ ├── chat/
│ │ └── Chatbot.jsx ⚠️ 
│ │
│ └── shared/
│ ├── PrivateRoute.jsx
│ ├── LoadingSpinner.jsx
│ └── ErrorBoundary.jsx
│
├── services/
│ ├── api.js
│ ├── dssService.js
│ ├── forecastService.js
│ ├── anomalyService.js
│ └── chatService.js
│
├── hooks/
│ ├── useAuth.js
│ └── useDSS.js
│
└── utils/
├── formatters.js
└── charts.js
text





> **Legend:** ⚠️  = Contains mock data needing API integration | ✅ NEW = Recently added/updated

---

## 🔧 Hardcoded Values Guide

### How to Identify Hardcoded Values

Look for these patterns in the code:

```javascript
// 🔴  - Replace with API call
const MOCK_DATA = [...] 

// 🔴  - Replace with actual extracted data
const extractedData = { ... }

//  TODO: Uncomment when API is ready
// const response = await api.get('/endpoint')
```

### API Integration Checklist

**For  Daniel:**
- [ ] `KpiGrid.jsx` - Replace `MOCK_KPIS` with `api.get('/dss/kpis')`
- [ ] `RiskHeatmap.jsx` - Replace `mockRiskData` with `api.get('/dss/risk/heatmap')`
- [ ] `PDFUploader.jsx` - Replace mock extraction with `api.post('/invoices/scan')`
- [ ] `InvoiceList.jsx` - Replace `mockInvoices` with `api.get('/invoices')`
- [ ] `TransactionForm.jsx` - Replace mock submit with `api.post('/transactions')`
- [ ] `TransactionList.jsx` - Replace `mockTransactions` with `api.get('/transactions')`
- [ ] `ScenarioSimulator.jsx` - Replace mock results with `api.post('/dss/what-if/evaluate')`

**For  Josiah:**
- [ ] `TrendChart.jsx` - Replace `mockData` with `api.get('/forecasts/trend')`
- [ ] `forecastService.js` - Connect to real forecasting models

**For  Geoffrey:**
- [ ] `Chatbot.jsx` - Replace `mockResponses` with `api.post('/chatbot/query')`

**For  Arnold:**
- [ ] `AnomalyTable.jsx` - Replace `mockAnomalies` with `api.get('/anomalies')`
- [ ] `AlertCenter.jsx` - Replace `alerts` with `api.get('/alerts')`

---

##  Development Setup

### Prerequisites

- Python 3.11+
- Node.js 18+
- PostgreSQL 15+ (or SQLite for development)
- Git

### Quick Start

```bash
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
npm start
```

### Environment Variables

**Backend** (`.env` in `/backend`)
```env
DATABASE_URL=sqlite:///./prophetledger.db
SECRET_KEY=your-secret-key-here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
ENVIRONMENT=development
```

**Frontend** (`.env` in `/frontend`)
```env
REACT_APP_API_URL=http://localhost:8000
```

### Verify Installation

| Service | URL | Expected |
|---------|-----|----------|
| Backend API | http://localhost:8000 | `{"message":"ProphetLedger API is running!"}` |
| API Docs | http://localhost:8000/docs | Swagger UI |
| Frontend | http://localhost:3000 | Login page |
| Health Check | http://localhost:8000/health | `{"status":"healthy"}` |

---

##  API Integration Guide

### Step-by-Step to Replace Hardcoded Data

1. Find the hardcoded section (look for `🔴` comments)
2. Uncomment the API call (look for `✅ TODO` comments)
3. Comment out or delete the mock data
4. Test the integration

### Example Transformation

```javascript
// BEFORE (Hardcoded)
const MOCK_DATA = [...]
setData(MOCK_DATA);

// AFTER (API-integrated)
// const response = await api.get('/endpoint');
// setData(response.data);
```

### Important API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | User registration |
| POST | `/api/auth/login` | User login |
| GET | `/api/auth/me` | Get current user |
| GET | `/api/dss/kpis` | Get KPI data |
| GET | `/api/forecasts/trend/{metric}` | Get forecast data |
| GET | `/api/anomalies` | Get anomalies |
| POST | `/api/chatbot/query` | Chatbot query |
| POST | `/api/invoices/scan` | Scan PDF invoice |
| GET | `/api/invoices` | Get invoices list |
| POST | `/api/transactions` | Add transaction |
| GET | `/api/transactions` | Get transactions |

---

##  Git Workflow

### Avoid README Merge Conflicts

Add this to `.gitattributes`:
```
README.md merge=ours
```

Or use this command when merging:
```bash
# Merge dev into main but keep main's README
git checkout main
git merge -X ours dev -- README.md
git merge dev  # Then merge everything else
```

### Branch Strategy

```
main                    # Production (stable)
  └── dev               # Development integration
       ├── feature/dss-daniel      # Daniel's DSS features
       ├── feature/forecast-josiah # Josiah's forecasting
       ├── feature/chatbot-geoffrey # Geoffrey's chatbot
       └── feature/security-arnold # Arnold's security
```

### Daily Workflow

```bash
# 1. Always start from updated dev
git checkout dev
git pull origin dev

# 2. Create your feature branch
git checkout -b feature/your-name-feature-name

# 3. Make changes and commit frequently
git add .
git commit -m "feat: add component with hardcoded data"

# 4. Push your branch
git push origin feature/your-name-feature-name

# 5. Create Pull Request on GitHub to merge into dev
```

### Commit Convention

| Type | Description |
|------|-------------|
| `feat:` | New feature (Daniel: DSS, Josiah: forecast, Geoffrey: chatbot, Arnold: security) |
| `fix:` | Bug fix |
| `docs:` | Documentation |
| `style:` | Formatting |
| `refactor:` | Code restructure |
| `test:` | Add tests |
| `chore:` | Maintenance |

### Pull Request Process

1. Push your feature branch to GitHub
2. Create PR from `feature/*` → `dev`
3. Request review from Daniel (Lead Architect)
4. Ensure all tests pass
5. Get approval from at least one other team member
6. Merge into `dev`

---

## 📝 Code Review Checklist

- [ ] All hardcoded sections are marked with `🔴` comments
- [ ] API integration sections are marked with `✅ TODO` comments
- [ ] Component handles loading and error states
- [ ] Works with mock data (for demo purposes)
- [ ] Follows project structure
- [ ] No console errors or warnings

---

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

---

<div align="center">
  <sub>Made with 🔮 by the ProphetLedger Team</sub>
  <br>
  <sub>Daniel (Lead/DSS) · Josiah (AI/ML) · Geoffrey (NLP) · Arnold (Security)</sub>
  <br><br>
  <a href="#">Report Bug</a> ·
  <a href="#">Request Feature</a> ·
  <a href="#">Dev Branch</a>
</div>
```



