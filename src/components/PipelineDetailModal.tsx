import React, { useState } from 'react';
import { X, Search, Filter, ArrowUpDown, ExternalLink } from 'lucide-react';

interface Deal {
  id: string;
  name: string;
  amount: number;
  stageName: string;
  closeDate?: string;
  daysStale?: number;
}

interface PipelineDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  pipeline: { deals: Deal[]; total: number; byStage: Record<string, { count: number; value: number }> };
  staleDeals: Deal[];
}

const STAGE_ORDER = ['Qualification', 'Discovery', 'Evaluation', 'Confirmation', 'Negotiation'];
const STAGE_COLORS: Record<string, string> = {
  'Qualification': 'text-orange-400',
  'Discovery': 'text-blue-400',
  'Evaluation': 'text-purple-400',
  'Confirmation': 'text-green-400',
  'Negotiation': 'text-red-400',
};

export function PipelineDetailModal({ isOpen, onClose, pipeline, staleDeals }: PipelineDetailModalProps) {
  const [activeTab, setActiveTab] = useState<'all' | 'byStage' | 'closing' | 'stale'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'amount' | 'closeDate' | 'name'>('amount');

  if (!isOpen) return null;

  const formatCurrency = (val: number) => `$${(val / 1000).toFixed(0)}K`;
  
  const filteredDeals = pipeline.deals.filter(deal => 
    deal.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    deal.stageName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const closingSoon = pipeline.deals.filter(d => {
    if (!d.closeDate) return false;
    const close = new Date(d.closeDate);
    const weekFromNow = new Date();
    weekFromNow.setDate(weekFromNow.getDate() + 14);
    return close <= weekFromNow;
  }).sort((a, b) => new Date(a.closeDate!).getTime() - new Date(b.closeDate!).getTime());

  const sortedDeals = [...filteredDeals].sort((a, b) => {
    if (sortBy === 'amount') return b.amount - a.amount;
    if (sortBy === 'closeDate') return new Date(a.closeDate || '').getTime() - new Date(b.closeDate || '').getTime();
    return a.name.localeCompare(b.name);
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-surface border border-border rounded-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-border flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold">Sales Pipeline</h2>
            <p className="text-sm text-gray-500">
              {pipeline.deals.length} deals • {formatCurrency(pipeline.total)} total
            </p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-surface-light rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-border px-6">
          {[
            { id: 'all', label: 'All Deals', count: pipeline.deals.length },
            { id: 'byStage', label: 'By Stage', count: Object.keys(pipeline.byStage).length },
            { id: 'closing', label: 'Closing Soon', count: closingSoon.length },
            { id: 'stale', label: 'Stale', count: staleDeals.length },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id 
                  ? 'border-work text-work' 
                  : 'border-transparent text-gray-500 hover:text-gray-300'
              }`}
            >
              {tab.label}
              <span className="ml-2 text-xs text-gray-600">({tab.count})</span>
            </button>
          ))}
        </div>

        {/* Search & Filter Bar */}
        <div className="px-6 py-3 border-b border-border flex gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              type="text"
              placeholder="Search deals..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-surface-light border border-border rounded-lg pl-10 pr-4 py-2 text-sm"
            />
          </div>
          <select 
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="bg-surface-light border border-border rounded-lg px-3 py-2 text-sm"
          >
            <option value="amount">Sort by Amount</option>
            <option value="closeDate">Sort by Close Date</option>
            <option value="name">Sort by Name</option>
          </select>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'all' && (
            <div className="space-y-2">
              {sortedDeals.map(deal => (
                <div key={deal.id} className="flex items-center justify-between p-3 bg-surface-light rounded-lg hover:bg-border transition-colors">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{deal.name}</span>
                      <span className={`text-xs px-2 py-0.5 rounded bg-surface ${STAGE_COLORS[deal.stageName] || 'text-gray-400'}`}>
                        {deal.stageName}
                      </span>
                    </div>
                    {deal.closeDate && (
                      <p className="text-xs text-gray-500 mt-1">
                        Closes: {new Date(deal.closeDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </p>
                    )}
                  </div>
                  <span className="font-mono font-bold text-hubspot">{formatCurrency(deal.amount)}</span>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'byStage' && (
            <div className="space-y-6">
              {STAGE_ORDER.map(stage => {
                const stageData = pipeline.byStage[stage];
                if (!stageData) return null;
                const stageDeals = pipeline.deals.filter(d => d.stageName === stage);
                
                return (
                  <div key={stage}>
                    <div className="flex items-center justify-between mb-3">
                      <h3 className={`font-semibold ${STAGE_COLORS[stage]}`}>{stage}</h3>
                      <span className="text-sm text-gray-500">
                        {stageData.count} deals • {formatCurrency(stageData.value)}
                      </span>
                    </div>
                    <div className="space-y-2">
                      {stageDeals.map(deal => (
                        <div key={deal.id} className="flex items-center justify-between p-3 bg-surface-light rounded-lg">
                          <span className="text-sm">{deal.name}</span>
                          <span className="font-mono text-sm">{formatCurrency(deal.amount)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {activeTab === 'closing' && (
            <div className="space-y-2">
              {closingSoon.length === 0 ? (
                <p className="text-center text-gray-500 py-8">No deals closing in the next 14 days</p>
              ) : (
                closingSoon.map(deal => (
                  <div key={deal.id} className="flex items-center justify-between p-3 bg-surface-light rounded-lg border-l-4 border-red-500">
                    <div>
                      <span className="font-medium">{deal.name}</span>
                      <p className="text-xs text-red-400 mt-1">
                        Closes {new Date(deal.closeDate!).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        {new Date(deal.closeDate!) <= new Date() && ' (OVERDUE)'}
                      </p>
                    </div>
                    <span className="font-mono font-bold">{formatCurrency(deal.amount)}</span>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'stale' && (
            <div className="space-y-2">
              {staleDeals.length === 0 ? (
                <p className="text-center text-gray-500 py-8">No stale deals 🎉</p>
              ) : (
                staleDeals.map(deal => (
                  <div key={deal.id} className="flex items-center justify-between p-3 bg-surface-light rounded-lg border-l-4 border-yellow-500">
                    <div>
                      <span className="font-medium">{deal.name}</span>
                      <p className="text-xs text-yellow-500 mt-1">
                        {deal.daysStale} days stale • {deal.stageName}
                      </p>
                    </div>
                    <span className="font-mono text-sm">{formatCurrency(deal.amount)}</span>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-border flex justify-between items-center">
          <span className="text-xs text-gray-500">Last updated: {new Date().toLocaleTimeString()}</span>
          <a 
            href="https://app.hubspot.com/contacts/43832131/objects/0-3/views/9048336/list"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-sm text-hubspot hover:underline"
          >
            Open in HubSpot
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>
      </div>
    </div>
  );
}
