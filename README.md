```markdown
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
- [Hardcoded Values Guide](#-hardcoded-values-guide)
- [Development Setup](#-development-setup)
- [Quick Start](#-quick-start)
- [API Integration Guide](#-api-integration-guide)
- [Git Workflow](#-git-workflow)

---

## 🚦 Project Status

| Component | Status | Owner | Hardcoded Values Location |
|-----------|--------|-------|---------------------------|
| KPI Grid | ✅ Mock Data Ready | 🧠 Daniel | `MOCK_KPIS` in KpiGrid.jsx |
| Trend Chart | ✅ Mock Data Ready | 👤 Josiah | `MOCK_TREND_DATA` in TrendChart.jsx |
| Anomaly Table | ✅ Mock Data Ready | 🔒 Arnold | `MOCK_ANOMALIES` in AnomalyTable.jsx |
| Chatbot | ✅ Mock Responses Ready | 💬 Geoffrey | `MOCK_RESPONSES` in Chatbot.jsx |
| PDF Scanner | ✅ Mock Extraction Ready | 🧠 Daniel | `extractedData` in PDFUploader.jsx |
| Transaction Form | ✅ Mock Submit Ready | 🧠 Daniel | `console.log` in TransactionForm.jsx |
| Scenario Simulator | ✅ Mock Results Ready | 🧠 Daniel | `results` in ScenarioSimulator.jsx |

---

## 👥 Team & Responsibilities with File Locations

### 🧠 Daniel (Lead Architect / DSS / UI)

| Component | File Path | Hardcoded Section | API Endpoint (When Ready) |
|-----------|-----------|-------------------|---------------------------|
| KPI Grid | `src/components/dashboard/KpiGrid.jsx` | `MOCK_KPIS` line ~20 | `GET /api/dss/kpis?mode={mode}` |
| Risk Heatmap | `src/components/dashboard/RiskHeatmap.jsx` | `MOCK_HEATMAP_DATA` | `GET /api/dss/risk/heatmap` |
| Recommendation Panel | `src/components/dashboard/RecommendationPanel.jsx` | `MOCK_RECOMMENDATIONS` | `GET /api/dss/recommendations` |
| Scenario Simulator | `src/components/dss/ScenarioSimulator.jsx` | `results` line ~80 | `POST /api/dss/what-if/evaluate` |
| Score Meter | `src/components/dss/ScoreMeter.jsx` | `MOCK_RISK_SCORE` | `GET /api/dss/risk/score` |
| Goal Setting | `src/components/dss/GoalSetting.jsx` | `MOCK_GOALS` | `GET/POST /api/goals` |
| PDF Uploader | `src/components/invoices/PDFUploader.jsx` | `extractedData` line ~32 | `POST /api/invoices/scan` |
| Invoice List | `src/components/invoices/InvoiceList.jsx` | `MOCK_INVOICES` | `GET /api/invoices` |
| Transaction Form | `src/components/transactions/TransactionForm.jsx` | `console.log` line ~55 | `POST /api/transactions` |
| Transaction List | `src/components/transactions/TransactionList.jsx` | `MOCK_TRANSACTIONS` | `GET /api/transactions` |

### 👤 Josiah (AI/ML - Forecasting)

| Component | File Path | Hardcoded Section | API Endpoint (When Ready) |
|-----------|-----------|-------------------|---------------------------|
| Trend Chart | `src/components/dashboard/TrendChart.jsx` | `MOCK_TREND_DATA` line ~15 | `GET /api/forecasts/trend/{metric}` |
| Forecast Service | `src/services/forecastService.js` | Mock responses | `GET /api/forecasts/predict` |

### 💬 Geoffrey (NLP & Chatbot)

| Component | File Path | Hardcoded Section | API Endpoint (When Ready) |
|-----------|-----------|-------------------|---------------------------|
| Chatbot | `src/components/chat/Chatbot.jsx` | `MOCK_RESPONSES` line ~15 | `POST /api/chatbot/query` |
| Scoring Engine | `backend/app/services/dss/scoring_engine.py` | Keyword dictionary | N/A - ML model |

### 🔒 Arnold (Security & Anomaly)

| Component | File Path | Hardcoded Section | API Endpoint (When Ready) |
|-----------|-----------|-------------------|---------------------------|
| Anomaly Table | `src/components/dashboard/AnomalyTable.jsx` | `MOCK_ANOMALIES` line ~15 | `GET /api/anomalies` |
| Alert Center | `src/components/dashboard/AlertCenter.jsx` | `demoAlerts` line ~35 | `GET /api/alerts` |
| Auth Middleware | `backend/app/middleware/auth.py` | N/A | JWT validation |

---

## 📁 File Structure

```
prophetledger/
│
├── backend/
│   ├── app/
│   │   ├── api/
│   │   │   ├── auth.py              # 🔒 Arnold
│   │   │   ├── users.py             # 🔒 Arnold
│   │   │   ├── transactions.py      # 🧠 Daniel
│   │   │   ├── invoices.py          # 🧠 Daniel
│   │   │   ├── forecasts.py         # 👤 Josiah
│   │   │   ├── anomalies.py         # 🔒 Arnold
│   │   │   ├── chatbot.py           # 💬 Geoffrey
│   │   │   └── dss.py               # 🧠 Daniel
│   │   ├── services/
│   │   │   ├── scanner.py           # 🧠 Daniel (PDF extraction)
│   │   │   ├── forecast.py          # 👤 Josiah (ARIMA/LSTM)
│   │   │   ├── anomaly.py           # 🔒 Arnold (Isolation Forest)
│   │   │   ├── chatbot.py           # 💬 Geoffrey (NLP)
│   │   │   └── dss/                 # 🧠 Daniel
│   │   │       ├── risk_engine.py
│   │   │       ├── kpi_engine.py
│   │   │       ├── alert_engine.py
│   │   │       └── what_if_evaluator.py
│   │   └── middleware/              # 🔒 Arnold
│   │       ├── auth.py
│   │       └── audit.py
│   │
│   └── requirements.txt
│
└── frontend/
    └── src/
        ├── components/
        │   ├── dashboard/
        │   │   ├── KpiGrid.jsx           # 🧠 Daniel ⚠️ HARDCODED
        │   │   ├── RiskHeatmap.jsx       # 🧠 Daniel ⚠️ HARDCODED
        │   │   ├── TrendChart.jsx        # 👤 Josiah ⚠️ HARDCODED
        │   │   ├── AnomalyTable.jsx      # 🔒 Arnold ⚠️ HARDCODED
        │   │   ├── AlertCenter.jsx       # 🔒 Arnold ⚠️ HARDCODED
        │   │   └── RecommendationPanel.jsx # 🧠 Daniel ⚠️ HARDCODED
        │   ├── dss/
        │   │   ├── ScenarioSimulator.jsx # 🧠 Daniel ⚠️ HARDCODED
        │   │   ├── ScoreMeter.jsx        # 🧠 Daniel ⚠️ HARDCODED
        │   │   └── GoalSetting.jsx       # 🧠 Daniel ⚠️ HARDCODED
        │   ├── invoices/
        │   │   ├── PDFUploader.jsx       # 🧠 Daniel ⚠️ HARDCODED
        │   │   ├── InvoicePreview.jsx    # 🧠 Daniel ⚠️ HARDCODED
        │   │   └── InvoiceList.jsx       # 🧠 Daniel ⚠️ HARDCODED
        │   ├── transactions/
        │   │   ├── TransactionForm.jsx   # 🧠 Daniel ⚠️ HARDCODED
        │   │   ├── TransactionList.jsx   # 🧠 Daniel ⚠️ HARDCODED
        │   │   └── TransactionFilters.jsx # 🧠 Daniel ⚠️ HARDCODED
        │   ├── chat/
        │   │   └── Chatbot.jsx           # 💬 Geoffrey ⚠️ HARDCODED
        │   └── shared/
        │       ├── PrivateRoute.jsx
        │       ├── LoadingSpinner.jsx
        │       └── ErrorBoundary.jsx
        │
        ├── services/
        │   ├── api.js
        │   ├── dssService.js             # 🧠 Daniel
        │   ├── forecastService.js        # 👤 Josiah
        │   ├── anomalyService.js         # 🔒 Arnold
        │   └── chatService.js            # 💬 Geoffrey
        │
        └── pages/
            ├── Dashboard.jsx
            ├── Login.jsx
            ├── Register.jsx
            └── ModeSelector.jsx

