# backend/app/services/risk_service.py
from datetime import datetime, timedelta
from typing import Dict, List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.models.anomaly import Anomaly
from app.models.transaction import Transaction
from app.models.user import User

class RiskScoreService:
    """Calculate dynamic risk scores based on anomalies and transactions"""
    
    def __init__(self, db: Session):
        self.db = db
    
    def calculate_user_risk_score(self, user_id: int) -> Dict:
        """Calculate overall risk score for a user based on anomalies"""
        
        # Get anomaly statistics
        anomaly_stats = self._get_anomaly_stats(user_id)
        
        # Get spending volatility score
        volatility_score = self._calculate_volatility_score(user_id)
        
        # Get limit breach score
        limit_breach_score = self._calculate_limit_breach_score(user_id)
        
        # Get category risk scores
        category_risks = self._get_category_risk_scores(user_id)
        
        # Calculate weighted total risk score (0-100)
        weights = {
            'anomaly_severity': 0.35,
            'anomaly_frequency': 0.20,
            'volatility': 0.25,
            'limit_breaches': 0.20
        }
        
        total_score = (
            anomaly_stats['weighted_severity'] * weights['anomaly_severity'] +
            anomaly_stats['frequency_score'] * weights['anomaly_frequency'] +
            volatility_score * weights['volatility'] +
            limit_breach_score * weights['limit_breaches']
        )
        
        total_score = min(max(round(total_score), 0), 100)
        
        # Determine risk level
        if total_score >= 70:
            risk_level = "high"
            recommendation = "⚠️ High risk detected. Review all pending anomalies and consider adjusting spending habits."
        elif total_score >= 40:
            risk_level = "medium"
            recommendation = "📊 Medium risk level. Monitor your spending categories and review anomalies regularly."
        else:
            risk_level = "low"
            recommendation = "✅ Low risk level. Your financial behavior is stable. Keep monitoring."
        
        # Save to database
        self._save_risk_score(user_id, total_score, risk_level, recommendation, anomaly_stats['pending_count'])
        
        return {
            "risk_score": total_score,
            "risk_level": risk_level,
            "active_anomalies": anomaly_stats['pending_count'],
            "total_anomalies": anomaly_stats['total_count'],
            "recommendation": recommendation,
            "trend": self._calculate_risk_trend(user_id),
            "breakdown": {
                "anomaly_severity": round(anomaly_stats['weighted_severity'], 1),
                "anomaly_frequency": round(anomaly_stats['frequency_score'], 1),
                "volatility": round(volatility_score, 1),
                "limit_breaches": round(limit_breach_score, 1)
            },
            "category_risks": category_risks[:5]  # Top 5 riskiest categories
        }
    
    def _get_anomaly_stats(self, user_id: int) -> Dict:
        """Get anomaly statistics for the user"""
        
        # Get all anomalies
        anomalies = self.db.query(Anomaly).filter(
            Anomaly.user_id == user_id
        ).all()
        
        total_count = len(anomalies)
        pending_count = len([a for a in anomalies if a.status == 'pending'])
        reviewed_count = len([a for a in anomalies if a.status == 'reviewed'])
        
        # Calculate weighted severity based on anomaly scores
        if anomalies:
            avg_score = sum(a.anomaly_score or 0 for a in anomalies) / total_count
            max_score = max(a.anomaly_score or 0 for a in anomalies)
            
            # Weighted severity (higher scores contribute more)
            weighted_severity = (avg_score * 0.4 + max_score * 0.6)
            
            # Frequency score (more anomalies = higher score)
            frequency_score = min(100, (pending_count * 15) + (reviewed_count * 5))
        else:
            weighted_severity = 0
            frequency_score = 0
        
        return {
            'total_count': total_count,
            'pending_count': pending_count,
            'reviewed_count': reviewed_count,
            'weighted_severity': weighted_severity,
            'frequency_score': frequency_score
        }
    
    def _calculate_volatility_score(self, user_id: int) -> float:
        """Calculate spending volatility score based on transaction history"""
        
        # Get last 90 days of transactions
        ninety_days_ago = datetime.now() - timedelta(days=90)
        
        transactions = self.db.query(Transaction).filter(
            Transaction.user_id == user_id,
            Transaction.date >= ninety_days_ago,
            Transaction.type == 'expense'
        ).all()
        
        if len(transactions) < 5:
            return 25  # Default medium risk for insufficient data
        
        amounts = [t.amount for t in transactions]
        
        if amounts:
            mean = sum(amounts) / len(amounts)
            variance = sum((x - mean) ** 2 for x in amounts) / len(amounts)
            std_dev = variance ** 0.5
            cv = (std_dev / mean) if mean > 0 else 1  # Coefficient of variation
            
            # Convert CV to 0-100 score (higher CV = higher risk)
            if cv > 1.5:
                volatility_score = 85
            elif cv > 1.0:
                volatility_score = 65
            elif cv > 0.5:
                volatility_score = 45
            else:
                volatility_score = 25
        else:
            volatility_score = 25
        
        return volatility_score
    
    def _calculate_limit_breach_score(self, user_id: int) -> float:
        """Calculate score based on spending limit breaches"""
        
        # Get user limits from database (assuming user_limits table exists)
        from app.models.user_limit import UserLimit
        
        limits = self.db.query(UserLimit).filter(
            UserLimit.user_id == user_id,
            UserLimit.is_active == True
        ).all()
        
        if not limits:
            return 0
        
        # Get recent transactions
        thirty_days_ago = datetime.now() - timedelta(days=30)
        
        breach_count = 0
        total_breach_percentage = 0
        
        for limit in limits:
            # Get transactions in this category
            transactions = self.db.query(Transaction).filter(
                Transaction.user_id == user_id,
                Transaction.category == limit.category,
                Transaction.date >= thirty_days_ago,
                Transaction.type == 'expense'
            ).all()
            
            for t in transactions:
                if t.amount > limit.limit_amount:
                    breach_count += 1
                    total_breach_percentage += ((t.amount - limit.limit_amount) / limit.limit_amount) * 100
        
        if breach_count > 0:
            # Score based on number of breaches and severity
            breach_score = min(100, (breach_count * 15) + (total_breach_percentage / breach_count))
        else:
            breach_score = 0
        
        return breach_score
    
    def _get_category_risk_scores(self, user_id: int) -> List[Dict]:
        """Get risk scores by category from database or calculate"""
        
        # Try to get from risk_categories table first
        from app.models.risk_category import RiskCategory
        
        categories = self.db.query(RiskCategory).filter(
            RiskCategory.user_id == user_id
        ).order_by(RiskCategory.risk_score.desc()).all()
        
        if categories:
            return [
                {
                    "category": cat.category,
                    "risk_score": cat.risk_score,
                    "amount": cat.amount,
                    "status": "high" if cat.risk_score >= 60 else "medium" if cat.risk_score >= 30 else "low"
                }
                for cat in categories
            ]
        
        # Fallback: calculate from transactions
        transactions = self.db.query(Transaction).filter(
            Transaction.user_id == user_id,
            Transaction.type == 'expense'
        ).all()
        
        if not transactions:
            return []
        
        # Group by category
        category_data = {}
        for t in transactions:
            cat = t.category or 'Other'
            if cat not in category_data:
                category_data[cat] = {'amounts': [], 'total': 0, 'count': 0}
            category_data[cat]['amounts'].append(t.amount)
            category_data[cat]['total'] += t.amount
            category_data[cat]['count'] += 1
        
        # Calculate risk for each category
        results = []
        for cat, data in category_data.items():
            avg = data['total'] / data['count'] if data['count'] > 0 else 0
            if len(data['amounts']) > 1:
                variance = sum((x - avg) ** 2 for x in data['amounts']) / len(data['amounts'])
                std_dev = variance ** 0.5
                cv = (std_dev / avg) if avg > 0 else 0
                
                if cv > 1.5:
                    risk = 85
                elif cv > 1.0:
                    risk = 65
                elif cv > 0.5:
                    risk = 45
                else:
                    risk = 25
            else:
                risk = 25
            
            results.append({
                "category": cat,
                "risk_score": risk,
                "amount": round(data['total']),
                "status": "high" if risk >= 60 else "medium" if risk >= 30 else "low"
            })
        
        return sorted(results, key=lambda x: x['risk_score'], reverse=True)
    
    def _calculate_risk_trend(self, user_id: int) -> str:
        """Calculate whether risk is improving or worsening"""
        
        # Get risk scores from last 30 days
        thirty_days_ago = datetime.now() - timedelta(days=30)
        
        from app.models.risk_score import RiskScore
        
        recent_scores = self.db.query(RiskScore).filter(
            RiskScore.user_id == user_id,
            RiskScore.created_at >= thirty_days_ago
        ).order_by(RiskScore.created_at).all()
        
        if len(recent_scores) < 2:
            return "stable"
        
        if recent_scores[-1].risk_score < recent_scores[0].risk_score:
            return "improving"
        elif recent_scores[-1].risk_score > recent_scores[0].risk_score:
            return "worsening"
        else:
            return "stable"
    
    def _save_risk_score(self, user_id: int, score: float, level: str, recommendation: str, active_anomalies: int):
        """Save risk score to database"""
        from app.models.risk_score import RiskScore
        
        risk_score = RiskScore(
            user_id=user_id,
            risk_score=score,
            risk_level=level,
            active_anomalies=active_anomalies,
            recommendation=recommendation,
            created_at=datetime.now()
        )
        self.db.add(risk_score)
        self.db.commit()