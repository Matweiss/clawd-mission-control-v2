import React, { useEffect, useState } from 'react';
import { Briefcase, Mail, Calendar, TrendingUp, DollarSign, ArrowRight } from 'lucide-react';

export function MobileWorkTab() {
  const [emails, setEmails] = useState<any[]>([]);
  const [pipeline, setPipeline] = useState<any>(null);
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchWorkData();
  }, []);

  const fetchWorkData = async () => {
    try {
      const [emailsRes, pipelineRes, calendarRes] = await Promise.all([
        fetch('/api/emails/recent'),
        fetch('/api/pipeline/sheet'),
        fetch('/api/calendar/events')
      ]);

      if (emailsRes.ok) {
        const emailData = await emailsRes.json();
        setEmails(emailData.emails?.slice(0, 3) || []);
      }

      if (pipelineRes.ok) {
        const pipeData = await pipelineRes.json();
        setPipeline(pipeData);
      }

      if (calendarRes.ok) {
        const calData = await calendarRes.json();
        setEvents(calData.events?.slice(0, 3) || []);
      }
    } catch (err) {
      console.error('Error fetching work data:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Briefcase className="w-8 h-8 text-gray-500 animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Pipeline Summary */}
      {pipeline && (
        <div className="bg-surface-light rounded-2xl p-4 border border-border">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-cyan-400" />
              <span className="font-medium">Pipeline</span>
            </div>
            <span className="text-2xl font-bold text-cyan-400">{pipeline.totalMRR || 0}</span>
          </div>
          
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: 'Qualification', count: pipeline.stages?.qualification || 0, color: 'text-orange-400' },
              { label: 'Discovery', count: pipeline.stages?.discovery || 0, color: 'text-blue-400' },
              { label: 'Evaluation', count: pipeline.stages?.evaluation || 0, color: 'text-purple-400' },
            ].map((stage) => (
              <div key={stage.label} className="text-center p-2 bg-surface rounded-xl">
                <p className={`text-lg font-bold ${stage.color}`}>{stage.count}</p>
                <p className="text-xs text-gray-500">{stage.label}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Emails */}
      <div className="bg-surface-light rounded-2xl p-4 border border-border">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Mail className="w-5 h-5 text-pink-400" />
            <span className="font-medium">Recent Emails</span>
          </div>
          <span className="text-sm text-gray-500">{emails.length} new</span>
        </div>

        <div className="space-y-3">
          {emails.map((email, i) => (
            <div key={i} className="flex items-start gap-3 p-3 bg-surface rounded-xl">
              <div className="w-8 h-8 rounded-full bg-pink-500/20 flex items-center justify-center flex-shrink-0">
                <span className="text-xs font-bold text-pink-400">{email.from?.[0]?.toUpperCase() || '?'}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{email.from}</p>
                <p className="text-xs text-gray-400 truncate">{email.subject}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Upcoming Events */}
      <div className="bg-surface-light rounded-2xl p-4 border border-border">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-blue-400" />
            <span className="font-medium">Upcoming</span>
          </div>
        </div>

        <div className="space-y-3">
          {events.map((event, i) => (
            <div key={i} className="flex items-center gap-3 p-3 bg-surface rounded-xl">
              <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex flex-col items-center justify-center flex-shrink-0">
                <span className="text-xs text-blue-400 font-bold">{new Date(event.start).toLocaleDateString('en-US', { weekday: 'short' })}</span>
                <span className="text-lg font-bold text-blue-400">{new Date(event.start).getDate()}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{event.summary}</p>
                <p className="text-xs text-gray-400">{new Date(event.start).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
