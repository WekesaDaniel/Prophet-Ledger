// frontend/src/pages/Admin.jsx
import React, { useState } from 'react';
import { Users, Settings, Shield, BarChart, Download, Trash2 } from 'lucide-react';

const Admin = () => {
  const [users] = useState([
    { id: 1, name: 'John Doe', email: 'john@example.com', role: 'Admin', status: 'Active', lastActive: '2024-01-15' },
    { id: 2, name: 'Jane Smith', email: 'jane@example.com', role: 'Manager', status: 'Active', lastActive: '2024-01-14' },
    { id: 3, name: 'Bob Johnson', email: 'bob@example.com', role: 'Viewer', status: 'Inactive', lastActive: '2024-01-10' },
  ]);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto py-8 px-4">
        <h1 className="text-2xl font-bold mb-2">Admin Dashboard</h1>
        <p className="text-gray-600 mb-8">Enterprise administration and team management</p>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-4 text-center">
            <Users className="w-8 h-8 mx-auto text-blue-600 mb-2" />
            <div className="text-2xl font-bold">{users.length}</div>
            <div className="text-sm text-gray-500">Total Users</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4 text-center">
            <Shield className="w-8 h-8 mx-auto text-green-600 mb-2" />
            <div className="text-2xl font-bold">3</div>
            <div className="text-sm text-gray-500">Departments</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4 text-center">
            <BarChart className="w-8 h-8 mx-auto text-purple-600 mb-2" />
            <div className="text-2xl font-bold">99.9%</div>
            <div className="text-sm text-gray-500">Uptime</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4 text-center">
            <Download className="w-8 h-8 mx-auto text-orange-600 mb-2" />
            <div className="text-2xl font-bold">1.2TB</div>
            <div className="text-sm text-gray-500">Data Stored</div>
          </div>
        </div>

        {/* User Management */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-4 border-b flex justify-between items-center">
            <h2 className="text-lg font-semibold">User Management</h2>
            <button className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm">Add User</button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Name</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Email</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Role</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Last Active</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {users.map(user => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm">{user.name}</td>
                    <td className="px-4 py-3 text-sm">{user.email}</td>
                    <td className="px-4 py-3 text-sm">
                      <span className={`px-2 py-1 text-xs rounded-full ${user.role === 'Admin' ? 'bg-red-100 text-red-800' : user.role === 'Manager' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span className={`px-2 py-1 text-xs rounded-full ${user.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                        {user.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm">{user.lastActive}</td>
                    <td className="px-4 py-3 text-sm">
                      <button className="text-blue-600 hover:text-blue-800 mr-2">Edit</button>
                      <button className="text-red-600 hover:text-red-800">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Admin;