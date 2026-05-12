// frontend/src/components/invoices/PDFUploader.jsx
import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileText, Loader, CheckCircle, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';

const PDFUploader = ({ onUploadComplete }) => {
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState(null);

  const onDrop = useCallback(async (acceptedFiles) => {
    const file = acceptedFiles[0];
    if (!file || file.type !== 'application/pdf') {
      toast.error('Please upload a PDF file');
      return;
    }

    setUploading(true);
    setUploadStatus('uploading');

    // 🔴 HARDCODED - Simulate PDF scanning
    setTimeout(() => {
      // 🔴 HARDCODED EXTRACTED DATA - Replace with actual API response
      const extractedData = {
        vendor: 'Starbucks Coffee',
        total: 12.50,
        tax: 0.75,
        date: new Date().toISOString().split('T')[0],
        invoiceNumber: 'INV-2024-001',
        lineItems: [
          { description: 'Latte', quantity: 2, price: 5.00, total: 10.00 },
          { description: 'Croissant', quantity: 1, price: 2.50, total: 2.50 }
        ]
      };
      
      console.log('📄 Extracted data:', extractedData);
      setUploadStatus('success');
      toast.success('Invoice scanned successfully!');
      
      if (onUploadComplete) {
        onUploadComplete(extractedData);
      }
      setUploading(false);
      
      // Clear status after 3 seconds
      setTimeout(() => setUploadStatus(null), 3000);
    }, 2000);
    
    // ✅ TO DO: Replace with actual API call
    // const formData = new FormData();
    // formData.append('file', file);
    // try {
    //   const response = await api.post('/invoices/scan', formData, {
    //     headers: { 'Content-Type': 'multipart/form-data' }
    //   });
    //   setUploadStatus('success');
    //   toast.success('Invoice scanned successfully!');
    //   if (onUploadComplete) onUploadComplete(response.data);
    // } catch (error) {
    //   setUploadStatus('error');
    //   toast.error('Failed to scan invoice');
    // } finally {
    //   setUploading(false);
    //   setTimeout(() => setUploadStatus(null), 3000);
    // }
  }, [onUploadComplete]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'] },
    maxFiles: 1
  });

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h3 className="text-lg font-semibold mb-4">📄 Scan Invoice</h3>
      
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition ${
          isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
        }`}
      >
        <input {...getInputProps()} />
        
        {uploadStatus === 'uploading' ? (
          <div>
            <Loader className="w-12 h-12 mx-auto text-blue-500 animate-spin mb-3" />
            <p className="text-gray-600">Scanning invoice...</p>
          </div>
        ) : uploadStatus === 'success' ? (
          <div>
            <CheckCircle className="w-12 h-12 mx-auto text-green-500 mb-3" />
            <p className="text-green-600">Invoice scanned successfully!</p>
          </div>
        ) : uploadStatus === 'error' ? (
          <div>
            <XCircle className="w-12 h-12 mx-auto text-red-500 mb-3" />
            <p className="text-red-600">Failed to scan. Try again.</p>
          </div>
        ) : (
          <>
            <Upload className="w-12 h-12 mx-auto text-gray-400 mb-3" />
            <p className="text-gray-600">
              {isDragActive ? 'Drop PDF here' : 'Drag & drop PDF invoice here'}
            </p>
            <p className="text-sm text-gray-400 mt-2">or click to browse</p>
          </>
        )}
      </div>
      
      <div className="mt-4 text-xs text-gray-500 text-center">
        <FileText className="w-3 h-3 inline mr-1" />
        Supports PDF invoices from most vendors
      </div>
    </div>
  );
};

export default PDFUploader;