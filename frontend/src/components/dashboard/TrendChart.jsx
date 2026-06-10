// frontend/src/components/dashboard/TrendChart.jsx
import React, { useState, useEffect } from 'react';
import {
  LineChart, Line, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine
} from 'recharts';
import { Calendar, Loader, TrendingUp, Brain, DollarSign, AlertCircle } from 'lucide-react';
import { supabase } from '../../services/supabaseClient';
import api from '../../services/api';

const TrendChart = ({ metric = 'cashflow', period = '6m', fullHeight = false }) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState(period);
  const [forecastMetrics, setForecastMetrics] = useState(null);
  const [usingAI, setUsingAI] = useState(false);
  const [modelInfo, setModelInfo] = useState(null);
  const [hoveredPoint, setHoveredPoint] = useState(null);

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

      // Calculate date range based on timeframe
      const months = timeframe === '3m' ? 3 : timeframe === '6m' ? 6 : 12;
      const startDate = new Date();
      startDate.setMonth(startDate.getMonth() - months);
      
      // Add 3 extra months for forecast
      const endDate = new Date();
      endDate.setMonth(endDate.getMonth() + 3);

      // Fetch transactions
      const { data: transactions, error } = await supabase
        .from('transactions')
        .select('amount, type, date, category')
        .eq('user_id', user.id)
        .gte('date', startDate.toISOString().split('T')[0])
        .order('date', { ascending: true });

      if (error) throw error;

      if (!transactions || transactions.length === 0) {
        setData(getMockData(metric));
        setLoading(false);
        return;
      }

      // Group by month
      const monthlyData = new Map();
      
      transactions.forEach(t => {
        const date = new Date(t.date);
        const monthKey = `${date.getFullYear()}-${date.getMonth()}`;
        const monthLabel = date.toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
        
        if (!monthlyData.has(monthKey)) {
          monthlyData.set(monthKey, { 
            date: monthLabel, 
            fullDate: date,
            income: 0, 
            expense: 0,
            monthIndex: date.getMonth(),
            year: date.getFullYear()
          });
        }
        const record = monthlyData.get(monthKey);
        if (t.type === 'income') {
          record.income += t.amount;
        } else {
          record.expense += t.amount;
        }
      });

      // Convert to array and sort by date
      let historicalData = Array.from(monthlyData.values())
        .sort((a, b) => a.fullDate - b.fullDate);
      
      // Calculate actual values based on metric
      const actualValues = historicalData.map(m => ({
        date: m.date,
        fullDate: m.fullDate,
        actual: metric === 'cashflow' ? m.income - m.expense : m.expense,
        income: m.income,
        expense: m.expense,
        isForecast: false
      }));

      // Get ARIMA forecast from backend or generate simple forecast
      let forecastValues = [];
      
      if (actualValues.length >= 3) {
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
            
            // Generate next 3 months
            const lastDate = actualValues[actualValues.length - 1].fullDate;
            const forecastMonths = [];
            for (let i = 1; i <= 3; i++) {
              const nextDate = new Date(lastDate);
              nextDate.setMonth(lastDate.getMonth() + i);
              forecastMonths.push({
                date: nextDate.toLocaleDateString('en-US', { year: 'numeric', month: 'short' }),
                fullDate: nextDate
              });
            }
            
            forecastValues = forecastResponse.data.forecasts.map((value, idx) => ({
              date: forecastMonths[idx].date,
              fullDate: forecastMonths[idx].fullDate,
              actual: null,
              forecast: Math.max(0, value),
              confidence_lower: forecastResponse.data.confidence_intervals?.[idx]?.lower,
              confidence_upper: forecastResponse.data.confidence_intervals?.[idx]?.upper,
              isForecast: true
            }));
          } else {
            forecastValues = generateSimpleForecast(actualValues);
          }
        } catch (forecastError) {
          console.error('ARIMA forecast failed, using fallback:', forecastError);
          forecastValues = generateSimpleForecast(actualValues);
        }
      } else {
        forecastValues = generateSimpleForecast(actualValues);
      }
      
      setData([...actualValues, ...forecastValues]);
      
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
    
    const lastDate = historicalData[historicalData.length - 1].fullDate;
    const forecastMonths = [];
    for (let i = 1; i <= 3; i++) {
      const nextDate = new Date(lastDate);
      nextDate.setMonth(lastDate.getMonth() + i);
      forecastMonths.push({
        date: nextDate.toLocaleDateString('en-US', { year: 'numeric', month: 'short' }),
        fullDate: nextDate
      });
    }
    
    return forecastMonths.map((month, i) => ({
      date: month.date,
      fullDate: month.fullDate,
      actual: null,
      forecast: Math.max(0, lastActual * (1 + avgChange * (i + 1))),
      confidence_lower: Math.max(0, lastActual * (1 + (avgChange - 0.05) * (i + 1))),
      confidence_upper: Math.max(0, lastActual * (1 + (avgChange + 0.05) * (i + 1))),
      isForecast: true
    }));
  };

  const calculateAverageChange = (values) => {
    if (values.length < 2) return 0.02;
    let totalChange = 0;
    let validChanges = 0;
    for (let i = 1; i < values.length; i++) {
      if (values[i-1] !== 0 && !isNaN(values[i-1]) && !isNaN(values[i])) {
        totalChange += (values[i] - values[i-1]) / Math.abs(values[i-1]);
        validChanges++;
      }
    }
    return validChanges > 0 ? totalChange / validChanges : 0.02;
  };

  const getMockData = (metric) => {
    if (metric === 'cashflow') {
      return [
        { date: 'Jan', actual: 42500, forecast: null, income: 70000, expense: 27500, isForecast: false, fullDate: new Date(2024, 0, 1) },
        { date: 'Feb', actual: 43800, forecast: null, income: 72000, expense: 28200, isForecast: false, fullDate: new Date(2024, 1, 1) },
        { date: 'Mar', actual: 45200, forecast: null, income: 74000, expense: 28800, isForecast: false, fullDate: new Date(2024, 2, 1) },
        { date: 'Apr', actual: 46800, forecast: null, income: 76000, expense: 29200, isForecast: false, fullDate: new Date(2024, 3, 1) },
        { date: 'May', actual: 48500, forecast: null, income: 78000, expense: 29500, isForecast: false, fullDate: new Date(2024, 4, 1) },
        { date: 'Jun', actual: null, forecast: 51000, income: null, expense: null, isForecast: true, fullDate: new Date(2024, 5, 1) },
        { date: 'Jul', actual: null, forecast: 53500, income: null, expense: null, isForecast: true, fullDate: new Date(2024, 6, 1) },
        { date: 'Aug', actual: null, forecast: 56200, income: null, expense: null, isForecast: true, fullDate: new Date(2024, 7, 1) }
      ];
    } else {
      return [
        { date: 'Jan', actual: 27500, forecast: null, isForecast: false, fullDate: new Date(2024, 0, 1) },
        { date: 'Feb', actual: 28200, forecast: null, isForecast: false, fullDate: new Date(2024, 1, 1) },
        { date: 'Mar', actual: 28800, forecast: null, isForecast: false, fullDate: new Date(2024, 2, 1) },
        { date: 'Apr', actual: 29200, forecast: null, isForecast: false, fullDate: new Date(2024, 3, 1) },
        { date: 'May', actual: 29500, forecast: null, isForecast: false, fullDate: new Date(2024, 4, 1) },
        { date: 'Jun', actual: null, forecast: 31000, isForecast: true, fullDate: new Date(2024, 5, 1) },
        { date: 'Jul', actual: null, forecast: 32500, isForecast: true, fullDate: new Date(2024, 6, 1) },
        { date: 'Aug', actual: null, forecast: 34100, isForecast: true, fullDate: new Date(2024, 7, 1) }
      ];
    }
  };

  const getMockForecast = () => {
    const today = new Date();
    return [
      { date: 'Next Month', actual: null, forecast: 50000, isForecast: true, fullDate: new Date(today.getFullYear(), today.getMonth() + 1, 1) },
      { date: '2 Months', actual: null, forecast: 52500, isForecast: true, fullDate: new Date(today.getFullYear(), today.getMonth() + 2, 1) },
      { date: '3 Months', actual: null, forecast: 55100, isForecast: true, fullDate: new Date(today.getFullYear(), today.getMonth() + 3, 1) }
    ];
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const dataPoint = payload[0]?.payload;
      return (
        <div className="bg-gray-900 text-white p-3 rounded-lg shadow-lg max-w-xs border border-gray-700">
          <p className="font-bold text-sm mb-2">{label}</p>
          
          {dataPoint?.actual !== null && dataPoint?.actual !== undefined && (
            <div className="mb-2">
              <p className="text-xs text-blue-400 font-semibold mb-1">📊 Actual</p>
              <p className="text-lg font-bold text-blue-400">
                ${dataPoint.actual?.toLocaleString()}
              </p>
            </div>
          )}
          
          {dataPoint?.forecast && (
            <div className="mb-2">
              <p className="text-xs text-green-400 font-semibold mb-1">🤖 ARIMA Forecast</p>
              <p className="text-lg font-bold text-green-400">
                ${dataPoint.forecast?.toLocaleString()}
              </p>
              {dataPoint.confidence_lower && (
                <p className="text-xs text-gray-400 mt-1">
                  95% CI: ${dataPoint.confidence_lower?.toLocaleString()} - ${dataPoint.confidence_upper?.toLocaleString()}
                </p>
              )}
            </div>
          )}
          
          {dataPoint?.income !== undefined && dataPoint?.income > 0 && (
            <div className="mt-2 pt-2 border-t border-gray-700">
              <p className="text-xs text-green-400">
                💰 Income: ${dataPoint.income?.toLocaleString()}
              </p>
              <p className="text-xs text-red-400">
                📉 Expenses: ${dataPoint.expense?.toLocaleString()}
              </p>
              {metric === 'cashflow' && (
                <p className="text-xs text-blue-400 mt-1">
                  💵 Net Cash Flow: ${(dataPoint.income - dataPoint.expense)?.toLocaleString()}
                </p>
              )}
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  const CustomDot = (props) => {
    const { cx, cy, payload, dataKey } = props;
    if (dataKey === 'actual' && payload.actual !== null && payload.actual !== undefined) {
      return (
        <circle 
          cx={cx} 
 cy={cy} 
          r={6} 
          fill="#3b82f6" 
          stroke="#fff" 
          strokeWidth={2}
          className="cursor-pointer hover:r-8 transition-all"
        />
      );
    }
    if (dataKey === 'forecast' && payload.forecast) {
      return (
        <circle 
          cx={cx} 
          cy={cy} 
          r={5} 
          fill="#10b981" 
          stroke="#fff" 
          strokeWidth={2}
          className="cursor-pointer"
        />
      );
    }
    return null;
  };

  const formatYAxis = (value) => {
    if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`;
    return `$${value}`;
  };

  // Calculate min and max for better y-axis scaling
  const allValues = [
    ...data.filter(d => d.actual !== null).map(d => d.actual),
    ...data.filter(d => d.forecast).map(d => d.forecast),
    ...data.filter(d => d.confidence_lower).map(d => d.confidence_lower),
    ...data.filter(d => d.confidence_upper).map(d => d.confidence_upper)
  ].filter(v => v !== null && v !== undefined);
  
  const minValue = Math.min(...allValues, 0);
  const maxValue = Math.max(...allValues, 1000);
  const yAxisDomain = [Math.max(0, minValue * 0.9), maxValue * 1.1];

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-4">
        <div className="flex flex-col justify-center items-center h-80">
          <Loader className="w-8 h-8 animate-spin text-blue-500 mb-2" />
          <p className="text-sm text-gray-500">Loading trend data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-4">
      <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-blue-100 rounded-lg">
            {metric === 'cashflow' ? (
              <DollarSign className="w-5 h-5 text-blue-600" />
            ) : (
              <TrendingUp className="w-5 h-5 text-blue-600" />
            )}
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-800">
              {metric === 'cashflow' ? 'Cash Flow Analysis' : 'Expense Tracking'}
            </h3>
            <p className="text-xs text-gray-500">
              {metric === 'cashflow' 
                ? 'Income minus expenses over time' 
                : 'Monthly spending patterns'}
            </p>
          </div>
          {usingAI && (
            <span className="flex items-center gap-1 text-xs bg-gradient-to-r from-purple-100 to-purple-50 text-purple-700 px-2 py-1 rounded-full ml-2">
              <Brain className="w-3 h-3" />
              ARIMA Forecast Active
            </span>
          )}
        </div>
        <div className="flex space-x-2">
          {[
            { value: '3m', label: '3 Months' },
            { value: '6m', label: '6 Months' },
            { value: '1y', label: '1 Year' }
          ].map(periodOption => (
            <button
              key={periodOption.value}
              onClick={() => setTimeframe(periodOption.value)}
              className={`px-3 py-1 text-sm rounded-lg transition-all duration-200 ${
                timeframe === periodOption.value 
                  ? 'bg-blue-600 text-white shadow-md' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {periodOption.label}
            </button>
          ))}
        </div>
      </div>
      
      <ResponsiveContainer width="100%" height={fullHeight ? 400 : 350}>
        <LineChart 
          data={data}
          margin={{ top: 20, right: 30, left: 20, bottom: 10 }}
          onMouseMove={(e) => {
            if (e && e.activePayload) {
              setHoveredPoint(e.activePayload[0]?.payload);
            }
          }}
        >
          <defs>
            <linearGradient id="blueGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
            </linearGradient>
            <linearGradient id="greenGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
              <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
            </linearGradient>
          </defs>
          
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" strokeWidth={1} />
          
          <XAxis 
            dataKey="date" 
            tick={{ fontSize: 12, fill: '#6b7280' }}
            axisLine={{ stroke: '#e5e7eb' }}
            tickLine={{ stroke: '#e5e7eb' }}
          />
          
          <YAxis 
            tickFormatter={formatYAxis}
            tick={{ fontSize: 12, fill: '#6b7280' }}
            axisLine={{ stroke: '#e5e7eb' }}
            tickLine={{ stroke: '#e5e7eb' }}
            domain={yAxisDomain}
          />
          
          <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#9ca3af', strokeWidth: 1, strokeDasharray: '4 4' }} />
          
          <Legend 
            verticalAlign="top" 
            height={36}
            iconType="circle"
            formatter={(value, entry) => {
              const { color } = entry;
              return <span style={{ color: '#374151', fontSize: '12px', marginLeft: '4px' }}>{value}</span>;
            }}
          />
          
          {/* Reference line at y=0 */}
          <ReferenceLine y={0} stroke="#ef4444" strokeDasharray="3 3" strokeWidth={1} />
          
          {/* Confidence interval area for forecast */}
          {usingAI && (
            <Area
              type="monotone"
              dataKey="confidence_upper"
              stroke="none"
              fill="#10b981"
              fillOpacity={0.1}
              name="Confidence Interval"
            />
          )}
          
          {/* Area under the actual line */}
          <Area 
            type="monotone" 
            dataKey="actual" 
            stroke="none"
            fill="url(#blueGradient)"
            name="Area"
          />
          
          {/* Main actual data line - THICK BLUE LINE */}
          <Line 
            type="monotone" 
            dataKey="actual" 
            stroke="#3b82f6" 
            strokeWidth={3}
            strokeLinecap="round"
            strokeLinejoin="round"
            dot={<CustomDot />}
            activeDot={{ r: 8, fill: '#3b82f6', stroke: '#fff', strokeWidth: 3 }}
            name="Actual Data"
            connectNulls={false}
            animationDuration={1000}
            animationEasing="ease-in-out"
          />
          
          {/* Forecast line - dashed green */}
          <Line 
            type="monotone" 
            dataKey="forecast" 
            stroke="#10b981" 
            strokeWidth={2.5}
            strokeDasharray="8 4"
            strokeLinecap="round"
            dot={<CustomDot />}
            activeDot={{ r: 7, fill: '#10b981', stroke: '#fff', strokeWidth: 2 }}
            name="ARIMA Forecast"
            animationDuration={1000}
            animationBegin={300}
          />
        </LineChart>
      </ResponsiveContainer>
      
      {/* Stats and Info Footer */}
      <div className="mt-4 pt-4 border-t border-gray-100">
        <div className="flex justify-between items-center flex-wrap gap-3 text-sm">
          <div className="flex space-x-4">
            <div className="flex items-center">
              <div className="w-4 h-0.5 bg-blue-500 rounded-full mr-2"></div>
              <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
              <span className="text-gray-600 text-xs">Actual Data</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-0.5 bg-green-500 rounded-full mr-2" style={{ backgroundImage: 'repeating-linear-gradient(90deg, #10b981, #10b981 4px, transparent 4px, transparent 8px)' }}></div>
              <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
              <span className="text-gray-600 text-xs">ARIMA Forecast</span>
            </div>
            {usingAI && (
              <div className="flex items-center">
                <div className="w-4 h-3 bg-green-500 bg-opacity-20 rounded mr-2"></div>
                <span className="text-gray-600 text-xs">95% Confidence Interval</span>
              </div>
            )}
          </div>
          
          {forecastMetrics && (
            <div className="flex items-center gap-3 text-xs">
              <div className="flex items-center bg-purple-50 px-2 py-1 rounded-md">
                <Brain className="w-3 h-3 text-purple-600 mr-1" />
                <span className="text-purple-700">Accuracy: {forecastMetrics.mape ? `${(100 - forecastMetrics.mape).toFixed(1)}%` : 'N/A'}</span>
              </div>
              <div className="flex items-center bg-gray-50 px-2 py-1 rounded-md">
                <TrendingUp className="w-3 h-3 text-gray-600 mr-1" />
                <span className="text-gray-600">Method: {forecastMetrics.model_type || 'Auto-ARIMA'}</span>
              </div>
            </div>
          )}
          
          {!usingAI && data.length > 0 && (
            <div className="flex items-center text-xs text-gray-400">
              <AlertCircle className="w-3 h-3 mr-1" />
              <span>Simple moving average forecast (install prophet or ARIMA for better accuracy)</span>
            </div>
          )}
        </div>
        
        {/* Key metrics summary */}
        {data.filter(d => d.actual !== null).length > 0 && (
          <div className="mt-3 grid grid-cols-3 gap-3 text-xs">
            {(() => {
              const actualData = data.filter(d => d.actual !== null);
              const lastValue = actualData[actualData.length - 1]?.actual || 0;
              const firstValue = actualData[0]?.actual || 0;
              const percentChange = firstValue !== 0 ? ((lastValue - firstValue) / Math.abs(firstValue) * 100).toFixed(1) : 0;
              
              return (
                <>
                  <div className="bg-gray-50 rounded-md p-2 text-center">
                    <p className="text-gray-500">Latest {metric === 'cashflow' ? 'Cash Flow' : 'Expenses'}</p>
                    <p className="font-bold text-blue-600">${lastValue.toLocaleString()}</p>
                  </div>
                  <div className="bg-gray-50 rounded-md p-2 text-center">
                    <p className="text-gray-500">Period Change</p>
                    <p className={`font-bold ${parseFloat(percentChange) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {parseFloat(percentChange) >= 0 ? '+' : ''}{percentChange}%
                    </p>
                  </div>
                  <div className="bg-gray-50 rounded-md p-2 text-center">
                    <p className="text-gray-500">Next Forecast</p>
                    <p className="font-bold text-green-600">
                      ${data.filter(d => d.forecast)[0]?.forecast?.toLocaleString() || 'N/A'}
                    </p>
                  </div>
                </>
              );
            })()}
          </div>
        )}
      </div>
    </div>
  );
};

export default TrendChart;