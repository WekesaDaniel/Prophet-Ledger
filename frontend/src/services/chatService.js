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
    return [
      "How much did I spend on food?",
      "What is my current balance?",
      "Show me unusual transactions"
    ];
  }
};