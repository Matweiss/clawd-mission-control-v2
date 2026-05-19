import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  Calendar,
  CheckCircle2,
  Circle,
  ExternalLink,
  Filter,
  KanbanSquare,
  LayoutGrid,
  List,
  Loader2,
  RefreshCw,
  Search,
  User,
} from 'lucide-react';

interface Task {
  id: string;
  identifier?: string | null;
  title: string;
  status: 'pending' | 'in_progress' | 'blocked' | 'completed';
  rawStatus?: string;
  priority: 'low' | 'medium' | 'high';
  dueDate?: string | null;
  assignee?: string | null;
  assigneeAgentId?: string | null;
  project?: string | null;
  description?: string | null;
  url?: string | null;
  updatedAt?: string | null;
  createdAt?: string | null;
  lastActivityAt?: string | null;
}

type BoardView = 'kanban' | 'compact';
type PriorityFilter = 'all' | Task['priority'];
type AssigneeFilter = 'all' | 'unassigned' | string;
type SortMode = 'priority' | 'due' | 'newest';

const COLUMNS: Array<{ id: Task['status']; label: string; color: string; helper: string }> = [
  { id: 'pending', label: 'To Do', color: 'bg-gray-500/20 text-gray-200', helper: 'Queued Paperclip work' },
  { id: 'in_progress', label: 'In Progress', color: 'bg-blue-500/20 text-blue-200', helper: 'Currently owned' },
  { id: 'blocked', label: 'Blocked', color: 'bg-red-500/20 text-red-200', helper: 'Waiting on a decision or unblock' },
  { id: 'completed', label: 'Done', color: 'bg-green-500/20 text-green-200', helper: 'Recently completed' },
];

const PRIORITY_STYLES: Record<Task['priority'], string> = {
  high: 'text-red-300 bg-red-500/10 border-red-500/20',
  medium: 'text-yellow-300 bg-yellow-500/10 border-yellow-500/20',
  low: 'text-green-300 bg-green-500/10 border-green-500/20',
};

const PRIORITY_RANK: Record<Task['priority'], number> = {
  high: 0,
  medium: 1,
  low: 2,
};

function formatDate(dateStr?: string | null) {
  if (!dateStr) return null;
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return dateStr;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function dueTimestamp(dateStr?: string | null) {
  if (!dateStr) return Number.POSITIVE_INFINITY;
  const time = new Date(dateStr).getTime();
  return Number.isNaN(time) ? Number.POSITIVE_INFINITY : time;
}

function taskUrl(task: Task) {
  if (task.url) return task.url;
  return `https://paperclip.thematweiss.com/issues/${task.identifier || task.id}`;
}

function sortTasks(tasks: Task[], sortMode: SortMode) {
  return [...tasks].sort((a, b) => {
    if (sortMode === 'priority') {
      return PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority] || dueTimestamp(a.dueDate) - dueTimestamp(b.dueDate);
    }
    if (sortMode === 'due') {
      return dueTimestamp(a.dueDate) - dueTimestamp(b.dueDate) || PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority];
    }
    return String(b.id).localeCompare(String(a.id));
  });
}

