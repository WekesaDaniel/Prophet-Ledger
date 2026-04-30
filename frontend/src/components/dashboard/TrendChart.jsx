import React, { useState, useEffect } from 'react';
import {
  LineChart,
  Line,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceDot
} from 'recharts';
import { Loader, Calendar } from 'lucide-react';
import api from '../../services/api';

const TrendChart = ({ userId, metric = 'cashflow' }) => {
  const [data, setData] = useState([]);
  const [anomalies, setAnomalies] = useState([]);
  const [timeframe, setTimeframe] = useState('90d');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [timeframe, metric]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const days = timeframe === '90d' ? 90 : timeframe === '30d' ? 30 : 365;
      const response = await api.get(`/dss/trends/${metric}?user_id=${userId}&days=${days}`);
      setData(response.data.history || generateMockData(days));
      setAnomalies(response.data.anomalies || []);
    } catch (error) {
      console.error('Failed to fetch trend data:', error);
      setData(generateMockData(timeframe === '90d' ? 90 : 30));
    } finally {
      setLoading(false);
    }
  };

  const generateMockData = (days) => {
    const mockData = [];
    let value = 50000;
    for (let i = days; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      value += (Math.random() - 0.5) * 2000;
      mockData.push({
        date: date.toISOString().split('T')[0],
        actual: Math.max(0, value),
        forecast: Math.max(0, value * (1 + (Math.random() - 0.5) * 0.1))
      });
    }
    return mockData;
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-gray-900 text-white p-3 rounded-lg shadow-lg">
          <p className="font-bold">{label}</p>
          <p className="text-sm">Actual: ${payload[0]?.value?.toLocaleString()}</p>
          {payload[0]?.payload?.forecast && (
            <p className="text-sm text-gray-300">Forecast: ${payload[0].payload.forecast?.toLocaleString()}</p>
          )}
          {payload[0]?.payload?.isAnomaly && (
            <p className="text-xs text-red-400 mt-1">⚠️ Anomaly Detected</p>
          )}
        </div>
      );
    }
    return null;
  };

  const getMetricTitle = () => {
    switch (metric) {
      case 'cashflow': return 'Cash Flow Trend';
      case 'expenses': return 'Expense Trend';
      case 'savings': return 'Savings Growth';
      default: return 'Financial Trend';
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-4">
        <div className="flex justify-center items-center h-80">
          <Loader className="w-8 h-8 animate-spin text-blue-500" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">{getMetricTitle()}</h3>
        
        <div className="flex space-x-2">
          {[
            { value: '30d', label: '30 Days' },
            { value: '90d', label: '90 Days' },
            { value: '365d', label: '1 Year' }
          ].map(period => (
            <button
              key={period.value}
              onClick={() => setTimeframe(period.value)}
              className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                timeframe === period.value 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {period.label}
            </button>
          ))}
        </div>
      </div>
      
      <ResponsiveContainer width="100%" height={400}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis 
            dataKey="date" 
            tick={{ fontSize: 12 }}
            tickFormatter={(date) => {
              const d = new Date(date);
              return `${d.getMonth()+1}/${d.getDate()}`;
            }}
          />
          <YAxis 
            tickFormatter={(value) => `$${(value / 1000).toFixed(0)}K`}
            tick={{ fontSize: 12 }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          
          <Area
            type="monotone"
            dataKey="actual"
            stroke="#3b82f6"
            strokeWidth={2}
            fill="#93c5fd"
            fillOpacity={0.2}
            name="Actual"
          />
          
          <Line
            type="monotone"
            dataKey="forecast"
            stroke="#10b981"
            strokeWidth={2}
            strokeDasharray="5 5"
            name="Forecast"
            dot={false}
          />
          
          {anomalies.map((anomaly, idx) => (
            <ReferenceDot
              key={idx}
              x={anomaly.date}
              y={anomaly.amount}
              r={6}
              fill="#ef4444"
              stroke="#fff"
              strokeWidth={2}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
      
      <div className="mt-4 flex justify-center space-x-6 text-sm">
        <div className="flex items-center">
          <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
          <span>Actual</span>
        </div>
        <div className="flex items-center">
          <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
          <span>Forecast</span>
        </div>
        <div className="flex items-center">
          <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
          <span>Anomaly</span>
        </div>
      </div>
    </div>
  );
};

export default TrendChart;
