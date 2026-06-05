// frontend/src/components/dss/ScoreMeter.jsx
import React, { useState, useEffect } from 'react';
import { Loader, TrendingUp, TrendingDown, Info } from 'lucide-react';
import { supabase } from '../../services/supabaseClient';
import api from '../../services/api';
import toast from 'react-hot-toast';

const ScoreMeter = () => {
  const [score, setScore] = useState(0);
  const [loading, setLoading] = useState(true);
  const [trend, setTrend] = useState('stable');
  const [riskData, setRiskData] = useState(null);

  useEffect(() => {
    fetchRiskScore();
  }, []);

  const fetchRiskScore = async () => {
    setLoading(true);
    try {
      // First try to get from API
      const response = await api.get('/dss/risk/score');
      setScore(response.data.risk_score || 68);
      setTrend(response.data.trend || 'improving');
      setRiskData(response.data);
    } catch (error) {
      console.error('Failed to fetch risk score:', error);
      
      // Fallback: Calculate from transactions
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: transactions } = await supabase
            .from('transactions')
            .select('amount, type')
            .eq('user_id', user.id)
            .limit(100);
          
          if (transactions && transactions.length > 0) {
            const incomes = transactions.filter(t => t.type === 'income').map(t => t.amount);
            const expenses = transactions.filter(t => t.type === 'expense').map(t => t.amount);
            
            const totalIncome = incomes.reduce((a, b) => a + b, 0);
            const totalExpense = expenses.reduce((a, b) => a + b, 0);
            const netCashflow = totalIncome - totalExpense;
            const savingsRate = totalIncome > 0 ? (netCashflow / totalIncome) * 100 : 0;
            
            let calculatedScore = 68;
            if (savingsRate < 0) calculatedScore = 85;
            else if (savingsRate < 10) calculatedScore = 75;
            else if (savingsRate < 20) calculatedScore = 60;
            else calculatedScore = 45;
            
            setScore(Math.min(100, Math.max(0, calculatedScore)));
          } else {
            setScore(68);
          }
        } else {
          setScore(68);
        }
        setTrend('improving');
      } catch (fallbackError) {
        setScore(68);
        setTrend('improving');
      }
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = () => {
    if (score < 30) return 'text-red-600';
    if (score < 60) return 'text-yellow-600';
    return 'text-green-600';
  };

  const getScoreLabel = () => {
    if (score < 30) return 'High Risk';
    if (score < 60) return 'Medium Risk';
    return 'Low Risk';
  };

  const getRecommendation = () => {
    if (score < 30) return 'Your finances look healthy. Continue your good habits!';
    if (score < 60) return 'Some risk detected. Review your spending and consider building savings.';
    return 'High risk detected. Reduce discretionary spending and build emergency fund.';
  };

  if (loading) {
    return <Loader className="w-8 h-8 animate-spin mx-auto" />;
  }

  return (
    <div className="text-center">
      <div className="relative inline-block">
        <div className="w-32 h-32 rounded-full border-8 border-gray-200 flex items-center justify-center">
          <div className={`text-3xl font-bold ${getScoreColor()}`}>{score}</div>
        </div>
        <div className="absolute inset-0 rounded-full border-8 border-transparent border-t-blue-500" 
             style={{ transform: `rotate(${score * 3.6}deg)` }}></div>
      </div>
      <div className="mt-4">
        <div className={`text-xl font-bold ${getScoreColor()}`}>{getScoreLabel()}</div>
        <div className="flex items-center justify-center mt-2 text-sm">
          {trend === 'improving' ? (
            <>
              <TrendingDown className="w-4 h-4 text-green-500 mr-1" />
              <span className="text-green-600">Improving</span>
            </>
          ) : (
            <>
              <TrendingUp className="w-4 h-4 text-red-500 mr-1" />
              <span className="text-red-600">Worsening</span>
            </>
          )}
        </div>
        <div className="mt-3 p-3 bg-gray-50 rounded-lg text-xs text-gray-600">
          <div className="flex items-center gap-1 mb-1">
            <Info className="w-3 h-3 text-blue-500" />
            <span className="font-medium">Recommendation</span>
          </div>
          <p>{getRecommendation()}</p>
          {riskData?.active_anomalies > 0 && (
            <p className="mt-2 text-yellow-600">
              ⚠️ {riskData.active_anomalies} pending {riskData.active_anomalies === 1 ? 'anomaly' : 'anomalies'} to review
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default ScoreMeter;