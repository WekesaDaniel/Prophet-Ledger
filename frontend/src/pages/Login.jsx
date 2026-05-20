// frontend/src/pages/Login.jsx
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Loader, Mail, Lock, Eye, EyeOff, AlertCircle, CheckCircle } from 'lucide-react';
import { supabase } from '../services/supabaseClient';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [needsVerification, setNeedsVerification] = useState(false);
  const [unverifiedEmail, setUnverifiedEmail] = useState('');
  const [resendSuccess, setResendSuccess] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setNeedsVerification(false);
    setResendSuccess(false);
    
    if (!email || !password) {
      setError('Please enter both email and password');
      return;
    }
    
    setLoading(true);
    
    try {
      // Direct Supabase login
      const { data, error: supabaseError } = await supabase.auth.signInWithPassword({
        email: email,
        password: password
      });
      
      if (supabaseError) {
        // Check if error is due to unverified email
        if (supabaseError.message.toLowerCase().includes('email not confirmed') ||
            supabaseError.message.toLowerCase().includes('verify') ||
            supabaseError.message.toLowerCase().includes('unverified')) {
          
          setNeedsVerification(true);
          setUnverifiedEmail(email);
          setError(''); // Clear any previous error
          setLoading(false);
          return;
        } 
        // Handle invalid credentials
        else if (supabaseError.message.toLowerCase().includes('invalid login credentials')) {
          setError('Invalid email or password. Please check your credentials and try again.');
        } else {
          setError(supabaseError.message || 'Login failed. Please try again.');
        }
        
        setLoading(false);
        return;
      }
      
      if (data?.session) {
        // Store session in your auth context
        const result = await login(email, password);
        if (result.success) {
          navigate('/mode-selector');
        } else {
          setError(result.message || 'Login failed');
        }
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
      console.error('Login error:', err);
    }
    
    setLoading(false);
  };

  const resendVerificationEmail = async () => {
    setLoading(true);
    setResendSuccess(false);
    
    const { error: resendError } = await supabase.auth.resend({
      type: 'signup',
      email: unverifiedEmail
    });
    
    if (resendError) {
      setError(resendError.message || 'Failed to resend verification email');
    } else {
      setResendSuccess(true);
      setError('');
    }
    setLoading(false);
  };

  // Email verification required screen
  if (needsVerification) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="flex justify-center mb-4">
            <Mail className="w-16 h-16 text-yellow-500" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Verify Your Email</h2>
          <p className="text-gray-600 mb-2">
            Please verify your email address before logging in.
          </p>
          <p className="text-blue-600 font-medium mb-4">{unverifiedEmail}</p>
          <p className="text-gray-500 text-sm mb-6">
            We've sent a confirmation link to your email. Click the link in the email to activate your account.
          </p>
          
          {resendSuccess && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <p className="text-green-700 text-sm">Verification email resent! Please check your inbox.</p>
            </div>
          )}
          
          <div className="space-y-3">
            <button
              onClick={() => window.open('https://mail.google.com', '_blank')}
              className="w-full bg-gradient-to-r from-red-500 to-red-600 text-white px-6 py-2 rounded-lg hover:opacity-90 transition-all flex items-center justify-center gap-2"
            >
              <Mail className="w-4 h-4" />
              Open Gmail
            </button>
            
            <button
              onClick={resendVerificationEmail}
              disabled={loading}
              className="w-full bg-gray-200 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-300 transition-all disabled:opacity-50"
            >
              {loading ? 'Sending...' : 'Resend Verification Email'}
            </button>
            
            <button
              onClick={() => {
                setNeedsVerification(false);
                setError('');
              }}
              className="w-full text-blue-600 hover:text-blue-700 text-sm mt-2"
            >
              ← Back to Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">🔮</div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            ProphetLedger
          </h1>
          <p className="text-gray-500 text-sm mt-2">Sign in to your account</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start space-x-2">
            <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
            <p className="text-red-700 text-sm flex-1">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                placeholder="you@example.com"
                required
                autoComplete="email"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                placeholder="••••••••"
                required
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2"
              >
                {showPassword ? <EyeOff className="w-4 h-4 text-gray-400" /> : <Eye className="w-4 h-4 text-gray-400" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-2 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="flex items-center justify-center">
                <Loader className="w-4 h-4 animate-spin mr-2" />
                Signing in...
              </span>
            ) : (
              'Sign In'
            )}
          </button>
        </form>

        <p className="text-center text-sm text-gray-600 mt-6">
          Don't have an account?{' '}
          <Link to="/register" className="text-blue-600 hover:text-blue-700 font-medium">
            Create account
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Login;