import React, { useState } from 'react';
import { 
  GitBranch, Archive, Download, Upload, FileText, CheckCircle2,
  Clock, AlertCircle, Copy, ExternalLink, MoreHorizontal,
  User, Calendar, HardDrive
} from 'lucide-react';

interface BackupItem {
  id: string;
  name: string;
  type: 'agent_soul' | 'config' | 'database' | 'full_system';
  size: string;
  createdAt: string;
  status: 'complete' | 'in_progress' | 'failed';
  downloadUrl?: string;
  commitHash?: string;
}

interface HandoffItem {
  id: string;
  fromAgent: string;
  toAgent: string;
  project: string;
  status: 'pending' | 'in_progress' | 'complete';
  createdAt: string;
  notes: string;
  filesTransferred: number;
}

const BACKUPS: BackupItem[] = [
  {
    id: 'b1',
    name: 'Agent SOULs - Daily Backup',
    type: 'agent_soul',
    size: '2.4 MB',
    createdAt: '2026-03-04 07:15:00',
    status: 'complete',
    commitHash: 'a3f7d2e'
  },
  {
    id: 'b2',
    name: 'Full System Backup',
    type: 'full_system',
    size: '856 MB',
    createdAt: '2026-03-04 00:00:00',
    status: 'complete',
    commitHash: '8b9c1f4'
  },
  {
    id: 'b3',
    name: 'Database Snapshot',
    type: 'database',
    size: '124 MB',
    createdAt: '2026-03-03 23:45:00',
    status: 'complete',
    commitHash: '2d5e8a1'
  },
  {
    id: 'b4',
    name: 'Mission Control Config',
    type: 'config',
    size: '45 KB',
    createdAt: '2026-03-03 18:30:00',
    status: 'complete',
    commitHash: '7f2c9b3'
  },
  {
    id: 'b5',
    name: 'Weekly Archive',
    type: 'full_system',
    size: '2.1 GB',
    createdAt: '2026-03-01 00:00:00',
    status: 'complete',
    commitHash: '9e4d7f2'
  },
];

const HANDOFFS: HandoffItem[] = [
  {
    id: 'h1',
    fromAgent: 'Work Agent',
    toAgent: 'Mat',
    project: 'Q1 Sales Pipeline',
    status: 'complete',
    createdAt: '2026-03-04 09:00:00',
    notes: 'Dragon Technologies deal needs follow-up. Prepared battle card and contact info.',
    filesTransferred: 3
  },
  {
    id: 'h2',
    fromAgent: 'Build Agent',
    toAgent: 'Research Agent',
    project: 'Tesla API Integration',
    status: 'in_progress',
    createdAt: '2026-03-04 08:30:00',
    notes: 'Domain verification complete. OAuth setup documented.',
    filesTransferred: 2
  },
  {
    id: 'h3',
    fromAgent: 'Email Agent',
    toAgent: 'Work Agent',
    project: 'Caldwell County BBQ',
    status: 'pending',
    createdAt: '2026-03-04 10:15:00',
    notes: 'Urgent email flagged. Needs immediate response.',
    filesTransferred: 1
  },
];

const STATUS_COLORS: any = {
  complete: 'text-green-400 bg-green-500/10',
  in_progress: 'text-blue-400 bg-blue-500/10',
  pending: 'text-yellow-400 bg-yellow-500/10',
  failed: 'text-red-400 bg-red-500/10',
};

