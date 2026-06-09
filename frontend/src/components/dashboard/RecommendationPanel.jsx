// frontend/src/components/dashboard/RecommendationPanel.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { Lightbulb, TrendingUp, TrendingDown, AlertCircle, CheckCircle, Loader, Bot, RefreshCw, Sparkles, DollarSign, PieChart, Target } from 'lucide-react';
import { supabase } from '../../services/supabaseClient';
import { sendChatMessage } from '../../services/chatService';
import toast from 'react-hot-toast';

const RecommendationPanel = () => {
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [aiGenerating, setAiGenerating] = useState(false);
  const [userContext, setUserContext] = useState(null);
  const [expandedId, setExpandedId] = useState(null);

  // Fetch user financial context for AI
  const fetchUserContext = useCallback(async (userId) => {
    try {
      // Get transactions summary from last 90 days
      const ninetyDaysAgo = new Date();
      ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
      
      const { data: transactions } = await supabase
        .from('transactions')
        .select('amount, type, category, date')
        .eq('user_id', userId)
        .gte('date', ninetyDaysAgo.toISOString().split('T')[0])
        .order('date', { ascending: false });

      // Get anomalies
      const { data: anomalies } = await supabase
        .from('anomalies')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'pending');

      // Get user limits
      const { data: limits } = await supabase
        .from('user_limits')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true);

      // Calculate spending by category
      const categorySpending = {};
      let totalIncome = 0;
      let totalExpenses = 0;
      let monthlyAverage = 0;

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
      monthlyAverage = totalExpenses / 3;

      // Get top spending categories
      const topCategories = Object.entries(categorySpending)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
        .map(([cat, amount]) => ({ category: cat, amount: Math.round(amount) }));

      const context = {
        totalIncome: Math.round(totalIncome),
        totalExpenses: Math.round(totalExpenses),
        savings: Math.round(totalIncome - totalExpenses),
        savingsRate: totalIncome > 0 ? ((totalIncome - totalExpenses) / totalIncome) * 100 : 0,
        monthlyAverage: Math.round(monthlyAverage),
        topSpendingCategories: topCategories,
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
      return null;
    }
  }, []);

  // Parse AI response into structured recommendations
  const parseAIResponse = (responseText) => {
    const recommendations = [];
    
    // Try to extract JSON first
    try {
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        if (parsed.recommendations && Array.isArray(parsed.recommendations)) {
          return parsed.recommendations.map((rec, idx) => ({
            id: `ai-${Date.now()}-${idx}`,
            type: rec.type || 'info',
            title: rec.title,
            description: rec.description,
            action: rec.action || 'Learn more',
            icon: rec.type === 'warning' ? AlertCircle : rec.type === 'success' ? CheckCircle : Lightbulb,
            color: rec.type === 'warning' ? 'text-red-600' : rec.type === 'success' ? 'text-green-600' : 'text-blue-600',
            isAI: true
          }));
        }
      }
    } catch (e) {
      // Not JSON, continue with text parsing
    }
    
    // Fallback: Parse bullet points from text
    const lines = responseText.split('\n');
    let currentRec = null;
    
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      
      // Check for bullet points or numbered lists
      if (trimmed.match(/^[\d]+\.|^[-•*]/)) {
        const cleanLine = trimmed.replace(/^[\d]+\.\s*|^[-•*]\s*/, '');
        
        let type = 'info';
        let icon = Lightbulb;
        let color = 'text-blue-600';
        
        if (cleanLine.toLowerCase().includes('save') || cleanLine.toLowerCase().includes('saving')) {
          type = 'success';
          icon = CheckCircle;
          color = 'text-green-600';
        } else if (cleanLine.toLowerCase().includes('warning') || cleanLine.toLowerCase().includes('alert') || cleanLine.toLowerCase().includes('anomaly')) {
          type = 'warning';
          icon = AlertCircle;
          color = 'text-red-600';
        } else if (cleanLine.toLowerCase().includes('budget') || cleanLine.toLowerCase().includes('spend')) {
          type = 'info';
          icon = TrendingUp;
          color = 'text-yellow-600';
        }
        
        recommendations.push({
          id: `ai-${Date.now()}-${recommendations.length}`,
          type,
          title: type === 'success' ? 'Savings Opportunity' : type === 'warning' ? 'Action Required' : 'Recommendation',
          description: cleanLine.substring(0, 150),
          action: 'View details',
          icon,
          color,
          isAI: true
        });
      }
    }
    
    return recommendations;
  };

  // Generate AI recommendations using Groq
  const generateAIRecommendations = async (context) => {
    if (!context) return null;

    setAiGenerating(true);
    
    const prompt = `You are ProphetLedger's AI Financial Assistant. Based on this user's data, provide 2-3 specific, actionable recommendations.

USER FINANCIAL DATA:
- Total Income (90 days): $${context.totalIncome.toLocaleString()}
- Total Expenses (90 days): $${context.totalExpenses.toLocaleString()}
- Net Savings: $${context.savings.toLocaleString()}
- Savings Rate: ${context.savingsRate.toFixed(1)}%
- Monthly Average Spend: $${context.monthlyAverage.toLocaleString()}
- Top 5 Spending Categories: ${context.topSpendingCategories.map(c => `${c.category} ($${c.amount.toLocaleString()})`).join(', ')}
- Pending Anomalies: ${context.anomalyCount}
- Active Spending Limits: ${context.limitCount}

REQUIREMENTS:
1. If savings rate < 10% → suggest budget cuts in top categories
2. If anomalies exist → prioritize reviewing them
3. If spending > income → suggest specific reductions
4. Be specific and actionable (e.g., "Reduce dining out by 30%" not "Spend less")
5. Keep each recommendation under 100 characters

Return as JSON:
{
  "recommendations": [
    {"type": "warning|success|info", "title": "short title", "description": "actionable advice", "action": "button text"}
  ]
}`;

    try {
      const response = await sendChatMessage(prompt);
      
      if (response && response.response) {
        const parsed = parseAIResponse(response.response);
        if (parsed.length > 0) {
          return parsed;
        }
      }
    } catch (error) {
      console.error('AI recommendation generation failed:', error);
    } finally {
      setAiGenerating(false);
    }
    
    return null;
  };

  // Generate rule-based recommendations (fallback)
  const generateRuleBasedRecommendations = (context) => {
    const recommendations = [];

    // Anomaly alert
    if (context.hasAnomalies) {
      recommendations.push({
        id: 1,
        type: 'warning',
        title: 'Unusual Transactions Detected',
        description: `You have ${context.anomalyCount} pending transaction(s) that exceed your normal spending patterns. Review them now.`,
        action: 'Review anomalies',
        icon: AlertCircle,
        color: 'text-red-600',
        isAI: false
      });
    }

    // Savings rate advice
    if (context.savingsRate < 10) {
      const topCategory = context.topSpendingCategories[0];
      recommendations.push({
        id: 2,
        type: 'warning',
        title: 'Low Savings Rate',
        description: `Your savings rate is only ${context.savingsRate.toFixed(1)}%. Consider reducing ${topCategory?.category || 'discretionary'} spending by 20%.`,
        action: 'View tips',
        icon: TrendingDown,
        color: 'text-yellow-600',
        isAI: false
      });
    } else if (context.savingsRate > 25) {
      recommendations.push({
        id: 3,
        type: 'success',
        title: 'Excellent Savings Rate!',
        description: `You're saving ${context.savingsRate.toFixed(1)}% of your income. Consider investing your surplus.`,
        action: 'Explore options',
        icon: TrendingUp,
        color: 'text-green-600',
        isAI: false
      });
    }

    // High spending alert
    if (context.topSpendingCategories.length > 0) {
      const topCategory = context.topSpendingCategories[0];
      if (topCategory.amount > context.monthlyAverage * 0.3) {
        recommendations.push({
          id: 4,
          type: 'info',
          title: 'High Spending Alert',
          description: `You've spent $${topCategory.amount.toLocaleString()} on ${topCategory.category}. Set a monthly limit of $${Math.round(topCategory.amount * 0.7).toLocaleString()}.`,
          action: 'Set limit',
          icon: Target,
          color: 'text-blue-600',
          isAI: false
        });
      }
    }

    // Budget recommendation
    if (!context.hasLimits && context.topSpendingCategories.length > 0) {
      recommendations.push({
        id: 5,
        type: 'info',
        title: 'Set Spending Limits',
        description: 'Create spending limits for your top categories to stay on track with your financial goals.',
        action: 'Set limits',
        icon: PieChart,
        color: 'text-purple-600',
        isAI: false
      });
    }

    // Default welcome
    if (recommendations.length === 0) {
      recommendations.push({
        id: 6,
        type: 'success',
        title: 'Financial Health Check',
        description: 'Your finances look stable! Keep tracking your expenses to maintain good habits.',
        action: 'View dashboard',
        icon: CheckCircle,
        color: 'text-green-600',
        isAI: false
      });
    }

    return recommendations;
  };

  const fetchRecommendations = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user');

      const context = await fetchUserContext(user.id);
      
      if (context && context.transactionCount > 5) {
        // Try to get AI recommendations first
        const aiRecommendations = await generateAIRecommendations(context);
        
        if (aiRecommendations && aiRecommendations.length > 0) {
          setRecommendations(aiRecommendations);
        } else {
          // Fallback to rule-based recommendations
          const ruleBased = generateRuleBasedRecommendations(context);
          setRecommendations(ruleBased);
        }
      } else if (context && context.transactionCount > 0) {
        // Not enough data for AI, use rule-based
        const ruleBased = generateRuleBasedRecommendations(context);
        setRecommendations(ruleBased);
      } else {
        // No transactions yet
        setRecommendations([
          { id: 1, type: 'info', title: 'Welcome to ProphetLedger!', description: 'Start by adding your first transaction or uploading an invoice to get personalized recommendations.', action: 'Add transaction', icon: Lightbulb, color: 'text-blue-600', isAI: false }
        ]);
      }
    } catch (error) {
      console.error('Failed to fetch recommendations:', error);
      setRecommendations([
        { id: 1, type: 'info', title: 'Welcome to ProphetLedger', description: 'Start by adding your first transaction or uploading an invoice.', action: 'Add transaction', icon: Lightbulb, color: 'text-blue-600', isAI: false }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (rec) => {
    if (rec.action === 'Review anomalies') {
      window.location.href = '/anomalies';
    } else if (rec.action === 'Set limit' || rec.action === 'Set limits') {
      window.location.href = '/settings?tab=limits';
    } else if (rec.action === 'Add transaction') {
      window.location.href = '/transactions';
    } else if (rec.action === 'View dashboard') {
      window.location.href = '/dashboard';
    }
  };

  const refreshRecommendations = async () => {
    toast.loading('Generating fresh recommendations...', { id: 'refresh' });
    await fetchRecommendations();
    toast.success('Recommendations updated!', { id: 'refresh' });
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
          AI-Powered Recommendations
          {recommendations.some(r => r.isAI) && (
            <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              AI Generated
            </span>
          )}
        </h3>
        <button
          onClick={refreshRecommendations}
          disabled={aiGenerating}
          className="p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
          title="Refresh recommendations"
        >
          <RefreshCw className={`w-4 h-4 ${aiGenerating ? 'animate-spin' : ''}`} />
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
                    {rec.isAI && (
                      <span className="text-xs bg-purple-100 text-purple-600 px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                        <Bot className="w-2.5 h-2.5" />
                        AI
                      </span>
                    )}
                    <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                      rec.type === 'warning' ? 'bg-red-100 text-red-700' : 
                      rec.type === 'success' ? 'bg-green-100 text-green-700' : 
                      'bg-blue-100 text-blue-700'
                    }`}>
                      {rec.type === 'warning' ? 'Action Required' : rec.type === 'success' ? 'Opportunity' : 'Insight'}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">{rec.description}</p>
                  
                  {isExpanded && rec.isAI && (
                    <div className="mt-3 p-3 bg-white rounded-lg text-xs text-gray-500 border">
                      <p className="font-medium mb-1">💡 Why this recommendation?</p>
                      <p>Based on your spending patterns and financial goals, this suggestion can help you optimize your finances.</p>
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
            {userContext.savingsRate > 0 && (
              <span className={`px-1.5 py-0.5 rounded-full ${
                userContext.savingsRate >= 20 ? 'bg-green-100 text-green-700' : 
                userContext.savingsRate >= 10 ? 'bg-yellow-100 text-yellow-700' : 
                'bg-red-100 text-red-700'
              }`}>
                Savings Rate: {userContext.savingsRate.toFixed(1)}%
              </span>
            )}
          </div>
          <button 
            onClick={() => window.location.href = '/chat'} 
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