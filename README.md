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

- [Overview](#-overview)
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Team & Responsibilities](#-team--responsibilities)
- [Development Setup](#-development-setup)
- [Quick Start](#-quick-start)
- [Development Guide](#-development-guide)
- [API Documentation](#-api-documentation)
- [Testing](#-testing)
- [Git Workflow](#-git-workflow)
- [Contributing](#-contributing)
- [License](#-license)

---

## 🎯 Overview

**ProphetLedger** is an adaptive financial intelligence platform that provides AI-powered forecasting, anomaly detection, PDF invoice scanning, and decision support. The UI dynamically adapts to three modes: Personal, Small Business, and Enterprise.

**Current Branch:** `dev` - Development branch with latest features

---

## ✨ Features

| Feature | Description | Lead |
|---------|-------------|------|
| 🤖 **PDF Invoice Scanner** | Extract vendor, amount, date, tax from invoices | Daniel |
| 📈 **Time-Series Forecasting** | ARIMA/LSTM models for cash flow prediction | Josiah |
| 🚨 **Anomaly Detection** | Fraud detection & unusual transaction flagging | Arnold |
| 🧠 **DSS Knowledge Engine** | Risk scoring, KPI engine, what-if simulations | Daniel |
| 💬 **Chatbot Interface** | Natural language queries & transaction classification | Geoffrey |
| 🎯 **Goal Setting** | Personalized savings & budget goals | Daniel |
| 🔒 **Multi-Account** | Account aggregation & security | Arnold |

---

## 🛠️ Tech Stack

### Backend
```
FastAPI          - Async Python web framework
PostgreSQL       - Primary database
SQLAlchemy       - ORM & migrations
JWT              - Authentication
Pandas/Numpy     - Data processing
Scikit-learn     - Anomaly detection (Isolation Forest)
Statsmodels      - ARIMA forecasting
TensorFlow       - LSTM models (optional)
```

### Frontend
```
React 18         - UI framework
Tailwind CSS     - Styling
Recharts         - Business-grade charts
Axios            - API client
React Router     - Navigation
Lucide React     - Icons
```

---

## 📁 Project Structure

```
prophetledger/
│
├── backend/                          # FastAPI backend
│   ├── app/
│   │   ├── main.py                   # Entry point
│   │   ├── config.py                 # Config
│   │   ├── database.py               # DB connection
│   │   │
│   │   ├── models/                   # SQLAlchemy models
│   │   │   ├── user.py
│   │   │   ├── transaction.py
│   │   │   ├── invoice.py
│   │   │   ├── forecast.py           # 👤 Josiah
│   │   │   ├── anomaly.py            # 🔒 Arnold
│   │   │   └── audit_log.py          # 🔒 Arnold
│   │   │
│   │   ├── api/                      # REST endpoints
│   │   │   ├── auth.py
│   │   │   ├── users.py
│   │   │   ├── transactions.py
│   │   │   ├── invoices.py           # 🧠 Daniel
│   │   │   ├── forecasts.py          # 👤 Josiah
│   │   │   ├── anomalies.py          # 🔒 Arnold
│   │   │   ├── chatbot.py            # 💬 Geoffrey
│   │   │   └── dss.py                # 🧠 Daniel
│   │   │
│   │   ├── services/                 # Business logic
│   │   │   ├── scanner.py            # 🧠 Daniel (PDF extraction)
│   │   │   ├── forecast.py           # 👤 Josiah (ARIMA/LSTM)
│   │   │   ├── anomaly.py            # 🔒 Arnold (Isolation Forest)
│   │   │   ├── chatbot.py            # 💬 Geoffrey (NLP)
│   │   │   │
│   │   │   └── dss/                  # 🧠 Daniel (Knowledge Engine)
│   │   │       ├── risk_engine.py
│   │   │       ├── kpi_engine.py
│   │   │       ├── scoring_engine.py # 💬 Geoffrey (classification)
│   │   │       ├── alert_engine.py
│   │   │       └── what_if_evaluator.py
│   │   │
│   │   ├── middleware/               # 🔒 Arnold
│   │   │   ├── auth.py
│   │   │   └── audit.py
│   │   │
│   │   └── utils/
│   │       ├── helpers.py
│   │       └── validators.py
│   │
│   ├── requirements.txt
│   ├── Dockerfile
│   └── .env
│
└── frontend/                         # React frontend
    ├── src/
    │   ├── App.js
    │   ├── index.js
    │   ├── index.css
    │   │
    │   ├── contexts/
    │   │   ├── AuthContext.jsx
    │   │   └── ModeContext.jsx
    │   │
    │   ├── pages/
    │   │   ├── Login.jsx
    │   │   ├── Register.jsx
    │   │   ├── ModeSelector.jsx
    │   │   ├── Dashboard.jsx         # 🧠 Daniel
    │   │   ├── Invoices.jsx          # 🧠 Daniel
    │   │   └── Settings.jsx
    │   │
    │   ├── components/
    │   │   ├── layout/
    │   │   │   ├── Header.jsx
    │   │   │   └── Sidebar.jsx
    │   │   │
    │   │   ├── dashboard/            # 🧠 Daniel
    │   │   │   ├── KpiGrid.jsx
    │   │   │   ├── RiskHeatmap.jsx
    │   │   │   ├── TrendChart.jsx    # 👤 Josiah
    │   │   │   ├── AnomalyTable.jsx  # 🔒 Arnold
    │   │   │   └── AlertCenter.jsx
    │   │   │
    │   │   ├── dss/                  # 🧠 Daniel
    │   │   │   ├── ScenarioSimulator.jsx
    │   │   │   └── ScoreMeter.jsx
    │   │   │
    │   │   ├── invoices/             # 🧠 Daniel
    │   │   │   └── PDFUploader.jsx
    │   │   │
    │   │   ├── chat/                 # 💬 Geoffrey
    │   │   │   └── Chatbot.jsx
    │   │   │
    │   │   └── shared/
    │   │       ├── PrivateRoute.jsx
    │   │       └── LoadingSpinner.jsx
    │   │
    │   ├── services/                 # API clients
    │   │   ├── api.js
    │   │   ├── authService.js
    │   │   ├── dssService.js         # 🧠 Daniel
    │   │   ├── forecastService.js    # 👤 Josiah
    │   │   ├── anomalyService.js     # 🔒 Arnold
    │   │   └── chatService.js        # 💬 Geoffrey
    │   │
    │   └── hooks/
    │       ├── useAuth.js
    │       └── useDSS.js             # 🧠 Daniel
    │
    ├── package.json
    ├── tailwind.config.js
    └── .env
```

---

## 👥 Team & Responsibilities

| Role | Developer | Focus Area | Files to Work On | Key Deliverables |
|------|-----------|------------|-----------------|------------------|
| **Lead Architect** | Daniel (You) | DSS, PDF scanning, UI integration, Project structure | `backend/app/services/dss/`, `backend/app/api/dss.py`, `backend/app/services/scanner.py`, `frontend/src/components/dss/`, `frontend/src/pages/Dashboard.jsx`, `frontend/src/components/invoices/` | Risk engine, KPI engine, what-if simulator, PDF scanner, personalized recommendations, goal-setting UI |
| **AI/ML Engineer** | Josiah | Expense prediction, cash flow forecasting | `backend/app/services/forecast.py`, `backend/app/models/forecast.py`, `backend/app/api/forecasts.py`, `frontend/src/components/dashboard/TrendChart.jsx`, `frontend/src/services/forecastService.js` | ARIMA/LSTM models, cash flow projections, savings predictions, forecast accuracy metrics |
| **NLP & Chatbot** | Geoffrey | Chatbot, transaction classification, budget automation | `backend/app/services/chatbot.py`, `backend/app/services/dss/scoring_engine.py`, `backend/app/api/chatbot.py`, `frontend/src/components/chat/Chatbot.jsx`, `frontend/src/services/chatService.js` | Intent-based chatbot, natural language queries, smart transaction categorization, automated budget planning |
| **Security & Systems** | Arnold | Anomaly detection, fraud, multi-account aggregation | `backend/app/services/anomaly.py`, `backend/app/models/anomaly.py`, `backend/app/api/anomalies.py`, `backend/app/middleware/`, `frontend/src/components/dashboard/AnomalyTable.jsx` | Isolation Forest anomaly detection, fraud alerts, multi-account security, audit logging |

### Integration Points Map

```
┌─────────────────────────────────────────────────────────────────────┐
│                         PROPHETLEDGER SYSTEM                         │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌──────────────┐     ┌──────────────┐     ┌──────────────┐         │
│  │   Josiah     │────▶│   Forecast   │────▶│   Trend      │         │
│  │   (AI/ML)    │     │   Engine     │     │   Charts     │         │
│  └──────────────┘     └──────────────┘     └──────────────┘         │
│         │                                       ▲                    │
│         │                                       │                    │
│         ▼                                       │                    │
│  ┌──────────────┐     ┌──────────────┐          │                    │
│  │   Daniel     │────▶│     DSS      │──────────┘                    │
│  │   (DSS/UI)   │     │   Engine     │                               │
│  └──────────────┘     └──────────────┘                               │
│         │                    │                                       │
│         │                    │                                       │
│         ▼                    ▼                                       │
│  ┌──────────────┐     ┌──────────────┐     ┌──────────────┐         │
│  │   Geoffrey   │────▶│   Chatbot    │────▶│  Transaction │         │
│  │   (NLP)      │     │   Service    │     │  Classifier  │         │
│  └──────────────┘     └──────────────┘     └──────────────┘         │
│         │                                      │                     │
│         │                                      │                     │
│         ▼                                      ▼                     │
│  ┌──────────────┐     ┌──────────────┐     ┌──────────────┐         │
│  │   Arnold     │────▶│   Anomaly    │────▶│   Security   │         │
│  │   (Security) │     │   Detector   │     │   Middleware │         │
│  └──────────────┘     └──────────────┘     └──────────────┘         │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### How Teams Integrate

| From | To | Integration Method |
|------|-----|-------------------|
| Josiah (Forecast) | Daniel (DSS) | `forecast.py` exports prediction data → DSS uses for risk scoring |
| Geoffrey (Chatbot) | Daniel (DSS) | Chatbot calls DSS endpoints for financial insights |
| Arnold (Anomaly) | Daniel (DSS) | Anomaly detection feeds into DSS alert engine |
| All | Frontend | Services expose APIs consumed by React components |

---

## 🚀 Development Setup

### Prerequisites

```bash
# Required versions
Python 3.11+ (3.13 recommended)
Node.js 18+
PostgreSQL 15+ (or SQLite for development)
Git
```

### Step 1: Clone Repository

```bash
git clone https://github.com/WekesaDanielJkuat/ProphetLedger.git
cd ProphetLedger
git checkout dev
```

### Step 2: Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate (Windows)
venv\Scripts\activate

# Activate (Mac/Linux)
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Create .env file
echo DATABASE_URL=sqlite:///./prophetledger.db > .env
echo SECRET_KEY=your-secret-key-here >> .env
echo ALGORITHM=HS256 >> .env
echo ACCESS_TOKEN_EXPIRE_MINUTES=30 >> .env
```

### Step 3: Frontend Setup

```bash
cd ../frontend

# Install dependencies
npm install

# Create .env file
echo REACT_APP_API_URL=http://localhost:8000 > .env
```

### Step 4: Initialize Database

```bash
cd ../backend
python -c "
from app.database import engine, Base
from app.models import user, transaction, invoice, forecast, anomaly, audit_log
Base.metadata.create_all(bind=engine)
print('✅ Database tables created!')
"
```

### Step 5: Start Development Servers

**Terminal 1 - Backend:**
```bash
cd backend
venv\Scripts\activate
uvicorn app.main:app --reload --port 8000
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm start
```

### Step 6: Verify Installation

| Service | URL | Expected |
|---------|-----|----------|
| Backend API | http://localhost:8000 | `{"message":"ProphetLedger API is running!"}` |
| API Docs | http://localhost:8000/docs | Swagger UI |
| Frontend | http://localhost:3000 | Login page |
| Health Check | http://localhost:8000/health | `{"status":"ok"}` |

---

## 📝 Development Guide

### Each Developer's First Steps

#### 🧠 Daniel (DSS & UI)
```bash
# Create your files
cd backend/app/services
mkdir dss
cd dss
# Create: risk_engine.py, kpi_engine.py, alert_engine.py, what_if_evaluator.py

cd ../../../frontend/src/components
mkdir dss
cd dss
# Create: ScenarioSimulator.jsx, ScoreMeter.jsx
```

#### 👤 Josiah (AI/ML - Forecasting)
```bash
# Create your files
cd backend/app/services
touch forecast.py

cd ../models
touch forecast.py

cd ../api
touch forecasts.py

cd ../../../frontend/src/services
touch forecastService.js
```

#### 💬 Geoffrey (NLP & Chatbot)
```bash
# Create your files
cd backend/app/services
touch chatbot.py

cd ../api
touch chatbot.py

cd ../../../frontend/src/components
mkdir chat
cd chat
touch Chatbot.jsx

cd ../../services
touch chatService.js
```

#### 🔒 Arnold (Security & Anomaly)
```bash
# Create your files
cd backend/app/services
touch anomaly.py

cd ../models
touch anomaly.py

cd ../api
touch anomalies.py

cd ../middleware
# Already has auth.py - add audit.py

cd ../../../frontend/src/services
touch anomalyService.js
```

### Running Individual Components

```bash
# Run only backend (for API development)
cd backend
venv\Scripts\activate
uvicorn app.main:app --reload --port 8000

# Run only frontend (for UI development with mock data)
cd frontend
npm start

# Run tests for your component
pytest tests/test_forecast.py  # Josiah
pytest tests/test_chatbot.py   # Geoffrey
pytest tests/test_anomaly.py   # Arnold
pytest tests/test_dss.py       # Daniel
```

---

## 🔌 API Documentation

Once running, visit **http://localhost:8000/docs** for interactive Swagger documentation.

### API Endpoints by Owner

| Owner | Endpoints |
|-------|-----------|
| Daniel | `/api/dss/*`, `/api/invoices/*` |
| Josiah | `/api/forecasts/*` |
| Geoffrey | `/api/chatbot/*`, `/api/transactions/classify` |
| Arnold | `/api/anomalies/*`, `/api/auth/*` (security) |

---

## 🧪 Testing

```bash
# Run all tests
cd backend
pytest tests/ -v

# Run specific test suite
pytest tests/test_forecast.py -v  # Josiah
pytest tests/test_chatbot.py -v   # Geoffrey
pytest tests/test_anomaly.py -v   # Arnold
pytest tests/test_dss.py -v       # Daniel

# Frontend tests
cd frontend
npm test
```

---

## 🔀 Git Workflow

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
git commit -m "feat: add risk scoring engine"

# 4. Push your branch
git push origin feature/your-name-feature-name

# 5. Create Pull Request on GitHub to merge into dev
```

### Commit Convention

```
feat: new feature (Daniel: DSS, Josiah: forecast, Geoffrey: chatbot, Arnold: security)
fix: bug fix
docs: documentation
style: formatting
refactor: code restructure
test: add tests
chore: maintenance
```

### Pull Request Process

1. Push your feature branch to GitHub
2. Create PR from `feature/*` → `dev`
3. Request review from Daniel (Lead Architect)
4. All tests must pass
5. Get approval from at least 1 other team member
6. Merge into `dev`

---

## 🤝 Contributing

### Code Review Checklist

- [ ] Code follows project structure
- [ ] Tests added for new features
- [ ] API endpoints documented
- [ ] No console errors or warnings
- [ ] Works with both SQLite and PostgreSQL

### Need Help?

| Issue | Contact |
|-------|---------|
| Project structure, integration | Daniel |
| Forecasting, ML models | Josiah |
| Chatbot, NLP, classification | Geoffrey |
| Security, anomalies, auth | Arnold |

---

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

---

<div align="center">
  
  **Made with 🔮 by the ProphetLedger Team**
  
  | Daniel (Lead/DSS) | Josiah (AI/ML) | Geoffrey (NLP) | Arnold (Security) |
  |------------------|----------------|----------------|-------------------|
  
  [Report Bug](https://github.com/WekesaDanielJkuat/ProphetLedger/issues) · 
  [Request Feature](https://github.com/WekesaDanielJkuat/ProphetLedger/issues) · 
  [Dev Branch](https://github.com/WekesaDanielJkuat/ProphetLedger/tree/dev)
  
</div>