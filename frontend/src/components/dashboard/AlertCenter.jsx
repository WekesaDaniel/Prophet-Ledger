// frontend/src/components/dashboard/AlertCenter.jsx
import React, { useState, useEffect } from 'react';
import { Bell, X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';
import { supabase } from '../../services/supabaseClient';

const AlertCenter = () => {
  const [alerts, setAlerts] = useState([]);
  const [expanded, setExpanded] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    fetchAlerts();
    // Refresh alerts every 60 seconds
    const interval = setInterval(fetchAlerts, 60000);
    return () => clearInterval(interval);
  }, []);

  const fetchAlerts = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('alerts')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;

      if (data && data.length > 0) {
        setAlerts(data);
        setUnreadCount(data.filter(a => !a.read).length);
      } else {
        // Create default welcome alert if none exist
        const welcomeAlert = {
          id: 'welcome',
          title: 'Welcome to ProphetLedger!',
          message: 'Start by adding your first transaction or uploading an invoice.',
          severity: 'info',
          read: false,
          created_at: new Date().toISOString()
        };
        setAlerts([welcomeAlert]);
        setUnreadCount(1);
      }
    } catch (error) {
      console.error('Failed to fetch alerts:', error);
      setAlerts([
        { id: 1, title: 'Welcome to ProphetLedger!', message: 'Start by adding your first transaction.', severity: 'info', read: false, created_at: new Date().toISOString() }
      ]);
      setUnreadCount(1);
    }
  };

  const markAsRead = async (alertId) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || alertId === 'welcome') {
        // Local update for welcome alert
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

  return (
    <div className="relative">
      <button
        onClick={() => setExpanded(!expanded)}
        className="relative p-2 rounded-full hover:bg-gray-100 transition-colors"
      >
        <Bell className="w-5 h-5 text-gray-600" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>
      
      {expanded && (
        <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-xl border z-50">
          <div className="p-3 border-b flex justify-between items-center">
            <h3 className="font-semibold">Alerts</h3>
            <div className="flex gap-2">
              {unreadCount > 0 && (
                <button 
                  onClick={markAllAsRead}
                  className="text-xs text-blue-600 hover:text-blue-800"
                >
                  Mark all as read
                </button>
              )}
              <button onClick={() => setExpanded(false)}>
                <X className="w-4 h-4 text-gray-500 hover:text-gray-700" />
              </button>
            </div>
          </div>
          <div className="max-h-96 overflow-y-auto">
            {alerts.length === 0 ? (
              <div className="p-4 text-center text-gray-500 text-sm">
                No alerts
              </div>
            ) : (
              alerts.map(alert => (
                <div 
                  key={alert.id} 
                  onClick={() => markAsRead(alert.id)}
                  className={`p-3 border-b hover:bg-gray-50 cursor-pointer transition-colors ${
                    !alert.read ? 'bg-blue-50' : ''
                  }`}
                >
                  <div className="flex items-start gap-2">
                    <div className="mt-0.5">
                      {getSeverityIcon(alert.severity)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <p className={`font-medium text-sm ${!alert.read ? 'text-blue-900' : 'text-gray-900'}`}>
                          {alert.title}
                        </p>
                        {!alert.read && (
                          <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                        )}
                      </div>
                      <p className={`text-xs ${!alert.read ? 'text-blue-700' : 'text-gray-600'}`}>
                        {alert.message}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        {new Date(alert.created_at).toLocaleTimeString()}
                      </p>
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