export function TaskBoardView() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [view, setView] = useState<BoardView>('kanban');
  const [query, setQuery] = useState('');
  const [priorityFilter, setPriorityFilter] = useState<PriorityFilter>('all');
  const [assigneeFilter, setAssigneeFilter] = useState<AssigneeFilter>('all');
  const [sortMode, setSortMode] = useState<SortMode>('priority');
  const [hideCompleted, setHideCompleted] = useState(false);

  const loadTasks = useCallback(async (mode: 'initial' | 'refresh' = 'initial') => {
    if (mode === 'initial') setLoading(true);
    if (mode === 'refresh') setRefreshing(true);
    setError(null);

    try {
      const res = await fetch('/api/tasks');
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || `Task API returned ${res.status}`);
      setTasks(Array.isArray(data.tasks) ? data.tasks : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load Paperclip tasks');
      setTasks([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadTasks('initial');
  }, [loadTasks]);

  const assignees = useMemo(() => {
    return Array.from(new Set(tasks.map((task) => task.assignee).filter(Boolean) as string[])).sort();
  }, [tasks]);

  const filteredTasks = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    const visible = tasks.filter((task) => {
      if (hideCompleted && task.status === 'completed') return false;
      if (priorityFilter !== 'all' && task.priority !== priorityFilter) return false;
      if (assigneeFilter === 'unassigned' && task.assignee) return false;
      if (assigneeFilter !== 'all' && assigneeFilter !== 'unassigned' && task.assignee !== assigneeFilter) return false;
      if (!normalizedQuery) return true;

      const searchable = [task.title, task.identifier, task.description, task.assignee, task.project]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return searchable.includes(normalizedQuery);
    });

    return sortTasks(visible, sortMode);
  }, [assigneeFilter, hideCompleted, priorityFilter, query, sortMode, tasks]);

  const counts = useMemo(() => {
    return COLUMNS.reduce<Record<Task['status'], number>>((acc, column) => {
      acc[column.id] = filteredTasks.filter((task) => task.status === column.id).length;
      return acc;
    }, { pending: 0, in_progress: 0, blocked: 0, completed: 0 });
  }, [filteredTasks]);

  const attentionCounts = useMemo(() => {
    const active = tasks.filter((task) => task.status !== 'completed');
    return {
      blocked: active.filter((task) => task.status === 'blocked').length,
      high: active.filter((task) => task.priority === 'high').length,
      unassignedHigh: active.filter((task) => task.priority === 'high' && !task.assignee).length,
    };
  }, [tasks]);

  const activeFilterCount = [query.trim(), priorityFilter !== 'all', assigneeFilter !== 'all', hideCompleted].filter(Boolean).length;

  const resetFilters = () => {
    setQuery('');
    setPriorityFilter('all');
    setAssigneeFilter('all');
    setHideCompleted(false);
  };

  return (
    <div className="p-6">
      <div className="flex flex-col gap-4 mb-6 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-white">Task Board</h1>
            <span className="rounded-full border border-orange-400/20 bg-orange-400/10 px-2.5 py-1 text-xs text-orange-300">
              Live Paperclip
            </span>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            Real agent work from Paperclip — with filters, views, and no fallback demo tasks.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex rounded-lg border border-white/10 bg-white/[0.04] p-1">
            <button
              onClick={() => setView('kanban')}
              className={`flex items-center gap-2 rounded-md px-3 py-1.5 text-sm transition-colors ${view === 'kanban' ? 'bg-orange-500/20 text-orange-200' : 'text-gray-400 hover:text-white'}`}
            >
              <LayoutGrid className="h-4 w-4" />
              Kanban
            </button>
            <button
              onClick={() => setView('compact')}
              className={`flex items-center gap-2 rounded-md px-3 py-1.5 text-sm transition-colors ${view === 'compact' ? 'bg-orange-500/20 text-orange-200' : 'text-gray-400 hover:text-white'}`}
            >
              <List className="h-4 w-4" />
              List
            </button>
          </div>

          <button
            onClick={() => loadTasks('refresh')}
            disabled={refreshing || loading}
            className="flex items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/[0.04] px-4 py-2 text-sm text-gray-200 transition-colors hover:bg-white/[0.08] disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {!loading && !error && tasks.length > 0 && (
        <div className="mb-4 grid gap-3 sm:grid-cols-3">
          <AttentionTile
            tone="red"
            label="Blocked"
            count={attentionCounts.blocked}
            helper={attentionCounts.blocked === 0 ? 'No blockers right now.' : 'Live blocked items need an unblock or decision.'}
            onClick={() => { setHideCompleted(true); setPriorityFilter('all'); }}
          />
          <AttentionTile
            tone="orange"
            label="High priority active"
            count={attentionCounts.high}
            helper={attentionCounts.high === 0 ? 'No high-priority active work.' : 'High-priority work in flight or queued.'}
            onClick={() => { setHideCompleted(true); setPriorityFilter('high'); }}
          />
          <AttentionTile
            tone="yellow"
            label="High & unassigned"
            count={attentionCounts.unassignedHigh}
            helper={attentionCounts.unassignedHigh === 0 ? 'Every high-priority item has an owner.' : 'High priority work without an owner.'}
            onClick={() => { setHideCompleted(true); setPriorityFilter('high'); setAssigneeFilter('unassigned'); }}
          />
        </div>
      )}

      <div className="mb-5 rounded-xl border border-white/10 bg-[#161616] p-4">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search tasks, IDs, agents, projects…"
              className="w-full rounded-lg border border-white/10 bg-black/20 py-2 pl-9 pr-3 text-sm text-white outline-none transition-colors placeholder:text-gray-600 focus:border-orange-500/40"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Filter className="h-4 w-4 text-gray-500" />
            <select
              value={priorityFilter}
              onChange={(event) => setPriorityFilter(event.target.value as PriorityFilter)}
              className="rounded-lg border border-white/10 bg-[#101010] px-3 py-2 text-sm text-gray-200 outline-none focus:border-orange-500/40"
            >
              <option value="all">All priorities</option>
              <option value="high">High priority</option>
              <option value="medium">Medium priority</option>
              <option value="low">Low priority</option>
            </select>

            <select
              value={assigneeFilter}
              onChange={(event) => setAssigneeFilter(event.target.value as AssigneeFilter)}
              className="rounded-lg border border-white/10 bg-[#101010] px-3 py-2 text-sm text-gray-200 outline-none focus:border-orange-500/40"
            >
              <option value="all">All owners</option>
              <option value="unassigned">Unassigned</option>
              {assignees.map((assignee) => (
                <option key={assignee} value={assignee}>{assignee}</option>
              ))}
            </select>

            <select
              value={sortMode}
              onChange={(event) => setSortMode(event.target.value as SortMode)}
              className="rounded-lg border border-white/10 bg-[#101010] px-3 py-2 text-sm text-gray-200 outline-none focus:border-orange-500/40"
            >
              <option value="priority">Sort: priority</option>
              <option value="due">Sort: due date</option>
              <option value="newest">Sort: newest</option>
            </select>

            <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-gray-300">
              <input
                type="checkbox"
                checked={hideCompleted}
                onChange={(event) => setHideCompleted(event.target.checked)}
                className="accent-orange-500"
              />
              Hide done
            </label>

            {activeFilterCount > 0 && (
              <button onClick={resetFilters} className="rounded-lg px-3 py-2 text-sm text-orange-300 hover:bg-orange-500/10">
                Clear filters ({activeFilterCount})
              </button>
            )}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex min-h-[320px] items-center justify-center rounded-xl border border-white/10 bg-[#161616]">
          <div className="flex items-center gap-3 text-gray-400">
            <Loader2 className="h-5 w-5 animate-spin" />
            Loading Paperclip tasks…
          </div>
        </div>
      ) : error ? (
        <div className="rounded-xl border border-yellow-500/20 bg-yellow-500/10 p-5 text-yellow-100">
          <div className="flex items-start gap-3">
            <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0" />
            <div>
              <p className="font-medium">Paperclip needs reconnect</p>
              <p className="mt-1 text-sm text-yellow-100/80">{error}</p>
              <p className="mt-3 text-xs text-yellow-100/60">
                Once the API key is fixed, hit refresh. The board is ready and intentionally does not fall back to fake data.
              </p>
            </div>
          </div>
        </div>
      ) : view === 'kanban' ? (
        <KanbanBoard tasks={filteredTasks} counts={counts} onSelectTask={setSelectedTask} />
      ) : (
        <CompactList tasks={filteredTasks} onSelectTask={setSelectedTask} />
      )}

      {!loading && !error && tasks.length > 0 && filteredTasks.length === 0 && (
        <div className="mt-4 rounded-xl border border-white/10 bg-white/[0.03] p-5 text-sm text-gray-400">
          No tasks match the current filters.
        </div>
      )}

      {!loading && !error && tasks.length === 0 && (
        <div className="mt-4 rounded-xl border border-white/10 bg-white/[0.03] p-5 text-sm text-gray-400">
          Paperclip returned zero active tasks. That’s a clean state, not demo data.
        </div>
      )}

      {selectedTask && <TaskDetailModal task={selectedTask} onClose={() => setSelectedTask(null)} />}
    </div>
  );
}

