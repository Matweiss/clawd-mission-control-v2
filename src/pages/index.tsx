import React, { useState } from 'react';
import Head from 'next/head';
import { MissionControlLayout } from '../components/MissionControlLayout';
import { TaskBoardView } from '../components/views/TaskBoardView';
import { ProjectsView } from '../components/views/ProjectsView';
import { TeamView } from '../components/views/TeamView';
import { OfficeView } from '../components/views/OfficeView';
import { CalendarView } from '../components/views/CalendarView';
import { MemoriesView } from '../components/views/MemoriesView';
import { HandoffsView } from '../components/views/HandoffsView';
import { AgentMonitorView } from '../components/views/AgentMonitorView';
import { PipelineView } from '../components/views/PipelineView';
import { CalendarPanel } from '../components/CalendarPanel';
import { DocumentRepository } from '../components/DocumentRepository';
import { PetTrackerPanel } from '../components/PetTrackerPanel';
import { LifestyleHealthPanel } from '../components/LifestyleHealthPanel';
import { QuickActionsPalette } from '../components/QuickActionsPalette';
import { TokenUsagePanel } from '../components/TokenUsagePanel';
import { useRealtimeData } from '../hooks/useMissionControl';

// Dashboard Overview (original layout simplified)
function DashboardView({ calendarEvents }: { calendarEvents?: any[] }) {
  const { agents, emails, pipeline, loading, refresh } = useRealtimeData();

  return (
    <div className="p-6 space-y-6">
      {/* Welcome */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Good morning, Mat</h1>
          <p className="text-sm text-gray-500 mt-1">Thursday, March 5th — View Calendar for meetings</p>
        </div>
        
        <button 
          onClick={refresh}
          className="px-4 py-2 bg-orange-500/20 text-orange-400 rounded-lg text-sm hover:bg-orange-500/30 transition-colors"
        >
          Refresh Data
        </button>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-[#161616] rounded-xl p-4">
          <p className="text-sm text-gray-500">Active Deals</p>
          <p className="text-2xl font-bold text-white mt-1">5</p>
          <p className="text-xs text-green-400 mt-1">$224K pipeline</p>
        </div>
        <div className="bg-[#161616] rounded-xl p-4">
          <p className="text-sm text-gray-500">Unread Emails</p>
          <p className="text-2xl font-bold text-white mt-1">12</p>
          <p className="text-xs text-orange-400 mt-1">3 urgent</p>
        </div>
        <div className="bg-[#161616] rounded-xl p-4">
          <p className="text-sm text-gray-500">Open Tasks</p>
          <p className="text-2xl font-bold text-white mt-1">8</p>
          <p className="text-xs text-yellow-400 mt-1">2 due today</p>
        </div>
        <div className="bg-[#161616] rounded-xl p-4">
          <p className="text-sm text-gray-500">Agents Online</p>
          <p className="text-2xl font-bold text-white mt-1">7/7</p>
          <p className="text-xs text-green-400 mt-1">All systems go</p>
        </div>
      </div>

      {/* Quick Access Grid */}
      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-4">
          <div className="bg-[#161616] rounded-xl p-4">
            <h3 className="text-sm font-semibold text-white mb-3">Today's Priority</h3>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <span className="w-2 h-2 rounded-full bg-red-500"></span>
                <span className="text-gray-300">Call Sarah - Vertex contract</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <span className="w-2 h-2 rounded-full bg-orange-500"></span>
                <span className="text-gray-300">Review Dragon Tech proposal</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <span className="w-2 h-2 rounded-full bg-yellow-500"></span>
                <span className="text-gray-300">Fix HubSpot token</span>
              </div>
            </div>
          </div>
          
          <PetTrackerPanel />
        </div>

        <div className="space-y-4">
          <CalendarPanel events={calendarEvents || []} />
        </div>

        <div className="space-y-4">
          <LifestyleHealthPanel />
          
          <div className="bg-[#161616] rounded-xl p-4">
            <h3 className="text-sm font-semibold text-white mb-3">Agent Activity</h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-400">Email Agent</span>
                <span className="text-green-400 text-xs">Active</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-400">HubSpot Agent</span>
                <span className="text-green-400 text-xs">Active</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-400">Research Agent</span>
                <span className="text-gray-500 text-xs">Idle</span>
              </div>
            </div>
          </div>

          <TokenUsagePanel />
        </div>
      </div>
    </div>
  );
}

function DocsView() {
  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Docs</h1>
        <p className="text-sm text-gray-500 mt-1">Agent SOULs, documentation, and reference materials</p>
      </div>
      
      <DocumentRepository />
    </div>
  );
}

export default function MissionControlApp() {
  const [activeSection, setActiveSection] = useState('dashboard');
  const [showQuickActions, setShowQuickActions] = useState(false);
  const { agents, emails, pipeline, calendarEvents, loading, refresh } = useRealtimeData();

  const renderContent = () => {
    switch (activeSection) {
case 'monitor': return <AgentMonitorView />;
      case 'pipeline': return <PipelineView />;
      case 'dashboard': return <DashboardView calendarEvents={calendarEvents} />
      case 'tasks': return <TaskBoardView />;
      case 'projects': return <ProjectsView />;
      case 'calendar': return <CalendarView events={calendarEvents || []} />;
      case 'docs': return <DocsView />;
      case 'team': return <TeamView />;
      case 'office': return <OfficeView />;
      case 'memories': return <MemoriesView />;
      case 'handoffs': return <HandoffsView />;
      default: return <DashboardView calendarEvents={calendarEvents} />;
    }
  };

  return (
    <MissionControlLayout 
      activeSection={activeSection}
      onSectionChange={setActiveSection}
    >
      {renderContent()}
      
      <QuickActionsPalette 
        isOpen={showQuickActions}
        onClose={() => setShowQuickActions(false)}
        agents={agents || []}
        pipeline={pipeline || { deals: [], total: 0, byStage: {} }}
        emails={emails || []}
        onRefresh={refresh}
      />
    </MissionControlLayout>
  );
}
