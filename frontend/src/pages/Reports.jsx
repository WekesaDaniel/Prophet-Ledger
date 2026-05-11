// frontend/src/pages/Reports.jsx
import React, { useState } from 'react';
import { useMode } from '../contexts/ModeContext';
import { BarChart2, Download, Calendar, FileText, Printer } from 'lucide-react';

const Reports = () => {
  const { formatCurrency } = useMode();
  const [reportType, setReportType] = useState('monthly');
  const [dateRange, setDateRange] = useState('last30');

  const reportOptions = [
    { id: 'monthly', name: 'Monthly Summary', icon: Calendar },
    { id: 'expense', name: 'Expense Report', icon: BarChart2 },
    { id: 'income', name: 'Income Report', icon: BarChart2 },
    { id: 'category', name: 'Category Analysis', icon: FileText },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-8 px-4">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold">Financial Reports</h1>
            <p className="text-gray-600 mt-1">Generate and download custom financial reports</p>
          </div>
          <button className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
            <Download className="w-4 h-4" />
            <span>Export PDF</span>
          </button>
        </div>

        {/* Report Type Selector */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {reportOptions.map(option => {
            const Icon = option.icon;
            const isActive = reportType === option.id;
            return (
              <button
                key={option.id}
                onClick={() => setReportType(option.id)}
                className={`p-4 rounded-lg text-center transition-all ${
                  isActive 
                    ? 'bg-blue-600 text-white shadow-lg' 
                    : 'bg-white text-gray-700 hover:shadow-md'
                }`}
              >
                <Icon className={`w-6 h-6 mx-auto mb-2 ${isActive ? 'text-white' : 'text-blue-600'}`} />
                <span className="text-sm font-medium">{option.name}</span>
              </button>
            );
          })}
        </div>

        {/* Date Range Selector */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="flex flex-wrap gap-4">
            <select 
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="px-3 py-2 border rounded-lg"
            >
              <option value="last7">Last 7 Days</option>
              <option value="last30">Last 30 Days</option>
              <option value="last90">Last 90 Days</option>
              <option value="year">This Year</option>
              <option value="custom">Custom Range</option>
            </select>
            <button className="flex items-center space-x-2 px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200">
              <Printer className="w-4 h-4" />
              <span>Print</span>
            </button>
          </div>
        </div>

        {/* Report Preview */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Report Preview</h2>
          
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-green-50 rounded-lg p-4">
              <p className="text-sm text-green-600">Total Income</p>
              <p className="text-2xl font-bold text-green-700">{formatCurrency(12500)}</p>
            </div>
            <div className="bg-red-50 rounded-lg p-4">
              <p className="text-sm text-red-600">Total Expenses</p>
              <p className="text-2xl font-bold text-red-700">{formatCurrency(8450)}</p>
            </div>
            <div className="bg-blue-50 rounded-lg p-4">
              <p className="text-sm text-blue-600">Net Savings</p>
              <p className="text-2xl font-bold text-blue-700">{formatCurrency(4050)}</p>
            </div>
          </div>

          {/* Placeholder for chart */}
          <div className="h-64 bg-gray-100 rounded-lg flex items-center justify-center">
            <p className="text-gray-500">Chart visualization will appear here</p>
          </div>

          {/* Transaction Table Preview */}
          <div className="mt-6">
            <h3 className="font-semibold mb-3">Recent Transactions</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left">Date</th>
                    <th className="px-4 py-2 text-left">Description</th>
                    <th className="px-4 py-2 text-left">Category</th>
                    <th className="px-4 py-2 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  <tr>
                    <td className="px-4 py-2">2024-05-15</td>
                    <td className="px-4 py-2">Salary Deposit</td>
                    <td className="px-4 py-2">Income</td>
                    <td className="px-4 py-2 text-right text-green-600">+{formatCurrency(5000)}</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2">2024-05-14</td>
                    <td className="px-4 py-2">Amazon Purchase</td>
                    <td className="px-4 py-2">Shopping</td>
                    <td className="px-4 py-2 text-right text-red-600">-{formatCurrency(124.99)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reports;