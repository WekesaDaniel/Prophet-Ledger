// frontend/src/pages/AuditLogs.jsx
import React, { useState } from 'react';
import { Search, Filter, Download, Clock, User, Activity } from 'lucide-react';

const AuditLogs = () => {
  const [searchTerm, setSearchTerm] = useState('');

  // 🔴 HARDCODED - Replace with API data
  const auditLogs = [
    { id: 1, user: 'john@example.com', action: 'Login', resource: '/api/auth/login', ip: '192.168.1.1', status: 'success', timestamp: '2024-05-15 09:00:00' },
    { id: 2, user: 'john@example.com', action: 'CREATE', resource: '/api/transactions', ip: '192.168.1.1', status: 'success', timestamp: '2024-05-15 10:30:00' },
    { id: 3, user: 'jane@example.com', action: 'VIEW', resource: '/api/dss/risk', ip: '192.168.1.2', status: 'success', timestamp: '2024-05-15 11:15:00' },
    { id: 4, user: 'john@example.com', action: 'UPDATE', resource: '/api/settings', ip: '192.168.1.1', status: 'success', timestamp: '2024-05-14 14:20:00' },
    { id: 5, user: 'admin@example.com', action: 'DELETE', resource: '/api/users/5', ip: '192.168.1.100', status: 'success', timestamp: '2024-05-14 09:45:00' },
  ];

  const getActionColor = (action) => {
    switch(action) {
      case 'Login': return 'bg-green-100 text-green-800';
      case 'CREATE': return 'bg-blue-100 text-blue-800';
      case 'UPDATE': return 'bg-yellow-100 text-yellow-800';
      case 'DELETE': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredLogs = auditLogs.filter(log => 
    log.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.resource.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-8 px-4">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold">Audit Logs</h1>
            <p className="text-gray-600 mt-1">Track all user activities and system events</p>
          </div>
          <button className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
            <Download className="w-4 h-4" />
            <span>Export Logs</span>
          </button>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search logs..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
            </div>
            <select className="px-3 py-2 border rounded-lg">
              <option>All Actions</option>
              <option>Login</option>
              <option>CREATE</option>
              <option>UPDATE</option>
              <option>DELETE</option>
            </select>
            <select className="px-3 py-2 border rounded-lg">
              <option>Last 7 Days</option>
              <option>Last 30 Days</option>
              <option>Last 90 Days</option>
              <option>All Time</option>
            </select>
          </div>
        </div>

        {/* Logs Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Timestamp</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">User</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Action</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Resource</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">IP Address</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredLogs.map(log => (
                  <tr key={log.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm flex items-center">
                      <Clock className="w-3 h-3 mr-1 text-gray-400" />
                      {log.timestamp}
                    </td>
                    <td className="px-4 py-3 text-sm flex items-center">
                      <User className="w-3 h-3 mr-1 text-gray-400" />
                      {log.user}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 text-xs rounded-full ${getActionColor(log.action)}`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm font-mono text-xs">{log.resource}</td>
                    <td className="px-4 py-3 text-sm">{log.ip}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 text-xs rounded-full ${log.status === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {log.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-2xl font-bold">{auditLogs.length}</div>
            <div className="text-sm text-gray-500">Total Events</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-2xl font-bold text-green-600">
              {auditLogs.filter(l => l.status === 'success').length}
            </div>
            <div className="text-sm text-gray-500">Successful</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-2xl font-bold text-red-600">
              {auditLogs.filter(l => l.status !== 'success').length}
            </div>
            <div className="text-sm text-gray-500">Failed</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-2xl font-bold">
              {new Set(auditLogs.map(l => l.user)).size}
            </div>
            <div className="text-sm text-gray-500">Active Users</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuditLogs;