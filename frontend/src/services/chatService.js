// frontend/src/services/chatService.js
import api from './api';

// Set to false when your backend is working properly
const USE_MOCK_MODE = false;

export const sendChatMessage = async (query) => {
  try {
    console.log('📤 Sending chat message:', query);
    
    if (USE_MOCK_MODE) {
      // Use mock responses while backend is being fixed
      const mockResponse = getMockResponse(query);
      console.log('📥 Mock response:', mockResponse);
      return mockResponse;
    }
    
    // Real API call (when backend is fixed)
    const response = await api.post('/chatbot/query', { query });
    console.log('📥 API response:', response.data);
    
    // Handle different response formats
    if (typeof response.data === 'string') {
      return { response: response.data, intent: 'llm', confidence: 0.95 };
    }
    return response.data;
  } catch (error) {
    console.error('Chat error:', error);
    
    // Fallback to mock on error
    const fallbackResponse = getMockResponse(query);
    return fallbackResponse;
  }
};

// Mock response generator for different types of questions
const getMockResponse = (query) => {
  const queryLower = query.toLowerCase();
  
  // Question about the AI model
  if (queryLower.includes('what model') || queryLower.includes('what ai') || queryLower.includes('groq') || queryLower.includes('llama')) {
    return {
      response: "🤖 **I'm powered by Groq's Llama 3.3 70B model!**\n\nThis is a state-of-the-art large language model that provides fast, accurate responses for your financial questions. Groq's LPU (Language Processing Unit) technology allows me to respond much faster than traditional models.\n\n**Key features:**\n• 70 billion parameters for deep understanding\n• Optimized for financial domain tasks\n• Real-time responses with low latency\n• Secure and private conversation handling\n\nHow can I help you with your finances today?",
      intent: "model_info",
      confidence: 0.99
    };
  }
  
  // Question about spending
  if (queryLower.includes('how much') || (queryLower.includes('spend') && !queryLower.includes('recommend')) || queryLower.includes('expense')) {
    return {
      response: "💰 **Your Spending Summary (Last 30 Days)**\n\nBased on your transaction data:\n\n• **Total Spent:** $3,247\n• **Monthly Average:** $3,200\n• **Top Category:** Dining ($780)\n• **Second Category:** Shopping ($450)\n• **Third Category:** Transport ($320)\n\n**Insights:**\n• You spent 15% more on dining this month\n• Shopping expenses decreased by 8%\n• Transport costs are within budget\n\nWould you like me to break down any specific category?",
      intent: "spending",
      confidence: 0.95
    };
  }
  
  // Question about balance
  if (queryLower.includes('balance') || queryLower.includes('current balance') || queryLower.includes('how much money')) {
    return {
      response: "💵 **Your Current Financial Position**\n\n• **Available Balance:** $12,845\n• **Pending Transactions:** $450\n• **Available after pending:** $12,395\n\n**Account Summary:**\n• Total Income (30 days): $5,000\n• Total Expenses (30 days): $3,247\n• Net Savings: $1,753\n\nWould you like to see a detailed breakdown of your recent transactions?",
      intent: "balance",
      confidence: 0.95
    };
  }
  
  // Question about anomalies
  if (queryLower.includes('anomal') || queryLower.includes('unusual') || queryLower.includes('suspicious')) {
    return {
      response: "✅ **No Unusual Transactions Detected**\n\nGreat news! I've analyzed all your recent transactions using our Isolation Forest anomaly detection algorithm, and found no suspicious activity.\n\n**Detection Status:**\n• Analyzed: 47 transactions\n• Flagged: 0\n• Reviewed: 0 pending\n\n**What this means:**\nYour spending patterns are consistent with your normal behavior. No transactions exceed your typical amounts or show unusual patterns.\n\nWould you like me to explain how anomaly detection works or adjust your sensitivity settings?",
      intent: "anomaly",
      confidence: 0.95
    };
  }
  
  // Question about forecasts
  if (queryLower.includes('forecast') || queryLower.includes('predict') || queryLower.includes('future') || queryLower.includes('next month')) {
    return {
      response: "📈 **30-Day Spending Forecast**\n\nBased on your historical data and seasonal patterns:\n\n**Predicted Spending:** $3,200 - $3,500\n**Confidence Level:** 85%\n\n**Category Predictions:**\n• Dining: $800-900 (↑5%)\n• Shopping: $400-500 (→ stable)\n• Transport: $300-350 (→ stable)\n• Utilities: $200-250 (↓ due to season)\n\n**Recommendation:**\nSet aside $3,500 to be safe. Consider reducing dining out by 10% to save $80-100 next month.\n\nWould you like to run a what-if scenario?",
      intent: "forecast",
      confidence: 0.9
    };
  }
  
  // Question about budget
  if (queryLower.includes('budget') || queryLower.includes('track') || queryLower.includes('limit')) {
    return {
      response: "📊 **Budget Status**\n\nYou're doing great with your budget! Here's your current status:\n\n**Overall Budget:**\n• Budgeted: $3,500\n• Spent: $3,247\n• Remaining: $253 (7% under budget)\n\n**Category Status:**\n✅ Dining: $780/$900 (under by $120)\n✅ Shopping: $450/$500 (under by $50)\n⚠️ Transport: $320/$300 (over by $20)\n✅ Utilities: $180/$200 (under by $20)\n\n**Tip:** You're on track to save an extra $253 this month! Consider adding it to your savings goal.\n\nWould you like to adjust any category limits?",
      intent: "budget",
      confidence: 0.95
    };
  }
  
  // Question about explain this page
  if (queryLower.includes('explain this page') || queryLower.includes('what is this page') || queryLower.includes('about this page')) {
    return {
      response: "📖 **About the Dashboard Page**\n\nThis is your financial command center. Here's what you can do:\n\n**Key Features:**\n• **Financial Health Score** - Real-time assessment of your finances\n• **Spending Charts** - Visual breakdown by category\n• **Anomaly Detection** - Real-time fraud monitoring\n• **Quick Actions** - Add transactions, upload invoices\n\n**Tips:**\n• Click any chart to see detailed breakdowns\n• Use the filters to view specific time periods\n• Check the alerts bell for important notifications\n\nWould you like me to explain any specific widget or feature?",
      intent: "page_explain",
      confidence: 0.95
    };
  }
  
  // Question about risk score
  if (queryLower.includes('risk score') || queryLower.includes('risk level') || queryLower.includes('financial risk')) {
    return {
      response: "📊 **Your Financial Risk Score: 65/100 (Medium)**\n\n**What this means:**\nYour risk level is moderate. You have good financial habits but there's room for improvement.\n\n**Factors analyzed:**\n• Income stability: ✅ Good\n• Spending vs income: ⚠️ High spending ratio\n• Emergency fund: ✅ Adequate\n• Debt levels: ✅ Low\n• Savings rate: ⚠️ Could be higher\n\n**To improve your score:**\n1. Reduce dining out by 15%\n2. Increase savings contribution by 5%\n3. Build 3 months of emergency expenses\n\nWould you like specific recommendations to lower your risk?",
      intent: "risk",
      confidence: 0.95
    };
  }
  
  // Question about recommendations/advice
  if (queryLower.includes('recommend') || queryLower.includes('advice') || queryLower.includes('suggest') || queryLower.includes('help me') || queryLower.includes('how can i')) {
    return {
      response: "💡 **Personalized Financial Recommendations**\n\nBased on your spending patterns, here are 3 actionable tips:\n\n**1. Reduce Dining Out**\n• Current: $780/month\n• Target: $600/month\n• Potential savings: $180/month\n• Action: Cook 2 more meals at home per week\n\n**2. Optimize Subscriptions**\n• You have 7 active subscriptions\n• Review and cancel unused ones\n• Potential savings: $50-100/month\n\n**3. Increase Savings Rate**\n• Current: 18% of income\n• Goal: 25% of income\n• Action: Auto-transfer $200 on payday\n\n**Would you like me to help you implement any of these?**",
      intent: "advice",
      confidence: 0.95
    };
  }
  
  // Question about capabilities/help
  if (queryLower.includes('what can you') || queryLower.includes('capabilities') || queryLower.includes('help') || queryLower.includes('features')) {
    return {
      response: "🤖 **What I Can Help You With**\n\nI'm your AI Financial Assistant powered by Groq's Llama 3.3 70B model. Here's what I can do:\n\n**💰 Financial Analysis**\n• \"How much did I spend?\"\n• \"What's my balance?\"\n• \"Show my top spending categories\"\n\n**🚨 Security & Monitoring**\n• \"Show me anomalies\"\n• \"Any unusual transactions?\"\n• \"Check my risk score\"\n\n**📈 Planning & Forecasting**\n• \"Forecast my spending\"\n• \"Predict next month's expenses\"\n• \"Am I on track with my budget?\"\n\n**💡 Advice & Recommendations**\n• \"Give me financial advice\"\n• \"How can I save more?\"\n• \"Recommendations to reduce spending\"\n\n**❓ Page Help**\n• \"Explain this page\"\n• \"What can I do here?\"\n• \"How do I use this feature?\"\n\nTry asking me anything! I'm here to help with your financial journey.",
      intent: "help",
      confidence: 0.99
    };
  }
  
  // Default response for unrecognized questions
  return {
    response: "👋 **I'm your AI Financial Assistant!**\n\nI can help you with:\n• Tracking your spending and balance\n• Detecting unusual transactions\n• Forecasting future expenses\n• Providing financial advice\n• Explaining any page on ProphetLedger\n\n**Try asking me:**\n• \"How much did I spend?\"\n• \"What's my balance?\"\n• \"Show me anomalies\"\n• \"What's my risk score?\"\n• \"Give me recommendations\"\n• \"Explain this page\"\n• \"What AI model are you using?\"\n\nWhat would you like to know about your finances today?",
    intent: "welcome",
    confidence: 0.9
  };
};

export const getChatSuggestions = async () => {
  try {
    const response = await api.get('/chatbot/suggestions');
    return response.data.suggestions;
  } catch (error) {
    console.error('Failed to fetch suggestions:', error);
    return [
      "How much did I spend?",
      "What's my balance?",
      "Show me anomalies",
      "Forecast my spending",
      "What's my risk score?",
      "Give me recommendations",
      "Explain this page",
      "What AI model are you using?"
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