export function HandoffsView() {
  const [activeTab, setActiveTab] = useState<'backups' | 'handoffs'>('backups');

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Handoffs & Backups</h1>
          <p className="text-sm text-gray-500 mt-1">Agent handoffs and system backups</p>
        </div>
        
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-2 px-4 py-2 bg-orange-500/20 text-orange-400 rounded-lg text-sm hover:bg-orange-500/30 transition-colors">
            <Download className="w-4 h-4" />
            Create Backup
          </button>
        </div>
      </div>

      {/* Storage Overview */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-[#161616] rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <HardDrive className="w-4 h-4 text-blue-400" />
            <span className="text-sm text-gray-400">Total Backups</span>
          </div>
          <p className="text-2xl font-bold text-white">24</p>
          <p className="text-xs text-gray-500">Last 30 days</p>
        </div>

        <div className="bg-[#161616] rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Archive className="w-4 h-4 text-purple-400" />
            <span className="text-sm text-gray-400">Storage Used</span>
          </div>
          <p className="text-2xl font-bold text-white">3.2 GB</p>
          <p className="text-xs text-gray-500">GitHub + Local</p>
        </div>

        <div className="bg-[#161616] rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <GitBranch className="w-4 h-4 text-green-400" />
            <span className="text-sm text-gray-400">Active Handoffs</span>
          </div>
          <p className="text-2xl font-bold text-white">2</p>
          <p className="text-xs text-gray-500">1 pending</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 mb-4 border-b border-[#2A2A2A]">
        <button
          onClick={() => setActiveTab('backups')}
          className={`px-4 py-2 text-sm transition-colors ${
            activeTab === 'backups' 
              ? 'text-white border-b-2 border-orange-500' 
              : 'text-gray-500 hover:text-gray-300'
          }`}
        >
          Backups ({BACKUPS.length})
        </button>
        <button
          onClick={() => setActiveTab('handoffs')}
          className={`px-4 py-2 text-sm transition-colors ${
            activeTab === 'handoffs' 
              ? 'text-white border-b-2 border-orange-500' 
              : 'text-gray-500 hover:text-gray-300'
          }`}
        >
          Handoffs ({HANDOFFS.length})
        </button>
      </div>

      {/* Backups Tab */}
      {activeTab === 'backups' && (
        <div className="space-y-3">
          <div className="bg-[#161616] rounded-xl overflow-hidden">
            <div className="grid grid-cols-6 gap-4 p-3 text-xs text-gray-500 border-b border-[#2A2A2A]">
              <span className="col-span-2">Name</span>
              <span>Type</span>
              <span>Size</span>
              <span>Created</span>
              <span>Actions</span>
            </div>
            
            {BACKUPS.map((backup) => (
              <div 
                key={backup.id}
                className="grid grid-cols-6 gap-4 p-3 items-center hover:bg-[#1A1A1A] transition-colors border-b border-[#2A2A2A] last:border-0"
              >
                <div className="col-span-2 flex items-center gap-2">
                  <Archive className="w-4 h-4 text-gray-400" />
                  <div>
                    <p className="text-sm text-white">{backup.name}</p>
                    {backup.commitHash && (
                      <p className="text-xs text-gray-500 font-mono">#{backup.commitHash}</p>
                    )}
                  </div>
                </div>
                
                <span className={`text-xs px-2 py-1 rounded ${STATUS_COLORS[backup.status]}`}>
                  {backup.type.replace('_', ' ')}
                </span>
                
                <span className="text-sm text-gray-400">{backup.size}</span>
                
                <span className="text-sm text-gray-500">
                  {new Date(backup.createdAt).toLocaleDateString()}
                </span>
                
                <div className="flex items-center gap-2">
                  <button className="p-1.5 hover:bg-[#2A2A2A] rounded">
                    <Download className="w-4 h-4 text-gray-400" />
                  </button>
                  <button className="p-1.5 hover:bg-[#2A2A2A] rounded">
                    <ExternalLink className="w-4 h-4 text-gray-400" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Handoffs Tab */}
      {activeTab === 'handoffs' && (
        <div className="space-y-3">
          {HANDOFFS.map((handoff) => (
            <div key={handoff.id} className="bg-[#161616] rounded-xl p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <span className={`text-xs px-2 py-1 rounded ${STATUS_COLORS[handoff.status]}`}>
                    {handoff.status.replace('_', ' ')}
                  </span>
                  <span className="text-sm text-gray-500">{handoff.createdAt}</span>
                </div>
                
                <button className="p-1.5 hover:bg-[#2A2A2A] rounded">
                  <MoreHorizontal className="w-4 h-4 text-gray-400" />
                </button>
              </div>

              <div className="flex items-center gap-2 mb-3">
                <div className="flex items-center gap-2 px-3 py-1.5 bg-[#1A1A1A] rounded-full">
                  <span className="text-sm text-white">{handoff.fromAgent}</span>
                </div>
                
                <span className="text-gray-500">→</span>
                
                <div className="flex items-center gap-2 px-3 py-1.5 bg-[#1A1A1A] rounded-full">
                  <span className="text-sm text-white">{handoff.toAgent}</span>
                </div>
              </div>

              <div className="mb-3">
                <p className="text-sm text-orange-400 mb-1">{handoff.project}</p>
                <p className="text-sm text-gray-300">{handoff.notes}</p>
              </div>

              <div className="flex items-center gap-2 text-xs text-gray-500">
                <FileText className="w-3.5 h-3.5" />
                <span>{handoff.filesTransferred} files transferred</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
