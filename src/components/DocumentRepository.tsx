import React, { useState, useEffect } from 'react';
import {
  Download,
  FileText,
  RefreshCw,
  Archive,
  Shield,
  Clock,
  CheckCircle,
  X,
  Loader2,
  ExternalLink,
  Copy,
} from 'lucide-react';

interface MemoryFile {
  slug: string;
  name: string;
  title: string;
  type: string;
  created: string;
  updated: string;
  tags: string[];
  status: string;
  excerpt: string;
  content: string;
}

interface BackupInfo {
  name: string;
  size: number;
  created: string;
}

export function DocumentRepository() {
  const [activeTab, setActiveTab] = useState<'memory' | 'backups' | 'restore'>('memory');
  const [memoryType, setMemoryType] = useState<'context' | 'projects' | 'decisions' | 'logs'>('context');
  const [files, setFiles] = useState<MemoryFile[]>([]);
  const [backups, setBackups] = useState<BackupInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [viewingFile, setViewingFile] = useState<MemoryFile | null>(null);
  const [lastSync, setLastSync] = useState<string>('Never');

  const fetchVaultData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/system/vault');
      if (res.ok) {
        const data = await res.json();
        setBackups(data.backups || []);
        setLastSync(new Date().toLocaleString('en-US', { timeZone: 'America/Los_Angeles' }) + ' PT');
      }
    } catch (err) {
      console.error('Failed to fetch vault:', err);
    }
    setLoading(false);
  };

  const fetchMemoryFiles = async (type: string) => {
    setLoading(true);
    try {
      const res = await fetch('/api/memory');
      if (res.ok) {
        const data = await res.json();
        setFiles(data[type] || []);
      }
    } catch (err) {
      console.error('Failed to fetch memory:', err);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchVaultData();
  }, []);

  useEffect(() => {
    if (activeTab === 'memory') {
      fetchMemoryFiles(memoryType);
    }
  }, [activeTab, memoryType]);

  const generateBackup = async () => {
    setGenerating(true);
    try {
      const res = await fetch('/api/system/backup', { method: 'POST' });
      if (res.ok) {
        await fetchVaultData();
      }
    } catch (err) {
      console.error('Backup failed:', err);
    }
    setGenerating(false);
  };

  const downloadFile = (file: MemoryFile) => {
    const blob = new Blob([file.content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = file.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (viewingFile) {
    return (
      <div className="bg-surface border border-border rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button onClick={() => setViewingFile(null)} className="p-1 hover:bg-surface-light rounded">
              <X className="w-4 h-4" />
            </button>
            <span className="font-medium truncate max-w-[200px]">{viewingFile.title}</span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => copyToClipboard(viewingFile.content)}
              className="p-2 hover:bg-surface-light rounded-lg"
              title="Copy"
            >
              <Copy className="w-4 h-4" />
            </button>
            <button
              onClick={() => downloadFile(viewingFile)}
              className="p-2 hover:bg-surface-light rounded-lg"
              title="Download"
            >
              <Download className="w-4 h-4" />
            </button>
          </div>
        </div>
        <div className="p-4 max-h-[400px] overflow-y-auto">
          <pre className="text-sm text-gray-300 whitespace-pre-wrap font-mono">
            {viewingFile.content}
          </pre>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-surface border border-border rounded-xl overflow-hidden">
      <div className="px-4 py-3 border-b border-border">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Vault & Restoration</h2>
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <Clock className="w-3 h-3" />
            <span>{lastSync}</span>
            <button onClick={fetchVaultData} className="p-1 hover:bg-surface-light rounded">
              <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      <div className="flex border-b border-border">
        {(['memory', 'backups', 'restore'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === tab ? 'text-white border-b-2 border-work' : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      <div className="p-4">
        {activeTab === 'memory' && (
          <div className="space-y-3">
            <select
              value={memoryType}
              onChange={(e) => setMemoryType(e.target.value as any)}
              className="w-full bg-surface-light border border-border rounded-lg px-3 py-2 text-sm"
            >
              <option value="context">Context (Core)</option>
              <option value="projects">Projects</option>
              <option value="decisions">Decisions</option>
              <option value="logs">Logs</option>
            </select>

            {loading ? (
              <div className="text-center py-8 text-gray-500">
                <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                Loading...
              </div>
            ) : files.length === 0 ? (
              <div className="text-center py-8 text-gray-500">No files yet</div>
            ) : (
              <div className="space-y-2 max-h-[300px] overflow-y-auto">
                {files.map((file) => (
                  <div
                    key={file.slug}
                    onClick={() => setViewingFile(file)}
                    className="p-3 bg-surface-light rounded-lg cursor-pointer hover:bg-border transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-sm text-blue-400">{file.title}</span>
                      <span className="text-xs text-gray-500">{file.created.split(' ')[0]}</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1 truncate">{file.excerpt}</p>
                    <div className="flex gap-1 mt-2">
                      {file.tags.slice(0, 3).map((tag) => (
                        <span key={tag} className="text-xs bg-surface px-1.5 py-0.5 rounded text-gray-400">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'backups' && (
          <div className="space-y-3">
            <button
              onClick={generateBackup}
              disabled={generating}
              className="w-full flex items-center justify-center gap-2 py-3 bg-work/20 hover:bg-work/30 border border-work/30 rounded-lg text-work disabled:opacity-50"
            >
              {generating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Generating...
                </>
              ) : (
                <>
                  <Archive className="w-4 h-4" /> Generate Backup
                </>
              )}
            </button>

            {backups.length === 0 ? (
              <div className="text-center py-6 text-gray-500">No backups yet</div>
            ) : (
              <div className="space-y-2 max-h-[250px] overflow-y-auto">
                {backups.map((backup) => (
                  <div key={backup.name} className="p-3 bg-surface-light rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        <span className="text-sm">{new Date(backup.created).toLocaleString()}</span>
                      </div>
                      <span className="text-xs text-gray-500">{formatBytes(backup.size)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'restore' && (
          <div className="space-y-3">
            <div className="p-3 bg-surface-light rounded-lg border border-border">
              <div className="flex items-center gap-2 mb-2">
                <Shield className="w-4 h-4 text-work" />
                <span className="font-medium text-sm">Bootstrap from GitHub</span>
              </div>
              <p className="text-xs text-gray-500 mb-3">
                New agents can bootstrap from the GitHub repo with full context.
              </p>
              <a
                href="https://github.com/Matweiss/clawd-mission-control-v2/tree/main/memory"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-1.5 py-2 text-xs bg-surface rounded hover:bg-border transition-colors"
              >
                <ExternalLink className="w-3 h-3" /> View Memory on GitHub
              </a>
            </div>

            <div className="p-3 bg-surface-light rounded-lg">
              <p className="text-xs text-gray-500 mb-2">Bootstrap Prompt</p>
              <pre className="text-xs text-gray-400 bg-surface p-2 rounded overflow-x-auto">
                {`Read github.com/Matweiss/clawd-mission-control-v2/memory/BOOTSTRAP.md then follow the loading order.`}
              </pre>
              <button
                onClick={() =>
                  copyToClipboard(
                    'Read github.com/Matweiss/clawd-mission-control-v2/memory/BOOTSTRAP.md then follow the loading order.'
                  )
                }
                className="mt-2 w-full py-1.5 text-xs bg-surface hover:bg-border rounded transition-colors"
              >
                Copy Prompt
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
