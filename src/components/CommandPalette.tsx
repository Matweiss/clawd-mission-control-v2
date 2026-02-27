import React, { useState, useEffect } from 'react';
import { Search, Mail, Database, Cpu, Activity, Zap, X, RefreshCw, Plus } from 'lucide-react';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (command: string) => void;
}

const COMMANDS = [
  { id: 'check-inbox', title: 'Check inbox now', icon: Mail, category: 'Email', shortcut: 'E' },
  { id: 'refresh-pipeline', title: 'Refresh pipeline', icon: Database, category: 'HubSpot', shortcut: 'P' },
  { id: 'spawn-research', title: 'Spawn Research Agent', icon: Cpu, category: 'Agents', shortcut: 'R' },
  { id: 'spawn-build', title: 'Spawn Build Agent', icon: Zap, category: 'Agents', shortcut: 'B' },
  { id: 'view-urgent', title: 'View urgent emails', icon: Mail, category: 'Email', shortcut: 'U' },
  { id: 'view-stale', title: 'View stale deals', icon: Activity, category: 'HubSpot', shortcut: 'S' },
  { id: 'draft-email', title: 'Draft new email', icon: Plus, category: 'Email', shortcut: 'N' },
  { id: 'refresh-all', title: 'Refresh all data', icon: RefreshCw, category: 'System', shortcut: '⌘R' },
];

export function CommandPalette({ isOpen, onClose, onSelect }: CommandPaletteProps) {
  const [search, setSearch] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);

  const filteredCommands = search
    ? COMMANDS.filter(cmd => 
        cmd.title.toLowerCase().includes(search.toLowerCase()) ||
        cmd.category.toLowerCase().includes(search.toLowerCase())
      )
    : COMMANDS;

  useEffect(() => {
    setSelectedIndex(0);
  }, [search]);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => (prev + 1) % filteredCommands.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => (prev - 1 + filteredCommands.length) % filteredCommands.length);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (filteredCommands[selectedIndex]) {
          onSelect(filteredCommands[selectedIndex].id);
          onClose();
          setSearch('');
        }
      } else if (e.key === 'Escape') {
        onClose();
        setSearch('');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, filteredCommands, selectedIndex, onSelect, onClose]);

  if (!isOpen) return null;

  // Group by category
  const grouped = filteredCommands.reduce((acc, cmd) => {
    if (!acc[cmd.category]) acc[cmd.category] = [];
    acc[cmd.category].push(cmd);
    return acc;
  }, {} as Record<string, typeof COMMANDS>);

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh]">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={() => { onClose(); setSearch(''); }}
      />
      
      {/* Modal */}
      <div className="relative w-full max-w-2xl bg-surface border border-border rounded-xl shadow-2xl overflow-hidden">
        {/* Search input */}
        <div className="flex items-center gap-3 px-4 py-4 border-b border-border">
          <Search className="w-5 h-5 text-gray-500" />
          <input
            type="text"
            placeholder="Type a command or search..."
            className="flex-1 bg-transparent text-white placeholder-gray-500 outline-none text-lg"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            autoFocus
          />
          <button 
            onClick={() => { onClose(); setSearch(''); }}
            className="p-1 hover:bg-surface-light rounded"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        
        {/* Results */}
        <div className="max-h-[400px] overflow-y-auto py-2">
          {Object.entries(grouped).map(([category, commands]) => (
            <div key={category}>
              <div className="px-4 py-2 text-xs font-medium text-gray-500 uppercase">
                {category}
              </div>
              {commands.map((cmd, idx) => {
                const globalIndex = filteredCommands.indexOf(cmd);
                const isSelected = globalIndex === selectedIndex;
                const Icon = cmd.icon;
                
                return (
                  <button
                    key={cmd.id}
                    className={`w-full px-4 py-3 flex items-center gap-3 transition-colors ${
                      isSelected ? 'bg-work/20 border-l-2 border-work' : 'hover:bg-surface-light'
                    }`}
                    onClick={() => {
                      onSelect(cmd.id);
                      onClose();
                      setSearch('');
                    }}
                    onMouseEnter={() => setSelectedIndex(globalIndex)}
                  >
                    <Icon className={`w-5 h-5 ${isSelected ? 'text-work' : 'text-gray-500'}`} />
                    <span className={`flex-1 text-left ${isSelected ? 'text-white' : 'text-gray-300'}`}>
                      {cmd.title}
                    </span>
                    <span className="text-xs text-gray-600 font-mono">
                      {cmd.shortcut}
                    </span>
                  </button>
                );
              })}
            </div>
          ))}
          
          {filteredCommands.length === 0 && (
            <div className="px-4 py-8 text-center text-gray-500">
              No commands found
            </div>
          )}
        </div>
        
        {/* Footer */}
        <div className="px-4 py-2 border-t border-border flex items-center gap-4 text-xs text-gray-500">
          <div className="flex items-center gap-1">
            <span className="px-1.5 py-0.5 bg-surface-light rounded">↑↓</span>
            <span>Navigate</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="px-1.5 py-0.5 bg-surface-light rounded">↵</span>
            <span>Select</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="px-1.5 py-0.5 bg-surface-light rounded">esc</span>
            <span>Close</span>
          </div>
        </div>
      </div>
    </div>
  );
}
