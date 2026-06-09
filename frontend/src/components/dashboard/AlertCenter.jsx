// frontend/src/components/dashboard/AlertCenter.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { Bell, X, CheckCircle, AlertCircle, Info, AlertTriangle, DollarSign, TrendingUp, Clock } from 'lucide-react';
import { supabase } from '../../services/supabaseClient';
import toast from 'react-hot-toast';

const AlertCenter = () => {
  const [alerts, setAlerts] = useState([]);
  const [expanded, setExpanded] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [lastCheck, setLastCheck] = useState(null);

  // Create anomaly alert
  const createAnomalyAlert = async (anomaly, userId) => {
    const alertData = {
      user_id: userId,
      title: 'Unusual Transaction Detected',
      message: `${anomaly.description || 'A transaction'} of $${anomaly.amount?.toLocaleString()} in ${anomaly.category || 'unknown'} category was flagged as unusual. ${anomaly.reason || 'Please review this transaction.'}`,
      severity: 'warning',
      read: false
    };

    // Check if alert already exists for this anomaly
    const { data: existing } = await supabase
      .from('alerts')
      .select('id')
      .eq('user_id', userId)
      .eq('title', alertData.title)
      .ilike('message', `%${anomaly.description}%`)
      .single();

    if (!existing) {
      await supabase.from('alerts').insert([alertData]);
      return true;
    }
    return false;
  };

  // Create limit exceeded alert
  const createLimitExceededAlert = async (transaction, limit, userId) => {
    const alertData = {
      user_id: userId,
      title: 'Spending Limit Exceeded',
      message: `You've exceeded your ${limit.period} limit of $${limit.limit_amount.toLocaleString()} for ${limit.category}. Your transaction of $${transaction.amount.toLocaleString()} at ${transaction.vendor || transaction.description} pushed you over the limit.`,
      severity: 'warning',
      read: false
    };

    const { data: existing } = await supabase
      .from('alerts')
      .select('id')
      .eq('user_id', userId)
      .eq('title', alertData.title)
      .eq('read', false)
      .single();

    if (!existing) {
      await supabase.from('alerts').insert([alertData]);
      return true;
    }
    return false;
  };

  // Create savings milestone alert
  const createSavingsMilestoneAlert = async (savings, userId) => {
    const milestones = [1000, 5000, 10000, 25000, 50000, 100000];
    const reachedMilestones = milestones.filter(m => savings >= m && savings - m < 500);
    
    for (const milestone of reachedMilestones) {
      const alertData = {
        user_id: userId,
        title: 'Savings Milestone Achieved! 🎉',
        message: `Congratulations! You've reached $${milestone.toLocaleString()} in savings. Keep up the great work!`,
        severity: 'success',
        read: false
      };

      const { data: existing } = await supabase
        .from('alerts')
        .select('id')
        .eq('user_id', userId)
        .eq('title', alertData.title)
        .eq('message', alertData.message)
        .single();

      if (!existing) {
        await supabase.from('alerts').insert([alertData]);
      }
    }
  };

  // Create budget recommendation alert
  const createBudgetAlert = async (category, spending, userId) => {
    const alertData = {
      user_id: userId,
      title: 'Budget Recommendation',
      message: `Your spending on ${category} has reached $${spending.toLocaleString()} this month. Consider setting a budget limit for this category.`,
      severity: 'info',
      read: false
    };

    const { data: existing } = await supabase
      .from('alerts')
      .select('id')
      .eq('user_id', userId)
      .eq('title', alertData.title)
      .ilike('message', `%${category}%`)
      .single();

    if (!existing) {
      await supabase.from('alerts').insert([alertData]);
    }
  };

  // Create invoice processed alert
  const createInvoiceAlert = async (invoice, userId) => {
    const alertData = {
      user_id: userId,
      title: 'Invoice Processed',
      message: `Your invoice from ${invoice.vendor} for $${invoice.total_amount?.toLocaleString()} has been processed and added to your transactions.`,
      severity: 'success',
      read: false
    };

    const { data: existing } = await supabase
      .from('alerts')
      .select('id')
      .eq('user_id', userId)
      .eq('title', alertData.title)
      .eq('read', false)
      .single();

    if (!existing) {
      await supabase.from('alerts').insert([alertData]);
    }
  };

  // Create weekly summary alert
  const createWeeklySummaryAlert = async (userId, weekData) => {
    const alertData = {
      user_id: userId,
      title: 'Weekly Spending Summary',
      message: `This week you spent $${weekData.totalSpent.toLocaleString()}. Your top category was ${weekData.topCategory} ($${weekData.topCategoryAmount.toLocaleString()}). ${weekData.savings > 0 ? `You saved $${weekData.savings.toLocaleString()}!` : 'Try to save more next week.'}`,
      severity: 'info',
      read: false
    };

    const { data: existing } = await supabase
      .from('alerts')
      .select('id')
      .eq('user_id', userId)
      .eq('title', 'Weekly Spending Summary')
      .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
      .single();

    if (!existing) {
      await supabase.from('alerts').insert([alertData]);
    }
  };

  // Create high spending alert
  const createHighSpendingAlert = async (category, amount, threshold, userId) => {
    const alertData = {
      user_id: userId,
      title: 'High Spending Alert',
      message: `Your spending on ${category} has reached $${amount.toLocaleString()}, which is ${Math.round((amount / threshold) * 100)}% of your monthly target. Consider reviewing your expenses in this category.`,
      severity: 'warning',
      read: false
    };

    const { data: existing } = await supabase
      .from('alerts')
      .select('id')
      .eq('user_id', userId)
      .eq('title', alertData.title)
      .ilike('message', `%${category}%`)
      .single();

    if (!existing) {
      await supabase.from('alerts').insert([alertData]);
    }
  };

  // Check for alerts based on user data
  const checkAndCreateAlerts = useCallback(async (userId) => {
    try {
      // Check for new anomalies
      const { data: newAnomalies } = await supabase
        .from('anomalies')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'pending')
        .gte('created_at', lastCheck || new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

      if (newAnomalies && newAnomalies.length > 0) {
        for (const anomaly of newAnomalies) {
          await createAnomalyAlert(anomaly, userId);
        }
      }

      // Check for limit breaches
      const { data: limits } = await supabase
        .from('user_limits')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true);

      if (limits && limits.length > 0) {
        const startOfPeriod = new Date();
        if (limits[0].period === 'monthly') {
          startOfPeriod.setDate(1);
        } else if (limits[0].period === 'weekly') {
          startOfPeriod.setDate(startOfPeriod.getDate() - startOfPeriod.getDay());
        }

        for (const limit of limits) {
          const { data: categoryTransactions } = await supabase
            .from('transactions')
            .select('amount, vendor, description')
            .eq('user_id', userId)
            .eq('category', limit.category)
            .eq('type', 'expense')
            .gte('date', startOfPeriod.toISOString().split('T')[0]);

          const totalSpent = categoryTransactions?.reduce((sum, t) => sum + t.amount, 0) || 0;
          
          if (totalSpent > limit.limit_amount) {
            await createLimitExceededAlert(
              { amount: totalSpent, vendor: 'Multiple transactions', description: `Total ${limit.category} spending` },
              limit,
              userId
            );
          }
        }
      }

      // Check savings milestones
      const { data: transactions } = await supabase
        .from('transactions')
        .select('amount, type')
        .eq('user_id', userId);

      const totalIncome = transactions?.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0) || 0;
      const totalExpenses = transactions?.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0) || 0;
      const savings = totalIncome - totalExpenses;
      
      await createSavingsMilestoneAlert(savings, userId);

      // Check for weekly summary (every Monday)
      const today = new Date();
      const isMonday = today.getDay() === 1;
      if (isMonday) {
        const lastWeekStart = new Date();
        lastWeekStart.setDate(lastWeekStart.getDate() - 7);
        
        const { data: weeklyTransactions } = await supabase
          .from('transactions')
          .select('amount, category, type')
          .eq('user_id', userId)
          .gte('date', lastWeekStart.toISOString().split('T')[0]);

        const weeklySpent = weeklyTransactions?.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0) || 0;
        const categorySpending = {};
        weeklyTransactions?.filter(t => t.type === 'expense').forEach(t => {
          const cat = t.category || 'Other';
          categorySpending[cat] = (categorySpending[cat] || 0) + t.amount;
        });
        
        const topCategory = Object.entries(categorySpending).sort(([, a], [, b]) => b - a)[0];
        
        await createWeeklySummaryAlert(userId, {
          totalSpent: weeklySpent,
          topCategory: topCategory?.[0] || 'None',
          topCategoryAmount: topCategory?.[1] || 0,
          savings: weeklyTransactions?.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0) - weeklySpent
        });
      }

      // Check for high spending (over 50% of monthly target)
      const monthlyTarget = totalIncome * 0.7; // 70% of income as spending target
      const categoryTarget = monthlyTarget / 5; // Spread across top 5 categories
      
      const categoryTotals = {};
      transactions?.filter(t => t.type === 'expense').forEach(t => {
        const cat = t.category || 'Other';
        categoryTotals[cat] = (categoryTotals[cat] || 0) + t.amount;
      });
      
      for (const [cat, amount] of Object.entries(categoryTotals)) {
        if (amount > categoryTarget) {
          await createHighSpendingAlert(cat, amount, categoryTarget, userId);
        }
      }

      setLastCheck(new Date().toISOString());
    } catch (error) {
      console.error('Error checking alerts:', error);
    }
  }, [lastCheck]);

  const fetchAlerts = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Check for new alerts
      await checkAndCreateAlerts(user.id);

      // Fetch all alerts
      const { data, error } = await supabase
        .from('alerts')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(30);

      if (error) throw error;

      if (data && data.length > 0) {
        setAlerts(data);
        setUnreadCount(data.filter(a => !a.read).length);
      } else {
        // Create default welcome alert if none exist
        const welcomeAlert = {
          id: 'welcome',
          title: 'Welcome to ProphetLedger!',
          message: 'Start by adding your first transaction or uploading an invoice to get personalized insights and alerts.',
          severity: 'info',
          read: false,
          created_at: new Date().toISOString()
        };
        setAlerts([welcomeAlert]);
        setUnreadCount(1);
      }
    } catch (error) {
      console.error('Failed to fetch alerts:', error);
    }
  }, [checkAndCreateAlerts]);

  const markAsRead = async (alertId) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || alertId === 'welcome') {
        setAlerts(prev => prev.map(a => a.id === alertId ? { ...a, read: true } : a));
        setUnreadCount(prev => Math.max(0, prev - 1));
        return;
      }

      const { error } = await supabase
        .from('alerts')
        .update({ read: true })
        .eq('id', alertId)
        .eq('user_id', user.id);

      if (error) throw error;

      setAlerts(prev => prev.map(a => a.id === alertId ? { ...a, read: true } : a));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Failed to mark alert as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { error } = await supabase
          .from('alerts')
          .update({ read: true })
          .eq('user_id', user.id)
          .eq('read', false);

        if (error) throw error;
      }
      setAlerts(prev => prev.map(a => ({ ...a, read: true })));
      setUnreadCount(0);
      toast.success('All alerts marked as read');
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  };

  const getSeverityIcon = (severity) => {
    switch (severity) {
      case 'success': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'error': return <AlertCircle className="w-4 h-4 text-red-500" />;
      case 'warning': return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      default: return <Info className="w-4 h-4 text-blue-500" />;
    }
  };

  const getTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMinutes = Math.floor((now - date) / 60000);
    
    if (diffMinutes < 1) return 'Just now';
    if (diffMinutes < 60) return `${diffMinutes} min ago`;
    if (diffMinutes < 1440) return `${Math.floor(diffMinutes / 60)} hours ago`;
    return `${Math.floor(diffMinutes / 1440)} days ago`;
  };

  useEffect(() => {
    fetchAlerts();
    const interval = setInterval(fetchAlerts, 120000); // Check every 2 minutes
    return () => clearInterval(interval);
  }, [fetchAlerts]);

  return (
    <div className="relative">
      <button
        onClick={() => setExpanded(!expanded)}
        className="relative p-2 rounded-full hover:bg-gray-100 transition-colors"
      >
        <Bell className="w-5 h-5 text-gray-600" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>
      
      {expanded && (
        <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-xl border z-50 animate-in slide-in-from-top-2 duration-200">
          <div className="p-3 border-b flex justify-between items-center">
            <h3 className="font-semibold">Alerts & Notifications</h3>
            <div className="flex gap-2">
              {unreadCount > 0 && (
                <button 
                  onClick={markAllAsRead}
                  className="text-xs text-blue-600 hover:text-blue-800"
                >
                  Mark all read
                </button>
              )}
              <button onClick={() => setExpanded(false)}>
                <X className="w-4 h-4 text-gray-500 hover:text-gray-700" />
              </button>
            </div>
          </div>
          <div className="max-h-96 overflow-y-auto">
            {alerts.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <CheckCircle className="w-12 h-12 mx-auto text-gray-300 mb-2" />
                <p className="text-sm">No alerts</p>
                <p className="text-xs mt-1">You're all caught up!</p>
              </div>
            ) : (
              alerts.map(alert => (
                <div 
                  key={alert.id} 
                  onClick={() => !alert.read && markAsRead(alert.id)}
                  className={`p-3 border-b hover:bg-gray-50 cursor-pointer transition-colors ${
                    !alert.read ? 'bg-blue-50' : ''
                  }`}
                >
                  <div className="flex items-start gap-2">
                    <div className="mt-0.5">
                      {getSeverityIcon(alert.severity)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className={`font-medium text-sm truncate ${!alert.read ? 'text-blue-900' : 'text-gray-900'}`}>
                          {alert.title}
                        </p>
                        {!alert.read && (
                          <span className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0"></span>
                        )}
                      </div>
                      <p className={`text-xs mt-1 line-clamp-2 ${!alert.read ? 'text-blue-700' : 'text-gray-600'}`}>
                        {alert.message}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <Clock className="w-3 h-3 text-gray-400" />
                        <p className="text-xs text-gray-400">
                          {getTimeAgo(alert.created_at)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AlertCenter;