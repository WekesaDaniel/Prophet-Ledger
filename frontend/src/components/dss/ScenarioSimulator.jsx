// frontend/src/components/dss/ScenarioSimulator.jsx
import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, TrendingDown, Calculator, AlertTriangle, 
  Users, DollarSign, Loader, Info, CheckCircle
} from 'lucide-react';
import api from '../../services/api';
import { supabase } from '../../services/supabaseClient';
import toast from 'react-hot-toast';

const ScenarioSimulator = () => {
  const [scenarioType, setScenarioType] = useState('revenue_increase');
  const [parameters, setParameters] = useState({
    percentage: 10,
    timeframe: 12,
    investment_needed: 0,
    category: 'operations',
    reduction_percentage: 10,
    amount: 10000,
    expected_return: 15,
    debt_amount: 5000,
    interest_rate: 18,
    salary: 60000
  });
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error || !user) {
        console.log('User not authenticated');
        setIsAuthenticated(false);
        setUserId(null);
        return;
      }
      setIsAuthenticated(true);
      setUserId(user.id);
    } catch (error) {
      console.error('Auth check error:', error);
      setIsAuthenticated(false);
    }
  };

  const scenarios = [
    { id: 'revenue_increase', name: 'Revenue Increase', icon: TrendingUp, color: 'green', description: 'Increase sales or pricing' },
    { id: 'cost_reduction', name: 'Cost Reduction', icon: TrendingDown, color: 'orange', description: 'Cut operational expenses' },
    { id: 'new_investment', name: 'New Investment', icon: Calculator, color: 'blue', description: 'Capital expenditure' },
    { id: 'debt_payoff', name: 'Debt Payoff', icon: AlertTriangle, color: 'red', description: 'Reduce liabilities' },
    { id: 'hire_employee', name: 'Hire Employee', icon: Users, color: 'purple', description: 'Add team members' }
  ];

  const handleSimulate = async () => {
    if (!isAuthenticated || !userId) {
      toast.error('Please log in to run simulations');
      return;
    }
    
    setLoading(true);
    try {
      const token = (await supabase.auth.getSession()).data.session?.access_token;
      
      const response = await api.post('/dss/what-if/evaluate', {
        user_id: userId,
        scenario: { type: scenarioType, parameters }
      }, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      setResults(response.data);
      toast.success('Simulation completed!');
    } catch (error) {
      console.error('Simulation failed:', error);
      // Fallback local calculation
      const fallbackResults = getFallbackResults();
      setResults(fallbackResults);
      toast.error('Using estimated calculations');
    } finally {
      setLoading(false);
    }
  };

  const getFallbackResults = () => {
    const baseIncome = 50000;
    const baseExpense = 32000;
    
    switch (scenarioType) {
      case 'revenue_increase':
        return {
          scenario: `Increase revenue by ${parameters.percentage}%`,
          impact: {
            additional_revenue: baseIncome * (parameters.percentage / 100) * parameters.timeframe,
            additional_profit: baseIncome * (parameters.percentage / 100) * parameters.timeframe * 0.7,
            new_monthly_profit: (baseIncome - baseExpense) + (baseIncome * (parameters.percentage / 100)),
            roi_percentage: 45,
            payback_months: parameters.investment_needed > 0 ? (parameters.investment_needed / (baseIncome * (parameters.percentage / 100))) * 12 : 6
          },
          recommendation: 'Revenue increase scenarios typically yield positive ROI within 6-12 months.',
          risks: ['Market competition may limit growth', 'Increased customer acquisition costs']
        };
      case 'cost_reduction':
        return {
          scenario: `Reduce ${parameters.category} costs by ${parameters.reduction_percentage}%`,
          impact: {
            monthly_savings: baseExpense * (parameters.reduction_percentage / 100),
            annual_savings: baseExpense * (parameters.reduction_percentage / 100) * 12,
            profit_improvement: parameters.reduction_percentage,
            new_net_margin: ((baseIncome - (baseExpense * (1 - parameters.reduction_percentage / 100))) / baseIncome) * 100
          },
          recommendation: 'Cost reduction can significantly improve profitability without increasing revenue.',
          risks: ['Potential quality impact', 'Employee morale concerns']
        };
      case 'new_investment':
        return {
          scenario: `New investment of $${parameters.amount}`,
          impact: {
            annual_return: parameters.amount * (parameters.expected_return / 100),
            roi_percentage: parameters.expected_return,
            payback_years: parameters.amount / (parameters.amount * (parameters.expected_return / 100))
          },
          recommendation: 'Evaluate risk vs reward before proceeding with investment.',
          risks: ['Market volatility', 'Liquidity concerns']
        };
      case 'debt_payoff':
        return {
          scenario: `Pay off $${parameters.debt_amount} debt at ${parameters.interest_rate}% interest`,
          impact: {
            interest_saved: parameters.debt_amount * (parameters.interest_rate / 100),
            monthly_cashflow_improvement: (parameters.debt_amount * (parameters.interest_rate / 100)) / 12
          },
          recommendation: 'Paying off high-interest debt is financially beneficial.',
          risks: ['Reduced liquidity']
        };
      case 'hire_employee':
        return {
          scenario: `Hire new employee at $${parameters.salary}/year`,
          impact: {
            total_cost: parameters.salary * 1.3,
            expected_revenue: parameters.salary * 1.5,
            net_impact: (parameters.salary * 1.5) - (parameters.salary * 1.3)
          },
          recommendation: 'Calculate expected revenue contribution before hiring.',
          risks: ['Training period', 'Cultural fit']
        };
      default:
        return {
          scenario: "Scenario Analysis",
          impact: { additional_profit: 0, roi_percentage: 0 },
          recommendation: "Adjust parameters for detailed analysis.",
          risks: ["Market conditions may change"]
        };
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
                className="w-full h-2 bg-gray-200 rounded-lg"
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
                className="w-full h-2 bg-gray-200 rounded-lg"
              />
            </div>
          </div>
        );
      
      case 'new_investment':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Investment Amount ($)</label>
              <input
                type="number"
                className="w-full p-2 border rounded-lg"
                value={parameters.amount}
                onChange={(e) => setParameters({...parameters, amount: parseFloat(e.target.value) || 0})}
                placeholder="10000"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Expected Annual Return (%): {parameters.expected_return}%</label>
              <input
                type="range"
                min={0}
                max={50}
                step={5}
                value={parameters.expected_return}
                onChange={(e) => setParameters({...parameters, expected_return: parseInt(e.target.value)})}
                className="w-full h-2 bg-gray-200 rounded-lg"
              />
            </div>
          </div>
        );
      
      case 'debt_payoff':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Debt Amount ($)</label>
              <input
                type="number"
                className="w-full p-2 border rounded-lg"
                value={parameters.debt_amount}
                onChange={(e) => setParameters({...parameters, debt_amount: parseFloat(e.target.value) || 0})}
                placeholder="5000"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Interest Rate (%): {parameters.interest_rate}%</label>
              <input
                type="range"
                min={0}
                max={30}
                step={1}
                value={parameters.interest_rate}
                onChange={(e) => setParameters({...parameters, interest_rate: parseInt(e.target.value)})}
                className="w-full h-2 bg-gray-200 rounded-lg"
              />
            </div>
          </div>
        );
      
      case 'hire_employee':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Annual Salary ($)</label>
              <input
                type="number"
                className="w-full p-2 border rounded-lg"
                value={parameters.salary}
                onChange={(e) => setParameters({...parameters, salary: parseFloat(e.target.value) || 0})}
                placeholder="60000"
              />
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
                className="w-full h-2 bg-gray-200 rounded-lg"
              />
            </div>
          </div>
        );
      
      default:
        return <div className="text-gray-500 text-center py-8">Configure parameters for this scenario type</div>;
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-8 text-center">
        <AlertTriangle className="w-12 h-12 mx-auto text-yellow-500 mb-4" />
        <h3 className="text-lg font-semibold mb-2">Login Required</h3>
        <p className="text-gray-500 mb-4">Please log in to use the What-If Scenario Simulator</p>
        <button 
          onClick={() => window.location.href = '/login'}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          Go to Login
        </button>
      </div>
    );
  }

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
            {results.impact.additional_profit !== undefined && (
              <div className="bg-green-50 rounded-xl p-4 border border-green-200">
                <p className="text-sm text-green-700 mb-1">Additional Profit</p>
                <p className="text-2xl font-bold text-green-700">
                  ${results.impact.additional_profit?.toLocaleString() || '0'}
                </p>
                <p className="text-xs text-green-600 mt-1">over {parameters.timeframe} months</p>
              </div>
            )}
            
            {results.impact.annual_savings !== undefined && (
              <div className="bg-green-50 rounded-xl p-4 border border-green-200">
                <p className="text-sm text-green-700 mb-1">Annual Savings</p>
                <p className="text-2xl font-bold text-green-700">
                  ${results.impact.annual_savings?.toLocaleString() || '0'}
                </p>
              </div>
            )}
            
            {results.impact.monthly_savings !== undefined && (
              <div className="bg-green-50 rounded-xl p-4 border border-green-200">
                <p className="text-sm text-green-700 mb-1">Monthly Savings</p>
                <p className="text-2xl font-bold text-green-700">
                  ${results.impact.monthly_savings?.toLocaleString() || '0'}
                </p>
              </div>
            )}
            
            {results.impact.roi_percentage !== undefined && (
              <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
                <p className="text-sm text-blue-700 mb-1">Return on Investment (ROI)</p>
                <p className="text-2xl font-bold text-blue-700">
                  {results.impact.roi_percentage || 0}%
                </p>
                {results.impact.payback_months && (
                  <p className="text-xs text-blue-600 mt-1">Payback: {results.impact.payback_months} months</p>
                )}
              </div>
            )}
            
            {results.impact.annual_return !== undefined && (
              <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
                <p className="text-sm text-blue-700 mb-1">Annual Return</p>
                <p className="text-2xl font-bold text-blue-700">
                  ${results.impact.annual_return?.toLocaleString() || '0'}
                </p>
              </div>
            )}
            
            {results.impact.interest_saved !== undefined && (
              <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
                <p className="text-sm text-blue-700 mb-1">Interest Saved</p>
                <p className="text-2xl font-bold text-blue-700">
                  ${results.impact.interest_saved?.toLocaleString() || '0'}
                </p>
              </div>
            )}
          </div>
          
          <div className="bg-gray-100 rounded-xl p-4 mb-4">
            <h4 className="font-semibold mb-2 flex items-center">
              <Info className="w-4 h-4 mr-1 text-blue-600" />
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