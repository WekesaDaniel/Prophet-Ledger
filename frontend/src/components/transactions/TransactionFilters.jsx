// frontend/src/components/transactions/TransactionFilters.jsx
import React, { useState } from 'react';
import { Filter, Calendar, DollarSign, Tag, X } from 'lucide-react';

const CATEGORIES = [
  'All', 'Groceries', 'Dining', 'Transport', 'Utilities', 
  'Entertainment', 'Shopping', 'Health', 'Rent', 'Income'
];

const TransactionFilters = ({ onFilterChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [filters, setFilters] = useState({
    category: 'All',
    type: 'all',
    dateRange: 'all',
    minAmount: '',
    maxAmount: ''
  });

  const handleChange = (key, value) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFilterChange?.(newFilters);
  };

  const clearFilters = () => {
    const cleared = {
      category: 'All',
      type: 'all',
      dateRange: 'all',
      minAmount: '',
      maxAmount: ''
    };
    setFilters(cleared);
    onFilterChange?.(cleared);
  };

  const activeFilterCount = Object.values(filters).filter(v => v && v !== 'All' && v !== 'all').length;

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
      >
        <Filter className="w-4 h-4" />
        <span>Filters</span>
        {activeFilterCount > 0 && (
          <span className="bg-blue-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
            {activeFilterCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl border z-50">
          <div className="p-4 border-b flex justify-between items-center">
            <h3 className="font-semibold">Filter Transactions</h3>
            <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-gray-600">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="p-4 space-y-4">
            {/* Category Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                <Tag className="w-3 h-3 mr-1" />
                Category
              </label>
              <select
                value={filters.category}
                onChange={(e) => handleChange('category', e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              >
                {CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            {/* Type Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Transaction Type</label>
              <div className="flex gap-2">
                <button
                  onClick={() => handleChange('type', 'all')}
                  className={`flex-1 py-2 text-sm rounded-lg transition ${
                    filters.type === 'all' ? 'bg-gray-800 text-white' : 'bg-gray-100 hover:bg-gray-200'
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => handleChange('type', 'income')}
                  className={`flex-1 py-2 text-sm rounded-lg transition ${
                    filters.type === 'income' ? 'bg-green-600 text-white' : 'bg-gray-100 hover:bg-gray-200'
                  }`}
                >
                  Income
                </button>
                <button
                  onClick={() => handleChange('type', 'expense')}
                  className={`flex-1 py-2 text-sm rounded-lg transition ${
                    filters.type === 'expense' ? 'bg-red-600 text-white' : 'bg-gray-100 hover:bg-gray-200'
                  }`}
                >
                  Expense
                </button>
              </div>
            </div>

            {/* Date Range */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                <Calendar className="w-3 h-3 mr-1" />
                Date Range
              </label>
              <select
                value={filters.dateRange}
                onChange={(e) => handleChange('dateRange', e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <option value="all">All Time</option>
                <option value="7d">Last 7 Days</option>
                <option value="30d">Last 30 Days</option>
                <option value="90d">Last 90 Days</option>
                <option value="year">This Year</option>
              </select>
            </div>

            {/* Amount Range */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                <DollarSign className="w-3 h-3 mr-1" />
                Amount Range
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  placeholder="Min"
                  value={filters.minAmount}
                  onChange={(e) => handleChange('minAmount', e.target.value)}
                  className="flex-1 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
                <input
                  type="number"
                  placeholder="Max"
                  value={filters.maxAmount}
                  onChange={(e) => handleChange('maxAmount', e.target.value)}
                  className="flex-1 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
            </div>
          </div>

          <div className="p-4 border-t bg-gray-50 flex justify-between">
            <button
              onClick={clearFilters}
              className="text-gray-600 hover:text-gray-800 text-sm"
            >
              Clear All
            </button>
            <button
              onClick={() => setIsOpen(false)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700"
            >
              Apply Filters
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default TransactionFilters;