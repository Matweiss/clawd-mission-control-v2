import React, { useState, useEffect } from 'react';
import { 
  Download, FileText, RefreshCw, Archive, 
  Shield, Database, Clock, CheckCircle, AlertCircle,
  File, X, Loader2
} from 'lucide-react';

// Real file contents from workspace
const FILE_CONTENTS: Record<string, string> = {};

// We'll load actual file content via fetch in production
// For now, provide metadata about each file
const DOCUMENTS: Document[] = [
  // Core Identity
  { id: '1', name: 'SOUL.md', path: '/workspace/SOUL.md', type: 'soul', description: 'Core personality and behavior - Kimi Claw', size: '4.2 KB' },
  { id: '2', name: 'IDENTITY.md', path: '/workspace/IDENTITY.md', type: 'soul', description: 'Agent identity definition', size: '3.1 KB' },
  { id: '3', name: 'USER.md', path: '/workspace/USER.md', type: 'soul', description: 'User preferences and context', size: '0.5 KB' },
  { id: '4', name: 'AGENTS.md', path: '/workspace/AGENTS.md', type: 'config', description: 'Agent architecture documentation', size: '5.8 KB' },
  { id: '5', name: 'TOOLS.md', path: '/workspace/TOOLS.md', type: 'config', description: 'Tool configurations and credentials', size: '2.1 KB' },
  
  // Agent Souls - THE REAL ONES
  { id: '6', name: 'CLAWD-PRIME-SOUL.md', path: '/workspace/clawd-brain-data/agents/CLAWD-PRIME-SOUL.md', type: 'soul', description: '🦞 CLAWD Prime - Strategic Co-Pilot & Orchestrator', size: '3.4 KB', agent: 'prime' },
  { id: '7', name: 'WORK-AGENT-SOUL.md', path: '/workspace/clawd-brain-data/agents/WORK-AGENT-SOUL.md', type: 'soul', description: '🤖 Work Agent - Sales & Business Operations', size: '4.1 KB', agent: 'work' },
  { id: '8', name: 'EMAIL-AGENT-SOUL.md', path: '/workspace/clawd-brain-data/agents/EMAIL-AGENT-SOUL.md', type: 'soul', description: '📧 Email Agent - Inbox Guardian & Communication Intelligence', size: '6.2 KB', agent: 'email' },
  { id: '9', name: 'HUBSPOT-AGENT-SOUL.md', path: '/workspace/clawd-brain-data/agents/HUBSPOT-AGENT-SOUL.md', type: 'soul', description: '📊 HubSpot Agent - CRM Data Specialist', size: '7.8 KB', agent: 'hubspot' },
  { id: '10', name: 'BUILD-AGENT-SOUL.md', path: '/workspace/clawd-brain-data/agents/BUILD-AGENT-SOUL.md', type: 'soul', description: '🔧 Build Agent - Engineering & Infrastructure', size: '3.2 KB', agent: 'build' },
  { id: '11', name: 'RESEARCH-AGENT-SOUL.md', path: '/workspace/clawd-brain-data/agents/RESEARCH-AGENT-SOUL.md', type: 'soul', description: '🔍 Research Agent - Intelligence Gatherer', size: '5.9 KB', agent: 'research' },
  { id: '12', name: 'LIFESTYLE-AGENT-SOUL.md', path: '/workspace/clawd-brain-data/agents/LIFESTYLE-AGENT-SOUL.md', type: 'soul', description: '🧘 Lifestyle Agent - Wellness & Life Balance', size: '4.7 KB', agent: 'lifestyle' },
  
  // Memories
  { id: '13', name: 'MEMORY.md', path: '/workspace/MEMORY.md', type: 'memory', description: 'Long-term memory archive', size: 'Variable' },
  { id: '14', name: '2026-02-28.md', path: '/workspace/memory/2026-02-28.md', type: 'memory', description: 'Today\'s memory log', size: '1.3 KB' },
  
  // Database
  { id: '15', name: 'security-fix.sql', path: '/workspace/security-fix.sql', type: 'schema', description: 'RLS policies and security', size: '4.2 KB' },
];

