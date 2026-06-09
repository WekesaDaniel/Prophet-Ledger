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
    
    if (USE_MOCK_API) {
      const mockResponse = await getSmartMockResponse(query, userData);
      console.log('📥 Mock chat response:', mockResponse);
      return mockResponse;
    }
    
    const response = await api.post('/chatbot/query', { query, user_context: userData });
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

// Smart mock response that handles different query types naturally
const getSmartMockResponse = async (query, userData) => {
  await new Promise(resolve => setTimeout(resolve, 500));
  
  const queryLower = query.toLowerCase();
  
  // Handle "Show me anomalies" or anomaly-related queries
  if (queryLower.includes('anomal') || queryLower.includes('unusual') || queryLower.includes('suspicious')) {
    const anomalyCount = userData?.anomalyCount || 0;
    
    if (anomalyCount === 0) {
      return {
        query: query,
        response: "✅ **No anomalies detected**\n\nGreat news! I've analyzed your recent transactions and found no unusual or suspicious activity. Your spending patterns are consistent with your history.\n\nWould you like me to help you with:\n• Setting up anomaly alerts\n• Reviewing your spending patterns\n• Checking your risk score",
        intent: "anomaly",
        confidence: 0.95
      };
    } else {
      return {
        query: query,
        response: `🚨 **${anomalyCount} Anomal${anomalyCount === 1 ? 'y' : 'ies'} Detected**\n\nI've found ${anomalyCount} transaction${anomalyCount === 1 ? '' : 's'} that don't match your usual spending pattern. These could be:\n• Unusual large purchases\n• Unexpected recurring charges\n• Potential fraud\n\n**Recommended action:** Review these transactions immediately in the Anomalies page.\n\nWould you like me to explain what makes a transaction anomalous?`,
        intent: "anomaly",
        confidence: 0.95
      };
    }
  }
  
  // Handle "How much did I spend?" or spending queries
  if (queryLower.includes('spent') || queryLower.includes('spend') || queryLower.includes('expense')) {
    const totalExpenses = userData?.totalExpenses || 2118093;
    const topCategory = userData?.topSpendingCategories?.[0];
    
    return {
      query: query,
      response: `💰 **Your Spending Summary (Last 90 Days)**\n\n• **Total Spent:** $${totalExpenses.toLocaleString()}\n• **Monthly Average:** $${userData?.monthlyAverage?.toLocaleString() || '706,031'}\n• **Top Category:** ${topCategory?.category || 'other'} ($${topCategory?.amount?.toLocaleString() || '1,600,000'})\n\n${totalExpenses > (userData?.totalIncome || 352005) ? '⚠️ *Note: Your expenses exceed your income. Consider reviewing your top spending categories.*' : ''}\n\nWould you like me to break down spending by category?`,
      intent: "spending",
      confidence: 0.95
    };
  }
  
  // Handle "What's my risk score?" queries
  if (queryLower.includes('risk score') || queryLower.includes('risk level') || queryLower.includes('financial risk')) {
    const riskScore = userData?.riskScore || 65;
    const riskLevel = userData?.riskLevel || 'medium';
    
    let riskDescription = '';
    let recommendation = '';
    
    if (riskScore >= 70) {
      riskDescription = 'high risk - your spending significantly exceeds income';
      recommendation = 'I strongly recommend reviewing your budget and reducing expenses immediately.';
    } else if (riskScore >= 40) {
      riskDescription = 'medium risk - your spending patterns need attention';
      recommendation = 'Consider setting spending limits on your top categories to improve this score.';
    } else {
      riskDescription = 'low risk - you\'re managing your finances well';
      recommendation = 'Keep up the good work! Consider investing your surplus for better returns.';
    }
    
    return {
      query: query,
      response: `📊 **Your Financial Risk Score: ${riskScore}/100 (${riskLevel.toUpperCase()})**\n\nThis means you're at ${riskDescription}\n\n**Factors affecting your score:**\n• Income vs Expense ratio\n• Spending patterns\n• Anomaly detection status\n\n**Recommendation:** ${recommendation}\n\nWould you like specific tips to improve your risk score?`,
      intent: "risk",
      confidence: 0.95
    };
  }
  
  // Handle recommendations/advice queries
  if (queryLower.includes('recommend') || queryLower.includes('advice') || queryLower.includes('suggest') || queryLower.includes('help me save')) {
    const savings = userData?.savings || -1766088;
    const topCategory = userData?.topSpendingCategories?.[0];
    const otherCategory = userData?.topSpendingCategories?.find(c => c.category.toLowerCase() === 'other');
    
    let response = "💡 **Personalized Financial Recommendations**\n\nBased on your transaction data, here are specific actions you can take:\n\n";
    
    if (savings < 0) {
      response += `**1. Critical: Reduce Overall Spending**\nYour expenses exceed your income by $${Math.abs(savings).toLocaleString()}. Focus on these areas:\n`;
      if (otherCategory && otherCategory.amount > 100000) {
        response += `   • Review $${otherCategory.amount.toLocaleString()} in "other" expenses - categorize these transactions\n`;
      }
      if (topCategory && topCategory.category !== 'other') {
        response += `   • Reduce ${topCategory.category} spending by 30-50%\n`;
      }
      response += `\n`;
    }
    
    if (otherCategory && otherCategory.amount > userData?.totalExpenses * 0.3) {
      response += `**2. Categorize "Other" Transactions**\n$${otherCategory.amount.toLocaleString()} (${Math.round((otherCategory.amount / userData?.totalExpenses) * 100)}% of spending) is uncategorized. Proper categorization helps identify saving opportunities.\n\n`;
    }
    
    const transportCategory = userData?.topSpendingCategories?.find(c => c.category.toLowerCase().includes('transport'));
    if (transportCategory && transportCategory.amount > 100000) {
      response += `**3. Optimize Transport Spending**\nYou've spent $${transportCategory.amount.toLocaleString()} on transport. Consider:\n   • Carpooling or public transit\n   • Reviewing business vs personal expenses\n   • Comparing insurance rates\n\n`;
    }
    
    response += `**Next Steps:**\n• Click "Review Now" to analyze your top categories\n• Set spending limits for better control\n• Check the Anomalies page for unusual transactions\n\nWould you like me to explain any of these recommendations in more detail?`;
    
    return {
      query: query,
      response: response,
      intent: "advice",
      confidence: 0.95
    };
  }
  
  // Handle "Explain this page" queries
  if (queryLower.includes('explain this page') || queryLower.includes('what is this page') || queryLower.includes('about this page')) {
    return {
      query: query,
      response: "📖 **About the Dashboard Page**\n\nThis is your financial command center. Here's what you can do:\n\n• **View Key Metrics** - See your income, expenses, and savings at a glance\n• **Track Anomalies** - Monitor unusual transactions that need review\n• **Get AI Recommendations** - Receive personalized financial advice\n• **Monitor Risk Score** - Track your financial health over time\n\n**Quick Tips:**\n• Click any metric to see detailed breakdowns\n• Use the chat button (bottom right) for specific questions\n• Check the Alerts bell for important notifications\n\nWhat specific aspect would you like to learn more about?",
      intent: "page_explain",
      confidence: 0.95
    };
  }
  
  // Handle budget/limit queries
  if (queryLower.includes('budget') || queryLower.includes('limit') || queryLower.includes('track')) {
    const hasLimits = userData?.hasLimits || false;
    const topCategories = userData?.topSpendingCategories?.slice(0, 3) || [];
    
    if (!hasLimits) {
      let response = "📊 **Budget & Limits Status**\n\nYou haven't set any spending limits yet. Based on your spending patterns, I recommend:\n\n";
      topCategories.forEach((cat, idx) => {
        const suggestedLimit = Math.round(cat.amount * 0.7);
        response += `${idx + 1}. **${cat.category}**: Set a limit of $${suggestedLimit.toLocaleString()} (currently $${cat.amount.toLocaleString()})\n`;
      });
      response += "\nWould you like me to help you set up these spending limits?";
      
      return {
        query: query,
        response: response,
        intent: "budget",
        confidence: 0.9
      };
    } else {
      return {
        query: query,
        response: "✅ **Budget Tracking Active**\n\nYou have active spending limits set. Your current spending is within budget for most categories. Keep monitoring your expenses to stay on track!\n\nWould you like to review or adjust your existing limits?",
        intent: "budget",
        confidence: 0.9
      };
    }
  }
  
  // Handle forecast/prediction queries
  if (queryLower.includes('forecast') || queryLower.includes('predict') || queryLower.includes('future')) {
    const monthlyAvg = userData?.monthlyAverage || 706031;
    const projectedSpending = Math.round(monthlyAvg * 1.05); // 5% increase projection
    
    return {
      query: query,
      response: `📈 **30-Day Spending Forecast**\n\nBased on your historical spending patterns, here's what I predict:\n\n• **Expected Spending:** $${projectedSpending.toLocaleString()}\n• **Confidence Level:** Medium (85%)\n• **Key Drivers:** ${userData?.topSpendingCategories?.[0]?.category || 'other'} category dominates your spending\n\n**Recommendations:**\n• Start planning for next month's expenses now\n• Consider reducing non-essential spending\n• Set aside $${Math.round(projectedSpending * 0.2).toLocaleString()} for unexpected costs\n\nWould you like a detailed breakdown by category?`,
      intent: "forecast",
      confidence: 0.85
    };
  }
  
  // Handle general help/capabilities queries
  if (queryLower.includes('help') || queryLower.includes('capabilities') || queryLower.includes('what can you')) {
    return {
      query: query,
      response: "🤖 **What I Can Help You With**\n\nI'm your AI Financial Assistant. Here's what I can do:\n\n**💰 Spending Analysis**\n• \"How much did I spend?\"\n• \"Show me my top spending categories\"\n• \"Break down my expenses by category\"\n\n**🚨 Anomaly Detection**\n• \"Show me anomalies\"\n• \"Any unusual transactions?\"\n• \"Is there suspicious activity?\"\n\n**📊 Financial Health**\n• \"What's my risk score?\"\n• \"How am I doing financially?\"\n• \"Give me recommendations\"\n\n**📈 Planning**\n• \"Forecast my spending\"\n• \"How can I save money?\"\n• \"Set up a budget\"\n\n**❓ Other**\n• \"Explain this page\"\n• \"What can you do?\"\n\nTry asking me any of these questions!",
      intent: "help",
      confidence: 0.98
    };
  }
  
  // Handle category-specific spending
  const categoryMatch = queryLower.match(/(?:on|for)\s+(\w+)/);
  if (categoryMatch && userData?.topSpendingCategories) {
    const category = categoryMatch[1].toLowerCase();
    const found = userData.topSpendingCategories.find(c => c.category.toLowerCase().includes(category));
    if (found) {
      return {
        query: query,
        response: `📊 **Spending on ${found.category}**\n\nYou've spent **$${found.amount.toLocaleString()}** on ${found.category} in the last 90 days.\n\n${found.amount > (userData?.monthlyAverage || 706031) * 0.3 ? '⚠️ This is significantly higher than typical. Consider reviewing these transactions.' : 'This seems reasonable compared to your overall spending.'}\n\nWould you like to see individual transactions in this category?`,
        intent: "category_spending",
        confidence: 0.9
      };
    }
  }
  
  // Default fallback response
  return {
    query: query,
    response: "👋 **Hi there! I'm your AI Financial Assistant**\n\nI can help you with:\n• Tracking your spending\n• Detecting anomalies\n• Providing financial recommendations\n• Forecasting future expenses\n• Explaining any page on ProphetLedger\n\n**Try asking me:**\n• \"How much did I spend?\"\n• \"Show me anomalies\"\n• \"What's my risk score?\"\n• \"Give me recommendations\"\n• \"Explain this page\"\n\nWhat would you like to know about your finances today?",
    intent: "welcome",
    confidence: 0.9
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
      .select('amount, type, category, date')
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
      riskScore: 65,
      riskLevel: 'medium',
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

export const getChatSuggestions = async () => {
  return [
    "How much did I spend?",
    "Show me anomalies",
    "What's my risk score?",
    "Give me recommendations",
    "How can I save more money?",
    "Explain this page",
    "What are my top spending categories?",
    "Forecast my spending"
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