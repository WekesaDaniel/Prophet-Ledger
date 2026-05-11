import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from typing import List, Dict, Optional
from sqlalchemy.orm import Session
from app.models.transaction import Transaction
from app.models.forecast import Forecast

class ForecastEngine:
    """Time-series forecasting using ARIMA and Exponential Smoothing"""
    
    def __init__(self, db: Session):
        self.db = db
    
    def forecast_cashflow(self, user_id: int, days: int = 30) -> Dict:
        """
        🔴 HARDCODED - Replace with actual ARIMA/LSTM model
        ✅ TO DO: Implement ARIMA from statsmodels or LSTM from tensorflow
        """
        
        # 🔴 HARDCODED MOCK DATA - Replace with real predictions
        mock_forecast = {
            "cashflow": self._generate_mock_forecast(days, 50000, 52000),
            "expenses": self._generate_mock_forecast(days, 32000, 34000),
            "savings": self._generate_mock_forecast(days, 18000, 19000),
            "confidence_interval": [0.85, 0.95],
            "model_used": "ARIMA (Mock)",
            "rmse": 1250.50,
            "mape": 4.2
        }
        
        # ✅ TO DO: Uncomment when ML model is ready
        # try:
        #     # Get historical data
        #     transactions = self.db.query(Transaction).filter(
        #         Transaction.user_id == user_id,
        #         Transaction.date >= datetime.now() - timedelta(days=90)
        #     ).all()
        #     
        #     # Convert to DataFrame
        #     df = pd.DataFrame([{
        #         'date': t.date,
        #         'amount': t.amount if t.type == 'income' else -t.amount
        #     } for t in transactions])
        #     
        #     # ARIMA model
        #     from statsmodels.tsa.arima.model import ARIMA
        #     model = ARIMA(df['amount'], order=(5,1,0))
        #     fitted = model.fit()
        #     forecast = fitted.forecast(steps=days)
        #     
        #     return {
        #         "cashflow": forecast.tolist(),
        #         "model_used": "ARIMA",
        #         "rmse": float(fitted.mse)
        #     }
        # except Exception as e:
        #     print(f"Forecast error: {e}")
        #     return mock_forecast
        
        return mock_forecast
    
    def _generate_mock_forecast(self, days: int, start: float, end: float) -> List[float]:
        """Generate mock forecast data for development"""
        dates = [(datetime.now() + timedelta(days=i)).strftime('%Y-%m-%d') for i in range(days)]
        values = np.linspace(start, end, days) + np.random.normal(0, 500, days)
        return [{"date": dates[i], "value": round(float(values[i]), 2)} for i in range(days)]
    
    def predict_expenses(self, user_id: int, category: Optional[str] = None) -> Dict:
        """🔴 HARDCODED - Predict future expenses by category"""
        categories = ['Groceries', 'Dining', 'Transport', 'Utilities', 'Entertainment']
        
        mock_predictions = {}
        for cat in categories:
            if category is None or category == cat:
                mock_predictions[cat] = {
                    "predicted": round(np.random.uniform(200, 800), 2),
                    "trend": np.random.choice(['up', 'down', 'stable']),
                    "confidence": round(np.random.uniform(0.7, 0.95), 2)
                }
        
        return {
            "predictions": mock_predictions,
            "total_forecast": round(sum(p["predicted"] for p in mock_predictions.values()), 2),
            "period": "next_30_days"
        }
    
    def calculate_forecast_accuracy(self, user_id: int) -> Dict:
        """🔴 HARDCODED - Calculate forecast accuracy metrics"""
        return {
            "mape": 4.2,  # Mean Absolute Percentage Error
            "rmse": 1250.50,  # Root Mean Square Error
            "mae": 980.30,  # Mean Absolute Error
            "r2_score": 0.87,  # R-squared
            "status": "good",
            "recommendation": "Model performance is good. Consider adding more features for improvement."
        }
    
    def save_forecast(self, user_id: int, forecast_data: Dict) -> Forecast:
        """Save forecast results to database"""
        forecast = Forecast(
            user_id=user_id,
            metric="cashflow",
            predicted_value=forecast_data.get("total", 0),
            confidence_lower=forecast_data.get("confidence_lower"),
            confidence_upper=forecast_data.get("confidence_upper"),
            model_used="ARIMA"
        )
        self.db.add(forecast)
        self.db.commit()
        self.db.refresh(forecast)
        return forecast
