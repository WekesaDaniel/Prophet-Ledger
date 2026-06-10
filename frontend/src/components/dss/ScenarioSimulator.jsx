// frontend/src/components/dss/ScenarioSimulator.jsx
import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, TrendingDown, Calculator, AlertTriangle, 
  Users, DollarSign, Loader, Info, CheckCircle, 
  Target, Clock, BarChart3, PieChart, Wallet,
  CreditCard, Briefcase, ShoppingBag, Home, Car,
  Smartphone, Coffee, Gift, Zap, Shield, ArrowRight
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
    salary: 60000,
    monthly_savings_goal: 500,
    target_category: 'dining'
  });
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userId, setUserId] = useState(null);
  const [userData, setUserData] = useState({
    totalIncome: 0,
    totalExpenses: 0,
    monthlyIncome: 0,
    monthlyExpenses: 0,
    topExpenseCategories: [],
    savingsRate: 0,
    recentTransactions: [],
    activeLimits: []
  });
  const [selectedSimulation, setSelectedSimulation] = useState(null);

  const scenarios = [
    { 
      id: 'revenue_increase', 
      name: 'Increase Income', 
      icon: TrendingUp, 
      color: 'green', 
      description: 'Boost your earnings through side hustles, raises, or additional income streams',
      importance: 'Growing your income accelerates wealth building and provides more financial flexibility',
      longDescription: 'This simulation shows how increasing your income impacts your financial health. It calculates the additional savings, accelerated debt payoff, and investment potential from higher earnings.'
    },
    { 
      id: 'cost_reduction', 
      name: 'Reduce Expenses', 
      icon: TrendingDown, 
      color: 'orange', 
      description: 'Cut unnecessary spending and optimize your budget categories',
      importance: 'Every dollar saved is a dollar earned tax-free, improving your savings rate and financial resilience',
      longDescription: 'Analyzes the impact of reducing spending in specific categories. Shows how small cuts in daily expenses can lead to significant annual savings.'
    },
    { 
      id: 'savings_goal', 
      name: 'Savings Goal', 
      icon: Target, 
      color: 'blue', 
      description: 'Plan for major purchases or build emergency fund',
      importance: 'Goal-based saving keeps you motivated and helps achieve financial milestones faster',
      longDescription: 'Calculate how much to save monthly to reach your financial goals, whether it\'s a down payment, vacation, or emergency fund.'
    },
    { 
      id: 'debt_payoff', 
      name: 'Debt Payoff', 
      icon: CreditCard, 
      color: 'red', 
      description: 'Eliminate credit card or loan debt faster',
      importance: 'Reducing high-interest debt saves money and improves your credit score',
      longDescription: 'Shows the interest savings and time reduction from making extra debt payments. Use your actual transaction data to identify debt payments.'
    },
    { 
      id: 'investment', 
      name: 'Investment', 
      icon: Briefcase, 
      color: 'purple', 
      description: 'Grow wealth through strategic investing',
      importance: 'Compound interest is the eighth wonder of the world - start early to maximize returns',
      longDescription: 'Projects investment growth based on your current savings rate. Shows the power of compound interest over time.'
    },
    { 
      id: 'category_optimization', 
      name: 'Category Optimization', 
      icon: PieChart, 
      color: 'indigo', 
      description: 'Optimize spending by category',
      importance: 'Understanding where your money goes helps make informed spending decisions',
      longDescription: 'Analyzes your top spending categories and shows how reducing spending in specific areas impacts your overall budget.'
    }
  ];

  useEffect(() => {
    checkAuthAndLoadData();
  }, []);

  const checkAuthAndLoadData = async () => {
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
      await loadUserFinancialData(user.id);
    } catch (error) {
      console.error('Auth check error:', error);
      setIsAuthenticated(false);
    }
  };

  const loadUserFinancialData = async (userId) => {
    try {
      // Get last 6 months of transactions
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
      
      const { data: transactions, error: txError } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', userId)
        .gte('date', sixMonthsAgo.toISOString().split('T')[0])
        .order('date', { ascending: false });

      if (txError) throw txError;

      // Calculate financial metrics
      const incomes = transactions?.filter(t => t.type === 'income') || [];
      const expenses = transactions?.filter(t => t.type === 'expense') || [];
      
      const totalIncome = incomes.reduce((sum, t) => sum + t.amount, 0);
      const totalExpenses = expenses.reduce((sum, t) => sum + t.amount, 0);
      
      // Monthly averages
      const monthlyIncome = totalIncome / 6;
      const monthlyExpenses = totalExpenses / 6;
      const savingsRate = totalIncome > 0 ? ((totalIncome - totalExpenses) / totalIncome) * 100 : 0;
      
      // Top expense categories
      const categorySpending = {};
      expenses.forEach(exp => {
        const cat = exp.category || 'Other';
        categorySpending[cat] = (categorySpending[cat] || 0) + exp.amount;
      });
      
      const topExpenseCategories = Object.entries(categorySpending)
        .map(([category, amount]) => ({ category, amount, percentage: (amount / totalExpenses) * 100 }))
        .sort((a, b) => b.amount - a.amount)
        .slice(0, 5);
      
      // Get active spending limits
      const { data: limits } = await supabase
        .from('user_limits')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true);
      
      setUserData({
        totalIncome,
        totalExpenses,
        monthlyIncome,
        monthlyExpenses,
        topExpenseCategories,
        savingsRate,
        recentTransactions: transactions?.slice(0, 10) || [],
        activeLimits: limits || []
      });
      
    } catch (error) {
      console.error('Failed to load user data:', error);
      toast.error('Could not load your financial data for simulations');
    }
  };

  const handleSimulate = async () => {
    if (!isAuthenticated || !userId) {
      toast.error('Please log in to run simulations');
      return;
    }
    
    setLoading(true);
    try {
      // Calculate based on actual user data
      const simulationResults = calculateRealisticScenario();
      setResults(simulationResults);
      setSelectedSimulation(scenarioType);
      toast.success(`Simulation completed using your actual data!`);
    } catch (error) {
      console.error('Simulation failed:', error);
      toast.error('Unable to complete simulation');
    } finally {
      setLoading(false);
    }
  };

  const calculateRealisticScenario = () => {
    const { monthlyIncome, monthlyExpenses, savingsRate, topExpenseCategories } = userData;
    const currentMonthlySavings = monthlyIncome - monthlyExpenses;
    
    switch (scenarioType) {
      case 'revenue_increase':
        const additionalMonthlyIncome = monthlyIncome * (parameters.percentage / 100);
        const newMonthlySavings = currentMonthlySavings + additionalMonthlyIncome;
        const annualAdditionalSavings = additionalMonthlyIncome * 12;
        const yearsToRetire = newMonthlySavings > 0 ? (monthlyExpenses * 12 * 25) / (newMonthlySavings * 12) : 0;
        
        return {
          scenario: `Increase income by ${parameters.percentage}%`,
          impact: {
            additional_monthly_income: additionalMonthlyIncome,
            additional_annual_income: additionalMonthlyIncome * 12,
            new_monthly_savings: newMonthlySavings,
            savings_rate_increase: ((newMonthlySavings / monthlyIncome) - (savingsRate / 100)) * 100,
            annual_investment_potential: additionalMonthlyIncome * 12 * 0.7,
            years_to_fire_reduction: yearsToRetire > 0 ? Math.max(1, yearsToRetire - 5) : 0
          },
          recommendation: `Increasing your monthly income by $${additionalMonthlyIncome.toFixed(0)} would boost your annual savings by $${(additionalMonthlyIncome * 12).toFixed(0)}. Consider a side hustle, freelance work, or asking for a raise.`,
          risks: ['May require additional time commitment', 'Potential burnout risk', 'Tax implications on additional income']
        };
      
      case 'cost_reduction':
        const targetCategory = parameters.category;
        const categorySpending = topExpenseCategories.find(c => c.category.toLowerCase() === targetCategory.toLowerCase());
        const currentCategorySpending = categorySpending?.amount / 6 || 500; // Monthly average
        const monthlySavings = currentCategorySpending * (parameters.reduction_percentage / 100);
        const newMonthlyExpenses = monthlyExpenses - monthlySavings;
        const newSavingsRate = ((monthlyIncome - newMonthlyExpenses) / monthlyIncome) * 100;
        
        return {
          scenario: `Reduce ${targetCategory} spending by ${parameters.reduction_percentage}%`,
          impact: {
            monthly_savings: monthlySavings,
            annual_savings: monthlySavings * 12,
            new_monthly_expenses: newMonthlyExpenses,
            savings_rate_improvement: newSavingsRate - savingsRate,
            five_year_savings: monthlySavings * 12 * 5,
            investment_growth_10yr: (monthlySavings * 12 * 10) * 1.07 // 7% annual return
          },
          recommendation: `Cutting ${targetCategory} spending by ${parameters.reduction_percentage}% saves $${monthlySavings.toFixed(0)}/month. Over 5 years, that's $${(monthlySavings * 12 * 5).toFixed(0)}! Try cooking at home, canceling unused subscriptions, or finding cheaper alternatives.`,
          risks: ['Lifestyle impact', 'Quality reduction risk', 'May not be sustainable long-term']
        };
      
      case 'savings_goal':
        const goalAmount = parameters.amount;
        const timeframeMonths = parameters.timeframe;
        const requiredMonthlySavings = goalAmount / timeframeMonths;
        const isAchievable = requiredMonthlySavings <= currentMonthlySavings;
        const monthsToGoal = isAchievable ? timeframeMonths : Math.ceil(goalAmount / currentMonthlySavings);
        
        return {
          scenario: `Save $${goalAmount.toLocaleString()} in ${timeframeMonths} months`,
          impact: {
            required_monthly_savings: requiredMonthlySavings,
            current_monthly_savings: currentMonthlySavings,
            is_achievable: isAchievable,
            months_needed: monthsToGoal,
            extra_savings_needed: Math.max(0, requiredMonthlySavings - currentMonthlySavings),
            recommended_cut_category: topExpenseCategories[0]?.category || 'expenses'
          },
          recommendation: isAchievable 
            ? `Great! You can achieve your goal by saving $${requiredMonthlySavings.toFixed(0)}/month. Set up automatic transfers to make it happen.`
            : `To reach your goal, you need an extra $${(requiredMonthlySavings - currentMonthlySavings).toFixed(0)}/month. Try reducing ${topExpenseCategories[0]?.category || 'discretionary'} spending.`,
          risks: ['Unexpected expenses may derail progress', 'Market volatility if investing', 'Inflation impact on purchasing power']
        };
      
      case 'debt_payoff':
        const debtAmount = parameters.debt_amount;
        const interestRate = parameters.interest_rate / 100;
        const monthlyPayment = debtAmount * 0.03; // Assume 3% minimum payment
        const currentMonthsToPayoff = Math.ceil(Math.log(monthlyPayment / (monthlyPayment - debtAmount * interestRate/12)) / Math.log(1 + interestRate/12));
        const extraPayment = parameters.extra_payment || 100;
        const newMonthlyPayment = monthlyPayment + extraPayment;
        const newMonthsToPayoff = Math.ceil(Math.log(newMonthlyPayment / (newMonthlyPayment - debtAmount * interestRate/12)) / Math.log(1 + interestRate/12));
        const interestSaved = (debtAmount * interestRate/12 * currentMonthsToPayoff) - (debtAmount * interestRate/12 * newMonthsToPayoff);
        
        return {
          scenario: `Pay off $${debtAmount.toLocaleString()} debt faster`,
          impact: {
            current_payoff_months: currentMonthsToPayoff,
            new_payoff_months: newMonthsToPayoff,
            time_saved_months: currentMonthsToPayoff - newMonthsToPayoff,
            interest_saved: interestSaved,
            extra_monthly_payment: extraPayment
          },
          recommendation: `Adding $${extraPayment}/month to your debt payment saves ${currentMonthsToPayoff - newMonthsToPayoff} months and $${interestSaved.toFixed(0)} in interest!`,
          risks: ['Reduced liquidity', 'Opportunity cost of not investing', 'May need emergency fund first']
        };
      
      case 'investment':
        const monthlyInvestment = parameters.monthly_investment || currentMonthlySavings * 0.5;
        const years = parameters.years || 10;
        const expectedReturn = parameters.expected_return / 100;
        const futureValue = monthlyInvestment * 12 * ((Math.pow(1 + expectedReturn, years) - 1) / expectedReturn);
        const totalContributions = monthlyInvestment * 12 * years;
        const totalEarnings = futureValue - totalContributions;
        
        return {
          scenario: `Invest $${monthlyInvestment.toFixed(0)}/month for ${years} years`,
          impact: {
            monthly_investment: monthlyInvestment,
            investment_years: years,
            future_value: futureValue,
            total_contributions: totalContributions,
            total_earnings: totalEarnings,
            roi_percentage: (totalEarnings / totalContributions) * 100
          },
          recommendation: `Investing $${monthlyInvestment.toFixed(0)}/month could grow to $${futureValue.toFixed(0)} in ${years} years. That's $${totalEarnings.toFixed(0)} in earnings! Start with low-cost index funds.`,
          risks: ['Market volatility', 'Potential loss of principal', 'Inflation risk', 'Sequence of returns risk']
        };
      
      case 'category_optimization':
        const categoryToOptimize = parameters.target_category;
        const categoryData = topExpenseCategories.find(c => c.category.toLowerCase() === categoryToOptimize.toLowerCase());
        const currentSpending = categoryData?.amount || 0;
        const optimizedSpending = currentSpending * 0.8; // 20% reduction
        const monthlyOptimizationSavings = currentSpending - optimizedSpending;
        const annualOptimizationSavings = monthlyOptimizationSavings * 12;
        
        return {
          scenario: `Optimize ${categoryToOptimize} spending`,
          impact: {
            current_monthly_spending: currentSpending,
            optimized_monthly_spending: optimizedSpending,
            monthly_savings: monthlyOptimizationSavings,
            annual_savings: annualOptimizationSavings,
            percentage_reduction: 20,
            five_year_impact: annualOptimizationSavings * 5
          },
          recommendation: `By reducing ${categoryToOptimize} spending by 20%, you could save $${monthlyOptimizationSavings.toFixed(0)}/month. Try setting a budget, using cash envelopes, or finding cheaper alternatives.`,
          risks: ['May feel restrictive', 'Requires lifestyle changes', 'Social pressure to spend']
        };
      
      default:
        return {
          scenario: "Financial Analysis",
          impact: {},
          recommendation: "Select a scenario to see personalized insights",
          risks: []
        };
    }
  };

  const renderParameters = () => {
    const { topExpenseCategories } = userData;
    
    switch (scenarioType) {
      case 'revenue_increase':
        return (
          <div className="space-y-4">
            <div className="bg-blue-50 p-3 rounded-lg mb-3">
              <p className="text-sm text-blue-800">
                Current monthly income: <strong>${userData.monthlyIncome.toLocaleString()}</strong>
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">
                Income Increase: <span className="font-bold text-green-600">{parameters.percentage}%</span>
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
            <div className="bg-green-50 p-3 rounded-lg">
              <p className="text-sm text-green-800">
                Additional monthly income: <strong>${(userData.monthlyIncome * parameters.percentage / 100).toLocaleString()}</strong>
              </p>
            </div>
          </div>
        );
      
      case 'cost_reduction':
        return (
          <div className="space-y-4">
            <div className="bg-blue-50 p-3 rounded-lg mb-3">
              <p className="text-sm text-blue-800">
                Current monthly expenses: <strong>${userData.monthlyExpenses.toLocaleString()}</strong>
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Category to Reduce</label>
              <select 
                className="w-full p-2 border rounded-lg"
                value={parameters.category}
                onChange={(e) => setParameters({...parameters, category: e.target.value})}
              >
                {topExpenseCategories.map(cat => (
                  <option key={cat.category} value={cat.category.toLowerCase()}>
                    {cat.category} (${cat.amount.toFixed(0)}/month - {cat.percentage.toFixed(1)}%)
                  </option>
                ))}
                <option value="other">Other Expenses</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">
                Reduction: <span className="font-bold text-orange-600">{parameters.reduction_percentage}%</span>
              </label>
              <input
                type="range"
                min={0}
                max={50}
                step={5}
                value={parameters.reduction_percentage}
                onChange={(e) => setParameters({...parameters, reduction_percentage: parseInt(e.target.value)})}
                className="w-full h-2 bg-gray-200 rounded-lg"
              />
            </div>
          </div>
        );
      
      case 'savings_goal':
        return (
          <div className="space-y-4">
            <div className="bg-blue-50 p-3 rounded-lg mb-3">
              <p className="text-sm text-blue-800">
                Current monthly savings: <strong>${(userData.monthlyIncome - userData.monthlyExpenses).toLocaleString()}</strong>
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Goal Amount ($)</label>
              <input
                type="number"
                className="w-full p-2 border rounded-lg"
                value={parameters.amount}
                onChange={(e) => setParameters({...parameters, amount: parseFloat(e.target.value) || 0})}
                placeholder="e.g., 10000"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Timeframe: {parameters.timeframe} months</label>
              <input
                type="range"
                min={1}
                max={60}
                step={1}
                value={parameters.timeframe}
                onChange={(e) => setParameters({...parameters, timeframe: parseInt(e.target.value)})}
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
                placeholder="e.g., 5000"
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
            <div>
              <label className="block text-sm font-medium mb-2">Extra Monthly Payment ($)</label>
              <input
                type="number"
                className="w-full p-2 border rounded-lg"
                value={parameters.extra_payment || 100}
                onChange={(e) => setParameters({...parameters, extra_payment: parseFloat(e.target.value) || 0})}
                placeholder="Extra amount per month"
              />
            </div>
          </div>
        );
      
      case 'investment':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Monthly Investment ($)</label>
              <input
                type="number"
                className="w-full p-2 border rounded-lg"
                value={parameters.monthly_investment || Math.round((userData.monthlyIncome - userData.monthlyExpenses) * 0.5)}
                onChange={(e) => setParameters({...parameters, monthly_investment: parseFloat(e.target.value) || 0})}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Investment Period: {parameters.years || 10} years</label>
              <input
                type="range"
                min={1}
                max={30}
                step={1}
                value={parameters.years || 10}
                onChange={(e) => setParameters({...parameters, years: parseInt(e.target.value)})}
                className="w-full h-2 bg-gray-200 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Expected Annual Return: {parameters.expected_return}%</label>
              <input
                type="range"
                min={0}
                max={15}
                step={1}
                value={parameters.expected_return}
                onChange={(e) => setParameters({...parameters, expected_return: parseInt(e.target.value)})}
                className="w-full h-2 bg-gray-200 rounded-lg"
              />
            </div>
          </div>
        );
      
      case 'category_optimization':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Category to Optimize</label>
              <select 
                className="w-full p-2 border rounded-lg"
                value={parameters.target_category}
                onChange={(e) => setParameters({...parameters, target_category: e.target.value})}
              >
                {topExpenseCategories.map(cat => (
                  <option key={cat.category} value={cat.category.toLowerCase()}>
                    {cat.category} (${cat.amount.toFixed(0)}/month)
                  </option>
                ))}
              </select>
            </div>
            <div className="bg-gradient-to-r from-purple-50 to-indigo-50 p-4 rounded-lg">
              <p className="text-sm font-medium text-purple-800 mb-2">💡 Optimization Tips:</p>
              <ul className="text-xs text-purple-700 space-y-1">
                <li>• Set a strict monthly budget for this category</li>
                <li>• Use cash envelopes or prepaid cards</li>
                <li>• Find free or lower-cost alternatives</li>
                <li>• Review and cancel unused subscriptions</li>
                <li>• Use price tracking tools for major purchases</li>
              </ul>
            </div>
          </div>
        );
      
      default:
        return <div className="text-gray-500 text-center py-8">Configure parameters for this scenario</div>;
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

  const selectedScenario = scenarios.find(s => s.id === scenarioType);

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden">
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-4">
        <div className="flex items-center gap-3">
          <Calculator className="w-6 h-6 text-white" />
          <div>
            <h2 className="text-xl font-bold text-white">What-If Scenario Simulator</h2>
            <p className="text-sm text-blue-100">See how different decisions impact your finances using your actual data</p>
          </div>
        </div>
      </div>
      
      <div className="p-6">
        {/* Scenario Description Card */}
        {selectedScenario && (
          <div className="mb-6 p-4 bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl border border-blue-100">
            <div className="flex items-start gap-3">
              <div className={`p-2 bg-${selectedScenario.color}-100 rounded-lg`}>
                <selectedScenario.icon className={`w-5 h-5 text-${selectedScenario.color}-600`} />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900">{selectedScenario.name}</h3>
                <p className="text-sm text-gray-600 mt-1">{selectedScenario.longDescription}</p>
                <div className="mt-2 flex items-start gap-2">
                  <Shield className="w-4 h-4 text-blue-500 mt-0.5" />
                  <p className="text-xs text-blue-700">{selectedScenario.importance}</p>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Scenario selector - 3x2 grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
          {scenarios.map(scenario => (
            <button
              key={scenario.id}
              onClick={() => setScenarioType(scenario.id)}
              className={`p-3 rounded-xl text-center transition-all duration-200 group ${
                scenarioType === scenario.id 
                  ? `bg-${scenario.color}-600 text-white shadow-lg scale-105` 
                  : 'bg-gray-50 hover:bg-gray-100 text-gray-700 border border-gray-200'
              }`}
            >
              <scenario.icon className={`w-5 h-5 mx-auto mb-1 transition-colors ${
                scenarioType === scenario.id ? 'text-white' : `text-${scenario.color}-600 group-hover:scale-110`
              }`} />
              <span className="text-xs font-medium">{scenario.name}</span>
            </button>
          ))}
        </div>
        
        {/* Parameters panel */}
        <div className="bg-gray-50 rounded-xl p-5 mb-6">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-gray-500" />
            Scenario Parameters
            <span className="text-xs text-gray-400 ml-2">Based on your actual spending data</span>
          </h3>
          {renderParameters()}
        </div>
        
        {/* Simulate button */}
        <button 
          onClick={handleSimulate} 
          disabled={loading}
          className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold py-3 rounded-xl transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <Loader className="w-5 h-5 animate-spin" />
              Analyzing Your Data...
            </>
          ) : (
            <>
              <Zap className="w-5 h-5" />
              Run Simulation with My Data
            </>
          )}
        </button>
      </div>
      
      {/* Results display */}
      {results && results.impact && (
        <div className="border-t bg-gradient-to-b from-gray-50 to-white p-6 rounded-b-lg animate-fade-in">
          <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-green-600" />
            Projected Impact Based on Your Data
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {results.impact.additional_monthly_income !== undefined && (
              <div className="bg-green-50 rounded-xl p-4 border border-green-200">
                <p className="text-sm text-green-700 mb-1">Additional Monthly Income</p>
                <p className="text-2xl font-bold text-green-700">
                  ${results.impact.additional_monthly_income?.toLocaleString() || '0'}
                </p>
                <p className="text-xs text-green-600 mt-1">+${(results.impact.additional_annual_income || 0).toLocaleString()}/year</p>
              </div>
            )}
            
            {results.impact.monthly_savings !== undefined && (
              <div className="bg-green-50 rounded-xl p-4 border border-green-200">
                <p className="text-sm text-green-700 mb-1">Monthly Savings</p>
                <p className="text-2xl font-bold text-green-700">
                  ${results.impact.monthly_savings?.toLocaleString() || '0'}
                </p>
                <p className="text-xs text-green-600 mt-1">${(results.impact.annual_savings || 0).toLocaleString()}/year</p>
              </div>
            )}
            
            {results.impact.future_value !== undefined && (
              <div className="bg-purple-50 rounded-xl p-4 border border-purple-200">
                <p className="text-sm text-purple-700 mb-1">Future Value</p>
                <p className="text-2xl font-bold text-purple-700">
                  ${results.impact.future_value?.toLocaleString() || '0'}
                </p>
                <p className="text-xs text-purple-600 mt-1">Total earnings: ${(results.impact.total_earnings || 0).toLocaleString()}</p>
              </div>
            )}
            
            {results.impact.interest_saved !== undefined && (
              <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
                <p className="text-sm text-blue-700 mb-1">Interest Saved</p>
                <p className="text-2xl font-bold text-blue-700">
                  ${results.impact.interest_saved?.toLocaleString() || '0'}
                </p>
                <p className="text-xs text-blue-600 mt-1">Payoff time: {results.impact.new_payoff_months} months</p>
              </div>
            )}
            
            {results.impact.savings_rate_increase !== undefined && (
              <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
                <p className="text-sm text-blue-700 mb-1">Savings Rate Impact</p>
                <p className="text-2xl font-bold text-blue-700">
                  +{results.impact.savings_rate_increase?.toFixed(1) || '0'}%
                </p>
                <p className="text-xs text-blue-600 mt-1">New monthly savings: ${(results.impact.new_monthly_savings || 0).toLocaleString()}</p>
              </div>
            )}
            
            {results.impact.five_year_savings !== undefined && (
              <div className="bg-teal-50 rounded-xl p-4 border border-teal-200">
                <p className="text-sm text-teal-700 mb-1">5-Year Impact</p>
                <p className="text-2xl font-bold text-teal-700">
                  ${results.impact.five_year_savings?.toLocaleString() || '0'}
                </p>
                <p className="text-xs text-teal-600 mt-1">10-year: ${(results.impact.investment_growth_10yr || 0).toLocaleString()}</p>
              </div>
            )}
          </div>
          
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 mb-4">
            <h4 className="font-semibold mb-2 flex items-center gap-2">
              <Info className="w-4 h-4 text-blue-600" />
              Personalized Recommendation
            </h4>
            <p className="text-gray-700 text-sm leading-relaxed">{results.recommendation}</p>
          </div>
          
          {results.risks && results.risks.length > 0 && (
            <div className="border-l-4 border-yellow-400 bg-yellow-50 rounded-r-xl p-4">
              <p className="font-semibold text-yellow-800 flex items-center gap-2 mb-2">
                <AlertTriangle className="w-4 h-4" />
                Risks to Consider
              </p>
              <ul className="list-disc list-inside text-sm text-yellow-700 space-y-1">
                {results.risks.map((risk, idx) => (
                  <li key={idx}>{risk}</li>
                ))}
              </ul>
            </div>
          )}
          
          <div className="mt-4 pt-3 border-t border-gray-200 flex items-center justify-between text-xs text-gray-500">
            <div className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              <span>Based on your last 6 months of transaction data</span>
            </div>
            <div className="flex items-center gap-1">
              <CheckCircle className="w-3 h-3 text-green-500" />
              <span>Calculated with your actual spending patterns</span>
            </div>
          </div>
        </div>
      )}
      
      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};

export default ScenarioSimulator;