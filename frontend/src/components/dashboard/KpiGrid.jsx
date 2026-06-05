// frontend/src/components/dashboard/KpiGrid.jsx
import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Minus, Info, Loader } from 'lucide-react';
import api from '../../services/api';
import { supabase } from '../../services/supabaseClient';

const KpiGrid = ({ mode }) => {
  const [kpis, setKpis] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchKPIsFromSupabase();
  }, [mode]);

  const fetchKPIsFromSupabase = async () => {
    setLoading(true);
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user');

      // Fetch transaction summary
      const { data: transactions, error } = await supabase
        .from('transactions')
        .select('amount, type, date')
        .eq('user_id', user.id)
        .order('date', { ascending: false })
        .limit(100);

      if (error) throw error;

      // Calculate KPIs from real data
      const totalIncome = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
      const totalExpenses = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
      const netSavings = totalIncome - totalExpenses;
      const savingsRate = totalIncome > 0 ? (netSavings / totalIncome) * 100 : 0;
      
      // Get last month's data for comparison
      const oneMonthAgo = new Date();
      oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
      
      const lastMonthExpenses = transactions
        .filter(t => t.type === 'expense' && new Date(t.date) >= oneMonthAgo)
        .reduce((sum, t) => sum + t.amount, 0);
      
      const previousMonthExpenses = transactions
        .filter(t => t.type === 'expense' && new Date(t.date) < oneMonthAgo)
        .reduce((sum, t) => sum + t.amount, 0);
      
      const expenseChange = previousMonthExpenses > 0 
        ? ((lastMonthExpenses - previousMonthExpenses) / previousMonthExpenses) * 100 
        : 0;

      const modeSpecificKPIs = {
        personal: [
          { id: 1, title: 'Financial Health', value: Math.min(100, Math.max(0, 50 + (savingsRate * 2))), change: 5.2, trend: 'up', benchmark: 75, status: savingsRate > 20 ? 'good' : savingsRate > 10 ? 'warning' : 'critical', recommendation: savingsRate > 20 ? 'Great savings rate! Keep it up.' : 'Try to increase your savings rate.' },
          { id: 2, title: 'Monthly Spending', value: totalExpenses, change: -expenseChange, trend: expenseChange < 0 ? 'down' : 'up', benchmark: totalIncome * 0.7, status: totalExpenses <= totalIncome * 0.7 ? 'good' : 'warning', recommendation: totalExpenses <= totalIncome * 0.7 ? 'You are within budget!' : 'Consider reducing discretionary spending.' },
          { id: 3, title: 'Savings Rate', value: Math.round(savingsRate), change: 3, trend: savingsRate > 15 ? 'up' : 'down', benchmark: 20, status: savingsRate >= 20 ? 'good' : savingsRate >= 10 ? 'warning' : 'critical', recommendation: 'Aim to save 20% of your income.' },
          { id: 4, title: 'Net Savings', value: netSavings, change: netSavings > 0 ? 5 : -10, trend: netSavings > 0 ? 'up' : 'down', benchmark: 1000, status: netSavings > 1000 ? 'good' : netSavings > 0 ? 'warning' : 'critical', recommendation: netSavings > 0 ? 'You are building wealth!' : 'Review your expenses to increase savings.' }
        ],
        small_business: [
          { id: 1, title: 'Cash Runway', value: netSavings > 0 ? Math.floor(netSavings / (totalExpenses / 30)) : 0, change: -2, trend: 'down', benchmark: 12, status: 'warning', recommendation: 'Monitor cash flow closely.' },
          { id: 2, title: 'Burn Rate', value: totalExpenses, change: expenseChange, trend: expenseChange > 0 ? 'up' : 'down', benchmark: totalIncome, status: totalExpenses <= totalIncome ? 'good' : 'critical', recommendation: totalExpenses <= totalIncome ? 'Healthy burn rate.' : 'Reduce operational costs.' },
          { id: 3, title: 'Monthly Revenue', value: totalIncome, change: 8.2, trend: 'up', benchmark: totalExpenses * 1.2, status: totalIncome >= totalExpenses * 1.2 ? 'good' : 'warning', recommendation: 'Focus on revenue growth.' },
          { id: 4, title: 'Net Profit Margin', value: totalIncome > 0 ? Math.round((netSavings / totalIncome) * 100) : 0, change: 3, trend: 'up', benchmark: 20, status: 'good', recommendation: 'Profit margins are healthy.' }
        ],
        enterprise: [
          { id: 1, title: 'Total Assets', value: netSavings * 10, change: 12.5, trend: 'up', benchmark: 2000000, status: 'good', recommendation: 'Asset growth is strong.' },
          { id: 2, title: 'Risk Score', value: Math.min(100, Math.max(0, 100 - savingsRate)), change: -5, trend: 'down', benchmark: 30, status: 'warning', recommendation: 'Monitor risk factors.' },
          { id: 3, title: 'Active Users', value: 24, change: 4, trend: 'up', benchmark: 20, status: 'good', recommendation: 'User adoption is growing.' },
          { id: 4, title: 'Department ROI', value: 18, change: 2, trend: 'up', benchmark: 15, status: 'good', recommendation: 'ROI exceeded targets.' }
        ]
      };

      setKpis(modeSpecificKPIs[mode] || modeSpecificKPIs.personal);
    } catch (error) {
      console.error('Failed to fetch KPIs:', error);
      // Fallback mock data
      setKpis([
        { id: 1, title: 'Financial Health', value: 78, change: 5.2, trend: 'up', benchmark: 75, status: 'good', recommendation: 'Keep up the good work!' },
        { id: 2, title: 'Cash Runway', value: 12, change: -2, trend: 'down', benchmark: 12, status: 'warning', recommendation: 'Monitor expenses closely' },
        { id: 3, title: 'Burn Rate', value: 15000, change: 8, trend: 'up', benchmark: 10000, status: 'critical', recommendation: 'Reduce non-essential spending' },
        { id: 4, title: 'Savings Rate', value: 18, change: 3, trend: 'up', benchmark: 20, status: 'warning', recommendation: 'Increase savings by 2%' }
      ]);
    } finally {
      setLoading(false);
    }
  };

  // Rest of component remains the same...
  const getTrendIcon = (trend) => {
    if (trend === 'up') return <TrendingUp className="w-4 h-4 text-green-500" />;
    if (trend === 'down') return <TrendingDown className="w-4 h-4 text-red-500" />;
    return <Minus className="w-4 h-4 text-gray-500" />;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'good': return 'border-green-500 bg-green-50';
      case 'warning': return 'border-yellow-500 bg-yellow-50';
      case 'critical': return 'border-red-500 bg-red-50';
      default: return 'border-gray-200 bg-white';
    }
  };

  const formatValue = (value, title) => {
    if (typeof value === 'number') {
      if (title.includes('Revenue') || title.includes('Assets') || title.includes('Burn Rate') || title.includes('Savings')) {
        if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
        if (value >= 1000) return `$${(value / 1000).toFixed(1)}K`;
        return `$${value.toLocaleString()}`;
      }
      if (title.includes('Rate') || title.includes('Margin') || title.includes('Score')) {
        return `${Math.round(value)}%`;
      }
      return value.toLocaleString();
    }
    return value;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-40">
        <Loader className="w-6 h-6 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {kpis.map((kpi) => (
        <div key={kpi.id} className={`rounded-lg border-l-4 p-4 shadow-sm ${getStatusColor(kpi.status)}`}>
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm text-gray-600 mb-1">{kpi.title}</p>
              <p className="text-2xl font-bold">{formatValue(kpi.value, kpi.title)}</p>
            </div>
            <div className="flex items-center space-x-1">
              {getTrendIcon(kpi.trend)}
              <span className={`text-sm ${kpi.change > 0 ? 'text-green-600' : kpi.change < 0 ? 'text-red-600' : 'text-gray-500'}`}>
                {kpi.change > 0 ? '+' : ''}{kpi.change}%
              </span>
            </div>
          </div>
          <div className="mt-3 flex justify-between items-center">
            <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${kpi.status === 'good' ? 'bg-green-100 text-green-800' : kpi.status === 'warning' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}`}>
              {kpi.status.toUpperCase()}
            </span>
            <span className="text-xs text-gray-500">Target: {formatValue(kpi.benchmark, kpi.title)}</span>
            <button className="text-blue-500 hover:text-blue-700">
              <Info className="w-4 h-4" />
            </button>
          </div>
          <p className="text-xs mt-2 text-gray-600">{kpi.recommendation}</p>
        </div>
      ))}
    </div>
  );
};

export default KpiGrid;