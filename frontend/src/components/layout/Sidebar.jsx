// frontend/src/components/layout/Sidebar.jsx
import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  FileText, 
  Settings, 
  TrendingUp, 
  AlertTriangle,
  Brain,
  Users,
  DollarSign,
  BarChart,
  Receipt
} from 'lucide-react';
import { useMode } from '../../contexts/ModeContext';

const Sidebar = ({ mode }) => {
  const { currencySymbol } = useMode();

  const navItems = [
    { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/transactions', icon: DollarSign, label: 'Transactions' },
    { path: '/invoices', icon: FileText, label: 'Invoices' },
    { path: '/forecasts', icon: TrendingUp, label: 'Forecasts' },
    { path: '/anomalies', icon: AlertTriangle, label: 'Anomalies' },
    { path: '/dss', icon: Brain, label: 'Decision Support' },
    { path: '/reports', icon: BarChart, label: 'Reports' },
    { path: '/settings', icon: Settings, label: 'Settings' },
  ];

  // Enterprise-only items
  if (mode === 'enterprise') {
    navItems.push({ path: '/admin', icon: Users, label: 'Admin' });
    navItems.push({ path: '/audit', icon: Receipt, label: 'Audit Logs' });
  }

  return (
    <aside className="w-64 bg-white border-r min-h-screen sticky top-0">
      <div className="p-4 border-b">
        
        <div className="text-xs text-gray-500 mt-1 flex items-center">
          <DollarSign className="w-3 h-3 mr-0.5" />
          Currency: {currencySymbol}
        </div>
      </div>
      
      <nav className="p-3 space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
                isActive
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-gray-700 hover:bg-gray-100'
              }`
            }
          >
            <item.icon size={18} />
            <span className="text-sm font-medium">{item.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Mode Indicator */}
      <div className="absolute bottom-0 left-0 right-0 p-4 border-t bg-gray-50">
        <div className="text-xs text-gray-500">
          <span className="font-medium">Mode:</span>{' '}
          <span className="capitalize">{mode?.replace('_', ' ')}</span>
        </div>
        <div className="text-xs text-gray-500 mt-1">
          <span className="font-medium">AI Status:</span> Active
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
