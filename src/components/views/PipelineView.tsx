import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, DollarSign, Calendar, Target, ExternalLink,
  Filter, Search, MoreHorizontal, AlertCircle, CheckCircle2,
  Clock, ChevronRight, RefreshCw, Plus, Mail, Phone,
  Edit2, Trash2, Save, X, MessageSquare
} from 'lucide-react';
import { fetchDealsFromSheet, updateDealInSheet, addDealToSheet, Deal } from '../../lib/sheets-api';

const STAGE_OPTIONS = [
  'Qualified Pipeline',
  'Discovery', 
  'Demo Scheduled',
  'Negotiation',
  'Contract Review',
  'Closed Won',
  'Closed Lost'
];

const STATUS_OPTIONS = ['active', 'stalled', 'at_risk', 'closing', 'closed_won', 'closed_lost'];
const PRIORITY_OPTIONS = ['high', 'medium', 'low'];

const STAGE_COLORS: any = {
  'Qualified Pipeline': 'bg-blue-500/20 text-blue-400',
  'Discovery': 'bg-cyan-500/20 text-cyan-400',
  'Demo Scheduled': 'bg-green-500/20 text-green-400',
  'Negotiation': 'bg-orange-500/20 text-orange-400',
  'Contract Review': 'bg-purple-500/20 text-purple-400',
  'Closed Won': 'bg-green-500/30 text-green-400',
  'Closed Lost': 'bg-gray-500/20 text-gray-400',
};

const STATUS_ICONS: any = {
  active: CheckCircle2,
  stalled: Clock,
  at_risk: AlertCircle,
  closing: Target,
  closed_won: CheckCircle2,
  closed_lost: X,
};

const STATUS_COLORS: any = {
  active: 'text-green-400',
  stalled: 'text-yellow-400',
  at_risk: 'text-red-400',
  closing: 'text-purple-400',
  closed_won: 'text-green-400',
  closed_lost: 'text-gray-400',
};

