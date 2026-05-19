// frontend/src/contexts/AuthContext.jsx
import React, { createContext, useState, useContext, useEffect } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem('token'));

  useEffect(() => {
    if (token) {
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      loadUser();
    } else {
      setLoading(false);
    }
  }, [token]);

  const loadUser = async () => {
    try {
      const response = await api.get('/api/auth/me');
      setUser(response.data);
    } catch (error) {
      console.error('Failed to load user:', error);
      localStorage.removeItem('token');
      setToken(null);
      delete api.defaults.headers.common['Authorization'];
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      console.log('Attempting login:', email);
      const response = await api.post('/api/auth/login', { email, password });
      console.log('Login response:', response.data);
      
      const { access_token, user: userData } = response.data;
      
      localStorage.setItem('token', access_token);
      api.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;
      setToken(access_token);
      setUser(userData);
      
      toast.success('Login successful!');
      return { success: true, user: userData };
    } catch (error) {
      const message = error.response?.data?.detail || 'Login failed. Please check your credentials.';
      
      // Check if the error is about email verification
      const isVerificationError = message.toLowerCase().includes('verify') || 
                                  message.toLowerCase().includes('confirmed') ||
                                  message.toLowerCase().includes('email not verified');
      
      if (isVerificationError) {
        toast.error('Please verify your email before logging in.');
      } else {
        toast.error(message);
      }
      
      console.error('Login error:', error.response?.data);
      return { 
        success: false, 
        message,
        needsVerification: isVerificationError
      };
    }
  };

  const register = async (userData) => {
    try {
      console.log('Attempting registration:', userData.email);
      const response = await api.post('/api/auth/register', {
        email: userData.email,
        full_name: userData.full_name,
        password: userData.password
      });
      
      console.log('Registration response:', response.data);
      
      if (response.data.requires_confirmation) {
        toast.success('Please check your email to verify your account!');
        return { 
          success: true, 
          requires_confirmation: true,
          message: response.data.message,
          email: userData.email
        };
      }
      
      toast.success('Registration successful! Please login.');
      return { 
        success: true, 
        requires_confirmation: false,
        message: response.data.message
      };
    } catch (error) {
      const message = error.response?.data?.detail || 'Registration failed. Please try again.';
      toast.error(message);
      console.error('Registration error:', error.response?.data);
      return { success: false, message };
    }
  };

  const resendVerification = async (email) => {
    try {
      console.log('Resending verification email to:', email);
      const response = await api.post('/api/auth/resend-verification', { email });
      
      if (response.data.success || response.status === 200) {
        toast.success('Verification email resent! Please check your inbox.');
        return { success: true, message: response.data.message };
      } else {
        throw new Error(response.data.message || 'Failed to resend verification');
      }
    } catch (error) {
      const message = error.response?.data?.detail || 'Failed to resend verification email. Please try again.';
      toast.error(message);
      console.error('Resend verification error:', error.response?.data);
      return { success: false, message };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    delete api.defaults.headers.common['Authorization'];
    setToken(null);
    setUser(null);
    toast.success('Logged out successfully');
  };

  const updateUser = (updatedData) => {
    setUser(prev => ({ ...prev, ...updatedData }));
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      loading, 
      login, 
      register, 
      logout,
      resendVerification,
      updateUser,
      isAuthenticated: !!user, 
      token 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;