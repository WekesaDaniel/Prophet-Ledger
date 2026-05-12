from fastapi import Request, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.audit_log import AuditLog
from app.middleware.auth import get_current_user
from app.models.user import User
import json

async def audit_middleware(request: Request, call_next):
    """Middleware to log all API requests"""
    
    # Get user ID if authenticated
    user_id = None
    try:
        auth_header = request.headers.get("Authorization")
        if auth_header:
            # Extract user from token (simplified)
            pass
    except:
        pass
    
    # Process request
    response = await call_next(request)
    
    # 🔴 HARDCODED - Replace with actual audit logging
    # Log to database asynchronously
    # audit_log = AuditLog(
    #     user_id=user_id,
    #     action=request.method,
    #     resource=request.url.path,
    #     ip_address=request.client.host,
    #     user_agent=request.headers.get("user-agent"),
    #     status="success" if response.status_code < 400 else "failure"
    # )
    # db.add(audit_log)
    # db.commit()
    
    return response

def log_action(user_id: int, action: str, resource: str, resource_id: int = None, details: dict = None):
    """Helper function to log user actions"""
    # 🔴 HARDCODED - Replace with database insert
    print(f"AUDIT: User {user_id} performed {action} on {resource}: {details}")
    
    # ✅ TO DO: Uncomment when database is ready
    # db = SessionLocal()
    # audit_log = AuditLog(
    #     user_id=user_id,
    #     action=action,
    #     resource=resource,
    #     resource_id=resource_id,
    #     details=json.dumps(details) if details else None
    # )
    # db.add(audit_log)
    # db.commit()
    # db.close()
