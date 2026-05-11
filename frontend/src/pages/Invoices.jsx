// frontend/src/pages/Invoices.jsx
import React, { useState } from 'react';
import PDFUploader from '../components/invoices/PDFUploader';
import InvoiceList from '../components/invoices/InvoiceList';
import { FileText, Upload, History } from 'lucide-react';

const Invoices = () => {
  const [refreshKey, setRefreshKey] = useState(0);

  const handleUploadComplete = () => {
    setRefreshKey(prev => prev + 1);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto py-8 px-4">
        <h1 className="text-2xl font-bold mb-2">Invoice Manager</h1>
        <p className="text-gray-600 mb-8">Upload and manage your invoices. Our AI extracts key information automatically.</p>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Upload Section */}
          <div>
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center">
                <Upload className="w-5 h-5 mr-2 text-blue-600" />
                Upload New Invoice
              </h2>
              <PDFUploader onUploadComplete={handleUploadComplete} />
            </div>
          </div>

          {/* Stats Section */}
          <div>
            <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg shadow p-6">
              <h3 className="font-semibold mb-2">AI Invoice Scanner</h3>
              <p className="text-sm opacity-90 mb-4">
                Our AI extracts vendor names, amounts, dates, and line items from any PDF invoice.
              </p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-2xl font-bold">99%</div>
                  <div className="text-xs opacity-80">Accuracy Rate</div>
                </div>
                <div>
                  <div className="text-2xl font-bold">&lt;2s</div>
                  <div className="text-xs opacity-80">Processing Time</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Invoice List */}
        <div className="mt-8">
          <div className="bg-white rounded-lg shadow">
            <div className="p-4 border-b">
              <h2 className="text-lg font-semibold flex items-center">
                <History className="w-5 h-5 mr-2 text-gray-600" />
                Recent Invoices
              </h2>
            </div>
            <InvoiceList key={refreshKey} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Invoices;