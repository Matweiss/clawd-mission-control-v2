import React, { useEffect, useMemo, useState } from 'react';
import { Car, CheckCircle2, MapPin, Plus, Route, Timer, Trash2 } from 'lucide-react';

type ErrandPriority = 'high' | 'medium' | 'low';
type ErrandStatus = 'pending' | 'done';
type DueWindow = 'today' | 'this-week' | 'flexible';

type Errand = {
  id: string;
  title: string;
  area: string;
  category: string;
  priority: ErrandPriority;
  estimatedMinutes: number;
  dueWindow: DueWindow;
  status: ErrandStatus;
};

type ErrandGroup = {
  area: string;
  errands: Errand[];
  totalMinutes: number;
  highPriorityCount: number;
  dueTodayCount: number;
  score: number;
};

const STORAGE_KEY = 'mission-control-errands';

const DEFAULT_ERRANDS: Errand[] = [
  {
    id: 'errand-groceries',
    title: 'Trader Joe’s grocery reset',
    area: 'Sherman Oaks',
    category: 'Groceries',
    priority: 'medium',
    estimatedMinutes: 35,
    dueWindow: 'today',
    status: 'pending',
  },
  {
    id: 'errand-post-office',
    title: 'Drop USPS return',
    area: 'Sherman Oaks',
    category: 'Shipping',
    priority: 'high',
    estimatedMinutes: 12,
    dueWindow: 'today',
    status: 'pending',
  },
  {
    id: 'errand-pharmacy',
    title: 'Pick up pharmacy refill',
    area: 'Studio City',
    category: 'Health',
    priority: 'high',
    estimatedMinutes: 10,
    dueWindow: 'this-week',
    status: 'pending',
  },
  {
    id: 'errand-dry-cleaning',
    title: 'Pick up dry cleaning',
    area: 'Studio City',
    category: 'Home',
    priority: 'medium',
    estimatedMinutes: 15,
    dueWindow: 'this-week',
    status: 'pending',
  },
];

const priorityWeight: Record<ErrandPriority, number> = {
  high: 4,
  medium: 2,
  low: 1,
};

const dueWeight: Record<DueWindow, number> = {
  today: 4,
  'this-week': 2,
  flexible: 1,
};

const badgeClasses: Record<ErrandPriority, string> = {
  high: 'bg-red-500/15 text-red-300 border-red-500/25',
  medium: 'bg-yellow-500/15 text-yellow-300 border-yellow-500/25',
  low: 'bg-green-500/15 text-green-300 border-green-500/25',
};

