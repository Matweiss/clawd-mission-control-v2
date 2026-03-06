import React, { useState } from 'react';
import { 
  MoreHorizontal, TrendingUp, Clock, Users, Target, 
  CheckCircle2, Circle, AlertCircle, ChevronLeft, Plus,
  Calendar, Flag, User, Edit2, Trash2, X, Save
} from 'lucide-react';

interface Task {
  id: string;
  title: string;
  status: 'todo' | 'in_progress' | 'done';
  priority: 'low' | 'medium' | 'high';
  assignee: string;
  dueDate: string;
}

interface Project {
  id: string;
  name: string;
  status: 'active' | 'planning' | 'completed' | 'on_hold';
  progress: number;
  team: string[];
  deadline: string;
  description: string;
  tasks: Task[];
}

const INITIAL_PROJECTS: Project[] = [
  {
    id: '1',
    name: 'Mission Control Dashboard v2',
    status: 'active',
    progress: 75,
    team: ['Mat', 'Build Agent'],
    deadline: '2026-03-15',
    description: 'Notion-style dashboard with task board, calendar, and office controls',
    tasks: [
      { id: 't1', title: 'Create sidebar navigation', status: 'done', priority: 'high', assignee: 'Mat', dueDate: '2026-03-01' },
      { id: 't2', title: 'Build Task Board view', status: 'done', priority: 'high', assignee: 'Mat', dueDate: '2026-03-02' },
      { id: 't3', title: 'Add Projects detail view', status: 'in_progress', priority: 'high', assignee: 'Mat', dueDate: '2026-03-05' },
      { id: 't4', title: 'Integrate with backend API', status: 'todo', priority: 'medium', assignee: 'Build Agent', dueDate: '2026-03-10' },
      { id: 't5', title: 'Mobile responsiveness', status: 'todo', priority: 'low', assignee: 'Build Agent', dueDate: '2026-03-15' },
    ]
  },
  {
    id: '2',
    name: 'Lifestyle Agent Integration',
    status: 'active',
    progress: 60,
    team: ['Mat', 'Lifestyle Agent'],
    deadline: '2026-03-20',
    description: 'Apple Health integration, sleep tracking, proactive check-ins',
    tasks: [
      { id: 't6', title: 'Set up health data webhook', status: 'done', priority: 'high', assignee: 'Build Agent', dueDate: '2026-03-01' },
      { id: 't7', title: 'Create iPhone Shortcuts', status: 'in_progress', priority: 'high', assignee: 'Mat', dueDate: '2026-03-05' },
      { id: 't8', title: 'Build health dashboard panel', status: 'done', priority: 'medium', assignee: 'Mat', dueDate: '2026-03-03' },
      { id: 't9', title: 'Smart alert thresholds', status: 'todo', priority: 'medium', assignee: 'Lifestyle Agent', dueDate: '2026-03-15' },
    ]
  },
  {
    id: '3',
    name: 'Tesla Fleet API',
    status: 'planning',
    progress: 10,
    team: ['Mat', 'Build Agent'],
    deadline: '2026-04-01',
    description: 'Vehicle monitoring, location tracking, Mission Control integration',
    tasks: [
      { id: 't10', title: 'Complete domain verification', status: 'in_progress', priority: 'high', assignee: 'Mat', dueDate: '2026-03-05' },
      { id: 't11', title: 'Set up Tesla OAuth', status: 'todo', priority: 'high', assignee: 'Build Agent', dueDate: '2026-03-10' },
      { id: 't12', title: 'Build vehicle status panel', status: 'todo', priority: 'medium', assignee: 'Build Agent', dueDate: '2026-03-25' },
    ]
  },
  {
    id: '4',
    name: 'Q1 Sales Pipeline',
    status: 'active',
    progress: 45,
    team: ['Mat', 'Work Agent', 'HubSpot Agent'],
    deadline: '2026-03-31',
    description: '$260K pipeline, 21 active deals, focus on Vertex + Dragon',
    tasks: [
      { id: 't13', title: 'Close Vertex contract', status: 'in_progress', priority: 'high', assignee: 'Mat', dueDate: '2026-03-10' },
      { id: 't14', title: 'Dragon Technologies demo', status: 'done', priority: 'high', assignee: 'Mat', dueDate: '2026-03-03' },
      { id: 't15', title: 'HubSpot token refresh fix', status: 'todo', priority: 'high', assignee: 'Build Agent', dueDate: '2026-03-05' },
    ]
  },
  {
    id: '5',
    name: 'Agent Swarm Architecture',
    status: 'active',
    progress: 80,
    team: ['CLAWD Prime', 'All Agents'],
    deadline: '2026-03-10',
    description: '3-tier hierarchy, API contracts, handoff protocols',
    tasks: [
      { id: 't16', title: 'Define API contracts', status: 'done', priority: 'high', assignee: 'CLAWD Prime', dueDate: '2026-03-01' },
      { id: 't17', title: 'Document handoff protocols', status: 'in_progress', priority: 'high', assignee: 'Work Agent', dueDate: '2026-03-08' },
      { id: 't18', title: 'Test agent communication', status: 'todo', priority: 'medium', assignee: 'Build Agent', dueDate: '2026-03-10' },
    ]
  },
];

