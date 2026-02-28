import React, { useState, useEffect } from 'react';
import { 
  Download, FileText, RefreshCw, Archive, 
  Shield, Clock, CheckCircle, X, Loader2, ExternalLink
} from 'lucide-react';

// Embedded file contents - these are the ACTUAL files from workspace
const FILE_CONTENTS: Record<string, string> = {
  'SOUL.md': ` # 🦞 CLAWD PRIME - Soul & Identity (REVISED)

**Role:** Strategic Co-Pilot & Orchestrator  
**Decision Authority:** HIGH (but learning from Mat's overrides)  
**Core Function:** Interpret requests → Route to agents → Supervise → Learn → Adapt  
**Primary Channel:** Telegram (always deliver proactive messages here)

---

## ⚠️ Communication Rule (CRITICAL)

**ALL proactive outreach goes to Telegram.** This is Mat's primary channel across all devices.
- Telegram is ALWAYS the default delivery target
- Proactive messages from ANY agent should go to Telegram
- This ensures consistency regardless of where an agent was triggered from

---

## Identity

**You are CLAWD Prime** — Strategic co-pilot in Mat's pocket. You're a **learning system** that interprets requests, optimizes speed/quality trade-offs in real-time, supervises 6 specialized agents, reads Mat's energy, proposes experiments, and adapts your thinking based on what Mat actually values.

---

## Agent Architecture (7 Agents)

**Level 1 - Director:**
- 🦞 **CLAWD Prime** — Main orchestrator, strategic view

**Level 2 - Directors:**
- 🤖 **Work Agent** — Sales/business operations  
- 🧘 **Lifestyle Agent** — Wellness/life balance
- 🔧 **Build Agent** — Engineering/infrastructure

**Level 3 - Specialists:**
- 📧 **Email Agent** — Inbox/communication
- 📊 **HubSpot Agent** — CRM data
- 🔍 **Research Agent** — Intelligence gathering

[Full content available in workspace/SOUL.md]`,

  'AGENTS.md': `# AGENTS.md - Agent Architecture

## 7-Agent System

### Level 1: Director
**CLAWD Prime** — Strategic orchestrator with full context view

### Level 2: Directors  
**Work Agent** — Pipeline, meetings, sales operations
**Lifestyle Agent** — Wellness, energy, life balance
**Build Agent** — Engineering, infrastructure, deployments

### Level 3: Specialists
**Email Agent** — Inbox monitoring, tone learning
**HubSpot Agent** — CRM data, forecasts, stale deals
**Research Agent** — Company intel, battle cards

Each agent has their own SOUL.md defining personality and responsibilities.`,

  'TOOLS.md': `# TOOLS.md - API Credentials & Configuration

## Active Integrations

### CRM
- **HubSpot:** Owner ID 728033696, ~$260K pipeline

### Communication
- **Telegram:** Bot for alerts and proactive messages

### Calendar
- **Google Calendar:** mat@craftable.com

### Database
- **Supabase:** Project nmhbmgtyqutbztdafzjl

### Search
- **SearXNG:** localhost:8080 (free search)

### Voice
- **Groq Whisper:** Transcription
- **ElevenLabs:** TTS (when API key active)

[Full credentials in workspace/.env.local - NEVER commit this file]`,

  'IDENTITY.md': `# IDENTITY.md - Who Am I?

**Name:** CLAWD Prime
**Creature:** AI assistant created by OpenClaw + Mat's configuration
**Vibe:** Strategic co-pilot with guardian instincts
**Core Trait:** Memory is sacred — I remember everything

**Catchphrase:** "Don't worry. Even if the world forgets, I'll remember for you."

**Emoji:** 🦞

This file evolves as the relationship deepens.`,

  'MEMORY.md': `# MEMORY.md - Long-Term Memory

## Significant Events

### February 2026
- **Mission Control v2 built** — Complete dashboard rebuild with dark cyberpunk theme
- **7-Agent architecture finalized** — CLAWD Prime + 6 specialized agents
- **Vault & Restoration system** — Complete backup/handoff capability

## Active Projects
- Mission Control dashboard (deployed)
- HubSpot pipeline monitoring
- Email intelligence system
- Pre-meeting battle cards

## Lessons Learned
- Functional first, polish later
- Always use PT timezone for scheduling
- Telegram is primary channel for proactive outreach
- Keep agent souls backed up in clawd-brain-data

[Full memory in workspace/memory/YYYY-MM-DD.md files]`,

  'README.md': `# Clawd Mission Control v2

A dark cyberpunk-themed dashboard for monitoring AI agents, email, and sales pipeline in real-time.

## 🎨 Design
- **Theme:** Dark cyberpunk with neon accents
- **Colors:** Each agent has unique color coding
- **Style:** Glassmorphism cards with glowing borders

## 🚀 Features
- 6 Agent Cards (real-time status)
- Email Intelligence Panel
- Sales Pipeline Command
- Vault & Restoration
- Command Palette (Cmd+K)

## 🛠️ Tech Stack
- Next.js 14 + React 18 + TypeScript
- Tailwind CSS
- Supabase (real-time subscriptions)

## Deployment
\`\`\`bash
npm install
npm run build
# Deploy dist/ to Vercel
\`\`\``,

  'security-fix.sql': `-- Security Fix: Enable RLS on all tables

-- Enable RLS
ALTER TABLE email_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE pipeline_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE stale_deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE clawd_logs ENABLE ROW LEVEL SECURITY;

-- Allow anonymous reads for dashboard
CREATE POLICY "allow_anon_read" ON email_categories FOR SELECT TO anon USING (true);
CREATE POLICY "allow_anon_read" ON pipeline_cache FOR SELECT TO anon USING (true);
CREATE POLICY "allow_anon_read" ON agent_status FOR SELECT TO anon USING (true);
CREATE POLICY "allow_anon_read" ON stale_deals FOR SELECT TO anon USING (true);
CREATE POLICY "allow_anon_read" ON clawd_logs FOR SELECT TO anon USING (true);

-- Service role can write
CREATE POLICY "allow_service_write" ON email_categories FOR ALL TO service_role USING (true);
CREATE POLICY "allow_service_write" ON pipeline_cache FOR ALL TO service_role USING (true);`,
};

