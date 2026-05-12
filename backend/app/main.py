from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import engine, Base
from app.api import auth, users
from app.api import forecasts, chatbot, anomalies
from app.middleware.audit import audit_middleware
from fastapi import Request

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="ProphetLedger API",
    description="AI-Driven Financial Intelligence Platform",
    version="1.0.0"
)

# Add audit middleware
@app.middleware("http")
async def add_audit_middleware(request: Request, call_next):
    return await audit_middleware(request, call_next)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router)
app.include_router(users.router)
app.include_router(forecasts.router)
app.include_router(chatbot.router)
app.include_router(anomalies.router)

@app.get("/")
def root():
    return {"message": "ProphetLedger API is running!", "version": "1.0.0"}

@app.get("/health")
def health_check():
    return {"status": "healthy"}

@app.get("/api/status")
def api_status():
    return {
        "status": "operational",
        "services": {
            "auth": "online",
            "forecasts": "online",
            "chatbot": "online",
            "anomalies": "online",
            "dss": "online"
        }
    }
