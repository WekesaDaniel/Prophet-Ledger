# backend/app/services/chatbot.py
import re
import os
from typing import Dict, List, Optional
from sqlalchemy.orm import Session
from app.models.transaction import Transaction
from app.models.user import User
from groq import Groq
from datetime import datetime, timedelta

class ChatbotEngine:
    """NLP-based chatbot for financial queries using Groq API"""
    
    def __init__(self, db: Session):
        self.db = db
        self.groq_client = None
        self._init_groq_client()
    
    def _init_groq_client(self):
        """Initialize Groq client if API key is available"""
        api_key = os.environ.get("GROQ_API_KEY")
        if api_key:
            self.groq_client = Groq(api_key=api_key)
            print("Groq client initialized")
        else:
            print("GROQ_API_KEY not found, using fallback responses")
    
    def process_query(self, user_id: int, query: str) -> Dict:
        """Process natural language query using Groq API"""
        
        if self._is_non_financial_query(query):
            return self._handle_non_financial_query(query)
        
        if self.groq_client:
            try:
                return self._process_with_groq(user_id, query)
            except Exception as e:
                print(f"Groq API error: {e}, falling back to mock responses")
                return self._process_with_mock(user_id, query)
        
        return self._process_with_mock(user_id, query)
    
    def _is_non_financial_query(self, query: str) -> bool:
        """Check if query is non-financial and should be rejected"""
        query_lower = query.lower()
        
        allowed_topics = [
            'spent', 'spend', 'money', 'budget', 'balance', 'transaction', 'payment',
            'income', 'expense', 'saving', 'investment', 'forecast', 'predict',
            'anomaly', 'fraud', 'bill', 'tax', 'price', 'cost', 'salary',
            'cash', 'bank', 'account', 'credit', 'debit', 'loan', 'debt',
            'interest', 'return', 'stock', 'portfolio', 'retirement', 'emergency',
            'goal', 'plan', 'track', 'analyze', 'report', 'summary', 'overview',
            'net worth', 'cash flow', 'burn rate', 'runway', 'kpi', 'risk'
        ]
        
        disallowed_topics = [
            'weather', 'sports', 'movie', 'music', 'game', 'politics', 'celebrity',
            'recipe', 'travel', 'hotel', 'flight', 'news', 'entertainment',
            'what is the capital', 'who is the president', 'history of',
            'science fiction', 'artificial intelligence'
        ]
        
        has_disallowed = any(topic in query_lower for topic in disallowed_topics)
        has_financial = any(topic in query_lower for topic in allowed_topics)
        
        if has_disallowed and not has_financial:
            return True
        return False
    
    def _handle_non_financial_query(self, query: str) -> Dict:
        """Return response for non-financial queries"""
        return {
            "query": query,
            "response": "I'm your financial assistant and can only help with finance-related questions. I can answer questions about your spending, balance, forecasts, budgets, transactions, anomalies, and financial planning. How can I help with your finances today?",
            "intent": "blocked",
            "confidence": 1.0
        }
    
    def _process_with_groq(self, user_id: int, query: str) -> Dict:
        """Process query using Groq API"""
        
        system_prompt = (
            "You are ProphetLedger's AI Financial Assistant. You ONLY help with financial questions. "
            "Keep responses concise and actionable (max 150 words). Be helpful but factual. "
            "If asked about non-financial topics, politely decline. "
            "Never give professional financial advice - suggest consulting a financial advisor for major decisions. "
            "If asked about the model, respond with: I am powered by Groq's Llama 3.3 70B model."
        )
        
        context = self._get_financial_context(user_id)
        
        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": f"Financial context: {context}\n\nUser question: {query}"}
        ]
        
        completion = self.groq_client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=messages,
            temperature=0.7,
            max_tokens=500
        )
        
        response = completion.choices[0].message.content
        
        return {
            "query": query,
            "response": response,
            "intent": "groq_financial",
            "confidence": 0.95
        }
    
    def _get_user_context(self, user_id: int) -> str:
        """Get user financial context for personalization"""
        return "User is on the dashboard page. Current balance is approximately $12,845."
    
    def _get_financial_context(self, user_id: int) -> str:
        """Get financial data context for Groq"""
        return (
            "User's financial summary: Monthly spending: $3,200, Monthly income: $5,000, "
            "Savings rate: 18%, Top categories: Dining $780, Shopping $450, Transport $320, "
            "Current balance: $12,845, No recent anomalies detected."
        )
    
    def _process_with_mock(self, user_id: int, query: str) -> Dict:
        """Fallback mock responses when Groq is unavailable"""
        query_lower = query.lower()
        
        if "what model" in query_lower or "what llm" in query_lower or "what ai" in query_lower:
            return {
                "query": query,
                "response": "I am powered by Groq's Llama 3.3 70B model, optimized for fast and accurate financial responses.",
                "intent": "model_info",
                "confidence": 0.99
            }
        
        if "spent" in query_lower or "spend" in query_lower:
            return {
                "query": query, 
                "response": "You've spent $3,247 in the last 30 days. Your top category is Dining at $780.", 
                "intent": "spending", 
                "confidence": 0.8
            }
        elif "balance" in query_lower:
            return {
                "query": query, 
                "response": "Your current balance is $12,845.", 
                "intent": "balance", 
                "confidence": 0.9
            }
        elif "forecast" in query_lower or "predict" in query_lower:
            return {
                "query": query, 
                "response": "Based on your patterns, next month you will spend around $3,200.", 
                "intent": "forecast", 
                "confidence": 0.85
            }
        elif "anomaly" in query_lower or "unusual" in query_lower:
            return {
                "query": query, 
                "response": "No unusual transactions detected in the last 7 days.", 
                "intent": "anomaly", 
                "confidence": 0.85
            }
        elif "budget" in query_lower:
            return {
                "query": query, 
                "response": "You are under budget by $350 this month. Keep it up!", 
                "intent": "budget", 
                "confidence": 0.85
            }
        elif "help" in query_lower or "capabilities" in query_lower:
            return {
                "query": query,
                "response": "I can help with spending analysis, balance inquiries, financial forecasts, anomaly detection, budget tracking, and page explanations. Try asking 'How much did I spend?' or 'What is my balance?'",
                "intent": "help",
                "confidence": 0.95
            }
        else:
            return {
                "query": query, 
                "response": "I can help with spending, balances, forecasts, budgets, and anomalies. Try asking 'How much did I spend?' or 'What is my current balance?'", 
                "intent": "unknown", 
                "confidence": 0.5
            }
    
    def classify_transaction(self, description: str, amount: float) -> Dict:
        """Classify transaction into category (used by DSS)"""
        
        if self.groq_client:
            try:
                return self._classify_with_groq(description, amount)
            except Exception as e:
                print(f"Groq classification error: {e}")
                return self._classify_with_keywords(description, amount)
        
        return self._classify_with_keywords(description, amount)
    
    def _classify_with_groq(self, description: str, amount: float) -> Dict:
        """Use Groq to intelligently classify transactions"""
        
        system_prompt = (
            "Categorize the transaction into one of these categories: "
            "Groceries, Dining, Transport, Utilities, Entertainment, Shopping, Health, Rent, Income, Other. "
            "Return ONLY the category name."
        )
        
        completion = self.groq_client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": f"Transaction: {description}, Amount: ${amount}"}
            ],
            temperature=0.3,
            max_tokens=20
        )
        
        category = completion.choices[0].message.content.strip()
        
        valid_categories = ['Groceries', 'Dining', 'Transport', 'Utilities', 'Entertainment', 'Shopping', 'Health', 'Rent', 'Income', 'Other']
        if category not in valid_categories:
            category = 'Other'
        
        return {
            "category": category,
            "confidence": 0.85,
            "suggested_tags": [category.lower(), "ai-classified"],
            "method": "groq"
        }
    
    def _classify_with_keywords(self, description: str, amount: float) -> Dict:
        """Fallback keyword-based classification"""
        
        category_keywords = {
            'Groceries': ['walmart', 'target', 'kroger', 'safeway', 'whole foods', 'aldi', 'trader joe', 'costco', 'sam club'],
            'Dining': ['starbucks', 'mcdonalds', 'chipotle', 'pizza', 'restaurant', 'cafe', 'burger', 'dining'],
            'Transport': ['uber', 'lyft', 'taxi', 'gas', 'shell', 'exxon', 'parking', 'transit', 'bus'],
            'Utilities': ['electric', 'water', 'gas bill', 'internet', 'phone', 'comcast', 'att', 'verizon'],
            'Entertainment': ['netflix', 'spotify', 'disney', 'hulu', 'cinema', 'movie', 'concert', 'theater'],
            'Shopping': ['amazon', 'ebay', 'etsy', 'zara', 'nike', 'clothing', 'shoes', 'best buy'],
            'Health': ['cvs', 'walgreens', 'pharmacy', 'doctor', 'dental', 'hospital', 'clinic'],
            'Rent': ['rent', 'apartment', 'lease', 'property'],
            'Income': ['salary', 'payroll', 'deposit', 'transfer', 'freelance', 'payment']
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
                    "suggested_tags": [category.lower(), "keyword-classified"],
                    "method": "keyword"
                }
        
        return {
            "category": "Other",
            "confidence": 0.3,
            "suggested_tags": ["unclassified", "review"],
            "method": "keyword"
        }