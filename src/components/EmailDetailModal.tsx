import React, { useState } from 'react';
import { X, Search, Mail, AlertCircle, Clock, CheckCircle, ExternalLink } from 'lucide-react';

interface Email {
  id: string;
  from_name?: string;
  from_email: string;
  subject: string;
  category: 'URGENT' | 'REPLY_NEEDED' | 'FYI' | 'JUNK';
  deal_name?: string;
  received_at: string;
  thread_id?: string;
}

interface EmailDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  emails: Email[];
}

const CATEGORY_CONFIG = {
  URGENT: { color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/30', icon: AlertCircle },
  REPLY_NEEDED: { color: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/30', icon: Clock },
  FYI: { color: 'text-green-400', bg: 'bg-green-500/10', border: 'border-green-500/30', icon: CheckCircle },
  JUNK: { color: 'text-gray-400', bg: 'bg-gray-500/10', border: 'border-gray-500/30', icon: Mail },
};

export function EmailDetailModal({ isOpen, onClose, emails }: EmailDetailModalProps) {
  const [activeTab, setActiveTab] = useState<'all' | 'URGENT' | 'REPLY_NEEDED' | 'FYI'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  if (!isOpen) return null;

  const filteredEmails = emails.filter(email => {
    const matchesTab = activeTab === 'all' || email.category === activeTab;
    const matchesSearch = 
      email.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      email.from_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (email.from_name?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false);
    return matchesTab && matchesSearch;
  });

  const categoryCounts = {
    URGENT: emails.filter(e => e.category === 'URGENT').length,
    REPLY_NEEDED: emails.filter(e => e.category === 'REPLY_NEEDED').length,
    FYI: emails.filter(e => e.category === 'FYI').length,
    JUNK: emails.filter(e => e.category === 'JUNK').length,
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-surface border border-border rounded-xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-border flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold">Email Intelligence</h2>
            <p className="text-sm text-gray-500">
              {emails.length} emails processed • {categoryCounts.URGENT} urgent • {categoryCounts.REPLY_NEEDED} need reply
            </p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-surface-light rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Category Tabs */}
        <div className="flex border-b border-border px-6">
          {[
            { id: 'all', label: 'All', count: emails.length },
            { id: 'URGENT', label: 'Urgent', count: categoryCounts.URGENT, alert: true },
            { id: 'REPLY_NEEDED', label: 'Reply Needed', count: categoryCounts.REPLY_NEEDED },
            { id: 'FYI', label: 'FYI', count: categoryCounts.FYI },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
                activeTab === tab.id 
                  ? 'border-email text-email' 
                  : 'border-transparent text-gray-500 hover:text-gray-300'
              }`}
            >
              {tab.label}
              <span className={`text-xs px-1.5 py-0.5 rounded ${
                tab.alert && tab.count > 0 ? 'bg-red-500/20 text-red-400' : 'bg-surface text-gray-500'
              }`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="px-6 py-3 border-b border-border">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              type="text"
              placeholder="Search emails by subject or sender..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-surface-light border border-border rounded-lg pl-10 pr-4 py-2 text-sm"
            />
          </div>
        </div>

        {/* Email List */}
        <div className="flex-1 overflow-y-auto p-6">
          {filteredEmails.length === 0 ? (
            <p className="text-center text-gray-500 py-8">No emails in this category</p>
          ) : (
            <div className="space-y-3">
              {filteredEmails.map(email => {
                const config = CATEGORY_CONFIG[email.category];
                const Icon = config.icon;
                
                return (
                  <div 
                    key={email.id} 
                    className={`p-4 rounded-lg border ${config.border} ${config.bg} hover:border-opacity-50 transition-colors`}
                  >
                    <div className="flex items-start gap-3">
                      <Icon className={`w-5 h-5 ${config.color} mt-0.5`} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="font-medium truncate">{email.subject}</span>
                          <span className={`text-xs px-2 py-0.5 rounded bg-surface ${config.color}`}>
                            {email.category}
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-2 mt-1 text-sm text-gray-400">
                          <span>{email.from_name || email.from_email}</span>
                          <span>•</span>
                          <span>
                            {new Date(email.received_at).toLocaleString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              hour: 'numeric',
                              minute: '2-digit'
                            })}
                          </span>
                        </div>

                        {email.deal_name && (
                          <div className="mt-2">
                            <span className="text-xs bg-work/20 text-work px-2 py-0.5 rounded">
                              {email.deal_name}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-border flex justify-between items-center">
          <span className="text-xs text-gray-500">Showing {filteredEmails.length} of {emails.length} emails</span>
          <a 
            href="https://mail.google.com/mail/u/0/#search/is:unread"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-sm text-email hover:underline"
          >
            Open Gmail
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>
      </div>
    </div>
  );
}
