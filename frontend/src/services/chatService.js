// frontend/src/services/chatService.js
import api from './api';

export const sendChatMessage = async (query) => {
  try {
    const response = await api.post('/chatbot/query', { query });
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