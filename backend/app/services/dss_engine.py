# backend/app/services/dss_engine.py
import numpy as np
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from typing import Dict, List, Optional
from app.models.transaction import Transaction
from supabase import create_client
import os

class DSSEngine:
    """Decision Support System - Knowledge Engine for financial insights"""
    
    def __init__(self):
        self.supabase = None
        self._init_supabase()
    
    def _init_supabase(self):
        url = os.environ.get("SUPABASE_URL")
        key = os.environ.get("SUPABASE_ANON_KEY")
        if url and key:
            self.supabase = create_client(url, key)
    
    def calculate_risk_score(self, user_id: str) -> Dict:
        """Calculate comprehensive risk score based on multiple factors"""
        try:
            # Fetch user transactions
            response = self.supabase.table('transactions')\
                .select('amount, type, date')\
                .eq('user_id', user_id)\
                .execute()
            
            transactions = response.data
            if not transactions:
                return self._default_risk_score()
            
            # Calculate metrics
            incomes = [t['amount'] for t in transactions if t['type'] == 'income']
            expenses = [t['amount'] for t in transactions if t['type'] == 'expense']
            
            total_income = sum(incomes)
            total_expense = sum(expenses)
            net_cashflow = total_income - total_expense
            
            # Volatility score
            if len(expenses) > 1:
                volatility = np.std(expenses) / (np.mean(expenses) or 1)
            else:
                volatility = 0.5
            
            # Liquidity score (cash flow ratio)
            cashflow_ratio = net_cashflow / (total_income or 1)
            liquidity_score = max(0, 100 - abs(cashflow_ratio * 100))
            
            # Combine into final risk score (0-100, higher = more risky)
            risk_score = min(100, max(0, int(
                (volatility * 30) +  # 30% weight
                (max(0, 100 - liquidity_score) * 40) +  # 40% weight
                (max(0, (total_expense / (total_income or 1)) * 50) * 30)  # 30% weight
            )))
            
            # Determine risk level
            if risk_score < 30:
                risk_level = "low"
                recommendation = "Your financial health looks good. Continue maintaining healthy spending habits."
            elif risk_score < 60:
                risk_level = "medium"
                recommendation = "Some risk factors detected. Review your spending patterns and consider building emergency savings."
            else:
                risk_level = "high"
                recommendation = "High risk detected. Review your expenses and consider reducing discretionary spending."
            
            # Get active anomalies count
            anomalies_response = self.supabase.table('anomalies')\
                .select('id')\
                .eq('user_id', user_id)\
                .eq('status', 'pending')\
                .execute()
            
            active_anomalies = len(anomalies_response.data)
            
            # Save to risk_scores table
            self.supabase.table('risk_scores').insert({
                'user_id': user_id,
                'risk_score': risk_score,
                'risk_level': risk_level,
                'active_anomalies': active_anomalies,
                'recommendation': recommendation
            }).execute()
            
            return {
                "risk_score": risk_score,
                "risk_level": risk_level,
                "active_anomalies": active_anomalies,
                "recommendation": recommendation,
                "trend": "improving" if risk_score < 50 else "worsening",
                "last_updated": datetime.now().isoformat()
            }
        except Exception as e:
            print(f"Risk score calculation error: {e}")
            return self._default_risk_score()
    
    def _default_risk_score(self):
        return {
            "risk_score": 45,
            "risk_level": "medium",
            "active_anomalies": 0,
            "recommendation": "Add more transactions for better risk assessment.",
            "trend": "stable",
            "last_updated": datetime.now().isoformat()
        }
    
    def calculate_kpis(self, user_id: str, mode: str = "personal") -> List[Dict]:
        """Calculate KPI metrics based on user mode"""
        try:
            # Fetch transactions
            response = self.supabase.table('transactions')\
                .select('amount, type, date, category')\
                .eq('user_id', user_id)\
                .execute()
            
            transactions = response.data
            if not transactions:
                return self._default_kpis(mode)
            
            # Calculate time periods
            now = datetime.now()
            thirty_days_ago = now - timedelta(days=30)
            ninety_days_ago = now - timedelta(days=90)
            
            # Current month vs previous month
            current_month_txs = [t for t in transactions if datetime.fromisoformat(t['date']) >= thirty_days_ago]
            previous_month_txs = [t for t in transactions if thirty_days_ago > datetime.fromisoformat(t['date']) >= ninety_days_ago]
            
            current_income = sum(t['amount'] for t in current_month_txs if t['type'] == 'income')
            current_expense = sum(t['amount'] for t in current_month_txs if t['type'] == 'expense')
            previous_income = sum(t['amount'] for t in previous_month_txs if t['type'] == 'income')
            previous_expense = sum(t['amount'] for t in previous_month_txs if t['type'] == 'expense')
            
            # Calculate savings rate
            savings_rate = ((current_income - current_expense) / (current_income or 1)) * 100
            
            # Calculate burn rate (monthly average expenses)
            all_expenses = [t['amount'] for t in transactions if t['type'] == 'expense']
            burn_rate = sum(all_expenses) / max(1, len(all_expenses)) * 30
            
            # Calculate cash runway
            cash_balance = current_income - current_expense
            runway = int(cash_balance / (burn_rate / 30)) if burn_rate > 0 and cash_balance > 0 else 0
            
            mode_kpis = {
                "personal": [
                    {"title": "Financial Health", "value": min(100, max(0, 50 + savings_rate)), "change": 5.2, "trend": "up", "benchmark": 75, "status": "good", "recommendation": "Keep saving 20% of income"},
                    {"title": "Monthly Spending", "value": current_expense, "change": -3.1, "trend": "down", "benchmark": 3500, "status": "good", "recommendation": "You are under budget"},
                    {"title": "Savings Rate", "value": round(savings_rate), "change": 3, "trend": "up", "benchmark": 20, "status": "good" if savings_rate >= 20 else "warning", "recommendation": f"Aim for 20% savings rate. Current: {round(savings_rate)}%"},
                    {"title": "Net Worth", "value": cash_balance, "change": 8, "trend": "up", "benchmark": 10000, "status": "good" if cash_balance > 10000 else "warning", "recommendation": "Track your net worth monthly"}
                ],
                "small_business": [
                    {"title": "Cash Runway", "value": runway, "change": -2, "trend": "down", "benchmark": 12, "status": "good" if runway >= 12 else "warning", "recommendation": f"{runway} months of runway remaining"},
                    {"title": "Burn Rate", "value": burn_rate, "change": 8, "trend": "up", "benchmark": 10000, "status": "critical" if burn_rate > 10000 else "warning", "recommendation": "Review operational expenses"},
                    {"title": "Monthly Revenue", "value": current_income, "change": 8.2, "trend": "up", "benchmark": 45000, "status": "good", "recommendation": "Revenue growing well"},
                    {"title": "Profit Margin", "value": round(((current_income - current_expense) / (current_income or 1)) * 100), "change": 3, "trend": "up", "benchmark": 20, "status": "good", "recommendation": "Margins improving"}
                ],
                "enterprise": [
                    {"title": "Total Assets", "value": cash_balance * 10, "change": 12.5, "trend": "up", "benchmark": 2000000, "status": "good", "recommendation": "Asset growth strong"},
                    {"title": "Risk Score", "value": self.calculate_risk_score(user_id)["risk_score"], "change": -5, "trend": "down", "benchmark": 30, "status": "warning", "recommendation": "Monitor risk factors"},
                    {"title": "Active Users", "value": 24, "change": 4, "trend": "up", "benchmark": 20, "status": "good", "recommendation": "User adoption growing"},
                    {"title": "Department ROI", "value": 18, "change": 2, "trend": "up", "benchmark": 15, "status": "good", "recommendation": "ROI exceeded targets"}
                ]
            }
            
            return mode_kpis.get(mode, mode_kpis["personal"])
        except Exception as e:
            print(f"KPI calculation error: {e}")
            return self._default_kpis(mode)
    
    def _default_kpis(self, mode):
        return [
            {"title": "Financial Health", "value": 78, "change": 5.2, "trend": "up", "benchmark": 75, "status": "good", "recommendation": "Keep saving!"},
            {"title": "Cash Runway", "value": 12, "change": -2, "trend": "down", "benchmark": 12, "status": "warning", "recommendation": "Watch spending"},
            {"title": "Burn Rate", "value": 15000, "change": 8, "trend": "up", "benchmark": 10000, "status": "critical", "recommendation": "Cut expenses"},
            {"title": "Savings Rate", "value": 18, "change": 3, "trend": "up", "benchmark": 20, "status": "warning", "recommendation": "Save more"}
        ]
    
    def what_if_evaluation(self, user_id: str, scenario: Dict) -> Dict:
        """Evaluate what-if scenarios"""
        try:
            # Fetch current financial state
            response = self.supabase.table('transactions')\
                .select('amount, type')\
                .eq('user_id', user_id)\
                .execute()
            
            transactions = response.data
            monthly_income = sum(t['amount'] for t in transactions if t['type'] == 'income')
            monthly_expense = sum(t['amount'] for t in transactions if t['type'] == 'expense')
            
            scenario_type = scenario.get('type', 'revenue_increase')
            params = scenario.get('parameters', {})
            
            if scenario_type == 'revenue_increase':
                percentage = params.get('percentage', 10)
                months = params.get('timeframe', 12)
                investment = params.get('investment_needed', 0)
                
                additional_revenue = monthly_income * (percentage / 100) * months
                additional_profit = additional_revenue * 0.7  # Assuming 30% costs
                roi = (additional_profit / investment * 100) if investment > 0 else 999
                
                return {
                    "scenario": f"Increase revenue by {percentage}%",
                    "impact": {
                        "additional_revenue": round(additional_revenue, 2),
                        "additional_profit": round(additional_profit, 2),
                        "new_monthly_profit": round((monthly_income - monthly_expense) + (additional_profit / months), 2),
                        "roi_percentage": round(roi, 1),
                        "payback_months": round(investment / (additional_profit / months), 1) if additional_profit > 0 else None
                    },
                    "recommendation": "This scenario shows strong potential ROI. Consider implementing.",
                    "risks": ["Market competition", "Customer acquisition costs", "Operational scaling"]
                }
            
            elif scenario_type == 'cost_reduction':
                reduction = params.get('reduction_percentage', 10)
                category = params.get('category', 'operations')
                
                savings = monthly_expense * (reduction / 100)
                annual_savings = savings * 12
                
                return {
                    "scenario": f"Reduce {category} costs by {reduction}%",
                    "impact": {
                        "monthly_savings": round(savings, 2),
                        "annual_savings": round(annual_savings, 2),
                        "profit_improvement": round((savings / monthly_expense) * 100, 1),
                        "new_net_margin": round(((monthly_income - (monthly_expense - savings)) / monthly_income) * 100, 1)
                    },
                    "recommendation": f"Potential savings of ${savings:,.2f} per month.",
                    "risks": ["Quality impact", "Employee morale", "Vendor relationships"]
                }
            
            elif scenario_type == 'new_investment':
                amount = params.get('amount', 10000)
                expected_return = params.get('expected_return', 15)
                
                annual_return = amount * (expected_return / 100)
                
                return {
                    "scenario": f"New investment of ${amount:,.2f}",
                    "impact": {
                        "annual_return": round(annual_return, 2),
                        "roi_percentage": expected_return,
                        "payback_years": round(amount / annual_return, 1) if annual_return > 0 else 0
                    },
                    "recommendation": "Evaluate risk vs reward before proceeding.",
                    "risks": ["Market volatility", "Liquidity concerns", "Opportunity cost"]
                }
            
            elif scenario_type == 'debt_payoff':
                debt_amount = params.get('debt_amount', 5000)
                interest_rate = params.get('interest_rate', 18)
                
                interest_saved = debt_amount * (interest_rate / 100)
                
                return {
                    "scenario": f"Pay off ${debt_amount:,.2f} debt",
                    "impact": {
                        "interest_saved": round(interest_saved, 2),
                        "monthly_cashflow_improvement": round(interest_saved / 12, 2),
                        "debt_free_date": (datetime.now() + timedelta(days=30)).strftime('%Y-%m-%d')
                    },
                    "recommendation": "Paying off high-interest debt is financially beneficial.",
                    "risks": ["Reduced liquidity", "Opportunity cost of cash"]
                }
            
            elif scenario_type == 'hire_employee':
                salary = params.get('salary', 60000)
                months = params.get('timeframe', 12)
                
                total_cost = salary * (months / 12) * 1.3  # Including benefits
                expected_revenue = total_cost * 1.5  # Expected ROI from new hire
                
                return {
                    "scenario": f"Hire new employee at ${salary:,.2f}/year",
                    "impact": {
                        "total_cost": round(total_cost, 2),
                        "expected_revenue": round(expected_revenue, 2),
                        "net_impact": round(expected_revenue - total_cost, 2),
                        "break_even_months": round((total_cost / (expected_revenue / months)) * months, 1)
                    },
                    "recommendation": "Calculate expected revenue contribution before hiring.",
                    "risks": ["Training period", "Cultural fit", "Productivity ramp-up"]
                }
            
            return {"error": "Unknown scenario type"}
            
        except Exception as e:
            print(f"What-if evaluation error: {e}")
            return {"error": str(e)}
    
    def get_recommendations(self, user_id: str) -> List[Dict]:
        """Generate personalized financial recommendations"""
        try:
            # Fetch user data
            response = self.supabase.table('transactions')\
                .select('amount, type, category')\
                .eq('user_id', user_id)\
                .execute()
            
            transactions = response.data
            
            recommendations = []
            
            # Analyze spending patterns
            expenses = [t for t in transactions if t['type'] == 'expense']
            expense_by_category = {}
            for e in expenses:
                cat = e.get('category', 'Other')
                expense_by_category[cat] = expense_by_category.get(cat, 0) + e['amount']
            
            # Find highest spending category
            if expense_by_category:
                top_category = max(expense_by_category, key=expense_by_category.get)
                top_amount = expense_by_category[top_category]
                recommendations.append({
                    "id": 1,
                    "title": f"Reduce {top_category} Spending",
                    "description": f"You've spent ${top_amount:,.2f} on {top_category}. Consider setting a monthly budget.",
                    "impact": f"Save ${round(top_amount * 0.2):,.2f}",
                    "priority": "high"
                })
            
            # Check savings rate
            total_income = sum(t['amount'] for t in transactions if t['type'] == 'income')
            total_expense = sum(t['amount'] for t in transactions if t['type'] == 'expense')
            savings_rate = ((total_income - total_expense) / (total_income or 1)) * 100
            
            if savings_rate < 20:
                recommendations.append({
                    "id": 2,
                    "title": "Increase Savings Rate",
                    "description": f"Your current savings rate is {round(savings_rate)}%. Aim for 20%.",
                    "impact": f"+{round(20 - savings_rate)}% savings rate",
                    "priority": "medium" if savings_rate > 10 else "high"
                })
            else:
                recommendations.append({
                    "id": 2,
                    "title": "Excellent Savings Habit",
                    "description": f"You're saving {round(savings_rate)}% of your income. Great job!",
                    "impact": "Keep it up!",
                    "priority": "low"
                })
            
            # Check for emergency fund
            recommendations.append({
                "id": 3,
                "title": "Build Emergency Fund",
                "description": "Aim to save 3-6 months of expenses for emergencies.",
                "impact": f"Target: ${round(total_expense * 3):,.2f}",
                "priority": "medium"
            })
            
            return recommendations
            
        except Exception as e:
            print(f"Recommendations error: {e}")
            return [
                {"id": 1, "title": "Track Your Expenses", "description": "Regular tracking helps identify saving opportunities.", "impact": "Better financial awareness", "priority": "medium"},
                {"id": 2, "title": "Set Monthly Budget", "description": "Create a budget to control spending.", "impact": "Improved savings", "priority": "high"},
                {"id": 3, "title": "Review Subscriptions", "description": "Check for unused subscriptions.", "impact": "Save $50-100 monthly", "priority": "medium"}
            ]

dss_engine = DSSEngine()