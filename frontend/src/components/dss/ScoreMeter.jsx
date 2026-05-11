// frontend/src/components/dss/ScoreMeter.jsx
import React, { useState, useEffect } from 'react';
import { Loader, TrendingUp, TrendingDown } from 'lucide-react';

const ScoreMeter = () => {
  const [score, setScore] = useState(0);
  const [loading, setLoading] = useState(true);
  const [trend, setTrend] = useState('stable');

  useEffect(() => {
    setTimeout(() => {
      setScore(68);
      setTrend('improving');
      setLoading(false);
    }, 500);
  }, []);

  const getScoreColor = () => {
    if (score < 30) return 'text-red-600';
    if (score < 60) return 'text-yellow-600';
    return 'text-green-600';
  };

  const getScoreLabel = () => {
    if (score < 30) return 'High Risk';
    if (score < 60) return 'Medium Risk';
    return 'Low Risk';
  };

  if (loading) {
    return <Loader className="w-8 h-8 animate-spin mx-auto" />;
  }

  return (
    <div className="text-center">
      <div className="relative inline-block">
        <div className="w-32 h-32 rounded-full border-8 border-gray-200 flex items-center justify-center">
          <div className={`text-3xl font-bold ${getScoreColor()}`}>{score}</div>
        </div>
        <div className="absolute inset-0 rounded-full border-8 border-transparent border-t-blue-500" 
             style={{ transform: `rotate(${score * 3.6}deg)` }}></div>
      </div>
      <div className="mt-4">
        <div className={`text-xl font-bold ${getScoreColor()}`}>{getScoreLabel()}</div>
        <div className="flex items-center justify-center mt-2 text-sm">
          {trend === 'improving' ? (
            <>
              <TrendingDown className="w-4 h-4 text-green-500 mr-1" />
              <span className="text-green-600">Improving</span>
            </>
          ) : (
            <>
              <TrendingUp className="w-4 h-4 text-red-500 mr-1" />
              <span className="text-red-600">Worsening</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ScoreMeter;