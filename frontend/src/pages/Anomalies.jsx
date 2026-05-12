// frontend/src/pages/Anomalies.jsx
import React from 'react';
import AnomalyTable from '../components/dashboard/AnomalyTable';
import { AlertTriangle, Shield, Clock } from 'lucide-react';

const Anomalies = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto py-8 px-4">
        <h1 className="text-2xl font-bold mb-2">Anomaly Detection</h1>
        <p className="text-gray-600 mb-8">AI-powered fraud detection and unusual transaction monitoring</p>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="bg-gradient-to-r from-red-500 to-orange-500 text-white rounded-lg p-4">
            <Shield className="w-8 h-8 mb-2" />
            <div className="text-2xl font-bold">24/7</div>
            <div className="text-sm opacity-90">Real-time Monitoring</div>
          </div>
          <div className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white rounded-lg p-4">
            <AlertTriangle className="w-8 h-8 mb-2" />
            <div className="text-2xl font-bold">98%</div>
            <div className="text-sm opacity-90">Detection Rate</div>
          </div>
          <div className="bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg p-4">
            <Clock className="w-8 h-8 mb-2" />
            <div className="text-2xl font-bold">&lt;1s</div>
            <div className="text-sm opacity-90">Alert Time</div>
          </div>
        </div>

        <AnomalyTable />
      </div>
    </div>
  );
};

export default Anomalies;