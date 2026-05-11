// frontend/src/components/dashboard/TrendChart.jsx
import React, { useState, useEffect } from 'react';
import {
  LineChart, Line, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { Calendar, Loader } from 'lucide-react';

// 🔴 HARDCODED MOCK DATA - Replace with API data
const MOCK_TREND_DATA = {
  cashflow: [
    { date: '2024-01', actual: 42500, forecast: 43000 },
    { date: '2024-02', actual: 43800, forecast: 44000 },
    { date: '2024-03', actual: 45200, forecast: 45500 },
    { date: '2024-04', actual: 46800, forecast: 47000 },
    { date: '2024-05', actual: 48500, forecast: 49000 },
    { date: '2024-06', actual: null, forecast: 51000 }
  ],
  expenses: [
    { date: '2024-01', actual: 28500, forecast: 28000 },
    { date: '2024-02', actual: 29200, forecast: 29000 },
    { date: '2024-03', actual: 30100, forecast: 30500 },
    { date: '2024-04', actual: 31500, forecast: 31000 },
    { date: '2024-05', actual: 32800, forecast: 32500 },
    { date: '2024-06', actual: null, forecast: 34000 }
  ]
};

const TrendChart = ({ metric = 'cashflow' }) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState('6m');

  useEffect(() => {
    // 🔴 HARDCODED - Replace with: fetchTrendDataFromAPI()
    const fetchData = () => {
      setTimeout(() => {
        setData(MOCK_TREND_DATA[metric]);
        setLoading(false);
      }, 500);
    };
    fetchData();
    
    // ✅ TO DO: Uncomment when API is ready
    // const fetchTrendData = async () => {
    //   try {
    //     const response = await api.get(`/forecasts/trend/${metric}?period=${timeframe}`);
    //     setData(response.data);
    //   } catch (error) {
    //     console.error('Failed to fetch trend data:', error);
    //   } finally {
    //     setLoading(false);
    //   }
    // };
    // fetchTrendData();
  }, [metric, timeframe]);

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-gray-900 text-white p-3 rounded-lg shadow-lg">
          <p className="font-bold text-sm">{label}</p>
          <p className="text-xs mt-1">Actual: ${payload[0]?.value?.toLocaleString()}</p>
          {payload[0]?.payload?.forecast && (
            <p className="text-xs text-gray-300">Forecast: ${payload[0].payload.forecast?.toLocaleString()}</p>
          )}
        </div>
      );
    }
    return null;
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
        <h3 className="text-lg font-semibold">
          {metric === 'cashflow' ? 'Cash Flow Trend' : 'Expense Trend'}
        </h3>
        <div className="flex space-x-2">
          {['3m', '6m', '1y'].map(period => (
            <button
              key={period}
              onClick={() => setTimeframe(period)}
              className={`px-3 py-1 text-sm rounded-lg transition ${
                timeframe === period ? 'bg-blue-600 text-white' : 'bg-gray-100 hover:bg-gray-200'
              }`}
            >
              {period === '3m' ? '3 Months' : period === '6m' ? '6 Months' : '1 Year'}
            </button>
          ))}
        </div>
      </div>
      
      <ResponsiveContainer width="100%" height={350}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis dataKey="date" tick={{ fontSize: 12 }} />
          <YAxis tickFormatter={(value) => `$${(value / 1000).toFixed(0)}K`} />
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          <Area type="monotone" dataKey="actual" stroke="#3b82f6" strokeWidth={2} fill="#93c5fd" fillOpacity={0.2} name="Actual" />
          <Line type="monotone" dataKey="forecast" stroke="#10b981" strokeWidth={2} strokeDasharray="5 5" name="Forecast" dot={false} />
        </LineChart>
      </ResponsiveContainer>
      
      <div className="mt-4 flex justify-center space-x-6 text-sm">
        <div className="flex items-center"><div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div><span>Actual</span></div>
        <div className="flex items-center"><div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div><span>Forecast</span></div>
      </div>
    </div>
  );
};

export default TrendChart;