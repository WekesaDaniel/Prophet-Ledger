// frontend/src/services/uploadService.js
import { tokenManager } from './api';

const getApiUrl = () => {
  if (process.env.NODE_ENV === 'production') {
    return '/api';
  }
  return process.env.REACT_APP_API_URL || 'http://localhost:8000/api';
};

const API_URL = getApiUrl();

export const uploadFile = async (endpoint, file, additionalData = {}) => {
  const token = tokenManager.getToken();
  if (!token) {
    throw new Error('No authentication token found');
  }

  const formData = new FormData();
  formData.append('file', file);
  
  // Add additional data fields
  Object.entries(additionalData).forEach(([key, value]) => {
    formData.append(key, value);
  });

  const response = await fetch(`${API_URL}${endpoint}`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`
    },
    body: formData
  });

  if (!response.ok) {
    if (response.status === 401) {
      tokenManager.clearToken();
      window.location.href = '/login';
      throw new Error('Session expired');
    }
    const error = await response.json().catch(() => ({ detail: 'Upload failed' }));
    throw new Error(error.detail || 'Upload failed');
  }

  return response.json();
};

export const extractInvoiceText = (file) => uploadFile('/invoices/extract-text', file);
export const processInvoice = (file, extractedText) => uploadFile('/invoices/process', file, { extracted_text: extractedText });