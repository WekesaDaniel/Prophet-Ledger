// frontend/src/pages/Dashboard.jsx
import React from 'react';
import { useMode } from '../contexts/ModeContext';
import { useAuth } from '../contexts/AuthContext';
import KpiGrid from '../components/dashboard/KpiGrid';
import TrendChart from '../components/dashboard/TrendChart';
import AlertCenter from '../components/dashboard/AlertCenter';
import AnomalyTable from '../components/dashboard/AnomalyTable';
import RiskHeatmap from '../components/dashboard/RiskHeatmap';
import { 
  LayoutDashboard, 
  TrendingUp, 
  Shield, 
  Zap,
  Activity,
  DollarSign
} from 'lucide-react';

const Dashboard = () => {
  const { mode, currency, currencySymbol } = useMode();
  const { user, getUserName } = useAuth();

  const getModeGreeting = () => {
    switch(mode) {
      case 'personal': return 'Track your personal finances';
      case 'small_business': return 'Grow your business with data-driven insights';
      case 'enterprise': return 'Enterprise-grade financial intelligence';
      default: return 'Welcome to your financial command center';
    }
  };

  const getModeIcon = () => {
    switch(mode) {
      case 'personal': return <Zap className="w-5 h-5 text-green-500" />;
      case 'small_business': return <TrendingUp className="w-5 h-5 text-blue-500" />;
      case 'enterprise': return <Shield className="w-5 h-5 text-purple-500" />;
      default: return <LayoutDashboard className="w-5 h-5 text-gray-500" />;
    }
  };

  // Get the display name - prioritize full_name, then email username, fallback to 'User'
  const displayName = user?.full_name?.split(' ')[0] || 
                      getUserName() || 
                      user?.email?.split('@')[0] || 
                      'User';

  return (
    <>
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="px-6 py-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">
                Welcome back, {displayName}!
              </h1>
              <p className="text-blue-100 mt-1 flex items-center">
                {getModeIcon()}
                <span className="ml-1">{getModeGreeting()}</span>
              </p>
              <div className="flex items-center mt-2 text-sm text-blue-200">
                <DollarSign className="w-4 h-4 mr-1" />
                Currency: {currency} ({currencySymbol})
              </div>
            </div>
            <div className="hidden md:block">
              <Activity className="w-12 h-12 text-blue-200 opacity-50" />
            </div>
          </div>
        </div>
      </div>
      
      <div className="px-4 py-6 lg:px-8">

        {/* KPI Grid */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Key Metrics</h2>
          <KpiGrid mode={mode} currencySymbol={currencySymbol} />
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <TrendChart metric="cashflow" currencySymbol={currencySymbol} />
          <TrendChart metric="expenses" currencySymbol={currencySymbol} />
        </div>

        {/* Risk Heatmap */}
        <div className="mb-8">
          <RiskHeatmap />
        </div>

        {/* Anomaly Detection */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Anomaly Detection</h2>
          <AnomalyTable limit={5} />
        </div>
        
        {/* Footer */}
        <div className="mt-8 text-center text-xs text-gray-400">
          <p>Last updated: {new Date().toLocaleString()}</p>
          <p className="mt-1">🔮 ProphetLedger - AI-Driven Financial Intelligence | Currency: {currency} ({currencySymbol})</p>
        </div>
      </div>
    </>
  );
};

export default Dashboard;