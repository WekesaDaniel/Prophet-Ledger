// frontend/src/components/chat/Chatbot.jsx
import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, Send, X, Minimize2, Maximize2, Bot, User, HelpCircle, Sparkles } from 'lucide-react';

const Chatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState([
    { 
      id: 1, 
      text: "Hello! I'm your AI Financial Assistant. I can help you understand any page or answer questions about your finances. Click the help button on any page or just ask me anything!", 
      sender: 'bot', 
      timestamp: new Date() 
    }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [context, setContext] = useState(null);
  const messagesEndRef = useRef(null);

  // Get current page context
  useEffect(() => {
    const currentPath = window.location.pathname;
    const pageName = currentPath.replace('/', '') || 'dashboard';
    setContext({
      page: pageName,
      description: getPageDescription(pageName)
    });
  }, [window.location.pathname]);

  const getPageDescription = (page) => {
    const descriptions = {
      'dashboard': 'This is your main dashboard showing key metrics, charts, and anomaly detection results.',
      'transactions': 'View and manage all your financial transactions. You can add, edit, or delete transactions here.',
      'invoices': 'Upload and manage PDF invoices. The AI extracts vendor names, amounts, and dates automatically.',
      'forecasts': 'AI-powered predictions of your future cash flow and expenses using ARIMA and LSTM models.',
      'anomalies': 'Detect unusual transactions and potential fraud using Isolation Forest algorithm.',
      'dss': 'Decision Support System with risk scoring, what-if simulations, and financial recommendations.',
      'reports': 'Generate and export custom financial reports including income statements and expense analysis.',
      'settings': 'Configure your account preferences, currency, notification settings, and security options.',
      'admin': 'Enterprise administration panel for user management and system settings.',
      'default': 'This page provides financial insights and management tools.'
    };
    return descriptions[page] || descriptions['default'];
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleExplainPage = () => {
    const currentPage = window.location.pathname.replace('/', '') || 'dashboard';
    const pageName = currentPage.charAt(0).toUpperCase() + currentPage.slice(1);
    const description = getPageDescription(currentPage);
    
    const botMessage = { 
      id: Date.now(), 
      text: `📄 **About ${pageName} Page**:\n\n${description}\n\nWhat specific information would you like to know about this page?`, 
      sender: 'bot', 
      timestamp: new Date() 
    };
    setMessages(prev => [...prev, botMessage]);
  };

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage = { id: Date.now(), text: input, sender: 'user', timestamp: new Date() };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    // Simulate AI response
    setTimeout(() => {
      let response = "";
      const lowerInput = input.toLowerCase();
      
      // Context-aware responses
      if (lowerInput.includes('explain') || lowerInput.includes('what is this') || lowerInput.includes('tell me about')) {
        response = `📖 ${getPageDescription(context?.page || 'dashboard')}\n\nIs there anything specific you'd like to know about this page?`;
      }
      else if (lowerInput.includes('help') || lowerInput.includes('how to')) {
        response = "💡 Here's how I can help:\n\n• Ask me to 'explain this page'\n• Ask about your spending: 'How much did I spend on food?'\n• Check your balance: 'What's my current balance?'\n• Get forecasts: 'Predict my spending for next month'\n• Find anomalies: 'Show me unusual transactions'";
      }
      else if (lowerInput.includes('spent') || lowerInput.includes('spend')) {
        response = "💰 You've spent $3,247 in the last 30 days. Your top categories are:\n• Dining: $780\n• Shopping: $450\n• Transport: $320\n\nWould you like a detailed breakdown?";
      }
      else if (lowerInput.includes('balance')) {
        response = "💵 Your current account balance is $12,845. This is up 8% from last month. Great job!";
      }
      else if (lowerInput.includes('forecast') || lowerInput.includes('predict')) {
        response = "📈 Based on your spending patterns, here's my forecast:\n• Next month: $3,200\n• 3 months: $9,800\n• 6 months: $19,500\n\nThis assumes your current spending habits continue.";
      }
      else if (lowerInput.includes('anomaly') || lowerInput.includes('unusual')) {
        response = "🚨 I've detected 3 unusual transactions in the past week:\n• Amazon: $1,249 (3x normal)\n• Uber: $187 (unusual frequency)\n• Restaurant: $345 (2.5x average)\n\nWould you like to review these?";
      }
      else {
        response = `I understand you're asking about "${input}". I can help with:\n\n• Explaining this page (try "explain this page")\n• Spending analysis\n• Balance inquiries\n• Financial forecasts\n• Anomaly detection\n\nWhat would you like to know more about?`;
      }
      
      const botMessage = { id: Date.now() + 1, text: response, sender: 'bot', timestamp: new Date() };
      setMessages(prev => [...prev, botMessage]);
      setIsTyping(false);
    }, 1000);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') handleSend();
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 bg-gradient-to-r from-purple-600 to-pink-600 text-white p-4 rounded-full shadow-lg hover:shadow-xl transition-all z-50 group"
      >
        <MessageSquare className="w-6 h-6" />
        <span className="absolute right-full mr-2 top-1/2 transform -translate-y-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
          Ask AI Assistant
        </span>
      </button>
    );
  }

  return (
    <div className={`fixed bottom-6 right-6 bg-white rounded-xl shadow-2xl flex flex-col z-50 transition-all ${isMinimized ? 'w-80 h-14' : 'w-96 h-[550px]'}`}>
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white p-3 rounded-t-xl flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <Bot className="w-5 h-5" />
          <span className="font-semibold">AI Financial Assistant</span>
          <button 
            onClick={handleExplainPage}
            className="ml-2 bg-white/20 hover:bg-white/30 p-1 rounded-full transition-colors"
            title="Explain this page"
          >
            <HelpCircle className="w-3 h-3" />
          </button>
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
          {/* Current Page Context */}
          <div className="px-4 pt-3 pb-2 border-b bg-gradient-to-r from-blue-50 to-purple-50">
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-500">📍 Current Page:</span>
              <span className="font-medium text-purple-600 capitalize">{context?.page || 'Dashboard'}</span>
              <button 
                onClick={handleExplainPage}
                className="flex items-center space-x-1 text-blue-600 hover:text-blue-800"
              >
                <Sparkles className="w-3 h-3" />
                <span>Explain</span>
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
            {messages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`flex items-start space-x-2 max-w-[85%] ${msg.sender === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}>
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${msg.sender === 'user' ? 'bg-blue-500' : 'bg-purple-500'}`}>
                    {msg.sender === 'user' ? <User className="w-3 h-3 text-white" /> : <Bot className="w-3 h-3 text-white" />}
                  </div>
                  <div className={`p-3 rounded-lg ${msg.sender === 'user' ? 'bg-blue-500 text-white' : 'bg-white border shadow-sm'}`}>
                    <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
                    <p className="text-xs opacity-70 mt-1">
                      {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
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

          {/* Input Area */}
          <div className="p-3 border-t">
            <div className="flex space-x-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask about this page or your finances..."
                className="flex-1 px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              <button 
                onClick={handleSend} 
                disabled={!input.trim()} 
                className="bg-purple-600 text-white p-2 rounded-lg hover:bg-purple-700 disabled:opacity-50 transition-colors"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
            <div className="flex justify-center mt-2 space-x-2">
              <button 
                onClick={() => setInput("Explain this page")}
                className="text-xs text-gray-400 hover:text-purple-600 transition-colors"
              >
                📖 Explain page
              </button>
              <span className="text-gray-300">•</span>
              <button 
                onClick={() => setInput("How much did I spend?")}
                className="text-xs text-gray-400 hover:text-purple-600 transition-colors"
              >
                💰 Spending
              </button>
              <span className="text-gray-300">•</span>
              <button 
                onClick={() => setInput("What's my balance?")}
                className="text-xs text-gray-400 hover:text-purple-600 transition-colors"
              >
                💵 Balance
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Chatbot;