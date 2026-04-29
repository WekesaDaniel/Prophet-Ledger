# backend/app/services/dss/kpi_engine.py
from typing import Dict, List
from datetime import datetime, timedelta
from dataclasses import dataclass

@dataclass
class KPIResult:
    name: str
    value: float
    previous_value: float
    change_percentage: float
    trend: str  # up, down, stable
    benchmark: float
    status: str  # good, warning, critical
    recommendation: str

class KPIEngine:
    def __init__(self, db_session):
        self.db = db_session
    
    def calculate_all_kpis(self, user_id: int, mode: str) -> Dict:
        """Calculate all KPIs based on user mode"""
        kpis = {
            "financial_health": self._calculate_financial_health(user_id),
            "cashflow_velocity": self._calculate_cashflow_velocity(user_id),
            "burn_rate": self._calculate_burn_rate(user_id),
            "runway": self._calculate_runway(user_id),
            "savings_rate": self._calculate_savings_rate(user_id),
            "diversification_score": self._calculate_diversification(user_id),
            "recurring_revenue": self._calculate_recurring_revenue(user_id) if mode == "enterprise" else None,
            "customer_acquisition_cost": self._calculate_cac(user_id) if mode in ["small_business", "enterprise"] else None
        }
        
        return {k: v for k, v in kpis.items() if v is not None}
    
    def _calculate_financial_health(self, user_id: int) -> KPIResult:
        """Overall health score combining multiple metrics"""
        current_ratio = self._get_current_ratio(user_id)
        debt_to_income = self._get_debt_to_income(user_id)
        savings_ratio = self._calculate_savings_rate(user_id)
        
        # Weighted score
        health_score = (
            (current_ratio * 0.4) +
            ((1 - debt_to_income) * 100 * 0.3) +
            (savings_ratio * 0.3)
        )
        
        previous = self._get_previous_health_score(user_id)
        change = ((health_score - previous) / previous) * 100 if previous > 0 else 0
        
        status = "good" if health_score > 70 else "warning" if health_score > 40 else "critical"
        
        return KPIResult(
            name="Financial Health Score",
            value=round(health_score, 1),
            previous_value=round(previous, 1),
            change_percentage=round(change, 1),
            trend="up" if change > 0 else "down",
            benchmark=75,
            status=status,
            recommendation=self._get_health_recommendation(health_score, current_ratio, debt_to_income)
        )
    
    def _calculate_burn_rate(self, user_id: int) -> KPIResult:
        """Monthly cash burn rate (for businesses)"""
        monthly_expenses = self._get_average_monthly_expenses(user_id)
        monthly_revenue = self._get_average_monthly_revenue(user_id)
        
        burn_rate = monthly_expenses - monthly_revenue
        previous_burn = self._get_previous_burn_rate(user_id)
        change = ((burn_rate - previous_burn) / abs(previous_burn)) * 100 if previous_burn != 0 else 0
        
        status = "good" if burn_rate <= 0 else "warning" if burn_rate < monthly_revenue * 0.3 else "critical"
        
        return KPIResult(
            name="Net Burn Rate",
            value=round(burn_rate, 2),
            previous_value=round(previous_burn, 2),
            change_percentage=round(change, 1),
            trend="up" if burn_rate > previous_burn else "down",
            benchmark=0,
            status=status,
            recommendation=f"Your monthly burn is ${abs(round(burn_rate, 2))} {'profit' if burn_rate < 0 else 'loss'}. " +
                          ("Great! Increase marketing to scale." if burn_rate < 0 else "Reduce non-essential expenses.")
        )
    
    def _calculate_runway(self, user_id: int) -> KPIResult:
        """How many months until cash runs out"""
        cash_balance = self._get_current_cash_balance(user_id)
        monthly_burn = abs(self._calculate_burn_rate(user_id).value)
        
        if monthly_burn == 0:
            runway = 999  # Infinite
        else:
            runway = cash_balance / monthly_burn
        
        previous_runway = self._get_previous_runway(user_id)
        change = ((runway - previous_runway) / previous_runway) * 100 if previous_runway > 0 else 0
        
        status = "good" if runway > 12 else "warning" if runway > 6 else "critical"
        
        return KPIResult(
            name="Cash Runway",
            value=round(runway, 1),
            previous_value=round(previous_runway, 1),
            change_percentage=round(change, 1),
            trend="up" if runway > previous_runway else "down",
            benchmark=12,
            status=status,
            recommendation=f"You have {round(runway, 1)} months of runway. " +
                          ("Secure additional funding or increase revenue." if runway < 6 else "Maintain current trajectory.")
        )