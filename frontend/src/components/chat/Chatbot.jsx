// frontend/src/components/chat/Chatbot.jsx
import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, Send, X, Minimize2, Maximize2, Bot, User, HelpCircle, Sparkles, Loader } from 'lucide-react';
import { sendChatMessage, fetchUserFinancialData } from '../../services/chatService';
import { supabase } from '../../services/supabaseClient';

const Chatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState([
    { 
      id: 1, 
      text: "Hello! I'm your AI Financial Assistant. I can see which page you're on and have access to your financial data. Ask me anything about your finances or this page!", 
      sender: 'bot', 
      timestamp: new Date() 
    }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [currentPage, setCurrentPage] = useState(null);
  const [pageData, setPageData] = useState(null);
  const [userData, setUserData] = useState(null);
  const messagesEndRef = useRef(null);

  // Get current page and its data
  const getCurrentPageData = async () => {
    const path = window.location.pathname;
    const page = path.replace('/', '') || 'dashboard';
    
    let data = {};
    const { data: { user } } = await supabase.auth.getUser();
    
    switch(page) {
      case 'dashboard':
        // Fetch dashboard KPIs
        const { data: kpis } = await supabase
          .from('kpis')
          .select('*')
          .eq('user_id', user?.id)
          .limit(4);
        data = { kpis: kpis || [] };
        break;
        
      case 'transactions':
        // Fetch recent transactions
        const { data: transactions } = await supabase
          .from('transactions')
          .select('*')
          .eq('user_id', user?.id)
          .order('date', { ascending: false })
          .limit(10);
        data = { transactions: transactions || [], total: transactions?.length || 0 };
        break;
        
      case 'invoices':
        // Fetch invoices
        const { data: invoices } = await supabase
          .from('invoices')
          .select('*')
          .eq('user_id', user?.id)
          .order('created_at', { ascending: false })
          .limit(10);
        data = { invoices: invoices || [], total: invoices?.length || 0 };
        break;
        
      case 'anomalies':
        // Fetch anomalies
        const { data: anomalies } = await supabase
          .from('anomalies')
          .select('*')
          .eq('user_id', user?.id)
          .eq('status', 'pending');
        data = { anomalies: anomalies || [], count: anomalies?.length || 0 };
        break;
        
      case 'forecasts':
        // Fetch forecast data
        const { data: forecasts } = await supabase
          .from('forecasts')
          .select('*')
          .eq('user_id', user?.id)
          .order('period_start', { ascending: false })
          .limit(1);
        data = { forecasts: forecasts || [] };
        break;
        
      case 'dss':
        // Fetch risk score
        const { data: risk } = await supabase
          .from('risk_scores')
          .select('*')
          .eq('user_id', user?.id)
          .order('created_at', { ascending: false })
          .limit(1);
        data = { riskScore: risk?.[0] || null };
        break;
        
      default:
        data = { page: page };
    }
    
    return { page, data };
  };

  // Get page-specific greeting
  const getPageGreeting = (page) => {
    const greetings = {
      'dashboard': "I can see your dashboard with key metrics and KPIs. Ask me about your financial health, spending, or anomalies!",
      'transactions': "You're on the Transactions page. I can help you analyze your spending patterns or find specific transactions.",
      'invoices': "You're on the Invoices page. I can help you understand your uploaded invoices or explain extracted data.",
      'forecasts': "You're on the Forecasts page. I can explain predictions and help you plan your finances.",
      'anomalies': "You're on the Anomalies page. I can explain detected anomalies and help you review them.",
      'dss': "You're on the Decision Support page. I can help you understand risk scores and run what-if scenarios.",
      'reports': "You're on the Reports page. I can help you understand financial reports and trends.",
      'settings': "You're on the Settings page. I can help you configure your preferences.",
      'default': "I can see which page you're on. Ask me anything about this page or your finances!"
    };
    return greetings[page] || greetings['default'];
  };

  // Load page context and user data
  useEffect(() => {
    const loadContext = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const financialData = await fetchUserFinancialData(user.id);
        setUserData(financialData);
      }
      
      const pageContext = await getCurrentPageData();
      setCurrentPage(pageContext.page);
      setPageData(pageContext.data);
      
      // Add page-aware greeting
      const greeting = getPageGreeting(pageContext.page);
      const pageSpecificInfo = getPageSpecificInfo(pageContext.page, pageContext.data);
      
      setMessages([
        { 
          id: 1, 
          text: `Hello! I'm your AI Financial Assistant. ${greeting}\n\n${pageSpecificInfo}`, 
          sender: 'bot', 
          timestamp: new Date() 
        }
      ]);
    };
    
    loadContext();
  }, []);

  const getPageSpecificInfo = (page, data) => {
    switch(page) {
      case 'dashboard':
        if (data.kpis?.length) {
          return `📊 **Current Dashboard Stats:**\n• Financial Health: ${data.kpis[0]?.value || 'N/A'}\n• Active Anomalies: ${userData?.anomalyCount || 0}`;
        }
        return "💡 Tip: Ask me 'What are my key metrics?' or 'Show me my financial health'";
        
      case 'transactions':
        return `📋 You have ${data.total || 0} transactions. ${userData?.topSpendingCategories?.length ? `Your top category is ${userData.topSpendingCategories[0]?.category}.` : ''}`;
        
      case 'invoices':
        return `📄 You have ${data.total || 0} invoices. Upload a new one to get started!`;
        
      case 'anomalies':
        return `🚨 You have ${data.count || 0} pending anomalies. Ask me to explain them!`;
        
      case 'forecasts':
        return `📈 Ask me about your cash flow forecast or spending predictions.`;
        
      case 'dss':
        return `🎯 Your current risk score is ${data.riskScore?.risk_score || 'N/A'}. Ask me for recommendations!`;
        
      default:
        return "💡 What would you like to know about this page?";
    }
  };

  const formatMessageText = (text) => {
    if (!text) return '';
    
    let formattedText = text;
    
    // Fix double numbering
    formattedText = formattedText.replace(/(\d+)\.\s+\1\./g, '$1.');
    
    // Format bold
    formattedText = formattedText.replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold text-purple-600">$1</strong>');
    formattedText = formattedText.replace(/\*(.*?)\*/g, '<strong class="font-bold text-purple-600">$1</strong>');
    
    // Handle lists
    const lines = formattedText.split('\n');
    const processedLines = [];
    let inList = false;
    
    for (let line of lines) {
      const numberedMatch = line.match(/^(\d+)\.\s+(.+)$/);
      const bulletMatch = line.match(/^[-•*]\s+(.+)$/);
      
      if (numberedMatch) {
        if (!inList) {
          processedLines.push('<ol class="list-decimal pl-5 my-2 space-y-1">');
          inList = true;
        }
        processedLines.push(`<li class="text-sm text-gray-700">${numberedMatch[2]}</li>`);
      } 
      else if (bulletMatch) {
        if (!inList) {
          processedLines.push('<ul class="list-disc pl-5 my-2 space-y-1">');
          inList = true;
        }
        processedLines.push(`<li class="text-sm text-gray-700">${bulletMatch[1]}</li>`);
      }
      else {
        if (inList) {
          processedLines.push('</ul>');
          inList = false;
        }
        if (line.trim()) processedLines.push(line);
      }
    }
    
    if (inList) processedLines.push('</ul>');
    
    formattedText = processedLines.join('\n');
    formattedText = formattedText.replace(/\n/g, '<br/>');
    
    return formattedText;
  };

  const handleExplainPage = () => {
    const pageName = currentPage?.charAt(0).toUpperCase() + currentPage?.slice(1) || 'Dashboard';
    const description = getPageDescription(currentPage);
    const stats = getPageSpecificInfo(currentPage, pageData);
    
    const botMessage = { 
      id: Date.now(), 
      text: `📄 **About ${pageName} Page**:\n\n${description}\n\n${stats}\n\nWhat specific information would you like to know?`, 
      sender: 'bot', 
      timestamp: new Date() 
    };
    setMessages(prev => [...prev, botMessage]);
  };

  const getPageDescription = (page) => {
    const descriptions = {
      'dashboard': 'This is your main dashboard showing key metrics, financial health, KPIs, and anomaly detection results. You can see your spending trends and risk scores here.',
      'transactions': 'View and manage all your financial transactions. You can add, edit, or delete transactions, and see spending by category.',
      'invoices': 'Upload and manage PDF invoices. The AI extracts vendor names, amounts, and dates automatically using OCR technology.',
      'forecasts': 'AI-powered predictions of your future cash flow and expenses using ARIMA and LSTM models trained on your data.',
      'anomalies': 'Detect unusual transactions and potential fraud using Isolation Forest algorithm. Review and approve or dismiss flagged items.',
      'dss': 'Decision Support System with risk scoring, what-if simulations, and financial recommendations based on your data.',
      'reports': 'Generate and export custom financial reports including income statements and expense analysis.',
      'settings': 'Configure your account preferences, currency, notification settings, and security options.'
    };
    return descriptions[page] || 'This page provides financial insights and management tools.';
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
      // Include page context in the query
      const contextualQuery = `[Current Page: ${currentPage || 'unknown'}]\nUser Question: ${input}\n\nPage Data: ${JSON.stringify(pageData || {})}\nUser Financial Data: ${JSON.stringify(userData || {})}`;
      
      const response = await sendChatMessage(contextualQuery);
      
      let responseText = response.response;
      
      // Add page-specific footer
      if (currentPage && !responseText.includes('Based on your')) {
        responseText = `${responseText}\n\n*Based on your ${currentPage} page data.*`;
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

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

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
          <div className="px-4 pt-3 pb-2 border-b bg-gradient-to-r from-blue-50 to-purple-50">
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-500">📍 Current Page:</span>
              <span className="font-medium text-purple-600 capitalize">{currentPage || 'Dashboard'}</span>
              <button 
                onClick={handleExplainPage}
                className="flex items-center space-x-1 text-blue-600 hover:text-blue-800"
              >
                <Sparkles className="w-3 h-3" />
                <span>Explain</span>
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
            {messages.map((msg) => renderMessage(msg))}
            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-white border shadow-sm p-3 rounded-lg">
                  <div className="flex space-x-1 items-center">
                    <Loader className="w-4 h-4 text-purple-500 animate-spin" />
                    <span className="text-xs text-gray-400">Analyzing your page...</span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="p-3 border-t">
            <div className="flex space-x-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                placeholder={`Ask about this page or your finances...`}
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
            <div className="flex justify-center mt-2 space-x-2 flex-wrap gap-2">
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
                💰 My spending
              </button>
              <span className="text-gray-300">•</span>
              <button 
                onClick={() => setInput("Show me anomalies")}
                className="text-xs text-gray-400 hover:text-purple-600 transition-colors"
              >
                🚨 Anomalies
              </button>
              <span className="text-gray-300">•</span>
              <button 
                onClick={() => setInput("What's my risk score?")}
                className="text-xs text-gray-400 hover:text-purple-600 transition-colors"
              >
                📊 Risk score
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Chatbot;