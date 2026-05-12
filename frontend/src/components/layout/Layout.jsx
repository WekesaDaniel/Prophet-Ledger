// frontend/src/components/layout/Layout.jsx
import React from 'react';
import { Outlet } from 'react-router-dom';
import { useMode } from '../../contexts/ModeContext';
import Header from './Header';
import Sidebar from './Sidebar';
import Chatbot from '../chat/Chatbot';

const Layout = () => {
  const { mode } = useMode();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <Header />
      
      <div className="flex">
        <Sidebar mode={mode} />
        
        <main className="flex-1">
          <Outlet /> {/* This renders the current page content */}
        </main>
      </div>
      
      {/* Floating Chatbot - Available on all pages */}
      <Chatbot />
    </div>
  );
};

export default Layout;