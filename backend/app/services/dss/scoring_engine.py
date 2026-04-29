# backend/app/services/dss/scoring_engine.py
from typing import Dict, List, Tuple

class ScoringEngine:
    """Classify transactions, score vendors, predict future behavior"""
    
    def classify_transaction(self, description: str, amount: float) -> Dict:
        """Intelligent transaction categorization"""
        # Keywords mapping
        category_keywords = {
            'groceries': ['walmart', 'target', 'kroger', 'safeway', 'whole foods', 'aldi', 'trader joe'],
            'dining': ['starbucks', 'mcdonalds', 'chipotle', 'pizza', 'restaurant', 'cafe', 'burger'],
            'transport': ['uber', 'lyft', 'taxi', 'gas', 'shell', 'exxon', 'parking', 'transit'],
            'utilities': ['electric', 'water', 'gas bill', 'internet', 'phone bill', 'comcast', 'att'],
            'entertainment': ['netflix', 'spotify', 'disney', 'hulu', 'cinema', 'movie', 'concert'],
            'shopping': ['amazon', 'ebay', 'etsy', 'zara', 'h&m', 'nike', 'clothing'],
            'health': ['cvs', 'walgreens', 'pharmacy', 'doctor', 'dental', 'hospital'],
            'rent': ['rent', 'apartment', 'lease', 'property'],
            'income': ['salary', 'payroll', 'deposit', 'transfer', 'freelance']
        }
        
        description_lower = description.lower()
        
        for category, keywords in category_keywords.items():
            if any(keyword in description_lower for keyword in keywords):
                confidence = 0.8
                if amount > 1000 and category == 'income':
                    confidence = 0.95
                elif amount > 500 and category in ['rent', 'utilities']:
                    confidence = 0.9
                
                return {
                    "category": category,
                    "confidence": confidence,
                    "suggested_tags": self._get_suggested_tags(category, amount)
                }
        
        # Unclassified
        return {
            "category": "other",
            "confidence": 0.3,
            "suggested_tags": ["review", "unclassified"]
        }
    
    def score_vendor_risk(self, vendor_name: str, transaction_history: List) -> Dict:
        """Score how risky a vendor is (for recurring payments)"""
        # Check payment consistency
        payments = [t for t in transaction_history if t.vendor == vendor_name]
        
        if len(payments) < 2:
            return {"risk_score": 0.5, "risk_level": "unknown", "reason": "Insufficient data"}
        
        # Calculate variability
        amounts = [p.amount for p in payments]
        variability = np.std(amounts) / np.mean(amounts) if np.mean(amounts) > 0 else 1
        
        # Check for late payments
        late_payments = sum(1 for p in payments if p.was_late)
        late_ratio = late_payments / len(payments)
        
        # Check for disputes
        dispute_ratio = sum(1 for p in payments if p.was_disputed) / len(payments)
        
        # Combined risk score (0-1, higher = riskier)
        risk_score = (variability * 0.3) + (late_ratio * 0.4) + (dispute_ratio * 0.3)
        risk_score = min(risk_score, 1.0)
        
        risk_level = "low" if risk_score < 0.3 else "medium" if risk_score < 0.7 else "high"
        
        recommendations = []
        if late_ratio > 0.2:
            recommendations.append("Set up autopay to avoid late fees")
        if variability > 0.3:
            recommendations.append("Consider fixed-price contract")
        if dispute_ratio > 0.1:
            recommendations.append("Review contract terms carefully")
        
        return {
            "vendor": vendor_name,
            "risk_score": round(risk_score, 2),
            "risk_level": risk_level,
            "payment_reliability": round(1 - late_ratio, 2),
            "amount_consistency": round(1 - variability, 2),
            "recommendations": recommendations
        }