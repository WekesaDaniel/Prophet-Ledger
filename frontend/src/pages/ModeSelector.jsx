// frontend/src/pages/ModeSelector.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMode } from '../contexts/ModeContext';
import { User, Briefcase, Building2, Check, DollarSign } from 'lucide-react';

const ModeSelector = () => {
  const { setMode, setCurrency } = useMode();
  const navigate = useNavigate();
  const [selectedMode, setSelectedMode] = useState(null);
  const [selectedCurrency, setSelectedCurrency] = useState('USD');

  const currencies = [
    { code: 'USD', symbol: '$', name: 'US Dollar', flag: '🇺🇸' },
    { code: 'EUR', symbol: '€', name: 'Euro', flag: '🇪🇺' },
    { code: 'GBP', symbol: '£', name: 'British Pound', flag: '🇬🇧' },
    { code: 'KES', symbol: 'KSh', name: 'Kenyan Shilling', flag: '🇰🇪' },
    { code: 'NGN', symbol: '₦', name: 'Nigerian Naira', flag: '🇳🇬' },
    { code: 'ZAR', symbol: 'R', name: 'South African Rand', flag: '🇿🇦' },
    { code: 'GHS', symbol: '₵', name: 'Ghanaian Cedi', flag: '🇬🇭' },
    { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar', flag: '🇨🇦' },
    { code: 'AUD', symbol: 'A$', name: 'Australian Dollar', flag: '🇦🇺' },
    { code: 'INR', symbol: '₹', name: 'Indian Rupee', flag: '🇮🇳' },
  ];

  const modes = [
    {
      id: 'personal',
      name: 'Personal',
      icon: User,
      description: 'Track personal finances, budgets, and savings goals',
      color: 'green',
      features: ['Budget tracking', 'Expense categorization', 'Basic forecasting'],
      aiFeatures: ['AI Chatbot', 'Anomaly Detection', 'Smart Predictions']
    },
    {
      id: 'small_business',
      name: 'Small Business',
      icon: Briefcase,
      description: 'Manage cash flow, invoices, and business insights',
      color: 'blue',
      features: ['Invoice scanning', 'Cash flow management', 'Risk scoring', 'What-if simulations'],
      aiFeatures: ['AI Chatbot', 'Anomaly Detection', 'Smart Predictions', 'Business Insights']
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
      icon: Building2,
      description: 'Full-scale financial intelligence for organizations',
      color: 'purple',
      features: ['Department analytics', 'Role-based access', 'Audit logs', 'Advanced DSS'],
      aiFeatures: ['AI Chatbot', 'Anomaly Detection', 'Smart Predictions', 'Enterprise Analytics', 'Compliance Monitoring']
    }
  ];

  const handleConfirm = () => {
    if (selectedMode && selectedCurrency) {
      setMode(selectedMode);
      setCurrency(selectedCurrency);
      localStorage.setItem('userCurrency', selectedCurrency);
      localStorage.setItem('userMode', selectedMode);
      navigate('/dashboard');
    }
  };

  const getCurrencySymbol = (code) => {
    const currency = currencies.find(c => c.code === code);
    return currency ? currency.symbol : '$';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
      <div className="max-w-6xl w-full">
        {/* Header */}
        <div className="text-center mb-8">
            <img
              src="/logo512.png"
              alt="ProphetLedger Logo"
              className="w-20 h-20 object-contain mx-auto"
            />
          
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Welcome to ProphetLedger
          </h1>
          <p className="text-gray-600 mt-2">
            Choose your experience and currency. All features adapt to your selection.
          </p>
        </div>

        {/* Currency Selector */}
        <div className="max-w-md mx-auto mb-8">
          <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
            <DollarSign className="w-4 h-4 mr-1" />
            Select your currency
          </label>
          <select
            value={selectedCurrency}
            onChange={(e) => setSelectedCurrency(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          >
            {currencies.map(currency => (
              <option key={currency.code} value={currency.code}>
                {currency.flag} {currency.code} - {currency.name} ({currency.symbol})
              </option>
            ))}
          </select>
          <p className="text-xs text-gray-500 mt-1">
            All financial data will be displayed in {getCurrencySymbol(selectedCurrency)}{selectedCurrency}
          </p>
        </div>

        {/* Mode cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {modes.map((mode) => {
            const Icon = mode.icon;
            const isSelected = selectedMode === mode.id;
            
            return (
              <div
                key={mode.id}
                onClick={() => setSelectedMode(mode.id)}
                className={`cursor-pointer rounded-xl p-6 transition-all duration-200 ${isSelected ? `ring-2 ring-${mode.color}-500 shadow-lg scale-105` : 'border border-gray-200 hover:shadow-md'}`}
              >
                <div className="flex justify-between items-start mb-4">
                  <div className={`p-3 rounded-xl ${isSelected ? `bg-${mode.color}-100` : 'bg-gray-100'}`}>
                    <Icon className={`w-6 h-6 ${isSelected ? `text-${mode.color}-600` : 'text-gray-500'}`} />
                  </div>
                  {isSelected && (
                    <div className={`w-6 h-6 rounded-full bg-${mode.color}-500 flex items-center justify-center`}>
                      <Check className="w-4 h-4 text-white" />
                    </div>
                  )}
                </div>
                
                <h3 className={`text-xl font-bold mb-2 ${isSelected ? `text-${mode.color}-600` : 'text-gray-800'}`}>
                  {mode.name}
                </h3>
                <p className="text-gray-500 text-sm mb-4">{mode.description}</p>
                
                <div className="border-t pt-4 mt-2">
                  <p className="text-xs font-semibold text-gray-600 mb-2">Features:</p>
                  <ul className="space-y-1">
                    {mode.features.map((feature, idx) => (
                      <li key={idx} className="text-xs text-gray-500 flex items-center">
                        <span className="w-1.5 h-1.5 bg-green-500 rounded-full mr-2"></span>
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="border-t pt-3 mt-3">
                  <p className="text-xs font-semibold text-blue-600 mb-1">🤖 AI Features (All Modes):</p>
                  <div className="flex flex-wrap gap-1">
                    {mode.aiFeatures.map((feature, idx) => (
                      <span key={idx} className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">
                        {feature}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Confirm button */}
        <div className="text-center">
          <button
            onClick={handleConfirm}
            disabled={!selectedMode || !selectedCurrency}
            className={`px-8 py-3 rounded-xl font-semibold text-white transition-all duration-200 ${
              selectedMode && selectedCurrency
                ? 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 cursor-pointer'
                : 'bg-gray-300 cursor-not-allowed'
            }`}
          >
            Continue to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
};

export default ModeSelector;