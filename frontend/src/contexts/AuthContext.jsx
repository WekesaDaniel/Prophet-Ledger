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
      return true;
    } catch (error) {
      const message = error.response?.data?.detail || 'Login failed. Please check your credentials.';
      toast.error(message);
      console.error('Login error:', error.response?.data);
      return false;
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
      toast.success('Registration successful! Please login.');
      return true;
    } catch (error) {
      const message = error.response?.data?.detail || 'Registration failed. Please try again.';
      toast.error(message);
      console.error('Registration error:', error.response?.data);
      return false;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    delete api.defaults.headers.common['Authorization'];
    setToken(null);
    setUser(null);
    toast.success('Logged out successfully');
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, isAuthenticated: !!user, token }}>
      {children}
    </AuthContext.Provider>
  );
};
