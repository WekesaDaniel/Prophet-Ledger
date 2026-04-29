import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './contexts/AuthContext';
import { ModeProvider } from './contexts/ModeContext';
import Login from './pages/Login';
import Register from './pages/Register';
import ModeSelector from './pages/ModeSelector';
import Dashboard from './pages/Dashboard';
import Invoices from './pages/Invoices';
import Settings from './pages/Settings';
import PrivateRoute from './components/shared/PrivateRoute';

function App() {
  return (
    <Router>
      <AuthProvider>
        <ModeProvider>
          <Toaster position="top-right" />
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/mode-selector" element={<ModeSelector />} />
            <Route path="/dashboard" element={
              <PrivateRoute>
                <Dashboard />
              </PrivateRoute>
            } />
            <Route path="/invoices" element={
              <PrivateRoute>
                <Invoices />
              </PrivateRoute>
            } />
            <Route path="/settings" element={
              <PrivateRoute>
                <Settings />
              </PrivateRoute>
            } />
            <Route path="/" element={<Navigate to="/dashboard" />} />
          </Routes>
        </ModeProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
