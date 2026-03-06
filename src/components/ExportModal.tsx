import React, { useState } from 'react';
import { Download, FileJson, FileText, X, Loader2, FileSpreadsheet } from 'lucide-react';

interface ExportModalProps {
  memories: any[];
  onClose: () => void;
}

export function ExportModal({ memories, onClose }: ExportModalProps) {
  const [exporting, setExporting] = useState(false);
  const [format, setFormat] = useState<'md' | 'json' | 'csv'>('md');

  const handleExport = async () => {
    setExporting(true);
    
    try {
      let content: string;
      let filename: string;
      let mimeType: string;

      switch (format) {
        case 'json':
          content = JSON.stringify(memories, null, 2);
          filename = `brain-data-export-${new Date().toISOString().split('T')[0]}.json`;
          mimeType = 'application/json';
          break;
        
        case 'csv':
          // Simple CSV export
          const headers = ['title', 'date', 'type', 'tags', 'path'];
          const rows = memories.map(m => [
            `"${m.title}"`,
            m.date,
            m.type,
            `"${m.tags?.join(', ') || ''}"`,
            m.path
          ]);
          content = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
          filename = `brain-data-export-${new Date().toISOString().split('T')[0]}.csv`;
          mimeType = 'text/csv';
          break;
        
        case 'md':
        default:
          // Markdown export with all memories
          content = memories.map(m => {
            return `# ${m.title}\n\n**Date:** ${m.date}\n**Type:** ${m.type}\n**Tags:** ${m.tags?.join(', ') || 'none'}\n\n${m.preview}\n\n---\n`;
          }).join('\n');
          filename = `brain-data-export-${new Date().toISOString().split('T')[0]}.md`;
          mimeType = 'text/markdown';
          break;
      }

      // Create and download file
      const blob = new Blob([content], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      onClose();
    } catch (error) {
      console.error('Export failed:', error);
      alert('Export failed. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#161616] rounded-xl border border-purple-500/30 w-full max-w-md">
        <div className="flex items-center justify-between p-4 border-b border-gray-800">
          <h2 className="text-lg font-semibold text-white">Export Memories</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-800 rounded-lg">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          <p className="text-sm text-gray-500">
            Export {memories.length} memories in your preferred format:
          </p>

          <div className="grid grid-cols-3 gap-3">
            <button
              onClick={() => setFormat('md')}
              className={`p-4 rounded-xl border text-center transition-colors ${
                format === 'md'
                  ? 'border-purple-500 bg-purple-500/20'
                  : 'border-gray-800 hover:border-gray-700'
              }`}
            >
              <FileText className="w-8 h-8 mx-auto mb-2 text-gray-400" />
              <p className="text-sm font-medium text-white">Markdown</p>
              <p className="text-xs text-gray-500">.md</p>
            </button>

            <button
              onClick={() => setFormat('json')}
              className={`p-4 rounded-xl border text-center transition-colors ${
                format === 'json'
                  ? 'border-purple-500 bg-purple-500/20'
                  : 'border-gray-800 hover:border-gray-700'
              }`}
            >
              <FileJson className="w-8 h-8 mx-auto mb-2 text-gray-400" />
              <p className="text-sm font-medium text-white">JSON</p>
              <p className="text-xs text-gray-500">.json</p>
            </button>

            <button
              onClick={() => setFormat('csv')}
              className={`p-4 rounded-xl border text-center transition-colors ${
                format === 'csv'
                  ? 'border-purple-500 bg-purple-500/20'
                  : 'border-gray-800 hover:border-gray-700'
              }`}
            >
              <FileSpreadsheet className="w-8 h-8 mx-auto mb-2 text-gray-400" />
              <p className="text-sm font-medium text-white">CSV</p>
              <p className="text-xs text-gray-500">.csv</p>
            </button>
          </div>

          <button
            onClick={handleExport}
            disabled={exporting}
            className="w-full py-3 bg-purple-500 text-white rounded-lg font-medium hover:bg-purple-600 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {exporting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Exporting...
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                Export {memories.length} Memories
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