⚠️ HARDCODED = Contains mock data that needs API integration
```

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
```

### API Integration Checklist

#### For 🧠 Daniel:
- [ ] `KpiGrid.jsx` - Replace `MOCK_KPIS` with `api.get('/dss/kpis')`
- [ ] `PDFUploader.jsx` - Replace mock extraction with `api.post('/invoices/scan')`
- [ ] `TransactionForm.jsx` - Replace mock submit with `api.post('/transactions')`
- [ ] `ScenarioSimulator.jsx` - Replace mock results with `api.post('/dss/what-if/evaluate')`

#### For 👤 Josiah:
- [ ] `TrendChart.jsx` - Replace `MOCK_TREND_DATA` with `api.get('/forecasts/trend')`
- [ ] `forecastService.js` - Connect to real forecasting models

#### For 💬 Geoffrey:
- [ ] `Chatbot.jsx` - Replace `MOCK_RESPONSES` with `api.post('/chatbot/query')`

#### For 🔒 Arnold:
- [ ] `AnomalyTable.jsx` - Replace `MOCK_ANOMALIES` with `api.get('/anomalies')`
- [ ] `AlertCenter.jsx` - Replace `demoAlerts` with `api.get('/alerts')`

---

## 🚀 Development Setup

### Prerequisites
- Python 3.11+
- Node.js 18+
- PostgreSQL 15+ (or SQLite for dev)

