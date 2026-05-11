// frontend/src/components/chat/Chatbot.jsx
import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, Send, X, Minimize2, Maximize2, Bot, User } from 'lucide-react';

// 🔴 HARDCODED RESPONSES - Replace with NLP API
const MOCK_RESPONSES = {
  'spent on food': 'You spent $450 on food in the last 30 days.',
  'spent on groceries': 'Your grocery spending is $320 this month.',
  'balance': 'Your current balance is $12,845.',
  'savings': 'You have saved $2,500 this month. Great job!',
  'forecast': 'Based on your spending patterns, next month you will spend around $3,200.',
  'anomaly': 'No unusual transactions detected in the last 7 days.',
  'budget': 'You are under budget by $350 this month.',
  'default': "I can help you with: spending queries, balance checks, forecasts, and anomalies. Try asking 'How much did I spend on food?'"
};

const Chatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState([
    { id: 1, text: "Hello! I'm your financial assistant. Ask me about your spending, balance, or forecasts!", sender: 'bot', timestamp: new Date() }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage = { id: Date.now(), text: input, sender: 'user', timestamp: new Date() };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    // 🔴 HARDCODED - Replace with: await api.post('/chatbot', { query: input })
    setTimeout(() => {
      let response = MOCK_RESPONSES.default;
      const lowerInput = input.toLowerCase();
      
      for (const [key, value] of Object.entries(MOCK_RESPONSES)) {
        if (lowerInput.includes(key)) {
          response = value;
          break;
        }
      }
      
      const botMessage = { id: Date.now() + 1, text: response, sender: 'bot', timestamp: new Date() };
      setMessages(prev => [...prev, botMessage]);
      setIsTyping(false);
    }, 1000);
    
    // ✅ TO DO: Replace with actual API call
    // try {
    //   const response = await api.post('/chatbot', { query: input });
    //   const botMessage = { id: Date.now() + 1, text: response.data.reply, sender: 'bot', timestamp: new Date() };
    //   setMessages(prev => [...prev, botMessage]);
    // } catch (error) {
    //   const errorMessage = { id: Date.now() + 1, text: 'Sorry, I had trouble processing that. Please try again.', sender: 'bot', timestamp: new Date() };
    //   setMessages(prev => [...prev, errorMessage]);
    // } finally {
    //   setIsTyping(false);
    // }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') handleSend();
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 bg-gradient-to-r from-purple-600 to-pink-600 text-white p-4 rounded-full shadow-lg hover:shadow-xl transition-all z-50"
      >
        <MessageSquare className="w-6 h-6" />
      </button>
    );
  }

  return (
    <div className={`fixed bottom-6 right-6 bg-white rounded-xl shadow-2xl flex flex-col z-50 transition-all ${isMinimized ? 'w-80 h-14' : 'w-96 h-[500px]'}`}>
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white p-3 rounded-t-xl flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <Bot className="w-5 h-5" />
          <span className="font-semibold">Financial Assistant</span>
        </div>
        <div className="flex space-x-2">
          <button onClick={() => setIsMinimized(!isMinimized)} className="hover:bg-purple-500 p-1 rounded">
            {isMinimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
          </button>
          <button onClick={() => setIsOpen(false)} className="hover:bg-purple-500 p-1 rounded">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {!isMinimized && (
        <>
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
            {messages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`flex items-start space-x-2 max-w-[80%] ${msg.sender === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${msg.sender === 'user' ? 'bg-blue-500' : 'bg-purple-500'}`}>
                    {msg.sender === 'user' ? <User className="w-4 h-4 text-white" /> : <Bot className="w-4 h-4 text-white" />}
                  </div>
                  <div className={`p-3 rounded-lg ${msg.sender === 'user' ? 'bg-blue-500 text-white' : 'bg-white border shadow-sm'}`}>
                    <p className="text-sm">{msg.text}</p>
                    <p className="text-xs opacity-70 mt-1">{msg.timestamp.toLocaleTimeString()}</p>
                  </div>
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-white border shadow-sm p-3 rounded-lg">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200"></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-3 border-t flex space-x-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask about your finances..."
              className="flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
            <button
              onClick={handleSend}
              disabled={!input.trim()}
              className="bg-purple-600 text-white p-2 rounded-lg hover:bg-purple-700 disabled:opacity-50"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default Chatbot;