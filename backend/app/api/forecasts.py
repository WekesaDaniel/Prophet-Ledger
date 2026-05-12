from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional
from datetime import datetime, timedelta
from app.database import get_db
from app.middleware.auth import get_current_user
from app.models.user import User
from app.services.forecast import ForecastEngine

router = APIRouter(prefix="/api/forecasts", tags=["Forecasting"])

@router.get("/cashflow")
def get_cashflow_forecast(
    days: int = Query(30, ge=1, le=365),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get cash flow forecast for next N days
    🔴 HARDCODED - Replace with actual model predictions
    """
    engine = ForecastEngine(db)
    forecast = engine.forecast_cashflow(current_user.id, days)
    return {
        "user_id": current_user.id,
        "forecast_days": days,
        "data": forecast,
        "generated_at": datetime.now().isoformat()
    }

@router.get("/expenses")
def get_expense_forecast(
    category: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get expense forecast by category"""
    engine = ForecastEngine(db)
    predictions = engine.predict_expenses(current_user.id, category)
    return predictions

@router.get("/accuracy")
def get_forecast_accuracy(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get forecast accuracy metrics"""
    engine = ForecastEngine(db)
    return engine.calculate_forecast_accuracy(current_user.id)

@router.get("/trend/{metric}")
def get_trend_data(
    metric: str,
    period: str = Query("6m", regex="^(3m|6m|1y)$"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get historical trend data with forecasts
    metric: cashflow, expenses, savings
    """
    
    # 🔴 HARDCODED MOCK DATA - Replace with actual data
    days = 180 if period == "6m" else 90 if period == "3m" else 365
    dates = [(datetime.now() - timedelta(days=i)).strftime('%Y-%m-%d') for i in range(days, 0, -1)]
    
    # Generate mock trend data
    import numpy as np
    base_value = 50000 if metric == "cashflow" else 32000 if metric == "expenses" else 18000
    values = np.cumsum(np.random.normal(100, 500, days)) + base_value
    
    trend_data = [
        {"date": dates[i], "actual": round(float(values[i]), 2)}
        for i in range(len(dates))
    ]
    
    # Add forecast for next 30 days
    last_value = values[-1]
    forecast_dates = [(datetime.now() + timedelta(days=i)).strftime('%Y-%m-%d') for i in range(1, 31)]
    forecast_values = np.linspace(last_value, last_value * 1.05, 30)
    
    for i in range(30):
        trend_data.append({
            "date": forecast_dates[i],
            "actual": None,
            "forecast": round(float(forecast_values[i]), 2)
        })
    
    return {
        "metric": metric,
        "period": period,
        "history": trend_data,
        "anomalies": []  # Add anomaly markers here
    }
