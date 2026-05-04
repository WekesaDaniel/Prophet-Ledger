import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMode } from '../contexts/ModeContext';
import { User, Briefcase, Building2, Check } from 'lucide-react';

const ModeSelector = () => {
  const { setMode } = useMode();
  const navigate = useNavigate();
  const [selectedMode, setSelectedMode] = useState(null);

  const modes = [
    {
      id: 'personal',
      name: 'Personal',
      icon: User,
      description: 'Track personal finances, budgets, and savings goals',
      color: 'green',
      features: ['Budget tracking', 'Expense categorization', 'Basic forecasting']
    },
    {
      id: 'small_business',
      name: 'Small Business',
      icon: Briefcase,
      description: 'Manage cash flow, invoices, and business insights',
      color: 'blue',
      features: ['Invoice scanning', 'Cash flow management', 'Risk scoring', 'What-if simulations']
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
      icon: Building2,
      description: 'Full-scale financial intelligence for organizations',
      color: 'purple',
      features: ['Department analytics', 'Role-based access', 'Audit logs', 'Advanced DSS']
    }
  ];

  const handleSelect = (modeId) => {
    setSelectedMode(modeId);
  };

  const handleConfirm = () => {
    if (selectedMode) {
      setMode(selectedMode);
      navigate('/dashboard');
    }
  };

  const getColorClasses = (color, isSelected) => {
    const colors = {
      green: {
        bg: 'bg-green-50',
        border: 'border-green-500',
        ring: 'ring-green-500',
        text: 'text-green-600'
      },
      blue: {
        bg: 'bg-blue-50',
        border: 'border-blue-500',
        ring: 'ring-blue-500',
        text: 'text-blue-600'
      },
      purple: {
        bg: 'bg-purple-50',
        border: 'border-purple-500',
        ring: 'ring-purple-500',
        text: 'text-purple-600'
      }
    };
    
    if (isSelected) {
      return `${colors[color].bg} border-2 ${colors[color].border} ring-2 ${colors[color].ring}`;
    }
    return 'border border-gray-200 hover:border-gray-300 hover:shadow-md';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
      <div className="max-w-5xl w-full">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="text-5xl mb-3">🔮</div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Welcome to ProphetLedger
          </h1>
          <p className="text-gray-600 mt-2">
            Choose how you want to use the platform. You can change this later in settings.
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
                onClick={() => handleSelect(mode.id)}
                className={`cursor-pointer rounded-xl p-6 transition-all duration-200 ${getColorClasses(mode.color, isSelected)} ${isSelected ? 'scale-105' : ''}`}
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
                  <p className="text-xs font-semibold text-gray-600 mb-2">Includes:</p>
                  <ul className="space-y-1">
                    {mode.features.map((feature, idx) => (
                      <li key={idx} className="text-xs text-gray-500 flex items-center">
                        <span className="w-1.5 h-1.5 bg-green-500 rounded-full mr-2"></span>
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            );
          })}
        </div>

        {/* Confirm button */}
        <div className="text-center">
          <button
            onClick={handleConfirm}
            disabled={!selectedMode}
            className={`px-8 py-3 rounded-xl font-semibold text-white transition-all duration-200 ${
              selectedMode
                ? 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 cursor-pointer'
                : 'bg-gray-300 cursor-not-allowed'
            }`}
          >
            Continue to Dashboard
          </button>
          <p className="text-xs text-gray-400 mt-3">
            You can change your mode anytime in Settings
          </p>
        </div>
      </div>
    </div>
  );
};

export default ModeSelector;
