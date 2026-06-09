// frontend/src/services/chatService.js
import api from './api';
import { supabase } from './supabaseClient';

export const sendChatMessage = async (query) => {
  try {
    console.log('📤 Sending chat message:', query);
    
    // Get current user context
    const { data: { user } } = await supabase.auth.getUser();
    
    // Fetch user's financial data for context
    const userData = await fetchUserFinancialData(user?.id);
    
    // Create enhanced query with context
    const enhancedQuery = createEnhancedQuery(query, userData);
    
    const response = await api.post('/chatbot/query', { query: enhancedQuery, user_context: userData });
    console.log('📥 Chat response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Chat error:', error);
    return {
      query,
      response: "I'm having trouble connecting right now. Please try again later.",
      intent: "error",
      confidence: 0
    };
  }
};

// Fetch comprehensive user financial data
export const fetchUserFinancialData = async (userId) => {
  if (!userId) return null;
  
  try {
    // Get transactions (last 90 days)
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
    
    const { data: transactions } = await supabase
      .from('transactions')
      .select('*')
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
    
    // Get risk score
    const { data: riskScore } = await supabase
      .from('risk_scores')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
    
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
    
    // Get top spending categories
    const topCategories = Object.entries(categorySpending)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([cat, amount]) => ({ category: cat, amount: Math.round(amount) }));
    
    // Calculate monthly average
    const months = 3;
    const monthlyAverage = totalExpenses / months;
    
    return {
      totalIncome: Math.round(totalIncome),
      totalExpenses: Math.round(totalExpenses),
      savings: Math.round(totalIncome - totalExpenses),
      savingsRate: totalIncome > 0 ? ((totalIncome - totalExpenses) / totalIncome) * 100 : 0,
      monthlyAverage: Math.round(monthlyAverage),
      topSpendingCategories: topCategories,
      anomalyCount: anomalies?.length || 0,
      limitCount: limits?.length || 0,
      transactionCount: transactions?.length || 0,
      riskScore: riskScore?.risk_score || 50,
      riskLevel: riskScore?.risk_level || 'medium',
      hasAnomalies: (anomalies?.length || 0) > 0,
      hasLimits: (limits?.length || 0) > 0
    };
  } catch (error) {
    console.error('Error fetching user data:', error);
    return null;
  }
};

// Create enhanced query with user data context
const createEnhancedQuery = (query, userData) => {
  if (!userData) return query;
  
  const contextPrompt = `USER'S FINANCIAL DATA (use this for accurate answers):
- Total Income (90 days): $${userData.totalIncome?.toLocaleString() || 0}
- Total Expenses (90 days): $${userData.totalExpenses?.toLocaleString() || 0}
- Net Savings: $${userData.savings?.toLocaleString() || 0}
- Savings Rate: ${userData.savingsRate?.toFixed(1) || 0}%
- Monthly Average Spend: $${userData.monthlyAverage?.toLocaleString() || 0}
- Top 5 Categories: ${userData.topSpendingCategories?.map(c => `${c.category} ($${c.amount.toLocaleString()})`).join(', ') || 'None'}
- Pending Anomalies: ${userData.anomalyCount || 0}
- Active Limits: ${userData.limitCount || 0}
- Risk Score: ${userData.riskScore || 50}/100 (${userData.riskLevel || 'medium'})

User Question: ${query}

Answer based on their ACTUAL data. Be specific with numbers from above.`;

  return contextPrompt;
};

export const getChatSuggestions = async () => {
  try {
    const response = await api.get('/chatbot/suggestions');
    return response.data.suggestions;
  } catch (error) {
    console.error('Failed to fetch suggestions:', error);
    return [
      "How much did I spend on food?",
      "What is my current balance?",
      "Show me unusual transactions",
      "Forecast my spending for next month",
      "How can I save more money?",
      "What are my top spending categories?",
      "Am I on track with my budget?",
      "Give me financial advice based on my data"
    ];
  }
};

export const classifyTransaction = async (description, amount) => {
  try {
    const response = await api.post('/chatbot/classify', null, {
      params: { description, amount }
    });
    return response.data;
  } catch (error) {
    console.error('Classification error:', error);
    return {
      category: "Other",
      confidence: 0.3,
      suggested_tags: ["unclassified", "error"],
      method: "fallback"
    };
  }
};

export const getFinancialAdvice = async (userContext) => {
  try {
    const prompt = `Based on this user's ACTUAL financial data:
- Total Income: $${userContext.totalIncome?.toLocaleString() || 0}
- Total Expenses: $${userContext.totalExpenses?.toLocaleString() || 0}
- Savings Rate: ${userContext.savingsRate?.toFixed(1) || 0}%
- Top Categories: ${userContext.topSpendingCategories?.map(c => `${c.category} ($${c.amount?.toLocaleString()})`).join(', ') || 'None'}
- Anomalies: ${userContext.anomalyCount || 0}

Provide 3 specific, actionable recommendations based on their ACTUAL data. Be precise with numbers.`;

    const response = await api.post('/chatbot/query', { query: prompt });
    return response.data;
  } catch (error) {
    console.error('Failed to get financial advice:', error);
    return null;
  }
};