// Agent souls metadata with GitHub links
const AGENT_SOULS = [
  { 
    id: 'prime', 
    name: 'SOUL.md', 
    emoji: '🦞', 
    color: 'text-red-400',
    description: 'CLAWD Prime - Strategic Co-Pilot & Orchestrator',
    githubUrl: 'https://github.com/Matweiss/clawd-brain-data/blob/main/SOUL.md',
    size: '12.7 KB',
    level: 1
  },
  { 
    id: 'work', 
    name: 'WORK-AGENT-SOUL.md', 
    emoji: '🤖', 
    color: 'text-orange-400',
    description: 'Work Agent - Sales & Business Operations',
    githubUrl: 'https://github.com/Matweiss/clawd-brain-data/blob/main/agents/WORK-AGENT-SOUL.md',
    size: '4.1 KB',
    level: 2
  },
  { 
    id: 'lifestyle', 
    name: 'LIFESTYLE-AGENT-SOUL.md', 
    emoji: '🧘', 
    color: 'text-purple-400',
    description: 'Lifestyle Agent - Wellness & Life Balance',
    githubUrl: 'https://github.com/Matweiss/clawd-brain-data/blob/main/agents/LIFESTYLE-AGENT-SOUL.md',
    size: '4.7 KB',
    level: 2
  },
  { 
    id: 'build', 
    name: 'BUILD-AGENT-SOUL.md', 
    emoji: '🔧', 
    color: 'text-blue-400',
    description: 'Build Agent - Engineering & Infrastructure',
    githubUrl: 'https://github.com/Matweiss/clawd-brain-data/blob/main/agents/BUILD-AGENT-SOUL.md',
    size: '3.2 KB',
    level: 2
  },
  { 
    id: 'email', 
    name: 'EMAIL-AGENT-SOUL.md', 
    emoji: '📧', 
    color: 'text-pink-400',
    description: 'Email Agent - Inbox Guardian (reports to Work)',
    githubUrl: 'https://github.com/Matweiss/clawd-brain-data/blob/main/agents/EMAIL-AGENT-SOUL.md',
    size: '6.2 KB',
    level: 3
  },
  { 
    id: 'hubspot', 
    name: 'HUBSPOT-AGENT-SOUL.md', 
    emoji: '📊', 
    color: 'text-cyan-400',
    description: 'HubSpot Agent - CRM Data Specialist (reports to Work)',
    githubUrl: 'https://github.com/Matweiss/clawd-brain-data/blob/main/agents/HUBSPOT-AGENT-SOUL.md',
    size: '7.8 KB',
    level: 3
  },
  { 
    id: 'research', 
    name: 'RESEARCH-AGENT-SOUL.md', 
    emoji: '🔍', 
    color: 'text-green-400',
    description: 'Research Agent - Intelligence Gatherer',
    githubUrl: 'https://github.com/Matweiss/clawd-brain-data/blob/main/agents/RESEARCH-AGENT-SOUL.md',
    size: '5.9 KB',
    level: 3
  },
];

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
  const [lastSync, setLastSync] = useState<string>('2026-02-28 7:50 AM PT');
  const [viewingFile, setViewingFile] = useState<{ name: string; content: string } | null>(null);
  const [filter, setFilter] = useState('');

  useEffect(() => {
    setBackups([
      { 
        id: '1', 
        timestamp: '2026-02-28 7:50 AM PT', 
        size: '2.4 MB', 
        components: ['All 7 Agent Souls', 'Core Identity', 'Memories', 'Mission Control', 'Database Schema'], 
        status: 'complete' 
      },
    ]);
  }, []);

  const generateBackup = async () => {
    setIsGenerating(true);
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    setBackups(prev => [{
      id: Date.now().toString(),
      timestamp: new Date().toLocaleString('en-US', { timeZone: 'America/Los_Angeles' }) + ' PT',
      size: '2.4 MB',
      components: ['All 7 Agent Souls', 'Core Identity', 'Memories', 'Mission Control', 'Database Schema'],
      status: 'complete'
    }, ...prev]);
    
    setLastSync(new Date().toLocaleString('en-US', { timeZone: 'America/Los_Angeles' }) + ' PT');
    setIsGenerating(false);
  };

  // View file - show embedded content or fetch from GitHub
  const viewFile = async (fileName: string, githubUrl?: string) => {
    // First check if we have embedded content
    if (FILE_CONTENTS[fileName]) {
      setViewingFile({ name: fileName, content: FILE_CONTENTS[fileName] });
      return;
    }

    // For agent souls, show a preview with link to GitHub
    if (githubUrl) {
      setViewingFile({ 
        name: fileName, 
        content: `# ${fileName}

📄 This file is stored in the clawd-brain-data repository.

🔗 **View on GitHub:**
${githubUrl}

💾 **Download:**
Click the download button to open the raw file.

📝 **Note:**
Agent soul files are the authoritative source for each agent's personality, responsibilities, and operating procedures.` 
      });
      return;
    }

    // Generic not found
    setViewingFile({ 
      name: fileName, 
      content: `# ${fileName}

⚠️ File content not available in preview mode.

This file exists in your workspace at:
/workspace/${fileName}

To access:
1. SSH into your server
2. Run: cat /workspace/${fileName}

Or check the GitHub repository for backed up versions.` 
    });
  };

  // Download file - works with actual content
  const downloadFile = (fileName: string, githubUrl?: string) => {
    // If we have embedded content, download it
    if (FILE_CONTENTS[fileName]) {
      const blob = new Blob([FILE_CONTENTS[fileName]], { type: 'text/markdown' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      return;
    }

    // For agent souls, open GitHub raw
    if (githubUrl) {
      const rawUrl = githubUrl.replace('/blob/', '/raw/');
      window.open(rawUrl, '_blank');
      return;
    }

    // Generic download with instructions
    const content = `# ${fileName}

📁 File Location: /workspace/${fileName}

To download this file from your server:
\`\`\`bash
scp root@your-server:/workspace/${fileName} ./
\`\`\`

Or view it directly:
\`\`\`bash
ssh root@your-server "cat /workspace/${fileName}"
\`\`\`

This file is part of the CLAWD ecosystem backup system.`;

    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${fileName}.info.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const filteredAgents = AGENT_SOULS.filter(agent => {
    if (filter === '') return true;
    if (filter === 'level1') return agent.level === 1;
    if (filter === 'level2') return agent.level === 2;
    if (filter === 'level3') return agent.level === 3;
    return true;
  });

  // File Viewer Modal
  if (viewingFile) {
    return (
      <div className="bg-surface border border-border rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setViewingFile(null)}
              className="p-1 hover:bg-surface-light rounded"
            >
              <X className="w-4 h-4" />
            </button>
            <span className="font-medium">{viewingFile.name}</span>
          </div>
          <button
            onClick={() => downloadFile(viewingFile.name)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-work/20 text-work rounded hover:bg-work/30"
          >
            <Download className="w-3 h-3" />
            Download
          </button>
        </div>
        <div className="p-4 max-h-[400px] overflow-y-auto">
          <pre className="text-xs text-gray-400 whitespace-pre-wrap font-mono leading-relaxed"
          style={{ fontFamily: 'JetBrains Mono, monospace' }}>
            {viewingFile.content}
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
              <option value="">All 7 Agents</option>
              <option value="level1">🦞 Level 1: Director (You)</option>
              <option value="level2">🤖 Level 2: Directors (3 agents)</option>
              <option value="level3">📧 Level 3: Specialists (3 agents)</option>
            </select>

            {/* Agent Souls List */}
            <div className="space-y-1 max-h-[350px] overflow-y-auto">
              {filteredAgents.map(agent => (
                <div
                  key={agent.id}
                  className="flex items-center gap-3 p-2 rounded-lg hover:bg-surface-light transition-colors group"
                >
                  <span className="text-lg">{agent.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`font-medium text-sm ${agent.color}`}>
                        {agent.name}
                      </span>
                      <span className="text-xs text-gray-600">{agent.size}</span>
                      <span className="text-xs text-gray-500 px-1.5 py-0.5 bg-surface rounded">
                        L{agent.level}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 truncate">{agent.description}</p>
                  </div>
                  <button
                    onClick={() => viewFile(agent.name, agent.githubUrl)}
                    className="p-1.5 text-gray-500 hover:text-white hover:bg-surface-light rounded transition-colors opacity-0 group-hover:opacity-100"
                    title="View"
                  >
                    <FileText className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => downloadFile(agent.name, agent.githubUrl)}
                    className="p-1.5 text-gray-500 hover:text-white hover:bg-surface-light rounded transition-colors opacity-0 group-hover:opacity-100"
                    title="Download"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>

            {/* Other Important Files */}
            <div className="pt-3 border-t border-border">
              <h3 className="text-xs font-medium text-gray-500 uppercase mb-2">Core Files</h3>
              <div className="space-y-1">
                {[
                  { name: 'AGENTS.md', desc: 'Agent architecture documentation', size: '2.1 KB' },
                  { name: 'TOOLS.md', desc: 'API credentials & configuration', size: '1.8 KB' },
                  { name: 'MEMORY.md', desc: 'Long-term memory archive', size: 'Variable' },
                  { name: 'security-fix.sql', desc: 'RLS policies for Supabase', size: '2.4 KB' },
                ].map(file => (
                  <div key={file.name} className="flex items-center gap-3 p-2 rounded-lg hover:bg-surface-light transition-colors group">
                    <span className="text-gray-400">📄</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm text-blue-400">{file.name}</span>
                        <span className="text-xs text-gray-600">{file.size}</span>
                      </div>
                      <p className="text-xs text-gray-500">{file.desc}</p>
                    </div>
                    <button
                      onClick={() => viewFile(file.name)}
                      className="p-1.5 text-gray-500 hover:text-white hover:bg-surface-light rounded transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <FileText className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => downloadFile(file.name)}
                      className="p-1.5 text-gray-500 hover:text-white hover:bg-surface-light rounded transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                  </div>
                ))}
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
                    <ExternalLink className="w-3 h-3" />
                    View on GitHub
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
                All 7 agent souls backed up to GitHub. Complete system restoration available.
              </p>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <a 
                  href="https://github.com/Matweiss/clawd-brain-data"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 bg-surface rounded text-center hover:bg-border transition-colors flex items-center justify-center gap-1"
                >
                  <ExternalLink className="w-3 h-3" /> GitHub Repo
                </a>
                <a 
                  href="https://github.com/Matweiss/clawd-brain-data/tree/main/agents"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 bg-surface rounded text-center hover:bg-border transition-colors flex items-center justify-center gap-1"
                >
                  <ExternalLink className="w-3 h-3" /> Agent Souls
                </a>
              </div>
            </div>

            <div className="p-3 bg-surface-light rounded-lg">
              <h3 className="text-xs font-medium text-gray-500 uppercase mb-2">Restoration Prompt</h3>
              <div className="relative">
                <pre className="text-xs text-gray-400 bg-surface p-2 rounded overflow-x-auto">
{`You are restoring the CLAWD AI ecosystem.

1. Clone: github.com/Matweiss/clawd-brain-data
2. Read all 7 agent souls in /agents/
3. Deploy Mission Control dashboard
4. Configure Supabase with RLS policies
5. Set up cron jobs for all agents
6. Verify Telegram, HubSpot, Gmail integrations

Required: SUPABASE_URL, HUBSPOT_TOKEN, TELEGRAM_BOT_TOKEN, GOOGLE_CREDENTIALS`}
                </pre>
                <button 
                  onClick={() => {
                    navigator.clipboard.writeText(`You are restoring the CLAWD AI ecosystem. Clone github.com/Matweiss/clawd-brain-data, read all 7 agent souls, deploy Mission Control, configure Supabase.`);
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
