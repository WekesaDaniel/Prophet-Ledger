// frontend/src/services/uploadService.js
import { tokenManager } from './api';

const getApiUrl = () => {
  if (process.env.NODE_ENV === 'production') {
    return '/api';
  }
  return process.env.REACT_APP_API_URL || 'http://localhost:8000/api';
};

const API_URL = getApiUrl();

console.log(`📁 Upload service initialized with API URL: ${API_URL}`);

export const uploadFile = async (endpoint, file, additionalData = {}) => {
  const token = tokenManager.getToken();
  if (!token) {
    console.error('No authentication token found');
    throw new Error('No authentication token found');
  }

  console.log(`📤 Uploading to: ${API_URL}${endpoint}`);
  console.log(`📄 File: ${file.name}, Size: ${(file.size / 1024).toFixed(2)} KB`);

  const formData = new FormData();
  formData.append('file', file);
  
  Object.entries(additionalData).forEach(([key, value]) => {
    formData.append(key, value);
  });

  try {
    const response = await fetch(`${API_URL}${endpoint}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    });

    console.log(`📥 Response status: ${response.status}`);

    if (!response.ok) {
      if (response.status === 401) {
        tokenManager.clearToken();
        window.location.href = '/login';
        throw new Error('Session expired');
      }
      if (response.status === 404) {
        throw new Error(`Endpoint not found: ${API_URL}${endpoint}`);
      }
      if (response.status === 405) {
        throw new Error(`Method not allowed for endpoint: ${API_URL}${endpoint}. Check if the endpoint exists and accepts POST requests.`);
      }
      const error = await response.json().catch(() => ({ detail: 'Upload failed' }));
      throw new Error(error.detail || `Upload failed with status ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Upload error:', error);
    throw error;
  }
};

export const extractInvoiceText = (file) => uploadFile('/invoices/extract-text', file);
export const processInvoice = (file, extractedText) => uploadFile('/invoices/process', file, { extracted_text: extractedText });