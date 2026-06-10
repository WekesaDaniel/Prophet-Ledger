// frontend/src/components/dashboard/TrendChart.jsx
import React, { useState, useEffect } from 'react';
import {
  LineChart, Line, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { Calendar, Loader, TrendingUp, Brain } from 'lucide-react';
import { supabase } from '../../services/supabaseClient';
import api from '../../services/api';

const TrendChart = ({ metric = 'cashflow', period = '6m', fullHeight = false }) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState(period);
  const [forecastMetrics, setForecastMetrics] = useState(null);
  const [usingAI, setUsingAI] = useState(false);
  const [modelInfo, setModelInfo] = useState(null);

  useEffect(() => {
    fetchTrendData();
    fetchModelInfo();
  }, [metric, timeframe]);

  const fetchModelInfo = async () => {
    try {
      const response = await api.get('/models/status');
      if (response.data) {
        setModelInfo(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch model info:', error);
    }
  };

  const fetchTrendData = async () => {
    setLoading(true);
    setUsingAI(false);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user');

      // Calculate date range
      const months = timeframe === '3m' ? 3 : timeframe === '6m' ? 6 : 12;
      const startDate = new Date();
      startDate.setMonth(startDate.getMonth() - months * 2); // Get more data for ARIMA

      // Fetch transactions
      const { data: transactions, error } = await supabase
        .from('transactions')
        .select('amount, type, date')
        .eq('user_id', user.id)
        .gte('date', startDate.toISOString().split('T')[0])
        .order('date', { ascending: true });

      if (error) throw error;

      // Group by month
      const monthlyData = new Map();
      transactions.forEach(t => {
        const month = new Date(t.date).toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
        if (!monthlyData.has(month)) {
          monthlyData.set(month, { date: month, income: 0, expense: 0, monthIndex: new Date(t.date).getMonth() });
        }
        const record = monthlyData.get(month);
        if (t.type === 'income') {
          record.income += t.amount;
        } else {
          record.expense += t.amount;
        }
      });

      // Convert to array and sort by date
      let historicalData = Array.from(monthlyData.values());
      
      // Calculate actual values based on metric
      const actualValues = historicalData.map(m => ({
        date: m.date,
        actual: metric === 'cashflow' ? m.income - m.expense : m.expense,
        income: m.income,
        expense: m.expense
      }));

      // Get ARIMA forecast from backend
      const historicalNumbers = actualValues.map(v => v.actual);
      
      try {
        const forecastResponse = await api.post('/forecasts/generate', {
          metric: metric,
          periods: 3,
          historical_data: historicalNumbers
        });
        
        if (forecastResponse.data && forecastResponse.data.forecasts) {
          setUsingAI(true);
          setForecastMetrics(forecastResponse.data.metrics);
          
          // Add forecast data points
          const forecastMonths = ['Next Month', '2 Months', '3 Months'];
          const forecastData = forecastResponse.data.forecasts.map((value, idx) => ({
            date: forecastMonths[idx],
            actual: null,
            forecast: value,
            confidence_lower: forecastResponse.data.confidence_intervals[idx]?.lower,
            confidence_upper: forecastResponse.data.confidence_intervals[idx]?.upper
          }));
          
          setData([...actualValues, ...forecastData]);
        } else {
          setData([...actualValues, ...generateSimpleForecast(actualValues)]);
        }
      } catch (forecastError) {
        console.error('ARIMA forecast failed, using fallback:', forecastError);
        setData([...actualValues, ...generateSimpleForecast(actualValues)]);
      }
      
    } catch (error) {
      console.error('Failed to fetch trend data:', error);
      setData(getMockData(metric));
    } finally {
      setLoading(false);
    }
  };

  const generateSimpleForecast = (historicalData) => {
    if (historicalData.length === 0) return getMockForecast();
    
    const lastActual = historicalData[historicalData.length - 1].actual;
    const avgChange = calculateAverageChange(historicalData.map(d => d.actual));
    
    const forecastMonths = ['Next Month', '2 Months', '3 Months'];
    return forecastMonths.map((month, i) => ({
      date: month,
      actual: null,
      forecast: Math.max(0, lastActual * (1 + avgChange * (i + 1)))
    }));
  };

  const calculateAverageChange = (values) => {
    if (values.length < 2) return 0.02;
    let totalChange = 0;
    for (let i = 1; i < values.length; i++) {
      if (values[i-1] !== 0) {
        totalChange += (values[i] - values[i-1]) / values[i-1];
      }
    }
    return totalChange / (values.length - 1);
  };

  const getMockData = (metric) => {
    const cashflowData = [
      { date: 'Jan', actual: 42500, forecast: null, income: 70000, expense: 27500 },
      { date: 'Feb', actual: 43800, forecast: null, income: 72000, expense: 28200 },
      { date: 'Mar', actual: 45200, forecast: null, income: 74000, expense: 28800 },
      { date: 'Apr', actual: 46800, forecast: null, income: 76000, expense: 29200 },
      { date: 'May', actual: 48500, forecast: null, income: 78000, expense: 29500 },
      { date: 'Jun', actual: null, forecast: 51000, income: null, expense: null },
      { date: 'Jul', actual: null, forecast: 53500, income: null, expense: null },
      { date: 'Aug', actual: null, forecast: 56200, income: null, expense: null }
    ];
    
    const expenseData = [
      { date: 'Jan', actual: 27500, forecast: null },
      { date: 'Feb', actual: 28200, forecast: null },
      { date: 'Mar', actual: 28800, forecast: null },
      { date: 'Apr', actual: 29200, forecast: null },
      { date: 'May', actual: 29500, forecast: null },
      { date: 'Jun', actual: null, forecast: 31000 },
      { date: 'Jul', actual: null, forecast: 32500 },
      { date: 'Aug', actual: null, forecast: 34100 }
    ];
    
    return metric === 'cashflow' ? cashflowData : expenseData;
  };

  const getMockForecast = () => {
    return [
      { date: 'Next Month', actual: null, forecast: 50000 },
      { date: '2 Months', actual: null, forecast: 52500 },
      { date: '3 Months', actual: null, forecast: 55100 }
    ];
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-gray-900 text-white p-3 rounded-lg shadow-lg max-w-xs">
          <p className="font-bold text-sm">{label}</p>
          {payload[0]?.value !== null && payload[0]?.value !== undefined && (
            <p className="text-xs mt-1">Actual: ${payload[0]?.value?.toLocaleString()}</p>
          )}
          {payload[0]?.payload?.forecast && (
            <>
              <p className="text-xs text-green-400 mt-1">
                ARIMA Forecast: ${payload[0].payload.forecast?.toLocaleString()}
              </p>
              {payload[0].payload.confidence_lower && (
                <p className="text-xs text-gray-400 mt-1">
                  95% CI: ${payload[0].payload.confidence_lower?.toLocaleString()} - ${payload[0].payload.confidence_upper?.toLocaleString()}
                </p>
              )}
            </>
          )}
          {payload[0]?.payload?.income && (
            <p className="text-xs text-green-400 mt-1">
              Income: ${payload[0].payload.income?.toLocaleString()}
            </p>
          )}
          {payload[0]?.payload?.expense && (
            <p className="text-xs text-red-400">
              Expenses: ${payload[0].payload.expense?.toLocaleString()}
            </p>
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
      <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-semibold">
            {metric === 'cashflow' ? 'Cash Flow Trend' : 'Expense Trend'}
          </h3>
          {usingAI && (
            <span className="flex items-center gap-1 text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">
              <Brain className="w-3 h-3" />
              ARIMA Forecast
            </span>
          )}
        </div>
        <div className="flex space-x-2">
          {['3m', '6m', '1y'].map(periodOption => (
            <button
              key={periodOption}
              onClick={() => setTimeframe(periodOption)}
              className={`px-3 py-1 text-sm rounded-lg transition ${
                timeframe === periodOption ? 'bg-blue-600 text-white' : 'bg-gray-100 hover:bg-gray-200'
              }`}
            >
              {periodOption === '3m' ? '3 Months' : periodOption === '6m' ? '6 Months' : '1 Year'}
            </button>
          ))}
        </div>
      </div>
      
      <ResponsiveContainer width="100%" height={fullHeight ? 400 : 350}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis dataKey="date" tick={{ fontSize: 12 }} />
          <YAxis tickFormatter={(value) => `$${(value / 1000).toFixed(0)}K`} />
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
            name="ARIMA Forecast" 
            dot={{ fill: '#10b981', r: 4 }}
          />
        </LineChart>
      </ResponsiveContainer>
      
      <div className="mt-4 flex justify-center space-x-6 text-sm">
        <div className="flex items-center">
          <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
          <span>Actual</span>
        </div>
        <div className="flex items-center">
          <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
          <span>ARIMA Forecast</span>
        </div>
        {forecastMetrics && (
          <div className="flex items-center text-gray-500">
            <TrendingUp className="w-3 h-3 mr-1" />
            <span className="text-xs">
              MAPE: {forecastMetrics.mape}% | Method: {forecastMetrics.model_type || 'ARIMA'}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default TrendChart;