export function PipelineView() {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'high' | 'closing' | 'at_risk' | 'closed'>('all');
  const [search, setSearch] = useState('');
  const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);

  useEffect(() => {
    loadDeals();
  }, []);

  const loadDeals = async () => {
    setLoading(true);
    const data = await fetchDealsFromSheet();
    setDeals(data.length > 0 ? data : getSampleDeals());
    setLoading(false);
  };

  const getSampleDeals = (): Deal[] => [
    // Your ACTUAL deals from Google Sheet
    {
      id: '1', dealId: '52332126577', name: 'Chubby Group - New Deal', company: 'Chubby',
      contactEmail: '', amount: 7200, stage: 'Negotiation',
      closeDate: '2026-03-22', priority: 'high', status: 'active',
      notes: '3/4 - need Will to remove fees from Cpay then send to Tim',
      nextAction: 'Follow up with Will on fees'
    },
    {
      id: '2', dealId: '51790293557', name: 'Holland America Princess (USF Reactivation)', company: 'Holland America Princess',
      contactEmail: '', amount: 91332, stage: 'Confirmation',
      closeDate: '2026-03-31', priority: 'high', status: 'active',
      notes: '3/4 - waiting on proposal approval so HAP can send to legal',
      nextAction: 'Check proposal approval status'
    },
    {
      id: '3', dealId: '57507213367', name: 'Future Bars Group - Inbound - New Deal', company: 'Future Bars',
      contactEmail: '', amount: 6600, stage: 'Qualification',
      closeDate: '2026-03-31', priority: 'medium', status: 'active',
      notes: '3/4 - emailed success, they should take this',
      nextAction: 'Wait for response'
    },
    {
      id: '4', dealId: '57500031881', name: 'Pennbridge Hospitality - Inbound - New Deal', company: 'Pennbridge',
      contactEmail: '', amount: 4800, stage: 'Qualification',
      closeDate: '2026-03-31', priority: 'medium', status: 'active',
      notes: '3/4 - need to send them an agreement and deck tomorrow',
      nextAction: 'Send agreement and deck'
    },
    {
      id: '5', dealId: '53460512601', name: 'Pizzana - Inbound - New Deal', company: 'Pizzana',
      contactEmail: '', amount: 9000, stage: 'Qualification',
      closeDate: '2026-03-31', priority: 'low', status: 'stalled',
      notes: '3/4 - Check in, least likely to close',
      nextAction: 'Check in with them'
    },
    {
      id: '6', dealId: '51633407566', name: 'AVA Roasteria - New Deal', company: 'AVA Roasteria',
      contactEmail: '', amount: 14400, stage: 'Confirmation',
      closeDate: '2026-03-31', priority: 'high', status: 'active',
      notes: '3/4 - Scheduling time with MG',
      nextAction: 'Schedule meeting with MG'
    },
    {
      id: '7', dealId: '49260357550', name: 'PopStroke Corporate - 2026 expansion', company: 'PopStroke',
      contactEmail: '', amount: 0, stage: 'Qualification',
      closeDate: '2026-03-31', priority: 'low', status: 'stalled',
      notes: '3/4 - Whitney is probably taking this',
      nextAction: 'Confirm with Whitney'
    },
    {
      id: '8', dealId: '', name: 'Rustic Canyon - new deal', company: 'Rustic Canyon',
      contactEmail: '', amount: 16500, stage: 'Qualification',
      closeDate: '', priority: 'medium', status: 'active',
      notes: '3/4 - Need to email team to see if they spoke with GW',
      nextAction: 'Email team about GW'
    },
  ];

  const handleSaveDeal = async (updatedDeal: Deal) => {
    const index = deals.findIndex(d => d.id === updatedDeal.id);
    if (index >= 0) {
      // Update in Google Sheets
      await updateDealInSheet(updatedDeal, index);
      
      // Update local state
      const newDeals = [...deals];
      newDeals[index] = updatedDeal;
      setDeals(newDeals);
    }
    setIsEditing(false);
    setSelectedDeal(null);
  };

  const handleAddDeal = async (newDeal: Omit<Deal, 'id'>) => {
    await addDealToSheet(newDeal);
    await loadDeals();
    setShowAddModal(false);
  };

  const filteredDeals = deals
    .filter(d => {
      if (filter === 'all') return true;
      if (filter === 'closed') return d.status === 'closed_won' || d.status === 'closed_lost';
      if (filter === 'high') return d.priority === 'high';
      return d.status === filter;
    })
    .filter(d => 
      d.name.toLowerCase().includes(search.toLowerCase()) ||
      d.company.toLowerCase().includes(search.toLowerCase()) ||
      d.contactEmail?.toLowerCase().includes(search.toLowerCase())
    );

  const totalValue = filteredDeals.reduce((sum, d) => sum + d.amount, 0);
  const closingThisMonth = filteredDeals.filter(d => d.status === 'closing').length;
  const atRisk = filteredDeals.filter(d => d.status === 'at_risk').length;
  const closedWon = filteredDeals.filter(d => d.status === 'closed_won').length;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency', currency: 'USD', notation: 'compact', maximumFractionDigits: 1
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 text-orange-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Pipeline</h1>
          <p className="text-sm text-gray-500 mt-1">March 2025 close deals from Google Sheets</p>
        </div>
        
        <div className="flex items-center gap-2">
          <button 
            onClick={loadDeals}
            className="flex items-center gap-2 px-3 py-2 bg-[#2A2A2A] hover:bg-[#3A3A3A] rounded-lg text-sm text-gray-300 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Sync
          </button>
          
          <button 
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-orange-500/20 text-orange-400 rounded-lg text-sm hover:bg-orange-500/30 transition-colors"
>
            <Plus className="w-4 h-4" />
            Add Deal
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <StatCard label="Total Pipeline" value={formatCurrency(totalValue)} subtext={`${filteredDeals.length} deals`} color="blue" icon={DollarSign} />
        <StatCard label="Closing This Month" value={closingThisMonth.toString()} subtext="Need attention" color="purple" icon={Target} />
        <StatCard label="At Risk" value={atRisk.toString()} subtext="Requires action" color="red" icon={AlertCircle} />
        <StatCard label="Closed Won" value={closedWon.toString()} subtext="This month" color="green" icon={CheckCircle2} />
      </div>

      {/* Filters */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-1">
          {['all', 'high', 'closing', 'at_risk', 'closed'].map((f) => (
            <button key={f} onClick={() => setFilter(f as any)} className={`px-3 py-1.5 rounded-lg text-xs capitalize transition-colors ${filter === f ? 'bg-[#2A2A2A] text-white' : 'text-gray-500 hover:text-gray-300'}`}>
              {f.replace('_', ' ')}
            </button>
          ))}
        </div>
        
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input type="text" placeholder="Search deals, companies, emails..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 pr-4 py-2 bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-orange-500 w-64" />
        </div>
      </div>

      {/* Deals Grid */}
      <div className="grid grid-cols-2 gap-4">
        {filteredDeals.map((deal) => {
          const StatusIcon = STATUS_ICONS[deal.status];
          const daysLeft = Math.ceil((new Date(deal.closeDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
          
          return (
            <div key={deal.id} onClick={() => setSelectedDeal(deal)} className="bg-[#161616] rounded-xl p-4 hover:bg-[#1A1A1A] transition-colors cursor-pointer group">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-2 py-1 rounded ${STAGE_COLORS[deal.stage] || 'bg-gray-500/20 text-gray-400'}`}>{deal.stage}</span>
                  <div className={`flex items-center gap-1 text-xs ${STATUS_COLORS[deal.status]}`}>
                    <StatusIcon className="w-3 h-3" />
                    <span className="capitalize">{deal.status.replace('_', ' ')}</span>
                  </div>
                </div>
                <span className="text-lg font-bold text-white">{formatCurrency(deal.amount)}</span>
              </div>

              <h3 className="text-white font-medium mb-1">{deal.name}</h3>
              <p className="text-sm text-gray-400 mb-2">{deal.company}</p>

              {deal.contactEmail && (
                <div className="flex items-center gap-1 text-xs text-gray-500 mb-2">
                  <Mail className="w-3 h-3" />
                  <span className="truncate">{deal.contactEmail}</span>
                </div>
              )}

              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1 text-gray-500">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>{new Date(deal.closeDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                  {daysLeft <= 7 && (
                    <span className={`ml-1 ${daysLeft <= 3 ? 'text-red-400' : 'text-yellow-400'}`}>({daysLeft}d left)</span>
                  )}
                </div>
                
                <span className={`text-xs px-2 py-0.5 rounded ${deal.priority === 'high' ? 'bg-red-500/20 text-red-400' : deal.priority === 'medium' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-green-500/20 text-green-400'}`}>
                  {deal.priority}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Detail/Edit Modal */}
      {selectedDeal && (
        <DealModal 
          deal={selectedDeal}
          onClose={() => { setSelectedDeal(null); setIsEditing(false); }}
          onSave={handleSaveDeal}
          isEditing={isEditing}
          setIsEditing={setIsEditing}
        />
      )}

      {/* Add Deal Modal */}
      {showAddModal && (
        <AddDealModal 
          onClose={() => setShowAddModal(false)}
          onSave={handleAddDeal}
        />
      )}
    </div>
  );
}

function StatCard({ label, value, subtext, color, icon: Icon }: any) {
  const colorClasses = { blue: 'text-blue-400', purple: 'text-purple-400', red: 'text-red-400', green: 'text-green-400' };
  return (
    <div className="bg-[#161616] rounded-xl p-4">
      <div className="flex items-center gap-2 mb-2">
        <Icon className={`w-4 h-4 ${colorClasses[color as keyof typeof colorClasses]}`} />
        <span className="text-sm text-gray-400">{label}</span>
      </div>
      <p className={`text-xl font-bold ${colorClasses[color as keyof typeof colorClasses]}`}>{value}</p>
      <p className="text-xs text-gray-500">{subtext}</p>
    </div>
  );
}

function DealModal({ deal, onClose, onSave, isEditing, setIsEditing }: any) {
  const [form, setForm] = useState(deal);

  const handleSubmit = () => {
    onSave(form);
  };

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
      <div className="bg-[#161616] rounded-2xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white">{isEditing ? 'Edit Deal' : deal.name}</h2>
          <div className="flex items-center gap-2">
            {!isEditing && (
              <button onClick={() => setIsEditing(true)} className="p-2 hover:bg-[#2A2A2A] rounded-lg">
                <Edit2 className="w-4 h-4 text-gray-400" />
              </button>
            )}
            <button onClick={onClose} className="p-2 hover:bg-[#2A2A2A] rounded-lg">
              <X className="w-5 h-5 text-gray-400" />
            </button>
          </div>
        </div>

        {isEditing ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Input label="Deal Name" value={form.name} onChange={(v: string) => setForm({ ...form, name: v })} />
              <Input label="Company" value={form.company} onChange={(v: string) => setForm({ ...form, company: v })} />
            </div>

            <Input label="Contact Email" value={form.contactEmail || ''} onChange={(v: string) => setForm({ ...form, contactEmail: v })} type="email" />

            <div className="grid grid-cols-3 gap-4">
              <Input label="Amount ($)" value={form.amount} onChange={(v: string) => setForm({ ...form, amount: parseFloat(v) || 0 })} type="number" />
              <Select label="Stage" value={form.stage} onChange={(v: string) => setForm({ ...form, stage: v })} options={STAGE_OPTIONS} />
              <Input label="Close Date" value={form.closeDate} onChange={(v: string) => setForm({ ...form, closeDate: v })} type="date" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Select label="Priority" value={form.priority} onChange={(v: string) => setForm({ ...form, priority: v })} options={PRIORITY_OPTIONS} />
              <Select label="Status" value={form.status} onChange={(v: string) => setForm({ ...form, status: v })} options={STATUS_OPTIONS} />
            </div>

            <TextArea label="Notes" value={form.notes} onChange={(v: string) => setForm({ ...form, notes: v })} />
            <TextArea label="Next Action" value={form.nextAction} onChange={(v: string) => setForm({ ...form, nextAction: v })} />

            <div className="flex gap-3 pt-4">
              <button onClick={onClose} className="flex-1 py-2 bg-[#2A2A2A] text-gray-300 rounded-lg hover:bg-[#3A3A3A]">Cancel</button>
              <button onClick={handleSubmit} className="flex-1 py-2 bg-orange-500/20 text-orange-400 rounded-lg hover:bg-orange-500/30 flex items-center justify-center gap-2">
                <Save className="w-4 h-4" /> Save Changes
              </button>
            </div>
          </div>
        ) : (
          <DealDetailsView deal={deal} />
        )}
      </div>
    </div>
  );
}

function DealDetailsView({ deal }: { deal: Deal }) {
  const StatusIcon = STATUS_ICONS[deal.status];
  const daysLeft = Math.ceil((new Date(deal.closeDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <DetailBox label="Deal Value" value={`$${deal.amount.toLocaleString()}`} />
        <DetailBox label="Close Date" value={`${new Date(deal.closeDate).toLocaleDateString()} (${daysLeft} days)`} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <DetailBox label="Stage" value={deal.stage} />
        <DetailBox label="Priority" value={deal.priority} color={deal.priority === 'high' ? 'text-red-400' : deal.priority === 'medium' ? 'text-yellow-400' : 'text-green-400'} />
      </div>

      {deal.contactEmail && (
        <div className="bg-[#0F0F0F] rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Mail className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-gray-500">Contact Email</span>
          </div>
          <a href={`mailto:${deal.contactEmail}`} className="text-blue-400 hover:underline">{deal.contactEmail}</a>
        </div>
      )}

      <DetailBox label="Status" value={deal.status.replace('_', ' ')} icon={StatusIcon} />

      {deal.notes && <DetailBox label="Notes" value={deal.notes} />}
      
      {deal.nextAction && (
        <div className="bg-orange-500/10 border border-orange-500/30 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <MessageSquare className="w-4 h-4 text-orange-400" />
            <span className="text-sm text-orange-400">Next Action</span>
          </div>
          <p className="text-white">{deal.nextAction}</p>
        </div>
      )}

      <div className="flex gap-3 pt-4">
        <button onClick={() => window.open(deal.hubspotUrl, '_blank')} className="flex-1 py-3 bg-[#2A2A2A] hover:bg-[#3A3A3A] rounded-lg text-sm text-white flex items-center justify-center gap-2">
          <ExternalLink className="w-4 h-4" /> Open in HubSpot
        </button>
      </div>
    </div>
  );
}

function AddDealModal({ onClose, onSave }: { onClose: () => void; onSave: (deal: any) => void }) {
  const [form, setForm] = useState({
    dealId: '',
    name: '',
    company: '',
    contactEmail: '',
    amount: 0,
    stage: 'Qualified Pipeline',
    closeDate: new Date().toISOString().split('T')[0],
    priority: 'medium',
    status: 'active',
    notes: '',
    nextAction: '',
  });

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
      <div className="bg-[#161616] rounded-2xl max-w-2xl w-full p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white">Add New Deal</h2>
          <button onClick={onClose} className="p-2 hover:bg-[#2A2A2A] rounded-lg">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input label="Deal ID" value={form.dealId} onChange={(v: string) => setForm({ ...form, dealId: v })} placeholder="HS-XXXX" />
            <Input label="Deal Name" value={form.name} onChange={(v: string) => setForm({ ...form, name: v })} />
          </div>

          <Input label="Company" value={form.company} onChange={(v: string) => setForm({ ...form, company: v })} />
          <Input label="Contact Email" value={form.contactEmail} onChange={(v: string) => setForm({ ...form, contactEmail: v })} type="email" />

          <div className="grid grid-cols-3 gap-4">
            <Input label="Amount ($)" value={form.amount} onChange={(v: string) => setForm({ ...form, amount: parseFloat(v) || 0 })} type="number" />
            <Select label="Stage" value={form.stage} onChange={(v: string) => setForm({ ...form, stage: v })} options={STAGE_OPTIONS} />
            <Input label="Close Date" value={form.closeDate} onChange={(v: string) => setForm({ ...form, closeDate: v })} type="date" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Select label="Priority" value={form.priority} onChange={(v: string) => setForm({ ...form, priority: v })} options={PRIORITY_OPTIONS} />
            <Select label="Status" value={form.status} onChange={(v: string) => setForm({ ...form, status: v })} options={STATUS_OPTIONS} />
          </div>

          <TextArea label="Notes" value={form.notes} onChange={(v: string) => setForm({ ...form, notes: v })} />
          <TextArea label="Next Action" value={form.nextAction} onChange={(v: string) => setForm({ ...form, nextAction: v })} />

          <div className="flex gap-3 pt-4">
            <button onClick={onClose} className="flex-1 py-2 bg-[#2A2A2A] text-gray-300 rounded-lg hover:bg-[#3A3A3A]">Cancel</button>
            <button onClick={() => onSave(form)} className="flex-1 py-2 bg-orange-500/20 text-orange-400 rounded-lg hover:bg-orange-500/30 flex items-center justify-center gap-2">
              <Plus className="w-4 h-4" /> Add Deal
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Form Components
function Input({ label, value, onChange, type = 'text', placeholder }: any) {
  return (
    <div>
      <label className="text-sm text-gray-400 mb-1 block">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-3 py-2 bg-[#0F0F0F] border border-[#2A2A2A] rounded-lg text-white focus:outline-none focus:border-orange-500"
      />
    </div>
  );
}

function Select({ label, value, onChange, options }: any) {
  return (
    <div>
      <label className="text-sm text-gray-400 mb-1 block">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 bg-[#0F0F0F] border border-[#2A2A2A] rounded-lg text-white focus:outline-none focus:border-orange-500"
      >
        {options.map((opt: string) => (
          <option key={opt} value={opt}>{opt.replace('_', ' ')}</option>
        ))}
      </select>
    </div>
  );
}

function TextArea({ label, value, onChange }: any) {
  return (
    <div>
      <label className="text-sm text-gray-400 mb-1 block">{label}</label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={3}
        className="w-full px-3 py-2 bg-[#0F0F0F] border border-[#2A2A2A] rounded-lg text-white focus:outline-none focus:border-orange-500 resize-none"
      />
    </div>
  );
}

function DetailBox({ label, value, icon: Icon, color }: any) {
  return (
    <div className="bg-[#0F0F0F] rounded-xl p-4">
      <p className="text-sm text-gray-500 mb-1">{label}</p>
      <div className="flex items-center gap-2">
        {Icon && <Icon className={`w-4 h-4 ${color || 'text-gray-400'}`} />}
        <p className={`text-lg font-medium ${color || 'text-white'}`}>{value}</p>
      </div>
    </div>
  );
}
