from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional, List
from datetime import datetime
from app.database import get_db
from app.middleware.auth import get_current_user
from app.models.user import User
from app.models.anomaly import Anomaly
from app.services.anomaly import AnomalyDetectionEngine
from app.middleware.audit import log_action

router = APIRouter(prefix="/api/anomalies", tags=["Anomaly Detection"])

@router.get("/detect")
def detect_anomalies(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Run anomaly detection on user transactions"""
    engine = AnomalyDetectionEngine(db)
    anomalies = engine.detect_anomalies(current_user.id)
    
    # Log action
    log_action(current_user.id, "detect", "anomalies", details={"count": len(anomalies)})
    
    return {
        "user_id": current_user.id,
        "anomalies_found": len(anomalies),
        "anomalies": anomalies,
        "detected_at": datetime.now().isoformat()
    }

@router.get("/")
def get_anomalies(
    status: Optional[str] = Query(None, regex="^(pending|reviewed|false_positive)$"),
    limit: int = Query(50, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all anomalies for the user"""
    
    # 🔴 HARDCODED - Replace with database query
    mock_anomalies = [
        {
            "id": 1,
            "amount": 1249.99,
            "description": "Amazon Purchase",
            "category": "Shopping",
            "anomaly_score": 92,
            "reason": "3x above normal spending",
            "status": "pending",
            "created_at": "2024-05-15T10:30:00"
        },
        {
            "id": 2,
            "amount": 187.50,
            "description": "Uber Rides",
            "category": "Transport",
            "anomaly_score": 78,
            "reason": "Unusual frequency",
            "status": "reviewed",
            "created_at": "2024-05-10T14:20:00"
        }
    ]
    
    # ✅ TO DO: Uncomment when database is ready
    # query = db.query(Anomaly).filter(Anomaly.user_id == current_user.id)
    # if status:
    #     query = query.filter(Anomaly.status == status)
    # anomalies = query.order_by(Anomaly.created_at.desc()).limit(limit).all()
    
    return {
        "anomalies": mock_anomalies,
        "total": len(mock_anomalies),
        "pending": len([a for a in mock_anomalies if a["status"] == "pending"])
    }

@router.post("/{anomaly_id}/review")
def review_anomaly(
    anomaly_id: int,
    status: str = Query(..., regex="^(reviewed|false_positive)$"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Mark anomaly as reviewed or false positive"""
    engine = AnomalyDetectionEngine(db)
    result = engine.review_anomaly(anomaly_id, current_user.id, status)
    
    log_action(current_user.id, "review", "anomaly", resource_id=anomaly_id, details={"status": status})
    
    return result

@router.get("/risk/score")
def get_risk_score(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get overall risk score based on anomalies"""
    engine = AnomalyDetectionEngine(db)
    return engine.calculate_risk_score(current_user.id)

@router.get("/audit/logs")
def get_audit_logs(
    limit: int = Query(50, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get audit logs (Enterprise only)"""
    
    # 🔴 HARDCODED - Replace with database query
    mock_logs = [
        {
            "id": 1,
            "action": "login",
            "resource": "/api/auth/login",
            "ip_address": "192.168.1.1",
            "created_at": "2024-05-15T09:00:00"
        },
        {
            "id": 2,
            "action": "POST",
            "resource": "/api/transactions",
            "ip_address": "192.168.1.1",
            "created_at": "2024-05-15T10:30:00"
        }
    ]
    
    return {
        "logs": mock_logs,
        "total": len(mock_logs)
    }
