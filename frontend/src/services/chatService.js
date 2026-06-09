// frontend/src/services/chatService.js
import api from './api';
import { supabase } from './supabaseClient';

// Set to true if backend is not available
const USE_MOCK_API = true;

export const sendChatMessage = async (query) => {
  try {
    console.log('📤 Sending chat message:', query);
    
    // Get current user context
    const { data: { user } } = await supabase.auth.getUser();
    
    // Fetch user's financial data for context
    const userData = await fetchUserFinancialData(user?.id);
    
    // Create enhanced query with context
    const enhancedQuery = createEnhancedQuery(query, userData);
    
    if (USE_MOCK_API) {
      const mockResponse = await getMockChatResponse(enhancedQuery, userData);
      console.log('📥 Mock chat response:', mockResponse);
      return mockResponse;
    }
    
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

// Mock response generator for recommendations
const getMockChatResponse = async (query, userData) => {
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Check if this is a recommendations request
  if (query.includes('specific, actionable recommendations') || query.includes('recommendations')) {
    return {
      query: query,
      response: JSON.stringify({
        recommendations: [
          {
            type: "warning",
            title: "Review 'Other' Spending",
            description: "Categorize $1.6M in 'other' expenses to identify savings",
            action: "Review Now"
          },
          {
            type: "warning", 
            title: "Reduce Transport Costs",
            description: "Your $500k transport spend is 5x above typical levels",
            action: "Analyze"
          },
          {
            type: "info",
            title: "Set Monthly Budget",
            description: "Create spending limits for your top 3 categories",
            action: "Set Limits"
          }
        ]
      }),
      intent: "recommendations",
      confidence: 0.95
    };
  }
  
  // Default responses
  const queryLower = query.toLowerCase();
  
  if (queryLower.includes("spent") || queryLower.includes("spend")) {
    return {
      query: query,
      response: `Based on your data, you've spent **$${userData?.totalExpenses?.toLocaleString() || '2,118,093'}** in the last 90 days. Your top category is "other" at **$${userData?.topSpendingCategories?.[0]?.amount?.toLocaleString() || '1,600,000'}**. I recommend reviewing those "other" transactions to better understand where your money is going.`,
      intent: "spending",
      confidence: 0.9
    };
  }
  
  if (queryLower.includes("anomaly") || queryLower.includes("unusual")) {
    return {
      query: query,
      response: `You have **${userData?.anomalyCount || 0} pending anomalies**. No unusual transactions have been detected recently, which means your transaction patterns appear normal based on historical data.`,
      intent: "anomaly",
      confidence: 0.85
    };
  }
  
  if (queryLower.includes("risk") || queryLower.includes("score")) {
    return {
      query: query,
      response: `Your current financial risk score is **${userData?.riskScore || 65}/100 (${userData?.riskLevel || 'Medium'})**. Your expenses significantly exceed your income, which contributes to this risk level. Consider implementing budget recommendations to improve this score.`,
      intent: "risk",
      confidence: 0.88
    };
  }
  
  if (queryLower.includes("recommend") || queryLower.includes("advice") || queryLower.includes("suggest")) {
    return {
      query: query,
      response: "**Here are 3 specific recommendations based on your data:**\n\n1. **Review 'other' category spending** ($1,600,000) - This represents 76% of your expenses. Categorize these transactions to identify saving opportunities.\n\n2. **Reduce transport costs** - Your $500,000 transport spending is 5x higher than typical. Consider reviewing business vs personal expenses.\n\n3. **Set a monthly budget** - With expenses exceeding income by $1.77M, create spending limits for your top categories.",
      intent: "advice",
      confidence: 0.92
    };
  }
  
  if (queryLower.includes("explain this page")) {
    return {
      query: query,
      response: "📖 **About the Dashboard Page**:\n\nThis page shows your financial dashboard with key metrics, spending trends, and anomaly detection. You can view your financial health score, recent transactions, and get AI-powered recommendations based on your data.\n\nWhat specific information would you like to know?",
      intent: "page_explain",
      confidence: 0.95
    };
  }
  
  // Default response
  return {
    query: query,
    response: `I can help you analyze your financial data. Based on your data, I notice your expenses ($${userData?.totalExpenses?.toLocaleString() || '2,118,093'}) significantly exceed your income ($${userData?.totalIncome?.toLocaleString() || '352,005'}). Would you like specific recommendations to address this? Try asking "Give me recommendations" or "How can I save more money?"`,
    intent: "general",
    confidence: 0.85
  };
};

// Fetch comprehensive user financial data
export const fetchUserFinancialData = async (userId) => {
  if (!userId) return null;
  
  try {
    // Get transactions (last 90 days)
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
    
    const { data: transactions, error: txError } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', userId)
      .gte('date', ninetyDaysAgo.toISOString().split('T')[0])
      .order('date', { ascending: false });
    
    if (txError) console.error('Error fetching transactions:', txError);
    
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
    
    // Get risk score (with error handling)
    let riskScore = null;
    try {
      const { data: riskData } = await supabase
        .from('risk_scores')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      riskScore = riskData;
    } catch (e) {
      console.warn('Could not fetch risk score:', e.message);
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
    
    // Get top spending categories
    const topCategories = Object.entries(categorySpending)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([cat, amount]) => ({ category: cat, amount: Math.round(amount) }));
    
    // Calculate monthly average
    const months = 3;
    const monthlyAverage = totalExpenses / months;
    
    return {
      totalIncome: Math.round(totalIncome) || 352005,
      totalExpenses: Math.round(totalExpenses) || 2118093,
      savings: Math.round(totalIncome - totalExpenses) || -1766088,
      savingsRate: totalIncome > 0 ? ((totalIncome - totalExpenses) / totalIncome) * 100 : -501.7,
      monthlyAverage: Math.round(monthlyAverage) || 706031,
      topSpendingCategories: topCategories.length ? topCategories : [
        { category: 'other', amount: 1600000 },
        { category: 'transport', amount: 500000 },
        { category: 'groceries', amount: 11500 },
        { category: 'Dining', amount: 2629 }
      ],
      anomalyCount: anomalies?.length || 0,
      limitCount: limits?.length || 2,
      transactionCount: transactions?.length || 0,
      riskScore: riskScore?.risk_score || 65,
      riskLevel: riskScore?.risk_level || 'medium',
      hasAnomalies: (anomalies?.length || 0) > 0,
      hasLimits: (limits?.length || 0) > 0
    };
  } catch (error) {
    console.error('Error fetching user data:', error);
    // Return mock data on error
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
      riskScore: 65,
      riskLevel: 'medium',
      hasAnomalies: false,
      hasLimits: true
    };
  }
};

// Create enhanced query with user data context
const createEnhancedQuery = (query, userData) => {
  if (!userData) return query;
  
  const contextPrompt = `You are ProphetLedger's AI Financial Assistant. Based on this user's data, provide 2-3 specific, actionable recommendations.

USER FINANCIAL DATA:
- Total Income (90 days): $${userData.totalIncome?.toLocaleString() || 0}
- Total Expenses (90 days): $${userData.totalExpenses?.toLocaleString() || 0}
- Net Savings: $${userData.savings?.toLocaleString() || 0}
- Savings Rate: ${userData.savingsRate?.toFixed(1) || 0}%
- Monthly Average Spend: $${userData.monthlyAverage?.toLocaleString() || 0}
- Top 5 Spending Categories: ${userData.topSpendingCategories?.map(c => `${c.category} ($${c.amount.toLocaleString()})`).join(', ') || 'None'}
- Pending Anomalies: ${userData.anomalyCount || 0}
- Active Spending Limits: ${userData.limitCount || 0}

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

  return contextPrompt;
};

export const getChatSuggestions = async () => {
  return [
    "How much did I spend?",
    "Show me anomalies",
    "What's my risk score?",
    "Give me recommendations",
    "How can I save more money?",
    "Explain this page",
    "What are my top spending categories?",
    "Am I on track with my budget?"
  ];
};

export const classifyTransaction = async (description, amount) => {
  return {
    category: "Other",
    confidence: 0.7,
    suggested_tags: ["unclassified"],
    method: "fallback"
  };
};

export const getFinancialAdvice = async (userContext) => {
  return {
    recommendations: [
      { type: "warning", title: "Review 'Other' Spending", description: "Categorize $1.6M in other expenses", action: "Review" },
      { type: "warning", title: "Reduce Transport", description: "Cut transport spending by 30%", action: "Analyze" },
      { type: "info", title: "Set Budget", description: "Create monthly spending limits", action: "Set Limits" }
    ]
  };
};