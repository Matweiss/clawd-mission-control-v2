import React, { useEffect, useState } from 'react';
import { Mail, AlertCircle, Clock, RefreshCw } from 'lucide-react';

interface Email {
  id: string;
  subject: string;
  from: string;
  snippet: string;
  receivedAt: string;
  category: 'URGENT' | 'REPLY_NEEDED' | 'FYI';
}

interface EmailData {
  emails: Email[];
  count: number;
  unreadCount: number;
  urgentCount: number;
  replyNeededCount: number;
  lastUpdated: string;
}

export function EmailCard() {
  const [data, setData] = useState<EmailData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchEmails = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/emails/recent');
      if (!response.ok) {
        throw new Error(`Failed to fetch: ${response.status}`);
      }
      const result = await response.json();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmails();
  }, []);

  const urgent = data?.emails.filter((e: Email) => e.category === 'URGENT') || [];
  const replyNeeded = data?.emails.filter((e: Email) => e.category === 'REPLY_NEEDED') || [];
  const fyi = data?.emails.filter((e: Email) => e.category === 'FYI') || [];

  if (error) {
    return (
      <div className="bg-surface border border-red-500/30 rounded-xl p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2 text-red-400">
            <AlertCircle className="w-4 h-4" />
            <span className="text-sm font-medium">Email Error</span>
          </div>
          <button onClick={fetchEmails} className="text-xs bg-surface-light px-2 py-1 rounded">Retry</button>
        </div>
        <p className="text-xs text-gray-400">{error}</p>
      </div>
    );
  }

  return (
    <div className="bg-surface border border-border rounded-xl overflow-hidden">
      <div className="px-4 py-3 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Mail className="w-4 h-4 text-pink-400" />
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Recent Emails</h2>
        </div>
        <div className="flex items-center gap-2">
          {data && (
            <span className="text-xs text-gray-500">
              {data.unreadCount} unread
            </span>
          )}
          <button 
            onClick={fetchEmails}
            className="p-1 hover:bg-surface-light rounded transition-colors"
          >
            <RefreshCw className={`w-4 h-4 text-gray-500 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>
      
      <div className="p-4 space-y-3">
        {!data && (
          <div className="text-center py-4 text-gray-500">
            <Mail className="w-6 h-6 mx-auto mb-2 opacity-50" />
            <p className="text-xs">Loading emails...</p>
          </div>
        )}

        {urgent.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-red-500 text-xs font-medium">
              <AlertCircle className="w-3 h-3" />
              <span>URGENT ({urgent.length})</span>
            </div>
            {urgent.slice(0, 2).map((email: Email) => (
              <div key={email.id} className="bg-red-500/10 border border-red-500/30 rounded-lg p-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium truncate">{email.from}</span>
                  <span className="text-[10px] text-gray-500">
                    {new Date(email.receivedAt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                  </span>
                </div>
                <p className="text-xs text-gray-200 font-medium truncate">{email.subject}</p>
                <p className="text-[10px] text-gray-400 truncate mt-0.5">{email.snippet}</p>
              </div>
            ))}
          </div>
        )}

        {replyNeeded.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-yellow-500 text-xs font-medium">
              <Clock className="w-3 h-3" />
              <span>Reply Needed ({replyNeeded.length})</span>
            </div>
            {replyNeeded.slice(0, 2).map((email: Email) => (
              <div key={email.id} className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs truncate">{email.from}</span>
                  <span className="text-[10px] text-gray-500">
                    {new Date(email.receivedAt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                  </span>
                </div>
                <p className="text-xs text-gray-200 truncate">{email.subject}</p>
                <p className="text-[10px] text-gray-400 truncate mt-0.5">{email.snippet}</p>
              </div>
            ))}
          </div>
        )}

        {fyi.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-gray-400 text-xs font-medium">
              <Mail className="w-3 h-3" />
              <span>Recent ({fyi.length})</span>
            </div>
            {fyi.slice(0, 3).map((email: Email) => (
              <div key={email.id} className="bg-surface-light border border-border rounded-lg p-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs truncate">{email.from}</span>
                  <span className="text-[10px] text-gray-500">
                    {new Date(email.receivedAt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                  </span>
                </div>
                <p className="text-xs text-gray-200 truncate">{email.subject}</p>
                <p className="text-[10px] text-gray-400 truncate mt-0.5">{email.snippet}</p>
              </div>
            ))}
            {fyi.length > 3 && (
              <div className="text-xs text-gray-500 text-center">+{fyi.length - 3} more</div>
            )}
          </div>
        )}

        {data && urgent.length === 0 && replyNeeded.length === 0 && fyi.length === 0 && (
          <div className="text-center py-4 text-gray-500">
            <Mail className="w-6 h-6 mx-auto mb-2 opacity-50" />
            <p className="text-xs">No recent emails</p>
          </div>
        )}
      </div>

      {data && (
        <div className="px-4 py-3 border-t border-border flex items-center justify-between text-xs text-gray-500">
          <span>Source: Gmail</span>
          <span>Updated {new Date(data.lastUpdated).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}</span>
        </div>
      )}
    </div>
  );
}
