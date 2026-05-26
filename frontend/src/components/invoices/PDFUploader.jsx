// frontend/src/components/invoices/PDFUploader.jsx
import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileText, Image, File, Loader, CheckCircle, XCircle } from 'lucide-react';
import { supabase } from '../../services/supabaseClient';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';
import { createWorker } from 'tesseract.js';

const SUPPORTED_FILE_TYPES = {
  'application/pdf': { icon: FileText, label: 'PDF', needsOcr: false },
  'image/jpeg': { icon: Image, label: 'JPEG', needsOcr: true },
  'image/png': { icon: Image, label: 'PNG', needsOcr: true },
  'image/heic': { icon: Image, label: 'HEIC', needsOcr: true },
  'image/heif': { icon: Image, label: 'HEIF', needsOcr: true },
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': { icon: File, label: 'Word', needsOcr: false },
  'application/msword': { icon: File, label: 'Word', needsOcr: false },
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': { icon: File, label: 'Excel', needsOcr: false },
  'application/vnd.ms-excel': { icon: File, label: 'Excel', needsOcr: false }
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
          
          // Convert file to base64 or use file directly
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

  // Extract text from PDF using a simple approach (send to backend)
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
      throw new Error('PDF extraction failed');
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

  const onDrop = useCallback(async (acceptedFiles) => {
    const file = acceptedFiles[0];
    const fileType = file.type;
    const fileSupport = SUPPORTED_FILE_TYPES[fileType];
    
    if (!fileSupport) {
      toast.error(`Unsupported file type: ${file.type}. Please upload PDF, Image, Word, or Excel files.`);
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
      
      // Step 1: Extract text based on file type
      if (fileSupport.needsOcr) {
        // Use client-side tesseract.js for images
        toast.info('Running OCR on image... This may take a moment.');
        extractedText = await extractTextFromImage(file);
        if (!extractedText || extractedText.trim().length < 10) {
          throw new Error('Could not extract sufficient text from image. Please try a clearer image.');
        }
      } else if (fileType === 'application/pdf') {
        // Send PDF to backend for text extraction
        toast.info('Extracting text from PDF...');
        extractedText = await extractTextFromPdf(file);
      } else {
        // For Word/Excel, send to backend
        toast.info('Processing document...');
        const formData = new FormData();
        formData.append('file', file);
        const response = await fetch('https://prophetledger-api.vercel.app/api/invoices/extract-text', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: formData
        });
        if (!response.ok) throw new Error('Document extraction failed');
        const data = await response.json();
        extractedText = data.text;
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
        file_type: fileType,
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
      toast.success(`Invoice scanned successfully! Extracted: ${extractedData.vendor}`);
      
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
    accept: SUPPORTED_FILE_TYPES,
    maxFiles: 1
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