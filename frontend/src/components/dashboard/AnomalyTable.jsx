// frontend/src/components/dashboard/AnomalyTable.jsx
import React, { useState, useEffect } from 'react';
import { AlertTriangle, CheckCircle, XCircle, Eye } from 'lucide-react';

// 🔴 HARDCODED ANOMALIES - Replace with API data
const MOCK_ANOMALIES = [
  { id: 1, date: '2024-05-15', description: 'Amazon Purchase', amount: 1249.99, category: 'Shopping', score: 92, status: 'pending', reason: '3x above normal spending' },
  { id: 2, date: '2024-05-10', description: 'Uber Rides', amount: 187.50, category: 'Transport', score: 78, status: 'reviewed', reason: 'Unusual frequency of rides' },
  { id: 3, date: '2024-05-05', description: 'Restaurant', amount: 345.00, category: 'Dining', score: 85, status: 'pending', reason: '2.5x above average' },
];

const AnomalyTable = () => {
  const [anomalies, setAnomalies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    // 🔴 HARDCODED - Replace with: fetchAnomaliesFromAPI()
    setTimeout(() => {
      setAnomalies(MOCK_ANOMALIES);
      setLoading(false);
    }, 500);
    
    // ✅ TO DO: Uncomment when API is ready
    // const fetchAnomalies = async () => {
    //   try {
    //     const response = await api.get('/anomalies');
    //     setAnomalies(response.data);
    //   } catch (error) {
    //     console.error('Failed to fetch anomalies:', error);
    //   } finally {
    //     setLoading(false);
    //   }
    // };
    // fetchAnomalies();
  }, []);

  const handleReview = async (id) => {
    // 🔴 HARDCODED - Replace with: await api.post(`/anomalies/${id}/review`)
    console.log(`Reviewing anomaly ${id}`);
    setAnomalies(prev => prev.map(a => a.id === id ? { ...a, status: 'reviewed' } : a));
    
    // ✅ TO DO: Uncomment when API is ready
    // try {
    //   await api.post(`/anomalies/${id}/review`);
    //   setAnomalies(prev => prev.map(a => a.id === id ? { ...a, status: 'reviewed' } : a));
    // } catch (error) {
    //   console.error('Failed to review anomaly:', error);
    // }
  };

  const filteredAnomalies = filter === 'all' ? anomalies : anomalies.filter(a => a.status === filter);

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/4"></div>
          <div className="h-32 bg-gray-100 rounded"></div>
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
            {filteredAnomalies.map(anomaly => (
              <tr key={anomaly.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-sm">{anomaly.date}</td>
                <td className="px-4 py-3">
                  <div>
                    <p className="text-sm font-medium">{anomaly.description}</p>
                    <p className="text-xs text-gray-500">{anomaly.category}</p>
                    <p className="text-xs text-red-500">{anomaly.reason}</p>
                  </div>
                </td>
                <td className="px-4 py-3 text-right text-sm font-medium text-red-600">${anomaly.amount.toLocaleString()}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center">
                    <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                      <div className="bg-red-500 rounded-full h-2" style={{ width: `${anomaly.score}%` }}></div>
                    </div>
                    <span className="text-xs font-medium">{anomaly.score}%</span>
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
                    <button onClick={() => handleReview(anomaly.id)} className="text-blue-600 hover:text-blue-800 flex items-center space-x-1">
                      <Eye className="w-4 h-4" />
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