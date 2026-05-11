// frontend/src/components/invoices/InvoiceList.jsx
import React, { useState, useEffect } from 'react';
import { FileText, Eye, Download, Trash2, Calendar, DollarSign, Building2 } from 'lucide-react';
import { useMode } from '../../contexts/ModeContext';

const InvoiceList = () => {
  const { formatCurrency } = useMode();
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);

  // 🔴 HARDCODED MOCK DATA - Replace with API call
  const mockInvoices = [
    {
      id: 1,
      vendor: 'Amazon Web Services',
      amount: 1249.99,
      date: '2024-05-15',
      dueDate: '2024-06-14',
      status: 'paid',
      invoiceNumber: 'INV-2024-001',
      pdfUrl: '#'
    },
    {
      id: 2,
      vendor: 'Starbucks Coffee',
      amount: 45.75,
      date: '2024-05-14',
      dueDate: '2024-06-13',
      status: 'pending',
      invoiceNumber: 'INV-2024-002',
      pdfUrl: '#'
    },
    {
      id: 3,
      vendor: 'Uber Technologies',
      amount: 187.50,
      date: '2024-05-10',
      dueDate: '2024-06-09',
      status: 'paid',
      invoiceNumber: 'INV-2024-003',
      pdfUrl: '#'
    },
    {
      id: 4,
      vendor: 'Netflix Inc.',
      amount: 15.99,
      date: '2024-05-05',
      dueDate: '2024-06-04',
      status: 'overdue',
      invoiceNumber: 'INV-2024-004',
      pdfUrl: '#'
    },
    {
      id: 5,
      vendor: 'Whole Foods Market',
      amount: 89.47,
      date: '2024-05-03',
      dueDate: '2024-06-02',
      status: 'pending',
      invoiceNumber: 'INV-2024-005',
      pdfUrl: '#'
    }
  ];

  useEffect(() => {
    // 🔴 HARDCODED - Replace with API call
    setTimeout(() => {
      setInvoices(mockInvoices);
      setLoading(false);
    }, 500);
  }, []);

  const getStatusColor = (status) => {
    switch(status) {
      case 'paid': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'overdue': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status) => {
    switch(status) {
      case 'paid': return 'Paid';
      case 'pending': return 'Pending';
      case 'overdue': return 'Overdue';
      default: return status;
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow">
        <div className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-10 bg-gray-200 rounded w-1/4"></div>
            <div className="space-y-2">
              <div className="h-16 bg-gray-100 rounded"></div>
              <div className="h-16 bg-gray-100 rounded"></div>
              <div className="h-16 bg-gray-100 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (invoices.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-12 text-center">
        <FileText className="w-16 h-16 mx-auto text-gray-300 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Invoices Yet</h3>
        <p className="text-gray-500 mb-4">Upload your first invoice using the uploader above.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b bg-gray-50">
        <div className="flex justify-between items-center">
          <h3 className="font-semibold text-gray-900">Invoice History</h3>
          <div className="text-sm text-gray-500">
            Total: {invoices.length} invoices
          </div>
        </div>
      </div>

      {/* Invoice List */}
      <div className="divide-y divide-gray-200">
        {invoices.map((invoice) => (
          <div key={invoice.id} className="p-4 hover:bg-gray-50 transition-colors">
            <div className="flex flex-wrap items-center justify-between gap-4">
              {/* Left side - Invoice Info */}
              <div className="flex-1 min-w-[200px]">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-blue-50 rounded-lg">
                    <FileText className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">{invoice.vendor}</h4>
                    <p className="text-sm text-gray-500">Invoice #{invoice.invoiceNumber}</p>
                  </div>
                </div>
              </div>

              {/* Middle - Date & Amount */}
              <div className="flex items-center space-x-6">
                <div className="text-sm">
                  <div className="flex items-center text-gray-500">
                    <Calendar className="w-3 h-3 mr-1" />
                    <span>Issued: {invoice.date}</span>
                  </div>
                  <div className="flex items-center text-gray-500 mt-1">
                    <Calendar className="w-3 h-3 mr-1" />
                    <span>Due: {invoice.dueDate}</span>
                  </div>
                </div>
                
                <div className="text-right">
                  <div className="text-lg font-bold text-gray-900">
                    {formatCurrency(invoice.amount)}
                  </div>
                  <span className={`inline-block px-2 py-0.5 text-xs rounded-full ${getStatusColor(invoice.status)}`}>
                    {getStatusLabel(invoice.status)}
                  </span>
                </div>
              </div>

              {/* Right side - Actions */}
              <div className="flex items-center space-x-2">
                <button 
                  className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  title="View Invoice"
                >
                  <Eye className="w-4 h-4" />
                </button>
                <button 
                  className="p-2 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                  title="Download PDF"
                >
                  <Download className="w-4 h-4" />
                </button>
                <button 
                  className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  title="Delete Invoice"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Footer Stats */}
      <div className="p-4 border-t bg-gray-50">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center text-sm">
          <div>
            <div className="text-gray-500">Total Invoices</div>
            <div className="font-semibold text-gray-900">{invoices.length}</div>
          </div>
          <div>
            <div className="text-gray-500">Total Amount</div>
            <div className="font-semibold text-gray-900">
              {formatCurrency(invoices.reduce((sum, inv) => sum + inv.amount, 0))}
            </div>
          </div>
          <div>
            <div className="text-gray-500">Paid</div>
            <div className="font-semibold text-green-600">
              {invoices.filter(i => i.status === 'paid').length}
            </div>
          </div>
          <div>
            <div className="text-gray-500">Pending/Overdue</div>
            <div className="font-semibold text-yellow-600">
              {invoices.filter(i => i.status !== 'paid').length}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvoiceList;