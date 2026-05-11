// Example: Transactions.jsx
import React from 'react';
import TransactionList from '../components/transactions/TransactionList';
import TransactionForm from '../components/transactions/TransactionForm';
import { useMode } from '../contexts/ModeContext';
import { DollarSign } from 'lucide-react';

const Transactions = () => {
  const { currencySymbol } = useMode();

  return (
    <>
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="px-6 py-6 lg:px-8">
          <h1 className="text-2xl font-bold">Transactions</h1>
          <p className="text-blue-100 mt-1">Manage and track all your financial transactions</p>
          <div className="flex items-center mt-2 text-sm text-blue-200">
            <DollarSign className="w-4 h-4 mr-1" />
            Currency: {currencySymbol}
          </div>
        </div>
      </div>
      
      <div className="px-4 py-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <TransactionList />
          </div>
          <div>
            <TransactionForm floating={false} />
          </div>
        </div>
      </div>
    </>
  );
};

export default Transactions;