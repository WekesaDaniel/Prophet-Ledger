import React, { useState } from 'react';
import { TrendingUp, TrendingDown, Calculator, AlertTriangle, Users, DollarSign, Loader } from 'lucide-react';
import api from '../../services/api';

const ScenarioSimulator = ({ userId }) => {
  const [scenarioType, setScenarioType] = useState('revenue_increase');
  const [parameters, setParameters] = useState({
    percentage: 10,
    timeframe: 12,
    investment_needed: 0,
    category: 'operations',
    reduction_percentage: 10
  });
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);

  const scenarios = [
    { id: 'revenue_increase', name: 'Revenue Increase', icon: TrendingUp, color: 'green', description: 'Increase sales or pricing' },
    { id: 'cost_reduction', name: 'Cost Reduction', icon: TrendingDown, color: 'orange', description: 'Cut operational expenses' },
    { id: 'new_investment', name: 'New Investment', icon: Calculator, color: 'blue', description: 'Capital expenditure' },
    { id: 'debt_payoff', name: 'Debt Payoff', icon: AlertTriangle, color: 'red', description: 'Reduce liabilities' },
    { id: 'hire_employee', name: 'Hire Employee', icon: Users, color: 'purple', description: 'Add team members' }
  ];

  const handleSimulate = async () => {
    setLoading(true);
    try {
      const response = await api.post('/dss/what-if/evaluate', {
        user_id: userId,
        scenario: { type: scenarioType, parameters }
      });
      setResults(response.data);
    } catch (error) {
      console.error('Simulation failed:', error);
      // Mock results for demo
      setResults({
        scenario: `Increase revenue by ${parameters.percentage}%`,
        impact: {
          additional_revenue: 50000 * (parameters.percentage / 10),
          additional_profit: 35000 * (parameters.percentage / 10),
          new_monthly_profit: 15000 + (35000 * (parameters.percentage / 10) / 12),
          roi_percentage: 45,
          payback_months: 6.5
        },
        recommendation: 'This scenario is highly recommended. The ROI exceeds 40% with reasonable payback period.',
        risks: ['Market conditions may change', 'Competitor response could impact results']
      });
    } finally {
      setLoading(false);
    }
  };

  const renderParameters = () => {
    switch (scenarioType) {
      case 'revenue_increase':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Revenue Increase: <span className="font-bold text-green-600">{parameters.percentage}%</span>
              </label>
              <input
                type="range"
                min={0}
                max={50}
                step={5}
                value={parameters.percentage}
                onChange={(e) => setParameters({...parameters, percentage: parseInt(e.target.value)})}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>0%</span><span>10%</span><span>20%</span><span>30%</span><span>40%</span><span>50%</span>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Timeframe: {parameters.timeframe} months</label>
              <input
                type="range"
                min={1}
                max={24}
                step={1}
                value={parameters.timeframe}
                onChange={(e) => setParameters({...parameters, timeframe: parseInt(e.target.value)})}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Investment Needed: ${parameters.investment_needed.toLocaleString()}</label>
              <input
                type="number"
                className="w-full p-2 border rounded-lg"
                value={parameters.investment_needed}
                onChange={(e) => setParameters({...parameters, investment_needed: parseFloat(e.target.value) || 0})}
              />
            </div>
          </div>
        );
      
      case 'cost_reduction':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Category</label>
              <select 
                className="w-full p-2 border rounded-lg"
                value={parameters.category}
                onChange={(e) => setParameters({...parameters, category: e.target.value})}
              >
                <option value="operations">Operations</option>
                <option value="marketing">Marketing</option>
                <option value="r_and_d">R&D</option>
                <option value="admin">Administrative</option>
                <option value="software">Software & Subscriptions</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">
                Reduction: <span className="font-bold text-orange-600">{parameters.reduction_percentage}%</span>
              </label>
              <input
                type="range"
                min={0}
                max={30}
                step={5}
                value={parameters.reduction_percentage}
                onChange={(e) => setParameters({...parameters, reduction_percentage: parseInt(e.target.value)})}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
            </div>
          </div>
        );
      
      default:
        return <div className="text-gray-500 text-center py-8">Configure parameters for this scenario type</div>;
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg">
      <div className="p-6 border-b">
        <h2 className="text-xl font-bold flex items-center">
          <Calculator className="w-5 h-5 mr-2 text-blue-600" />
          What-If Scenario Simulator
        </h2>
        <p className="text-sm text-gray-500 mt-1">Model different business decisions and see their financial impact</p>
      </div>
      
      <div className="p-6">
        {/* Scenario selector */}
        <div className="grid grid-cols-5 gap-3 mb-6">
          {scenarios.map(scenario => (
            <button
              key={scenario.id}
              onClick={() => setScenarioType(scenario.id)}
              className={`p-3 rounded-xl text-center transition-all ${
                scenarioType === scenario.id 
                  ? `bg-${scenario.color}-600 text-white shadow-lg scale-105` 
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
              }`}
            >
              <scenario.icon className={`w-5 h-5 mx-auto mb-1 ${scenarioType === scenario.id ? 'text-white' : `text-${scenario.color}-600`}`} />
              <span className="text-xs font-medium">{scenario.name}</span>
            </button>
          ))}
        </div>
        
        {/* Parameters panel */}
        <div className="bg-gray-50 rounded-xl p-5 mb-6">
          <h3 className="font-semibold mb-4 flex items-center">
            <DollarSign className="w-4 h-4 mr-1 text-gray-500" />
            Scenario Parameters
          </h3>
          {renderParameters()}
        </div>
        
        {/* Simulate button */}
        <button 
          onClick={handleSimulate} 
          disabled={loading}
          className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold py-3 rounded-xl transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <span className="flex items-center justify-center">
              <Loader className="w-5 h-5 animate-spin mr-2" />
              Calculating...
            </span>
          ) : (
            'Run Simulation'
          )}
        </button>
      </div>
      
      {/* Results display */}
      {results && results.impact && (
        <div className="border-t bg-gradient-to-b from-gray-50 to-white p-6 rounded-b-lg">
          <h3 className="font-bold text-lg mb-4">📊 Projected Impact</h3>
          
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-green-50 rounded-xl p-4 border border-green-200">
              <p className="text-sm text-green-700 mb-1">Additional Profit</p>
              <p className="text-2xl font-bold text-green-700">
                ${results.impact.additional_profit?.toLocaleString() || '0'}
              </p>
              <p className="text-xs text-green-600 mt-1">over {parameters.timeframe} months</p>
            </div>
            
            <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
              <p className="text-sm text-blue-700 mb-1">Return on Investment (ROI)</p>
              <p className="text-2xl font-bold text-blue-700">
                {results.impact.roi_percentage || 0}%
              </p>
              {results.impact.payback_months && (
                <p className="text-xs text-blue-600 mt-1">Payback: {results.impact.payback_months} months</p>
              )}
            </div>
          </div>
          
          <div className="bg-gray-100 rounded-xl p-4 mb-4">
            <h4 className="font-semibold mb-2 flex items-center">
              <TrendingUp className="w-4 h-4 mr-1 text-green-600" />
              Recommendation
            </h4>
            <p className="text-gray-700 text-sm">{results.recommendation}</p>
          </div>
          
          {results.risks && results.risks.length > 0 && (
            <div className="border-l-4 border-yellow-400 bg-yellow-50 rounded-r-xl p-4">
              <p className="font-semibold text-yellow-800 flex items-center mb-2">
                <AlertTriangle className="w-4 h-4 mr-1" />
                Risks to Consider
              </p>
              <ul className="list-disc list-inside text-sm text-yellow-700 space-y-1">
                {results.risks.map((risk, idx) => (
                  <li key={idx}>{risk}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ScenarioSimulator;
