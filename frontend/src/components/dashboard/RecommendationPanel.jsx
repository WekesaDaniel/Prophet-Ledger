// frontend/src/components/dashboard/RecommendationPanel.jsx
import React, { useState, useEffect } from 'react';
import { Lightbulb, TrendingUp, TrendingDown, Target, Loader } from 'lucide-react';
import api from '../../services/api';

const RecommendationPanel = () => {
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRecommendations();
  }, []);

  const fetchRecommendations = async () => {
    setLoading(true);
    try {
      const response = await api.get('/dss/recommendations');
      setRecommendations(response.data);
    } catch (error) {
      console.error('Failed to fetch recommendations:', error);
      // Fallback mock data
      setRecommendations([
        { id: 1, title: 'Reduce Dining Expenses', description: 'You spent 25% more on dining this month. Consider cooking at home more often.', impact: '$120', priority: 'high', icon: 'trending-down' },
        { id: 2, title: 'Increase Savings Rate', description: 'Your savings rate is 18%. Aim for 20% by next month.', impact: '+2%', priority: 'medium', icon: 'target' },
        { id: 3, title: 'Emergency Fund Progress', description: 'You are 60% towards your emergency fund goal. Keep going!', impact: '$3,000 left', priority: 'low', icon: 'trending-up' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const getIcon = (iconName) => {
    switch(iconName) {
      case 'trending-up': return <TrendingUp className="w-4 h-4 text-green-500" />;
      case 'trending-down': return <TrendingDown className="w-4 h-4 text-red-500" />;
      case 'target': return <Target className="w-4 h-4 text-blue-500" />;
      default: return <Lightbulb className="w-4 h-4 text-yellow-500" />;
    }
  };

  const getPriorityColor = (priority) => {
    switch(priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-green-100 text-green-800';
    }
  };

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
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex items-center mb-4">
        <Lightbulb className="w-5 h-5 mr-2 text-yellow-500" />
        <h3 className="text-lg font-semibold">AI Recommendations</h3>
      </div>
      
      <div className="space-y-3">
        {recommendations.map((rec) => (
          <div key={rec.id} className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-2">
                  {getIcon(rec.icon)}
                  <h4 className="font-medium text-gray-900">{rec.title}</h4>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${getPriorityColor(rec.priority)}`}>
                    {rec.priority.toUpperCase()}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mt-1">{rec.description}</p>
                <div className="mt-2 text-xs text-blue-600">Potential Impact: {rec.impact}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RecommendationPanel;