import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, Check, X, Edit2, Trash2, Calendar, Clock, 
  Tag, ChevronDown, ChevronUp, MoreHorizontal,
  Star, Archive, Filter, Search
} from 'lucide-react';
import { hapticFeedback } from '../../lib/ios-utils';

interface Task {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
  priority: 'low' | 'medium' | 'high';
  dueDate?: string;
  tags: string[];
  createdAt: string;
  completedAt?: string;
  archived: boolean;
  subtasks: Subtask[];
}

interface Subtask {
  id: string;
  title: string;
  completed: boolean;
}

const PRIORITY_COLORS = {
  low: 'bg-green-500/20 text-green-400',
  medium: 'bg-yellow-500/20 text-yellow-400',
  high: 'bg-red-500/20 text-red-400'
};

const PRIORITY_LABELS = {
  low: 'Low',
  medium: 'Medium',
  high: 'High'
};

export function MobileTasksTab() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [expandedTask, setExpandedTask] = useState<string | null>(null);

  // Load tasks from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('mission-control-tasks');
    if (saved) {
      try {
        setTasks(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to load tasks:', e);
      }
    }
  }, []);

  // Save tasks to localStorage
  useEffect(() => {
    localStorage.setItem('mission-control-tasks', JSON.stringify(tasks));
  }, [tasks]);

  const addTask = (taskData: Partial<Task>) => {
    hapticFeedback('success');
    const newTask: Task = {
      id: Date.now().toString(),
      title: taskData.title || 'New Task',
      description: taskData.description,
      completed: false,
      priority: taskData.priority || 'medium',
      dueDate: taskData.dueDate,
      tags: taskData.tags || [],
      createdAt: new Date().toISOString(),
      archived: false,
      subtasks: []
    };
    setTasks(prev => [newTask, ...prev]);
    setShowAddModal(false);
  };

  const updateTask = (id: string, updates: Partial<Task>) => {
    hapticFeedback('light');
    setTasks(prev => prev.map(t => 
      t.id === id ? { ...t, ...updates } : t
    ));
  };

  const deleteTask = (id: string) => {
    hapticFeedback('error');
    setTasks(prev => prev.filter(t => t.id !== id));
  };

  const toggleComplete = (id: string) => {
    hapticFeedback('medium');
    setTasks(prev => prev.map(t => 
      t.id === id 
        ? { ...t, completed: !t.completed, completedAt: !t.completed ? new Date().toISOString() : undefined }
        : t
    ));
  };

  const addSubtask = (taskId: string, title: string) => {
    const subtask: Subtask = {
      id: Date.now().toString(),
      title,
      completed: false
    };
    setTasks(prev => prev.map(t => 
      t.id === taskId 
        ? { ...t, subtasks: [...t.subtasks, subtask] }
        : t
    ));
  };

  const toggleSubtask = (taskId: string, subtaskId: string) => {
    setTasks(prev => prev.map(t => 
      t.id === taskId 
        ? { 
            ...t, 
            subtasks: t.subtasks.map(st => 
              st.id === subtaskId ? { ...st, completed: !st.completed } : st
            )
          }
        : t
    ));
  };

  const allTags = Array.from(new Set(tasks.flatMap(t => t.tags)));

  const filteredTasks = tasks
    .filter(t => !t.archived)
    .filter(t => {
      if (filter === 'active') return !t.completed;
      if (filter === 'completed') return t.completed;
      return true;
    })
    .filter(t => 
      searchQuery === '' || 
      t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.description?.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .filter(t => 
      selectedTag === null || t.tags.includes(selectedTag)
    )
    .sort((a, b) => {
      // Sort by completion, then priority, then due date
      if (a.completed !== b.completed) return a.completed ? 1 : -1;
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      }
      if (a.dueDate && b.dueDate) {
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      }
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

  const stats = {
    total: tasks.filter(t => !t.archived).length,
    completed: tasks.filter(t => t.completed && !t.archived).length,
    highPriority: tasks.filter(t => t.priority === 'high' && !t.completed && !t.archived).length
  };

  return (
    <div className="space-y-4"
    >
      {/* Stats */}
      <div className="grid grid-cols-3 gap-3"
      >
        <div className="bg-surface-light rounded-2xl p-3 text-center"
        >
          <p className="text-2xl font-bold"
          >{stats.total}</p
          >
          <p className="text-xs text-gray-500"
          >Total</p
          >
        </div>
        <div className="bg-surface-light rounded-2xl p-3 text-center"
        >
          <p className="text-2xl font-bold text-green-400"
          >{stats.completed}</p
          >
          <p className="text-xs text-gray-500"
          >Done</p
          >
        </div>
        <div className="bg-surface-light rounded-2xl p-3 text-center"
        >
          <p className="text-2xl font-bold text-red-400"
          >{stats.highPriority}</p
          >
          <p className="text-xs text-gray-500"
          >Urgent</p
          >
        </div>
      </div>

      {/* Search & Filter */}
      <div className="space-y-3"
      >
        <div className="relative"
        >
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            placeholder="Search tasks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-surface-light rounded-xl text-sm"
          />
        </div>

        <div className="flex gap-2 overflow-x-auto pb-2"
        >
          {(['all', 'active', 'completed'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap ${
                filter === f 
                  ? 'bg-work text-white' 
                  : 'bg-surface-light text-gray-400'
              }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>

        {allTags.length > 0 && (
          <div className="flex gap-2 overflow-x-auto pb-2"
          >
            <button
              onClick={() => setSelectedTag(null)}
              className={`px-3 py-1 rounded-lg text-xs whitespace-nowrap ${
                selectedTag === null 
                  ? 'bg-blue-500/20 text-blue-400' 
                  : 'bg-surface-light text-gray-500'
              }`}
            >
              All Tags
            </button>
            {allTags.map((tag) => (
              <button
                key={tag}
                onClick={() => setSelectedTag(tag === selectedTag ? null : tag)}
                className={`px-3 py-1 rounded-lg text-xs whitespace-nowrap ${
                  selectedTag === tag 
                    ? 'bg-blue-500/20 text-blue-400' 
                    : 'bg-surface-light text-gray-500'
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Add Task Button */}
      <motion.button
        onClick={() => setShowAddModal(true)}
        className="w-full py-4 bg-work rounded-2xl font-medium flex items-center justify-center gap-2"
        whileTap={{ scale: 0.98 }}
      >
        <Plus className="w-5 h-5" />
        Add New Task
      </motion.button>

      {/* Task List */}
      <div className="space-y-3"
      >
        <AnimatePresence>
          {filteredTasks.map((task) => (
            <motion.div
              key={task.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -100 }}
              className={`bg-surface-light rounded-2xl p-4 ${
                task.completed ? 'opacity-60' : ''
              }`}
            >
              <div className="flex items-start gap-3"
              >
                <button
                  onClick={() => toggleComplete(task.id)}
                  className={`mt-1 w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                    task.completed 
                      ? 'bg-green-500 border-green-500' 
                      : 'border-gray-500'
                  }`}
                >
                  {task.completed && <Check className="w-4 h-4 text-white" />}
                </button>

                <div className="flex-1"
                >
                  <div className="flex items-start justify-between"
                  >
                    <h3 className={`font-medium ${task.completed ? 'line-through text-gray-500' : ''}`}
                    >
                      {task.title}
                    </h3>
                    <div className="flex items-center gap-1"
                    >
                      <span className={`px-2 py-0.5 rounded text-xs ${PRIORITY_COLORS[task.priority]}`}
                      >
                        {PRIORITY_LABELS[task.priority]}
                      </span>
                    </div>
                  </div>

                  {task.description && (
                    <p className="text-sm text-gray-500 mt-1"
                    >{task.description}</p>
                  )}

                  <div className="flex items-center gap-3 mt-2 text-xs text-gray-500"
                  >
                    {task.dueDate && (
                      <span className="flex items-center gap-1"
                      >
                        <Calendar className="w-3 h-3" />
                        {new Date(task.dueDate).toLocaleDateString()}
                      </span>
                    )}
                    {task.tags.length > 0 && (
                      <span className="flex items-center gap-1"
                      >
                        <Tag className="w-3 h-3" />
                        {task.tags.join(', ')}
                      </span>
                    )}
                  </div>

                  {/* Subtasks */}
                  {task.subtasks.length > 0 && (
                    <div className="mt-3 space-y-2"
                    >
                      {task.subtasks.map((subtask) => (
                        <div 
                          key={subtask.id}
                          className="flex items-center gap-2"
                        >
                          <button
                            onClick={() => toggleSubtask(task.id, subtask.id)}
                            className={`w-4 h-4 rounded border flex items-center justify-center ${
                              subtask.completed 
                                ? 'bg-green-500 border-green-500' 
                                : 'border-gray-600'
                            }`}
                          >
                            {subtask.completed && <Check className="w-3 h-3 text-white" />}
                          </button>
                          <span className={`text-sm ${subtask.completed ? 'line-through text-gray-500' : ''}`}
                          >
                            {subtask.title}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex items-center gap-2 mt-3"
                  >
                    <button
                      onClick={() => setEditingTask(task)}
                      className="p-2 bg-surface rounded-lg"
                    >
                      <Edit2 className="w-4 h-4 text-gray-400" />
                    </button>
                    <button
                      onClick={() => deleteTask(task.id)}
                      className="p-2 bg-surface rounded-lg"
                    >
                      <Trash2 className="w-4 h-4 text-red-400" />
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {filteredTasks.length === 0 && (
          <div className="text-center py-12"
          >
            <Check className="w-12 h-12 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-500"
            >No tasks found</p
            >
            <p className="text-sm text-gray-600 mt-1"
            >Add a new task to get started</p
            >
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      <TaskModal
        isOpen={showAddModal || editingTask !== null}
        onClose={() => {
          setShowAddModal(false);
          setEditingTask(null);
        }}
        task={editingTask}
        onSave={(data) => {
          if (editingTask) {
            updateTask(editingTask.id, data);
            setEditingTask(null);
          } else {
            addTask(data);
          }
        }}
        onAddSubtask={editingTask ? (title) => addSubtask(editingTask.id, title) : undefined}
      />
    </div>
  );
}

// Task Modal Component
interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: Task | null;
  onSave: (data: Partial<Task>) => void;
  onAddSubtask?: (title: string) => void;
}

function TaskModal({ isOpen, onClose, task, onSave, onAddSubtask }: TaskModalProps) {
  const [title, setTitle] = useState(task?.title || '');
  const [description, setDescription] = useState(task?.description || '');
  const [priority, setPriority] = useState<Task['priority']>(task?.priority || 'medium');
  const [dueDate, setDueDate] = useState(task?.dueDate || '');
  const [tags, setTags] = useState(task?.tags.join(', ') || '');
  const [newSubtask, setNewSubtask] = useState('');

  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setDescription(task.description || '');
      setPriority(task.priority);
      setDueDate(task.dueDate || '');
      setTags(task.tags.join(', '));
    } else {
      setTitle('');
      setDescription('');
      setPriority('medium');
      setDueDate('');
      setTags('');
    }
  }, [task]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50"
    >
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, y: 100 }}
        animate={{ opacity: 1, y: 0 }}
        className="absolute bottom-0 left-0 right-0 bg-surface rounded-t-3xl p-6 max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between mb-6"
        >
          <h2 className="text-xl font-semibold"
          >{task ? 'Edit Task' : 'New Task'}</h2
          >
          <button onClick={onClose} className="p-2"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4"
        >
          <div>
            <label className="text-sm text-gray-500 mb-1 block"
            >Title</label
            >
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="What needs to be done?"
              className="w-full p-3 bg-surface-light rounded-xl"
            />
          </div>

          <div>
            <label className="text-sm text-gray-500 mb-1 block"
            >Description</label
            >
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add details..."
              rows={3}
              className="w-full p-3 bg-surface-light rounded-xl resize-none"
            />
          </div>

          <div>
            <label className="text-sm text-gray-500 mb-2 block"
            >Priority</label
            >
            <div className="flex gap-2"
            >
              {(['low', 'medium', 'high'] as const).map((p) => (
                <button
                  key={p}
                  onClick={() => setPriority(p)}
                  className={`flex-1 py-2 rounded-xl text-sm font-medium ${
                    priority === p 
                      ? PRIORITY_COLORS[p] 
                      : 'bg-surface-light text-gray-500'
                  }`}
                >
                  {PRIORITY_LABELS[p]}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-sm text-gray-500 mb-1 block"
            >Due Date</label
            >
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full p-3 bg-surface-light rounded-xl"
            />
          </div>

          <div>
            <label className="text-sm text-gray-500 mb-1 block"
            >Tags (comma separated)</label
            >
            <input
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="work, personal, urgent..."
              className="w-full p-3 bg-surface-light rounded-xl"
            />
          </div>

          {/* Subtasks */}
          {task && onAddSubtask && (
            <div>
              <label className="text-sm text-gray-500 mb-2 block"
              >Subtasks</label
              >
              <div className="flex gap-2"
              >
                <input
                  type="text"
                  value={newSubtask}
                  onChange={(e) => setNewSubtask(e.target.value)}
                  placeholder="Add subtask..."
                  className="flex-1 p-3 bg-surface-light rounded-xl"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && newSubtask.trim()) {
                      onAddSubtask(newSubtask.trim());
                      setNewSubtask('');
                    }
                  }}
                />
                <button
                  onClick={() => {
                    if (newSubtask.trim()) {
                      onAddSubtask(newSubtask.trim());
                      setNewSubtask('');
                    }
                  }}
                  className="p-3 bg-work rounded-xl"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}

          <button
            onClick={() => {
              onSave({
                title,
                description,
                priority,
                dueDate: dueDate || undefined,
                tags: tags.split(',').map(t => t.trim()).filter(Boolean)
              });
            }}
            disabled={!title.trim()}
            className="w-full py-4 bg-work rounded-2xl font-medium disabled:opacity-50"
          >
            {task ? 'Save Changes' : 'Add Task'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
