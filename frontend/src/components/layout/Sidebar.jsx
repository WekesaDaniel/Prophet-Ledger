import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  FileText, 
  Settings, 
  TrendingUp, 
  AlertTriangle,
  FileSearch,
  Brain,
  Users
} from 'lucide-react';

const Sidebar = ({ mode }) => {
  const navItems = [
    { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/invoices', icon: FileText, label: 'Invoices' },
    { path: '/forecasts', icon: TrendingUp, label: 'Forecasts' },
    { path: '/anomalies', icon: AlertTriangle, label: 'Anomalies' },
  ];

  // Mode-specific items
  if (mode === 'small_business' || mode === 'enterprise') {
    navItems.push({ path: '/dss', icon: Brain, label: 'Decision Support' });
  }

  if (mode === 'enterprise') {
    navItems.push({ path: '/admin', icon: Users, label: 'Admin' });
  }

  navItems.push({ path: '/settings', icon: Settings, label: 'Settings' });

  return (
    <aside className="w-64 bg-gray-50 border-r min-h-screen hidden lg:block">
      <nav className="p-4 space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center space-x-3 px-4 py-2 rounded-lg transition-colors ${
                isActive
                  ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-700'
                  : 'text-gray-700 hover:bg-gray-100'
              }`
            }
          >
            <item.icon size={18} />
            <span className="text-sm font-medium">{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </aside>
  );
};

export default Sidebar;
