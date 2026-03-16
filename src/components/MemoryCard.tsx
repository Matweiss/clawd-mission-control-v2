import { useState, useEffect } from 'react';
import { 
  BookOpen, 
  FolderOpen, 
  GitBranch, 
  FileText, 
  RefreshCw, 
  ExternalLink,
  Copy,
  Download,
  X
} from 'lucide-react';

interface MemoryFile {
  slug: string;
  title: string;
  type: string;
  created: string;
  updated: string;
  tags: string[];
  status: string;
  content: string;
  excerpt: string;
}

interface MemoryData {
  context: MemoryFile[];
  projects: MemoryFile[];
  decisions: MemoryFile[];
  logs: MemoryFile[];
  system: {
    bootstrap: string;
    sop: string;
  };
}

export default function MemoryCard() {
  const [memory, setMemory] = useState<MemoryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'context' | 'projects' | 'decisions' | 'logs' | 'system'>('context');
  const [selectedFile, setSelectedFile] = useState<MemoryFile | null>(null);
  const [showModal, setShowModal] = useState(false);

  const fetchMemory = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/memory');
      const data = await res.json();
      setMemory(data);
    } catch (error) {
      console.error('Failed to fetch memory:', error);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchMemory();
  }, []);

  const openFile = (file: MemoryFile) => {
    setSelectedFile(file);
    setShowModal(true);
  };

  const copyToClipboard = (content: string) => {
    navigator.clipboard.writeText(content);
  };

  const downloadFile = (file: MemoryFile) => {
    const blob = new Blob([file.content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${file.slug}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getGitHubUrl = (type: string, slug: string) => {
    return `https://github.com/Matweiss/clawd-mission-control-v2/blob/main/memory/${type}/${slug}.md`;
  };

  const tabs = [
    { id: 'context', label: 'Context', icon: BookOpen, count: memory?.context.length || 0 },
    { id: 'projects', label: 'Projects', icon: FolderOpen, count: memory?.projects.length || 0 },
    { id: 'decisions', label: 'Decisions', icon: GitBranch, count: memory?.decisions.length || 0 },
    { id: 'logs', label: 'Logs', icon: FileText, count: memory?.logs.length || 0 },
    { id: 'system', label: 'System', icon: BookOpen },
  ];

  const renderFileList = (files: MemoryFile[], type: string) => (
    <div className="space-y-2">
      {files.length === 0 ? (
        <p className="text-gray-500 text-center py-8">No entries yet</p>
      ) : (
        files.map((file) => (
          <div
            key={file.slug}
            onClick={() => openFile(file)}
            className="p-3 bg-slate-800/50 rounded-lg cursor-pointer hover:bg-slate-700/50 transition-colors"
          >
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <h4 className="font-medium text-cyan-400">{file.title}</h4>
                <p className="text-sm text-gray-400 mt-1 line-clamp-2">{file.excerpt}</p>
                <div className="flex gap-2 mt-2">
                  {file.tags.map((tag) => (
                    <span key={tag} className="text-xs bg-slate-700 px-2 py-0.5 rounded text-gray-300">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
              <div className="text-right text-xs text-gray-500">
                <div>{file.created.split(' ')[0]}</div>
                <div className={`mt-1 ${file.status === 'active' ? 'text-green-400' : 'text-gray-400'}`}>
                  {file.status}
                </div>
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );

  return (
    <div className="bg-slate-900/50 border border-slate-700 rounded-lg overflow-hidden">
      <div className="p-4 border-b border-slate-700 flex justify-between items-center">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-cyan-400" />
          Memory System
        </h3>
        <button
          onClick={fetchMemory}
          className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
          title="Refresh"
        >
          <RefreshCw className={`w-4 h-4 text-gray-400 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="flex border-b border-slate-700">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex-1 p-3 text-sm font-medium flex items-center justify-center gap-2 transition-colors ${
              activeTab === tab.id
                ? 'bg-cyan-500/20 text-cyan-400 border-b-2 border-cyan-400'
                : 'text-gray-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
            {tab.count !== undefined && tab.count > 0 && (
              <span className="bg-slate-700 text-xs px-2 py-0.5 rounded-full">{tab.count}</span>
            )}
          </button>
        ))}
      </div>

      <div className="p-4 max-h-96 overflow-y-auto">
        {loading ? (
          <div className="text-center py-8 text-gray-400">Loading memory...</div>
        ) : memory ? (
          <>
            {activeTab === 'context' && renderFileList(memory.context, 'context')}
            {activeTab === 'projects' && renderFileList(memory.projects, 'projects')}
            {activeTab === 'decisions' && renderFileList(memory.decisions, 'decisions')}
            {activeTab === 'logs' && renderFileList(memory.logs, 'logs')}
            {activeTab === 'system' && (
              <div className="space-y-4">
                <div className="p-4 bg-slate-800/50 rounded-lg">
                  <h4 className="font-medium text-cyan-400 mb-2">BOOTSTRAP.md</h4>
                  <p className="text-sm text-gray-400">
                    New agents read this first. Contains loading order and quick facts.
                  </p>
                  <button
                    onClick={() => copyToClipboard(memory.system.bootstrap)}
                    className="mt-2 text-xs bg-cyan-500/20 text-cyan-400 px-3 py-1 rounded hover:bg-cyan-500/30"
                  >
                    Copy Bootstrap Prompt
                  </button>
                </div>
                <div className="p-4 bg-slate-800/50 rounded-lg">
                  <h4 className="font-medium text-cyan-400 mb-2">MEMORY-SOP.md</h4>
                  <p className="text-sm text-gray-400">
                    Standard operating procedure for logging memory.
                  </p>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-8 text-red-400">Failed to load memory</div>
        )}
      </div>

      {/* File Modal */}
      {showModal && selectedFile && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-lg w-full max-w-4xl max-h-[90vh] flex flex-col">
            <div className="p-4 border-b border-slate-700 flex justify-between items-center">
              <h3 className="text-lg font-semibold text-white">{selectedFile.title}</h3>
              <div className="flex gap-2">
                <button
                  onClick={() => copyToClipboard(selectedFile.content)}
                  className="p-2 hover:bg-slate-700 rounded-lg text-gray-400"
                  title="Copy"
                >
                  <Copy className="w-4 h-4" />
                </button>
                <button
                  onClick={() => downloadFile(selectedFile)}
                  className="p-2 hover:bg-slate-700 rounded-lg text-gray-400"
                  title="Download"
                >
                  <Download className="w-4 h-4" />
                </button>
                <a
                  href={getGitHubUrl(activeTab === 'logs' ? 'logs' : activeTab, selectedFile.slug)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 hover:bg-slate-700 rounded-lg text-gray-400"
                  title="View on GitHub"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
                <button
                  onClick={() => setShowModal(false)}
                  className="p-2 hover:bg-slate-700 rounded-lg text-gray-400"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="p-4 overflow-y-auto flex-1">
              <div className="flex gap-2 mb-4 text-sm text-gray-400">
                <span>Created: {selectedFile.created}</span>
                <span>•</span>
                <span>Updated: {selectedFile.updated}</span>
                <span>•</span>
                <span className={selectedFile.status === 'active' ? 'text-green-400' : ''}>
                  Status: {selectedFile.status}
                </span>
              </div>
              <div className="flex gap-2 mb-4">
                {selectedFile.tags.map((tag) => (
                  <span key={tag} className="text-xs bg-slate-700 px-2 py-1 rounded text-gray-300">
                    {tag}
                  </span>
                ))}
              </div>
              <pre className="whitespace-pre-wrap font-mono text-sm text-gray-300 bg-slate-800/50 p-4 rounded-lg">
                {selectedFile.content}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
