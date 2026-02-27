import React, { useState, useEffect } from 'react';
import { 
  Download, FileText, HardDrive, RefreshCw, Archive, 
  Shield, Database, Clock, CheckCircle, AlertCircle,
  ExternalLink, Folder, File, ChevronRight, ChevronDown
} from 'lucide-react';

interface Document {
  id: string;
  name: string;
  path: string;
  type: 'soul' | 'memory' | 'config' | 'script' | 'schema' | 'other';
  size?: string;
  lastModified?: string;
  description?: string;
  downloadable?: boolean;
}

interface BackupInfo {
  id: string;
  timestamp: string;
  size: string;
  components: string[];
  status: 'complete' | 'partial' | 'failed';
}

export function DocumentRepository() {
  const [activeTab, setActiveTab] = useState<'documents' | 'backups' | 'handoff'>('documents');
  const [documents, setDocuments] = useState<Document[]>([]);
  const [backups, setBackups] = useState<BackupInfo[]>([]);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [isGenerating, setIsGenerating] = useState(false);
  const [lastSync, setLastSync] = useState<string>('Never');

  // Mock data for now - in production this would fetch from API
  useEffect(() => {
    setDocuments([
      // Identity/Soul Files
      { id: '1', name: 'SOUL.md', path: '/workspace/SOUL.md', type: 'soul', description: 'Agent personality and behavior', downloadable: true },
      { id: '2', name: 'IDENTITY.md', path: '/workspace/IDENTITY.md', type: 'soul', description: 'Agent identity definition', downloadable: true },
      { id: '3', name: 'USER.md', path: '/workspace/USER.md', type: 'soul', description: 'User preferences and context', downloadable: true },
      { id: '4', name: 'AGENTS.md', path: '/workspace/AGENTS.md', type: 'config', description: 'Agent architecture documentation', downloadable: true },
      { id: '5', name: 'TOOLS.md', path: '/workspace/TOOLS.md', type: 'config', description: 'Tool configurations and credentials', downloadable: true },
      
      // Memory Files
      { id: '6', name: 'MEMORY.md', path: '/workspace/MEMORY.md', type: 'memory', description: 'Long-term memory archive', downloadable: true },
      { id: '7', name: '2026-02-28.md', path: '/workspace/memory/2026-02-28.md', type: 'memory', description: 'Today\'s memory log', downloadable: true },
      
      // Database Schema
      { id: '8', name: 'security-fix.sql', path: '/workspace/security-fix.sql', type: 'schema', description: 'RLS policies and security', downloadable: true },
      { id: '9', name: 'database-schema.sql', path: '/workspace/database-schema.sql', type: 'schema', description: 'Full database schema', downloadable: true },
      
      // Agent Souls
      { id: '10', name: 'work-agent-soul.md', path: '/workspace/agents/work-agent-soul.md', type: 'soul', description: 'Work Agent personality', downloadable: true },
      { id: '11', name: 'email-agent-soul.md', path: '/workspace/agents/email-agent-soul.md', type: 'soul', description: 'Email Agent personality', downloadable: true },
      { id: '12', name: 'hubspot-agent-soul.md', path: '/workspace/agents/hubspot-agent-soul.md', type: 'soul', description: 'HubSpot Agent personality', downloadable: true },
    ]);

    setBackups([
      { id: '1', timestamp: '2026-02-28 03:45 AM PT', size: '2.4 MB', components: ['Identity', 'Agents', 'Memories', 'Mission Control'], status: 'complete' },
    ]);
  }, []);

  const generateBackup = async () => {
    setIsGenerating(true);
    // In production, this would call the backup-generator.js script
    setTimeout(() => {
      setIsGenerating(false);
      setLastSync(new Date().toLocaleString('en-US', { timeZone: 'America/Los_Angeles' }));
      // Add new backup to list
      setBackups(prev => [{
        id: Date.now().toString(),
        timestamp: new Date().toLocaleString('en-US', { timeZone: 'America/Los_Angeles' }) + ' PT',
        size: '2.4 MB',
        components: ['Identity', 'Agents', 'Memories', 'Mission Control', 'Database'],
        status: 'complete'
      }, ...prev]);
    }, 2000);
  };

  const downloadFile = (doc: Document) => {
    // In production, this would fetch the file content and trigger download
    console.log('Downloading:', doc.path);
  };

  const downloadBackup = (backupId: string) => {
    console.log('Downloading backup:', backupId);
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'soul': return 'text-purple-400';
      case 'memory': return 'text-green-400';
      case 'config': return 'text-blue-400';
      case 'schema': return 'text-orange-400';
      default: return 'text-gray-400';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'soul': return '👤';
      case 'memory': return '🧠';
      case 'config': return '⚙️';
      case 'schema': return '🗄️';
      default: return '📄';
    }
  };

  return (
    <div className="bg-surface border border-border rounded-xl overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-border">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">
            Vault & Restoration
          </h2>
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <Clock className="w-3 h-3" />
            <span>Last sync: {lastSync}</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border">
        <button
          onClick={() => setActiveTab('documents')}
          className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === 'documents' 
              ? 'text-white border-b-2 border-work' 
              : 'text-gray-500 hover:text-gray-300'
          }`}
        >
          <div className="flex items-center justify-center gap-2">
            <Folder className="w-4 h-4" />
            Documents
          </div>
        </button>
        <button
          onClick={() => setActiveTab('backups')}
          className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === 'backups' 
              ? 'text-white border-b-2 border-work' 
              : 'text-gray-500 hover:text-gray-300'
          }`}
        >
          <div className="flex items-center justify-center gap-2">
            <Archive className="w-4 h-4" />
            Backups
          </div>
        </button>
        <button
          onClick={() => setActiveTab('handoff')}
          className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === 'handoff' 
              ? 'text-white border-b-2 border-work' 
              : 'text-gray-500 hover:text-gray-300'
          }`}
        >
          <div className="flex items-center justify-center gap-2">
            <Shield className="w-4 h-4" />
            Handoff
          </div>
        </button>
      </div>

      {/* Content */}
      <div className="p-4">
        {activeTab === 'documents' && (
          <div className="space-y-4">
            {/* Search/Filter */}
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Search documents..."
                className="flex-1 bg-surface-light border border-border rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-work"
              />
              <select className="bg-surface-light border border-border rounded-lg px-3 py-2 text-sm text-white">
                <option value="all">All Types</option>
                <option value="soul">Soul Files</option>
                <option value="memory">Memories</option>
                <option value="config">Config</option>
                <option value="schema">Database</option>
              </select>
            </div>

            {/* Document List */}
            <div className="space-y-1 max-h-[400px] overflow-y-auto">
              {documents.map(doc => (
                <div
                  key={doc.id}
                  className="flex items-center gap-3 p-2 rounded-lg hover:bg-surface-light transition-colors group"
                >
                  <span className="text-lg">{getTypeIcon(doc.type)}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`font-medium text-sm ${getTypeColor(doc.type)}`}>
                        {doc.name}
                      </span>
                      <span className="text-xs text-gray-600 px-1.5 py-0.5 bg-surface-light rounded">
                        {doc.type}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 truncate">{doc.description}</p>
                  </div>
                  <button
                    onClick={() => downloadFile(doc)}
                    className="p-1.5 text-gray-500 hover:text-white hover:bg-surface-light rounded transition-colors opacity-0 group-hover:opacity-100"
                    title="Download"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                  <button
                    className="p-1.5 text-gray-500 hover:text-white hover:bg-surface-light rounded transition-colors opacity-0 group-hover:opacity-100"
                    title="View"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>

            {/* Quick Links */}
            <div className="pt-3 border-t border-border">
              <h3 className="text-xs font-medium text-gray-500 uppercase mb-2">Quick Links</h3>
              <div className="flex flex-wrap gap-2">
                <a href="https://github.com/Matweiss/clawd-brain-data" target="_blank" rel="noopener"
                   className="flex items-center gap-1.5 px-3 py-1.5 bg-surface-light hover:bg-border rounded-lg text-xs text-gray-400 hover:text-white transition-colors">
                  <ExternalLink className="w-3 h-3" />
                  GitHub Repo
                </a>
                <a href="https://supabase.com/dashboard/project/nmhbmgtyqutbztdafzjl" target="_blank" rel="noopener"
                   className="flex items-center gap-1.5 px-3 py-1.5 bg-surface-light hover:bg-border rounded-lg text-xs text-gray-400 hover:text-white transition-colors">
                  <Database className="w-3 h-3" />
                  Supabase
                </a>
                <a href="https://vercel.com/mats-projects/clawd-mission-control-v2" target="_blank" rel="noopener"
                   className="flex items-center gap-1.5 px-3 py-1.5 bg-surface-light hover:bg-border rounded-lg text-xs text-gray-400 hover:text-white transition-colors">
                  <ExternalLink className="w-3 h-3" />
                  Vercel
                </a>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'backups' && (
          <div className="space-y-4">
            {/* Generate Backup Button */}
            <button
              onClick={generateBackup}
              disabled={isGenerating}
              className="w-full flex items-center justify-center gap-2 py-3 bg-work/20 hover:bg-work/30 border border-work/30 rounded-lg text-work transition-colors disabled:opacity-50"
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Generating Backup...
                </>
              ) : (
                <>
                  <Archive className="w-4 h-4" />
                  Generate Full Backup
                </>
              )}
            </button>

            {/* Backup List */}
            <div className="space-y-2">
              {backups.map(backup => (
                <div
                  key={backup.id}
                  className="p-3 bg-surface-light rounded-lg border border-border hover:border-gray-600 transition-colors"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {backup.status === 'complete' ? (
                        <CheckCircle className="w-4 h-4 text-green-500" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-yellow-500" />
                      )}
                      <span className="font-medium text-sm">{backup.timestamp}</span>
                    </div>
                    <span className="text-xs text-gray-500">{backup.size}</span>
                  </div>
                  
                  <div className="flex flex-wrap gap-1 mb-3">
                    {backup.components.map(comp => (
                      <span key={comp} className="text-xs text-gray-500 px-1.5 py-0.5 bg-surface rounded">
                        {comp}
                      </span>
                    ))}
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => downloadBackup(backup.id)}
                      className="flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs bg-surface hover:bg-border rounded transition-colors"
                    >
                      <Download className="w-3 h-3" />
                      Download
                    </button>
                    <button className="flex-1 py-1.5 text-xs bg-surface hover:bg-border rounded transition-colors">
                      Restore
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Auto-Backup Settings */}
            <div className="pt-3 border-t border-border">
              <h3 className="text-xs font-medium text-gray-500 uppercase mb-2">Auto-Backup</h3>
              <div className="flex items-center justify-between py-2">
                <span className="text-sm text-gray-400">Daily at 4:00 AM PT</span>
                <span className="text-xs text-green-500">● Enabled</span>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'handoff' && (
          <div className="space-y-4">
            {/* Handoff Package Info */}
            <div className="p-3 bg-surface-light rounded-lg border border-border">
              <div className="flex items-center gap-2 mb-2">
                <Shield className="w-4 h-4 text-work" />
                <span className="font-medium text-sm">Complete Handoff Package</span>
              </div>
              <p className="text-xs text-gray-500 mb-3">
                Contains everything needed to recreate this entire ecosystem from scratch on any platform (Cloud, Docker, VPS, or Local).
              </p>
              <div className="flex flex-wrap gap-2 text-xs">
                <span className="px-2 py-1 bg-surface rounded text-gray-400">SOUL Files</span>
                <span className="px-2 py-1 bg-surface rounded text-gray-400">Agent Repos</span>
                <span className="px-2 py-1 bg-surface rounded text-gray-400">Database Schema</span>
                <span className="px-2 py-1 bg-surface rounded text-gray-400">Mission Control</span>
                <span className="px-2 py-1 bg-surface rounded text-gray-400">Restoration Guide</span>
              </div>
            </div>

            {/* Download Options */}
            <div className="space-y-2">
              <button className="w-full flex items-center justify-between p-3 bg-surface-light hover:bg-border rounded-lg transition-colors">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-blue-400" />
                  <div className="text-left">
                    <div className="text-sm font-medium">handoff.json</div>
                    <div className="text-xs text-gray-500">Complete system manifest</div>
                  </div>
                </div>
                <Download className="w-4 h-4 text-gray-500" />
              </button>

              <button className="w-full flex items-center justify-between p-3 bg-surface-light hover:bg-border rounded-lg transition-colors">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-green-400" />
                  <div className="text-left">
                    <div className="text-sm font-medium">RESTORATION_GUIDE.md</div>
                    <div className="text-xs text-gray-500">Step-by-step recovery instructions</div>
                  </div>
                </div>
                <Download className="w-4 h-4 text-gray-500" />
              </button>

              <button className="w-full flex items-center justify-between p-3 bg-surface-light hover:bg-border rounded-lg transition-colors">
                <div className="flex items-center gap-2">
                  <HardDrive className="w-4 h-4 text-purple-400" />
                  <div className="text-left">
                    <div className="text-sm font-medium">Full Archive</div>
                    <div className="text-xs text-gray-500">backup-2026-02-28.tar.gz (2.4 MB)</div>
                  </div>
                </div>
                <Download className="w-4 h-4 text-gray-500" />
              </button>
            </div>

            {/* Restoration Prompt */}
            <div className="pt-3 border-t border-border">
              <h3 className="text-xs font-medium text-gray-500 uppercase mb-2">Restoration Prompt</h3>
              <div className="p-3 bg-surface-light rounded-lg">
                <p className="text-xs text-gray-400 mb-2">
                  Give this prompt to a new agent to recreate everything:
                </p>
                <div className="relative">
                  <pre className="text-xs text-gray-500 bg-surface p-2 rounded overflow-x-auto">
{`You are restoring the Clawd AI ecosystem.
Read handoff.json and RESTORATION_GUIDE.md
then recreate all agents, dashboards, and integrations.`}
                  </pre>
                  <button className="absolute top-1 right-1 p-1 text-gray-500 hover:text-white">
                    <FileText className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>

            {/* Deployment Options */}
            <div className="pt-3 border-t border-border">
              <h3 className="text-xs font-medium text-gray-500 uppercase mb-2">Deployment Options</h3>
              <div className="grid grid-cols-2 gap-2">
                <div className="p-2 bg-surface-light rounded text-center">
                  <div className="text-lg mb-1">☁️</div>
                  <div className="text-xs font-medium">Cloud</div>
                  <div className="text-xs text-gray-500">OpenClaw Hosted</div>
                </div>
                <div className="p-2 bg-surface-light rounded text-center">
                  <div className="text-lg mb-1">🐳</div>
                  <div className="text-xs font-medium">Docker</div>
                  <div className="text-xs text-gray-500">VPS/Container</div>
                </div>
                <div className="p-2 bg-surface-light rounded text-center">
                  <div className="text-lg mb-1">💻</div>
                  <div className="text-xs font-medium">Local</div>
                  <div className="text-xs text-gray-500">Self-hosted</div>
                </div>
                <div className="p-2 bg-surface-light rounded text-center">
                  <div className="text-lg mb-1">🤖</div>
                  <div className="text-xs font-medium">Auto</div>
                  <div className="text-xs text-gray-500">Best Available</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
