import React, { useState } from 'react';
import { 
  Database, RefreshCw, Download, Clock, CheckCircle2, 
  AlertCircle, Server, HardDrive, Activity, Filter,
  ChevronDown, ChevronUp, ExternalLink
} from 'lucide-react';

interface LogEntry {
  id: string;
  timestamp: string;
  type: 'sync' | 'backup' | 'error' | 'info';
  source: string;
  message: string;
  details?: string;
  status: 'success' | 'failed' | 'running';
}

const SAMPLE_LOGS: LogEntry[] = [
  {
    id: '1',
    timestamp: '2026-03-04 08:00:00',
    type: 'sync',
    source: 'Google Calendar',
    message: 'Synced 12 events',
    status: 'success'
  },
  {
    id: '2',
    timestamp: '2026-03-04 07:30:00',
    type: 'sync',
    source: 'HubSpot',
    message: 'Pipeline cache refreshed',
    details: '21 deals updated, $260K total',
    status: 'success'
  },
  {
    id: '3',
    timestamp: '2026-03-04 07:15:00',
    type: 'backup',
    source: 'Agent SOULs',
    message: 'Daily backup completed',
    details: '7 agent files backed up to GitHub',
    status: 'success'
  },
  {
    id: '4',
    timestamp: '2026-03-04 06:45:00',
    type: 'error',
    source: 'HubSpot API',
    message: 'Token refresh failed',
    details: 'Error 401: Unauthorized - needs manual re-auth',
    status: 'failed'
  },
  {
    id: '5',
    timestamp: '2026-03-04 06:30:00',
    type: 'sync',
    source: 'Gmail',
    message: 'Email sync completed',
    details: '12 unread, 3 urgent flagged',
    status: 'success'
  },
  {
    id: '6',
    timestamp: '2026-03-04 06:00:00',
    type: 'info',
    source: 'Lifestyle Agent',
    message: 'Morning check-in sent',
    status: 'success'
  },
  {
    id: '7',
    timestamp: '2026-03-04 05:45:00',
    type: 'sync',
    source: 'Supabase',
    message: 'Health data synced',
    details: '24 records inserted',
    status: 'success'
  },
  {
    id: '8',
    timestamp: '2026-03-04 05:30:00',
    type: 'backup',
    source: 'Database',
    message: 'Automated backup created',
    status: 'success'
  },
  {
    id: '9',
    timestamp: '2026-03-04 05:00:00',
    type: 'sync',
    source: 'Home Assistant',
    message: 'Pet locations updated',
    details: 'Diggy: Master Bedroom, Theo: Living Room',
    status: 'success'
  },
  {
    id: '10',
    timestamp: '2026-03-04 04:00:00',
    type: 'info',
    source: 'Cron',
    message: 'Midday pulse executed',
    status: 'success'
  },
  {
    id: '11',
    timestamp: '2026-03-04 00:00:00',
    type: 'backup',
    source: 'Mission Control',
    message: 'Full system backup',
    details: 'Dashboard config, agent states, user preferences',
    status: 'success'
  },
  {
    id: '12',
    timestamp: '2026-03-03 23:45:00',
    type: 'error',
    source: 'Tesla API',
    message: 'Domain verification pending',
    details: 'SSL certificate not yet propagated',
    status: 'failed'
  },
];

const SYNC_SOURCES = [
  { name: 'Google Calendar', status: 'connected', lastSync: '2 min ago', icon: '📅' },
  { name: 'Gmail', status: 'connected', lastSync: '5 min ago', icon: '📧' },
  { name: 'HubSpot', status: 'error', lastSync: '30 min ago', icon: '📊' },
  { name: 'Supabase', status: 'connected', lastSync: '1 hour ago', icon: '🗄️' },
  { name: 'Home Assistant', status: 'connected', lastSync: '2 hours ago', icon: '🏠' },
  { name: 'GitHub', status: 'connected', lastSync: '3 hours ago', icon: '🐙' },
];

