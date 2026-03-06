import React, { useState } from 'react';
import { 
  MoreHorizontal, Calendar, Flag, Clock, CheckCircle2, Circle, 
  AlertCircle, Plus, X, Edit2, Trash2, ChevronDown, User
} from 'lucide-react';

interface Task {
  id: string;
  title: string;
  status: 'todo' | 'in_progress' | 'done';
  priority: 'low' | 'medium' | 'high';
  dueDate: string;
  assignee: string;
  project: string;
  description?: string;
  createdAt: string;
}

const COLUMNS = [
  { id: 'todo', label: 'To Do', color: 'bg-gray-500/20' },
  { id: 'in_progress', label: 'In Progress', color: 'bg-blue-500/20' },
  { id: 'done', label: 'Done', color: 'bg-green-500/20' },
];

const ASSIGNEES = ['Mat', 'Work Agent', 'Build Agent', 'Lifestyle Agent', 'Research Agent', 'HubSpot Agent'];
const PROJECTS = ['Sales', 'Infrastructure', 'Lifestyle', 'Research', 'Mission Control'];

export function TaskBoardView() {
  const [tasks, setTasks] = useState<Task[]>([
    { 
      id: '1', 
      title: 'Review Dragon Technologies proposal', 
      status: 'todo', 
      priority: 'high', 
      dueDate: '2026-03-05', 
      assignee: 'Mat', 
      project: 'Sales',
      description: 'Review the $240K ARR proposal before the call',
      createdAt: '2026-03-04'
    },
    { 
      id: '2', 
      title: 'Fix HubSpot token refresh', 
      status: 'in_progress', 
      priority: 'high', 
      dueDate: '2026-03-05', 
      assignee: 'Build Agent', 
      project: 'Infrastructure',
      description: 'OAuth token expiring, needs auto-refresh logic',
      createdAt: '2026-03-04'
    },
    { 
      id: '3', 
      title: 'Morning meditation', 
      status: 'done', 
      priority: 'medium', 
      dueDate: '2026-03-04', 
      assignee: 'Mat', 
      project: 'Lifestyle',
      createdAt: '2026-03-04'
    },
    { 
      id: '4', 
      title: 'Call Sarah about Vertex contract', 
      status: 'todo', 
      priority: 'high', 
      dueDate: '2026-03-06', 
      assignee: 'Mat', 
      project: 'Sales',
      description: 'Discuss liability cap and IP indemnification',
      createdAt: '2026-03-04'
    },
    { 
      id: '5', 
      title: 'Update CLAWD Prime SOUL', 
      status: 'in_progress', 
      priority: 'medium', 
      dueDate: '2026-03-07', 
      assignee: 'Mat', 
      project: 'Mission Control',
      createdAt: '2026-03-04'
    },
  ]);

  const [showAddModal, setShowAddModal] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [viewingTask, setViewingTask] = useState<Task | null>(null);

  // Add new task
  const addTask = (task: Omit<Task, 'id' | 'createdAt'>) => {
    const newTask: Task = {
      ...task,
      id: Date.now().toString(),
      createdAt: new Date().toISOString().split('T')[0],
    };
    setTasks([...tasks, newTask]);
    setShowAddModal(false);
  };

  // Edit task
  const editTask = (id: string, updates: Partial<Task>) => {
    setTasks(tasks.map(t => t.id === id ? { ...t, ...updates } : t));
    setEditingTask(null);
  };

  // Delete task
  const deleteTask = (id: string) => {
    setTasks(tasks.filter(t => t.id !== id));
  };

  // Toggle task status
  const toggleTaskStatus = (taskId: string) => {
    setTasks(tasks.map(task => {
      if (task.id !== taskId) return task;
      const statusFlow: any = { todo: 'in_progress', in_progress: 'done', done: 'todo' };
      return { ...task, status: statusFlow[task.status] };
    }));
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-400 bg-red-500/10';
      case 'medium': return 'text-yellow-400 bg-yellow-500/10';
      case 'low': return 'text-green-400 bg-green-500/10';
      default: return 'text-gray-400 bg-gray-500/10';
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Task Board</h1>
          <p className="text-sm text-gray-500 mt-1">Manage tasks across all projects and agents</p>
        </div>
        
        <button 
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-orange-500/20 text-orange-400 rounded-lg text-sm hover:bg-orange-500/30 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Task
        </button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {COLUMNS.map((column) => (
          <div key={column.id} className="bg-[#161616] rounded-xl p-4">
            <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${column.color} mb-4`}>
              <span className="font-medium text-sm">{column.label}</span>
              <span className="text-xs text-gray-400">
                ({tasks.filter(t => t.status === column.id).length})
              </span>
            </div>

            <div className="space-y-3">
              {tasks
                .filter((task) => task.status === column.id)
                .map((task) => (
                  <div 
                    key={task.id}
                    className="bg-[#1A1A1A] rounded-lg p-3 hover:bg-[#2A2A2A] transition-colors group relative"
                  >
                    {/* Actions Menu */}
                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                      <button 
                        onClick={(e) => { e.stopPropagation(); setEditingTask(task); }}
                        className="p-1 hover:bg-[#3A3A3A] rounded"
                      >
                        <Edit2 className="w-3 h-3 text-gray-400" />
                      </button>
                      <button 
                        onClick={(e) => { e.stopPropagation(); deleteTask(task.id); }}
                        className="p-1 hover:bg-[#3A3A3A] rounded"
                      >
                        <Trash2 className="w-3 h-3 text-red-400" />
                      </button>
                    </div>

                    <div className="flex items-start gap-2">
                      <button 
                        onClick={() => toggleTaskStatus(task.id)}
                        className="mt-0.5 flex-shrink-0"
                      >
                        {task.status === 'done' ? (
                          <CheckCircle2 className="w-5 h-5 text-green-400" />
                        ) : task.status === 'in_progress' ? (
                          <Circle className="w-5 h-5 text-blue-400" />
                        ) : (
                          <Circle className="w-5 h-5 text-gray-500 hover:text-gray-400" />
                        )}
                      </button>
                      
                      <div className="flex-1 min-w-0"
                        onClick={() => setViewingTask(task)}
                      >
                        <p className={`text-sm font-medium cursor-pointer ${
                          task.status === 'done' ? 'text-gray-500 line-through' : 'text-white'
                        }`}>
                          {task.title}
                        </p>
                        
                        {task.description && (
                          <p className="text-xs text-gray-500 mt-1 line-clamp-2">{task.description}</p>
                        )}
                        
                        <div className="flex items-center gap-2 mt-2 flex-wrap">
                          <span className={`text-xs px-2 py-0.5 rounded ${getPriorityColor(task.priority)}`}>
                            {task.priority}
                          </span>
                          
                          <span className="text-xs text-gray-500 flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {formatDate(task.dueDate)}
                          </span>
                          
                          <span className="text-xs text-gray-500">
                            {task.project}
                          </span>
                        </div>

                        <div className="flex items-center justify-between mt-3">
                          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-[10px] font-bold text-white">
                            {task.assignee.charAt(0)}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              
              
              {/* Add task placeholder */}
              <button 
                onClick={() => setShowAddModal(true)}
                className="w-full py-2 border border-dashed border-[#2A2A2A] rounded-lg text-sm text-gray-500 hover:text-gray-300 hover:border-gray-500 transition-colors"
              >
                + Add task
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add/Edit Task Modal */}
      {(showAddModal || editingTask) && (
        <TaskModal
          task={editingTask}
          onClose={() => { setShowAddModal(false); setEditingTask(null); }}
          onSave={editingTask ? 
            (updates) => editTask(editingTask.id, updates) : 
            addTask
          }
        />
      )}

      {/* View Task Modal */}
      {viewingTask && (
        <ViewTaskModal
          task={viewingTask}
          onClose={() => setViewingTask(null)}
          onEdit={() => { setViewingTask(null); setEditingTask(viewingTask); }}
          onToggle={() => toggleTaskStatus(viewingTask.id)}
        />
      )}
    </div>
  );
}

// Task Modal Component
function TaskModal({ task, onClose, onSave }: { 
  task: Task | null; 
  onClose: () => void; 
  onSave: (task: any) => void;
}) {
  const [form, setForm] = useState({
    title: task?.title || '',
    description: task?.description || '',
    priority: task?.priority || 'medium',
    status: task?.status || 'todo',
    dueDate: task?.dueDate || new Date().toISOString().split('T')[0],
    assignee: task?.assignee || 'Mat',
    project: task?.project || 'Mission Control',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    onSave(form);
  };

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
      <div className="bg-[#161616] rounded-xl max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-white">{task ? 'Edit Task' : 'Add Task'}</h2>
          <button onClick={onClose} className="p-1 hover:bg-[#2A2A2A] rounded">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm text-gray-400 mb-1 block">Title</label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="w-full px-3 py-2 bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg text-white focus:outline-none focus:border-orange-500"
              placeholder="What needs to be done?"
              autoFocus
            />
          </div>

          <div>
            <label className="text-sm text-gray-400 mb-1 block">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full px-3 py-2 bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg text-white focus:outline-none focus:border-orange-500 h-20 resize-none"
              placeholder="Add more details..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-gray-400 mb-1 block">Priority</label>
              <select
                value={form.priority}
                onChange={(e) => setForm({ ...form, priority: e.target.value as any })}
                className="w-full px-3 py-2 bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg text-white focus:outline-none focus:border-orange-500"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>

            <div>
              <label className="text-sm text-gray-400 mb-1 block">Status</label>
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value as any })}
                className="w-full px-3 py-2 bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg text-white focus:outline-none focus:border-orange-500"
              >
                <option value="todo">To Do</option>
                <option value="in_progress">In Progress</option>
                <option value="done">Done</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-gray-400 mb-1 block">Due Date</label>
              <input
                type="date"
                value={form.dueDate}
                onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
                className="w-full px-3 py-2 bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg text-white focus:outline-none focus:border-orange-500"
              />
            </div>

            <div>
              <label className="text-sm text-gray-400 mb-1 block">Assignee</label>
              <select
                value={form.assignee}
                onChange={(e) => setForm({ ...form, assignee: e.target.value })}
                className="w-full px-3 py-2 bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg text-white focus:outline-none focus:border-orange-500"
              >
                {ASSIGNEES.map(a => <option key={a} value={a}>{a}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="text-sm text-gray-400 mb-1 block">Project</label>
            <select
              value={form.project}
              onChange={(e) => setForm({ ...form, project: e.target.value })}
              className="w-full px-3 py-2 bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg text-white focus:outline-none focus:border-orange-500"
            >
              {PROJECTS.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 bg-[#2A2A2A] text-gray-300 rounded-lg hover:bg-[#3A3A3A] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-2 bg-orange-500/20 text-orange-400 rounded-lg hover:bg-orange-500/30 transition-colors"
            >
              {task ? 'Save Changes' : 'Add Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// View Task Modal
function ViewTaskModal({ task, onClose, onEdit, onToggle }: {
  task: Task;
  onClose: () => void;
  onEdit: () => void;
  onToggle: () => void;
}) {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'done': return <CheckCircle2 className="w-6 h-6 text-green-400" />;
      case 'in_progress': return <Circle className="w-6 h-6 text-blue-400" />;
      default: return <Circle className="w-6 h-6 text-gray-500" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-400 bg-red-500/10';
      case 'medium': return 'text-yellow-400 bg-yellow-500/10';
      case 'low': return 'text-green-400 bg-green-500/10';
      default: return 'text-gray-400';
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
      <div className="bg-[#161616] rounded-xl max-w-lg w-full p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <button onClick={onToggle}>{getStatusIcon(task.status)}</button>
            <h2 className={`text-xl font-bold ${task.status === 'done' ? 'text-gray-500 line-through' : 'text-white'}`}>
              {task.title}
            </h2>
          </div>
          
          <div className="flex items-center gap-2">
            <button onClick={onEdit} className="p-2 hover:bg-[#2A2A2A] rounded-lg">
              <Edit2 className="w-4 h-4 text-gray-400" />
            </button>
            <button onClick={onClose} className="p-2 hover:bg-[#2A2A2A] rounded-lg">
              <X className="w-5 h-5 text-gray-400" />
            </button>
          </div>
        </div>

        {task.description && (
          <p className="text-gray-300 mb-4">{task.description}</p>
        )}

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="bg-[#1A1A1A] rounded-lg p-3">
            <p className="text-xs text-gray-500 mb-1">Priority</p>
            <span className={`text-sm px-2 py-1 rounded ${getPriorityColor(task.priority)}`}>
              {task.priority}
            </span>
          </div>

          <div className="bg-[#1A1A1A] rounded-lg p-3">
            <p className="text-xs text-gray-500 mb-1">Status</p>
            <span className="text-sm text-white capitalize">{task.status.replace('_', ' ')}</span>
          </div>

          <div className="bg-[#1A1A1A] rounded-lg p-3">
            <p className="text-xs text-gray-500 mb-1">Due Date</p>
            <span className="text-sm text-white flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              {new Date(task.dueDate).toLocaleDateString('en-US', { 
                weekday: 'short', month: 'short', day: 'numeric' 
              })}
            </span>
          </div>

          <div className="bg-[#1A1A1A] rounded-lg p-3">
            <p className="text-xs text-gray-500 mb-1">Assignee</p>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-xs font-bold text-white">
                {task.assignee.charAt(0)}
              </div>
              <span className="text-sm text-white">{task.assignee}</span>
            </div>
          </div>
        </div>

        <div className="bg-[#1A1A1A] rounded-lg p-3">
          <p className="text-xs text-gray-500 mb-1">Project</p>
          <span className="text-sm text-white">{task.project}</span>
        </div>
      </div>
    </div>
  );
}
