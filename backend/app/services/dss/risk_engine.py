# backend/app/services/dss/risk_engine.py
from dataclasses import dataclass
from datetime import datetime, timedelta
import numpy as np
from typing import List, Dict

@dataclass
class RiskFactors:
    volatility_score: float      # 0-30
    liquidity_score: float       # 0-25
    debt_score: float           # 0-20
    consistency_score: float    # 0-15
    external_factors: float     # 0-10

class RiskEngine:
    def __init__(self, db_session):
        self.db = db_session
    
    def calculate_risk_score(self, user_id: int) -> Dict:
        """Main risk calculation entry point"""
        factors = self._collect_risk_factors(user_id)
        total_score = sum([
            factors.volatility_score,
            factors.liquidity_score,
            factors.debt_score,
            factors.consistency_score,
            factors.external_factors
        ])
        
        risk_level = self._get_risk_level(total_score)
        recommendations = self._generate_risk_recommendations(factors)
        
        return {
            "total_risk_score": round(total_score, 2),
            "risk_level": risk_level,
            "factors": {
                "volatility": factors.volatility_score,
                "liquidity": factors.liquidity_score,
                "debt": factors.debt_score,
                "consistency": factors.consistency_score,
                "external": factors.external_factors
            },
            "recommendations": recommendations,
            "trend": self._get_risk_trend(user_id)
        }
    
    def _collect_risk_factors(self, user_id: int) -> RiskFactors:
        transactions = self._get_transactions_last_90_days(user_id)
        amounts = [t.amount for t in transactions]
        
        # Volatility score (higher std dev = higher risk)
        if len(amounts) > 1:
            cv = np.std(amounts) / np.mean(amounts) if np.mean(amounts) > 0 else 1
            volatility_score = min(cv * 15, 30)
        else:
            volatility_score = 15
        
        # Liquidity score (cash flow ratio)
        income = sum(t.amount for t in transactions if t.type == 'income')
        expenses = sum(t.amount for t in transactions if t.type == 'expense')
        cashflow_ratio = (income - expenses) / income if income > 0 else 0
        liquidity_score = max(0, 25 - (cashflow_ratio * 50)) if cashflow_ratio < 0 else max(0, 10 - cashflow_ratio * 10)
        
        # Debt score
        debt_transactions = [t for t in transactions if t.category in ['loan', 'credit_card', 'debt']]
        debt_ratio = sum(t.amount for t in debt_transactions) / income if income > 0 else 1
        debt_score = min(debt_ratio * 40, 20)
        
        # Consistency score (negative months)
        monthly_net = self._calculate_monthly_net(transactions)
        negative_months = sum(1 for net in monthly_net if net < 0)
        consistency_score = min(negative_months * 5, 15)
        
        # External factors (could be API calls to economic indicators)
        external_factors = self._get_external_risk_factors()
        
        return RiskFactors(
            volatility_score=volatility_score,
            liquidity_score=liquidity_score,
            debt_score=debt_score,
            consistency_score=consistency_score,
            external_factors=external_factors
        )
    
    def _get_risk_level(self, score: float) -> str:
        if score < 20:
            return "LOW"
        elif score < 40:
            return "LOW-MODERATE"
        elif score < 60:
            return "MODERATE"
        elif score < 80:
            return "HIGH-MODERATE"
        else:
            return "CRITICAL"
    
    def _generate_risk_recommendations(self, factors: RiskFactors) -> List[str]:
        recommendations = []
        
        if factors.volatility_score > 20:
            recommendations.append("Your income/expenses are highly volatile. Consider building a larger emergency fund (3-6 months of expenses).")
        
        if factors.liquidity_score > 15:
            recommendations.append("Cash flow is tight. Review discretionary spending categories (entertainment, dining out).")
        
        if factors.debt_score > 12:
            recommendations.append("Debt payments are high relative to income. Consider debt consolidation or avalanche/snowball payoff strategy.")
        
        if factors.consistency_score > 10:
            recommendations.append("Multiple months with negative cash flow. Create a budget and track weekly to stay on course.")
        
        if not recommendations:
            recommendations.append("Your financial health looks good! Maintain current habits and consider increasing savings rate to 20%.")
        
        return recommendations


def _get_risk_trend(self, user_id: int) -> Dict:
    """Calculate risk score for last 6 months to show trend"""
    trends = []
    
    for i in range(6):
        month_start = datetime.now() - timedelta(days=30 * (i+1))
        month_end = datetime.now() - timedelta(days=30 * i)
        
        # Get transactions for that month
        monthly_tx = self._get_transactions_in_range(user_id, month_start, month_end)
        monthly_score = self._calculate_risk_from_transactions(monthly_tx)
        
        trends.append({
            "month": month_start.strftime("%B %Y"),
            "score": monthly_score
        })
    
    # Calculate direction
    if len(trends) >= 2:
        direction = "improving" if trends[0]["score"] > trends[-1]["score"] else "worsening"
    else:
        direction = "stable"
    
    return {
        "history": trends[::-1],  # oldest to newest
        "direction": direction,
        "change_percentage": ((trends[0]["score"] - trends[-1]["score"]) / trends[-1]["score"]) * 100 if trends[-1]["score"] > 0 else 0
    }