export function ErrandsOptimizerCard() {
  const [errands, setErrands] = useState<Errand[]>(DEFAULT_ERRANDS);
  const [draft, setDraft] = useState({
    title: '',
    area: 'Sherman Oaks',
    category: 'General',
    priority: 'medium' as ErrandPriority,
    estimatedMinutes: '15',
    dueWindow: 'this-week' as DueWindow,
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length) {
          setErrands(parsed);
        }
      }
    } catch (error) {
      console.error('Failed to load errands', error);
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(errands));
    } catch (error) {
      console.error('Failed to save errands', error);
    }
  }, [errands]);

  const pendingErrands = useMemo(() => errands.filter((errand) => errand.status === 'pending'), [errands]);

  const groupedRuns = useMemo<ErrandGroup[]>(() => {
    const groups = pendingErrands.reduce<Record<string, ErrandGroup>>((acc, errand) => {
      if (!acc[errand.area]) {
        acc[errand.area] = {
          area: errand.area,
          errands: [],
          totalMinutes: 0,
          highPriorityCount: 0,
          dueTodayCount: 0,
          score: 0,
        };
      }

      acc[errand.area].errands.push(errand);
      acc[errand.area].totalMinutes += errand.estimatedMinutes;
      acc[errand.area].highPriorityCount += errand.priority === 'high' ? 1 : 0;
      acc[errand.area].dueTodayCount += errand.dueWindow === 'today' ? 1 : 0;
      acc[errand.area].score += priorityWeight[errand.priority] + dueWeight[errand.dueWindow] + 1;

      return acc;
    }, {});

    return Object.values(groups)
      .map((group) => ({
        ...group,
        errands: [...group.errands].sort((a, b) => {
          const priorityDelta = priorityWeight[b.priority] - priorityWeight[a.priority];
          if (priorityDelta !== 0) return priorityDelta;
          return dueWeight[b.dueWindow] - dueWeight[a.dueWindow];
        }),
      }))
      .sort((a, b) => b.score - a.score || a.totalMinutes - b.totalMinutes);
  }, [pendingErrands]);

  const topRun = groupedRuns[0];
  const readyToLeaveCount = pendingErrands.filter((errand) => errand.priority === 'high' || errand.dueWindow === 'today').length;

  const addErrand = () => {
    if (!draft.title.trim()) return;

    setErrands((current) => [
      {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        title: draft.title.trim(),
        area: draft.area.trim() || 'Unsorted',
        category: draft.category.trim() || 'General',
        priority: draft.priority,
        estimatedMinutes: Number(draft.estimatedMinutes) || 15,
        dueWindow: draft.dueWindow,
        status: 'pending',
      },
      ...current,
    ]);

    setDraft({
      title: '',
      area: draft.area,
      category: draft.category,
      priority: 'medium',
      estimatedMinutes: '15',
      dueWindow: 'this-week',
    });
  };

  const toggleErrand = (id: string) => {
    setErrands((current) => current.map((errand) => errand.id === id ? {
      ...errand,
      status: errand.status === 'done' ? 'pending' : 'done',
    } : errand));
  };

  const deleteErrand = (id: string) => {
    setErrands((current) => current.filter((errand) => errand.id !== id));
  };

  return (
    <div className="bg-surface border border-border rounded-xl overflow-hidden">
      <div className="px-4 py-3 border-b border-border">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <Route className="w-4 h-4 text-cyan-300" />
              <h2 className="text-sm font-semibold text-white">Errands Optimizer</h2>
            </div>
            <p className="text-xs text-gray-500 mt-1">Groups out-of-home tasks into the smartest next run</p>
          </div>
          <div className="text-right text-xs">
            <div className="text-cyan-300 font-semibold">{groupedRuns.length} runs</div>
            <div className="text-gray-500">{pendingErrands.length} open</div>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4">
        <div className="grid grid-cols-3 gap-2 text-xs">
          <div className="bg-surface-light rounded-lg p-2">
            <div className="text-gray-400">Ready now</div>
            <div className="text-white font-semibold">{readyToLeaveCount}</div>
          </div>
          <div className="bg-surface-light rounded-lg p-2">
            <div className="text-gray-400">Best area</div>
            <div className="text-white font-semibold truncate">{topRun?.area || 'None'}</div>
          </div>
          <div className="bg-surface-light rounded-lg p-2">
            <div className="text-gray-400">Trip time</div>
            <div className="text-white font-semibold">{topRun ? `${topRun.totalMinutes} min` : '0 min'}</div>
          </div>
        </div>

        {topRun ? (
          <div className="rounded-lg border border-cyan-500/30 bg-cyan-500/10 p-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 text-cyan-300 text-xs uppercase tracking-wide font-medium">
                  <Car className="w-3.5 h-3.5" />
                  Best next run
                </div>
                <div className="text-white font-semibold mt-1">{topRun.area}</div>
                <div className="text-xs text-cyan-100 mt-1">
                  {topRun.errands.length} stops, {topRun.totalMinutes} min, {topRun.dueTodayCount} due today
                </div>
              </div>
              <div className="text-right text-xs text-cyan-100">
                <div>Score {topRun.score}</div>
                <div>{topRun.highPriorityCount} high priority</div>
              </div>
            </div>
          </div>
        ) : (
          <div className="rounded-lg border border-green-500/30 bg-green-500/10 p-3 text-sm text-green-300 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            No pending errands. Nice.
          </div>
        )}

        <div className="space-y-2">
          {groupedRuns.map((group) => (
            <div key={group.area} className="rounded-lg border border-border bg-surface-light p-3">
              <div className="flex items-center justify-between gap-3 mb-2">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 text-sm text-white font-medium">
                    <MapPin className="w-4 h-4 text-gray-400" />
                    <span className="truncate">{group.area}</span>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">{group.errands.length} errands grouped together</div>
                </div>
                <div className="flex items-center gap-3 text-xs text-gray-400 shrink-0">
                  <span className="flex items-center gap-1"><Timer className="w-3 h-3" />{group.totalMinutes}m</span>
                  <span>{group.dueTodayCount} today</span>
                </div>
              </div>

              <div className="space-y-2">
                {group.errands.map((errand) => (
                  <div key={errand.id} className="flex items-start gap-2 rounded-lg border border-border/70 bg-surface px-2.5 py-2">
                    <button
                      onClick={() => toggleErrand(errand.id)}
                      className={`mt-0.5 h-4 w-4 rounded-full border ${errand.status === 'done' ? 'bg-green-500 border-green-500' : 'border-gray-500 hover:border-green-400'}`}
                      aria-label={`Mark ${errand.title} complete`}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm text-white truncate">{errand.title}</div>
                      <div className="flex flex-wrap items-center gap-2 mt-1 text-[11px] text-gray-400">
                        <span>{errand.category}</span>
                        <span>•</span>
                        <span>{errand.estimatedMinutes} min</span>
                        <span>•</span>
                        <span>{errand.dueWindow}</span>
                        <span className={`px-1.5 py-0.5 rounded border ${badgeClasses[errand.priority]}`}>{errand.priority}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => deleteErrand(errand.id)}
                      className="text-gray-500 hover:text-red-400"
                      aria-label={`Delete ${errand.title}`}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="rounded-lg border border-border bg-surface-light p-3 space-y-3">
          <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-gray-400 font-medium">
            <Plus className="w-3.5 h-3.5" />
            Add errand
          </div>
          <input
            value={draft.title}
            onChange={(e) => setDraft((current) => ({ ...current, title: e.target.value }))}
            placeholder="Pick up tailoring, bank deposit, grocery run..."
            className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm"
          />
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
            <input
              value={draft.area}
              onChange={(e) => setDraft((current) => ({ ...current, area: e.target.value }))}
              className="rounded-lg border border-border bg-surface px-3 py-2 text-sm"
              placeholder="Area"
            />
            <input
              value={draft.category}
              onChange={(e) => setDraft((current) => ({ ...current, category: e.target.value }))}
              className="rounded-lg border border-border bg-surface px-3 py-2 text-sm"
              placeholder="Category"
            />
            <select
              value={draft.priority}
              onChange={(e) => setDraft((current) => ({ ...current, priority: e.target.value as ErrandPriority }))}
              className="rounded-lg border border-border bg-surface px-3 py-2 text-sm"
            >
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
            <select
              value={draft.dueWindow}
              onChange={(e) => setDraft((current) => ({ ...current, dueWindow: e.target.value as DueWindow }))}
              className="rounded-lg border border-border bg-surface px-3 py-2 text-sm"
            >
              <option value="today">Today</option>
              <option value="this-week">This week</option>
              <option value="flexible">Flexible</option>
            </select>
            <input
              type="number"
              min="5"
              step="5"
              value={draft.estimatedMinutes}
              onChange={(e) => setDraft((current) => ({ ...current, estimatedMinutes: e.target.value }))}
              className="rounded-lg border border-border bg-surface px-3 py-2 text-sm"
              placeholder="Minutes"
            />
          </div>
          <button
            onClick={addErrand}
            className="w-full rounded-lg bg-cyan-500/20 text-cyan-300 hover:bg-cyan-500/30 px-3 py-2 text-sm font-medium"
          >
            Add to optimizer
          </button>
        </div>
      </div>
    </div>
  );
}