### Quick Start

```bash
# Clone and switch to dev branch
git clone https://github.com/WekesaDanielJkuat/ProphetLedger.git
cd ProphetLedger
git checkout dev

# Backend setup
cd backend
python -m venv venv
venv\Scripts\activate  # Windows
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000

# Frontend setup (new terminal)
cd frontend
npm install
npm start
```

### Environment Variables

**Backend (.env)**
```
DATABASE_URL=sqlite:///./prophetledger.db
SECRET_KEY=your-secret-key-here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
```

**Frontend (.env)**
```
REACT_APP_API_URL=http://localhost:8000
```

---

## 🔌 API Integration Guide

### Step-by-Step to Replace Hardcoded Data

1. **Find the hardcoded section** (look for 🔴 comments)
2. **Uncomment the API call** (look for ✅ TO DO comments)
3. **Comment out or delete the mock data**
4. **Test the integration**

Example transformation:

```javascript
// BEFORE (Hardcoded)
const MOCK_DATA = [...]
setData(MOCK_DATA);

// AFTER (API-integrated)
// const response = await api.get('/endpoint');
// setData(response.data);
```

---

## 🔀 Git Workflow

```bash
# Always start from updated dev
git checkout dev
git pull origin dev

# Create feature branch
git checkout -b feature/your-name-component

# Commit changes
git add .
git commit -m "feat: add component with hardcoded data"

# Push and create PR
git push origin feature/your-name-component
```

### Branch Naming Convention
- `feature/daniel-dss` - Daniel's DSS features
- `feature/josiah-forecast` - Josiah's forecasting
- `feature/geoffrey-chatbot` - Geoffrey's chatbot
- `feature/arnold-security` - Arnold's security

---

## 📝 Code Review Checklist

- [ ] All hardcoded sections are marked with 🔴 comments
- [ ] API integration sections are marked with ✅ TO DO comments
- [ ] Component handles loading and error states
- [ ] Works with mock data (for demo purposes)
- [ ] Follows project structure

---

## 📄 License

MIT License

---

<div align="center">
  
  **Made with 🔮 by the ProphetLedger Team**
  
  | Daniel (Lead/DSS) | Josiah (AI/ML) | Geoffrey (NLP) | Arnold (Security) |
  |------------------|----------------|----------------|-------------------|
  
  [Dev Branch](https://github.com/WekesaDanielJkuat/ProphetLedger/tree/dev)
  
</div>