// frontend/src/components/invoices/PDFUploader.jsx
import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileText, Loader, CheckCircle, XCircle } from 'lucide-react';
import { supabase } from '../../services/supabaseClient';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';

const PDFUploader = ({ onUploadComplete }) => {
  const { user } = useAuth();
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState(null);

  // Function to extract text from PDF using a service
  const extractPdfData = async (file) => {
    // Using PDF.js or a backend service for extraction
    // For now, we'll send to backend for processing
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await fetch('https://prophetledger-api.vercel.app/api/invoices/extract', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: formData
    });
    
    if (!response.ok) throw new Error('Extraction failed');
    return response.json();
  };

  const onDrop = useCallback(async (acceptedFiles) => {
    const file = acceptedFiles[0];
    if (!file || file.type !== 'application/pdf') {
      toast.error('Please upload a PDF file');
      return;
    }

    if (!user?.id) {
      toast.error('Please login to upload invoices');
      return;
    }

    setUploading(true);
    setUploadStatus('uploading');

    try {
      // 1. Upload file to Supabase Storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;
      const filePath = fileName;

      const { error: uploadError } = await supabase.storage
        .from('invoices')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('invoices')
        .getPublicUrl(filePath);

      // 2. Extract data from PDF (using a simple regex approach first)
      // For production, use a proper PDF parsing library or backend service
      const extractedData = await extractPdfData(file);
      
      // 3. Save invoice record to Supabase
      const invoiceData = {
        user_id: user.id,
        vendor: extractedData.vendor || 'Unknown',
        total_amount: extractedData.total || 0,
        tax: extractedData.tax || 0,
        date: extractedData.date || new Date().toISOString().split('T')[0],
        pdf_url: publicUrl,
        invoice_number: extractedData.invoiceNumber || `INV-${Date.now()}`,
        extracted_data: extractedData,
        status: 'pending'
      };

      const { data: savedInvoice, error: dbError } = await supabase
        .from('invoices')
        .insert([invoiceData])
        .select()
        .single();

      if (dbError) throw dbError;

      setUploadStatus('success');
      toast.success('Invoice scanned and saved successfully!');
      
      if (onUploadComplete) {
        onUploadComplete(savedInvoice);
      }
    } catch (error) {
      console.error('Error processing invoice:', error);
      setUploadStatus('error');
      toast.error(error.message || 'Failed to process invoice');
    } finally {
      setUploading(false);
      setTimeout(() => setUploadStatus(null), 3000);
    }
  }, [user?.id, onUploadComplete]);

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