# ProphetLedger
Financial Intelligence platform



<div align="center">
  
  <img src="https://img.shields.io/badge/version-1.0.0-blue.svg" alt="Version">
  <img src="https://img.shields.io/badge/python-3.11+-green.svg" alt="Python">
  <img src="https://img.shields.io/badge/react-18.2.0-61dafb.svg" alt="React">
  <img src="https://img.shields.io/badge/fastapi-0.104.1-009688.svg" alt="FastAPI">
  <img src="https://img.shields.io/badge/license-MIT-purple.svg" alt="License">
  
  <h1>🔮 ProphtScan</h1>
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
- [Quick Start](#-quick-start)
- [Development Guide](#-development-guide)
- [API Documentation](#-api-documentation)
- [Environment Variables](#-environment-variables)
- [Testing](#-testing)
- [Deployment](#-deployment)
- [Contributing](#-contributing)
- [License](#-license)

---

## 🎯 Overview

**ProphtScan** is an adaptive financial intelligence platform that provides AI-powered forecasting, anomaly detection, PDF invoice scanning, and decision support. The UI dynamically adapts to three modes:

| Mode | Target User | Key Features |
|------|-------------|--------------|
| 👤 **Personal** | Individuals & Families | Budget tracking, expense categorization, basic forecasting |
| 🏢 **Small Business** | Freelancers & SMBs | Cash flow management, invoice scanning, risk scoring |
| 🏛️ **Enterprise** | Large Organizations | Department-level analytics, role-based access, audit logs |

**Problem Solved:** Most financial tools are either too simple (spreadsheets) or too complex (enterprise ERP). ProphtScan bridges the gap with AI that grows with you.

---

## ✨ Features

### Core Capabilities

| Feature | Description | Status |
|---------|-------------|--------|
| 🤖 **PDF Invoice Scanner** | Extract vendor, amount, date, tax from any invoice | ✅ |
| 📈 **Time-Series Forecasting** | ARIMA/LSTM models for cash flow prediction | ✅ |
| 🚨 **Anomaly Detection** | Isolation Forest to flag unusual transactions | ✅ |
| 🧠 **DSS Knowledge Engine** | Risk scoring, KPI engine, what-if simulations | ✅ |
| 💬 **Chatbot Interface** | Natural language queries about finances | ✅ |
| 🎨 **Adaptive UI** | Mode-based dashboard personalization | ✅ |
| 🔒 **RBAC** | Role-based access control (Admin/Manager/Viewer) | ✅ |
| 📊 **Audit Logging** | Complete action history for compliance | ✅ |

### Decision Support System (DSS) Components

- **Risk Engine**: 0-100 risk scoring with factor breakdown
- **KPI Engine**: 10+ financial metrics with benchmarks
- **Alert Engine**: Proactive notifications for anomalies, bills, budgets
- **What-If Evaluator**: Scenario simulation (revenue changes, cost cuts, hiring)
- **Scoring Engine**: Intelligent transaction categorization & vendor risk scoring

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
PDFPlumber       - PDF text extraction
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
React Dropzone   - File uploads
```

### DevOps
```
Docker           - Containerization
Docker Compose   - Multi-container orchestration
GitHub Actions   - CI/CD (optional)
```

---

## 📁 Project Structure

```
prophtscan/
│
├── backend/                          # FastAPI backend service
│   ├── app/
│   │   ├── main.py                   # Application entry point
│   │   ├── config.py                 # Environment configuration
│   │   ├── database.py               # DB connection & session
│   │   │
│   │   ├── models/                   # SQLAlchemy models
│   │   │   ├── user.py               # User + RBAC
│   │   │   ├── transaction.py        # Financial transactions
│   │   │   ├── invoice.py            # Scanned invoices
│   │   │   ├── forecast.py           # Predictions storage
│   │   │   ├── anomaly.py            # Detected anomalies
│   │   │   └── audit_log.py          # Action history
│   │   │
│   │   ├── api/                      # REST endpoints
│   │   │   ├── auth.py               # Login/register
│   │   │   ├── users.py              # User management
│   │   │   ├── transactions.py       # CRUD operations
│   │   │   ├── invoices.py           # PDF upload & scan
│   │   │   ├── forecasts.py          # Forecasting API
│   │   │   ├── anomalies.py          # Anomaly detection
│   │   │   └── dss.py                # ⭐ DSS endpoints
│   │   │
│   │   ├── services/                 # Business logic
│   │   │   ├── auth_service.py
│   │   │   ├── scanner.py            # PDF extraction
│   │   │   ├── forecast.py           # ARIMA/LSTM
│   │   │   ├── anomaly.py            # Isolation Forest
│   │   │   ├── chatbot.py            # NLP responses
│   │   │   │
│   │   │   └── dss/                  # ⭐ Knowledge Engine
│   │   │       ├── risk_engine.py    # Risk scoring
│   │   │       ├── kpi_engine.py     # KPI calculations
│   │   │       ├── scoring_engine.py # Classification
│   │   │       ├── alert_engine.py   # Proactive alerts
│   │   │       └── what_if_evaluator.py
│   │   │
│   │   ├── middleware/               # Request interceptors
│   │   │   ├── auth.py               # JWT verification
│   │   │   └── audit.py              # Logging middleware
│   │   │
│   │   └── utils/                    # Helpers
│   │       ├── helpers.py
│   │       └── validators.py
│   │
│   ├── migrations/                   # Alembic migrations
│   ├── tests/                        # Pytest suite
│   ├── requirements.txt
│   ├── Dockerfile
│   └── .env
│
├── frontend/                         # React frontend
│   ├── public/
│   │   └── index.html
│   │
│   ├── src/
│   │   ├── index.js                  # Entry point
│   │   ├── App.js                    # Main component
│   │   ├── index.css
│   │   │
│   │   ├── contexts/                 # React contexts
│   │   │   ├── AuthContext.jsx
│   │   │   └── ModeContext.jsx
│   │   │
│   │   ├── pages/                    # Page components
│   │   │   ├── Login.jsx
│   │   │   ├── Register.jsx
│   │   │   ├── ModeSelector.jsx
│   │   │   ├── Dashboard.jsx         # ⭐ Main dashboard
│   │   │   ├── Invoices.jsx
│   │   │   └── Settings.jsx
│   │   │
│   │   ├── components/
│   │   │   ├── layout/
│   │   │   │   ├── Header.jsx
│   │   │   │   ├── Sidebar.jsx
│   │   │   │   └── Footer.jsx
│   │   │   │
│   │   │   ├── dashboard/            # ⭐ Dashboard UI
│   │   │   │   ├── KpiGrid.jsx
│   │   │   │   ├── RiskHeatmap.jsx
│   │   │   │   ├── TrendChart.jsx
│   │   │   │   ├── AnomalyTable.jsx
│   │   │   │   ├── AlertCenter.jsx
│   │   │   │   └── RecommendationPanel.jsx
│   │   │   │
│   │   │   ├── dss/                  # ⭐ DSS UI
│   │   │   │   ├── ScenarioSimulator.jsx
│   │   │   │   ├── ScoreMeter.jsx
│   │   │   │   └── VendorRiskCard.jsx
│   │   │   │
│   │   │   ├── invoices/
│   │   │   │   ├── PDFUploader.jsx
│   │   │   │   └── InvoicePreview.jsx
│   │   │   │
│   │   │   ├── chat/
│   │   │   │   └── Chatbot.jsx
│   │   │   │
│   │   │   └── shared/
│   │   │       ├── LoadingSpinner.jsx
│   │   │       ├── ErrorBoundary.jsx
│   │   │       └── StatusBadge.jsx
│   │   │
│   │   ├── services/                 # API clients
│   │   │   ├── api.js                # Axios instance
│   │   │   ├── authService.js
│   │   │   ├── dssService.js         # ⭐ DSS API calls
│   │   │   └── transactionService.js
│   │   │
│   │   ├── hooks/                    # Custom hooks
│   │   │   ├── useAuth.js
│   │   │   └── useDSS.js             # ⭐ DSS data fetching
│   │   │
│   │   └── utils/
│   │       ├── formatters.js
│   │       └── charts.js
│   │
│   ├── package.json
│   ├── tailwind.config.js
│   ├── Dockerfile
│   └── .env
│
├── docker-compose.yml                # Multi-container setup
├── .gitignore
└── README.md                         # You are here!
```

---

## 👥 Team & Responsibilities

| Role | Developer | Responsibilities | Files to Work On |
|------|-----------|-----------------|------------------|
| **Lead Architect** | You | Project structure, integration, deployment | `docker-compose.yml`, `backend/app/main.py`, `frontend/src/App.js`, integration |
| **DSS Engineer** | Developer 1 | Knowledge Engine, risk scoring, what-if simulator | `backend/app/services/dss/*.py`, `backend/app/api/dss.py`, `frontend/src/components/dss/` |
| **Frontend UI** | Developer 2 | Dashboard, visualizations, mode adaptation | `frontend/src/pages/Dashboard.jsx`, `frontend/src/components/dashboard/*.jsx`, Tailwind styling |
| **Backend API** | Developer 3 | Auth, transactions, forecasts, anomalies | `backend/app/api/*.py`, `backend/app/services/scanner.py`, `backend/app/services/forecast.py` |
| **Database & Models** | Developer 4 | DB schema, models, migrations, audit logs | `backend/app/models/*.py`, `backend/migrations/`, `backend/app/database.py` |

### Integration Points

```yaml
# Where teams intersect:
DSS ↔ API:      DSS endpoints in dss.py called by frontend services
Frontend ↔ DSS: dssService.js calls /api/dss/* endpoints
Models ↔ DSS:   DSS services use SQLAlchemy models for data access
```

---

## 🚀 Quick Start

### Prerequisites

```bash
# Required
Python 3.11+
Node.js 18+
PostgreSQL 15+ (or Docker)
Docker & Docker Compose (optional but recommended)
Git
```

### Option 1: Full Docker Setup (Recommended)

```bash
# 1. Clone the repository
git clone https://github.com/your-org/prophtscan.git
cd prophtscan

# 2. Build and run all services
docker-compose up --build

# 3. Access the application
# Frontend:    http://localhost:3000
# Backend API: http://localhost:8000
# Swagger UI:  http://localhost:8000/docs
# Database:    localhost:5432 (user: postgres, password: secret)
```

### Option 2: Local Development

```bash
# Terminal 1: Database (using Docker for DB only)
docker run --name prophtscan-db \
  -e POSTGRES_PASSWORD=secret \
  -e POSTGRES_DB=prophtscan \
  -p 5432:5432 -d postgres:15

# Terminal 2: Backend
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000

# Terminal 3: Frontend
cd frontend
npm install
npm start
```

### Initial Setup (First Run Only)

```bash
# Create database tables
cd backend
python -c "
from app.database import engine, Base
from app.models import user, transaction, invoice, forecast, anomaly, audit_log
Base.metadata.create_all(bind=engine)
print('✅ Tables created!')
"

# Seed test data (optional)
python scripts/seed_data.py
```

---

## 📝 Development Guide

### Environment Variables

**Backend (.env in `/backend`)**
```env
DATABASE_URL=postgresql://postgres:secret@localhost:5432/prophtscan
SECRET_KEY=your-super-secret-key-change-this
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
ENVIRONMENT=development
```

**Frontend (.env in `/frontend`)**
```env
REACT_APP_API_URL=http://localhost:8000
REACT_APP_WS_URL=ws://localhost:8000  # For real-time alerts
```

### Running Tests

```bash
# Backend tests
cd backend
pytest tests/ -v --cov=app

# Frontend tests
cd frontend
npm test
```

### Code Style

```bash
# Backend (Black formatter)
pip install black
black backend/app

# Frontend (Prettier)
npm run format
```

### Common Commands

```bash
# Database migrations
cd backend
alembic revision --autogenerate -m "description"
alembic upgrade head

# Rebuild Docker containers
docker-compose down
docker-compose build --no-cache
docker-compose up

# View logs
docker-compose logs -f backend
docker-compose logs -f frontend

# Enter backend container
docker-compose exec backend bash

# Reset database
docker-compose down -v
docker-compose up
```

---

## 🔌 API Documentation

Once running, visit **http://localhost:8000/docs** for interactive Swagger documentation.

### Key DSS Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/dss/risk/score` | Get comprehensive risk score |
| GET | `/api/dss/risk/heatmap` | Category-based risk heatmap |
| GET | `/api/dss/kpis` | All financial KPIs |
| POST | `/api/dss/what-if/evaluate` | Run scenario simulation |
| GET | `/api/dss/alerts` | Get active alerts |
| POST | `/api/dss/transactions/classify` | Categorize transaction |

### Example API Call

```bash
# Get risk score
curl -X GET "http://localhost:8000/api/dss/risk/score?user_id=1" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Run what-if simulation
curl -X POST "http://localhost:8000/api/dss/what-if/evaluate" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "user_id": 1,
    "scenario": {
      "type": "revenue_increase",
      "parameters": {"percentage": 20, "timeframe": 12}
    }
  }'
```

---

## 🧪 Testing the Application

### Login Credentials (After Seeding)

```
Email: admin@prophtscan.com
Password: Admin123!

# Or register a new user at /register
```

### Test Flow

1. **Register** a new account at `http://localhost:3000/register`
2. **Select Mode** (Personal/Small Business/Enterprise)
3. **Upload a PDF invoice** using the Invoices page
4. **View Dashboard** with adaptive UI based on mode
5. **Run What-If simulations** in the DSS panel
6. **Ask the Chatbot** questions like "How much did I spend last month?"

---

## 🚢 Deployment

### Production Build

```bash
# Backend
cd backend
docker build -t prophtscan-backend:latest .

# Frontend
cd frontend
npm run build
docker build -t prophtscan-frontend:latest .
```

### Deploy to Cloud (Example: AWS ECS)

```yaml
# docker-compose.prod.yml
version: '3.8'
services:
  db:
    image: postgres:15
    environment:
      POSTGRES_DB: prophtscan
      POSTGRES_USER: ${DB_USER}
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data

  backend:
    image: prophtscan-backend:latest
    environment:
      DATABASE_URL: postgresql://${DB_USER}:${DB_PASSWORD}@db:5432/prophtscan
      SECRET_KEY: ${SECRET_KEY}
    depends_on:
      - db

  frontend:
    image: prophtscan-frontend:latest
    ports:
      - "80:3000"
```

### Environment Checklist

- [ ] Change `SECRET_KEY` to random 32+ character string
- [ ] Set `ENVIRONMENT=production`
- [ ] Enable HTTPS (use Let's Encrypt or cloud LB)
- [ ] Set up database backups
- [ ] Configure monitoring (Sentry, Prometheus)
- [ ] Set up rate limiting

---

## 🤝 Contributing

### Git Workflow

```bash
# 1. Create feature branch
git checkout -b feature/your-feature-name

# 2. Make changes and commit
git add .
git commit -m "feat: add risk scoring engine"

# 3. Push and create PR
git push origin feature/your-feature-name
```

### Commit Convention

```
feat: new feature
fix: bug fix
docs: documentation
style: formatting
refactor: code restructure
test: add tests
chore: maintenance
```

### Pull Request Process

1. Update relevant documentation
2. Add tests for new features
3. Ensure all tests pass
4. Get review from at least 2 team members
5. Merge to `develop` branch

---

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- Built with [FastAPI](https://fastapi.tiangolo.com/) and [React](https://react.dev/)
- Icons by [Lucide](https://lucide.dev/)
- Charts by [Recharts](https://recharts.org/)

---

<div align="center">
  
  **Made with 🔮 by the ProphtScan Team**
  
  [Report Bug](https://github.com/your-org/prophtscan/issues) · 
  [Request Feature](https://github.com/your-org/prophtscan/issues) · 
  [Documentation](https://docs.prophtscan.com)
  
</div>

