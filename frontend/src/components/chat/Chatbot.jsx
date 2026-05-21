// frontend/src/components/chat/Chatbot.jsx
import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, Send, X, Minimize2, Maximize2, Bot, User, HelpCircle, Sparkles, Loader } from 'lucide-react';
import { sendChatMessage } from '../../services/chatService';

const Chatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState([
    { 
      id: 1, 
      text: "Hello! I'm your AI Financial Assistant powered by Groq's Llama 3.3 70B model. I can help you understand any page or answer questions about your finances. Click the help button on any page or just ask me anything!", 
      sender: 'bot', 
      timestamp: new Date() 
    }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [context, setContext] = useState(null);
  const messagesEndRef = useRef(null);

  // Format message text with markdown-style formatting using Tailwind
  const formatMessageText = (text) => {
    if (!text) return '';
    
    let formattedText = text;
    
    // Format bold text: **text** to <strong class="font-bold text-purple-600">
    formattedText = formattedText.replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold text-purple-600">$1</strong>');
    formattedText = formattedText.replace(/\*(.*?)\*/g, '<strong class="font-bold text-purple-600">$1</strong>');
    
    // Format bullet points: • item or - item or * item
    const lines = formattedText.split('\n');
    let inList = false;
    let processedLines = [];
    
    for (let i = 0; i < lines.length; i++) {
      let line = lines[i];
      
      // Check for bullet points
      if (line.match(/^[•\-\*]\s/)) {
        if (!inList) {
          processedLines.push('<ul class="list-disc list-inside space-y-1 my-2">');
          inList = true;
        }
        processedLines.push(`<li class="text-sm text-gray-700">${line.substring(2)}</li>`);
      } 
      // Check for numbered lists
      else if (line.match(/^\d+\.\s/)) {
        if (!inList) {
          processedLines.push('<ol class="list-decimal list-inside space-y-1 my-2">');
          inList = true;
        }
        processedLines.push(`<li class="text-sm text-gray-700">${line}</li>`);
      }
      // Regular text
      else {
        if (inList) {
          if (line.trim() === '') {
            // Close list on empty line
            if (processedLines[processedLines.length - 1]?.includes('</ul>') === false && 
                processedLines[processedLines.length - 1]?.includes('</ol>') === false) {
              processedLines.push(line.match(/^\d+\.\s/) ? '</ol>' : '</ul>');
            }
            inList = false;
          } else {
            processedLines.push(line);
          }
        } else {
          processedLines.push(line);
        }
      }
    }
    
    // Close any open list
    if (inList) {
      processedLines.push('</ul>');
    }
    
    formattedText = processedLines.join('\n');
    
    // Convert line breaks to <br /> (but not inside lists)
    formattedText = formattedText.replace(/\n/g, '<br />');
    
    // Clean up double <br /> tags
    formattedText = formattedText.replace(/(<br \/>){2,}/g, '<br />');
    
    // Add emoji replacements
    formattedText = formattedText.replace(/:\)/g, '😊');
    formattedText = formattedText.replace(/:\(/g, '😢');
    formattedText = formattedText.replace(/:D/g, '😃');
    formattedText = formattedText.replace(/<3/g, '❤️');
    
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
      
      const botMessage = { 
        id: Date.now() + 1, 
        text: response.response, 
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

  // Render message with HTML formatting using Tailwind classes
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
                    <span className="text-xs text-gray-400">AI is thinking...</span>
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
                disabled={!input.trim() || isTyping} 
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
              <span className="text-gray-300">•</span>
              <button 
                onClick={() => setInput("What AI model are you using?")}
                className="text-xs text-gray-400 hover:text-purple-600 transition-colors"
              >
                🤖 About AI
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Chatbot;