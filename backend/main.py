from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.services.hf_model_loader import hf_loader

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def root():
    return {"message": "Hello from ProphetLedger!"}

@app.get("/api/health")
def health():
    return {"status": "ok"}

@app.get("/api/test")
def test():
    return {"message": "Test endpoint works"}