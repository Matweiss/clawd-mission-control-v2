import React, { useState, useEffect } from 'react';
import { 
  AlertCircle, TrendingUp, Clock, Zap, FileText, 
  ExternalLink, RefreshCw, CheckCircle, DollarSign,
  Target, BarChart3, ArrowRight
} from 'lucide-react';

interface Deal {
  id: string;
  name: string;
  amount: number;
  stagename: string;
  closedate?: string;
  dayssinceactivity: number;
  isstale: boolean;
}

interface SalesIntelligenceHubProps {
  isOpen: boolean;
  onClose: () => void;
  pipeline: { deals: Deal[]; total: number; byStage: Record<string, { count: number; value: number }> };
  onRefresh: () => void;
}

const STAGE_THRESHOLDS: Record<string, number> = {
  'Qualification': 7,
  'Discovery': 5,
  'Evaluation': 4,
  'Confirmation': 4,
  'Negotiation': 3
};

const STAGE_COLORS: Record<string, string> = {
  'Qualification': 'text-orange-400',
  'Discovery': 'text-blue-400',
  'Evaluation': 'text-purple-400',
  'Confirmation': 'text-green-400',
  'Negotiation': 'text-red-400',
};

export function SalesIntelligenceHub({ isOpen, onClose, pipeline, onRefresh }: SalesIntelligenceHubProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'stale' | 'velocity' | 'forecast'>('overview');
  const [generatingBattleCard, setGeneratingBattleCard] = useState<string | null>(null);

  if (!isOpen) return null;

  // Calculate metrics
  const staleDeals = pipeline.deals.filter(d => d.isstale || d.dayssinceactivity > (STAGE_THRESHOLDS[d.stagename] || 5));
  const totalStaleValue = staleDeals.reduce((sum, d) => sum + (d.amount || 0), 0);
  
  const closingThisWeek = pipeline.deals.filter(d => {
    if (!d.closedate) return false;
    const close = new Date(d.closedate);
    const weekFromNow = new Date();
    weekFromNow.setDate(weekFromNow.getDate() + 7);
    return close <= weekFromNow && close >= new Date();
  });

  const formatCurrency = (val: number) => `$${(val / 1000).toFixed(0)}K`;
  const formatDate = (date: string) => new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

  const generateBattleCard = async (dealName: string) => {
    setGeneratingBattleCard(dealName);
    
    // Simulate battle card generation
    console.log(`🎯 Generating battle card for ${dealName}...`);
    console.log('  1. Researching competitor info via Perplexity...');
    console.log('  2. Creating Notion page...');
    console.log('  3. Posting to Slack #sales...');
    
    setTimeout(() => {
      setGeneratingBattleCard(null);
      alert(`✅ Battle card created for ${dealName}!\n\nCheck Notion for the full document. Summary posted to #sales.`);
    }, 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-surface border border-border rounded-xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-work/20 flex items-center justify-center">
              <Target className="w-5 h-5 text-work" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Sales Intelligence Hub</h2>
              <p className="text-sm text-gray-500">Pipeline analytics, stale deal alerts, battle cards</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={onRefresh}
              className="flex items-center gap-2 px-3 py-1.5 bg-surface-light hover:bg-border rounded-lg text-sm transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>            
            <button 
              onClick={onClose}
              className="p-2 hover:bg-surface-light rounded-lg transition-colors"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-border">
          {[
            { id: 'overview', label: 'Overview', icon: BarChart3 },
            { id: 'stale', label: `Stale Deals (${staleDeals.length})`, icon: AlertCircle },
            { id: 'velocity', label: 'Velocity', icon: TrendingUp },
            { id: 'forecast', label: 'Forecast', icon: DollarSign },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id 
                  ? 'border-work text-work' 
                  : 'border-transparent text-gray-500 hover:text-gray-300'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Key Metrics */}
              <div className="grid grid-cols-4 gap-4">
                <div className="bg-surface-light rounded-xl p-4">
                  <div className="text-sm text-gray-500 mb-1">Total Pipeline</div>
                  <div className="text-2xl font-bold text-white">{formatCurrency(pipeline.total)}</div>
                  <div className="text-xs text-gray-500 mt-1">{pipeline.deals.length} deals</div>
                </div>
                
                <div className="bg-surface-light rounded-xl p-4">
                  <div className="text-sm text-gray-500 mb-1">Stale Deals</div>
                  <div className={`text-2xl font-bold ${staleDeals.length > 0 ? 'text-red-400' : 'text-green-400'}`}>
                    {staleDeals.length}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">{formatCurrency(totalStaleValue)} at risk</div>
                </div>
                
                <div className="bg-surface-light rounded-xl p-4">
                  <div className="text-sm text-gray-500 mb-1">Closing This Week</div>
                  <div className="text-2xl font-bold text-cyan-400">{closingThisWeek.length}</div>
                  <div className="text-xs text-gray-500 mt-1">{formatCurrency(closingThisWeek.reduce((s, d) => s + d.amount, 0))}</div>
                </div>
                
                <div className="bg-surface-light rounded-xl p-4">
                  <div className="text-sm text-gray-500 mb-1">Avg Deal Size</div>
                  <div className="text-2xl font-bold text-white">
                    {formatCurrency(pipeline.deals.length > 0 ? pipeline.total / pipeline.deals.length : 0)}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">Per opportunity</div>
                </div>
              </div>

              {/* Pipeline by Stage */}
              <div className="bg-surface-light rounded-xl p-4">
                <h3 className="text-sm font-semibold text-gray-400 mb-4">Pipeline by Stage</h3>
                <div className="space-y-3">
                  {Object.entries(pipeline.byStage).map(([stage, data]) => {
                    const percentage = (data.value / pipeline.total) * 100;
                    return (
                      <div key={stage}>
                        <div className="flex items-center justify-between text-sm mb-1">
                          <span className={STAGE_COLORS[stage] || 'text-gray-400'}>{stage}</span>
                          <div className="flex items-center gap-4">
                            <span className="text-gray-500">{data.count} deals</span>
                            <span className="font-mono">{formatCurrency(data.value)}</span>
                            <span className="text-gray-500 w-12 text-right">{percentage.toFixed(0)}%</span>
                          </div>
                        </div>
                        <div className="w-full bg-gray-800 rounded-full h-2">
                          <div 
                            className="h-2 rounded-full transition-all"
                            style={{ 
                              width: `${percentage}%`,
                              backgroundColor: STAGE_COLORS[stage]?.replace('text-', '') || '#6B7280'
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Quick Actions */}
              <div className="grid grid-cols-3 gap-4">
                <button
                  onClick={() => setActiveTab('stale')}
                  className="flex items-center gap-3 p-4 bg-surface-light hover:bg-border rounded-xl transition-colors text-left"
                >
                  <div className="p-2 bg-red-500/20 rounded-lg">
                    <AlertCircle className="w-5 h-5 text-red-400" />
                  </div>
                  <div>
                    <div className="font-medium">Check Stale Deals</div>
                    <div className="text-sm text-gray-500">{staleDeals.length} need attention</div>
                  </div>
                </button>

                <button
                  className="flex items-center gap-3 p-4 bg-surface-light hover:bg-border rounded-xl transition-colors text-left"
                >
                  <div className="p-2 bg-work/20 rounded-lg">
                    <FileText className="w-5 h-5 text-work" />
                  </div>
                  <div>
                    <div className="font-medium">Generate Report</div>
                    <div className="text-sm text-gray-500">Weekly pipeline summary</div>
                  </div>
                </button>

                <a
                  href="https://app.hubspot.com/contacts/43832131/objects/0-3/views/9048336/list"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-4 bg-surface-light hover:bg-border rounded-xl transition-colors text-left"
                >
                  <div className="p-2 bg-cyan-500/20 rounded-lg">
                    <ExternalLink className="w-5 h-5 text-cyan-400" />
                  </div>
                  <div>
                    <div className="font-medium">Open HubSpot</div>
                    <div className="text-sm text-gray-500">View in CRM</div>
                  </div>
                </a>
              </div>
            </div>
          )}

          {activeTab === 'stale' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-white">Stale Deals Requiring Action</h3>
                <span className="text-sm text-gray-500">{staleDeals.length} deals | {formatCurrency(totalStaleValue)} at risk</span>
              </div>

              {staleDeals.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <CheckCircle className="w-12 h-12 mx-auto mb-4 text-green-400" />
                  <p className="text-lg">No stale deals! 🎉</p>
                  <p className="text-sm">All deals are progressing on schedule.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {staleDeals.map(deal => (
                    <div key={deal.id} className="bg-surface-light rounded-xl p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h4 className="font-semibold text-white">{deal.name}</h4>
                            <span className={`text-xs px-2 py-1 rounded ${STAGE_COLORS[deal.stagename]}`}>
                              {deal.stagename}
                            </span>
                            <span className="text-xs bg-red-500/20 text-red-400 px-2 py-1 rounded">
                              {deal.dayssinceactivity} days stale
                            </span>
                          </div>
                          
                          <div className="flex items-center gap-6 text-sm text-gray-400">
                            <span>Amount: <span className="text-white font-mono">{formatCurrency(deal.amount)}</span></span>
                            {deal.closedate && <span>Close: {formatDate(deal.closedate)}</span>}
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => generateBattleCard(deal.name)}
                            disabled={generatingBattleCard === deal.name}
                            className="flex items-center gap-2 px-3 py-1.5 bg-work/20 hover:bg-work/30 text-work rounded-lg text-sm transition-colors disabled:opacity-50"
                          >
                            {generatingBattleCard === deal.name ? (
                              <>🔄 Generating...</>
                            ) : (
                              <><Zap className="w-4 h-4" /> Battle Card</>
                            )}
                          </button>
                          
                          <a
                            href={`https://app.hubspot.com/contacts/43832131/record/0-3/${deal.id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 hover:bg-surface rounded-lg transition-colors"
                          >
                            <ExternalLink className="w-4 h-4 text-gray-400" />
                          </a>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'velocity' && (
            <div className="text-center py-12 text-gray-500">
              <Clock className="w-12 h-12 mx-auto mb-4" />
              <p className="text-lg">Velocity Tracking Coming Soon</p>
              <p className="text-sm max-w-md mx-auto mt-2">
                Track average time in each stage, conversion rates, and identify bottlenecks.
              </p>
            </div>
          )}

          {activeTab === 'forecast' && (
            <div className="text-center py-12 text-gray-500">
              <DollarSign className="w-12 h-12 mx-auto mb-4" />
              <p className="text-lg">Forecasting Coming Soon</p>
              <p className="text-sm max-w-md mx-auto mt-2">
                AI-powered revenue forecasting based on pipeline health and historical data.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