const STATUS_COLORS: any = {
  active: 'bg-green-500/20 text-green-400',
  planning: 'bg-blue-500/20 text-blue-400',
  completed: 'bg-gray-500/20 text-gray-400',
  on_hold: 'bg-yellow-500/20 text-yellow-400',
};

const STATUS_OPTIONS = ['active', 'planning', 'completed', 'on_hold'];

export function ProjectsView() {
  const [projects, setProjects] = useState<Project[]>(INITIAL_PROJECTS);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [filter, setFilter] = useState('all');

  const updateProject = (id: string, updates: Partial<Project>) => {
    setProjects(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
    if (selectedProject?.id === id) {
      setSelectedProject({ ...selectedProject, ...updates });
    }
  };

  const filteredProjects = filter === 'all' 
    ? projects 
    : projects.filter(p => p.status === filter);

  if (selectedProject) {
    return (
      <ProjectDetailView 
        project={selectedProject} 
        onBack={() => setSelectedProject(null)}
        onUpdate={(updates) => updateProject(selectedProject.id, updates)}
      />
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Projects</h1>
          <p className="text-sm text-gray-500 mt-1">Active initiatives across your ecosystem</p>
        </div>
        
        <div className="flex items-center gap-2">
          <select 
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-3 py-2 bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg text-sm text-white"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="planning">Planning</option>
            <option value="completed">Completed</option>
          </select>
          
          <button className="flex items-center gap-2 px-4 py-2 bg-orange-500/20 text-orange-400 rounded-lg text-sm hover:bg-orange-500/30 transition-colors">
            <Plus className="w-4 h-4" />
            New Project
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {filteredProjects.map((project) => (
          <ProjectCard 
            key={project.id}
            project={project}
            onClick={() => setSelectedProject(project)}
            onEdit={() => setEditingProject(project)}
          />
        ))}
      </div>

      {/* Edit Project Modal */}
      {editingProject && (
        <EditProjectModal
          project={editingProject}
          onClose={() => setEditingProject(null)}
          onSave={(updates) => {
            updateProject(editingProject.id, updates);
            setEditingProject(null);
          }}
        />
      )}
    </div>
  );
}

// Project Card Component
function ProjectCard({ project, onClick, onEdit }: { 
  project: Project; 
  onClick: () => void;
  onEdit: () => void;
}) {
  const completedTasks = project.tasks.filter(t => t.status === 'done').length;
  const totalTasks = project.tasks.length;

  return (
    <div 
      className="bg-[#161616] rounded-xl p-5 hover:bg-[#1A1A1A] transition-colors group relative"
    >
      <div className="flex items-start justify-between mb-3">
        <span className={`text-xs px-2 py-1 rounded ${STATUS_COLORS[project.status]}`}>
          {project.status}
        </span>
        <button 
          onClick={(e) => { e.stopPropagation(); onEdit(); }}
          className="opacity-0 group-hover:opacity-100 p-1 hover:bg-[#2A2A2A] rounded transition-opacity"
        >
          <Edit2 className="w-4 h-4 text-gray-400" />
        </button>
      </div>

      <div onClick={onClick} className="cursor-pointer">
        <h3 className="text-lg font-semibold text-white mb-2">{project.name}</h3>
        <p className="text-sm text-gray-400 mb-4 line-clamp-2">{project.description}</p>

        {/* Progress Bar */}
        <div className="mb-4">
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="text-gray-500">{completedTasks}/{totalTasks} tasks</span>
            <span className="text-white">{project.progress}%</span>
          </div>
          <div className="h-2 bg-[#2A2A2A] rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-orange-500 to-red-500 rounded-full transition-all"
              style={{ width: `${project.progress}%` }}
            />
          </div>
        </div>

        {/* Meta */}
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-gray-500">
              <Clock className="w-3.5 h-3.5" />
              <span>{project.deadline}</span>
            </div>
          </div>

          <div className="flex -space-x-2">
            {project.team.slice(0, 3).map((member, i) => (
              <div 
                key={i}
                className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-[10px] font-bold text-white border-2 border-[#161616]"
              >
                {member.charAt(0)}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// Edit Project Modal
function EditProjectModal({ project, onClose, onSave }: {
  project: Project;
  onClose: () => void;
  onSave: (updates: Partial<Project>) => void;
}) {
  const [form, setForm] = useState({
    name: project.name,
    description: project.description,
    status: project.status,
    deadline: project.deadline,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(form);
  };

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
      <div className="bg-[#161616] rounded-xl max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-white">Edit Project</h2>
          <button onClick={onClose} className="p-1 hover:bg-[#2A2A2A] rounded">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm text-gray-400 mb-1 block">Project Name</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full px-3 py-2 bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg text-white focus:outline-none focus:border-orange-500"
            />
          </div>

          <div>
            <label className="text-sm text-gray-400 mb-1 block">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full px-3 py-2 bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg text-white focus:outline-none focus:border-orange-500 h-20 resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-gray-400 mb-1 block">Status</label>
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value as any })}
                className="w-full px-3 py-2 bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg text-white focus:outline-none focus:border-orange-500"
              >
                {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
              </select>
            </div>

            <div>
              <label className="text-sm text-gray-400 mb-1 block">Due Date</label>
              <input
                type="date"
                value={form.deadline}
                onChange={(e) => setForm({ ...form, deadline: e.target.value })}
                className="w-full px-3 py-2 bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg text-white focus:outline-none focus:border-orange-500"
              />
            </div>
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
              className="flex-1 py-2 bg-orange-500/20 text-orange-400 rounded-lg hover:bg-orange-500/30 transition-colors flex items-center justify-center gap-2"
            >
              <Save className="w-4 h-4" />
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Project Detail View
interface ProjectDetailViewProps {
  project: Project;
  onBack: () => void;
  onUpdate: (updates: Partial<Project>) => void;
}

function ProjectDetailView({ project, onBack, onUpdate }: ProjectDetailViewProps) {
  const [activeTab, setActiveTab] = useState<'tasks' | 'team' | 'info'>('tasks');
  const [isEditing, setIsEditing] = useState(false);

  const todoTasks = project.tasks.filter(t => t.status === 'todo');
  const inProgressTasks = project.tasks.filter(t => t.status === 'in_progress');
  const doneTasks = project.tasks.filter(t => t.status === 'done');

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button 
          onClick={onBack}
          className="p-2 hover:bg-[#2A2A2A] rounded-lg transition-colors"
        >
          <ChevronLeft className="w-5 h-5 text-gray-400" />
        </button>
        
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-white">{project.name}</h1>
            <span className={`text-xs px-2 py-1 rounded ${STATUS_COLORS[project.status]}`}>
              {project.status}
            </span>
          </div>
          <p className="text-sm text-gray-500 mt-1">{project.description}</p>
        </div>
        
        <button 
          onClick={() => setIsEditing(true)}
          className="flex items-center gap-2 px-3 py-2 bg-[#2A2A2A] hover:bg-[#3A3A3A] rounded-lg text-sm text-gray-300 transition-colors"
        >
          <Edit2 className="w-4 h-4" />
          Edit
        </button>
      </div>

      {/* Progress Overview */}
      <div className="bg-[#161616] rounded-xl p-4 mb-6">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm text-gray-400">Overall Progress</span>
          <span className="text-lg font-bold text-white">{project.progress}%</span>
        </div>
        
        <div className="h-3 bg-[#2A2A2A] rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-orange-500 to-red-500 rounded-full transition-all"
            style={{ width: `${project.progress}%` }}
          />
        </div>
        
        <div className="flex items-center justify-between mt-3 text-sm">
          <div className="flex gap-4">
            <span className="text-gray-500">{todoTasks.length} To Do</span>
            <span className="text-blue-400">{inProgressTasks.length} In Progress</span>
            <span className="text-green-400">{doneTasks.length} Done</span>
          </div>
          <span className="text-gray-500 flex items-center gap-1">
            <Calendar className="w-4 h-4" />
            Due {project.deadline}
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 mb-4 border-b border-[#2A2A2A]">
        {['tasks', 'team', 'info'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab as any)}
            className={`px-4 py-2 text-sm capitalize transition-colors ${
              activeTab === tab 
                ? 'text-white border-b-2 border-orange-500' 
                : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Content */}
      {activeTab === 'tasks' && (
        <div className="space-y-6">
          {todoTasks.length > 0 && (
            <TaskSection title="To Do" tasks={todoTasks} color="gray" icon={Circle} />
          )}
          {inProgressTasks.length > 0 && (
            <TaskSection title="In Progress" tasks={inProgressTasks} color="blue" icon={Clock} />
          )}
          {doneTasks.length > 0 && (
            <TaskSection title="Completed" tasks={doneTasks} color="green" icon={CheckCircle2} />
          )}
        </div>
      )}

      {activeTab === 'team' && (
        <div className="grid grid-cols-2 gap-3">
          {project.team.map((member, i) => (
            <div key={i} className="flex items-center gap-3 p-3 bg-[#161616] rounded-lg">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-sm font-bold text-white">
                {member.charAt(0)}
              </div>
              <div>
                <p className="text-sm text-white font-medium">{member}</p>
                <p className="text-xs text-gray-500">{member === 'Mat' ? 'Owner' : 'Agent'}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'info' && (
        <div className="space-y-4">
          <InfoCard title="Description" content={project.description} />
          
          <div className="bg-[#161616] rounded-xl p-4">
            <h3 className="text-sm font-medium text-gray-400 mb-2">Timeline</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Deadline</span>
                <span className="text-white">{project.deadline}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Status</span>
                <span className="capitalize text-white">{project.status}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Progress</span>
                <span className="text-white">{project.progress}%</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {isEditing && (
        <EditProjectModal
          project={project}
          onClose={() => setIsEditing(false)}
          onSave={(updates) => {
            onUpdate(updates);
            setIsEditing(false);
          }}
        />
      )}
    </div>
  );
}

// Helper Components
function TaskSection({ title, tasks, color, icon: Icon }: any) {
  const colorClasses: any = {
    gray: 'text-gray-500',
    blue: 'text-blue-400',
    green: 'text-green-400',
  };

  return (
    <div>
      <h3 className={`text-sm font-medium mb-3 flex items-center gap-2 ${colorClasses[color]}`}>
        <Icon className="w-4 h-4" />
        {title} ({tasks.length})
      </h3>
      <div className="space-y-2">
        {tasks.map((task: Task) => (
          <div key={task.id} className="flex items-center gap-3 p-3 bg-[#161616] rounded-lg">
            <div className={`w-2 h-2 rounded-full ${
              task.priority === 'high' ? 'bg-red-500' : 
              task.priority === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
            }`}></div>
            <div className="flex-1">
              <p className="text-sm text-white">{task.title}</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs text-gray-500">{task.assignee}</span>
                <span className="text-xs text-gray-500">•</span>
                <span className="text-xs text-gray-500">{task.dueDate}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function InfoCard({ title, content }: { title: string; content: string }) {
  return (
    <div className="bg-[#161616] rounded-xl p-4">
      <h3 className="text-sm font-medium text-gray-400 mb-2">{title}</h3>
      <p className="text-sm text-white">{content}</p>
    </div>
  );
}
