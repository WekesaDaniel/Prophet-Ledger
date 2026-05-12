from sqlalchemy import Column, Integer, Float, DateTime, String, ForeignKey
from sqlalchemy.sql import func
from app.database import Base

class Forecast(Base):
    __tablename__ = "forecasts"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    metric = Column(String, nullable=False)  # cashflow, expenses, savings
    predicted_value = Column(Float, nullable=False)
    confidence_lower = Column(Float)
    confidence_upper = Column(Float)
    period_start = Column(DateTime(timezone=True))
    period_end = Column(DateTime(timezone=True))
    actual_value = Column(Float, nullable=True)
    model_used = Column(String, default="ARIMA")
    accuracy_score = Column(Float, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
