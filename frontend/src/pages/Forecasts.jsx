// frontend/src/pages/Forecasts.jsx
import React, { useState } from 'react';
import TrendChart from '../components/dashboard/TrendChart';
import { LineChart, Calendar, TrendingUp, Info } from 'lucide-react';

const Forecasts = () => {
  const [period, setPeriod] = useState('6m');

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto py-8 px-4">
        <h1 className="text-2xl font-bold mb-2">AI Forecasts & Predictions</h1>
        <p className="text-gray-600 mb-8">Powered by ARIMA and LSTM neural networks</p>

        {/* Period Selector */}
        <div className="flex space-x-2 mb-6">
          {['3m', '6m', '1y'].map(p => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-4 py-2 rounded-lg transition ${
                period === p ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              {p === '3m' ? '3 Months' : p === '6m' ? '6 Months' : '1 Year'}
            </button>
          ))}
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 gap-6 mb-8">
          <TrendChart metric="cashflow" period={period} fullHeight />
          <TrendChart metric="expenses" period={period} fullHeight />
        </div>

        {/* AI Insights */}
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-6">
          <h3 className="font-semibold mb-3 flex items-center">
            <TrendingUp className="w-5 h-5 mr-2 text-green-600" />
            AI-Generated Insights
          </h3>
          <ul className="space-y-2 text-sm">
            <li className="flex items-start">
              <span className="w-2 h-2 bg-green-500 rounded-full mt-1.5 mr-2"></span>
              Your cash flow is projected to increase by 12% over the next quarter
            </li>
            <li className="flex items-start">
              <span className="w-2 h-2 bg-yellow-500 rounded-full mt-1.5 mr-2"></span>
              Dining expenses show a seasonal pattern - consider budgeting more during holidays
            </li>
            <li className="flex items-start">
              <span className="w-2 h-2 bg-blue-500 rounded-full mt-1.5 mr-2"></span>
              Model confidence: 94% for 30-day forecast, 87% for 90-day forecast
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Forecasts;