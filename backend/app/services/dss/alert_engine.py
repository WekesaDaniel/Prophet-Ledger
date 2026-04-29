# backend/app/services/dss/alert_engine.py
from typing import List, Dict
from datetime import datetime, timedelta

class AlertEngine:
    """Proactive alerts and notifications"""
    
    def check_alerts(self, user_id: int) -> List[Dict]:
        alerts = []
        
        # 1. Unusual spending alert
        unusual_spending = self._detect_unusual_spending(user_id)
        if unusual_spending:
            alerts.extend(unusual_spending)
        
        # 2. Bill due soon
        upcoming_bills = self._get_upcoming_bills(user_id)
        for bill in upcoming_bills:
            alerts.append({
                "type": "bill_due",
                "severity": "warning",
                "title": f"Bill Due: {bill['vendor']}",
                "message": f"${bill['amount']} due on {bill['due_date']}",
                "action_needed": True
            })
        
        # 3. Budget threshold
        budget_alerts = self._check_budget_thresholds(user_id)
        alerts.extend(budget_alerts)
        
        # 4. Anomaly detection (from earlier)
        anomalies = self._get_recent_anomalies(user_id)
        for anomaly in anomalies:
            alerts.append({
                "type": "anomaly",
                "severity": "critical",
                "title": "Unusual Transaction Detected",
                "message": f"${anomaly['amount']} at {anomaly['vendor']} is {anomaly['deviation']}x above normal",
                "action_needed": True
            })
        
        # 5. Opportunity alerts (cashback, better rates)
        opportunities = self._find_opportunities(user_id)
        alerts.extend(opportunities)
        
        return sorted(alerts, key=lambda x: self._severity_score(x['severity']), reverse=True)
    
    def _detect_unusual_spending(self, user_id: int) -> List[Dict]:
        """Compare current month vs average"""
        current_month = self._get_current_month_spending(user_id)
        avg_month = self._get_average_monthly_spending(user_id)
        
        alerts = []
        for category, current in current_month.items():
            avg = avg_month.get(category, 0)
            if avg > 0:
                ratio = current / avg
                if ratio > 1.5:
                    alerts.append({
                        "type": "spike",
                        "severity": "warning" if ratio < 2 else "critical",
                        "title": f"Unusual {category} spending",
                        "message": f"{category} spending is {ratio:.1f}x higher than normal (${current} vs ${avg})",
                        "action_needed": False
                    })
        
        return alerts
    
    def _check_budget_thresholds(self, user_id: int) -> List[Dict]:
        alerts = []
        budgets = self._get_user_budgets(user_id)
        spending = self._get_current_month_spending(user_id)
        
        for category, budget in budgets.items():
            spent = spending.get(category, 0)
            if spent > budget:
                percentage = (spent / budget) * 100
                alerts.append({
                    "type": "budget_exceeded",
                    "severity": "warning" if percentage < 120 else "critical",
                    "title": f"Budget exceeded: {category}",
                    "message": f"Spent ${spent} of ${budget} budget ({percentage:.0f}%)",
                    "action_needed": True
                })
            elif spent > budget * 0.8:
                alerts.append({
                    "type": "budget_warning",
                    "severity": "info",
                    "title": f"Approaching budget limit: {category}",
                    "message": f"Used {((spent/budget)*100):.0f}% of {category} budget",
                    "action_needed": False
                })
        
        return alerts