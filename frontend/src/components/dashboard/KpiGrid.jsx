import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Minus, Info, Loader } from 'lucide-react';
import api from '../../services/api';

const KpiCard = ({ kpi, title, value, previous, change, trend, benchmark, status, recommendation, onInfoClick }) => {
  const getTrendIcon = () => {
    if (trend === 'up') return <TrendingUp className="w-4 h-4 text-green-500" />;
    if (trend === 'down') return <TrendingDown className="w-4 h-4 text-red-500" />;
    return <Minus className="w-4 h-4 text-gray-500" />;
  };

  const getStatusColor = () => {
    switch (status) {
      case 'good': return 'border-green-500 bg-green-50';
      case 'warning': return 'border-yellow-500 bg-yellow-50';
      case 'critical': return 'border-red-500 bg-red-50';
      default: return 'border-gray-200 bg-white';
    }
  };

  const getStatusBadge = () => {
    switch (status) {
      case 'good': return 'bg-green-100 text-green-800';
      case 'warning': return 'bg-yellow-100 text-yellow-800';
      case 'critical': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatValue = (val) => {
    if (typeof val === 'number') {
      if (Math.abs(val) > 1000000) return `$${(val / 1000000).toFixed(1)}M`;
      if (Math.abs(val) > 1000) return `$${(val / 1000).toFixed(1)}K`;
      return `$${val.toLocaleString()}`;
    }
    return val;
  };

  return (
    <div className={`rounded-lg border-l-4 p-4 shadow-sm hover:shadow-md transition-shadow ${getStatusColor()}`}>
      <div className="flex justify-between items-start">
        <div>
          <p className="text-sm text-gray-600 mb-1">{title}</p>
          <p className="text-2xl font-bold">{formatValue(value)}</p>
        </div>
        <div className="flex items-center space-x-1">
          {getTrendIcon()}
          <span className={`text-sm ${change > 0 ? 'text-green-600' : change < 0 ? 'text-red-600' : 'text-gray-500'}`}>
            {change > 0 ? '+' : ''}{change}%
          </span>
        </div>
      </div>
      
      <div className="mt-3 flex justify-between items-center">
        <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${getStatusBadge()}`}>
          {status.toUpperCase()}
        </span>
        <span className="text-xs text-gray-500">Target: {formatValue(benchmark)}</span>
        <button onClick={() => onInfoClick?.(kpi)} className="text-blue-500 hover:text-blue-700">
          <Info className="w-4 h-4" />
        </button>
      </div>
      
      {recommendation && (
        <p className="text-xs mt-2 text-gray-600 line-clamp-2">{recommendation}</p>
      )}
    </div>
  );
};

const KpiGrid = ({ mode }) => {
  const [kpis, setKpis] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchKPIs();
    const interval = setInterval(fetchKPIs, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, [mode]);

  const fetchKPIs = async () => {
    try {
      const response = await api.get(`/dss/kpis?mode=${mode}`);
      const data = response.data;
      
      const kpiList = Object.entries(data).map(([key, value]) => ({
        id: key,
        title: value.name || key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
        value: value.value,
        previous: value.previous_value,
        change: value.change_percentage,
        trend: value.trend,
        benchmark: value.benchmark,
        status: value.status,
        recommendation: value.recommendation
      }));
      
      setKpis(kpiList);
    } catch (error) {
      console.error('Failed to fetch KPIs:', error);
      // Fallback demo data
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

  const handleInfoClick = (kpi) => {
    // Show detailed modal - can be implemented later
    console.log('KPI Info:', kpi);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-32">
        <Loader className="w-6 h-6 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {kpis.map((kpi) => (
        <KpiCard
          key={kpi.id}
          kpi={kpi}
          title={kpi.title}
          value={kpi.value}
          previous={kpi.previous}
          change={kpi.change}
          trend={kpi.trend}
          benchmark={kpi.benchmark}
          status={kpi.status}
          recommendation={kpi.recommendation}
          onInfoClick={handleInfoClick}
        />
      ))}
    </div>
  );
};

export default KpiGrid;
