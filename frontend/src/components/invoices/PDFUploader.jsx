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
  const [ocrProgress, setOcrProgress] = useState(0);

  // Client-side OCR for images using tesseract.js
  const extractTextFromImage = async (file) => {
    const worker = await createWorker('eng');
    
    worker.setLogger(m => {
      if (m.status === 'recognizing text') {
        setOcrProgress(Math.floor(m.progress * 100));
      }
    });
    
    const { data: { text } } = await worker.recognize(file);
    await worker.terminate();
    return text;
  };

  // Simple regex-based invoice data extraction (client-side)
  const extractInvoiceDataSimple = (text) => {
    const data = {};
    
    // Extract vendor
    const vendorMatch = text.match(/(?:Vendor|From|Company|Store)[:\s]+([^\n]+)/i);
    data.vendor = vendorMatch ? vendorMatch[1].trim() : 'Unknown';
    
    // Extract total amount
    const totalMatch = text.match(/(?:Total|Amount Due)[:\s]*[\$£€]?\s*([\d,]+\.?\d*)/i);
    data.total = totalMatch ? parseFloat(totalMatch[1].replace(/,/g, '')) : 0;
    
    // Extract tax
    const taxMatch = text.match(/(?:Tax|GST|VAT)[:\s]*[\$£€]?\s*([\d,]+\.?\d*)/i);
    data.tax = taxMatch ? parseFloat(taxMatch[1].replace(/,/g, '')) : 0;
    
    // Extract date
    const dateMatch = text.match(/(?:Date|Invoice Date)[:\s]+(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})/i);
    data.date = dateMatch ? dateMatch[1] : new Date().toISOString().split('T')[0];
    
    // Extract invoice number
    const invMatch = text.match(/(?:Invoice|INV)[:\s#]*([A-Z0-9-]+)/i);
    data.invoiceNumber = invMatch ? invMatch[1] : `INV-${Date.now()}`;
    
    return data;
  };

  const onDrop = useCallback(async (acceptedFiles, fileRejections) => {
    if (fileRejections && fileRejections.length > 0) {
      const rejection = fileRejections[0];
      toast.error(rejection.errors[0]?.message || 'File upload failed');
      return;
    }

    const file = acceptedFiles[0];
    if (!file) return;

    if (!user?.id) {
      toast.error('Please login to upload invoices');
      return;
    }

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

    if (!fileSupport) {
      toast.error('Unsupported file type');
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
      
      // For images, use client-side OCR
      if (fileSupport.needsOcr) {
        toast.loading('Running OCR on image...', { id: 'ocr' });
        extractedText = await extractTextFromImage(file);
        toast.dismiss('ocr');
      } else {
        // For PDFs/Word/Excel, try to extract filename info
        extractedText = file.name;
      }
      
      // Extract invoice data
      const extractedData = extractInvoiceDataSimple(extractedText);
      
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

      // Match your invoices table schema exactly - NO file_name column
      const invoiceData = {
        user_id: user.id,
        vendor: extractedData.vendor,
        total_amount: extractedData.total,
        tax: extractedData.tax,
        date: extractedData.date,
        pdf_url: publicUrl,
        invoice_number: extractedData.invoiceNumber,
        extracted_data: extractedData,
        status: 'pending'
      };

      console.log('Saving invoice:', invoiceData);

      const { data: savedInvoice, error: dbError } = await supabase
        .from('invoices')
        .insert([invoiceData])
        .select()
        .single();

      if (dbError) throw dbError;

      setUploadStatus('success');
      toast.success(`Invoice scanned successfully! Vendor: ${extractedData.vendor}`);
      
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