function KanbanBoard({ tasks, counts, onSelectTask }: { tasks: Task[]; counts: Record<Task['status'], number>; onSelectTask: (task: Task) => void }) {
  return (
    <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-4">
      {COLUMNS.map((column) => {
        const columnTasks = tasks.filter((task) => task.status === column.id);
        return (
          <div key={column.id} className="rounded-xl bg-[#161616] p-4 border border-white/5">
            <div className={`mb-4 rounded-lg px-3 py-2 ${column.color}`}>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">{column.label}</span>
                <span className="text-xs opacity-75">{counts[column.id]}</span>
              </div>
              <p className="mt-1 text-xs opacity-60">{column.helper}</p>
            </div>

            <div className="space-y-3">
              {columnTasks.length === 0 ? (
                <div className="rounded-lg border border-dashed border-white/10 p-4 text-center text-sm text-gray-500">
                  Nothing here right now.
                </div>
              ) : (
                columnTasks.map((task) => <TaskCard key={task.id} task={task} onSelectTask={onSelectTask} />)
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function CompactList({ tasks, onSelectTask }: { tasks: Task[]; onSelectTask: (task: Task) => void }) {
  if (tasks.length === 0) return null;

  return (
    <div className="overflow-hidden rounded-xl border border-white/10 bg-[#161616]">
      <div className="grid grid-cols-[1.2fr_110px_140px_130px_100px] gap-3 border-b border-white/10 px-4 py-3 text-xs font-medium uppercase tracking-wide text-gray-500">
        <span>Task</span>
        <span>Priority</span>
        <span>Owner</span>
        <span>Due</span>
        <span>Status</span>
      </div>
      {tasks.map((task) => (
        <button
          key={task.id}
          onClick={() => onSelectTask(task)}
          className="grid w-full grid-cols-[1.2fr_110px_140px_130px_100px] gap-3 border-b border-white/5 px-4 py-3 text-left transition-colors last:border-b-0 hover:bg-white/[0.04]"
        >
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <StatusIcon status={task.status} />
              <span className="truncate text-sm font-medium text-white">{task.title}</span>
            </div>
            <p className="mt-1 truncate text-xs text-gray-500">{task.identifier || task.project || task.description || 'Paperclip task'}</p>
          </div>
          <span className={`w-fit self-center rounded border px-2 py-0.5 text-xs ${PRIORITY_STYLES[task.priority]}`}>{task.priority}</span>
          <span className="self-center truncate text-sm text-gray-300">{task.assignee || 'Unassigned'}</span>
          <span className="self-center text-sm text-gray-400">{formatDate(task.dueDate) || '—'}</span>
          <span className="self-center text-sm capitalize text-gray-300">{task.status.replace('_', ' ')}</span>
        </button>
      ))}
    </div>
  );
}

function TaskCard({ task, onSelectTask }: { task: Task; onSelectTask: (task: Task) => void }) {
  return (
    <button
      onClick={() => onSelectTask(task)}
      className="w-full rounded-lg bg-[#1A1A1A] p-3 text-left transition-colors hover:bg-[#242424] focus:outline-none focus:ring-1 focus:ring-orange-500/50"
    >
      <div className="flex items-start gap-2">
        <StatusIcon status={task.status} />
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <p className={`text-sm font-medium ${task.status === 'completed' ? 'text-gray-500 line-through' : 'text-white'}`}>
              {task.title}
            </p>
            {task.identifier && <span className="text-[10px] text-gray-500">{task.identifier}</span>}
          </div>

          {task.description && (
            <p className="mt-1 line-clamp-2 text-xs text-gray-500">{task.description}</p>
          )}

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className={`rounded border px-2 py-0.5 text-xs ${PRIORITY_STYLES[task.priority]}`}>
              {task.priority}
            </span>
            {formatDate(task.dueDate) && (
              <span className="flex items-center gap-1 text-xs text-gray-500">
                <Calendar className="h-3 w-3" />
                {formatDate(task.dueDate)}
              </span>
            )}
            {task.assignee && (
              <span className="flex items-center gap-1 text-xs text-gray-500">
                <User className="h-3 w-3" />
                {task.assignee}
              </span>
            )}
          </div>
        </div>
      </div>
    </button>
  );
}

function StatusIcon({ status }: { status: Task['status'] }) {
  if (status === 'completed') return <CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0 text-green-400" />;
  if (status === 'in_progress') return <KanbanSquare className="mt-0.5 h-5 w-5 flex-shrink-0 text-blue-400" />;
  if (status === 'blocked') return <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-400" />;
  return <Circle className="mt-0.5 h-5 w-5 flex-shrink-0 text-gray-500" />;
}

function AttentionTile({
  tone,
  label,
  count,
  helper,
  onClick,
}: {
  tone: 'red' | 'orange' | 'yellow';
  label: string;
  count: number;
  helper: string;
  onClick: () => void;
}) {
  const toneClasses: Record<'red' | 'orange' | 'yellow', string> = {
    red: 'border-red-500/30 bg-red-500/10 text-red-200',
    orange: 'border-orange-500/30 bg-orange-500/10 text-orange-200',
    yellow: 'border-yellow-500/30 bg-yellow-500/10 text-yellow-200',
  };
  return (
    <button
      onClick={onClick}
      className={`flex w-full items-start justify-between rounded-xl border ${toneClasses[tone]} px-4 py-3 text-left transition-colors hover:brightness-110`}
    >
      <div>
        <div className="text-xs uppercase tracking-wide opacity-70">{label}</div>
        <div className="mt-1 text-2xl font-bold font-mono">{count}</div>
        <div className="mt-1 text-xs opacity-70">{helper}</div>
      </div>
      <AlertCircle className="h-4 w-4 opacity-70" />
    </button>
  );
}

function TaskDetailModal({ task, onClose }: { task: Task; onClose: () => void }) {
  const dueDate = formatDate(task.dueDate);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-xl border border-white/10 bg-[#161616] p-6 shadow-2xl">
        <div className="mb-4 flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <StatusIcon status={task.status} />
            <div>
              <h2 className="text-xl font-bold text-white">{task.title}</h2>
              <p className="mt-1 text-sm text-gray-500">{task.identifier || task.id}</p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-lg p-2 text-gray-400 hover:bg-white/10 hover:text-white">
            ✕
          </button>
        </div>

        {task.description && <p className="mb-4 whitespace-pre-wrap text-sm text-gray-300">{task.description}</p>}

        <div className="grid grid-cols-2 gap-3">
          <InfoTile label="Priority">
            <span className={`rounded border px-2 py-1 text-xs ${PRIORITY_STYLES[task.priority]}`}>{task.priority}</span>
          </InfoTile>
          <InfoTile label="Status">
            <span className="text-sm capitalize text-white">{task.status.replace('_', ' ')}</span>
          </InfoTile>
          <InfoTile label="Assignee">
            <span className="text-sm text-white">{task.assignee || 'Unassigned'}</span>
          </InfoTile>
          <InfoTile label="Due Date">
            <span className="text-sm text-white">{dueDate || 'No due date'}</span>
          </InfoTile>
        </div>

        {task.project && (
          <div className="mt-3">
            <InfoTile label="Project">
              <span className="text-sm text-white">{task.project}</span>
            </InfoTile>
          </div>
        )}

        <a
          href={taskUrl(task)}
          target="_blank"
          rel="noreferrer"
          className="mt-5 flex items-center justify-center gap-2 rounded-lg bg-orange-500/20 px-4 py-2 text-sm text-orange-300 transition-colors hover:bg-orange-500/30"
        >
          Open in Paperclip
          <ExternalLink className="h-4 w-4" />
        </a>
      </div>
    </div>
  );
}

function InfoTile({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg bg-[#1A1A1A] p-3">
      <p className="mb-1 text-xs text-gray-500">{label}</p>
      {children}
    </div>
  );
}
