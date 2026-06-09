from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey
from sqlalchemy.sql import func
from app.database import Base

class RiskScore(Base):
    __tablename__ = "risk_scores"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    risk_score = Column(Float, nullable=False)
    risk_level = Column(String)
    active_anomalies = Column(Integer, default=0)
    recommendation = Column(String)
    created_at = Column(DateTime(timezone=True), server_default=func.now())