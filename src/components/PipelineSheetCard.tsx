import React, { useEffect, useState } from 'react';
import { TrendingUp, AlertCircle, RefreshCw, MoreHorizontal, Plus } from 'lucide-react';

interface Deal {
  id: string;
  name: string;
  mrr: number;
  arr: number;
  stage: string;
  closeDate?: string;
  probability?: number;
}

interface PipelineData {
  deals: Deal[];
  totalMRR: number;
  totalARR: number;
  byStage: Record<string, { count: number; mrr: number; arr: number }>;
  closingThisWeek: Deal[];
  count: number;
  lastUpdated: string;
  error?: string;
  help?: string;
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
  const [showAddForm, setShowAddForm] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [newDeal, setNewDeal] = useState({
    name: '',
    mrr: '',
    stage: 'Qualification',
    closeDate: '',
    probability: '',
    notes: ''
  });

  const handleCreateDeal = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      const mrr = parseFloat(newDeal.mrr) || 0;
      const arr = mrr * 12;
      
      const response = await fetch('/api/pipeline/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newDeal.name,
          mrr,
          arr,
          stage: newDeal.stage,
          closeDate: newDeal.closeDate,
          probability: newDeal.probability,
          notes: newDeal.notes
        })
      });

      if (response.ok) {
        setShowAddForm(false);
        setNewDeal({ name: '', mrr: '', stage: 'Qualification', closeDate: '', probability: '', notes: '' });
        fetchPipeline();
      } else {
        const error = await response.json();
        alert(`Failed to create deal: ${error.error || 'Unknown error'}`);
      }
    } catch (err) {
      alert(`Failed to create deal: ${err}`);
    } finally {
      setActionLoading(false);
    }
  };

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
  const formatDollars = (val: number) => `$${val.toLocaleString()}`;

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
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="p-1.5 bg-cyan-500/20 text-cyan-400 rounded hover:bg-cyan-500/30 transition-colors"
            title="Add Deal"
          >
            <Plus className="w-4 h-4" />
          </button>
          <span className="text-xs text-gray-500">Sheet</span>
          <button 
            onClick={fetchPipeline}
            className="p-1 hover:bg-surface-light rounded transition-colors"
          >
            <RefreshCw className={`w-4 h-4 text-gray-500 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {showAddForm && (
        <div className="p-4 border-b border-border bg-surface-light">
          <h3 className="text-sm font-medium mb-3">Add New Deal</h3>
          <form onSubmit={handleCreateDeal} className="space-y-2">
            <input
              type="text"
              placeholder="Deal name"
              value={newDeal.name}
              onChange={(e) => setNewDeal({...newDeal, name: e.target.value})}
              className="w-full px-3 py-2 bg-surface border border-border rounded text-sm"
              required
            />
            <div className="grid grid-cols-2 gap-2">
              <input
                type="number"
                placeholder="MRR"
                value={newDeal.mrr}
                onChange={(e) => setNewDeal({...newDeal, mrr: e.target.value})}
                className="px-3 py-2 bg-surface border border-border rounded text-sm"
                required
              />
              <select
                value={newDeal.stage}
                onChange={(e) => setNewDeal({...newDeal, stage: e.target.value})}
                className="px-3 py-2 bg-surface border border-border rounded text-sm"
              >
                <option>Qualification</option>
                <option>Discovery</option>
                <option>Evaluation</option>
                <option>Confirmation</option>
                <option>Negotiation</option>
              </select>
            </div>
            <input
              type="date"
              placeholder="Close date"
              value={newDeal.closeDate}
              onChange={(e) => setNewDeal({...newDeal, closeDate: e.target.value})}
              className="w-full px-3 py-2 bg-surface border border-border rounded text-sm"
            />
            <input
              type="text"
              placeholder="Notes"
              value={newDeal.notes}
              onChange={(e) => setNewDeal({...newDeal, notes: e.target.value})}
              className="w-full px-3 py-2 bg-surface border border-border rounded text-sm"
            />
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={actionLoading}
                className="flex-1 py-2 bg-cyan-500/20 text-cyan-400 rounded text-sm hover:bg-cyan-500/30 transition-colors"
              >
                {actionLoading ? 'Adding...' : 'Add Deal'}
              </button>
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-4 py-2 bg-surface border border-border rounded text-sm hover:bg-border transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}
      
      <div className="p-4">
        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="text-center">
            <div className="text-2xl font-bold font-mono">{data.count}</div>
            <div className="text-xs text-gray-500">Deals</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold font-mono text-green-400">{data.closingThisWeek.length}</div>
            <div className="text-xs text-gray-500">This Week</div>
          </div>
        </div>

        {/* MRR / ARR Totals */}
        <div className="grid grid-cols-2 gap-4 mb-4 p-3 bg-surface-light rounded-lg">
          <div className="text-center border-r border-border">
            <div className="text-xl font-bold font-mono text-cyan-400">{formatDollars(data.totalMRR)}</div>
            <div className="text-xs text-gray-500">Total MRR</div>
          </div>
          <div className="text-center">
            <div className="text-xl font-bold font-mono text-purple-400">{formatDollars(data.totalARR)}</div>
            <div className="text-xs text-gray-500">Total ARR</div>
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
                  <span className="font-mono text-cyan-400">{formatDollars(stageData.mrr)} MRR</span>
                  <span className="font-mono text-purple-400">{formatDollars(stageData.arr)} ARR</span>
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
                  <div className="text-right">
                    <span className="text-sm font-mono font-bold text-cyan-400">{formatDollars(deal.mrr)} MRR</span>
                    <span className="text-sm font-mono font-bold text-purple-400 ml-2">{formatDollars(deal.arr)} ARR</span>
                  </div>
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
