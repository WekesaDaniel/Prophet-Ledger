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
  const [formData, setFormData] = useState({
    amount: '',
    description: '',
    category: 'Groceries',
    type: 'expense',
    date: new Date().toISOString().split('T')[0],
    vendor: ''
  });
  const [loading, setLoading] = useState(false);
  const amountInputRef = useRef(null);

  // Focus amount input when modal opens
  useEffect(() => {
    if (isOpen && amountInputRef.current) {
      setTimeout(() => amountInputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleTypeChange = (type) => {
    setTransactionType(type);
    // Reset category based on type
    setFormData(prev => ({
      ...prev,
      type: type,
      category: type === 'expense' ? 'Groceries' : 'Salary'
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user?.id) {
      toast.error('Please login to add transactions');
      return;
    }

    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    if (!formData.description.trim()) {
      toast.error('Please enter a description');
      return;
    }

    setLoading(true);
    
    try {
      const transactionData = {
        user_id: user.id,
        amount: parseFloat(formData.amount),
        description: formData.description.trim(),
        category: formData.category.toLowerCase(),
        type: formData.type,
        date: formData.date,
        vendor: formData.vendor?.trim() || null
      };

      const { data, error } = await supabase
        .from('transactions')
        .insert([transactionData])
        .select();

      if (error) throw error;
      
      toast.success('Transaction added successfully!');
      
      // Reset form
      setFormData({
        amount: '',
        description: '',
        category: transactionType === 'expense' ? 'Groceries' : 'Salary',
        type: transactionType,
        date: new Date().toISOString().split('T')[0],
        vendor: ''
      });
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
    setIsOpen(false);
    setFormData({
      amount: '',
      description: '',
      category: transactionType === 'expense' ? 'Groceries' : 'Salary',
      type: transactionType,
      date: new Date().toISOString().split('T')[0],
      vendor: ''
    });
  };

  const FormContent = () => (
    <form onSubmit={handleSubmit} className="space-y-4">
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
            ref={amountInputRef}
            type="number"
            name="amount"
            value={formData.amount}
            onChange={handleChange}
            step="0.01"
            min="0.01"
            required
            className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            placeholder="0.00"
          />
        </div>
      </div>

      {/* Description Field */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
        <input
          type="text"
          name="description"
          value={formData.description}
          onChange={handleChange}
          required
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          placeholder={transactionType === 'expense' ? "Coffee shop, Groceries, etc." : "Salary, Freelance payment, etc."}
        />
      </div>

      {/* Vendor Field */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Vendor/Store (Optional)</label>
        <input
          type="text"
          name="vendor"
          value={formData.vendor}
          onChange={handleChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          placeholder="Starbucks, Amazon, Employer, etc."
        />
      </div>

      {/* Category Field */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
        <div className="relative">
          <Tag className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <select
            name="category"
            value={formData.category}
            onChange={handleChange}
            className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none appearance-none bg-white"
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
            type="date"
            name="date"
            value={formData.date}
            onChange={handleChange}
            required
            className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
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