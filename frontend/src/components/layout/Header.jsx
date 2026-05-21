import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useMode } from '../../contexts/ModeContext';
import { 
  LayoutDashboard, 
  FileText, 
  Settings, 
  LogOut, 
  Menu, 
  X,
  User,
  Bell,
  Moon,
  Sun
} from 'lucide-react';
import AlertCenter from '../dashboard/AlertCenter';

const logo = "/favicon.ico";

const Header = () => {
  const { user, logout } = useAuth();
  const { mode } = useMode();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    document.documentElement.classList.toggle('dark');
  };

  const getModeBadgeColor = () => {
    switch(mode) {
      case 'personal': return 'bg-green-100 text-green-800';
      case 'small_business': return 'bg-blue-100 text-blue-800';
      case 'enterprise': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getModeDisplayName = () => {
    switch(mode) {
      case 'personal': return 'Personal';
      case 'small_business': return 'Small Business';
      case 'enterprise': return 'Enterprise';
      default: return mode;
    }
  };

  return (
    <header className="bg-white shadow-sm border-b sticky top-0 z-50">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden mr-3 text-gray-500"
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
            <Link to="/dashboard" className="flex items-center space-x-2">
              <img
                src="/logo512.png"
                alt="Logo"
                className="w-8 h-8 object-contain"
              />
              <span className="font-bold text-xl bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                ProphetLedger
              </span>
            </Link>
            <span className={`ml-3 px-2 py-1 text-xs font-medium rounded-full ${getModeBadgeColor()}`}>
              {getModeDisplayName()}
            </span>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center space-x-4">
            <Link to="/dashboard" className="flex items-center space-x-1 text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md">
              <LayoutDashboard size={18} />
              <span>Dashboard</span>
            </Link>
            <Link to="/invoices" className="flex items-center space-x-1 text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md">
              <FileText size={18} />
              <span>Invoices</span>
            </Link>
            <Link to="/settings" className="flex items-center space-x-1 text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md">
              <Settings size={18} />
              <span>Settings</span>
            </Link>
          </nav>

          {/* Right side icons */}
          <div className="flex items-center space-x-3">
            <AlertCenter />
            
            <button
              onClick={toggleDarkMode}
              className="p-2 rounded-full hover:bg-gray-100"
            >
              {darkMode ? <Sun size={18} /> : <Moon size={18} />}
            </button>

            <div className="relative group">
              <button className="flex items-center space-x-2 p-2 rounded-full hover:bg-gray-100">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                  {user?.full_name?.charAt(0) || 'U'}
                </div>
              </button>
              
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                <div className="p-3 border-b">
                  <p className="font-medium text-sm">{user?.full_name}</p>
                  <p className="text-xs text-gray-500">{user?.email}</p>
                </div>
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-b-lg flex items-center space-x-2"
                >
                  <LogOut size={14} />
                  <span>Sign out</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t p-4 space-y-2">
          <Link to="/dashboard" className="flex items-center space-x-2 p-2 hover:bg-gray-50 rounded-md">
            <LayoutDashboard size={18} />
            <span>Dashboard</span>
          </Link>
          <Link to="/invoices" className="flex items-center space-x-2 p-2 hover:bg-gray-50 rounded-md">
            <FileText size={18} />
            <span>Invoices</span>
          </Link>
          <Link to="/settings" className="flex items-center space-x-2 p-2 hover:bg-gray-50 rounded-md">
            <Settings size={18} />
            <span>Settings</span>
          </Link>
        </div>
      )}
    </header>
  );
};

export default Header;
