// frontend/src/pages/AIAssistant.jsx
import React from 'react';
import Chatbot from '../components/chat/Chatbot';
import { Bot, Sparkles, MessageSquare, TrendingUp, Shield } from 'lucide-react';

const AIAssistant = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-8 px-4">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold flex items-center">
              <Bot className="w-6 h-6 mr-2 text-purple-600" />
              AI Financial Assistant
            </h1>
            <p className="text-gray-600 mt-1">Your intelligent financial companion, powered by AI</p>
          </div>
          <div className="flex items-center space-x-2 text-sm text-purple-600 bg-purple-50 px-3 py-1 rounded-full">
            <Sparkles className="w-4 h-4" />
            <span>AI Powered</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Chatbot Panel */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-lg h-[600px] overflow-hidden">
              <Chatbot full />
            </div>
          </div>

          {/* Info Panel */}
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg p-6">
              <MessageSquare className="w-10 h-10 mb-3 opacity-80" />
              <h3 className="text-lg font-semibold">Ask Me Anything</h3>
              <p className="text-sm opacity-90 mt-1">Get instant answers about your finances</p>
            </div>

            <div className="bg-white rounded-lg shadow p-4">
              <h4 className="font-semibold mb-3 flex items-center">
                <TrendingUp className="w-4 h-4 mr-2 text-green-600" />
                Example Questions
              </h4>
              <ul className="space-y-2 text-sm">
                <li className="text-blue-600 hover:underline cursor-pointer">How much did I spend this month?</li>
                <li className="text-blue-600 hover:underline cursor-pointer">Show me unusual transactions</li>
                <li className="text-blue-600 hover:underline cursor-pointer">What's my current balance?</li>
                <li className="text-blue-600 hover:underline cursor-pointer">Forecast my spending for next month</li>
                <li className="text-blue-600 hover:underline cursor-pointer">How can I save more money?</li>
                <li className="text-blue-600 hover:underline cursor-pointer">Compare this month to last month</li>
              </ul>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-semibold mb-2 flex items-center">
                <Shield className="w-4 h-4 mr-2 text-blue-600" />
                Privacy Guarantee
              </h4>
              <p className="text-xs text-gray-500">
                Your financial data is encrypted and secure. AI processes happen locally when possible.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIAssistant;