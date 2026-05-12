// frontend/src/components/dashboard/RiskHeatmap.jsx
import React, { useState, useEffect } from 'react';
import { Loader, AlertTriangle } from 'lucide-react';

const RiskHeatmap = () => {
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState([]);

  // 🔴 HARDCODED MOCK DATA - Replace with API call
  const mockRiskData = [
    { name: 'Groceries', risk: 25, amount: 450, color: 'bg-green-500', status: 'low' },
    { name: 'Dining', risk: 65, amount: 780, color: 'bg-yellow-500', status: 'medium' },
    { name: 'Transport', risk: 35, amount: 320, color: 'bg-green-500', status: 'low' },
    { name: 'Shopping', risk: 85, amount: 1250, color: 'bg-red-500', status: 'high' },
    { name: 'Entertainment', risk: 45, amount: 280, color: 'bg-yellow-500', status: 'medium' },
    { name: 'Utilities', risk: 15, amount: 350, color: 'bg-green-500', status: 'low' },
    { name: 'Health', risk: 55, amount: 180, color: 'bg-yellow-500', status: 'medium' },
    { name: 'Rent', risk: 10, amount: 1500, color: 'bg-green-500', status: 'low' },
    { name: 'Income', risk: 5, amount: 5000, color: 'bg-green-500', status: 'low' },
  ];

  useEffect(() => {
    // 🔴 HARDCODED - Replace with API call
    setTimeout(() => {
      setCategories(mockRiskData);
      setLoading(false);
    }, 500);

    // ✅ TO DO: Uncomment when API is ready
    // const fetchRiskData = async () => {
    //   try {
    //     const response = await api.get('/dss/risk/heatmap');
    //     setCategories(response.data);
    //   } catch (error) {
    //     console.error('Failed to fetch risk data:', error);
    //   } finally {
    //     setLoading(false);
    //   }
    // };
    // fetchRiskData();
  }, []);

  const getRiskColor = (risk) => {
    if (risk < 30) return 'bg-green-500';
    if (risk < 60) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getRiskTextColor = (risk) => {
    if (risk < 30) return 'text-green-700';
    if (risk < 60) return 'text-yellow-700';
    return 'text-red-700';
  };

  const getRiskLabel = (risk) => {
    if (risk < 30) return 'Low Risk';
    if (risk < 60) return 'Medium Risk';
    return 'High Risk';
  };

  const getSeverityIcon = (risk) => {
    if (risk >= 60) return <AlertTriangle className="w-4 h-4 text-red-500" />;
    return null;
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex justify-center items-center h-64">
          <Loader className="w-8 h-8 animate-spin text-blue-500" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-semibold">Risk Heatmap by Category</h3>
        <div className="flex space-x-3 text-xs">
          <div className="flex items-center">
            <div className="w-3 h-3 bg-green-500 rounded-full mr-1"></div>
            <span>Low Risk (&lt;30%)</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-yellow-500 rounded-full mr-1"></div>
            <span>Medium Risk (30-60%)</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-red-500 rounded-full mr-1"></div>
            <span>High Risk (&gt;60%)</span>
          </div>
        </div>
      </div>

      {/* Grid Heatmap */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {categories.map((cat) => (
          <div
            key={cat.name}
            className="border rounded-lg overflow-hidden hover:shadow-md transition-shadow"
          >
            <div className={`h-2 ${getRiskColor(cat.risk)}`}></div>
            <div className="p-4">
              <div className="flex justify-between items-start mb-2">
                <h4 className="font-medium text-gray-800">{cat.name}</h4>
                {getSeverityIcon(cat.risk)}
              </div>
              <div className="mt-2">
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-500">Risk Score</span>
                  <span className={`font-medium ${getRiskTextColor(cat.risk)}`}>
                    {cat.risk}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`${getRiskColor(cat.risk)} h-2 rounded-full transition-all duration-500`}
                    style={{ width: `${cat.risk}%` }}
                  ></div>
                </div>
              </div>
              <div className="mt-3 pt-2 border-t text-xs text-gray-500">
                <div className="flex justify-between">
                  <span>Amount:</span>
                  <span className="font-medium">${cat.amount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between mt-1">
                  <span>Status:</span>
                  <span className={`font-medium ${getRiskTextColor(cat.risk)}`}>
                    {getRiskLabel(cat.risk)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Summary Stats */}
      <div className="mt-6 pt-4 border-t">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div className="p-3 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">
              {categories.filter(c => c.risk < 30).length}
            </div>
            <div className="text-xs text-gray-500">Low Risk Categories</div>
          </div>
          <div className="p-3 bg-yellow-50 rounded-lg">
            <div className="text-2xl font-bold text-yellow-600">
              {categories.filter(c => c.risk >= 30 && c.risk < 60).length}
            </div>
            <div className="text-xs text-gray-500">Medium Risk Categories</div>
          </div>
          <div className="p-3 bg-red-50 rounded-lg">
            <div className="text-2xl font-bold text-red-600">
              {categories.filter(c => c.risk >= 60).length}
            </div>
            <div className="text-xs text-gray-500">High Risk Categories</div>
          </div>
        </div>
      </div>

      {/* Risk Legend Explanation */}
      <div className="mt-4 p-3 bg-gray-50 rounded-lg text-xs text-gray-500">
        <p className="font-medium mb-1">About Risk Scoring:</p>
        <ul className="list-disc list-inside space-y-1">
          <li>Risk is calculated based on spending volatility compared to average</li>
          <li>High risk categories may need budget review or monitoring</li>
          <li>Regular review of medium/high risk categories helps optimize spending</li>
        </ul>
      </div>
    </div>
  );
};

export default RiskHeatmap;