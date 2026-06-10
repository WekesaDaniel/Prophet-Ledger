// frontend/src/pages/Reports.jsx
import React, { useState, useEffect } from 'react';
import { useMode } from '../contexts/ModeContext';
import { 
  BarChart2, Download, Calendar, FileText, Printer, 
  TrendingUp, TrendingDown, PieChart, Loader, 
  ChevronLeft, ChevronRight, FileSpreadsheet, FileJson,
  AlertTriangle  // <-- ADD THIS
} from 'lucide-react';
import { supabase } from '../services/supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';
import {
  BarChart, Bar, LineChart, Line, PieChart as RePieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  Area, AreaChart
} from 'recharts';

const Reports = () => {
  const { formatCurrency, currencySymbol } = useMode();
  const { user } = useAuth();
  const [reportType, setReportType] = useState('monthly');
  const [dateRange, setDateRange] = useState('last30');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [loading, setLoading] = useState(true);
  const [reportData, setReportData] = useState({
    summary: { totalIncome: 0, totalExpenses: 0, netSavings: 0 },
    transactions: [],
    categoryBreakdown: [],
    monthlyTrend: [],
    anomalies: []
  });
  const [exporting, setExporting] = useState(false);

  const reportOptions = [
    { id: 'monthly', name: 'Monthly Summary', icon: Calendar, color: 'blue' },
    { id: 'expense', name: 'Expense Report', icon: BarChart2, color: 'red' },
    { id: 'income', name: 'Income Report', icon: TrendingUp, color: 'green' },
    { id: 'category', name: 'Category Analysis', icon: PieChart, color: 'purple' },
  ];

  const COLORS = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];

  useEffect(() => {
    fetchReportData();
  }, [reportType, dateRange, customStartDate, customEndDate]);

  const getDateRangeFilter = () => {
    const now = new Date();
    let startDate, endDate = now.toISOString().split('T')[0];

    if (dateRange === 'custom' && customStartDate && customEndDate) {
      return { startDate: customStartDate, endDate: customEndDate };
    }

    switch (dateRange) {
      case 'last7':
        startDate = new Date(now.setDate(now.getDate() - 7)).toISOString().split('T')[0];
        break;
      case 'last30':
        startDate = new Date(now.setDate(now.getDate() - 30)).toISOString().split('T')[0];
        break;
      case 'last90':
        startDate = new Date(now.setDate(now.getDate() - 90)).toISOString().split('T')[0];
        break;
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1).toISOString().split('T')[0];
        break;
      default:
        startDate = new Date(now.setDate(now.getDate() - 30)).toISOString().split('T')[0];
    }
    return { startDate, endDate };
  };

  const fetchReportData = async () => {
    if (!user?.id) return;
    
    setLoading(true);
    try {
      const { startDate, endDate } = getDateRangeFilter();
      
      // Fetch transactions
      const { data: transactions, error: txError } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .gte('date', startDate)
        .lte('date', endDate)
        .order('date', { ascending: false });

      if (txError) throw txError;

      // Calculate summary
      const totalIncome = transactions?.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0) || 0;
      const totalExpenses = transactions?.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0) || 0;
      const netSavings = totalIncome - totalExpenses;

      // Category breakdown for expenses
      const expenseCategories = transactions?.filter(t => t.type === 'expense').reduce((acc, t) => {
        const category = t.category || 'Other';
        if (!acc[category]) acc[category] = 0;
        acc[category] += t.amount;
        return acc;
      }, {});

      const categoryBreakdown = Object.entries(expenseCategories || {}).map(([name, value]) => ({
        name,
        value,
        percentage: totalExpenses > 0 ? (value / totalExpenses) * 100 : 0
      })).sort((a, b) => b.value - a.value);

      // Monthly trend - ensure proper date sorting
      const monthlyData = {};
      transactions?.forEach(t => {
        const date = new Date(t.date);
        const month = date.toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
        const monthIndex = date.getFullYear() * 12 + date.getMonth();
        
        if (!monthlyData[monthIndex]) {
          monthlyData[monthIndex] = { month, income: 0, expense: 0, net: 0, sortKey: monthIndex };
        }
        if (t.type === 'income') {
          monthlyData[monthIndex].income += t.amount;
        } else {
          monthlyData[monthIndex].expense += t.amount;
        }
        monthlyData[monthIndex].net = monthlyData[monthIndex].income - monthlyData[monthIndex].expense;
      });
      
      const monthlyTrend = Object.values(monthlyData)
        .sort((a, b) => a.sortKey - b.sortKey)
        .map(({ month, income, expense, net }) => ({ month, income, expense, net }));

      // Fetch anomalies in this period
      const { data: anomalies, error: aError } = await supabase
        .from('anomalies')
        .select('*')
        .eq('user_id', user.id)
        .gte('created_at', startDate)
        .lte('created_at', endDate)
        .eq('status', 'pending');

      if (aError) throw aError;

      setReportData({
        summary: { totalIncome, totalExpenses, netSavings },
        transactions: transactions || [],
        categoryBreakdown,
        monthlyTrend,
        anomalies: anomalies || []
      });
    } catch (error) {
      console.error('Failed to fetch report data:', error);
      toast.error('Failed to load report data');
    } finally {
      setLoading(false);
    }
  };

  const exportToCSV = () => {
    setExporting(true);
    try {
      const headers = ['Date', 'Description', 'Category', 'Type', 'Amount', 'Vendor'];
      const rows = reportData.transactions.map(t => [
        t.date,
        `"${(t.description || '').replace(/"/g, '""')}"`, // Escape quotes for CSV
        t.category || '',
        t.type,
        t.amount,
        `"${(t.vendor || '').replace(/"/g, '""')}"`
      ]);
      
      const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `prophetledger_report_${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Report exported successfully');
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export report');
    } finally {
      setExporting(false);
    }
  };

  const exportToJSON = () => {
    setExporting(true);
    try {
      const exportData = {
        generatedAt: new Date().toISOString(),
        dateRange: getDateRangeFilter(),
        reportType,
        summary: reportData.summary,
        categoryBreakdown: reportData.categoryBreakdown,
        monthlyTrend: reportData.monthlyTrend,
        transactions: reportData.transactions,
        anomalies: reportData.anomalies
      };
      
      const jsonStr = JSON.stringify(exportData, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `prophetledger_report_${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('JSON exported successfully');
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export JSON');
    } finally {
      setExporting(false);
    }
  };

  const printReport = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast.error('Please allow pop-ups to print');
      return;
    }
    
    printWindow.document.write(`
      <html>
        <head>
          <title>Prophet Ledger - Financial Report</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 40px; }
            h1 { color: #1e40af; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f3f4f6; }
            .summary { display: flex; gap: 20px; margin: 20px 0; }
            .card { padding: 15px; border-radius: 8px; background: #f9fafb; flex: 1; }
            .positive { color: #10b981; }
            .negative { color: #ef4444; }
          </style>
        </head>
        <body>
          <h1>Prophet Ledger Financial Report</h1>
          <p>Generated: ${new Date().toLocaleString()}</p>
          <div class="summary">
            <div class="card">
              <h3>Total Income</h3>
              <p class="positive">${formatCurrency(reportData.summary.totalIncome)}</p>
            </div>
            <div class="card">
              <h3>Total Expenses</h3>
              <p class="negative">${formatCurrency(reportData.summary.totalExpenses)}</p>
            </div>
            <div class="card">
              <h3>Net Savings</h3>
              <p class="${reportData.summary.netSavings >= 0 ? 'positive' : 'negative'}">
                ${formatCurrency(reportData.summary.netSavings)}
              </p>
            </div>
          </div>
          <h2>Transactions</h2>
           <table>
            <thead>
              <tr><th>Date</th><th>Description</th><th>Category</th><th>Type</th><th>Amount</th></tr>
            </thead>
            <tbody>
              ${reportData.transactions.map(t => `
                <tr>
                  <td>${t.date}</td>
                  <td>${t.description || ''}</td>
                  <td>${t.category || 'Uncategorized'}</td>
                  <td>${t.type}</td>
                  <td class="${t.type === 'income' ? 'positive' : 'negative'}">
                    ${t.type === 'income' ? '+' : '-'}${formatCurrency(t.amount)}
                  </td>
                </tr>
              `).join('')}
            </tbody>
           </table>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  const renderChart = () => {
    if (reportData.monthlyTrend.length === 0) {
      return (
        <div className="flex items-center justify-center h-80 text-gray-500">
          <p>No data available for the selected period</p>
        </div>
      );
    }

    switch (reportType) {
      case 'monthly':
        return (
          <ResponsiveContainer width="100%" height={350}>
            <AreaChart data={reportData.monthlyTrend}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis tickFormatter={(v) => `${currencySymbol}${(v / 1000).toFixed(0)}K`} />
              <Tooltip formatter={(v) => `${currencySymbol}${v.toLocaleString()}`} />
              <Legend />
              <Area type="monotone" dataKey="income" stroke="#10b981" fill="#10b981" fillOpacity={0.2} name="Income" />
              <Area type="monotone" dataKey="expense" stroke="#ef4444" fill="#ef4444" fillOpacity={0.2} name="Expenses" />
            </AreaChart>
          </ResponsiveContainer>
        );
      
      case 'expense':
        if (reportData.categoryBreakdown.length === 0) {
          return (
            <div className="flex items-center justify-center h-80 text-gray-500">
              <p>No expense data available</p>
            </div>
          );
        }
        return (
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={reportData.categoryBreakdown}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
              <YAxis tickFormatter={(v) => `${currencySymbol}${v.toLocaleString()}`} />
              <Tooltip formatter={(v) => `${currencySymbol}${v.toLocaleString()}`} />
              <Legend />
              <Bar dataKey="value" fill="#ef4444" name="Expense Amount" />
            </BarChart>
          </ResponsiveContainer>
        );
      
      case 'income':
        return (
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={reportData.monthlyTrend}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis tickFormatter={(v) => `${currencySymbol}${(v / 1000).toFixed(0)}K`} />
              <Tooltip formatter={(v) => `${currencySymbol}${v.toLocaleString()}`} />
              <Legend />
              <Bar dataKey="income" fill="#10b981" name="Income" />
            </BarChart>
          </ResponsiveContainer>
        );
      
      case 'category':
        if (reportData.categoryBreakdown.length === 0) {
          return (
            <div className="flex items-center justify-center h-80 text-gray-500">
              <p>No category data available</p>
            </div>
          );
        }
        return (
          <ResponsiveContainer width="100%" height={350}>
            <RePieChart>
              <Pie
                data={reportData.categoryBreakdown}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => percent > 0.05 ? `${name}: ${(percent * 100).toFixed(0)}%` : ''}
                outerRadius={120}
                fill="#8884d8"
                dataKey="value"
              >
                {reportData.categoryBreakdown.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(v) => `${currencySymbol}${v.toLocaleString()}`} />
              <Legend />
            </RePieChart>
          </ResponsiveContainer>
        );
      
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Financial Reports</h1>
            <p className="text-gray-600 mt-1">Generate and download custom financial reports</p>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={exportToCSV} 
              disabled={exporting || reportData.transactions.length === 0}
              className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Export CSV</span>
            </button>
            <button 
              onClick={exportToJSON} 
              disabled={exporting || reportData.transactions.length === 0}
              className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <FileJson className="w-4 h-4" />
              <span>Export JSON</span>
            </button>
            <button 
              onClick={printReport}
              disabled={reportData.transactions.length === 0}
              className="flex items-center space-x-2 bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Printer className="w-4 h-4" />
              <span>Print</span>
            </button>
          </div>
        </div>

        {/* Report Type Selector */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {reportOptions.map(option => {
            const Icon = option.icon;
            const isActive = reportType === option.id;
            const colorClasses = {
              blue: isActive ? 'bg-blue-600 text-white' : 'hover:border-blue-200',
              red: isActive ? 'bg-red-600 text-white' : 'hover:border-red-200',
              green: isActive ? 'bg-green-600 text-white' : 'hover:border-green-200',
              purple: isActive ? 'bg-purple-600 text-white' : 'hover:border-purple-200'
            };
            return (
              <button
                key={option.id}
                onClick={() => setReportType(option.id)}
                className={`p-4 rounded-lg text-center transition-all border-2 ${
                  isActive 
                    ? `${colorClasses[option.color]} shadow-lg border-transparent` 
                    : 'bg-white text-gray-700 border-gray-200 hover:shadow-md'
                }`}
              >
                <Icon className={`w-6 h-6 mx-auto mb-2 ${isActive ? 'text-white' : `text-${option.color}-600`}`} />
                <span className="text-sm font-medium">{option.name}</span>
              </button>
            );
          })}
        </div>

        {/* Date Range Selector */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
          <div className="flex flex-wrap gap-4 items-center">
            <label className="text-sm font-medium text-gray-700">Date Range:</label>
            <select 
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="last7">Last 7 Days</option>
              <option value="last30">Last 30 Days</option>
              <option value="last90">Last 90 Days</option>
              <option value="year">This Year</option>
              <option value="custom">Custom Range</option>
            </select>
            
            {dateRange === 'custom' && (
              <div className="flex gap-2 items-center">
                <input
                  type="date"
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
                <span className="text-gray-500">to</span>
                <input
                  type="date"
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            )}
            
            <button 
              onClick={fetchReportData}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Calendar className="w-4 h-4" />
              <span>Update Report</span>
            </button>
          </div>
        </div>

        {/* Report Preview */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Report Preview</h2>
          
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4 border border-green-200">
              <p className="text-sm text-green-700 font-medium">Total Income</p>
              <p className="text-2xl font-bold text-green-700">{formatCurrency(reportData.summary.totalIncome)}</p>
            </div>
            <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-lg p-4 border border-red-200">
              <p className="text-sm text-red-700 font-medium">Total Expenses</p>
              <p className="text-2xl font-bold text-red-700">{formatCurrency(reportData.summary.totalExpenses)}</p>
            </div>
            <div className={`rounded-lg p-4 border ${
              reportData.summary.netSavings >= 0 
                ? 'bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200' 
                : 'bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200'
            }`}>
              <p className={`text-sm font-medium ${
                reportData.summary.netSavings >= 0 ? 'text-blue-700' : 'text-orange-700'
              }`}>Net Savings</p>
              <p className={`text-2xl font-bold ${
                reportData.summary.netSavings >= 0 ? 'text-blue-700' : 'text-orange-700'
              }`}>
                {formatCurrency(reportData.summary.netSavings)}
              </p>
            </div>
          </div>

          {/* Chart */}
          <div className="h-80 mb-6">
            {renderChart()}
          </div>

          {/* Anomaly Alert */}
          {reportData.anomalies.length > 0 && (
            <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-yellow-600" />
                <h3 className="font-semibold text-yellow-800">Anomalies Detected</h3>
              </div>
              <p className="text-sm text-yellow-700 mt-1">
                {reportData.anomalies.length} unusual transaction(s) found in this period. 
                Please review them in the Anomaly Detection section.
              </p>
            </div>
          )}

          {/* Transactions Table */}
          <div className="mt-6">
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-semibold text-gray-900">Recent Transactions</h3>
              <p className="text-sm text-gray-500">{reportData.transactions.length} transactions found</p>
            </div>
            {reportData.transactions.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>No transactions found for the selected period</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {reportData.transactions.slice(0, 10).map(transaction => (
                      <tr key={transaction.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3 text-gray-700">{transaction.date}</td>
                        <td className="px-4 py-3">
                          <span className="text-gray-900">{transaction.description || 'No description'}</span>
                          {transaction.vendor && (
                            <span className="text-xs text-gray-400 ml-2">({transaction.vendor})</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            transaction.type === 'income' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {transaction.category || 'Uncategorized'}
                          </span>
                        </td>
                        <td className={`px-4 py-3 text-right font-medium ${
                          transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {transaction.type === 'income' ? '+' : '-'}{formatCurrency(transaction.amount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {reportData.transactions.length > 10 && (
                  <div className="text-center text-sm text-gray-500 mt-4 pt-3 border-t">
                    Showing 10 of {reportData.transactions.length} transactions
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Category Summary */}
          {reportData.categoryBreakdown.length > 0 && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <h3 className="font-semibold text-gray-900 mb-3">Spending by Category</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {reportData.categoryBreakdown.map(cat => (
                  <div key={cat.name} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    <span className="text-sm font-medium text-gray-700">{cat.name}</span>
                    <div className="text-right">
                      <span className="text-sm font-semibold text-gray-900">{formatCurrency(cat.value)}</span>
                      <span className="text-xs text-gray-500 ml-2">({cat.percentage.toFixed(1)}%)</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Reports;