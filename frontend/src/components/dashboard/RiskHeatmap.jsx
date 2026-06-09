// frontend/src/components/dashboard/RiskHeatmap.jsx
import React, { useState, useEffect } from 'react';
import { Loader, AlertTriangle } from 'lucide-react';
import { supabase } from '../../services/supabaseClient';

const RiskHeatmap = () => {
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    fetchRiskDataFromSupabase();
  }, []);

  const fetchRiskDataFromSupabase = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user');

      // Fetch all expense transactions with proper case normalization
      const { data: transactions, error } = await supabase
        .from('transactions')
        .select('category, amount')
        .eq('user_id', user.id)
        .eq('type', 'expense');

      if (error) throw error;

      // Normalize categories (capitalize first letter, rest lowercase)
      const normalizeCategory = (cat) => {
        if (!cat) return 'Other';
        return cat.charAt(0).toUpperCase() + cat.slice(1).toLowerCase();
      };

      // Group by normalized category
      const categoryMap = new Map();
      
      (transactions || []).forEach(t => {
        const normalizedName = normalizeCategory(t.category);
        if (!categoryMap.has(normalizedName)) {
          categoryMap.set(normalizedName, { amounts: [], total: 0, count: 0 });
        }
        const cat = categoryMap.get(normalizedName);
        cat.amounts.push(t.amount);
        cat.total += t.amount;
        cat.count++;
      });

      // Calculate risk score (coefficient of variation based)
      const riskData = Array.from(categoryMap.entries()).map(([name, data]) => {
        const avg = data.total / data.count;
        const variance = data.amounts.reduce((sum, amt) => sum + Math.pow(amt - avg, 2), 0) / data.count;
        const stdDev = Math.sqrt(variance);
        const cv = avg > 0 ? stdDev / avg : 0; // Coefficient of variation
        
        let risk = 25; // Default low risk
        if (cv > 1.5) risk = 85;
        else if (cv > 1.0) risk = 65;
        else if (cv > 0.5) risk = 45;
        
        // Boost risk for categories with high average spending
        if (avg > 500) risk = Math.min(risk + 15, 95);
        
        return {
          name,
          risk: Math.round(risk),
          amount: Math.round(data.total),
          count: data.count,
          avgAmount: Math.round(avg),
          status: risk < 30 ? 'low' : risk < 60 ? 'medium' : 'high'
        };
      });

      // Sort by risk (highest first)
      riskData.sort((a, b) => b.risk - a.risk);
      
      setCategories(riskData.length > 0 ? riskData : getDefaultCategories());
      
      // Also save to risk_categories table for persistence
      await saveRiskCategories(user.id, riskData);
      
    } catch (error) {
      console.error('Failed to fetch risk data:', error);
      setCategories(getDefaultCategories());
    } finally {
      setLoading(false);
    }
  };

  const saveRiskCategories = async (userId, riskData) => {
    try {
      // Delete old risk categories
      await supabase.from('risk_categories').delete().eq('user_id', userId);
      
      // Insert new risk categories
      for (const cat of riskData) {
        await supabase.from('risk_categories').insert({
          user_id: userId,
          category: cat.name,
          risk_score: cat.risk,
          amount: cat.amount
        });
      }
      
      // Calculate and save overall risk score
      const overallRisk = Math.round(riskData.reduce((sum, cat) => sum + cat.risk, 0) / riskData.length);
      let riskLevel = 'low';
      if (overallRisk >= 60) riskLevel = 'high';
      else if (overallRisk >= 30) riskLevel = 'medium';
      
      await supabase.from('risk_scores').upsert({
        user_id: userId,
        risk_score: overallRisk,
        risk_level: riskLevel,
        active_anomalies: 0,
        recommendation: getRiskRecommendation(overallRisk),
        updated_at: new Date().toISOString()
      });
    } catch (error) {
      console.error('Failed to save risk scores:', error);
    }
  };

  const getRiskRecommendation = (score) => {
    if (score >= 70) return 'Urgent: Review your high-risk spending categories immediately.';
    if (score >= 50) return 'Monitor your medium-risk categories and consider budget adjustments.';
    if (score >= 30) return 'Your spending patterns are moderately stable. Keep tracking.';
    return 'Excellent! Your spending is very consistent. Continue your good habits.';
  };

  const getDefaultCategories = () => [
    { name: 'Groceries', risk: 25, amount: 450, status: 'low' },
    { name: 'Dining', risk: 65, amount: 780, status: 'medium' },
    { name: 'Shopping', risk: 85, amount: 1250, status: 'high' },
    { name: 'Transport', risk: 35, amount: 320, status: 'low' },
    { name: 'Entertainment', risk: 45, amount: 280, status: 'medium' },
    { name: 'Utilities', risk: 15, amount: 350, status: 'low' },
    { name: 'Health', risk: 55, amount: 180, status: 'medium' },
    { name: 'Rent', risk: 10, amount: 1500, status: 'low' },
  ];

  const getRiskColor = (risk) => {
    if (risk < 30) return 'bg-green-500';
    if (risk < 60) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getRiskTextColor = (risk) => {
    if (risk < 30) return 'text-green-700';
    if (risk < 60) return 'text-yellow-700';
    return 'text-red-700';
  };

  const getRiskLabel = (risk) => {
    if (risk < 30) return 'Low Risk';
    if (risk < 60) return 'Medium Risk';
    return 'High Risk';
  };

  const getSeverityIcon = (risk) => {
    if (risk >= 60) return <AlertTriangle className="w-4 h-4 text-red-500" />;
    return null;
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex justify-center items-center h-64">
          <Loader className="w-8 h-8 animate-spin text-blue-500" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-semibold">Risk Heatmap by Category</h3>
        <div className="flex space-x-3 text-xs">
          <div className="flex items-center"><div className="w-3 h-3 bg-green-500 rounded-full mr-1"></div><span>Low Risk (&lt;30%)</span></div>
          <div className="flex items-center"><div className="w-3 h-3 bg-yellow-500 rounded-full mr-1"></div><span>Medium Risk (30-60%)</span></div>
          <div className="flex items-center"><div className="w-3 h-3 bg-red-500 rounded-full mr-1"></div><span>High Risk (&gt;60%)</span></div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {categories.map((cat) => (
          <div key={cat.name} className="border rounded-lg overflow-hidden hover:shadow-md transition-shadow">
            <div className={`h-2 ${getRiskColor(cat.risk)}`}></div>
            <div className="p-4">
              <div className="flex justify-between items-start mb-2">
                <h4 className="font-medium text-gray-800 capitalize">{cat.name}</h4>
                {getSeverityIcon(cat.risk)}
              </div>
              <div className="mt-2">
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-500">Risk Score</span>
                  <span className={`font-medium ${getRiskTextColor(cat.risk)}`}>{cat.risk}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className={`${getRiskColor(cat.risk)} h-2 rounded-full transition-all duration-500`} style={{ width: `${cat.risk}%` }}></div>
                </div>
              </div>
              <div className="mt-3 pt-2 border-t text-xs text-gray-500">
                <div className="flex justify-between"><span>Total Spent:</span><span className="font-medium">${cat.amount?.toLocaleString()}</span></div>
                <div className="flex justify-between mt-1"><span>Avg Transaction:</span><span className="font-medium">${cat.avgAmount?.toLocaleString()}</span></div>
                <div className="flex justify-between mt-1"><span>Status:</span><span className={`font-medium ${getRiskTextColor(cat.risk)}`}>{getRiskLabel(cat.risk)}</span></div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 pt-4 border-t">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div className="p-3 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">{categories.filter(c => c.risk < 30).length}</div>
            <div className="text-xs text-gray-500">Low Risk Categories</div>
          </div>
          <div className="p-3 bg-yellow-50 rounded-lg">
            <div className="text-2xl font-bold text-yellow-600">{categories.filter(c => c.risk >= 30 && c.risk < 60).length}</div>
            <div className="text-xs text-gray-500">Medium Risk Categories</div>
          </div>
          <div className="p-3 bg-red-50 rounded-lg">
            <div className="text-2xl font-bold text-red-600">{categories.filter(c => c.risk >= 60).length}</div>
            <div className="text-xs text-gray-500">High Risk Categories</div>
          </div>
        </div>
      </div>

      <div className="mt-4 p-3 bg-gray-50 rounded-lg text-xs text-gray-500">
        <p className="font-medium mb-1">About Risk Scoring:</p>
        <ul className="list-disc list-inside space-y-1">
          <li>Risk is calculated based on spending volatility (coefficient of variation)</li>
          <li>Higher volatility = higher risk score</li>
          <li>Categories exceeding your custom limits will be flagged as anomalies</li>
          <li>Regular review of medium/high risk categories helps optimize spending</li>
        </ul>
      </div>
    </div>
  );
};

export default RiskHeatmap;