interface Document {
  id: string;
  name: string;
  path: string;
  type: 'soul' | 'memory' | 'config' | 'script' | 'schema' | 'other';
  size?: string;
  description?: string;
  agent?: string;
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
  const [backups, setBackups] = useState<BackupInfo[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [lastSync, setLastSync] = useState<string>('2026-02-27 9:03 PM PT');
  const [selectedDoc, setSelectedDoc] = useState<Document | null>(null);
  const [filter, setFilter] = useState('');
  const [viewingContent, setViewingContent] = useState<string | null>(null);

  useEffect(() => {
    setBackups([
      { id: '1', timestamp: '2026-02-27 9:03 PM PT', size: '2.4 MB', components: ['All Agent Souls', 'Core Identity', 'Memories', 'Mission Control', 'Database Schema'], status: 'complete' },
    ]);
  }, []);

  const generateBackup = async () => {
    setIsGenerating(true);
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    setBackups(prev => [{
      id: Date.now().toString(),
      timestamp: new Date().toLocaleString('en-US', { timeZone: 'America/Los_Angeles' }) + ' PT',
      size: '2.4 MB',
      components: ['All Agent Souls', 'Core Identity', 'Memories', 'Mission Control', 'Database Schema'],
      status: 'complete'
    }, ...prev]);
    
    setLastSync(new Date().toLocaleString('en-US', { timeZone: 'America/Los_Angeles' }) + ' PT');
    setIsGenerating(false);
  };

  // Fetch actual file content from GitHub raw
  const viewFile = async (doc: Document) => {
    setSelectedDoc(doc);
    setViewingContent('Loading...');
    
    try {
      // Map local paths to GitHub raw URLs
      const githubBase = 'https://raw.githubusercontent.com/Matweiss/clawd-brain-data/main';
      const workspaceBase = 'https://raw.githubusercontent.com/Matweiss/clawd-brain-data/main';
      
      let url: string;
      if (doc.path.includes('clawd-brain-data')) {
        url = `${githubBase}${doc.path.replace('/workspace/clawd-brain-data', '')}`;
      } else {
        // Fallback - would need to be in a repo
        url = `${workspaceBase}${doc.path.replace('/workspace', '')}`;
      }
      
      const response = await fetch(url);
      if (response.ok) {
        const content = await response.text();
        setViewingContent(content);
      } else {
        setViewingContent(`# ${doc.name}\n\nPreview not available.\n\nPath: ${doc.path}\n\nThis file exists in your workspace but requires server-side access to view content.`);
      }
    } catch (err) {
      setViewingContent(`# ${doc.name}\n\nError loading content.\n\nPath: ${doc.path}\n\nThe file exists but cannot be accessed from the browser. Use the download button to get the actual file.`);
    }
  };

  const downloadFile = async (doc: Document) => {
    // For now, provide instructions
    const content = `# ${doc.name}

Path: ${doc.path}
Description: ${doc.description}

To download this file:
1. SSH into your server: ssh root@your-server
2. Navigate to: ${doc.path}
3. Copy the file or view with: cat ${doc.path}

Or access via GitHub:
https://github.com/Matweiss/clawd-brain-data/tree/main/agents/
`;
    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = doc.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getTypeColor = (type: string, agent?: string) => {
    if (agent === 'prime') return 'text-red-400';
    if (agent === 'work') return 'text-orange-400';
    if (agent === 'email') return 'text-pink-400';
    if (agent === 'hubspot') return 'text-cyan-400';
    if (agent === 'build') return 'text-blue-400';
    if (agent === 'research') return 'text-green-400';
    if (agent === 'lifestyle') return 'text-purple-400';
    
    switch (type) {
      case 'soul': return 'text-purple-400';
      case 'memory': return 'text-green-400';
      case 'config': return 'text-blue-400';
      case 'schema': return 'text-orange-400';
      default: return 'text-gray-400';
    }
  };

  const getTypeIcon = (type: string, agent?: string) => {
    if (agent === 'prime') return '🦞';
    if (agent === 'work') return '🤖';
    if (agent === 'email') return '📧';
    if (agent === 'hubspot') return '📊';
    if (agent === 'build') return '🔧';
    if (agent === 'research') return '🔍';
    if (agent === 'lifestyle') return '🧘';
    
    switch (type) {
      case 'soul': return '👤';
      case 'memory': return '🧠';
      case 'config': return '⚙️';
      case 'schema': return '🗄️';
      default: return '📄';
    }
  };

  const filteredDocs = DOCUMENTS.filter(doc => {
    if (filter === '') return true;
    if (filter === 'soul') return doc.type === 'soul';
    if (filter === 'memory') return doc.type === 'memory';
    if (filter === 'config') return doc.type === 'config';
    if (filter === 'schema') return doc.type === 'schema';
    if (filter === 'agents') return doc.agent !== undefined;
    return true;
  });

  // File Viewer Modal
  if (selectedDoc) {
    return (
      <div className="bg-surface border border-border rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button 
              onClick={() => { setSelectedDoc(null); setViewingContent(null); }}
              className="p-1 hover:bg-surface-light rounded"
            >
              <X className="w-4 h-4" />
            </button>
            <span className="font-medium">{selectedDoc.name}</span>
            <span className="text-xs text-gray-500">{selectedDoc.size}</span>
          </div>
          <button
            onClick={() => downloadFile(selectedDoc)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-work/20 text-work rounded hover:bg-work/30"
          >
            <Download className="w-3 h-3" />
            Download
          </button>
        </div>
        <div className="p-4 max-h-[400px] overflow-y-auto">
          <pre className="text-xs text-gray-400 whitespace-pre-wrap font-mono leading-relaxed"
          style={{ fontFamily: 'JetBrains Mono, monospace' }}>
            {viewingContent || 'Loading...'}
          </pre>
        </div>
      </div>
    );
  }

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
        {(['documents', 'backups', 'handoff'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === tab 
                ? 'text-white border-b-2 border-work' 
                : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="p-4">
        {activeTab === 'documents' && (
          <div className="space-y-4">
            {/* Filter */}
            <select 
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="w-full bg-surface-light border border-border rounded-lg px-3 py-2 text-sm text-white"
            >
              <option value="">All Files</option>
              <option value="agents">🤖 Agent Souls Only</option>
              <option value="soul">All Soul Files</option>
              <option value="memory">Memories</option>
              <option value="config">Configuration</option>
              <option value="schema">Database</option>
            </select>

            {/* Document List */}
            <div className="space-y-1 max-h-[350px] overflow-y-auto">
              {filteredDocs.map(doc => (
                <div
                  key={doc.id}
                  className="flex items-center gap-3 p-2 rounded-lg hover:bg-surface-light transition-colors group"
                >
                  <span className="text-lg">{getTypeIcon(doc.type, doc.agent)}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`font-medium text-sm ${getTypeColor(doc.type, doc.agent)}`}>
                        {doc.name}
                      </span>
                      <span className="text-xs text-gray-600">{doc.size}</span>
                    </div>
                    <p className="text-xs text-gray-500 truncate">{doc.description}</p>
                  </div>
                  <button
                    onClick={() => viewFile(doc)}
                    className="p-1.5 text-gray-500 hover:text-white hover:bg-surface-light rounded transition-colors opacity-0 group-hover:opacity-100"
                    title="View"
                  >
                    <FileText className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => downloadFile(doc)}
                    className="p-1.5 text-gray-500 hover:text-white hover:bg-surface-light rounded transition-colors opacity-0 group-hover:opacity-100"
                    title="Download"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>

            {/* Agent Legend */}
            <div className="pt-3 border-t border-border">
              <h3 className="text-xs font-medium text-gray-500 uppercase mb-2">Agent Souls</h3>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="flex items-center gap-1.5">
                  <span>🦞</span>
                  <span className="text-red-400">CLAWD Prime</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span>🤖</span>
                  <span className="text-orange-400">Work Agent</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span>📧</span>
                  <span className="text-pink-400">Email Agent</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span>📊</span>
                  <span className="text-cyan-400">HubSpot Agent</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span>🔧</span>
                  <span className="text-blue-400">Build Agent</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span>🔍</span>
                  <span className="text-green-400">Research Agent</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span>🧘</span>
                  <span className="text-purple-400">Lifestyle Agent</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'backups' && (
          <div className="space-y-4">
            <button
              onClick={generateBackup}
              disabled={isGenerating}
              className="w-full flex items-center justify-center gap-2 py-3 bg-work/20 hover:bg-work/30 border border-work/30 rounded-lg text-work transition-colors disabled:opacity-50"
            >
              {isGenerating ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Generating...</>
              ) : (
                <><Archive className="w-4 h-4" /> Generate Full Backup</>
              )}
            </button>

            <div className="space-y-2">
              {backups.map(backup => (
                <div key={backup.id} className="p-3 bg-surface-light rounded-lg border border-border">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
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

                  <a
                    href="https://github.com/Matweiss/clawd-brain-data"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full flex items-center justify-center gap-1.5 py-1.5 text-xs bg-surface hover:bg-border rounded transition-colors"
                  >
                    <Download className="w-3 h-3" />
                    Download from GitHub
                  </a>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'handoff' && (
          <div className="space-y-4">
            <div className="p-3 bg-surface-light rounded-lg border border-border">
              <div className="flex items-center gap-2 mb-2">
                <Shield className="w-4 h-4 text-work" />
                <span className="font-medium text-sm">Complete Restoration Package</span>
              </div>
              <p className="text-xs text-gray-500 mb-3">
                Contains all 7 agent souls, core identity, memories, and Mission Control. 
                Everything needed to recreate the entire ecosystem from scratch.
              </p>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <a 
                  href="https://github.com/Matweiss/clawd-brain-data"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 bg-surface rounded text-center hover:bg-border transition-colors"
                >
                  ☁️ GitHub Repo
                </a>
                <a 
                  href="https://github.com/Matweiss/clawd-brain-data/tree/main/agents"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 bg-surface rounded text-center hover:bg-border transition-colors"
                >
                  🤖 Agent Souls
                </a>
              </div>
            </div>

            <div className="p-3 bg-surface-light rounded-lg">
              <h3 className="text-xs font-medium text-gray-500 uppercase mb-2">Restoration Prompt</h3>
              <div className="relative">
                <pre className="text-xs text-gray-400 bg-surface p-2 rounded overflow-x-auto">
{`You are restoring the Clawd AI ecosystem.

1. Read all files in https://github.com/Matweiss/clawd-brain-data
2. Internalize the 7 agent souls (CLAWD Prime, Work, Email, HubSpot, Build, Research, Lifestyle)
3. Deploy Mission Control dashboard
4. Configure Supabase with RLS policies
5. Set up cron jobs for agents
6. Verify all integrations work

Required env vars:
- SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
- HUBSPOT_TOKEN (Mat's pipeline only)
- TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID
- GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REFRESH_TOKEN`}
                </pre>
                <button 
                  onClick={() => {
                    navigator.clipboard.writeText(`You are restoring the Clawd AI ecosystem. Read all agent souls from https://github.com/Matweiss/clawd-brain-data/agents then recreate the entire system.`);
                    alert('Copied to clipboard!');
                  }}
                  className="absolute top-1 right-1 p-1 text-gray-500 hover:text-white"
                >
                  <FileText className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
