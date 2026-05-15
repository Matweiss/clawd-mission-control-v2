import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  Calendar,
  CheckCircle2,
  Circle,
  ExternalLink,
  Loader2,
  RefreshCw,
  User,
} from 'lucide-react';

interface Task {
  id: string;
  identifier?: string | null;
  title: string;
  status: 'pending' | 'in_progress' | 'completed';
  priority: 'low' | 'medium' | 'high';
  dueDate?: string | null;
  assignee?: string | null;
  project?: string | null;
  description?: string | null;
}

const COLUMNS: Array<{ id: Task['status']; label: string; color: string; helper: string }> = [
  { id: 'pending', label: 'To Do', color: 'bg-gray-500/20 text-gray-200', helper: 'Queued Paperclip work' },
  { id: 'in_progress', label: 'In Progress', color: 'bg-blue-500/20 text-blue-200', helper: 'Currently owned' },
  { id: 'completed', label: 'Done', color: 'bg-green-500/20 text-green-200', helper: 'Recently completed' },
];

const PRIORITY_STYLES: Record<Task['priority'], string> = {
  high: 'text-red-300 bg-red-500/10 border-red-500/20',
  medium: 'text-yellow-300 bg-yellow-500/10 border-yellow-500/20',
  low: 'text-green-300 bg-green-500/10 border-green-500/20',
};

function formatDate(dateStr?: string | null) {
  if (!dateStr) return null;
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return dateStr;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function taskUrl(task: Task) {
  return `https://paperclip.thematweiss.com/issues/${task.identifier || task.id}`;
}

export function TaskBoardView() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

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

  const counts = useMemo(() => {
    return COLUMNS.reduce<Record<Task['status'], number>>((acc, column) => {
      acc[column.id] = tasks.filter((task) => task.status === column.id).length;
      return acc;
    }, { pending: 0, in_progress: 0, completed: 0 });
  }, [tasks]);

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
            Real agent work from Paperclip — no demo tasks, no local-only edits.
          </p>
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

      {loading ? (
        <div className="flex min-h-[320px] items-center justify-center rounded-xl border border-white/10 bg-[#161616]">
          <div className="flex items-center gap-3 text-gray-400">
            <Loader2 className="h-5 w-5 animate-spin" />
            Loading Paperclip tasks…
          </div>
        </div>
      ) : error ? (
        <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-5 text-red-200">
          <div className="flex items-start gap-3">
            <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0" />
            <div>
              <p className="font-medium">Couldn’t load Paperclip tasks</p>
              <p className="mt-1 text-sm text-red-200/80">{error}</p>
              <p className="mt-3 text-xs text-red-200/60">
                Check Paperclip env/auth, then refresh. The board intentionally does not fall back to fake data.
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-3">
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
                    columnTasks.map((task) => (
                      <button
                        key={task.id}
                        onClick={() => setSelectedTask(task)}
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
                    ))
                  )}
                </div>
              </div>
            );
          })}
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

function StatusIcon({ status }: { status: Task['status'] }) {
  if (status === 'completed') return <CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0 text-green-400" />;
  if (status === 'in_progress') return <Circle className="mt-0.5 h-5 w-5 flex-shrink-0 text-blue-400" />;
  return <Circle className="mt-0.5 h-5 w-5 flex-shrink-0 text-gray-500" />;
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
