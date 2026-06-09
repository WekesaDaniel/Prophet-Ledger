// frontend/src/services/api.js
import axios from 'axios';

// Dynamic API URL based on environment
const getApiUrl = () => {
  if (process.env.NODE_ENV === 'production') {
    // In production, use relative path (Vercel handles routing)
    // This works because frontend and backend are on the same domain
    return '/api';
  }
  // Development URL (local)
  return process.env.REACT_APP_API_URL || 'http://localhost:8000/api';
};

const API_URL = getApiUrl();

console.log(`🔧 API URL: ${API_URL} (Environment: ${process.env.NODE_ENV})`);

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

// Helper to get token (checks multiple sources)
const getToken = () => {
  // Check localStorage first
  const token = localStorage.getItem('token');
  if (token) return token;
  
  // Check sessionStorage as fallback
  const sessionToken = sessionStorage.getItem('token');
  if (sessionToken) return sessionToken;
  
  return null;
};

// Helper to set token
const setToken = (token) => {
  if (token) {
    localStorage.setItem('token', token);
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    localStorage.removeItem('token');
    sessionStorage.removeItem('token');
    delete api.defaults.headers.common['Authorization'];
  }
};

// Helper to clear token
const clearToken = () => {
  localStorage.removeItem('token');
  sessionStorage.removeItem('token');
  delete api.defaults.headers.common['Authorization'];
};

// Request interceptor
api.interceptors.request.use(
  (config) => {
    const token = getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Log request for debugging (only in development)
    if (process.env.NODE_ENV !== 'production') {
      console.log(`📤 ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`);
      if (config.data && !(config.data instanceof FormData)) {
        console.log('📦 Request data:', config.data);
      }
    }
    
    return config;
  },
  (error) => {
    console.error('Request error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    // Log response for debugging (only in development)
    if (process.env.NODE_ENV !== 'production') {
      console.log(`📥 Response:`, response.status, response.data);
    }
    return response;
  },
  (error) => {
    const status = error.response?.status;
    const data = error.response?.data;
    
    console.error('Response error:', status, data);
    
    // Handle 401 Unauthorized - token expired or invalid
    if (status === 401) {
      clearToken();
      
      // Show user-friendly message
      const message = data?.detail || 'Your session has expired. Please login again.';
      console.warn(`🔐 Auth error: ${message}`);
      
      // Only redirect if not already on login/register pages
      const publicPaths = ['/login', '/register', '/mode-selector'];
      const currentPath = window.location.pathname;
      
      if (!publicPaths.includes(currentPath)) {
        // Store the attempted URL to redirect back after login
        sessionStorage.setItem('redirectAfterLogin', currentPath);
        window.location.href = '/login';
      }
    }
    
    // Handle 403 Forbidden
    if (status === 403) {
      console.warn('🚫 Forbidden: You don\'t have permission for this action');
    }
    
    // Handle 404 Not Found
    if (status === 404) {
      console.warn('🔍 Endpoint not found:', error.config?.url);
    }
    
    // Handle 500 Server Error
    if (status >= 500) {
      console.error('💥 Server error:', status, data);
    }
    
    return Promise.reject(error);
  }
);

// Export helper methods for token management
export const tokenManager = {
  getToken,
  setToken,
  clearToken,
  isAuthenticated: () => !!getToken()
};

// Export the configured axios instance
export default api;