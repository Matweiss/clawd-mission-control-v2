import React, { useState } from 'react';
import { 
  LayoutDashboard, CheckSquare, Calendar, FolderKanban, 
  FileText, Users, Home, Settings, ChevronLeft, ChevronRight,
  Plus, Search, Bell, Database, GitBranch, Activity, TrendingUp
} from 'lucide-react';

interface MissionControlLayoutProps {
  children: React.ReactNode;
  activeSection: string;
  onSectionChange: (section: string) => void;
}

const SECTIONS = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, color: 'text-white' },
  { id: 'monitor', label: 'Agent Monitor', icon: Activity, color: 'text-green-400', badge: 7 },
  { id: 'pipeline', label: 'Pipeline', icon: TrendingUp, color: 'text-cyan-400', badge: 6 },
  { id: 'tasks', label: 'Task Board', icon: CheckSquare, color: 'text-orange-400', badge: 12 },
  { id: 'calendar', label: 'Calendar', icon: Calendar, color: 'text-blue-400', badge: 3 },
  { id: 'projects', label: 'Projects', icon: FolderKanban, color: 'text-purple-400', badge: 5 },
  { id: 'docs', label: 'Docs', icon: FileText, color: 'text-gray-400' },
  { id: 'team', label: 'Team', icon: Users, color: 'text-pink-400', badge: 7 },
  { id: 'office', label: 'Office', icon: Home, color: 'text-yellow-400' },
  { id: 'memories', label: 'Memories', icon: Database, color: 'text-indigo-400' },
  { id: 'handoffs', label: 'Handoffs', icon: GitBranch, color: 'text-rose-400' },
];

export function MissionControlLayout({ children, activeSection, onSectionChange }: MissionControlLayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-[#0F0F0F] flex">
      {/* Sidebar Navigation */}
      <aside 
        className={`bg-[#161616] border-r border-[#2A2A2A] flex flex-col transition-all duration-300 ${
          sidebarCollapsed ? 'w-16' : 'w-64'
        }`}
      >
        {/* Header */}
        <div className="p-4 border-b border-[#2A2A2A] flex items-center justify-between">
          {!sidebarCollapsed && (
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center">
                <span className="text-lg">🦞</span>
              </div>
              <div>
                <h1 className="font-bold text-white text-sm">CLAWD</h1>
                <p className="text-[10px] text-gray-500">Mission Control</p>
              </div>
            </div>
          )}
          <button 
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="p-1 hover:bg-[#2A2A2A] rounded-lg"
          >
            {sidebarCollapsed ? <ChevronRight className="w-4 h-4 text-gray-400" /> : <ChevronLeft className="w-4 h-4 text-gray-400" />}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-2 space-y-1">
          {SECTIONS.map((section) => {
            const Icon = section.icon;
            const isActive = activeSection === section.id;
            
            return (
              <button
                key={section.id}
                onClick={() => onSectionChange(section.id)}
                className={`
                  w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all
                  ${isActive 
                    ? 'bg-[#2A2A2A] text-white' 
                    : 'text-gray-400 hover:bg-[#2A2A2A]/50 hover:text-gray-200'
                  }
                  ${sidebarCollapsed ? 'justify-center' : ''}
                `}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-orange-400' : section.color}`} />
                
                {!sidebarCollapsed && (
                  <>
                    <span className="flex-1 text-left">{section.label}</span>
                    {section.badge && (
                      <span className="px-1.5 py-0.5 bg-[#2A2A2A] rounded text-xs text-gray-400">
                        {section.badge}
                      </span>
                    )}
                  </>
                )}
              </button>
            );
          })}
        </nav>

        {/* User Profile */}
        <div className="p-4 border-t border-[#2A2A2A]">
          <button className={`flex items-center gap-3 w-full ${sidebarCollapsed ? 'justify-center' : ''}`}>
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-xs font-bold text-white">
              MW
            </div>
            {!sidebarCollapsed && (
              <div className="text-left">
                <p className="text-sm text-white">Mat Weiss</p>
                <p className="text-xs text-gray-500">Admin</p>
              </div>
            )}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <header className="h-14 bg-[#161616] border-b border-[#2A2A2A] flex items-center justify-between px-4">
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
              <input 
                type="text"
                placeholder="Search..."
                className="w-64 pl-9 pr-4 py-1.5 bg-[#0F0F0F] border border-[#2A2A2A] rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-orange-500/50"
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button className="p-2 hover:bg-[#2A2A2A] rounded-lg relative">
              <Bell className="w-4 h-4 text-gray-400" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>
            
            <button className="flex items-center gap-2 px-3 py-1.5 bg-orange-500/20 text-orange-400 rounded-lg text-sm hover:bg-orange-500/30 transition-colors">
              <Plus className="w-4 h-4" />
              <span>New</span>
            </button>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
