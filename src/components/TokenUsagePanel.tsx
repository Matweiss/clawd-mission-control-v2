import React, { useState, useEffect } from 'react';
import { Cpu, TrendingUp, AlertCircle, CheckCircle, Zap } from 'lucide-react';

interface TokenUsageData {
  totalTokens: number;
  sessionCount: number;
  dailyAverage: number;
  subscriptionLimit: number;
  subscriptionCost: number;
  periodStart: string;
  periodEnd: string;
}

export function TokenUsagePanel() {
  const [usage, setUsage] = useState<TokenUsageData>({
    totalTokens: 489361,
    sessionCount: 22,
    dailyAverage: 48936,
    subscriptionLimit: 1000000, // 1M tokens - placeholder until confirmed
    subscriptionCost: 100,
    periodStart: '2026-02-25',
    periodEnd: '2026-03-25'
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Could fetch real-time data here
    fetchTokenUsage();
  }, []);

  const fetchTokenUsage = async () => {
    // Placeholder for API call - would integrate with session tracking
    // const response = await fetch('/api/token-usage');
    // const data = await response.json();
    // setUsage(data);
  };

  const percentUsed = Math.min((usage.totalTokens / usage.subscriptionLimit) * 100, 100);
  const tokensRemaining = usage.subscriptionLimit - usage.totalTokens;
  const daysRemaining = Math.ceil((new Date(usage.periodEnd).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  
  const getStatusColor = () => {
    if (percentUsed < 50) return 'text-green-400';
    if (percentUsed < 80) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getProgressColor = () => {
    if (percentUsed < 50) return 'bg-green-500';
    if (percentUsed < 80) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getStatusIcon = () => {
    if (percentUsed < 80) return <CheckCircle className="w-3 h-3" />;
    return <AlertCircle className="w-3 h-3" />;
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(0)}K`;
    return num.toString();
  };

  return (
    <div className="bg-[#161616] rounded-xl p-4 border border-orange-500/20">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-orange-500/20 flex items-center justify-center">
            <Cpu className="w-4 h-4 text-orange-400" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-white">Token Usage</h2>
            <p className="text-xs text-gray-500">Kimi Allegro - ${usage.subscriptionCost}/mo</p>
          </div>
        </div>
        
        <div className={`flex items-center gap-1 text-xs ${getStatusColor()}`}>
          {getStatusIcon()}
          <span>{percentUsed.toFixed(0)}% used</span>
        </div>
      </div>

      {/* Main Progress Bar */}
      <div className="mb-4">
        <div className="flex justify-between text-xs mb-1">
          <span className="text-gray-400">{formatNumber(usage.totalTokens)} tokens</span>
          <span className="text-gray-500">{formatNumber(usage.subscriptionLimit)} limit</span>
        </div>
        <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
          <div 
            className={`h-full ${getProgressColor()} transition-all duration-500`}
            style={{ width: `${percentUsed}%` }}
          />
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-[#1a1a1a] rounded-lg p-3">
          <div className="flex items-center gap-1 text-xs text-gray-500 mb-1">
            <Zap className="w-3 h-3" />
            <span>Remaining</span>
          </div>
          <p className={`text-lg font-bold ${getStatusColor()}`}>
            {formatNumber(tokensRemaining)}
          </p>
          <p className="text-xs text-gray-500">tokens left</p>
        </div>

        <div className="bg-[#1a1a1a] rounded-lg p-3">
          <div className="flex items-center gap-1 text-xs text-gray-500 mb-1">
            <TrendingUp className="w-3 h-3" />
            <span>Sessions</span>
          </div>
          <p className="text-lg font-bold text-white">{usage.sessionCount}</p>
          <p className="text-xs text-gray-500">total</p>
        </div>
      </div>

      {/* Daily Average & Projection */}
      <div className="bg-[#1a1a1a] rounded-lg p-3 mb-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-500">Daily Average</p>
            <p className="text-sm font-medium text-white">{formatNumber(usage.dailyAverage)} tokens</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-500">Days Left</p>
            <p className={`text-sm font-medium ${daysRemaining < 7 ? 'text-yellow-400' : 'text-white'}`}>
              {daysRemaining} days
            </p>
          </div>
        </div>
      </div>

      {/* Projection Alert */}
      {percentUsed > 75 && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-2 mb-3">
          <p className="text-xs text-red-400 text-center">
            ⚠️ At current rate, you may hit the limit before renewal
          </p>
        </div>
      )}

      {/* Quick Actions */}
      <div className="pt-3 border-t border-gray-800">
        <p className="text-xs text-gray-500 mb-2">Quick Actions</p>
        <div className="grid grid-cols-2 gap-2">
          <button 
            onClick={fetchTokenUsage}
            className="flex items-center justify-center gap-1 px-3 py-2 bg-[#1a1a1a] rounded-lg text-xs text-gray-300 hover:bg-[#222] transition-colors"
          >
            <Cpu className="w-3 h-3" />
            Refresh
          </button>
          
          <button 
            className="flex items-center justify-center gap-1 px-3 py-2 bg-[#1a1a1a] rounded-lg text-xs text-gray-300 hover:bg-[#222] transition-colors"
            onClick={() => alert('Detailed usage view - coming soon')}
          >
            <TrendingUp className="w-3 h-3" />
            Details
          </button>
        </div>
      </div>
    </div>
  );
}
