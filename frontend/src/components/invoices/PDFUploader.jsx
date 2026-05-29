// frontend/src/components/invoices/PDFUploader.jsx
import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileText, Image, File, Loader, CheckCircle, XCircle } from 'lucide-react';
import { supabase } from '../../services/supabaseClient';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';
import { createWorker } from 'tesseract.js';

const SUPPORTED_FILE_TYPES = {
  'application/pdf': { icon: FileText, label: 'PDF', needsOcr: false, extensions: ['.pdf'] },
  'image/jpeg': { icon: Image, label: 'JPEG', needsOcr: true, extensions: ['.jpg', '.jpeg'] },
  'image/png': { icon: Image, label: 'PNG', needsOcr: true, extensions: ['.png'] },
  'image/heic': { icon: Image, label: 'HEIC', needsOcr: true, extensions: ['.heic'] },
  'image/heif': { icon: Image, label: 'HEIF', needsOcr: true, extensions: ['.heif'] },
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': { icon: File, label: 'Word', needsOcr: false, extensions: ['.docx'] },
  'application/msword': { icon: File, label: 'Word', needsOcr: false, extensions: ['.doc'] },
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': { icon: File, label: 'Excel', needsOcr: false, extensions: ['.xlsx'] },
  'application/vnd.ms-excel': { icon: File, label: 'Excel', needsOcr: false, extensions: ['.xls'] }
};

// Build accept object for react-dropzone (MIME type -> extensions)
const ACCEPT_OBJECT = {
  'application/pdf': ['.pdf'],
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png': ['.png'],
  'image/heic': ['.heic'],
  'image/heif': ['.heif'],
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
  const [ocrProgress, setOcrProgress] = useState(0);

  // Extract text from image using tesseract.js (client-side)
  const extractTextFromImage = async (file) => {
    return new Promise((resolve, reject) => {
      const worker = createWorker({
        logger: m => {
          if (m.status === 'recognizing text') {
            setOcrProgress(Math.floor(m.progress * 100));
          }
        }
      });
      
      (async () => {
        try {
          await worker.load();
          await worker.loadLanguage('eng');
          await worker.initialize('eng');
          const { data: { text } } = await worker.recognize(file);
          await worker.terminate();
          resolve(text);
        } catch (error) {
          await worker.terminate();
          reject(error);
        }
      })();
    });
  };

  // Extract text from PDF using backend
  const extractTextFromPdf = async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await fetch('https://prophetledger-api.vercel.app/api/invoices/extract-text', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: formData
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'PDF extraction failed');
    }
    const data = await response.json();
    return data.text;
  };

  // Extract text from Word/Excel using backend
  const extractTextFromDocument = async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await fetch('https://prophetledger-api.vercel.app/api/invoices/extract-text', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: formData
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Document extraction failed');
    }
    const data = await response.json();
    return data.text;
  };

  // Process file and extract data using backend API
  const processFileWithBackend = async (file, extractedText) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('extracted_text', extractedText);
    
    const response = await fetch('https://prophetledger-api.vercel.app/api/invoices/process', {
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
    // Handle file rejection
    if (fileRejections && fileRejections.length > 0) {
      const rejection = fileRejections[0];
      if (rejection.errors[0].code === 'file-invalid-type') {
        toast.error(`Unsupported file type. Please upload PDF, JPEG, PNG, Word (.docx), or Excel (.xlsx) files.`);
      } else {
        toast.error(rejection.errors[0].message || 'File upload failed');
      }
      return;
    }

    const file = acceptedFiles[0];
    if (!file) return;

    const fileType = file.type;
    
    // Check if file type is supported by MIME or extension
    const isSupported = Object.keys(ACCEPT_OBJECT).includes(fileType) || 
                        ACCEPT_OBJECT[fileType] || 
                        ['.pdf', '.jpg', '.jpeg', '.png', '.docx', '.doc', '.xlsx', '.xls'].some(ext => 
                          file.name.toLowerCase().endsWith(ext));
    
    if (!isSupported) {
      toast.error(`Unsupported file type: ${file.name}. Please upload PDF, Image, Word, or Excel files.`);
      return;
    }

    // Get file support info
    let fileSupport = SUPPORTED_FILE_TYPES[fileType];
    if (!fileSupport) {
      // Determine by extension
      const ext = '.' + file.name.split('.').pop().toLowerCase();
      for (const [mime, info] of Object.entries(SUPPORTED_FILE_TYPES)) {
        if (info.extensions.includes(ext)) {
          fileSupport = info;
          break;
        }
      }
    }

    if (!fileSupport) {
      toast.error(`Unsupported file type: ${file.name}`);
      return;
    }

    if (!user?.id) {
      toast.error('Please login to upload invoices');
      return;
    }

    setFileInfo({
      name: file.name,
      type: fileSupport.label,
      size: (file.size / 1024).toFixed(2)
    });
    setUploading(true);
    setUploadStatus('uploading');
    setOcrProgress(0);

    try {
      let extractedText = '';
      const isImage = fileSupport.needsOcr;
      const isPdf = fileType === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
      
      // Step 1: Extract text based on file type
      if (isImage) {
        toast.loading('Running OCR on image... This may take a moment.', { id: 'ocr' });
        extractedText = await extractTextFromImage(file);
        toast.dismiss('ocr');
        if (!extractedText || extractedText.trim().length < 10) {
          throw new Error('Could not extract sufficient text from image. Please try a clearer image.');
        }
      } else if (isPdf) {
        toast.loading('Extracting text from PDF...', { id: 'pdf' });
        extractedText = await extractTextFromPdf(file);
        toast.dismiss('pdf');
        if (!extractedText || extractedText.trim().length < 10) {
          throw new Error('Could not extract sufficient text from PDF. The file might be scanned or image-based.');
        }
      } else {
        // For Word/Excel
        toast.loading('Processing document...', { id: 'doc' });
        extractedText = await extractTextFromDocument(file);
        toast.dismiss('doc');
      }
      
      // Step 2: Upload file to Supabase Storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('invoices')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('invoices')
        .getPublicUrl(fileName);

      // Step 3: Process extracted text to get structured invoice data
      const extractedData = await processFileWithBackend(file, extractedText);
      
      // Step 4: Save invoice record to Supabase
      const invoiceData = {
        user_id: user.id,
        vendor: extractedData.vendor || 'Unknown',
        total_amount: extractedData.total || 0,
        tax: extractedData.tax || 0,
        date: extractedData.date || new Date().toISOString().split('T')[0],
        pdf_url: publicUrl,
        file_type: fileType || 'application/octet-stream',
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
      toast.success(`Invoice scanned successfully! Extracted: ${extractedData.vendor || 'invoice data'}`);
      
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
            {ocrProgress > 0 && ocrProgress < 100 ? (
              <>
                <Loader className="w-12 h-12 mx-auto text-blue-500 animate-spin mb-3" />
                <p className="text-gray-600">Running OCR... {ocrProgress}%</p>
                <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                  <div 
                    className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${ocrProgress}%` }}
                  />
                </div>
              </>
            ) : (
              <>
                <Loader className="w-12 h-12 mx-auto text-blue-500 animate-spin mb-3" />
                <p className="text-gray-600">Processing {fileInfo?.name}...</p>
              </>
            )}
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