# backend/app/models/transaction.py
from sqlalchemy import Column, Integer, Float, String, Date, DateTime, ForeignKey, Enum
from sqlalchemy.sql import func
from app.database import Base
import enum

class TransactionType(str, enum.Enum):
    INCOME = "income"
    EXPENSE = "expense"

class TransactionCategory(str, enum.Enum):
    GROCERIES = "groceries"
    DINING = "dining"
    TRANSPORT = "transport"
    UTILITIES = "utilities"
    ENTERTAINMENT = "entertainment"
    SHOPPING = "shopping"
    HEALTH = "health"
    RENT = "rent"
    INCOME = "income"
    OTHER = "other"

class Transaction(Base):
    __tablename__ = "transactions"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    amount = Column(Float, nullable=False)
    description = Column(String)
    category = Column(Enum(TransactionCategory), default=TransactionCategory.OTHER)
    type = Column(Enum(TransactionType), nullable=False)
    date = Column(Date, nullable=False)
    vendor = Column(String)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())