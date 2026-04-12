import React, { useEffect, useMemo, useState } from 'react';
import { Heart, MapPin, RefreshCw, RotateCcw, Star, Plus } from 'lucide-react';

interface Visit {
  date: string;
  rating: number;
  notes?: string;
}

interface Spot {
  id: string;
  name: string;
  neighborhood: string;
  category: string;
  vibe: string;
  price: '$' | '$$' | '$$$' | '$$$$';
  lastSuggestedAt?: string;
  createdAt: string;
  visits: Visit[];
}

interface ApiResponse {
  spots: Spot[];
  rotation: Spot[];
}

const emptyForm = { name: '', neighborhood: '', category: 'Dinner', vibe: '', price: '$$' };

export function DateNightMemoryBankCard() {
  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(emptyForm);

  const load = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/date-night-spots');
      if (res.ok) setData(await res.json());
    } catch (error) {
      console.error('Failed to load date night spots', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const averageRating = useMemo(() => {
    const visits = data?.spots.flatMap((spot) => spot.visits) || [];
    if (!visits.length) return null;
    return (visits.reduce((sum, visit) => sum + visit.rating, 0) / visits.length).toFixed(1);
  }, [data]);

  const submit = async (body: Record<string, unknown>) => {
    setSaving(true);
    try {
      const res = await fetch('/api/date-night-spots', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error('Request failed');
      setData(await res.json());
    } catch (error) {
      console.error('Failed to save date night spot', error);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="bg-surface border border-purple-500/30 rounded-xl p-4 text-sm text-gray-500">Loading date night memory bank…</div>;
  }

  const spots = data?.spots || [];
  const rotation = data?.rotation || [];

  return (
    <div className="bg-surface border border-purple-500/30 rounded-xl overflow-hidden">
      <div className="px-4 py-3 border-b border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center">
              <Heart className="w-4 h-4 text-purple-300" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-white">Date Night Memory Bank</h2>
              <p className="text-xs text-gray-500">Visited spots, ratings, and fresh rotation</p>
            </div>
          </div>
          <button onClick={load} className="text-xs text-gray-400 hover:text-white"><RefreshCw className="w-4 h-4" /></button>
        </div>
      </div>

      <div className="p-4 space-y-4">
        <div className="grid grid-cols-3 gap-2 text-xs">
          <Stat label="Tracked" value={String(spots.length)} />
          <Stat label="Visited" value={String(spots.filter((spot) => spot.visits.length > 0).length)} />
          <Stat label="Avg rating" value={averageRating ? `${averageRating}★` : '—'} />
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-medium text-gray-400 uppercase">Rotation</h3>
            <span className="text-[11px] text-gray-500">Bias toward underused favorites</span>
          </div>
          <div className="space-y-2">
            {rotation.map((spot) => {
              const lastVisit = spot.visits[0];
              return (
                <div key={spot.id} className="rounded-lg border border-border bg-surface-light/60 p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-sm font-medium text-white">{spot.name}</div>
                      <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                        <MapPin className="w-3 h-3" />
                        <span>{spot.neighborhood}</span>
                        <span>•</span>
                        <span>{spot.category}</span>
                        <span>•</span>
                        <span>{spot.price}</span>
                      </div>
                      <div className="text-xs text-gray-400 mt-1">{spot.vibe}</div>
                      <div className="text-[11px] text-gray-500 mt-2">
                        {lastVisit ? `Last visit ${lastVisit.date} • ${lastVisit.rating}★` : 'Not visited yet'}
                      </div>
                    </div>
                    <div className="flex flex-col gap-2 shrink-0">
                      <button
                        onClick={() => submit({ action: 'logVisit', spotId: spot.id, rating: 5, notes: 'Quick add from dashboard' })}
                        disabled={saving}
                        className="px-2 py-1 rounded bg-purple-500/20 text-purple-300 text-xs hover:bg-purple-500/30 disabled:opacity-50"
                      >
                        <Star className="w-3 h-3 inline mr-1" />5★
                      </button>
                      <button
                        onClick={() => submit({ action: 'rotateSuggestion', spotId: spot.id })}
                        disabled={saving}
                        className="px-2 py-1 rounded bg-surface text-gray-300 text-xs border border-border hover:border-gray-500 disabled:opacity-50"
                      >
                        <RotateCcw className="w-3 h-3 inline mr-1" />Rotate
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="rounded-lg border border-border bg-surface-light/40 p-3">
          <div className="text-xs font-medium text-gray-400 uppercase mb-3">Add a spot</div>
          <div className="grid grid-cols-2 gap-2 mb-2">
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Name" className="bg-surface border border-border rounded px-3 py-2 text-sm text-white" />
            <input value={form.neighborhood} onChange={(e) => setForm({ ...form, neighborhood: e.target.value })} placeholder="Neighborhood" className="bg-surface border border-border rounded px-3 py-2 text-sm text-white" />
            <input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="Category" className="bg-surface border border-border rounded px-3 py-2 text-sm text-white" />
            <select value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} className="bg-surface border border-border rounded px-3 py-2 text-sm text-white">
              <option value="$">$</option>
              <option value="$$">$$</option>
              <option value="$$$">$$$</option>
              <option value="$$$$">$$$$</option>
            </select>
          </div>
          <input value={form.vibe} onChange={(e) => setForm({ ...form, vibe: e.target.value })} placeholder="Why it fits the rotation" className="w-full bg-surface border border-border rounded px-3 py-2 text-sm text-white mb-2" />
          <button
            onClick={async () => {
              await submit({ action: 'addSpot', ...form });
              setForm(emptyForm);
            }}
            disabled={saving || !form.name || !form.neighborhood || !form.vibe}
            className="w-full px-3 py-2 rounded bg-purple-500/20 text-purple-300 text-sm font-medium hover:bg-purple-500/30 disabled:opacity-50"
          >
            <Plus className="w-4 h-4 inline mr-1" />Add to memory bank
          </button>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-surface-light p-3 border border-border/60">
      <div className="text-gray-400">{label}</div>
      <div className="text-white font-semibold mt-1">{value}</div>
    </div>
  );
}
