import React, { useState } from 'react';
import { X, Plus, Check, Clock, AlertCircle, Calendar, Trash2 } from 'lucide-react';

interface Task {
  id: string;
  title: string;
  priority: 'high' | 'medium' | 'low';
  status: 'pending' | 'in_progress' | 'completed';
  assignee?: string;
  dueDate?: string;
  description?: string;
}

interface TaskDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  tasks: Task[];
  onAddTask: (task: Omit<Task, 'id'>) => void;
  onUpdateTask: (id: string, updates: Partial<Task>) => void;
  onDeleteTask: (id: string) => void;
}

const PRIORITY_COLORS = {
  high: { text: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/30' },
  medium: { text: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/30' },
  low: { text: 'text-green-400', bg: 'bg-green-500/10', border: 'border-green-500/30' },
};

const STATUS_ICONS = {
  pending: Clock,
  in_progress: AlertCircle,
  completed: Check,
};

export function TaskDetailModal({ 
  isOpen, 
  onClose, 
  tasks, 
  onAddTask, 
  onUpdateTask, 
  onDeleteTask 
}: TaskDetailModalProps) {
  const [activeTab, setActiveTab] = useState<'all' | 'high' | 'medium' | 'low'>('all');
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTask, setNewTask] = useState({ title: '', priority: 'medium' as const, description: '' });

  if (!isOpen) return null;

  const filteredTasks = tasks.filter(task => 
    activeTab === 'all' || task.priority === activeTab
  );

  const pendingCount = tasks.filter(t => t.status !== 'completed').length;
  const completedCount = tasks.filter(t => t.status === 'completed').length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-surface border border-border rounded-xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-border flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold">Active Tasks</h2>
            <p className="text-sm text-gray-500">
              {pendingCount} pending • {completedCount} completed
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setShowAddForm(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-work/20 text-work rounded-lg hover:bg-work/30 text-sm"
            >
              <Plus className="w-4 h-4" />
              New Task
            </button>
            <button onClick={onClose} className="p-2 hover:bg-surface-light rounded-lg">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Add Task Form */}
        {showAddForm && (
          <div className="px-6 py-4 border-b border-border bg-surface-light">
            <div className="space-y-3">
              <input
                type="text"
                placeholder="Task title..."
                value={newTask.title}
                onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-sm"
                autoFocus
              />
              <div className="flex gap-2">
                <select
                  value={newTask.priority}
                  onChange={(e) => setNewTask({ ...newTask, priority: e.target.value as any })}
                  className="bg-surface border border-border rounded-lg px-3 py-2 text-sm"
                >
                  <option value="high">High Priority</option>
                  <option value="medium">Medium Priority</option>
                  <option value="low">Low Priority</option>
                </select>
                <input
                  type="text"
                  placeholder="Description (optional)"
                  value={newTask.description}
                  onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                  className="flex-1 bg-surface border border-border rounded-lg px-3 py-2 text-sm"
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    if (newTask.title.trim()) {
                      onAddTask({
                        title: newTask.title,
                        priority: newTask.priority,
                        status: 'pending',
                        description: newTask.description,
                      });
                      setNewTask({ title: '', priority: 'medium', description: '' });
                      setShowAddForm(false);
                    }
                  }}
                  className="px-4 py-2 bg-work text-white rounded-lg text-sm hover:bg-work/80"
                >
                  Add Task
                </button>
                <button
                  onClick={() => setShowAddForm(false)}
                  className="px-4 py-2 bg-surface border border-border rounded-lg text-sm hover:bg-surface-light"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Priority Tabs */}
        <div className="flex border-b border-border px-6">
          {[
            { id: 'all', label: 'All', count: tasks.length },
            { id: 'high', label: 'High', count: tasks.filter(t => t.priority === 'high').length },
            { id: 'medium', label: 'Medium', count: tasks.filter(t => t.priority === 'medium').length },
            { id: 'low', label: 'Low', count: tasks.filter(t => t.priority === 'low').length },
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

        {/* Task List */}
        <div className="flex-1 overflow-y-auto p-6">
          {filteredTasks.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <p>No tasks in this category</p>
              <button 
                onClick={() => setShowAddForm(true)}
                className="mt-2 text-work hover:underline text-sm"
              >
                Create your first task
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredTasks.map(task => {
                const colors = PRIORITY_COLORS[task.priority];
                const StatusIcon = STATUS_ICONS[task.status];
                
                return (
                  <div 
                    key={task.id}
                    className={`p-4 rounded-lg border ${colors.border} ${colors.bg} group hover:border-opacity-50 transition-all`}
                  >
                    <div className="flex items-start gap-3">
                      <button
                        onClick={() => onUpdateTask(task.id, { 
                          status: task.status === 'completed' ? 'pending' : 'completed' 
                        })}
                        className={`mt-0.5 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                          task.status === 'completed' 
                            ? 'bg-green-500 border-green-500' 
                            : 'border-gray-500 hover:border-green-500'
                        }`}
                      >
                        {task.status === 'completed' && <Check className="w-3 h-3 text-white" />}
                      </button>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className={`font-medium ${task.status === 'completed' ? 'line-through text-gray-500' : ''}`}>
                            {task.title}
                          </h3>
                          <span className={`text-xs px-2 py-0.5 rounded bg-surface ${colors.text}`}>
                            {task.priority}
                          </span>
                        </div>
                        
                        {task.description && (
                          <p className="text-sm text-gray-400 mt-1">{task.description}</p>
                        )}
                        
                        <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                          <span className="flex items-center gap-1">
                            <StatusIcon className="w-3 h-3" />
                            {task.status.replace('_', ' ')}
                          </span>
                          {task.dueDate && (
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {new Date(task.dueDate).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </div>
                      
                      <button
                        onClick={() => onDeleteTask(task.id)}
                        className="p-1.5 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-border flex justify-between items-center">
          <span className="text-xs text-gray-500">
            {filteredTasks.length} tasks shown
          </span>
          <button 
            onClick={() => {
              tasks.filter(t => t.status === 'completed').forEach(t => onDeleteTask(t.id));
            }}
            className="text-xs text-gray-500 hover:text-red-400"
          >
            Clear completed
          </button>
        </div>
      </div>
    </div>
  );
}
