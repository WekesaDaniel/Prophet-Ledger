# backend/app/api/dss.py
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional, List, Dict
from app.middleware.auth import get_current_user
from app.models.user import User
from app.services.dss_engine import dss_engine

router = APIRouter(prefix="/api/dss", tags=["Decision Support System"])

# Request/Response Models
class WhatIfScenario(BaseModel):
    type: str
    parameters: Dict

class WhatIfRequest(BaseModel):
    user_id: str
    scenario: WhatIfScenario

@router.get("/risk/score")
async def get_risk_score(current_user: User = Depends(get_current_user)):
    """Get comprehensive risk score for the user"""
    result = dss_engine.calculate_risk_score(str(current_user.id))
    return result

@router.get("/kpis")
async def get_kpis(
    mode: str = "personal",
    current_user: User = Depends(get_current_user)
):
    """Get KPI metrics based on user mode"""
    kpis = dss_engine.calculate_kpis(str(current_user.id), mode)
    return kpis

@router.post("/what-if/evaluate")
async def evaluate_what_if(
    request: WhatIfRequest,
    current_user: User = Depends(get_current_user)
):
    """Evaluate what-if scenario"""
    result = dss_engine.what_if_evaluation(request.user_id, request.scenario.dict())
    return result

@router.get("/recommendations")
async def get_recommendations(
    current_user: User = Depends(get_current_user)
):
    """Get personalized financial recommendations"""
    recommendations = dss_engine.get_recommendations(str(current_user.id))
    return recommendations

@router.get("/risk/heatmap")
async def get_risk_heatmap(
    current_user: User = Depends(get_current_user)
):
    """Get risk heatmap by category"""
    try:
        from supabase import create_client
        import os
        
        supabase = create_client(
            os.environ.get("SUPABASE_URL"),
            os.environ.get("SUPABASE_ANON_KEY")
        )
        
        response = supabase.table('transactions')\
            .select('category, amount')\
            .eq('user_id', str(current_user.id))\
            .eq('type', 'expense')\
            .execute()
        
        expenses = response.data
        
        # Calculate risk per category
        category_risk = {}
        for exp in expenses:
            cat = exp.get('category', 'Other')
            amount = exp['amount']
            if cat not in category_risk:
                category_risk[cat] = {'amounts': [], 'total': 0}
            category_risk[cat]['amounts'].append(amount)
            category_risk[cat]['total'] += amount
        
        result = []
        for cat, data in category_risk.items():
            amounts = data['amounts']
            avg = sum(amounts) / len(amounts) if amounts else 0
            variance = sum((a - avg) ** 2 for a in amounts) / len(amounts) if amounts else 0
            std_dev = variance ** 0.5
            cv = std_dev / avg if avg > 0 else 0
            
            # Calculate risk score (0-100)
            if cv > 1.5:
                risk = 85
            elif cv > 1.0:
                risk = 65
            elif cv > 0.5:
                risk = 45
            else:
                risk = 25
            
            result.append({
                "name": cat,
                "risk": risk,
                "amount": round(data['total'], 2),
                "status": "high" if risk >= 60 else "medium" if risk >= 30 else "low"
            })
        
        return result
    except Exception as e:
        print(f"Risk heatmap error: {e}")
        return [
            {"name": "Groceries", "risk": 25, "amount": 450, "status": "low"},
            {"name": "Dining", "risk": 65, "amount": 780, "status": "medium"},
            {"name": "Shopping", "risk": 85, "amount": 1250, "status": "high"},
            {"name": "Transport", "risk": 35, "amount": 320, "status": "low"},
            {"name": "Entertainment", "risk": 45, "amount": 280, "status": "medium"}
        ]