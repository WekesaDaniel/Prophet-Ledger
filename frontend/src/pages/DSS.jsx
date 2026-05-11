// frontend/src/pages/DSS.jsx
import React from 'react';
import ScenarioSimulator from '../components/dss/ScenarioSimulator';
import ScoreMeter from '../components/dss/ScoreMeter';
import RiskHeatmap from '../components/dashboard/RiskHeatmap';
import { Brain, TrendingUp, Shield, Zap } from 'lucide-react';

const DSS = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto py-8 px-4">
        <h1 className="text-2xl font-bold mb-2">Decision Support System</h1>
        <p className="text-gray-600 mb-8">AI-powered insights to help you make better financial decisions</p>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Risk Score */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center">
              <Shield className="w-5 h-5 mr-2 text-red-600" />
              Risk Assessment
            </h2>
            <ScoreMeter />
          </div>

          {/* Risk Heatmap */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center">
              <Zap className="w-5 h-5 mr-2 text-yellow-600" />
              Risk Heatmap by Category
            </h2>
            <RiskHeatmap />
          </div>

          {/* What-If Simulator */}
          <div className="lg:col-span-2">
            <ScenarioSimulator />
          </div>
        </div>
      </div>
    </div>
  );
};

export default DSS;