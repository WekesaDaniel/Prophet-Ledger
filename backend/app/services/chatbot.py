import re
from typing import Dict, List, Optional
from sqlalchemy.orm import Session
from app.models.transaction import Transaction
from app.models.user import User
from datetime import datetime, timedelta

class ChatbotEngine:
    """NLP-based chatbot for financial queries"""
    
    def __init__(self, db: Session):
        self.db = db
        self.intents = self._load_intents()
    
    def _load_intents(self) -> Dict:
        """🔴 HARDCODED intents - Replace with ML model or more comprehensive NLP"""
        return {
            "spending_query": {
                "patterns": [
                    r"how much did i spend on (.*)",
                    r"spending on (.*)",
                    r"expenses for (.*)",
                    r"money spent on (.*)"
                ],
                "responses": [
                    "You spent ${amount} on {category} in the last 30 days.",
                    "Your {category} expenses total ${amount} this month."
                ]
            },
            "balance_query": {
                "patterns": [
                    r"what is my balance",
                    r"how much money do i have",
                    r"current balance",
                    r"account balance"
                ],
                "responses": [
                    "Your current balance is ${balance}.",
                    "You have ${balance} in your account."
                ]
            },
            "savings_query": {
                "patterns": [
                    r"how much (did i|have i) save",
                    r"savings",
                    r"money saved"
                ],
                "responses": [
                    "You have saved ${savings} this month. Great job!",
                    "Your total savings are ${savings}."
                ]
            },
            "forecast_query": {
                "patterns": [
                    r"what (will|is) my (cash flow|spending) (be|look like)",
                    r"forecast",
                    r"predict",
                    r"next month"
                ],
                "responses": [
                    "Based on your patterns, next month you will spend around ${forecast}.",
                    "Your projected spending for next month is ${forecast}."
                ]
            },
            "anomaly_query": {
                "patterns": [
                    r"unusual transactions",
                    r"anomalies",
                    r"suspicious activity",
                    r"anything unusual"
                ],
                "responses": [
                    "I found {count} unusual transactions: {list}",
                    "No unusual transactions detected in the last 7 days."
                ]
            },
            "budget_query": {
                "patterns": [
                    r"budget",
                    r"how am i doing on budget",
                    r"budget status"
                ],
                "responses": [
                    "You are ${status} budget by ${amount} this month.",
                    "Your budget utilization is {percentage}%."
                ]
            }
        }
    
    def process_query(self, user_id: int, query: str) -> Dict:
        """Process natural language query and return response"""
        query_lower = query.lower()
        
        # 🔴 HARDCODED - Replace with actual NLP model
        # ✅ TO DO: Integrate with LLM or transformer model
        
        # Check for intents
        for intent_name, intent_data in self.intents.items():
            for pattern in intent_data["patterns"]:
                match = re.search(pattern, query_lower)
                if match:
                    # Extract category if exists
                    category = match.group(1) if match.groups() else None
                    response = self._execute_intent(intent_name, user_id, category)
                    return {
                        "query": query,
                        "intent": intent_name,
                        "response": response,
                        "confidence": 0.85
                    }
        
        # Default fallback
        return {
            "query": query,
            "intent": "unknown",
            "response": "I can help you with: spending queries, balance checks, forecasts, budgets, and anomalies. Try asking 'How much did I spend on food?'",
            "confidence": 0.3
        }
    
    def _execute_intent(self, intent: str, user_id: int, category: Optional[str] = None) -> str:
        """Execute intent and generate response"""
        
        # 🔴 HARDCODED responses - Replace with actual database queries
        
        if intent == "spending_query":
            # 🔴 HARDCODED - Calculate actual spending
            if category:
                # Mock data
                spending_map = {
                    "food": 450, "groceries": 320, "dining": 280,
                    "transport": 180, "utilities": 350, "entertainment": 200,
                    "shopping": 420, "health": 150
                }
                amount = spending_map.get(category, round(450 + (hash(category) % 500), 2))
                return f"You spent ${amount} on {category} in the last 30 days."
            return "You spent $3,247 in total over the last 30 days."
        
        elif intent == "balance_query":
            # 🔴 HARDCODED - Get from database
            return "Your current balance is $12,845."
        
        elif intent == "savings_query":
            return "You have saved $2,500 this month. Great job! That's 18% of your income."
        
        elif intent == "forecast_query":
            return "Based on your spending patterns, next month you will spend around $3,200."
        
        elif intent == "anomaly_query":
            return "No unusual transactions detected in the last 7 days. Everything looks normal."
        
        elif intent == "budget_query":
            return "You are under budget by $350 this month. Keep it up!"
        
        return "I'm not sure how to answer that. Try asking about spending, balance, or forecasts."
    
    def classify_transaction(self, description: str, amount: float) -> Dict:
        """Classify transaction into category (used by DSS)"""
        
        # 🔴 HARDCODED classification - Replace with ML model
        category_keywords = {
            'Groceries': ['walmart', 'target', 'kroger', 'safeway', 'whole foods', 'aldi', 'trader joe'],
            'Dining': ['starbucks', 'mcdonalds', 'chipotle', 'pizza', 'restaurant', 'cafe', 'burger'],
            'Transport': ['uber', 'lyft', 'taxi', 'gas', 'shell', 'exxon', 'parking'],
            'Utilities': ['electric', 'water', 'gas bill', 'internet', 'phone', 'comcast', 'att'],
            'Entertainment': ['netflix', 'spotify', 'disney', 'hulu', 'cinema', 'movie', 'concert'],
            'Shopping': ['amazon', 'ebay', 'etsy', 'zara', 'nike', 'clothing'],
            'Health': ['cvs', 'walgreens', 'pharmacy', 'doctor', 'dental', 'hospital'],
            'Rent': ['rent', 'apartment', 'lease', 'property'],
            'Income': ['salary', 'payroll', 'deposit', 'transfer', 'freelance']
        }
        
        description_lower = description.lower()
        
        for category, keywords in category_keywords.items():
            if any(keyword in description_lower for keyword in keywords):
                confidence = 0.8
                if amount > 1000 and category == 'Income':
                    confidence = 0.95
                elif amount > 500 and category in ['Rent', 'Utilities']:
                    confidence = 0.9
                
                return {
                    "category": category,
                    "confidence": confidence,
                    "suggested_tags": [category.lower(), "auto-classified"]
                }
        
        return {
            "category": "Other",
            "confidence": 0.3,
            "suggested_tags": ["unclassified", "review"]
        }
