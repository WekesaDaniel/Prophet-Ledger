// frontend/src/services/chatService.js
import api from './api';

export const sendChatMessage = async (query) => {
  try {
    console.log('📤 Sending chat message:', query);
    const response = await api.post('/chatbot/query', { query });
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
      "How am I doing on my budget?",
      "What AI model are you using?",
      "Give me financial advice"
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

// Get financial advice based on user context
export const getFinancialAdvice = async (userContext) => {
  try {
    // Create a detailed prompt for the AI
    const prompt = `As a financial AI assistant, provide personalized advice based on this user's financial data:
    
Financial Summary:
- Total Income: $${userContext.totalIncome?.toLocaleString() || 0}
- Total Expenses: $${userContext.totalExpenses?.toLocaleString() || 0}
- Net Savings: $${userContext.savings?.toLocaleString() || 0}
- Savings Rate: ${userContext.savingsRate?.toFixed(1) || 0}%
- Top Spending Categories: ${userContext.topSpendingCategories?.map(c => `${c.category} ($${c.amount?.toLocaleString()})`).join(', ') || 'None'}
- Active Anomalies: ${userContext.anomalyCount || 0}

Provide 2-3 actionable recommendations. Keep them concise and specific to their data.`;

    const response = await api.post('/chatbot/query', { query: prompt });
    return response.data;
  } catch (error) {
    console.error('Failed to get financial advice:', error);
    return null;
  }
};

// Get spending analysis
export const getSpendingAnalysis = async (category = null) => {
  try {
    const query = category 
      ? `Analyze my spending on ${category} and provide insights` 
      : 'Analyze my overall spending patterns and provide insights';
    const response = await api.post('/chatbot/query', { query });
    return response.data;
  } catch (error) {
    console.error('Failed to get spending analysis:', error);
    return null;
  }
};

// Get savings recommendations
export const getSavingsRecommendations = async (userContext) => {
  try {
    const prompt = `Based on this user's financial data:
- Monthly Income: $${userContext.totalIncome?.toLocaleString() || 0}
- Monthly Expenses: $${userContext.totalExpenses?.toLocaleString() || 0}
- Top Categories: ${userContext.topSpendingCategories?.map(c => c.category).join(', ') || 'None'}

Provide 3 specific ways this user could save more money each month. Be practical and actionable.`;

    const response = await api.post('/chatbot/query', { query: prompt });
    return response.data;
  } catch (error) {
    console.error('Failed to get savings recommendations:', error);
    return null;
  }
};

// Get budget recommendations
export const getBudgetRecommendations = async (userContext) => {
  try {
    const prompt = `Create a suggested monthly budget for a user with:
- Monthly Income: $${userContext.totalIncome?.toLocaleString() || 0}
- Current top spending categories: ${userContext.topSpendingCategories?.map(c => c.category).join(', ') || 'None'}

Provide percentage allocations for: Housing, Food, Transport, Entertainment, Savings, and Other.`;

    const response = await api.post('/chatbot/query', { query: prompt });
    return response.data;
  } catch (error) {
    console.error('Failed to get budget recommendations:', error);
    return null;
  }
};

// Get anomaly explanation
export const explainAnomaly = async (anomaly) => {
  try {
    const prompt = `Explain why this transaction might be an anomaly:
- Description: ${anomaly.description}
- Amount: $${anomaly.amount}
- Category: ${anomaly.category}
- Reason: ${anomaly.reason}

Provide a brief explanation and suggest whether the user should review it.`;

    const response = await api.post('/chatbot/query', { query: prompt });
    return response.data;
  } catch (error) {
    console.error('Failed to explain anomaly:', error);
    return null;
  }
};

// Get forecast explanation
export const explainForecast = async (metric, predictedValue, currentValue) => {
  try {
    const prompt = `Explain this financial forecast:
- Metric: ${metric}
- Current value: $${currentValue}
- Predicted value: $${predictedValue}
- Timeframe: Next 30 days

Provide a brief explanation of what this means for the user.`;

    const response = await api.post('/chatbot/query', { query: prompt });
    return response.data;
  } catch (error) {
    console.error('Failed to explain forecast:', error);
    return null;
  }
};