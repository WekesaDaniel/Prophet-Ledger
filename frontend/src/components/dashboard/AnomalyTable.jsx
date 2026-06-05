import React, { useState, useEffect } from 'react';
import { AlertTriangle, Eye, Loader } from 'lucide-react';
import api from '../../services/api';

const AnomalyTable = ({ limit = null }) => {
  const [anomalies, setAnomalies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [reviewing, setReviewing] = useState(null);

  useEffect(() => {
    fetchAnomalies();
  }, []);

  const fetchAnomalies = async () => {
    setLoading(true);
    try {
      const response = await api.get('/anomalies');
      setAnomalies(response.data);
    } catch (error) {
      console.error('Failed to fetch anomalies:', error);
      // Fallback mock data
      setAnomalies([
        { id: 1, date: '2024-05-15', description: 'Amazon Purchase', amount: 1249.99, category: 'Shopping', anomaly_score: 92, status: 'pending', reason: '3x above normal spending' },
        { id: 2, date: '2024-05-10', description: 'Uber Rides', amount: 187.50, category: 'Transport', anomaly_score: 78, status: 'pending', reason: 'Unusual frequency of rides' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleReview = async (id) => {
    setReviewing(id);
    try {
      await api.post(`/anomalies/${id}/review`);
      setAnomalies(prev => prev.map(a => a.id === id ? { ...a, status: 'reviewed' } : a));
    } catch (error) {
      console.error('Failed to review anomaly:', error);
    } finally {
      setReviewing(null);
    }
  };

  const filteredAnomalies = filter === 'all' ? anomalies : anomalies.filter(a => a.status === filter);
  const displayAnomalies = limit ? filteredAnomalies.slice(0, limit) : filteredAnomalies;

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex justify-center items-center h-40">
          <Loader className="w-6 h-6 animate-spin text-blue-500" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
      <div className="p-4 border-b flex justify-between items-center">
        <h3 className="text-lg font-semibold flex items-center">
          <AlertTriangle className="w-5 h-5 mr-2 text-yellow-500" />
          Anomaly Detection
        </h3>
        <div className="flex space-x-2">
          <button onClick={() => setFilter('all')} className={`px-3 py-1 text-sm rounded-lg ${filter === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-100'}`}>All</button>
          <button onClick={() => setFilter('pending')} className={`px-3 py-1 text-sm rounded-lg ${filter === 'pending' ? 'bg-yellow-600 text-white' : 'bg-gray-100'}`}>Pending</button>
          <button onClick={() => setFilter('reviewed')} className={`px-3 py-1 text-sm rounded-lg ${filter === 'reviewed' ? 'bg-green-600 text-white' : 'bg-gray-100'}`}>Reviewed</button>
        </div>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Amount</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Risk Score</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {displayAnomalies.map(anomaly => (
              <tr key={anomaly.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-sm">{anomaly.date || anomaly.created_at?.split('T')[0]}</td>
                <td className="px-4 py-3">
                  <div>
                    <p className="text-sm font-medium">{anomaly.description}</p>
                    <p className="text-xs text-gray-500">{anomaly.category}</p>
                    <p className="text-xs text-red-500">{anomaly.reason}</p>
                  </div>
                </td>
                <td className="px-4 py-3 text-right text-sm font-medium text-red-600">${anomaly.amount?.toLocaleString()}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center">
                    <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                      <div className="bg-red-500 rounded-full h-2" style={{ width: `${anomaly.anomaly_score}%` }}></div>
                    </div>
                    <span className="text-xs font-medium">{anomaly.anomaly_score}%</span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  {anomaly.status === 'pending' ? (
                    <span className="px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded-full">Pending Review</span>
                  ) : (
                    <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">Reviewed</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  {anomaly.status === 'pending' && (
                    <button onClick={() => handleReview(anomaly.id)} disabled={reviewing === anomaly.id} className="text-blue-600 hover:text-blue-800 flex items-center space-x-1">
                      {reviewing === anomaly.id ? <Loader className="w-4 h-4 animate-spin" /> : <Eye className="w-4 h-4" />}
                      <span className="text-sm">Review</span>
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AnomalyTable;