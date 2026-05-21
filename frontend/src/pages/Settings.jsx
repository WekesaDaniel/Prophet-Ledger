// frontend/src/pages/Settings.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useMode } from '../contexts/ModeContext';
import { supabase } from '../services/supabaseClient';
import { User, Bell, Shield, DollarSign, Moon, Sun, Globe, Save, Loader } from 'lucide-react';
import toast from 'react-hot-toast';

const Settings = () => {
  const { user, updateUser } = useAuth();
  const { mode, currency, setCurrency, formatCurrency } = useMode();
  const [darkMode, setDarkMode] = useState(false);
  const [notifications, setNotifications] = useState(true);
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [anomalyAlerts, setAnomalyAlerts] = useState(true);
  const [selectedCurrency, setSelectedCurrency] = useState(currency);
  const [fullName, setFullName] = useState(user?.full_name || '');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  const currencies = [
    { code: 'USD', symbol: '$', name: 'US Dollar' },
    { code: 'EUR', symbol: '€', name: 'Euro' },
    { code: 'GBP', symbol: '£', name: 'British Pound' },
    { code: 'KES', symbol: 'KSh', name: 'Kenyan Shilling' },
    { code: 'NGN', symbol: '₦', name: 'Nigerian Naira' },
    { code: 'ZAR', symbol: 'R', name: 'South African Rand' },
    { code: 'GHS', symbol: '₵', name: 'Ghanaian Cedi' },
    { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar' },
    { code: 'AUD', symbol: 'A$', name: 'Australian Dollar' },
    { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
  ];

  // Load user settings from Supabase
  useEffect(() => {
    const loadUserSettings = async () => {
      if (!user?.id) {
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('user_settings')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (error && error.code !== 'PGRST116') { // PGRST116 means no rows returned
          console.error('Error loading settings:', error);
        }

        if (data) {
          setDarkMode(data.dark_mode || false);
          setNotifications(data.notifications_enabled !== false);
          setEmailAlerts(data.email_alerts_enabled !== false);
          setAnomalyAlerts(data.anomaly_alerts_enabled !== false);
          setSelectedCurrency(data.currency || currency);
          
          // Apply dark mode if enabled
          if (data.dark_mode) {
            document.documentElement.classList.add('dark');
          }
        }
      } catch (error) {
        console.error('Error loading settings:', error);
      } finally {
        setLoading(false);
      }
    };

    loadUserSettings();
  }, [user?.id, currency]);

  const handleSaveSettings = async () => {
    if (!user?.id) {
      toast.error('User not authenticated');
      return;
    }

    setSaving(true);

    try {
      // Update user profile in Supabase Auth
      if (fullName !== user?.full_name) {
        const { error: updateError } = await supabase.auth.updateUser({
          data: { full_name: fullName, name: fullName }
        });
        
        if (updateError) throw updateError;
        
        // Update local user state
        if (updateUser) {
          await updateUser({ full_name: fullName });
        }
      }

      // Update user settings in user_settings table
      const { error: settingsError } = await supabase
        .from('user_settings')
        .upsert({
          user_id: user.id,
          dark_mode: darkMode,
          notifications_enabled: notifications,
          email_alerts_enabled: emailAlerts,
          anomaly_alerts_enabled: anomalyAlerts,
          currency: selectedCurrency,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id'
        });

      if (settingsError) throw settingsError;

      // Update currency in context/localStorage
      setCurrency(selectedCurrency);
      localStorage.setItem('userCurrency', selectedCurrency);

      // Apply dark mode
      if (darkMode) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }

      toast.success('Settings saved successfully!');
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error(error.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader className="w-8 h-8 animate-spin text-purple-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-4xl mx-auto py-8 px-4">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-8">Settings</h1>

        <div className="space-y-6">
          {/* Profile Section */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
              <User className="w-5 h-5 mr-2 text-blue-600" />
              Profile Information
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Full Name</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
                <input
                  type="email"
                  defaultValue={user?.email || ''}
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg bg-gray-50 dark:bg-gray-600"
                  disabled
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Account Type</label>
                <div className="px-3 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg text-sm capitalize text-gray-900 dark:text-white">
                  {mode?.replace('_', ' ')} Mode
                </div>
              </div>
            </div>
          </div>

          {/* Preferences Section */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
              <Globe className="w-5 h-5 mr-2 text-green-600" />
              Preferences
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center">
                  <DollarSign className="w-4 h-4 mr-1" />
                  Currency
                </label>
                <select
                  value={selectedCurrency}
                  onChange={(e) => setSelectedCurrency(e.target.value)}
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  {currencies.map(curr => (
                    <option key={curr.code} value={curr.code}>
                      {curr.code} - {curr.name} ({curr.symbol})
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Current display: {formatCurrency(1234.56)}
                </p>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  {darkMode ? (
                    <Moon className="w-4 h-4 mr-2 text-gray-500 dark:text-gray-400" />
                  ) : (
                    <Sun className="w-4 h-4 mr-2 text-gray-500 dark:text-gray-400" />
                  )}
                  <span className="text-sm text-gray-700 dark:text-gray-300">Dark Mode</span>
                </div>
                <button
                  onClick={() => setDarkMode(!darkMode)}
                  className={`w-12 h-6 rounded-full transition-colors ${darkMode ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'}`}
                >
                  <div className={`w-5 h-5 rounded-full bg-white transform transition-transform ${darkMode ? 'translate-x-6' : 'translate-x-0.5'}`} />
                </button>
              </div>
            </div>
          </div>

          {/* Notifications Section */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
              <Bell className="w-5 h-5 mr-2 text-yellow-600" />
              Notifications
            </h2>
            <div className="space-y-3">
              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-sm text-gray-700 dark:text-gray-300">Push Notifications</span>
                <input
                  type="checkbox"
                  checked={notifications}
                  onChange={(e) => setNotifications(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                />
              </label>
              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-sm text-gray-700 dark:text-gray-300">Email Alerts</span>
                <input
                  type="checkbox"
                  checked={emailAlerts}
                  onChange={(e) => setEmailAlerts(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                />
              </label>
              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-sm text-gray-700 dark:text-gray-300">Anomaly Detection Alerts</span>
                <input
                  type="checkbox"
                  checked={anomalyAlerts}
                  onChange={(e) => setAnomalyAlerts(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                />
              </label>
            </div>
          </div>

          {/* Security Section */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
              <Shield className="w-5 h-5 mr-2 text-red-600" />
              Security
            </h2>
            <div className="space-y-3">
              <button className="w-full text-left text-sm text-blue-600 dark:text-blue-400 py-2 border-b dark:border-gray-700">
                Change Password
              </button>
              <button className="w-full text-left text-sm text-blue-600 dark:text-blue-400 py-2 border-b dark:border-gray-700">
                Two-Factor Authentication
              </button>
              <button className="w-full text-left text-sm text-red-600 dark:text-red-400 py-2">
                Delete Account
              </button>
            </div>
          </div>

          {/* Save Button */}
          <div className="flex justify-end">
            <button
              onClick={handleSaveSettings}
              disabled={saving}
              className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-2 rounded-lg flex items-center space-x-2 hover:opacity-90 disabled:opacity-50 transition-all"
            >
              {saving ? (
                <Loader className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              <span>{saving ? 'Saving...' : 'Save Changes'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;