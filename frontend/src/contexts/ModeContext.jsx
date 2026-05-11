// frontend/src/contexts/ModeContext.jsx
import React, { createContext, useState, useContext, useEffect } from 'react';

const ModeContext = createContext();

export const useMode = () => {
  const context = useContext(ModeContext);
  if (!context) {
    throw new Error('useMode must be used within ModeProvider');
  }
  return context;
};

export const ModeProvider = ({ children }) => {
  const [mode, setMode] = useState(() => {
    return localStorage.getItem('userMode') || 'personal';
  });

  const [currency, setCurrency] = useState(() => {
    return localStorage.getItem('userCurrency') || 'USD';
  });

  const [currencySymbol, setCurrencySymbol] = useState('$');

  // Currency symbols mapping
  const currencySymbols = {
    USD: '$', EUR: '€', GBP: '£', KES: 'KSh', NGN: '₦',
    ZAR: 'R', GHS: '₵', CAD: 'C$', AUD: 'A$', INR: '₹'
  };

  useEffect(() => {
    setCurrencySymbol(currencySymbols[currency] || '$');
    localStorage.setItem('userCurrency', currency);
  }, [currency]);

  useEffect(() => {
    localStorage.setItem('userMode', mode);
  }, [mode]);

  const updateMode = (newMode) => {
    setMode(newMode);
    localStorage.setItem('userMode', newMode);
  };

  const updateCurrency = (newCurrency) => {
    setCurrency(newCurrency);
    localStorage.setItem('userCurrency', newCurrency);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  return (
    <ModeContext.Provider value={{ 
      mode, 
      currency, 
      currencySymbol,
      updateMode, 
      setMode, 
      setCurrency,
      updateCurrency,
      formatCurrency
    }}>
      {children}
    </ModeContext.Provider>
  );
};