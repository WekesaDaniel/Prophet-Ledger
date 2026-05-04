import React, { useContext } from 'react';
import { useMode } from '../contexts/ModeContext';
import { useAuth } from '../contexts/AuthContext';
import KpiGrid from '../components/dashboard/KpiGrid';
import TrendChart from '../components/dashboard/TrendChart';
import AlertCenter from '../components/dashboard/AlertCenter';
import ScenarioSimulator from '../components/dss/ScenarioSimulator';
import Header from '../components/layout/Header';
import Sidebar from '../components/layout/Sidebar';
import { 
  LayoutDashboard, 
  TrendingUp, 
  Shield, 
  Zap,
  ChevronRight,
  Activity
} from 'lucide-react';

const Dashboard = () => {
  const { mode } = useMode();
  const { user } = useAuth();

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <Header />
      
      <div className="flex">
        <Sidebar mode={mode} />
        
        <main className="flex-1">
          {/* Hero Section */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
            <div className="px-6 py-8 lg:px-8">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-bold">
                    Welcome back, {user?.full_name?.split(' ')[0] || 'User'}
                  </h1>
                  <p className="text-blue-100 mt-1 flex items-center">
                    {getModeIcon()}
                    <span className="ml-1">{getModeGreeting()}</span>
                  </p>
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
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Key Metrics</h2>
                <button className="text-sm text-blue-600 hover:text-blue-800 flex items-center">
                  View Details <ChevronRight className="w-4 h-4 ml-1" />
                </button>
              </div>
              <KpiGrid mode={mode} />
            </div>
            
            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              <TrendChart metric="cashflow" />
              <TrendChart metric="expenses" />
            </div>
            
            {/* DSS Section - Only for Business/Enterprise */}
            {(mode === 'small_business' || mode === 'enterprise') && (
              <div className="mb-8">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                    <TrendingUp className="w-5 h-5 mr-2 text-blue-600" />
                    Decision Support System
                  </h2>
                  <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                    Powered by AI
                  </span>
                </div>
                <ScenarioSimulator userId={user?.id} />
              </div>
            )}
            
            {/* Footer Stats */}
            <div className="mt-8 text-center text-xs text-gray-400">
              <p>Last updated: {new Date().toLocaleString()}</p>
              <p className="mt-1">🔮 ProphetLedger - AI-Driven Financial Intelligence</p>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Dashboard;
