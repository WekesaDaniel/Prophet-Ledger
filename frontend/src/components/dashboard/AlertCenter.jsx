import React, { useState, useEffect } from 'react';
import { Bell, AlertCircle, Clock, CheckCircle, X, TrendingUp, DollarSign, FileText } from 'lucide-react';
import api from '../../services/api';

const AlertCenter = () => {
  const [alerts, setAlerts] = useState([]);
  const [expanded, setExpanded] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    fetchAlerts();
    const interval = setInterval(fetchAlerts, 60000);
    return () => clearInterval(interval);
  }, []);

  const fetchAlerts = async () => {
    try {
      const response = await api.get('/dss/alerts');
      const data = response.data;
      setAlerts(data);
      setUnreadCount(data.filter(a => !a.read).length);
    } catch (error) {
      console.error('Failed to fetch alerts:', error);
      // Demo alerts
      const demoAlerts = [
        { id: 1, type: 'warning', severity: 'warning', title: 'High Spending Alert', message: 'Dining expenses are 40% above budget this month', created_at: new Date().toISOString(), read: false, action_needed: true },
        { id: 2, type: 'info', severity: 'info', title: 'Invoice Due Soon', message: 'Invoice #INV-001 is due in 3 days', created_at: new Date().toISOString(), read: false, action_needed: true },
        { id: 3, type: 'success', severity: 'info', title: 'Savings Milestone', message: 'You\'ve reached 80% of your savings goal!', created_at: new Date().toISOString(), read: true, action_needed: false }
      ];
      setAlerts(demoAlerts);
      setUnreadCount(demoAlerts.filter(a => !a.read).length);
    }
  };

  const markAsRead = async (alertId) => {
    try {
      await api.post(`/dss/alerts/${alertId}/read`);
      setAlerts(alerts.map(a => a.id === alertId ? { ...a, read: true } : a));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Failed to mark alert as read:', error);
    }
  };

  const getSeverityStyles = (severity) => {
    switch (severity) {
      case 'critical': return 'border-red-500 bg-red-50';
      case 'warning': return 'border-yellow-500 bg-yellow-50';
      case 'info': return 'border-blue-500 bg-blue-50';
      default: return 'border-gray-300 bg-white';
    }
  };

  const getSeverityIcon = (severity, type) => {
    if (type === 'spike') return <TrendingUp className="w-5 h-5 text-yellow-500" />;
    if (type === 'bill_due') return <DollarSign className="w-5 h-5 text-blue-500" />;
    if (type === 'invoice') return <FileText className="w-5 h-5 text-purple-500" />;
    
    switch (severity) {
      case 'critical': return <AlertCircle className="w-5 h-5 text-red-500" />;
      case 'warning': return <AlertCircle className="w-5 h-5 text-yellow-500" />;
      default: return <Bell className="w-5 h-5 text-blue-500" />;
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
        <>
          <div className="fixed inset-0 z-40" onClick={() => setExpanded(false)} />
          <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-xl border z-50 animate-in slide-in-from-top-2 duration-200">
            <div className="p-4 border-b flex justify-between items-center">
              <h3 className="font-semibold text-lg">Alerts & Notifications</h3>
              <button 
                onClick={() => setExpanded(false)}
                className="p-1 hover:bg-gray-100 rounded-full"
              >
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>
            
            <div className="max-h-96 overflow-y-auto">
              {alerts.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <CheckCircle className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p>No new alerts!</p>
                  <p className="text-sm">Everything looks good.</p>
                </div>
              ) : (
                alerts.map(alert => (
                  <div
                    key={alert.id}
                    className={`p-4 border-b border-l-4 cursor-pointer transition-colors hover:bg-gray-50 ${getSeverityStyles(alert.severity)} ${alert.read ? 'opacity-70' : ''}`}
                    onClick={() => !alert.read && markAsRead(alert.id)}
                  >
                    <div className="flex items-start space-x-3">
                      {getSeverityIcon(alert.severity, alert.type)}
                      <div className="flex-1">
                        <p className="font-medium text-sm">{alert.title}</p>
                        <p className="text-xs text-gray-600 mt-1">{alert.message}</p>
                        <div className="flex items-center justify-between mt-2">
                          <div className="flex items-center text-xs text-gray-400">
                            <Clock className="w-3 h-3 mr-1" />
                            {getTimeAgo(alert.created_at)}
                          </div>
                          {alert.action_needed && !alert.read && (
                            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                              Action Required
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
            
            <div className="p-3 border-t bg-gray-50 rounded-b-lg">
              <button className="text-xs text-blue-600 hover:text-blue-800 w-full text-center">
                View All Notifications
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default AlertCenter;
