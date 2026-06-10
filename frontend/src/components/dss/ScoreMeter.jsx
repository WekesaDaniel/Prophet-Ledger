// frontend/src/components/dss/ScoreMeter.jsx
import React, { useState, useEffect } from 'react';
import { 
  Loader, TrendingUp, TrendingDown, Info, Shield, 
  AlertTriangle, CheckCircle, Activity, Clock, 
  DollarSign, PieChart, Zap, ArrowUp, ArrowDown,
  XCircle, Eye, Calendar
} from 'lucide-react';
import { supabase } from '../../services/supabaseClient';
import api from '../../services/api';
import toast from 'react-hot-toast';

const ScoreMeter = () => {
  const [score, setScore] = useState(0);
  const [loading, setLoading] = useState(true);
  const [trend, setTrend] = useState('stable');
  const [riskData, setRiskData] = useState(null);
  const [expanded, setExpanded] = useState(false);
  const [animateScore, setAnimateScore] = useState(0);

  useEffect(() => {
    fetchRiskScore();
  }, []);

  useEffect(() => {
    // Animate score counting
    if (!loading && score) {
      const duration = 1000;
      const steps = 60;
      const increment = score / steps;
      let current = 0;
      const timer = setInterval(() => {
        current += increment;
        if (current >= score) {
          setAnimateScore(score);
          clearInterval(timer);
        } else {
          setAnimateScore(Math.floor(current));
        }
      }, duration / steps);
      return () => clearInterval(timer);
    }
  }, [loading, score]);

  const fetchRiskScore = async () => {
    setLoading(true);
    try {
      const response = await api.get('/dss/risk/score');
      const data = response.data;
      setScore(data.risk_score || 68);
      setTrend(data.trend || 'stable');
      setRiskData(data);
    } catch (error) {
      console.error('Failed to fetch risk score:', error);
      
      // Fallback calculation
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
        setTrend('stable');
      } catch (fallbackError) {
        setScore(68);
        setTrend('stable');
      }
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = () => {
    if (score < 30) return { text: 'text-red-600', bg: 'bg-red-100', ring: 'ring-red-400' };
    if (score < 60) return { text: 'text-yellow-600', bg: 'bg-yellow-100', ring: 'ring-yellow-400' };
    if (score < 80) return { text: 'text-blue-600', bg: 'bg-blue-100', ring: 'ring-blue-400' };
    return { text: 'text-green-600', bg: 'bg-green-100', ring: 'ring-green-400' };
  };

  const getScoreLabel = () => {
    if (score < 30) return { label: 'Very Low Risk', icon: Shield, description: 'Excellent financial health' };
    if (score < 60) return { label: 'Low Risk', icon: Shield, description: 'Good financial standing' };
    if (score < 80) return { label: 'Medium Risk', icon: AlertTriangle, description: 'Some concerns detected' };
    return { label: 'High Risk', icon: AlertTriangle, description: 'Immediate attention needed' };
  };

  const getRiskLevelInfo = () => {
    const info = getScoreLabel();
    return {
      ...info,
      color: getScoreColor()
    };
  };

  const renderComponentGauge = (value, label, color = 'blue') => {
    const percentage = value;
    const colors = {
      blue: 'from-blue-500 to-blue-600',
      red: 'from-red-500 to-red-600',
      green: 'from-green-500 to-green-600',
      yellow: 'from-yellow-500 to-yellow-600',
      purple: 'from-purple-500 to-purple-600'
    };
    
    return (
      <div className="mb-3">
        <div className="flex justify-between items-center mb-1">
          <span className="text-xs text-gray-600">{label}</span>
          <span className="text-xs font-semibold">{value}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
          <div 
            className={`h-2 rounded-full bg-gradient-to-r ${colors[color]} transition-all duration-700 ease-out`}
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>
    );
  };

  const renderCategoryRisks = () => {
    if (!riskData?.category_risks || riskData.category_risks.length === 0) {
      return (
        <div className="text-center text-gray-500 text-xs py-4">
          No category risks detected
        </div>
      );
    }
    
    return (
      <div className="space-y-2 max-h-48 overflow-y-auto">
        {riskData.category_risks.map((cat, idx) => (
          <div key={idx} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-2">
              <PieChart className="w-3 h-3 text-gray-500" />
              <span className="text-sm font-medium capitalize">{cat.category}</span>
            </div>
            <div className="text-right">
              <span className="text-xs font-semibold">{cat.percentage}%</span>
              <div className="text-xs text-gray-500">
                ${cat.total_spent.toLocaleString()} / ${cat.limit.toLocaleString()}
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderRiskFactors = () => {
    if (!riskData?.risk_factors || riskData.risk_factors.length === 0) {
      return (
        <div className="text-center text-gray-500 text-xs py-2">
          No significant risk factors
        </div>
      );
    }
    
    return (
      <div className="space-y-1.5">
        {riskData.risk_factors.slice(0, 3).map((factor, idx) => (
          <div key={idx} className="flex items-start gap-2 text-xs">
            <AlertTriangle className="w-3 h-3 text-yellow-500 mt-0.5 flex-shrink-0" />
            <span className="text-gray-700">{factor}</span>
          </div>
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex flex-col items-center justify-center h-64">
          <Loader className="w-8 h-8 animate-spin text-blue-500 mb-3" />
          <p className="text-sm text-gray-500">Analyzing your financial risk...</p>
        </div>
      </div>
    );
  }

  const scoreColor = getScoreColor();
  const riskInfo = getRiskLevelInfo();

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden transition-all duration-300">
      {/* Header */}
      <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-blue-600" />
            <h3 className="font-semibold text-gray-900">Risk Assessment Score</h3>
          </div>
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-xs text-blue-600 hover:text-blue-700 transition-colors"
          >
            {expanded ? 'Show Less' : 'View Details'}
          </button>
        </div>
      </div>

      <div className="p-6">
        {/* Main Score Display */}
        <div className="flex flex-col items-center mb-6">
          {/* Circular Meter */}
          <div className="relative inline-block">
            {/* Background Circle */}
            <svg className="w-40 h-40 transform -rotate-90">
              <circle
                cx="80"
                cy="80"
                r="72"
                fill="none"
                stroke="#e5e7eb"
                strokeWidth="12"
              />
              {/* Progress Circle */}
              <circle
                cx="80"
                cy="80"
                r="72"
                fill="none"
                stroke="currentColor"
                strokeWidth="12"
                strokeLinecap="round"
                strokeDasharray={`${(score / 100) * 452.389} 452.389`}
                className={`transition-all duration-1000 ease-out ${scoreColor.text}`}
              />
            </svg>
            
            {/* Center Content */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div className={`text-4xl font-bold ${scoreColor.text}`}>
                {animateScore}
              </div>
              <div className="text-xs text-gray-500 mt-1">out of 100</div>
            </div>
          </div>

          {/* Score Label */}
          <div className="mt-4 text-center">
            <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full ${scoreColor.bg} ${scoreColor.text}`}>
              <riskInfo.icon className="w-4 h-4" />
              <span className="font-semibold text-sm">{riskInfo.label}</span>
            </div>
            <p className="text-xs text-gray-500 mt-2">{riskInfo.description}</p>
          </div>

          {/* Active Anomalies Alert */}
          {riskData?.active_anomalies > 0 && (
            <div className="mt-4 w-full bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-yellow-600" />
                <span className="text-sm font-medium text-yellow-800">
                  {riskData.active_anomalies} Pending {riskData.active_anomalies === 1 ? 'Anomaly' : 'Anomalies'}
                </span>
              </div>
              <p className="text-xs text-yellow-700 mt-1">
                {riskData.recommendation?.split('.')[0] || 'Review your pending anomalies'}
              </p>
            </div>
          )}
        </div>

        {/* Component Breakdown */}
        {riskData?.components && (
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <Activity className="w-4 h-4" />
              Risk Components
            </h4>
            {renderComponentGauge(riskData.components.anomaly_score, 'Anomaly Risk', 'red')}
            {renderComponentGauge(riskData.components.limit_violation_score, 'Limit Violations', 'yellow')}
            {renderComponentGauge(riskData.components.volatility_score, 'Financial Volatility', 'blue')}
            {renderComponentGauge(riskData.components.velocity_score, 'Transaction Velocity', 'purple')}
            {renderComponentGauge(riskData.components.trend_score, 'Risk Trend', 'green')}
          </div>
        )}

        {/* Expanded Details */}
        {expanded && (
          <div className="space-y-4 border-t pt-4 animate-fade-in">
            {/* Risk Factors */}
            {riskData?.risk_factors && riskData.risk_factors.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-yellow-500" />
                  Risk Factors
                </h4>
                {renderRiskFactors()}
              </div>
            )}

            {/* Category Risks */}
            {riskData?.category_risks && riskData.category_risks.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                  <PieChart className="w-4 h-4 text-purple-500" />
                  High Risk Categories
                </h4>
                {renderCategoryRisks()}
              </div>
            )}

            {/* Recommendation */}
            <div className="p-3 bg-blue-50 rounded-lg">
              <div className="flex items-start gap-2">
                <Info className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="text-sm font-semibold text-blue-800 mb-1">Recommendation</h4>
                  <p className="text-xs text-blue-700 leading-relaxed">
                    {riskData?.recommendation || getRiskLevelInfo().description}
                  </p>
                </div>
              </div>
            </div>

            {/* Last Updated */}
            <div className="flex items-center justify-end gap-2 text-xs text-gray-400">
              <Calendar className="w-3 h-3" />
              <span>Real-time assessment</span>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="mt-6 flex gap-3">
          <button
            onClick={() => window.location.href = '/anomalies'}
            className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium flex items-center justify-center gap-2"
          >
            <Eye className="w-4 h-4" />
            View Anomalies
          </button>
          <button
            onClick={fetchRiskScore}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* CSS for animations */}
      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};

export default ScoreMeter;