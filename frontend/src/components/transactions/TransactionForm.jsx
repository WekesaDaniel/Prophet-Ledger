// frontend/src/components/transactions/TransactionForm.jsx
import React, { useState } from 'react';
import { Plus, DollarSign, Calendar, Tag, X, Loader } from 'lucide-react';
import { supabase } from '../../services/supabaseClient';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';

const CATEGORIES = [
  'Groceries', 'Dining', 'Transport', 'Utilities', 
  'Entertainment', 'Shopping', 'Health', 'Rent', 'Income', 'Other'
];

const TransactionForm = ({ onTransactionAdded, floating = true }) => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState({
    amount: '',
    description: '',
    category: 'Other',
    type: 'expense',
    date: new Date().toISOString().split('T')[0],
    vendor: ''
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user?.id) {
      toast.error('Please login to add transactions');
      return;
    }

    setLoading(true);
    
    try {
      const transactionData = {
        user_id: user.id,
        amount: parseFloat(formData.amount),
        description: formData.description,
        category: formData.category.toLowerCase(),
        type: formData.type,
        date: formData.date,
        vendor: formData.vendor || null
      };

      const { data, error } = await supabase
        .from('transactions')
        .insert([transactionData])
        .select();

      if (error) throw error;
      
      toast.success('Transaction added successfully!');
      setFormData({
        amount: '',
        description: '',
        category: 'Other',
        type: 'expense',
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

  const FormContent = () => (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex gap-2 p-1 bg-gray-100 rounded-lg">
        <button
          type="button"
          onClick={() => setFormData({...formData, type: 'expense'})}
          className={`flex-1 py-2 rounded-md text-sm font-medium transition ${
            formData.type === 'expense' ? 'bg-red-500 text-white' : 'text-gray-600 hover:bg-gray-200'
          }`}
        >
          Expense
        </button>
        <button
          type="button"
          onClick={() => setFormData({...formData, type: 'income'})}
          className={`flex-1 py-2 rounded-md text-sm font-medium transition ${
            formData.type === 'income' ? 'bg-green-500 text-white' : 'text-gray-600 hover:bg-gray-200'
          }`}
        >
          Income
        </button>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
        <div className="relative">
          <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="number"
            name="amount"
            value={formData.amount}
            onChange={handleChange}
            step="0.01"
            required
            className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            placeholder="0.00"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
        <input
          type="text"
          name="description"
          value={formData.description}
          onChange={handleChange}
          required
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
          placeholder="E.g., Coffee shop, Salary, etc."
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Vendor/Store</label>
        <input
          type="text"
          name="vendor"
          value={formData.vendor}
          onChange={handleChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
          placeholder="Starbucks, Amazon, etc."
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
        <div className="relative">
          <Tag className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <select
            name="category"
            value={formData.category}
            onChange={handleChange}
            className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
          >
            {CATEGORIES.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
        <div className="relative">
          <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="date"
            name="date"
            value={formData.date}
            onChange={handleChange}
            required
            className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold py-2 rounded-lg transition-all disabled:opacity-50"
      >
        {loading ? (
          <span className="flex items-center justify-center">
            <Loader className="w-4 h-4 animate-spin mr-2" />
            Adding...
          </span>
        ) : (
          'Add Transaction'
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
        className="fixed bottom-6 right-6 bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 rounded-full shadow-lg hover:shadow-xl transition-all z-40"
      >
        <Plus className="w-6 h-6" />
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b flex justify-between items-center sticky top-0 bg-white">
              <h2 className="text-xl font-bold">Add Transaction</h2>
              <button onClick={() => setIsOpen(false)} className="p-1 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5" />
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