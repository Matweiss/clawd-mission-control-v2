import React, { useEffect, useState } from 'react';
import { TrendingUp, AlertCircle, RefreshCw, MoreHorizontal } from 'lucide-react';

interface Deal {
  id: string;
  name: string;
  amount: number;
  stage: string;
  closeDate?: string;
  probability?: number;
}

interface PipelineData {
  deals: Deal[];
  total: number;
  byStage: Record<string, { count: number; value: number }>;
  closingThisWeek: Deal[];
  count: number;
  lastUpdated: string;
}

const STAGE_COLORS: Record<string, string> = {
  'Qualification': 'text-orange-400',
  'Discovery': 'text-blue-400',
  'Evaluation': 'text-purple-400',
  'Confirmation': 'text-green-400',
  'Negotiation': 'text-red-400',
  'Closed Won': 'text-emerald-400',
  'Closed Lost': 'text-gray-400',
};

export function PipelineSheetCard() {
  const [data, setData] = useState<PipelineData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPipeline = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/pipeline/sheet');
      if (!response.ok) {
        throw new Error(`Failed to fetch: ${response.status}`);
      }
      const result = await response.json();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPipeline();
  }, []);

  const formatCurrency = (val: number) => `$${(val / 1000).toFixed(0)}K`;

  if (error || data?.error) {
    return (
      <div className="bg-surface border border-yellow-500/30 rounded-xl p-4">
        <div className="flex items-center gap-2 text-yellow-400 mb-2">
          <AlertCircle className="w-4 h-4" />
          <span className="text-sm font-medium">Pipeline Setup Needed</span>
        </div>
        <p className="text-xs text-gray-400 mb-2">{data?.help || error}</p>
        <p className="text-xs text-yellow-200/70 mb-3">
          The sheet API needs proper Google Sheets scope. This requires re-authenticating with Sheets permission.
        </p>
        <button 
          onClick={fetchPipeline}
          className="text-xs bg-surface-light hover:bg-border px-3 py-1 rounded transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="bg-surface border border-border rounded-xl p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Sales Pipeline</h2>
          <RefreshCw className={`w-4 h-4 text-gray-500 ${loading ? 'animate-spin' : ''}`} />
        </div>
        <div className="text-center py-8 text-gray-500">
          <TrendingUp className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p className="text-xs">Loading pipeline...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-surface border border-border rounded-xl overflow-hidden">
      <div className="px-4 py-3 border-b border-border flex items-center justify-between">
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Sales Pipeline</h2>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">Sheet</span>
          <button 
            onClick={fetchPipeline}
            className="p-1 hover:bg-surface-light rounded transition-colors"
          >
            <RefreshCw className={`w-4 h-4 text-gray-500 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>
      
      <div className="p-4">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div className="text-center">
            <div className="text-2xl font-bold font-mono">{data.count}</div>
            <div className="text-xs text-gray-500">Deals</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold font-mono text-cyan-400">{formatCurrency(data.total)}</div>
            <div className="text-xs text-gray-500">Pipeline</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold font-mono text-green-400">{data.closingThisWeek.length}</div>
            <div className="text-xs text-gray-500">This Week</div>
          </div>
        </div>

        {/* By Stage */}
        {Object.keys(data.byStage).length > 0 && (
          <div className="space-y-2 mb-4">
            {Object.entries(data.byStage).map(([stage, stageData]: [string, any]) => (
              <div key={stage} className="flex items-center justify-between text-xs">
                <span className={`${STAGE_COLORS[stage] || 'text-gray-400'}`}>{stage}</span>
                <div className="flex items-center gap-3">
                  <span className="text-gray-500">{stageData.count} deals</span>
                  <span className="font-mono text-gray-300">{formatCurrency(stageData.value)}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Closing Soon */}
        {data.closingThisWeek.length > 0 && (
          <div className="border-t border-border pt-3 mb-3">
            <div className="flex items-center gap-2 text-red-500 mb-2">
              <AlertCircle className="w-4 h-4" />
              <span className="text-xs font-medium">Closing This Week</span>
            </div>
            {data.closingThisWeek.map((deal: Deal, i: number) => (
              <div key={i} className="bg-red-500/10 border border-red-500/30 rounded-lg p-2 mb-1">
                <div className="flex items-center justify-between">
                  <span className="text-sm">{deal.name}</span>
                  <span className="text-sm font-mono font-bold">{formatCurrency(deal.amount)}</span>
                </div>
                {deal.closeDate && (
                  <div className="text-xs text-red-400 mt-1">
                    {new Date(deal.closeDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="px-4 py-3 border-t border-border flex items-center justify-between text-xs text-gray-500">
        <span>Source: Google Sheets</span>
        <span>Updated {new Date(data.lastUpdated).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}</span>
      </div>
    </div>
  );
}
