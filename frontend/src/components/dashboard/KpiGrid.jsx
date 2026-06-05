import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Minus, Info, Loader } from 'lucide-react';
import api from '../../services/api';

const KpiGrid = ({ mode }) => {
  const [kpis, setKpis] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchKPIs();
  }, [mode]);

  const fetchKPIs = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/dss/kpis?mode=${mode}`);
      setKpis(response.data);
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
      if (title.includes('Revenue') || title.includes('Assets') || title.includes('Burn Rate')) {
        if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
        if (value >= 1000) return `$${(value / 1000).toFixed(1)}K`;
        return `$${value.toLocaleString()}`;
      }
      if (title.includes('Rate') || title.includes('Margin') || title.includes('Score')) {
        return `${value}%`;
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