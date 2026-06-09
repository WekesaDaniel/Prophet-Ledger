// frontend/src/components/chat/Chatbot.jsx
import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, Send, X, Minimize2, Maximize2, Bot, User, HelpCircle, Sparkles, Loader } from 'lucide-react';
import { sendChatMessage, fetchUserFinancialData } from '../../services/chatService';

const Chatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState([
    { 
      id: 1, 
      text: "Hello! I'm your AI Financial Assistant. I have access to your actual financial data. Ask me about your spending, savings, anomalies, or for personalized advice!", 
      sender: 'bot', 
      timestamp: new Date() 
    }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [context, setContext] = useState(null);
  const [userData, setUserData] = useState(null);
  const messagesEndRef = useRef(null);

  // Format message text without double numbering
  const formatMessageText = (text) => {
    if (!text) return '';
    
    let formattedText = text;
    
    // Fix double numbering (e.g., "1. 1." → "1.")
    formattedText = formattedText.replace(/(\d+)\.\s+\1\./g, '$1.');
    formattedText = formattedText.replace(/(\d+)\.\s+(\d+)\./g, (match, p1, p2) => {
      if (p1 === p2) return `${p1}.`;
      return match;
    });
    
    // Format bold text
    formattedText = formattedText.replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold text-purple-600">$1</strong>');
    formattedText = formattedText.replace(/\*(.*?)\*/g, '<strong class="font-bold text-purple-600">$1</strong>');
    
    // Split into lines for list processing
    const lines = formattedText.split('\n');
    const processedLines = [];
    let inList = false;
    let listType = null;
    
    for (let i = 0; i < lines.length; i++) {
      let line = lines[i];
      
      // Check for numbered list (with proper numbering)
      const numberedMatch = line.match(/^(\d+)\.\s+(.+)$/);
      // Check for bullet list
      const bulletMatch = line.match(/^[-•*]\s+(.+)$/);
      
      if (numberedMatch) {
        if (!inList || listType !== 'numbered') {
          if (inList) processedLines.push('</ol>');
          processedLines.push('<ol class="list-decimal pl-5 my-2 space-y-1">');
          inList = true;
          listType = 'numbered';
        }
        processedLines.push(`<li class="text-sm text-gray-700">${numberedMatch[2]}</li>`);
      } 
      else if (bulletMatch) {
        if (!inList || listType !== 'bullet') {
          if (inList) processedLines.push('</ul>');
          processedLines.push('<ul class="list-disc pl-5 my-2 space-y-1">');
          inList = true;
          listType = 'bullet';
        }
        processedLines.push(`<li class="text-sm text-gray-700">${bulletMatch[1]}</li>`);
      }
      else {
        if (inList) {
          processedLines.push(listType === 'numbered' ? '</ol>' : '</ul>');
          inList = false;
          listType = null;
        }
        if (line.trim()) {
          processedLines.push(line);
        } else {
          processedLines.push('<br/>');
        }
      }
    }
    
    if (inList) {
      processedLines.push(listType === 'numbered' ? '</ol>' : '</ul>');
    }
    
    formattedText = processedLines.join('\n');
    
    // Convert line breaks
    formattedText = formattedText.replace(/\n/g, '<br/>');
    formattedText = formattedText.replace(/(<br\/>){3,}/g, '<br/><br/>');
    
    // Add emoji replacements
    formattedText = formattedText.replace(/:\)/g, '😊');
    formattedText = formattedText.replace(/:\(/g, '😢');
    formattedText = formattedText.replace(/:D/g, '😃');
    
    return formattedText;
  };

  // Get current page context
  useEffect(() => {
    const currentPath = window.location.pathname;
    const pageName = currentPath.replace('/', '') || 'dashboard';
    setContext({
      page: pageName,
      description: getPageDescription(pageName)
    });
  }, [window.location.pathname]);

  // Load user data for context-aware responses
  useEffect(() => {
    const loadUserData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const data = await fetchUserFinancialData(user.id);
        setUserData(data);
      }
    };
    loadUserData();
  }, []);

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

    const userMessage = { 
      id: Date.now(), 
      text: input, 
      sender: 'user', 
      timestamp: new Date() 
    };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    try {
      const response = await sendChatMessage(input);
      
      let responseText = response.response;
      
      // If we have user data, append confidence message
      if (userData && responseText && !responseText.includes('Based on your')) {
        responseText = `${responseText}\n\n*This recommendation is based on your actual financial data.*`;
      }
      
      const botMessage = { 
        id: Date.now() + 1, 
        text: responseText, 
        sender: 'bot', 
        timestamp: new Date() 
      };
      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage = { 
        id: Date.now() + 1, 
        text: "Sorry, I'm having trouble connecting right now. Please try again later.", 
        sender: 'bot', 
        timestamp: new Date() 
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') handleSend();
  };

  // Render message with HTML formatting
  const renderMessage = (msg) => {
    const formattedHtml = formatMessageText(msg.text);
    
    return (
      <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
        <div className={`flex items-start space-x-2 max-w-[85%] ${msg.sender === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}>
          <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${msg.sender === 'user' ? 'bg-blue-500' : 'bg-purple-500'}`}>
            {msg.sender === 'user' ? <User className="w-3 h-3 text-white" /> : <Bot className="w-3 h-3 text-white" />}
          </div>
          <div className={`p-3 rounded-lg ${msg.sender === 'user' ? 'bg-blue-500 text-white' : 'bg-white border shadow-sm'}`}>
            {msg.sender === 'user' ? (
              <p className="text-sm whitespace-pre-wrap break-words">{msg.text}</p>
            ) : (
              <div 
                className="text-sm prose prose-sm max-w-none prose-p:my-1 prose-ul:my-2 prose-li:my-0.5 prose-strong:text-purple-600 prose-strong:font-bold"
                dangerouslySetInnerHTML={{ __html: formattedHtml }}
              />
            )}
            <p className="text-xs opacity-70 mt-1">
              {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
        </div>
      </div>
    );
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
            {messages.map((msg) => renderMessage(msg))}
            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-white border shadow-sm p-3 rounded-lg">
                  <div className="flex space-x-1 items-center">
                    <Loader className="w-4 h-4 text-purple-500 animate-spin" />
                    <span className="text-xs text-gray-400">Analyzing your data...</span>
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
                placeholder="Ask about your finances..."
                className="flex-1 px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              <button 
                onClick={handleSend} 
                disabled={!input.trim() || isTyping} 
                className="bg-purple-600 text-white p-2 rounded-lg hover:bg-purple-700 disabled:opacity-50 transition-colors"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
            <div className="flex justify-center mt-2 space-x-2">
              <button 
                onClick={() => setInput("How much did I spend this month?")}
                className="text-xs text-gray-400 hover:text-purple-600 transition-colors"
              >
                💰 My spending
              </button>
              <span className="text-gray-300">•</span>
              <button 
                onClick={() => setInput("Show me my top spending categories")}
                className="text-xs text-gray-400 hover:text-purple-600 transition-colors"
              >
                📊 Top categories
              </button>
              <span className="text-gray-300">•</span>
              <button 
                onClick={() => setInput("How can I save more money?")}
                className="text-xs text-gray-400 hover:text-purple-600 transition-colors"
              >
                💡 Saving tips
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Chatbot;