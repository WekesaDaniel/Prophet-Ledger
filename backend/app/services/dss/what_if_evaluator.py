# backend/app/services/dss/what_if_evaluator.py
from typing import Dict, List

class WhatIfEvaluator:
    """Evaluate different scenarios and their impact"""
    
    def evaluate_scenario(self, user_id: int, scenario: Dict) -> Dict:
        """
        scenario = {
            'type': 'revenue_increase',
            'parameters': {'percentage': 20, 'timeframe': 'next_quarter'}
        }
        """
        current_state = self._get_current_financial_state(user_id)
        
        if scenario['type'] == 'revenue_increase':
            return self._evaluate_revenue_increase(current_state, scenario['parameters'])
        elif scenario['type'] == 'cost_reduction':
            return self._evaluate_cost_reduction(current_state, scenario['parameters'])
        elif scenario['type'] == 'new_investment':
            return self._evaluate_investment(current_state, scenario['parameters'])
        elif scenario['type'] == 'debt_payoff':
            return self._evaluate_debt_payoff(current_state, scenario['parameters'])
        elif scenario['type'] == 'hire_employee':
            return self._evaluate_hiring(current_state, scenario['parameters'])
        else:
            return {"error": "Unknown scenario type"}
    
    def _evaluate_revenue_increase(self, current: Dict, params: Dict) -> Dict:
        percentage = params.get('percentage', 10)
        months = params.get('timeframe', 12)
        
        new_revenue = current['monthly_revenue'] * (1 + percentage/100)
        additional_profit = (new_revenue - current['monthly_revenue']) * months
        additional_profit -= current['variable_costs'] * (percentage/100) * months
        
        # Calculate ROI
        required_investment = params.get('investment_needed', 0)
        roi = (additional_profit / required_investment * 100) if required_investment > 0 else 999
        
        return {
            "scenario": f"Increase revenue by {percentage}%",
            "impact": {
                "additional_revenue": round(new_revenue * months - current['monthly_revenue'] * months, 2),
                "additional_profit": round(additional_profit, 2),
                "new_monthly_profit": round(current['monthly_profit'] + (additional_profit / months), 2),
                "roi_percentage": round(roi, 1),
                "payback_months": round(required_investment / (additional_profit / months), 1) if additional_profit > 0 else None
            },
            "recommendation": self._get_revenue_recommendation(percentage, roi),
            "risks": [
                "Market saturation may limit growth",
                "Increased customer acquisition costs",
                "Operational capacity constraints"
            ]
        }
    
    def _evaluate_cost_reduction(self, current: Dict, params: Dict) -> Dict:
        category = params.get('category', 'operations')
        reduction_percentage = params.get('reduction_percentage', 10)
        
        current_cost = current['expenses_by_category'].get(category, 0)
        savings = current_cost * (reduction_percentage/100)
        annual_savings = savings * 12
        
        return {
            "scenario": f"Reduce {category} costs by {reduction_percentage}%",
            "impact": {
                "monthly_savings": round(savings, 2),
                "annual_savings": round(annual_savings, 2),
                "profit_improvement": round((savings / current['monthly_profit']) * 100, 1) if current['monthly_profit'] > 0 else 999,
                "new_net_margin": round((current['monthly_profit'] + savings) / current['monthly_revenue'] * 100, 1)
            },
            "implementation_steps": [
                f"Audit current {category} expenses",
                "Negotiate with top 3 vendors",
                "Implement approval workflow for new {category} purchases"
            ],
            "difficulty": "medium",
            "timeline_months": 3
        }