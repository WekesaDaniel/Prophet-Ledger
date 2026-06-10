// frontend/src/components/dss/ScoreMeter.jsx
import React, { useState, useEffect } from 'react';
import { 
  Loader, TrendingUp, TrendingDown, Info, Shield, 
  AlertTriangle, CheckCircle, Activity, Clock, 
  DollarSign, PieChart, Zap, ArrowUp, ArrowDown,
  XCircle, Eye, Calendar, Brain, RefreshCw  // <-- ADD RefreshCw here
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
  const [rawData, setRawData] = useState(null);

  useEffect(() => {
    fetchAndCalculateRisk();
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

  const fetchAndCalculateRisk = async () => {
    setLoading(true);
    try {
      // First try to get real data from API
      const response = await api.get('/dss/risk/data');
      
      if (response.data.error) {
        throw new Error(response.data.error);
      }
      
      const data = response.data;
      setRawData(data);
      
      // Calculate risk score from real data
      const calculatedRisk = calculateRiskScore(data);
      setScore(calculatedRisk.score);
      setTrend(calculatedRisk.trend);
      setRiskData(calculatedRisk);
      
      // Store in database for historical tracking
      await storeRiskScore(calculatedRisk);
      
    } catch (error) {
      console.error('Failed to fetch risk data:', error);
      
      // Fallback: Calculate from Supabase directly
      try {
        const fallbackData = await fetchLocalData();
        const calculatedRisk = calculateRiskScore(fallbackData);
        setScore(calculatedRisk.score);
        setTrend(calculatedRisk.trend);
        setRiskData(calculatedRisk);
      } catch (fallbackError) {
        console.error('Fallback calculation failed:', fallbackError);
        setScore(68);
        setTrend('stable');
        setRiskData({
          score: 68,
          trend: 'stable',
          active_anomalies: 0,
          recommendation: "Unable to calculate risk score from available data",
          components: {
            anomaly_score: 50,
            limit_violation_score: 50,
            volatility_score: 50,
            velocity_score: 50,
            trend_score: 50
          }
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchLocalData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('No user');
    
    const [anomalies, limits, transactions, riskHistory] = await Promise.all([
      supabase.from('anomalies').select('status, anomaly_score, created_at, category, amount').eq('user_id', user.id),
      supabase.from('user_limits').select('category, limit_amount, period').eq('user_id', user.id).eq('is_active', true),
      supabase.from('transactions').select('amount, type, category, date').eq('user_id', user.id).gte('date', new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]),
      supabase.from('risk_scores').select('risk_score, created_at').eq('user_id', user.id).order('created_at', { ascending: false }).limit(10)
    ]);
    
    return {
      anomalies: anomalies.data || [],
      user_limits: limits.data || [],
      transactions: transactions.data || [],
      risk_history: riskHistory.data || []
    };
  };

  const calculateRiskScore = (data) => {
    // 1. Calculate Anomaly Component
    const anomalyComponent = calculateAnomalyRisk(data.anomalies);
    
    // 2. Calculate Limit Violation Component
    const limitViolationComponent = calculateLimitViolationRisk(data.transactions, data.user_limits);
    
    // 3. Calculate Volatility Component
    const volatilityComponent = calculateVolatilityRisk(data.transactions);
    
    // 4. Calculate Velocity Component
    const velocityComponent = calculateVelocityRisk(data.transactions);
    
    // 5. Calculate Trend Component
    const trendComponent = calculateTrendRisk(data.risk_history);
    
    // Weighted average
    const weights = {
      anomaly: 0.35,
      limit_violation: 0.25,
      volatility: 0.20,
      velocity: 0.10,
      trend: 0.10
    };
    
    let rawScore = (
      anomalyComponent.score * weights.anomaly +
      limitViolationComponent.score * weights.limit_violation +
      volatilityComponent.score * weights.volatility +
      velocityComponent.score * weights.velocity +
      trendComponent.score * weights.trend
    );
    
    // Apply non-linear scaling
    let finalScore;
    if (rawScore > 70) {
      finalScore = Math.min(100, rawScore + (rawScore - 70) * 0.3);
    } else if (rawScore < 30) {
      finalScore = rawScore * 0.8;
    } else {
      finalScore = rawScore;
    }
    
    finalScore = Math.round(Math.min(100, Math.max(0, finalScore)));
    
    // Calculate trend direction
    const trend = calculateTrendDirection(data.risk_history, finalScore);
    
    // Generate recommendation
    const recommendation = generateRecommendation(
      finalScore,
      anomalyComponent,
      limitViolationComponent,
      data.anomalies,
      data.transactions
    );
    
    return {
      score: finalScore,
      trend: trend,
      active_anomalies: data.anomalies.filter(a => a.status === 'pending').length,
      recommendation: recommendation,
      components: {
        anomaly_score: Math.round(anomalyComponent.score),
        limit_violation_score: Math.round(limitViolationComponent.score),
        volatility_score: Math.round(volatilityComponent.score),
        velocity_score: Math.round(velocityComponent.score),
        trend_score: Math.round(trendComponent.score)
      },
      anomaly_details: anomalyComponent.details,
      limit_violations: limitViolationComponent.violations,
      category_risks: calculateCategoryRisks(data.transactions, data.user_limits),
      risk_factors: generateRiskFactors(anomalyComponent, limitViolationComponent, volatilityComponent, velocityComponent)
    };
  };

  const calculateAnomalyRisk = (anomalies) => {
    const pendingAnomalies = anomalies.filter(a => a.status === 'pending');
    const pendingCount = pendingAnomalies.length;
    const falsePositives = anomalies.filter(a => a.status === 'false_positive').length;
    const falsePositiveRate = anomalies.length > 0 ? falsePositives / anomalies.length : 0;
    
    if (pendingCount === 0) {
      return { score: 0, details: { pendingCount: 0, avgSeverity: 0, recencyScore: 0 } };
    }
    
    // Quantity score
    let quantityScore;
    if (pendingCount <= 2) quantityScore = 30;
    else if (pendingCount <= 5) quantityScore = 50;
    else if (pendingCount <= 10) quantityScore = 70;
    else quantityScore = 90;
    
    // Severity score
    const avgSeverity = pendingAnomalies.reduce((sum, a) => sum + (a.anomaly_score || 50), 0) / pendingCount;
    
    // Recency score
    const now = new Date();
    let recencyScore = 0;
    pendingAnomalies.slice(0, 5).forEach(anomaly => {
      if (anomaly.created_at) {
        const anomalyDate = new Date(anomaly.created_at);
        const daysAgo = (now - anomalyDate) / (1000 * 60 * 60 * 24);
        if (daysAgo <= 7) recencyScore += 20;
        else if (daysAgo <= 30) recencyScore += 10;
      }
    });
    recencyScore = Math.min(100, recencyScore);
    
    // Combined score
    let combinedScore = (quantityScore * 0.3 + avgSeverity * 0.5 + recencyScore * 0.2);
    combinedScore = combinedScore * (1 - falsePositiveRate * 0.5);
    
    return {
      score: Math.min(100, combinedScore),
      details: {
        pendingCount,
        avgSeverity: Math.round(avgSeverity),
        recencyScore: Math.round(recencyScore),
        falsePositiveRate: Math.round(falsePositiveRate * 100)
      }
    };
  };

  const calculateLimitViolationRisk = (transactions, limits) => {
    const expenses = transactions.filter(t => t.type === 'expense');
    const violations = [];
    
    for (const expense of expenses) {
      const matchingLimit = limits.find(l => 
        l.category.toLowerCase() === (expense.category || 'uncategorized').toLowerCase()
      );
      
      if (matchingLimit && expense.amount > matchingLimit.limit_amount) {
        const excessPercent = ((expense.amount - matchingLimit.limit_amount) / matchingLimit.limit_amount) * 100;
        violations.push({
          ...expense,
          limit: matchingLimit.limit_amount,
          excess_percent: excessPercent
        });
      }
    }
    
    if (violations.length === 0) {
      return { score: 0, violations: [] };
    }
    
    // Count score
    let countScore;
    if (violations.length <= 2) countScore = 25;
    else if (violations.length <= 5) countScore = 50;
    else if (violations.length <= 10) countScore = 75;
    else countScore = 100;
    
    // Severity score
    const avgExcess = violations.reduce((sum, v) => sum + v.excess_percent, 0) / violations.length;
    let severityScore;
    if (avgExcess <= 20) severityScore = 25;
    else if (avgExcess <= 50) severityScore = 50;
    else if (avgExcess <= 100) severityScore = 75;
    else severityScore = 100;
    
    const combinedScore = countScore * 0.4 + severityScore * 0.6;
    
    return {
      score: Math.min(100, combinedScore),
      violations: violations.slice(0, 5)
    };
  };

  const calculateVolatilityRisk = (transactions) => {
    const expenses = transactions.filter(t => t.type === 'expense');
    const income = transactions.filter(t => t.type === 'income');
    
    if (expenses.length === 0 || income.length === 0) {
      return { score: 50 };
    }
    
    const totalExpenses = expenses.reduce((sum, t) => sum + t.amount, 0);
    const totalIncome = income.reduce((sum, t) => sum + t.amount, 0);
    
    if (totalIncome === 0) return { score: 75 };
    
    const expenseToIncomeRatio = (totalExpenses / totalIncome) * 100;
    
    let ratioScore;
    if (expenseToIncomeRatio <= 50) ratioScore = 10;
    else if (expenseToIncomeRatio <= 70) ratioScore = 30;
    else if (expenseToIncomeRatio <= 85) ratioScore = 50;
    else if (expenseToIncomeRatio <= 100) ratioScore = 70;
    else ratioScore = Math.min(100, 70 + (expenseToIncomeRatio - 100) * 0.5);
    
    return {
      score: ratioScore,
      details: {
        expenseToIncomeRatio: Math.round(expenseToIncomeRatio),
        totalExpenses,
        totalIncome
      }
    };
  };

  const calculateVelocityRisk = (transactions) => {
    if (transactions.length === 0) return { score: 0 };
    
    const dates = transactions.map(t => new Date(t.date));
    const minDate = new Date(Math.min(...dates));
    const maxDate = new Date(Math.max(...dates));
    const daysSpan = Math.max(1, Math.ceil((maxDate - minDate) / (1000 * 60 * 60 * 24)));
    
    const velocity = transactions.length / daysSpan;
    
    let score;
    if (velocity <= 0.5) score = 10;
    else if (velocity <= 1) score = 25;
    else if (velocity <= 2) score = 50;
    else if (velocity <= 5) score = 75;
    else score = 100;
    
    return {
      score,
      details: {
        transactionsPerDay: velocity.toFixed(1),
        totalTransactions: transactions.length,
        daysSpan
      }
    };
  };

  const calculateTrendRisk = (riskHistory) => {
    if (!riskHistory || riskHistory.length < 2) {
      return { score: 50 };
    }
    
    const recentScores = riskHistory.slice(0, 5).map(r => r.risk_score);
    
    if (recentScores.length < 2) return { score: 50 };
    
    const oldest = recentScores[recentScores.length - 1];
    const newest = recentScores[0];
    
    if (newest < oldest) {
      const improvement = (oldest - newest) / oldest;
      return { score: Math.max(0, 50 - improvement * 50) };
    } else {
      const increase = (newest - oldest) / Math.max(oldest, 1);
      return { score: Math.min(100, 50 + increase * 50) };
    }
  };

  const calculateCategoryRisks = (transactions, limits) => {
    const expenses = transactions.filter(t => t.type === 'expense');
    const categorySpending = {};
    
    expenses.forEach(expense => {
      const category = expense.category || 'Uncategorized';
      categorySpending[category] = (categorySpending[category] || 0) + expense.amount;
    });
    
    const categoryRisks = [];
    for (const [category, totalSpent] of Object.entries(categorySpending)) {
      const limit = limits.find(l => l.category.toLowerCase() === category.toLowerCase());
      if (limit) {
        const percentage = (totalSpent / limit.limit_amount) * 100;
        const riskScore = Math.min(100, percentage * 0.5);
        categoryRisks.push({
          category,
          risk_score: Math.round(riskScore),
          total_spent: totalSpent,
          limit: limit.limit_amount,
          percentage: Math.round(percentage)
        });
      }
    }
    
    return categoryRisks.sort((a, b) => b.risk_score - a.risk_score).slice(0, 5);
  };

  const calculateTrendDirection = (riskHistory, currentScore) => {
    if (!riskHistory || riskHistory.length === 0) return 'stable';
    
    const lastScore = riskHistory[0]?.risk_score || currentScore;
    
    if (currentScore < lastScore - 5) return 'improving';
    if (currentScore > lastScore + 5) return 'worsening';
    return 'stable';
  };

  const generateRiskFactors = (anomalyComp, limitComp, volatilityComp, velocityComp) => {
    const factors = [];
    
    if (anomalyComp.details?.pendingCount > 0) {
      factors.push(`${anomalyComp.details.pendingCount} pending ${anomalyComp.details.pendingCount === 1 ? 'anomaly' : 'anomalies'} need review`);
    }
    
    if (anomalyComp.details?.avgSeverity > 70) {
      factors.push('High severity anomalies detected');
    }
    
    if (limitComp.violations?.length > 0) {
      factors.push(`${limitComp.violations.length} transactions exceeding spending limits`);
    }
    
    if (volatilityComp.details?.expenseToIncomeRatio > 90) {
      factors.push('Expenses dangerously close to or exceeding income');
    } else if (volatilityComp.details?.expenseToIncomeRatio > 70) {
      factors.push('High expense-to-income ratio');
    }
    
    if (velocityComp.details?.transactionsPerDay > 3) {
      factors.push(`High transaction velocity (${velocityComp.details.transactionsPerDay}/day)`);
    }
    
    return factors;
  };

  const generateRecommendation = (score, anomalyComp, limitComp, anomalies, transactions) => {
    const recommendations = [];
    
    if (score < 30) {
      recommendations.push("Excellent financial health! Keep maintaining your spending discipline.");
    } else if (score < 60) {
      recommendations.push("Good overall, but some areas need attention.");
    } else if (score < 80) {
      recommendations.push("Moderate risk detected. Review your recent transactions.");
    } else {
      recommendations.push("High risk detected. Immediate action recommended.");
    }
    
    if (anomalyComp.details?.pendingCount > 0) {
      recommendations.push(`Review ${anomalyComp.details.pendingCount} pending anomalies.`);
    }
    
    if (limitComp.violations?.length > 0) {
      const categories = [...new Set(limitComp.violations.map(v => v.category))];
      recommendations.push(`Consider increasing limits for: ${categories.slice(0, 2).join(', ')}.`);
    }
    
    const expenses = transactions.filter(t => t.type === 'expense');
    const totalExpenses = expenses.reduce((sum, t) => sum + t.amount, 0);
    const income = transactions.filter(t => t.type === 'income');
    const totalIncome = income.reduce((sum, t) => sum + t.amount, 0);
    
    if (totalIncome > 0 && totalExpenses > totalIncome * 0.9) {
      recommendations.push("Try to reduce discretionary spending to improve savings rate.");
    }
    
    return recommendations.join(' ') || "Continue monitoring your transactions regularly.";
  };

  const storeRiskScore = async (riskData) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      
      // Check if risk_scores table exists and has correct schema
      const { error } = await supabase.from('risk_scores').insert({
        user_id: user.id,
        risk_score: riskData.score,
        risk_level: getRiskLevelText(riskData.score),
        active_anomalies: riskData.active_anomalies || 0,
        recommendation: (riskData.recommendation || '').substring(0, 500)
      });
      
      if (error) {
        console.error('Error storing risk score:', error);
        // Don't throw - this is non-critical
      }
    } catch (error) {
      console.error('Failed to store risk score:', error);
    }
  };

  const getRiskLevelText = (score) => {
    if (score < 30) return 'very_low';
    if (score < 60) return 'low';
    if (score < 80) return 'medium';
    return 'high';
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

  const renderComponentGauge = (value, label, color = 'blue') => {
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
            style={{ width: `${value}%` }}
          />
        </div>
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
  const riskInfo = getScoreLabel();

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden transition-all duration-300">
      {/* Header */}
      <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-purple-600" />
            <h3 className="font-semibold text-gray-900">AI Risk Assessment</h3>
          </div>
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-xs text-purple-600 hover:text-purple-700 transition-colors"
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
            <svg className="w-40 h-40 transform -rotate-90">
              <circle
                cx="80"
                cy="80"
                r="72"
                fill="none"
                stroke="#e5e7eb"
                strokeWidth="12"
              />
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
              Risk Components (Calculated from your data)
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
                  Identified Risk Factors
                </h4>
                <div className="space-y-1.5">
                  {riskData.risk_factors.slice(0, 4).map((factor, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-xs">
                      <AlertTriangle className="w-3 h-3 text-yellow-500 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700">{factor}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Category Risks */}
            {riskData?.category_risks && riskData.category_risks.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                  <PieChart className="w-4 h-4 text-purple-500" />
                  Category Risk Analysis
                </h4>
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
              </div>
            )}

            {/* Recommendation */}
            <div className="p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg">
              <div className="flex items-start gap-2">
                <Info className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="text-sm font-semibold text-blue-800 mb-1">AI Recommendation</h4>
                  <p className="text-xs text-blue-700 leading-relaxed">
                    {riskData?.recommendation || 'Continue monitoring your transactions regularly.'}
                  </p>
                </div>
              </div>
            </div>

            {/* Data Source Note */}
            <div className="flex items-center justify-end gap-2 text-xs text-gray-400">
              <Brain className="w-3 h-3" />
              <span>Calculated from your transaction data</span>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="mt-6 flex gap-3">
          <button
            onClick={() => window.location.href = '/anomalies'}
            className="flex-1 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium flex items-center justify-center gap-2"
          >
            <Eye className="w-4 h-4" />
            Review Anomalies
          </button>
          <button
            onClick={fetchAndCalculateRisk}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>
      </div>

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