export function MemoriesView() {
  const [filter, setFilter] = useState<'all' | 'sync' | 'backup' | 'error'>('all');
  const [expandedLog, setExpandedLog] = useState<string | null>(null);

  const filteredLogs = filter === 'all' 
    ? SAMPLE_LOGS 
    : SAMPLE_LOGS.filter(log => log.type === filter);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success': return <CheckCircle2 className="w-4 h-4 text-green-400" />;
      case 'failed': return <AlertCircle className="w-4 h-4 text-red-400" />;
      case 'running': return <RefreshCw className="w-4 h-4 text-blue-400 animate-spin" />;
      default: return <Activity className="w-4 h-4 text-gray-400" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'sync': return 'text-blue-400 bg-blue-500/10';
      case 'backup': return 'text-purple-400 bg-purple-500/10';
      case 'error': return 'text-red-400 bg-red-500/10';
      case 'info': return 'text-gray-400 bg-gray-500/10';
      default: return 'text-gray-400';
    }
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Memories</h1>
          <p className="text-sm text-gray-500 mt-1">Backups, syncs, and system logs</p>
        </div>
        
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-2 px-4 py-2 bg-[#1A1A1A] hover:bg-[#2A2A2A] rounded-lg text-sm text-white transition-colors">
            <Download className="w-4 h-4" />
            Export Logs
          </button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        {/* Sync Status */}
        <div className="col-span-2 bg-[#161616] rounded-xl p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-white">Sync Status</h2>
            <button className="p-2 hover:bg-[#2A2A2A] rounded-lg">
              <RefreshCw className="w-4 h-4 text-gray-400" />
            </button>
          </div>
          
          <div className="grid grid-cols-3 gap-3">
            {SYNC_SOURCES.map((source) => (
              <div key={source.name} className="flex items-center gap-3 p-3 bg-[#1A1A1A] rounded-lg">
                <span className="text-xl">{source.icon}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white font-medium truncate">{source.name}</p>
                  <div className="flex items-center gap-1.5">
                    <div className={`w-1.5 h-1.5 rounded-full ${
                      source.status === 'connected' ? 'bg-green-500' : 'bg-red-500'
                    }`}></div>
                    <span className="text-xs text-gray-500">{source.lastSync}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Storage Stats */}
        <div className="bg-[#161616] rounded-xl p-4">
          <div className="flex items-center gap-2 mb-4">
            <HardDrive className="w-4 h-4 text-gray-400" />
            <h2 className="text-sm font-semibold text-white">Storage</h2>
          </div>
          
          <div className="space-y-3">
            <div>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-gray-500">Database</span>
                <span className="text-white">2.4 GB</span>
              </div>
              <div className="h-1.5 bg-[#2A2A2A] rounded-full overflow-hidden">
                <div className="h-full bg-blue-500 rounded-full" style={{ width: '35%' }} />
              </div>
            </div>
            
            <div>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-gray-500">Backups</span>
                <span className="text-white">856 MB</span>
              </div>
              <div className="h-1.5 bg-[#2A2A2A] rounded-full overflow-hidden">
                <div className="h-full bg-purple-500 rounded-full" style={{ width: '12%' }} />
              </div>
            </div>
            
            <div>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-gray-500">Logs</span>
                <span className="text-white">124 MB</span>
              </div>
              <div className="h-1.5 bg-[#2A2A2A] rounded-full overflow-hidden">
                <div className="h-full bg-green-500 rounded-full" style={{ width: '5%' }} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Activity Log */}
      <div className="bg-[#161616] rounded-xl">
        <div className="flex items-center justify-between p-4 border-b border-[#2A2A2A]">
          <h2 className="text-sm font-semibold text-white">Activity Log</h2>
          
          <div className="flex items-center gap-1">
            {['all', 'sync', 'backup', 'error'].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f as any)}
                className={`px-3 py-1.5 rounded-lg text-xs capitalize transition-colors ${
                  filter === f 
                    ? 'bg-[#2A2A2A] text-white' 
                    : 'text-gray-500 hover:text-gray-300'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        <div className="divide-y divide-[#2A2A2A]">
          {filteredLogs.map((log) => (
            <div 
              key={log.id}
              className="p-4 hover:bg-[#1A1A1A] transition-colors cursor-pointer"
              onClick={() => setExpandedLog(expandedLog === log.id ? null : log.id)}
            >
              <div className="flex items-start gap-3">
                <div className="mt-0.5">{getStatusIcon(log.status)}</div>
                
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={`text-xs px-2 py-0.5 rounded ${getTypeColor(log.type)}`}>
                        {log.type}
                      </span>
                      <span className="text-sm text-white font-medium">{log.source}</span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500">{log.timestamp}</span>
                      {log.details && (
                        expandedLog === log.id ? 
                          <ChevronUp className="w-4 h-4 text-gray-400" /> : 
                          <ChevronDown className="w-4 h-4 text-gray-400" />
                      )}
                    </div>
                  </div>
                  
                  <p className="text-sm text-gray-300 mt-1">{log.message}</p>
                  
                  {expandedLog === log.id && log.details && (
                    <div className="mt-3 p-3 bg-[#0F0F0F] rounded-lg text-sm text-gray-400">
                      {log.details}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
