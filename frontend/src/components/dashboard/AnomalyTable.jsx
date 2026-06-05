// frontend/src/components/dashboard/AnomalyTable.jsx
import React, { useState, useEffect } from 'react';
import { 
  AlertTriangle, Eye, Loader, Filter, Shield, 
  Settings, DollarSign, TrendingUp, CheckCircle, 
  XCircle, Clock, Calendar, Tag, User 
} from 'lucide-react';
import api from '../../services/api';
import { supabase } from '../../services/supabaseClient';
import toast from 'react-hot-toast';

const AnomalyTable = ({ limit = null }) => {
  const [anomalies, setAnomalies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [reviewing, setReviewing] = useState(null);
  const [showLimitModal, setShowLimitModal] = useState(false);
  const [userLimits, setUserLimits] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [limitAmount, setLimitAmount] = useState('');
  const [limitPeriod, setLimitPeriod] = useState('monthly');
  const [stats, setStats] = useState({
    totalAnomalies: 0,
    pendingCount: 0,
    reviewedCount: 0,
    avgRiskScore: 0
  });

  useEffect(() => {
    fetchAnomalies();
    fetchUserLimits();
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('anomalies')
        .select('status, anomaly_score')
        .eq('user_id', user.id);

      if (error) throw error;

      const total = data.length;
      const pending = data.filter(a => a.status === 'pending').length;
      const reviewed = data.filter(a => a.status === 'reviewed').length;
      const avgScore = data.reduce((sum, a) => sum + (a.anomaly_score || 0), 0) / (total || 1);

      setStats({
        totalAnomalies: total,
        pendingCount: pending,
        reviewedCount: reviewed,
        avgRiskScore: Math.round(avgScore)
      });
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  const fetchAnomalies = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user');

      // Fetch anomalies with transaction details
      const { data, error } = await supabase
        .from('anomalies')
        .select(`
          id,
          amount,
          description,
          category,
          anomaly_score,
          reason,
          status,
          created_at,
          transaction_id
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (data && data.length > 0) {
        setAnomalies(data);
      } else {
        // If no anomalies, check recent transactions for potential anomalies
        await checkRecentTransactionsForAnomalies();
      }
    } catch (error) {
      console.error('Failed to fetch anomalies:', error);
      setAnomalies([]);
    } finally {
      setLoading(false);
    }
  };

  const checkRecentTransactionsForAnomalies = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get recent transactions (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data: transactions, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .gte('date', thirtyDaysAgo.toISOString().split('T')[0])
        .order('amount', { ascending: false })
        .limit(10);

      if (error) throw error;

      if (transactions && transactions.length > 0) {
        // Calculate average spending by category
        const { data: categoryAverages } = await supabase
          .from('transactions')
          .select('category, amount')
          .eq('user_id', user.id)
          .eq('type', 'expense');

        const avgByCategory = {};
        categoryAverages?.forEach(t => {
          if (!avgByCategory[t.category]) {
            avgByCategory[t.category] = { sum: 0, count: 0 };
          }
          avgByCategory[t.category].sum += t.amount;
          avgByCategory[t.category].count++;
        });

        // Detect anomalies
        const detectedAnomalies = [];
        for (const transaction of transactions) {
          const avg = avgByCategory[transaction.category]?.sum / avgByCategory[transaction.category]?.count || 0;
          const ratio = avg > 0 ? transaction.amount / avg : 1;
          
          if (ratio > 2.5) {
            detectedAnomalies.push({
              id: transaction.id,
              amount: transaction.amount,
              description: transaction.description,
              category: transaction.category,
              anomaly_score: Math.min(95, Math.round(ratio * 25)),
              reason: `${ratio.toFixed(1)}x above average spending for ${transaction.category}`,
              status: 'pending',
              created_at: transaction.date
            });
          }
        }

        setAnomalies(detectedAnomalies.slice(0, 10));
      }
    } catch (error) {
      console.error('Failed to check transactions:', error);
    }
  };

  const fetchUserLimits = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('user_limits')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true);

      if (error) throw error;
      setUserLimits(data || []);
    } catch (error) {
      console.error('Failed to fetch limits:', error);
    }
  };

  const handleReview = async (anomalyId, action = 'reviewed') => {
    setReviewing(anomalyId);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user');

      const { error } = await supabase
        .from('anomalies')
        .update({ 
          status: action,
          reviewed_by: user.id,
          reviewed_at: new Date().toISOString()
        })
        .eq('id', anomalyId);

      if (error) throw error;

      setAnomalies(prev => prev.map(a => 
        a.id === anomalyId ? { ...a, status: action } : a
      ));
      
      toast.success(`Anomaly marked as ${action}`);
      fetchStats();
    } catch (error) {
      console.error('Failed to review anomaly:', error);
      toast.error('Failed to update anomaly');
    } finally {
      setReviewing(null);
    }
  };

  const handleSetLimit = async () => {
    if (!selectedCategory || !limitAmount) {
      toast.error('Please select a category and enter a limit amount');
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user');

      const { error } = await supabase
        .from('user_limits')
        .upsert({
          user_id: user.id,
          category: selectedCategory,
          limit_amount: parseFloat(limitAmount),
          period: limitPeriod,
          is_active: true,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id,category'
        });

      if (error) throw error;

      toast.success(`Limit of $${limitAmount} set for ${selectedCategory}`);
      setShowLimitModal(false);
      setSelectedCategory('');
      setLimitAmount('');
      fetchUserLimits();
    } catch (error) {
      console.error('Failed to set limit:', error);
      toast.error('Failed to set limit');
    }
  };

  const handleDeleteLimit = async (category) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user');

      const { error } = await supabase
        .from('user_limits')
        .update({ is_active: false })
        .eq('user_id', user.id)
        .eq('category', category);

      if (error) throw error;

      toast.success(`Limit removed for ${category}`);
      fetchUserLimits();
    } catch (error) {
      console.error('Failed to delete limit:', error);
      toast.error('Failed to remove limit');
    }
  };

  const getRiskLevel = (score) => {
    if (score >= 80) return { label: 'Critical', color: 'text-red-700 bg-red-100', badge: 'bg-red-600' };
    if (score >= 60) return { label: 'High', color: 'text-orange-700 bg-orange-100', badge: 'bg-orange-600' };
    if (score >= 40) return { label: 'Medium', color: 'text-yellow-700 bg-yellow-100', badge: 'bg-yellow-600' };
    return { label: 'Low', color: 'text-green-700 bg-green-100', badge: 'bg-green-600' };
  };

  const filteredAnomalies = filter === 'all' 
    ? anomalies 
    : anomalies.filter(a => a.status === filter);
  
  const displayAnomalies = limit 
    ? filteredAnomalies.slice(0, limit) 
    : filteredAnomalies;

  const categories = [...new Set(anomalies.map(a => a.category).filter(Boolean))];

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex justify-center items-center h-40">
          <Loader className="w-6 h-6 animate-spin text-blue-500" />
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4 text-center">
          <div className="text-2xl font-bold text-red-600">{stats.totalAnomalies}</div>
          <div className="text-xs text-gray-500">Total Anomalies</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4 text-center">
          <div className="text-2xl font-bold text-yellow-600">{stats.pendingCount}</div>
          <div className="text-xs text-gray-500">Pending Review</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4 text-center">
          <div className="text-2xl font-bold text-green-600">{stats.reviewedCount}</div>
          <div className="text-xs text-gray-500">Reviewed</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4 text-center">
          <div className="text-2xl font-bold text-purple-600">{stats.avgRiskScore}</div>
          <div className="text-xs text-gray-500">Avg Risk Score</div>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="p-4 border-b flex justify-between items-center flex-wrap gap-2">
          <h3 className="text-lg font-semibold flex items-center">
            <AlertTriangle className="w-5 h-5 mr-2 text-yellow-500" />
            Anomaly Detection
          </h3>
          <div className="flex space-x-2">
            <button
              onClick={() => setShowLimitModal(true)}
              className="px-3 py-1 text-sm rounded-lg bg-purple-600 text-white hover:bg-purple-700 flex items-center gap-1"
            >
              <Settings className="w-4 h-4" />
              Set Limits
            </button>
            <button onClick={() => setFilter('all')} className={`px-3 py-1 text-sm rounded-lg ${filter === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-100'}`}>All</button>
            <button onClick={() => setFilter('pending')} className={`px-3 py-1 text-sm rounded-lg ${filter === 'pending' ? 'bg-yellow-600 text-white' : 'bg-gray-100'}`}>Pending</button>
            <button onClick={() => setFilter('reviewed')} className={`px-3 py-1 text-sm rounded-lg ${filter === 'reviewed' ? 'bg-green-600 text-white' : 'bg-gray-100'}`}>Reviewed</button>
          </div>
        </div>

        {/* User Limits Summary */}
        {userLimits.length > 0 && (
          <div className="p-3 bg-blue-50 border-b flex flex-wrap gap-2 items-center">
            <Shield className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-medium text-blue-700">Active Limits:</span>
            {userLimits.map(limit => (
              <div key={limit.category} className="flex items-center gap-1 bg-white px-2 py-1 rounded-full shadow-sm text-xs">
                <span className="font-medium">{limit.category}:</span>
                <span>${limit.limit_amount}</span>
                <button 
                  onClick={() => handleDeleteLimit(limit.category)}
                  className="text-red-500 hover:text-red-700 ml-1"
                >
                  <XCircle className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}
      
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Transaction</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Amount</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Risk Level</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reason</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {displayAnomalies.length === 0 ? (
              <tr>
                <td colSpan="7" className="px-4 py-8 text-center text-gray-500">
                  <CheckCircle className="w-12 h-12 mx-auto text-green-500 mb-2" />
                  <p>No anomalies detected! Your transactions look normal.</p>
                  <p className="text-xs mt-1">Set custom limits to monitor specific categories.</p>
                </td>
              </tr>
            ) : (
              displayAnomalies.map(anomaly => {
                const risk = getRiskLevel(anomaly.anomaly_score);
                return (
                  <tr key={anomaly.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-gray-400" />
                      {anomaly.created_at?.split('T')[0] || 'N/A'}
                    </td>
                    <td className="px-4 py-3">
                      <div>
                        <p className="text-sm font-medium">{anomaly.description || 'Unknown'}</p>
                        <p className="text-xs text-gray-500 flex items-center gap-1">
                          <Tag className="w-3 h-3" />
                          {anomaly.category || 'Uncategorized'}
                        </p>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right text-sm font-medium text-red-600">
                      ${anomaly.amount?.toLocaleString()}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-16 bg-gray-200 rounded-full h-2">
                          <div className={`${risk.badge} rounded-full h-2`} style={{ width: `${anomaly.anomaly_score}%` }}></div>
                        </div>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${risk.color}`}>
                          {risk.label} {anomaly.anomaly_score}%
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 max-w-xs">
                      <p className="text-xs">{anomaly.reason || 'Unusual pattern detected'}</p>
                    </td>
                    <td className="px-4 py-3">
                      {anomaly.status === 'pending' ? (
                        <span className="px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded-full flex items-center gap-1 w-fit">
                          <Clock className="w-3 h-3" />
                          Pending Review
                        </span>
                      ) : (
                        <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full flex items-center gap-1 w-fit">
                          <CheckCircle className="w-3 h-3" />
                          Reviewed
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {anomaly.status === 'pending' && (
                        <div className="flex gap-2">
                          <button 
                            onClick={() => handleReview(anomaly.id, 'reviewed')}
                            disabled={reviewing === anomaly.id}
                            className="text-green-600 hover:text-green-800 flex items-center space-x-1"
                          >
                            {reviewing === anomaly.id ? <Loader className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                            <span className="text-sm">Approve</span>
                          </button>
                          <button 
                            onClick={() => handleReview(anomaly.id, 'false_positive')}
                            disabled={reviewing === anomaly.id}
                            className="text-red-600 hover:text-red-800 flex items-center space-x-1"
                          >
                            <XCircle className="w-4 h-4" />
                            <span className="text-sm">Dismiss</span>
                          </button>
                        </div>
                      )}
                      {anomaly.status === 'reviewed' && (
                        <span className="text-xs text-gray-400">Reviewed</span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>

    {/* Set Limit Modal */}
    {showLimitModal && (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl max-w-md w-full p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Set Custom Limit
            </h2>
            <button onClick={() => setShowLimitModal(false)} className="text-gray-500 hover:text-gray-700">
              <XCircle className="w-5 h-5" />
            </button>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select Category</option>
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
                <option value="Other">Other</option>
                <option value="All">All Categories</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Limit Amount ($)</label>
              <input
                type="number"
                value={limitAmount}
                onChange={(e) => setLimitAmount(e.target.value)}
                placeholder="Enter amount"
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                min="0"
                step="0.01"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Period</label>
              <select
                value={limitPeriod}
                onChange={(e) => setLimitPeriod(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="monthly">Monthly</option>
                <option value="weekly">Weekly</option>
                <option value="daily">Daily</option>
                <option value="per_transaction">Per Transaction</option>
              </select>
            </div>
            
            <div className="flex gap-3 pt-4">
              <button
                onClick={() => setShowLimitModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSetLimit}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Set Limit
              </button>
            </div>
          </div>
        </div>
      </div>
    )}
    </>
  );
};

export default AnomalyTable;