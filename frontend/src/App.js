// frontend/src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './contexts/AuthContext';
import { ModeProvider } from './contexts/ModeContext';
import PrivateRoute from './components/shared/PrivateRoute';
import ErrorBoundary from './components/shared/ErrorBoundary';
import Layout from './components/layout/Layout';

// Pages
import Login from './pages/Login';
import Register from './pages/Register';
import ModeSelector from './pages/ModeSelector';
import Dashboard from './pages/Dashboard';
import Transactions from './pages/Transactions';
import Invoices from './pages/Invoices';
import Forecasts from './pages/Forecasts';
import Anomalies from './pages/Anomalies';
import DSS from './pages/DSS';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import Admin from './pages/Admin';
import VerifyEmail from './pages/VerifyEmail';



function App() {
  return (
    <ErrorBoundary>
      <Router>
        <AuthProvider>
          <ModeProvider>
            <Toaster 
              position="top-right"
              toastOptions={{
                duration: 4000,
                style: {
                  background: '#363636',
                  color: '#fff',
                },
              }}
            />
            <Routes>
              {/* Public routes (no layout) */}
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/mode-selector" element={
                <PrivateRoute>
                  <ModeSelector />
                </PrivateRoute>
              } />
              
              {/* Protected routes with persistent layout (sidebar + header) */}
              <Route element={<PrivateRoute><Layout /></PrivateRoute>}>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/transactions" element={<Transactions />} />
                <Route path="/invoices" element={<Invoices />} />
                <Route path="/forecasts" element={<Forecasts />} />
                <Route path="/anomalies" element={<Anomalies />} />
                <Route path="/dss" element={<DSS />} />
                <Route path="/reports" element={<Reports />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="/admin" element={<Admin />} />
                <Route path="/verify-email" element={
                  <PrivateRoute>
                    <VerifyEmail />
                  </PrivateRoute>
                } />

              </Route>
              
              {/* Default redirect */}
              <Route path="/" element={<Navigate to="/dashboard" />} />
              <Route path="*" element={<Navigate to="/dashboard" />} />
            </Routes>
          </ModeProvider>
        </AuthProvider>
      </Router>
    </ErrorBoundary>
  );
}

export default App;