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

  const fetchAlerts = useCallback(async () => {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        console.log('No user found, using demo alerts');
        setAlerts([{
          id: 'demo-1',
          title: 'Welcome to ProphetLedger!',
          message: 'Connect your bank account or add transactions to see personalized alerts.',
          severity: 'info',
          read: false,
          created_at: new Date().toISOString()
        }]);
        setUnreadCount(1);
        return;
      }

      // Try to fetch real alerts
      const { data, error } = await supabase
        .from('alerts')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(30);

      if (error) {
        // Handle RLS errors gracefully
        if (error.code === 'PGRST301' || error.code === '42501') {
          console.warn('RLS policy issue, using demo alerts');
          setAlerts([{
            id: 'demo-1',
            title: 'Alert System Ready',
            message: 'Your alerts will appear here once you add transactions. For now, try adding your first transaction!',
            severity: 'info',
            read: false,
            created_at: new Date().toISOString()
          }]);
          setUnreadCount(1);
          return;
        }
        throw error;
      }

      if (data && data.length > 0) {
        setAlerts(data);
        setUnreadCount(data.filter(a => !a.read).length);
      } else {
        // Demo alerts for new users
        const demoAlerts = [
          {
            id: 'demo-1',
            title: 'Welcome to ProphetLedger!',
            message: 'Start by adding your first transaction or uploading an invoice to get personalized insights.',
            severity: 'info',
            read: false,
            created_at: new Date().toISOString()
          },
          {
            id: 'demo-2',
            title: 'AI Financial Assistant Ready',
            message: 'Click the chat button in the bottom right to ask questions about your finances!',
            severity: 'success',
            read: false,
            created_at: new Date(Date.now() - 5 * 60000).toISOString()
          }
        ];
        setAlerts(demoAlerts);
        setUnreadCount(2);
      }
    } catch (error) {
      console.error('Failed to fetch alerts:', error);
      setAlerts([{
        id: 'error',
        title: 'Alert System Active',
        message: 'Your alerts will appear here once you start adding transactions.',
        severity: 'info',
        read: false,
        created_at: new Date().toISOString()
      }]);
      setUnreadCount(1);
    }
  }, []);

  const markAsRead = async (alertId) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || alertId.startsWith('demo')) {
        setAlerts(prev => prev.map(a => a.id === alertId ? { ...a, read: true } : a));
        setUnreadCount(prev => Math.max(0, prev - 1));
        return;
      }

      const { error } = await supabase
        .from('alerts')
        .update({ read: true })
        .eq('id', alertId)
        .eq('user_id', user.id);

      if (error && error.code !== 'PGRST301') throw error;

      setAlerts(prev => prev.map(a => a.id === alertId ? { ...a, read: true } : a));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Failed to mark alert as read:', error);
      // Still update UI even if DB fails
      setAlerts(prev => prev.map(a => a.id === alertId ? { ...a, read: true } : a));
      setUnreadCount(prev => Math.max(0, prev - 1));
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
        
        if (error && error.code !== 'PGRST301') throw error;
      }
      setAlerts(prev => prev.map(a => ({ ...a, read: true })));
      setUnreadCount(0);
      toast.success('All alerts marked as read');
    } catch (error) {
      console.error('Failed to mark all as read:', error);
      setAlerts(prev => prev.map(a => ({ ...a, read: true })));
      setUnreadCount(0);
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
    const interval = setInterval(fetchAlerts, 120000);
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