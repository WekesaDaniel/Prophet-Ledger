from sqlalchemy import Column, Integer, String, DateTime, Text, ForeignKey
from sqlalchemy.sql import func
from app.database import Base

class AuditLog(Base):
    __tablename__ = "audit_logs"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    action = Column(String, nullable=False)  # login, logout, create, update, delete, view
    resource = Column(String)  # transaction, invoice, user, etc.
    resource_id = Column(Integer)
    details = Column(Text)
    ip_address = Column(String)
    user_agent = Column(String)
    status = Column(String, default="success")  # success, failure
    created_at = Column(DateTime(timezone=True), server_default=func.now())
