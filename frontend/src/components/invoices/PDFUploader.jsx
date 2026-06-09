// frontend/src/components/invoices/PDFUploader.jsx
import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileText, Image, File, Loader, CheckCircle, XCircle } from 'lucide-react';
import { supabase } from '../../services/supabaseClient';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';

const SUPPORTED_FILE_TYPES = {
  'application/pdf': { icon: FileText, label: 'PDF', needsOcr: false, extensions: ['.pdf'] },
  'image/jpeg': { icon: Image, label: 'JPEG', needsOcr: false, extensions: ['.jpg', '.jpeg'] },
  'image/png': { icon: Image, label: 'PNG', needsOcr: false, extensions: ['.png'] },
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': { icon: File, label: 'Word', needsOcr: false, extensions: ['.docx'] },
  'application/msword': { icon: File, label: 'Word', needsOcr: false, extensions: ['.doc'] },
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': { icon: File, label: 'Excel', needsOcr: false, extensions: ['.xlsx'] },
  'application/vnd.ms-excel': { icon: File, label: 'Excel', needsOcr: false, extensions: ['.xls'] }
};

const ACCEPT_OBJECT = {
  'application/pdf': ['.pdf'],
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png': ['.png'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
  'application/msword': ['.doc'],
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
  'application/vnd.ms-excel': ['.xls']
};

const PDFUploader = ({ onUploadComplete }) => {
  const { user } = useAuth();
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState(null);
  const [fileInfo, setFileInfo] = useState(null);

  // Get API URL
  const getApiUrl = () => {
    return process.env.REACT_APP_API_URL || 'https://prophetledger-api.vercel.app/api';
  };

  // Extract text from file using backend (handles PDF, DOCX, XLSX, Images)
  const extractTextFromFile = async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await fetch(`${getApiUrl()}/invoices/extract-text`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: formData
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Extraction failed');
    }
    const data = await response.json();
    return data.text;
  };

  const processFileWithBackend = async (file, extractedText) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('extracted_text', extractedText);
    
    const response = await fetch(`${getApiUrl()}/invoices/process`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: formData
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Processing failed');
    }
    return response.json();
  };

  const onDrop = useCallback(async (acceptedFiles, fileRejections) => {
    if (fileRejections && fileRejections.length > 0) {
      const rejection = fileRejections[0];
      toast.error(rejection.errors[0].message || 'File upload failed');
      return;
    }

    const file = acceptedFiles[0];
    if (!file) return;

    const fileType = file.type;
    const isSupported = Object.keys(ACCEPT_OBJECT).includes(fileType);
    
    if (!isSupported) {
      toast.error(`Unsupported file type. Please upload PDF, Image, Word, or Excel files.`);
      return;
    }

    let fileSupport = SUPPORTED_FILE_TYPES[fileType];
    if (!fileSupport) {
      const ext = '.' + file.name.split('.').pop().toLowerCase();
      for (const [mime, info] of Object.entries(SUPPORTED_FILE_TYPES)) {
        if (info.extensions.includes(ext)) {
          fileSupport = info;
          break;
        }
      }
    }

    if (!fileSupport || !user?.id) {
      toast.error(!user?.id ? 'Please login to upload invoices' : 'Unsupported file type');
      return;
    }

    setFileInfo({
      name: file.name,
      type: fileSupport.label,
      size: (file.size / 1024).toFixed(2)
    });
    setUploading(true);
    setUploadStatus('uploading');

    try {
      // Extract text from file using backend (handles all formats)
      toast.loading('Processing file...', { id: 'process' });
      const extractedText = await extractTextFromFile(file);
      toast.dismiss('process');
      
      if (!extractedText || extractedText.trim().length < 10) {
        throw new Error('Could not extract sufficient text from file');
      }
      
      // Upload file to Supabase Storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('invoices')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('invoices')
        .getPublicUrl(fileName);

      // Process extracted text to get structured invoice data
      const extractedData = await processFileWithBackend(file, extractedText);
      
      const invoiceData = {
        user_id: user.id,
        vendor: extractedData.vendor || 'Unknown',
        total_amount: extractedData.total || 0,
        tax: extractedData.tax || 0,
        date: extractedData.date || new Date().toISOString().split('T')[0],
        pdf_url: publicUrl,
        invoice_number: extractedData.invoiceNumber || `INV-${Date.now()}`,
        extracted_data: extractedData,
        status: 'pending',
        file_name: file.name
      };

      const { data: savedInvoice, error: dbError } = await supabase
        .from('invoices')
        .insert([invoiceData])
        .select()
        .single();

      if (dbError) throw dbError;

      setUploadStatus('success');
      toast.success(`Invoice scanned successfully!`);
      
      if (onUploadComplete) onUploadComplete(savedInvoice);
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
    accept: ACCEPT_OBJECT,
    maxFiles: 1,
    multiple: false
  });

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h3 className="text-lg font-semibold mb-4">📄 Scan Invoice / Receipt</h3>
      
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
            <p className="text-gray-600">Processing {fileInfo?.name}...</p>
            <p className="text-sm text-gray-400 mt-1">Extracting data</p>
          </div>
        ) : uploadStatus === 'success' ? (
          <div>
            <CheckCircle className="w-12 h-12 mx-auto text-green-500 mb-3" />
            <p className="text-green-600">Invoice processed successfully!</p>
            {fileInfo && (
              <p className="text-sm text-green-500 mt-1">{fileInfo.name}</p>
            )}
          </div>
        ) : uploadStatus === 'error' ? (
          <div>
            <XCircle className="w-12 h-12 mx-auto text-red-500 mb-3" />
            <p className="text-red-600">Failed to process. Try again.</p>
          </div>
        ) : (
          <>
            <Upload className="w-12 h-12 mx-auto text-gray-400 mb-3" />
            <p className="text-gray-600">
              {isDragActive ? 'Drop file here' : 'Drag & drop invoice/receipt here'}
            </p>
            <p className="text-sm text-gray-400 mt-2">or click to browse</p>
            <div className="mt-3 flex flex-wrap justify-center gap-2 text-xs text-gray-500">
              <span className="px-2 py-1 bg-gray-100 rounded">PDF</span>
              <span className="px-2 py-1 bg-gray-100 rounded">JPEG/PNG</span>
              <span className="px-2 py-1 bg-gray-100 rounded">Word (.docx)</span>
              <span className="px-2 py-1 bg-gray-100 rounded">Excel (.xlsx)</span>
            </div>
          </>
        )}
      </div>
      
      <div className="mt-4 text-xs text-gray-500 text-center">
        <FileText className="w-3 h-3 inline mr-1" />
        Supports PDF, Images, Word documents, and Excel files
      </div>
    </div>
  );
};

export default PDFUploader;