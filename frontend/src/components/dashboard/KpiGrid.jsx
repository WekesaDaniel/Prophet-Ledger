// frontend/src/components/dashboard/KpiGrid.jsx
import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Minus, Info, Loader } from 'lucide-react';

// 🔴 HARDCODED VALUES - Replace with API calls
const MOCK_KPIS = {
  personal: [
    { id: 1, title: 'Financial Health', value: 78, change: 5.2, trend: 'up', benchmark: 75, status: 'good', recommendation: 'Keep up the good work! Keep saving 20% of income.' },
    { id: 2, title: 'Monthly Spending', value: 3247, change: -3.1, trend: 'down', benchmark: 3500, status: 'good', recommendation: 'You are under budget this month!' },
    { id: 3, title: 'Savings Rate', value: 18, change: 3, trend: 'up', benchmark: 20, status: 'warning', recommendation: 'Increase savings by 2% to reach goal.' },
    { id: 4, title: 'Debt-to-Income', value: 28, change: -2, trend: 'down', benchmark: 30, status: 'good', recommendation: 'Debt ratio is healthy.' }
  ],
  small_business: [
    { id: 1, title: 'Cash Runway', value: 12, change: -2, trend: 'down', benchmark: 12, status: 'warning', recommendation: 'Monitor expenses closely. 12 months left.' },
    { id: 2, title: 'Burn Rate', value: 15000, change: 8, trend: 'up', benchmark: 10000, status: 'critical', recommendation: 'Reduce non-essential spending by 15%.' },
    { id: 3, title: 'Monthly Revenue', value: 47892, change: 8.2, trend: 'up', benchmark: 45000, status: 'good', recommendation: 'Revenue growing! Consider reinvesting.' },
    { id: 4, title: 'Net Profit Margin', value: 24, change: 3, trend: 'up', benchmark: 20, status: 'good', recommendation: 'Profit margins are improving.' }
  ],
  enterprise: [
    { id: 1, title: 'Total Assets', value: 2400000, change: 12.5, trend: 'up', benchmark: 2000000, status: 'good', recommendation: 'Asset growth is strong across all departments.' },
    { id: 2, title: 'Risk Score', value: 32, change: -5, trend: 'down', benchmark: 30, status: 'warning', recommendation: 'Risk score declining. Review compliance.' },
    { id: 3, title: 'Active Users', value: 24, change: 4, trend: 'up', benchmark: 20, status: 'good', recommendation: 'User adoption is growing.' },
    { id: 4, title: 'Department ROI', value: 18, change: 2, trend: 'up', benchmark: 15, status: 'good', recommendation: 'ROI exceeded targets across departments.' }
  ]
};

const KpiGrid = ({ mode }) => {
  const [kpis, setKpis] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 🔴 REPLACE WITH: fetchKPIsFromAPI()
    const fetchKPIs = () => {
      setTimeout(() => {
        // 🔴 HARDCODED - Replace with: api.get(`/dss/kpis?mode=${mode}`)
        const modeKey = mode === 'personal' ? 'personal' : mode === 'small_business' ? 'small_business' : 'enterprise';
        setKpis(MOCK_KPIS[modeKey]);
        setLoading(false);
      }, 500);
    };
    
    fetchKPIs();
    
    // ✅ TO DO: Uncomment when API is ready
    // const fetchKPIsFromAPI = async () => {
    //   try {
    //     const response = await api.get(`/dss/kpis?mode=${mode}`);
    //     setKpis(response.data);
    //   } catch (error) {
    //     console.error('Failed to fetch KPIs:', error);
    //   } finally {
    //     setLoading(false);
    //   }
    // };
    // fetchKPIsFromAPI();
  }, [mode]);

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