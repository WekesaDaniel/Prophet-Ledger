// frontend/src/components/invoices/InvoiceList.jsx
import React, { useState, useEffect } from 'react';
import { FileText, Eye, Download, Trash2, Calendar, DollarSign, Loader } from 'lucide-react';
import { supabase } from '../../services/supabaseClient';
import { useAuth } from '../../contexts/AuthContext';
import { useMode } from '../../contexts/ModeContext';
import toast from 'react-hot-toast';

const InvoiceList = () => {
  const { user } = useAuth();
  const { formatCurrency } = useMode();
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(null);

  const fetchInvoices = async () => {
    if (!user?.id) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('invoices')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setInvoices(data || []);
    } catch (error) {
      console.error('Error fetching invoices:', error);
      toast.error('Failed to load invoices');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, [user?.id]);

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this invoice?')) return;
    
    setDeleting(id);
    try {
      // Get the invoice to delete the file from storage
      const { data: invoice } = await supabase
        .from('invoices')
        .select('pdf_url')
        .eq('id', id)
        .single();

      if (invoice?.pdf_url) {
        // Extract file path from URL
        const filePath = invoice.pdf_url.split('/').pop();
        await supabase.storage.from('invoices').remove([filePath]);
      }

      const { error } = await supabase
        .from('invoices')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;
      
      toast.success('Invoice deleted successfully');
      fetchInvoices();
    } catch (error) {
      console.error('Error deleting invoice:', error);
      toast.error('Failed to delete invoice');
    } finally {
      setDeleting(null);
    }
  };

  const handleView = (pdfUrl) => {
    if (pdfUrl) {
      window.open(pdfUrl, '_blank');
    }
  };

  const handleDownload = async (pdfUrl, invoiceNumber) => {
    if (!pdfUrl) {
      toast.error('No PDF file available');
      return;
    }
    
    try {
      const { data, error } = await supabase.storage
        .from('invoices')
        .download(pdfUrl.split('/').pop());

      if (error) throw error;
      
      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = `invoice_${invoiceNumber}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast.success('Download started');
    } catch (error) {
      console.error('Error downloading invoice:', error);
      toast.error('Failed to download invoice');
    }
  };

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
      default: return status || 'Pending';
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-center items-center h-40">
          <Loader className="w-8 h-8 animate-spin text-purple-600" />
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
      <div className="p-4 border-b bg-gray-50">
        <div className="flex justify-between items-center">
          <h3 className="font-semibold text-gray-900">Invoice History</h3>
          <div className="text-sm text-gray-500">
            Total: {invoices.length} invoices
          </div>
        </div>
      </div>

      <div className="divide-y divide-gray-200">
        {invoices.map((invoice) => (
          <div key={invoice.id} className="p-4 hover:bg-gray-50 transition-colors">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex-1 min-w-[200px]">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-blue-50 rounded-lg">
                    <FileText className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">{invoice.vendor || 'Unknown Vendor'}</h4>
                    <p className="text-sm text-gray-500">Invoice #{invoice.invoice_number || 'N/A'}</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-6">
                <div className="text-sm">
                  <div className="flex items-center text-gray-500">
                    <Calendar className="w-3 h-3 mr-1" />
                    <span>Date: {invoice.date || 'N/A'}</span>
                  </div>
                </div>
                
                <div className="text-right">
                  <div className="text-lg font-bold text-gray-900">
                    {formatCurrency(invoice.total_amount || 0)}
                  </div>
                  <span className={`inline-block px-2 py-0.5 text-xs rounded-full ${getStatusColor(invoice.status)}`}>
                    {getStatusLabel(invoice.status)}
                  </span>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <button 
                  onClick={() => handleView(invoice.pdf_url)}
                  className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  title="View Invoice"
                >
                  <Eye className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => handleDownload(invoice.pdf_url, invoice.invoice_number)}
                  className="p-2 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                  title="Download PDF"
                >
                  <Download className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => handleDelete(invoice.id)}
                  disabled={deleting === invoice.id}
                  className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                  title="Delete Invoice"
                >
                  {deleting === invoice.id ? <Loader className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="p-4 border-t bg-gray-50">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center text-sm">
          <div>
            <div className="text-gray-500">Total Invoices</div>
            <div className="font-semibold text-gray-900">{invoices.length}</div>
          </div>
          <div>
            <div className="text-gray-500">Total Amount</div>
            <div className="font-semibold text-gray-900">
              {formatCurrency(invoices.reduce((sum, inv) => sum + (inv.total_amount || 0), 0))}
            </div>
          </div>
          <div>
            <div className="text-gray-500">Paid</div>
            <div className="font-semibold text-green-600">
              {invoices.filter(i => i.status === 'paid').length}
            </div>
          </div>
          <div>
            <div className="text-gray-500">Pending</div>
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