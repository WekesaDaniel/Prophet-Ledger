from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import engine, Base
from app.api import auth, users

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="ProphetLedger API",
    description="AI-Driven Financial Intelligence Platform",
    version="1.0.0"
)

# CORS middleware - Allow all origins for development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router)
app.include_router(users.router)

@app.get("/")
def root():
    return {"message": "ProphetLedger API is running!"}

@app.get("/health")
def health_check():
    return {"status": "healthy"}
