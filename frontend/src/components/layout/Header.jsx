import React, { useState, useEffect } from 'react';
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
  const [darkMode, setDarkMode] = useState(() => {
    // Check localStorage for saved preference
    const saved = localStorage.getItem('darkMode');
    if (saved !== null) {
      return saved === 'true';
    }
    // Check system preference
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });
  const navigate = useNavigate();

  useEffect(() => {
    // Apply dark mode class on mount and when darkMode changes
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('darkMode', 'true');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('darkMode', 'false');
    }
  }, [darkMode]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  const getModeBadgeColor = () => {
    if (darkMode) {
      switch(mode) {
        case 'personal': return 'bg-green-900 text-green-200';
        case 'small_business': return 'bg-blue-900 text-blue-200';
        case 'enterprise': return 'bg-purple-900 text-purple-200';
        default: return 'bg-gray-800 text-gray-200';
      }
    } else {
      switch(mode) {
        case 'personal': return 'bg-green-100 text-green-800';
        case 'small_business': return 'bg-blue-100 text-blue-800';
        case 'enterprise': return 'bg-purple-100 text-purple-800';
        default: return 'bg-gray-100 text-gray-800';
      }
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

  // Dynamic classes based on dark mode
  const headerClasses = darkMode 
    ? 'bg-gray-900 border-gray-800 shadow-sm border-b sticky top-0 z-50'
    : 'bg-white shadow-sm border-b sticky top-0 z-50';
    
  const linkClasses = darkMode
    ? 'text-gray-300 hover:text-blue-400'
    : 'text-gray-700 hover:text-blue-600';
    
  const buttonHoverClasses = darkMode
    ? 'hover:bg-gray-800'
    : 'hover:bg-gray-100';
    
  const dropdownClasses = darkMode
    ? 'bg-gray-800 border-gray-700'
    : 'bg-white border';
    
  const mobileMenuClasses = darkMode
    ? 'border-gray-800 bg-gray-900'
    : 'border-t bg-white';

  return (
    <header className={headerClasses}>
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className={`lg:hidden mr-3 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}
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
            <Link to="/dashboard" className={`flex items-center space-x-1 ${linkClasses} px-3 py-2 rounded-md`}>
              <LayoutDashboard size={18} />
              <span>Dashboard</span>
            </Link>
            <Link to="/invoices" className={`flex items-center space-x-1 ${linkClasses} px-3 py-2 rounded-md`}>
              <FileText size={18} />
              <span>Invoices</span>
            </Link>
            <Link to="/settings" className={`flex items-center space-x-1 ${linkClasses} px-3 py-2 rounded-md`}>
              <Settings size={18} />
              <span>Settings</span>
            </Link>
          </nav>

          {/* Right side icons */}
          <div className="flex items-center space-x-3">
            <AlertCenter />
            
            <button
              onClick={toggleDarkMode}
              className={`p-2 rounded-full ${buttonHoverClasses} transition-colors`}
              aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {darkMode ? <Sun size={18} className="text-yellow-400" /> : <Moon size={18} className="text-gray-700" />}
            </button>

            <div className="relative group">
              <button className={`flex items-center space-x-2 p-2 rounded-full ${buttonHoverClasses}`}>
                <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                  {user?.full_name?.charAt(0) || user?.email?.charAt(0) || 'U'}
                </div>
              </button>
              
              <div className={`absolute right-0 mt-2 w-48 rounded-lg shadow-lg border ${dropdownClasses} opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50`}>
                <div className={`p-3 border-b ${darkMode ? 'border-gray-700' : ''}`}>
                  <p className={`font-medium text-sm ${darkMode ? 'text-white' : ''}`}>{user?.full_name || user?.email}</p>
                  <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{user?.email}</p>
                </div>
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-b-lg flex items-center space-x-2"
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
        <div className={`lg:hidden border-t p-4 space-y-2 ${mobileMenuClasses}`}>
          <Link to="/dashboard" className={`flex items-center space-x-2 p-2 rounded-md ${buttonHoverClasses} ${darkMode ? 'text-gray-300' : ''}`}>
            <LayoutDashboard size={18} />
            <span>Dashboard</span>
          </Link>
          <Link to="/invoices" className={`flex items-center space-x-2 p-2 rounded-md ${buttonHoverClasses} ${darkMode ? 'text-gray-300' : ''}`}>
            <FileText size={18} />
            <span>Invoices</span>
          </Link>
          <Link to="/settings" className={`flex items-center space-x-2 p-2 rounded-md ${buttonHoverClasses} ${darkMode ? 'text-gray-300' : ''}`}>
            <Settings size={18} />
            <span>Settings</span>
          </Link>
        </div>
      )}
    </header>
  );
};

export default Header;
