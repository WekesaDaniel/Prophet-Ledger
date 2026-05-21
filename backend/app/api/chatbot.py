# backend/app/api/chatbot.py
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from pydantic import BaseModel
from app.database import get_db
from app.middleware.auth import get_current_user
from app.models.user import User
from app.services.chatbot import ChatbotEngine

router = APIRouter(prefix="/api/chatbot", tags=["Chatbot"])

class ChatRequest(BaseModel):
    query: str

class ChatResponse(BaseModel):
    query: str
    response: str
    intent: str
    confidence: float

@router.post("/query", response_model=ChatResponse)
def chat(
    request: ChatRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Process natural language query using Groq API"""
    engine = ChatbotEngine(db)
    result = engine.process_query(current_user.id, request.query)
    return result

@router.post("/classify")
def classify_transaction(
    description: str,
    amount: float,
    db: Session = Depends(get_db)
):
    """Classify transaction into category using Groq"""
    engine = ChatbotEngine(db)
    classification = engine.classify_transaction(description, amount)
    return classification

@router.get("/suggestions")
def get_chat_suggestions(
    current_user: User = Depends(get_current_user)
):
    """Get suggested questions for the user"""
    return {
        "suggestions": [
            "How much did I spend on food?",
            "What is my current balance?",
            "Show me unusual transactions",
            "Forecast my spending for next month",
            "How am I doing on my budget?",
            "What AI model are you using?"
        ]
    }