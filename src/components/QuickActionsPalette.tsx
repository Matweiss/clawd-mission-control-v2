import React, { useState, useEffect, useCallback } from 'react';
import { Search, Zap, RefreshCw, Send, FileText, BarChart3, Calendar, AlertCircle, CheckCircle } from 'lucide-react';

interface Command {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  category: string;
  action: () => void;
}

interface QuickActionsPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  agents: any[];
  pipeline: any;
  emails: any[];
  onRefresh: () => void;
}

export function QuickActionsPalette({ isOpen, onClose, agents, pipeline, emails, onRefresh }: QuickActionsPaletteProps) {
  const [search, setSearch] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [recentCommands, setRecentCommands] = useState<string[]>([]);

  const commands: Command[] = [
    // Sync Actions
    {
      id: 'sync-all',
      title: 'Sync All Data',
      description: 'Refresh Gmail, Calendar, HubSpot, and agents',
      icon: <RefreshCw className="w-4 h-4" />,
      category: 'Sync',
      action: () => {
        onRefresh();
        addToRecent('sync-all');
      }
    },
    {
      id: 'sync-gmail',
      title: 'Sync Gmail',
      description: 'Fetch latest emails from inbox',
      icon: <RefreshCw className="w-4 h-4" />,
      category: 'Sync',
      action: () => {
        console.log('🔄 Syncing Gmail...');
        addToRecent('sync-gmail');
      }
    },
    {
      id: 'sync-hubspot',
      title: 'Sync HubSpot',
      description: 'Update pipeline and deals from CRM',
      icon: <RefreshCw className="w-4 h-4" />,
      category: 'Sync',
      action: () => {
        console.log('🔄 Syncing HubSpot...');
        addToRecent('sync-hubspot');
      }
    },

    // Sales Actions
    {
      id: 'create-battle-card',
      title: 'Create Battle Card',
      description: 'Generate competitor research for a deal',
      icon: <FileText className="w-4 h-4" />,
      category: 'Sales',
      action: () => {
        console.log('🎯 Creating battle card...');
        addToRecent('create-battle-card');
      }
    },
    {
      id: 'check-stale-deals',
      title: 'Check Stale Deals',
      description: 'Find deals stuck in pipeline',
      icon: <AlertCircle className="w-4 h-4" />,
      category: 'Sales',
      action: () => {
        console.log('⚠️ Checking stale deals...');
        addToRecent('check-stale-deals');
      }
    },
    {
      id: 'pipeline-report',
      title: 'Generate Pipeline Report',
      description: 'Create weekly pipeline summary',
      icon: <BarChart3 className="w-4 h-4" />,
      category: 'Sales',
      action: () => {
        console.log('📊 Generating pipeline report...');
        addToRecent('pipeline-report');
      }
    },

    // Deploy Actions
    {
      id: 'deploy-vercel',
      title: 'Deploy to Vercel',
      description: 'Push latest changes to production',
      icon: <Zap className="w-4 h-4" />,
      category: 'Deploy',
      action: () => {
        console.log('🚀 Deploying to Vercel...');
        window.open('https://vercel.com/mats-projects/clawd-mission-control-v2', '_blank');
        addToRecent('deploy-vercel');
      }
    },
    {
      id: 'github-actions',
      title: 'View GitHub Actions',
      description: 'Check CI/CD pipeline status',
      icon: <CheckCircle className="w-4 h-4" />,
      category: 'Deploy',
      action: () => {
        window.open('https://github.com/Matweiss/clawd-mission-control-v2/actions', '_blank');
        addToRecent('github-actions');
      }
    },

    // Agent Actions
    {
      id: 'restart-work-agent',
      title: 'Restart Work Agent',
      description: 'Restart the work agent service',
      icon: <RefreshCw className="w-4 h-4" />,
      category: 'Agents',
      action: () => {
        console.log('🔄 Restarting Work Agent...');
        addToRecent('restart-work-agent');
      }
    },
    {
      id: 'restart-email-agent',
      title: 'Restart Email Agent',
      description: 'Restart the email agent service',
      icon: <RefreshCw className="w-4 h-4" />,
      category: 'Agents',
      action: () => {
        console.log('🔄 Restarting Email Agent...');
        addToRecent('restart-email-agent');
      }
    },

    // Slack Actions
    {
      id: 'slack-pipeline',
      title: 'Share Pipeline to Slack',
      description: 'Post current pipeline to #sales',
      icon: <Send className="w-4 h-4" />,
      category: 'Slack',
      action: () => {
        console.log('💬 Sharing pipeline to Slack...');
        addToRecent('slack-pipeline');
      }
    },
    {
      id: 'slack-status',
      title: 'Post Status Update',
      description: 'Send agent status to team',
      icon: <Send className="w-4 h-4" />,
      category: 'Slack',
      action: () => {
        console.log('💬 Posting status to Slack...');
        addToRecent('slack-status');
      }
    },

    // Quick Views
    {
      id: 'view-emails',
      title: 'View All Emails',
      description: `You have ${emails.length} emails to review`,
      icon: <Calendar className="w-4 h-4" />,
      category: 'View',
      action: () => {
        onClose();
        // Trigger email modal
        addToRecent('view-emails');
      }
    },
    {
      id: 'view-pipeline',
      title: 'View Pipeline Details',
      description: `${pipeline.deals?.length || 0} deals worth $${(pipeline.total / 1000).toFixed(0)}K`,
      icon: <BarChart3 className="w-4 h-4" />,
      category: 'View',
      action: () => {
        onClose();
        // Trigger pipeline modal
        addToRecent('view-pipeline');
      }
    },
  ];

  const addToRecent = (commandId: string) => {
    setRecentCommands(prev => {
      const filtered = prev.filter(id => id !== commandId);
      return [commandId, ...filtered].slice(0, 5);
    });
  };

  const filteredCommands = commands.filter(cmd => {
    const searchLower = search.toLowerCase();
    return (
      cmd.title.toLowerCase().includes(searchLower) ||
      cmd.description.toLowerCase().includes(searchLower) ||
      cmd.category.toLowerCase().includes(searchLower)
    );
  });

  // Group by category
  const groupedCommands = filteredCommands.reduce((acc, cmd) => {
    if (!acc[cmd.category]) acc[cmd.category] = [];
    acc[cmd.category].push(cmd);
    return acc;
  }, {} as Record<string, Command[]>);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!isOpen) return;

    switch (e.key) {
      case 'Escape':
        onClose();
        break;
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => Math.min(prev + 1, filteredCommands.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => Math.max(prev - 1, 0));
        break;
      case 'Enter':
        e.preventDefault();
        if (filteredCommands[selectedIndex]) {
          filteredCommands[selectedIndex].action();
          onClose();
        }
        break;
    }
  }, [isOpen, filteredCommands, selectedIndex, onClose]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  useEffect(() => {
    if (isOpen) {
      setSearch('');
      setSelectedIndex(0);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh] bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-2xl bg-surface border border-border rounded-xl overflow-hidden shadow-2xl">
        {/* Search Header */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
          <Search className="w-5 h-5 text-gray-500" />
          <input
            type="text"
            placeholder="Search commands..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setSelectedIndex(0);
            }}
            className="flex-1 bg-transparent text-white placeholder-gray-500 outline-none"
            autoFocus
          />
          <kbd className="px-2 py-1 text-xs bg-surface-light rounded text-gray-400">ESC</kbd>
        </div>

        {/* Commands List */}
        <div className="max-h-[60vh] overflow-y-auto py-2">
          {Object.entries(groupedCommands).map(([category, cmds]) => (
            <div key={category}>
              <div className="px-4 py-2 text-xs font-medium text-gray-500 uppercase tracking-wider">
                {category}
              </div>
              {cmds.map((cmd, idx) => {
                const globalIndex = filteredCommands.findIndex(c => c.id === cmd.id);
                const isSelected = globalIndex === selectedIndex;
                
                return (
                  <button
                    key={cmd.id}
                    onClick={() => {
                      cmd.action();
                      onClose();
                    }}
                    onMouseEnter={() => setSelectedIndex(globalIndex)}
                    className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${
                      isSelected ? 'bg-surface-light' : 'hover:bg-surface-light/50'
                    }`}
                  >
                    <div className={`p-2 rounded-lg ${isSelected ? 'bg-work/20 text-work' : 'bg-gray-800 text-gray-400'}`}>
                      {cmd.icon}
                    </div>
                    <div className="flex-1">
                      <div className={`font-medium ${isSelected ? 'text-white' : 'text-gray-300'}`}>
                        {cmd.title}
                      </div>
                      <div className="text-sm text-gray-500">
                        {cmd.description}
                      </div>
                    </div>
                    {isSelected && (
                      <kbd className="px-2 py-1 text-xs bg-surface-light rounded text-gray-400">↵</kbd>
                    )}
                  </button>
                );
              })}
            </div>
          ))}

          {filteredCommands.length === 0 && (
            <div className="px-4 py-8 text-center text-gray-500">
              No commands found for "{search}"
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2 border-t border-border flex items-center gap-4 text-xs text-gray-500">
          <div className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 bg-surface-light rounded">↑</kbd>
            <kbd className="px-1.5 py-0.5 bg-surface-light rounded">↓</kbd>
            <span>Navigate</span>
          </div>
          <div className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 bg-surface-light rounded">↵</kbd>
            <span>Select</span>
          </div>
          <div className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 bg-surface-light rounded">ESC</kbd>
            <span>Close</span>
          </div>
        </div>
      </div>
    </div>
  );
}
