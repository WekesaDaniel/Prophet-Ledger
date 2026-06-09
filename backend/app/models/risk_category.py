from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey
from sqlalchemy.sql import func
from app.database import Base

class RiskCategory(Base):
    __tablename__ = "risk_categories"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    category = Column(String)
    risk_score = Column(Float)
    amount = Column(Float)
    created_at = Column(DateTime(timezone=True), server_default=func.now())