import React, { useState, useEffect } from 'react';
import { 
  Brain, 
  FileText, 
  GitCommit, 
  ExternalLink, 
  Download, 
  Calendar,
  Tag,
  Clock,
  RefreshCw,
  Search,
  FolderOpen,
  Plus,
  Network,
  Mic
} from 'lucide-react';
import { MemoryEditor } from './MemoryEditor';
import { MemoryGraph } from './MemoryGraph';
import { ExportModal } from './ExportModal';

interface BrainDataFile {
  path: string;
  filename: string;
  title: string;
  date: string;
  type: string;
  tags: string[];
  preview: string;
  lastModified: string;
}

interface BrainDataStats {
  total: number;
  memories: number;
  handoffs: number;
  docs: number;
  daily: number;
  lastSync: string;
}

export function BrainDataPanel() {
  const [files, setFiles] = useState<BrainDataFile[]>([]);
  const [stats, setStats] = useState<BrainDataStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'memories' | 'handoffs' | 'docs' | 'daily'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFile, setSelectedFile] = useState<BrainDataFile | null>(null);
  const [showEditor, setShowEditor] = useState(false);
  const [showGraph, setShowGraph] = useState(false);
  const [showExport, setShowExport] = useState(false);

  useEffect(() => {
    fetchBrainData();
  }, [activeTab]);

  const fetchBrainData = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/brain-data?type=${activeTab}&limit=20`);
      if (response.ok) {
        const data = await response.json();
        setFiles(data.files);
        setStats({
          total: data.total,
          memories: data.files.filter((f: BrainDataFile) => f.path.includes('memories')).length,
          handoffs: data.files.filter((f: BrainDataFile) => f.path.includes('handoffs')).length,
          docs: data.files.filter((f: BrainDataFile) => f.path.includes('docs')).length,
          daily: data.files.filter((f: BrainDataFile) => f.path.includes('daily')).length,
          lastSync: new Date().toISOString()
        });
      }
    } catch (error) {
      console.error('Failed to fetch brain data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getGitHubUrl = (path: string) => {
    return `https://github.com/Matweiss/clawd-brain-data/blob/main/${path}`;
  };

  const getRawUrl = (path: string) => {
    return `https://raw.githubusercontent.com/Matweiss/clawd-brain-data/main/${path}`;
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getTypeIcon = (path: string) => {
    if (path.includes('memories')) return <Brain className="w-4 h-4 text-purple-400" />;
    if (path.includes('handoffs')) return <GitCommit className="w-4 h-4 text-orange-400" />;
    if (path.includes('docs')) return <FileText className="w-4 h-4 text-blue-400" />;
    if (path.includes('daily')) return <Calendar className="w-4 h-4 text-green-400" />;
    return <FileText className="w-4 h-4 text-gray-400" />;
  };

  const getTypeColor = (path: string) => {
    if (path.includes('memories')) return 'text-purple-400';
    if (path.includes('handoffs')) return 'text-orange-400';
    if (path.includes('docs')) return 'text-blue-400';
    if (path.includes('daily')) return 'text-green-400';
    return 'text-gray-400';
  };

  const filteredFiles = files.filter(file =>
    file.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    file.preview.toLowerCase().includes(searchQuery.toLowerCase()) ||
    file.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="bg-[#161616] rounded-xl border border-purple-500/20 overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-gray-800">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center">
              <Brain className="w-4 h-4 text-purple-400" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-white">Brain Data</h2>
              <p className="text-xs text-gray-500">Private memory vault</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowGraph(true)}
              className="flex items-center gap-1 px-3 py-1.5 bg-[#1a1a1a] rounded-lg text-xs text-gray-400 hover:text-white hover:bg-[#222] transition-colors"
              title="View linked memories graph"
            >
              <Network className="w-3 h-3" />
              Graph
            </button>
            
            <button
              onClick={() => setShowEditor(true)}
              className="flex items-center gap-1 px-3 py-1.5 bg-purple-500/20 text-purple-400 rounded-lg text-xs hover:bg-purple-500/30 transition-colors"
            >
              <Plus className="w-3 h-3" />
              New
            </button>

            <button
              onClick={() => setShowExport(true)}
              className="flex items-center gap-1 px-3 py-1.5 bg-[#1a1a1a] rounded-lg text-xs text-gray-400 hover:text-white hover:bg-[#222] transition-colors"
              title="Export memories"
            >
              <Download className="w-3 h-3" />
              Export
            </button>
            
            <a
              href="https://github.com/Matweiss/clawd-brain-data"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 px-3 py-1.5 bg-[#1a1a1a] rounded-lg text-xs text-gray-400 hover:text-white hover:bg-[#222] transition-colors"
            >
              <FolderOpen className="w-3 h-3" />
              Repo
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-4 gap-2 mb-4">
            <div className="bg-[#1a1a1a] rounded-lg p-2 text-center">
              <p className="text-lg font-bold text-white">{stats.total}</p>
              <p className="text-xs text-gray-500">Total</p>
            </div>
            <div className="bg-[#1a1a1a] rounded-lg p-2 text-center">
              <p className="text-lg font-bold text-purple-400">{stats.memories}</p>
              <p className="text-xs text-gray-500">Memories</p>
            </div>
            <div className="bg-[#1a1a1a] rounded-lg p-2 text-center">
              <p className="text-lg font-bold text-orange-400">{stats.handoffs}</p>
              <p className="text-xs text-gray-500">Handoffs</p>
            </div>
            <div className="bg-[#1a1a1a] rounded-lg p-2 text-center">
              <p className="text-lg font-bold text-blue-400">{stats.docs}</p>
              <p className="text-xs text-gray-500">Docs</p>
            </div>
          </div>
        )}

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            placeholder="Search memories, handoffs, docs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#1a1a1a] rounded-lg pl-10 pr-4 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
          />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-800">
        {(['all', 'memories', 'handoffs', 'docs', 'daily'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-2 text-xs font-medium transition-colors ${
              activeTab === tab
                ? 'text-purple-400 border-b-2 border-purple-400'
                : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* File List */}
      <div className="max-h-96 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="w-6 h-6 text-purple-400 animate-spin" />
          </div>
        ) : filteredFiles.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No files found</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-800">
            {filteredFiles.map((file) => (
              <div
                key={file.path}
                className="p-3 hover:bg-[#1a1a1a] transition-colors group"
              >
                <div className="flex items-start gap-3">
                  {getTypeIcon(file.path)}
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className={`text-sm font-medium truncate ${getTypeColor(file.path)}`}>
                        {file.title}
                      </h3>
                      <span className="text-xs text-gray-600">
                        {formatDate(file.date)}
                      </span>
                    </div>
                    
                    <p className="text-xs text-gray-500 line-clamp-2 mb-2">
                      {file.preview}
                    </p>
                    
                    {file.tags.length > 0 && (
                      <div className="flex items-center gap-1 mb-2">
                        <Tag className="w-3 h-3 text-gray-600" />
                        {file.tags.slice(0, 3).map((tag) => (
                          <span
                            key={tag}
                            className="text-xs px-1.5 py-0.5 bg-[#222] rounded text-gray-500"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                    
                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <a
                        href={getGitHubUrl(file.path)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-xs text-gray-500 hover:text-white"
                      >
                        <ExternalLink className="w-3 h-3" />
                        View
                      </a>
                      
                      <a
                        href={getRawUrl(file.path)}
                        download={file.filename}
                        className="flex items-center gap-1 text-xs text-gray-500 hover:text-white"
                      >
                        <Download className="w-3 h-3" />
                        Download
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-gray-800 bg-[#0f0f0f]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1 text-xs text-gray-600">
            <Clock className="w-3 h-3" />
            <span>Auto-sync: 11 PM PT daily</span>
          </div>
          
          <button
            onClick={fetchBrainData}
            disabled={loading}
            className="flex items-center gap-1 text-xs text-purple-400 hover:text-purple-300 disabled:opacity-50"
          >
            <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Modals */}
      {showEditor && (
        <MemoryEditor
          onClose={() => setShowEditor(false)}
          onSave={() => {
            fetchBrainData();
            setShowEditor(false);
          }}
        />
      )}

      {showGraph && (
        <MemoryGraph
          onSelectMemory={(path) => {
            window.open(getGitHubUrl(path), '_blank');
            setShowGraph(false);
          }}
          onClose={() => setShowGraph(false)}
        />
      )}

      {showExport && (
        <ExportModal
          memories={files}
          onClose={() => setShowExport(false)}
        />
      )}
    </div>
  );
}
