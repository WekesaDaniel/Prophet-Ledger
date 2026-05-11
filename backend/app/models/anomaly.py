from sqlalchemy import Column, Integer, Float, String, DateTime, Boolean, ForeignKey
from sqlalchemy.sql import func
from app.database import Base

class Anomaly(Base):
    __tablename__ = "anomalies"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    transaction_id = Column(Integer, ForeignKey("transactions.id"), nullable=True)
    amount = Column(Float, nullable=False)
    description = Column(String)
    category = Column(String)
    anomaly_score = Column(Float, nullable=False)  # 0-100 scale
    reason = Column(String)
    status = Column(String, default="pending")  # pending, reviewed, false_positive
    reviewed_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    reviewed_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
