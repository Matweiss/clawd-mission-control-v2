import React, { useState } from 'react';
import { 
  Mail, 
  Import, 
  CheckCircle, 
  Loader2, 
  X,
  Search,
  User,
  Clock
} from 'lucide-react';

interface Email {
  id: string;
  subject: string;
  from: string;
  snippet: string;
  date: string;
}

interface EmailImportProps {
  onClose: () => void;
}

export function EmailImport({ onClose }: EmailImportProps) {
  const [emails, setEmails] = useState<Email[]>([]);
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState<string | null>(null);
  const [imported, setImported] = useState<Set<string>>(new Set());
  const [query, setQuery] = useState('is:unread');
  const [error, setError] = useState<string | null>(null);

  const fetchEmails = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/gmail/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'list', query })
      });

      if (!response.ok) {
        const err = await response.json();
        if (response.status === 401) {
          setError('Google authentication required. Please set up Google OAuth.');
        } else {
          setError(err.error || 'Failed to fetch emails');
        }
        return;
      }

      const data = await response.json();
      setEmails(data.emails || []);
    } catch (error) {
      console.error('Failed to fetch emails:', error);
      setError('Failed to fetch emails');
    } finally {
      setLoading(false);
    }
  };

  const importEmail = async (emailId: string) => {
    setImporting(emailId);
    
    try {
      const response = await fetch('/api/gmail/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'import', messageId: emailId })
      });

      if (response.ok) {
        setImported(new Set(Array.from(imported).concat([emailId])));
      }
    } catch (error) {
      console.error('Failed to import email:', error);
    } finally {
      setImporting(null);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    
    if (isToday) {
      return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    }
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#161616] rounded-xl border border-purple-500/30 w-full max-w-3xl max-h-[80vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center">
              <Mail className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">Import from Gmail</h2>
              <p className="text-xs text-gray-500">Convert emails to memories</p>
            </div>
          </div>
          
          <button onClick={onClose} className="p-2 hover:bg-gray-800 rounded-lg">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-gray-800">
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="text"
                placeholder="Search query (e.g., is:unread, from:someone)"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full bg-[#1a1a1a] rounded-lg pl-10 pr-4 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            
            <button
              onClick={fetchEmails}
              disabled={loading}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg text-sm font-medium hover:bg-blue-600 disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                'Fetch'
              )}
            </button>
          </div>

          {error && (
            <div className="mt-3 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}
        </div>

        {/* Email List */}
        <div className="flex-1 overflow-y-auto p-4">
          {emails.length === 0 && !loading ? (
            <div className="text-center py-8 text-gray-500">
              <Mail className="w-12 h-12 mx-auto mb-4 opacity-30" />
              <p className="text-sm">Click "Fetch" to load emails</p>
            </div>
          ) : (
            <div className="space-y-3">
              {emails.map((email) => (
                <div
                  key={email.id}
                  className="p-4 bg-[#1a1a1a] rounded-lg border border-gray-800 hover:border-gray-700 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-medium text-white mb-1">{email.subject}</h3>
                      
                      <div className="flex items-center gap-3 text-xs text-gray-500 mb-2">
                        <span className="flex items-center gap-1">
                          <User className="w-3 h-3" />
                          {email.from}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatDate(email.date)}
                        </span>
                      </div>
                      
                      <p className="text-xs text-gray-400 line-clamp-2">{email.snippet}</p>
                    </div>

                    <button
                      onClick={() => importEmail(email.id)}
                      disabled={importing === email.id || imported.has(email.id)}
                      className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                        imported.has(email.id)
                          ? 'bg-green-500/20 text-green-400'
                          : 'bg-blue-500/20 text-blue-400 hover:bg-blue-500/30'
                      }`}
                    >
                      {importing === email.id ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : imported.has(email.id) ? (
                        <>
                          <CheckCircle className="w-3 h-3" />
                          Imported
                        </>
                      ) : (
                        <>
                          <Import className="w-3 h-3" />
                          Import
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
