// frontend/src/components/transactions/TransactionForm.jsx
import React, { useState, useRef, useEffect } from 'react';
import { Plus, DollarSign, Calendar, Tag, X, Loader, TrendingUp, TrendingDown } from 'lucide-react';
import { supabase } from '../../services/supabaseClient';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';

const EXPENSE_CATEGORIES = [
  'Groceries', 'Dining', 'Transport', 'Utilities', 
  'Entertainment', 'Shopping', 'Health', 'Rent', 'Other'
];

const INCOME_CATEGORIES = [
  'Salary', 'Freelance', 'Investment', 'Gift', 'Refund', 'Other'
];

const TransactionForm = ({ onTransactionAdded, floating = true }) => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [transactionType, setTransactionType] = useState('expense');
  const [loading, setLoading] = useState(false);
  
  // Use refs for form inputs to avoid re-renders
  const amountRef = useRef(null);
  const descriptionRef = useRef(null);
  const vendorRef = useRef(null);
  const categoryRef = useRef(null);
  const dateRef = useRef(null);

  // Focus amount input when modal opens
  useEffect(() => {
    if (isOpen && amountRef.current) {
      setTimeout(() => amountRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const handleTypeChange = (type) => {
    setTransactionType(type);
  };

  const getFormData = () => {
    return {
      amount: amountRef.current?.value || '',
      description: descriptionRef.current?.value || '',
      vendor: vendorRef.current?.value || '',
      category: categoryRef.current?.value || (transactionType === 'expense' ? 'Groceries' : 'Salary'),
      type: transactionType,
      date: dateRef.current?.value || new Date().toISOString().split('T')[0]
    };
  };

  const resetForm = () => {
    if (amountRef.current) amountRef.current.value = '';
    if (descriptionRef.current) descriptionRef.current.value = '';
    if (vendorRef.current) vendorRef.current.value = '';
    if (categoryRef.current) categoryRef.current.value = transactionType === 'expense' ? 'Groceries' : 'Salary';
    if (dateRef.current) dateRef.current.value = new Date().toISOString().split('T')[0];
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!user?.id) {
      toast.error('Please login to add transactions');
      return;
    }

    const formData = getFormData();
    const amountNum = parseFloat(formData.amount);
    
    if (isNaN(amountNum) || amountNum <= 0) {
      toast.error('Please enter a valid amount');
      amountRef.current?.focus();
      return;
    }

    if (!formData.description.trim()) {
      toast.error('Please enter a description');
      descriptionRef.current?.focus();
      return;
    }

    setLoading(true);
    
    try {
      const transactionData = {
        user_id: user.id,
        amount: amountNum,
        description: formData.description.trim(),
        category: formData.category.toLowerCase(),
        type: formData.type,
        date: formData.date,
        vendor: formData.vendor?.trim() || null
      };

      const { error } = await supabase
        .from('transactions')
        .insert([transactionData]);

      if (error) throw error;
      
      toast.success('Transaction added successfully!');
      resetForm();
      setIsOpen(false);
      if (onTransactionAdded) onTransactionAdded();
    } catch (error) {
      console.error('Error adding transaction:', error);
      toast.error(error.message || 'Failed to add transaction');
    } finally {
      setLoading(false);
    }
  };

  const resetAndClose = () => {
    resetForm();
    setIsOpen(false);
  };

  const FormContent = () => (
    <form onSubmit={handleSubmit} className="space-y-4" autoComplete="off">
      {/* Transaction Type Toggle */}
      <div className="flex gap-2 p-1 bg-gray-100 rounded-lg">
        <button
          type="button"
          onClick={() => handleTypeChange('expense')}
          className={`flex-1 py-2 rounded-md text-sm font-medium transition flex items-center justify-center gap-2 ${
            transactionType === 'expense' ? 'bg-red-500 text-white shadow-md' : 'text-gray-600 hover:bg-gray-200'
          }`}
        >
          <TrendingDown className="w-4 h-4" />
          Expense
        </button>
        <button
          type="button"
          onClick={() => handleTypeChange('income')}
          className={`flex-1 py-2 rounded-md text-sm font-medium transition flex items-center justify-center gap-2 ${
            transactionType === 'income' ? 'bg-green-500 text-white shadow-md' : 'text-gray-600 hover:bg-gray-200'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          Income
        </button>
      </div>

      {/* Amount Field */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Amount *</label>
        <div className="relative">
          <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            ref={amountRef}
            type="number"
            name="amount"
            step="0.01"
            min="0.01"
            required
            className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            placeholder="0.00"
            defaultValue=""
          />
        </div>
      </div>

      {/* Description Field */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
        <input
          ref={descriptionRef}
          type="text"
          name="description"
          required
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          placeholder={transactionType === 'expense' ? "Coffee shop, Groceries, etc." : "Salary, Freelance payment, etc."}
          defaultValue=""
        />
      </div>

      {/* Vendor Field */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Vendor/Store (Optional)</label>
        <input
          ref={vendorRef}
          type="text"
          name="vendor"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          placeholder="Starbucks, Amazon, Employer, etc."
          defaultValue=""
        />
      </div>

      {/* Category Field */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
        <div className="relative">
          <Tag className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <select
            ref={categoryRef}
            name="category"
            className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none appearance-none bg-white"
            defaultValue={transactionType === 'expense' ? 'Groceries' : 'Salary'}
          >
            {(transactionType === 'expense' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES).map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Date Field */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Date *</label>
        <div className="relative">
          <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            ref={dateRef}
            type="date"
            name="date"
            required
            className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            defaultValue={new Date().toISOString().split('T')[0]}
          />
        </div>
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={loading}
        className={`w-full font-semibold py-2 rounded-lg transition-all disabled:opacity-50 ${
          transactionType === 'expense'
            ? 'bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800'
            : 'bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800'
        } text-white`}
      >
        {loading ? (
          <span className="flex items-center justify-center">
            <Loader className="w-4 h-4 animate-spin mr-2" />
            Adding...
          </span>
        ) : (
          transactionType === 'expense' ? 'Add Expense' : 'Add Income'
        )}
      </button>
    </form>
  );

  if (!floating) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Add New Transaction</h3>
        <FormContent />
      </div>
    );
  }

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 rounded-full shadow-lg hover:shadow-xl transition-all z-40 group"
      >
        <Plus className="w-6 h-6" />
        <span className="absolute right-full mr-2 top-1/2 transform -translate-y-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
          Add Transaction
        </span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b flex justify-between items-center sticky top-0 bg-white">
              <div>
                <h2 className="text-xl font-bold">Add Transaction</h2>
                <p className="text-sm text-gray-500 mt-1">Record your income or expense</p>
              </div>
              <button 
                onClick={resetAndClose} 
                className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="p-6">
              <FormContent />
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default TransactionForm;