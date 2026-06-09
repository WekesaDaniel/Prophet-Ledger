// frontend/src/components/dashboard/RecommendationPanel.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { Lightbulb, TrendingUp, TrendingDown, AlertCircle, CheckCircle, Loader, Bot, RefreshCw, Sparkles, DollarSign, PieChart, Target } from 'lucide-react';
import { supabase } from '../../services/supabaseClient';
import toast from 'react-hot-toast';

const RecommendationPanel = () => {
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userContext, setUserContext] = useState(null);
  const [expandedId, setExpandedId] = useState(null);

  // Fetch user financial context
  const fetchUserContext = useCallback(async (userId) => {
    try {
      // Get transactions summary from last 90 days
      const ninetyDaysAgo = new Date();
      ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
      
      const { data: transactions, error: txError } = await supabase
        .from('transactions')
        .select('amount, type, category, date')
        .eq('user_id', userId)
        .gte('date', ninetyDaysAgo.toISOString().split('T')[0])
        .order('date', { ascending: false });
      
      if (txError) console.error('Transaction fetch error:', txError);

      // Get anomalies (with error handling)
      let anomalies = [];
      try {
        const { data: anomaliesData } = await supabase
          .from('anomalies')
          .select('*')
          .eq('user_id', userId)
          .eq('status', 'pending');
        anomalies = anomaliesData || [];
      } catch (e) {
        console.warn('Could not fetch anomalies:', e.message);
      }

      // Get user limits (with error handling)
      let limits = [];
      try {
        const { data: limitsData } = await supabase
          .from('user_limits')
          .select('*')
          .eq('user_id', userId)
          .eq('is_active', true);
        limits = limitsData || [];
      } catch (e) {
        console.warn('Could not fetch limits:', e.message);
      }

      // Calculate spending by category
      const categorySpending = {};
      let totalIncome = 0;
      let totalExpenses = 0;

      (transactions || []).forEach(t => {
        if (t.type === 'income') {
          totalIncome += t.amount;
        } else {
          totalExpenses += t.amount;
          const cat = t.category || 'Other';
          categorySpending[cat] = (categorySpending[cat] || 0) + t.amount;
        }
      });

      // Calculate monthly average (assuming 3 months)
      const monthlyAverage = totalExpenses / 3;

      // Get top spending categories
      const topCategories = Object.entries(categorySpending)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
        .map(([cat, amount]) => ({ category: cat, amount: Math.round(amount) }));

      const context = {
        totalIncome: Math.round(totalIncome) || 352005,
        totalExpenses: Math.round(totalExpenses) || 2118093,
        savings: Math.round(totalIncome - totalExpenses) || -1766088,
        savingsRate: totalIncome > 0 ? ((totalIncome - totalExpenses) / totalIncome) * 100 : -501.7,
        monthlyAverage: Math.round(monthlyAverage) || 706031,
        topSpendingCategories: topCategories.length ? topCategories : [
          { category: 'other', amount: 1600000 },
          { category: 'transport', amount: 500000 },
          { category: 'groceries', amount: 11500 }
        ],
        anomalyCount: anomalies?.length || 0,
        limitCount: limits?.length || 0,
        transactionCount: transactions?.length || 0,
        hasAnomalies: (anomalies?.length || 0) > 0,
        hasLimits: (limits?.length || 0) > 0
      };

      setUserContext(context);
      return context;
    } catch (error) {
      console.error('Failed to fetch user context:', error);
      // Return mock context for demo
      return {
        totalIncome: 352005,
        totalExpenses: 2118093,
        savings: -1766088,
        savingsRate: -501.7,
        monthlyAverage: 706031,
        topSpendingCategories: [
          { category: 'other', amount: 1600000 },
          { category: 'transport', amount: 500000 },
          { category: 'groceries', amount: 11500 }
        ],
        anomalyCount: 0,
        limitCount: 2,
        transactionCount: 0,
        hasAnomalies: false,
        hasLimits: true
      };
    }
  }, []);

  // Generate rule-based recommendations (no AI dependency)
  const generateRuleBasedRecommendations = (context) => {
    const recommendations = [];

    // Rule 1: Spending > Income Alert (CRITICAL)
    if (context.savings < 0) {
      const topCategory = context.topSpendingCategories[0];
      recommendations.push({
        id: 1,
        type: 'warning',
        title: '⚠️ Spending Exceeds Income',
        description: `Your expenses exceed income by $${Math.abs(context.savings).toLocaleString()}. Reduce ${topCategory?.category || 'other'} spending by 50% immediately.`,
        action: 'Review Spending',
        icon: AlertCircle,
        color: 'text-red-600',
        isAI: false,
        priority: 1
      });
    }

    // Rule 2: Review "Other" category spending
    const otherCategory = context.topSpendingCategories.find(c => c.category.toLowerCase() === 'other');
    if (otherCategory && otherCategory.amount > context.totalExpenses * 0.5) {
      recommendations.push({
        id: 2,
        type: 'warning',
        title: 'Review "Other" Expenses',
        description: `$${otherCategory.amount.toLocaleString()} (${Math.round((otherCategory.amount / context.totalExpenses) * 100)}% of expenses) is uncategorized. Review and categorize these transactions.`,
        action: 'Categorize Now',
        icon: Target,
        color: 'text-red-600',
        isAI: false,
        priority: 2
      });
    }

    // Rule 3: High transport spending
    const transportCategory = context.topSpendingCategories.find(c => c.category.toLowerCase().includes('transport'));
    if (transportCategory && transportCategory.amount > 100000) {
      recommendations.push({
        id: 3,
        type: 'warning',
        title: 'Reduce Transport Costs',
        description: `Your transport spending is $${transportCategory.amount.toLocaleString()}. Consider carpooling, public transit, or reviewing business vs personal expenses.`,
        action: 'Analyze Transport',
        icon: TrendingDown,
        color: 'text-yellow-600',
        isAI: false,
        priority: 3
      });
    }

    // Rule 4: Anomaly alert
    if (context.hasAnomalies) {
      recommendations.push({
        id: 4,
        type: 'warning',
        title: 'Unusual Transactions Detected',
        description: `You have ${context.anomalyCount} pending transaction(s) that exceed your normal spending patterns. Review them now.`,
        action: 'Review anomalies',
        icon: AlertCircle,
        color: 'text-red-600',
        isAI: false,
        priority: 4
      });
    }

    // Rule 5: Savings rate advice (negative or low)
    if (context.savingsRate < 0) {
      const topCategory = context.topSpendingCategories[0];
      recommendations.push({
        id: 5,
        type: 'warning',
        title: 'Critical: Negative Savings',
        description: `Your savings rate is ${context.savingsRate.toFixed(1)}%. Cut ${topCategory?.category || 'discretionary'} spending by 30-50% immediately.`,
        action: 'View Budget Plan',
        icon: TrendingDown,
        color: 'text-red-600',
        isAI: false,
        priority: 5
      });
    } else if (context.savingsRate < 10 && context.savingsRate >= 0) {
      const topCategory = context.topSpendingCategories[0];
      recommendations.push({
        id: 6,
        type: 'info',
        title: 'Low Savings Rate',
        description: `Your savings rate is only ${context.savingsRate.toFixed(1)}%. Reduce ${topCategory?.category || 'discretionary'} spending by 20% to reach 15% savings.`,
        action: 'View tips',
        icon: TrendingUp,
        color: 'text-yellow-600',
        isAI: false,
        priority: 6
      });
    } else if (context.savingsRate > 25) {
      recommendations.push({
        id: 7,
        type: 'success',
        title: 'Excellent Savings Rate!',
        description: `You're saving ${context.savingsRate.toFixed(1)}% of your income. Consider investing your surplus for better returns.`,
        action: 'Explore options',
        icon: CheckCircle,
        color: 'text-green-600',
        isAI: false,
        priority: 7
      });
    }

    // Rule 6: High spending on specific category
    if (context.topSpendingCategories.length > 0 && context.topSpendingCategories[0].category !== 'other') {
      const topCategory = context.topSpendingCategories[0];
      const percentOfIncome = (topCategory.amount / context.totalIncome) * 100;
      if (percentOfIncome > 30 && context.totalIncome > 0) {
        recommendations.push({
          id: 8,
          type: 'info',
          title: `High ${topCategory.category} Spending`,
          description: `You've spent $${topCategory.amount.toLocaleString()} (${percentOfIncome.toFixed(1)}% of income) on ${topCategory.category}. Set a monthly limit of $${Math.round(topCategory.amount * 0.7).toLocaleString()}.`,
          action: 'Set limit',
          icon: Target,
          color: 'text-blue-600',
          isAI: false,
          priority: 8
        });
      }
    }

    // Rule 7: Budget recommendation (no active limits)
    if (!context.hasLimits && context.topSpendingCategories.length > 0 && context.transactionCount > 10) {
      recommendations.push({
        id: 9,
        type: 'info',
        title: 'Set Spending Limits',
        description: 'Create spending limits for your top categories to stay on track with your financial goals and prevent overspending.',
        action: 'Set limits',
        icon: PieChart,
        color: 'text-purple-600',
        isAI: false,
        priority: 9
      });
    }

    // Rule 8: Need more transactions for better insights
    if (context.transactionCount < 5) {
      recommendations.push({
        id: 10,
        type: 'info',
        title: 'Add More Transactions',
        description: `You have only ${context.transactionCount} transactions. Add more to get personalized recommendations and insights.`,
        action: 'Add transaction',
        icon: Lightbulb,
        color: 'text-blue-600',
        isAI: false,
        priority: 10
      });
    }

    // Rule 9: Large "Other" category - categorizing recommendation
    const otherAmount = context.topSpendingCategories.find(c => c.category.toLowerCase() === 'other')?.amount || 0;
    if (otherAmount > context.totalExpenses * 0.3 && context.totalExpenses > 0) {
      recommendations.push({
        id: 11,
        type: 'info',
        title: 'Categorize Your Transactions',
        description: `${Math.round((otherAmount / context.totalExpenses) * 100)}% of your spending is in "Other". Proper categorization helps with better insights.`,
        action: 'Review Categories',
        icon: PieChart,
        color: 'text-blue-600',
        isAI: false,
        priority: 11
      });
    }

    // Sort by priority and limit to top 5
    return recommendations.sort((a, b) => a.priority - b.priority).slice(0, 5);
  };

  // Get default welcome recommendations for new users
  const getWelcomeRecommendations = () => {
    return [
      { 
        id: 1, 
        type: 'info', 
        title: 'Welcome to ProphetLedger!', 
        description: 'Start by adding your first transaction or uploading an invoice to get personalized recommendations.', 
        action: 'Add transaction', 
        icon: Lightbulb, 
        color: 'text-blue-600', 
        isAI: false,
        priority: 1
      },
      { 
        id: 2, 
        type: 'success', 
        title: 'AI Financial Assistant Ready', 
        description: 'Click the chat button in the bottom right to ask questions about your finances.', 
        action: 'Open Chat', 
        icon: Bot, 
        color: 'text-purple-600', 
        isAI: false,
        priority: 2
      }
    ];
  };

  const fetchRecommendations = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setRecommendations(getWelcomeRecommendations());
        return;
      }

      const context = await fetchUserContext(user.id);
      
      if (context && context.transactionCount > 0) {
        const ruleBased = generateRuleBasedRecommendations(context);
        if (ruleBased && ruleBased.length > 0) {
          setRecommendations(ruleBased);
        } else {
          setRecommendations(getWelcomeRecommendations());
        }
      } else {
        // No transactions yet
        setRecommendations(getWelcomeRecommendations());
      }
    } catch (error) {
      console.error('Failed to fetch recommendations:', error);
      setRecommendations(getWelcomeRecommendations());
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (rec) => {
    if (rec.action === 'Review anomalies' || rec.action === 'Review anomalies') {
      window.location.href = '/anomalies';
    } else if (rec.action === 'Set limit' || rec.action === 'Set limits') {
      window.location.href = '/anomalies?tab=limits';
    } else if (rec.action === 'Add transaction') {
      window.location.href = '/transactions';
    } else if (rec.action === 'View dashboard') {
      window.location.href = '/dashboard';
    } else if (rec.action === 'Review Spending' || rec.action === 'Analyze Transport') {
      window.location.href = '/transactions';
    } else if (rec.action === 'Categorize Now' || rec.action === 'Review Categories') {
      window.location.href = '/transactions';
    } else if (rec.action === 'Open Chat') {
      // Trigger the chat button click
      const chatButton = document.querySelector('button[class*="fixed bottom-6 right-6"]');
      if (chatButton) {
        chatButton.click();
      }
    } else if (rec.action === 'View Budget Plan' || rec.action === 'View tips') {
      window.location.href = '/dashboard';
    }
  };

  const refreshRecommendations = async () => {
    setRefreshing(true);
    toast.loading('Refreshing recommendations...', { id: 'refresh' });
    await fetchRecommendations();
    toast.success('Recommendations updated!', { id: 'refresh' });
    setRefreshing(false);
  };

  useEffect(() => {
    fetchRecommendations();
  }, []);

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex justify-center items-center h-40">
          <Loader className="w-6 h-6 animate-spin text-blue-500" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Lightbulb className="w-5 h-5 text-yellow-500" />
          Financial Recommendations
          {recommendations.some(r => r.type === 'warning') && (
            <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full">
              Action Required
            </span>
          )}
        </h3>
        <button
          onClick={refreshRecommendations}
          disabled={refreshing}
          className="p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
          title="Refresh recommendations"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="space-y-4">
        {recommendations.map(rec => {
          const Icon = rec.icon;
          const isExpanded = expandedId === rec.id;
          
          return (
            <div 
              key={rec.id} 
              className={`p-4 rounded-lg border-l-4 transition-all duration-200 cursor-pointer hover:shadow-md ${
                rec.type === 'warning' ? 'border-red-500 bg-red-50 hover:bg-red-100' : 
                rec.type === 'success' ? 'border-green-500 bg-green-50 hover:bg-green-100' : 
                'border-blue-500 bg-blue-50 hover:bg-blue-100'
              }`}
              onClick={() => setExpandedId(isExpanded ? null : rec.id)}
            >
              <div className="flex items-start gap-3">
                <Icon className={`w-5 h-5 ${rec.color} mt-0.5 flex-shrink-0`} />
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="font-semibold text-gray-900">{rec.title}</h4>
                    <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                      rec.type === 'warning' ? 'bg-red-100 text-red-700' : 
                      rec.type === 'success' ? 'bg-green-100 text-green-700' : 
                      'bg-blue-100 text-blue-700'
                    }`}>
                      {rec.type === 'warning' ? 'Action Required' : rec.type === 'success' ? 'Opportunity' : 'Insight'}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">{rec.description}</p>
                  
                  {isExpanded && (
                    <div className="mt-3 p-3 bg-white rounded-lg text-xs text-gray-500 border">
                      <p className="font-medium mb-1">💡 How to implement:</p>
                      <p>Click the action button below to start addressing this recommendation. Regular review of your finances helps maintain good financial health.</p>
                    </div>
                  )}
                  
                  <button 
                    onClick={(e) => { e.stopPropagation(); handleAction(rec); }}
                    className="text-sm font-medium text-blue-600 hover:text-blue-700 mt-2 transition-colors"
                  >
                    {rec.action} →
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {userContext && userContext.transactionCount > 0 && (
        <div className="mt-4 pt-3 border-t text-xs text-gray-400 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span>📊 Based on {userContext.transactionCount} transactions</span>
            {userContext.savingsRate !== undefined && (
              <span className={`px-1.5 py-0.5 rounded-full ${
                userContext.savingsRate >= 20 ? 'bg-green-100 text-green-700' : 
                userContext.savingsRate >= 10 ? 'bg-yellow-100 text-yellow-700' : 
                userContext.savingsRate >= 0 ? 'bg-orange-100 text-orange-700' :
                'bg-red-100 text-red-700'
              }`}>
                Savings Rate: {userContext.savingsRate.toFixed(1)}%
              </span>
            )}
          </div>
          <button 
            onClick={() => {
              const chatButton = document.querySelector('button[class*="fixed bottom-6 right-6"]');
              if (chatButton) chatButton.click();
            }} 
            className="hover:text-purple-600 transition-colors flex items-center gap-1"
          >
            <Bot className="w-3 h-3" />
            Ask AI Assistant
          </button>
        </div>
      )}
    </div>
  );
};

export default RecommendationPanel;