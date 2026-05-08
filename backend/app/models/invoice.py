from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, JSON
from sqlalchemy.sql import func
from app.database import Base

class Invoice(Base):
    __tablename__ = "invoices"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    vendor = Column(String)
    total_amount = Column(Float)
    tax = Column(Float, default=0)
    date = Column(DateTime(timezone=True))
    pdf_url = Column(String)
    extracted_data = Column(JSON)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
