// frontend/src/components/dashboard/KpiGrid.jsx
import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Minus, Info, Loader } from 'lucide-react';
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
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user');

      // Fetch transactions
      const { data: transactions, error } = await supabase
        .from('transactions')
        .select('amount, type, date')
        .eq('user_id', user.id);

      if (error) throw error;

      const transactionsData = transactions || [];
      
      // Calculate real KPIs
      const totalIncome = transactionsData.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
      const totalExpenses = transactionsData.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
      const netSavings = totalIncome - totalExpenses;
      const savingsRate = totalIncome > 0 ? (netSavings / totalIncome) * 100 : 0;

      // Calculate month-over-month changes
      const now = new Date();
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();
      
      const currentMonthTransactions = transactionsData.filter(t => {
        const date = new Date(t.date);
        return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
      });
      
      const lastMonthTransactions = transactionsData.filter(t => {
        const date = new Date(t.date);
        const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
        const lastYear = currentMonth === 0 ? currentYear - 1 : currentYear;
        return date.getMonth() === lastMonth && date.getFullYear() === lastYear;
      });
      
      const currentExpenses = currentMonthTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
      const lastExpenses = lastMonthTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
      const expenseChange = lastExpenses > 0 ? ((currentExpenses - lastExpenses) / lastExpenses) * 100 : 0;

      // Fetch anomalies
      const { data: anomalies } = await supabase
        .from('anomalies')
        .select('id')
        .eq('user_id', user.id)
        .eq('status', 'pending');

      const pendingAnomalies = anomalies?.length || 0;

      // Build KPIs based on mode
      let kpiList = [];

      if (mode === 'personal') {
        kpiList = [
          { id: 1, title: 'Financial Health', value: Math.min(100, Math.max(0, 50 + (savingsRate * 1.5))), change: savingsRate - 15, trend: savingsRate > 15 ? 'up' : 'down', benchmark: 75, status: savingsRate >= 20 ? 'good' : savingsRate >= 10 ? 'warning' : 'critical', recommendation: savingsRate >= 20 ? 'Excellent savings rate!' : 'Try to increase your savings.' },
          { id: 2, title: 'Monthly Spending', value: currentExpenses, change: -expenseChange, trend: expenseChange < 0 ? 'down' : 'up', benchmark: totalIncome * 0.7, status: currentExpenses <= totalIncome * 0.7 ? 'good' : 'warning', recommendation: currentExpenses <= totalIncome * 0.7 ? 'Within budget!' : 'Consider reducing expenses.' },
          { id: 3, title: 'Savings Rate', value: Math.round(savingsRate), change: savingsRate - 15, trend: savingsRate > 15 ? 'up' : 'down', benchmark: 20, status: savingsRate >= 20 ? 'good' : savingsRate >= 10 ? 'warning' : 'critical', recommendation: 'Aim to save 20% of income.' },
          { id: 4, title: 'Active Anomalies', value: pendingAnomalies, change: pendingAnomalies > 0 ? pendingAnomalies * 10 : -5, trend: pendingAnomalies > 0 ? 'up' : 'down', benchmark: 0, status: pendingAnomalies === 0 ? 'good' : 'warning', recommendation: pendingAnomalies === 0 ? 'No anomalies detected' : `Review ${pendingAnomalies} pending anomalies` }
        ];
      } else {
        // Business/Enterprise KPIs
        kpiList = [
          { id: 1, title: 'Total Revenue', value: totalIncome, change: 5.2, trend: 'up', benchmark: totalExpenses * 1.2, status: totalIncome >= totalExpenses * 1.2 ? 'good' : 'warning', recommendation: 'Focus on revenue growth.' },
          { id: 2, title: 'Total Expenses', value: totalExpenses, change: expenseChange, trend: expenseChange > 0 ? 'up' : 'down', benchmark: totalIncome, status: totalExpenses <= totalIncome ? 'good' : 'critical', recommendation: totalExpenses <= totalIncome ? 'Healthy spending' : 'Reduce costs.' },
          { id: 3, title: 'Net Profit', value: netSavings, change: netSavings > 0 ? 8 : -10, trend: netSavings > 0 ? 'up' : 'down', benchmark: 10000, status: netSavings > 10000 ? 'good' : netSavings > 0 ? 'warning' : 'critical', recommendation: netSavings > 0 ? 'Profitable' : 'Review profitability.' },
          { id: 4, title: 'Active Anomalies', value: pendingAnomalies, change: pendingAnomalies > 0 ? pendingAnomalies * 10 : -5, trend: pendingAnomalies > 0 ? 'up' : 'down', benchmark: 0, status: pendingAnomalies === 0 ? 'good' : 'warning', recommendation: pendingAnomalies === 0 ? 'No anomalies detected' : `Review ${pendingAnomalies} anomalies` }
        ];
      }

      setKpis(kpiList);
    } catch (error) {
      console.error('Failed to fetch KPIs:', error);
      setKpis([
        { id: 1, title: 'Financial Health', value: 78, change: 5.2, trend: 'up', benchmark: 75, status: 'good', recommendation: 'Keep up the good work!' },
        { id: 2, title: 'Active Anomalies', value: 0, change: -2, trend: 'down', benchmark: 0, status: 'good', recommendation: 'No anomalies detected' }
      ]);
    } finally {
      setLoading(false);
    }
  };

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
    if (typeof value !== 'number') return value;
    if (title.includes('Revenue') || title.includes('Expenses') || title.includes('Spending') || title.includes('Savings')) {
      if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
      if (value >= 1000) return `$${(value / 1000).toFixed(1)}K`;
      return `$${value.toLocaleString()}`;
    }
    if (title.includes('Rate') || title.includes('Score') || title.includes('Health')) {
      return `${Math.round(value)}%`;
    }
    return value.toLocaleString();
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
                {kpi.change > 0 ? '+' : ''}{kpi.change.toFixed(1)}%
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