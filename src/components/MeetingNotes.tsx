import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  Plus, 
  Clock, 
  Users, 
  CheckCircle, 
  ExternalLink,
  Loader2,
  Video
} from 'lucide-react';

interface Meeting {
  id: string;
  summary: string;
  start: string;
  end: string;
  attendees: string[];
  hasNotes: boolean;
}

interface MeetingNotesProps {
  onCreateNotes: (meetingId: string) => void;
}

export function MeetingNotes({ onCreateNotes }: MeetingNotesProps) {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState<string | null>(null);

  useEffect(() => {
    fetchTodaysMeetings();
  }, []);

  const fetchTodaysMeetings = async () => {
    try {
      const response = await fetch('/api/calendar/meetings');
      if (response.ok) {
        const data = await response.json();
        setMeetings(data.events || []);
      }
    } catch (error) {
      console.error('Failed to fetch meetings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateNotes = async (meetingId: string) => {
    setCreating(meetingId);
    try {
      const response = await fetch('/api/calendar/meetings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventId: meetingId })
      });

      if (response.ok) {
        const data = await response.json();
        onCreateNotes(meetingId);
        // Refresh to show notes created
        fetchTodaysMeetings();
      }
    } catch (error) {
      console.error('Failed to create meeting notes:', error);
    } finally {
      setCreating(null);
    }
  };

  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const isUpcoming = (dateStr: string) => {
    return new Date(dateStr) > new Date();
  };

  const isPast = (dateStr: string) => {
    return new Date(dateStr) < new Date();
  };

  if (loading) {
    return (
      <div className="bg-[#1a1a1a] rounded-xl p-4">
        <div className="flex items-center gap-2 mb-4">
          <Calendar className="w-5 h-5 text-blue-400" />
          <h3 className="text-sm font-semibold text-white">Today's Meetings</h3>
        </div>
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 text-blue-400 animate-spin" />
        </div>
      </div>
    );
  }

  if (meetings.length === 0) {
    return (
      <div className="bg-[#1a1a1a] rounded-xl p-4">
        <div className="flex items-center gap-2 mb-4">
          <Calendar className="w-5 h-5 text-blue-400" />
          <h3 className="text-sm font-semibold text-white">Today's Meetings</h3>
        </div>
        <p className="text-sm text-gray-500 text-center py-4">No meetings scheduled for today</p>
      </div>
    );
  }

  return (
    <div className="bg-[#1a1a1a] rounded-xl p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-blue-400" />
          <h3 className="text-sm font-semibold text-white">Today's Meetings</h3>
        </div>
        <span className="text-xs text-gray-500">{meetings.length} scheduled</span>
      </div>

      <div className="space-y-3">
        {meetings.map((meeting) => (
          <div 
            key={meeting.id}
            className={`p-3 rounded-lg border ${
              isUpcoming(meeting.start) 
                ? 'bg-[#222] border-blue-500/30' 
                : 'bg-[#1a1a1a] border-gray-800 opacity-70'
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-medium text-white truncate">{meeting.summary}</h4>
                
                <div className="flex items-center gap-3 mt-2">
                  <div className="flex items-center gap-1 text-xs text-gray-500">
                    <Clock className="w-3 h-3" />
                    {formatTime(meeting.start)} - {formatTime(meeting.end)}
                  </div>
                  
                  {meeting.attendees.length > 0 && (
                    <div className="flex items-center gap-1 text-xs text-gray-500"
                    >
                      <Users className="w-3 h-3" />
                      {meeting.attendees.length}
                    </div>
                  )}
                </div>
              </div>

              <button
                onClick={() => handleCreateNotes(meeting.id)}
                disabled={creating === meeting.id}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  meeting.hasNotes
                    ? 'bg-green-500/20 text-green-400'
                    : 'bg-blue-500/20 text-blue-400 hover:bg-blue-500/30'
                }`}
              >
                {creating === meeting.id ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : meeting.hasNotes ? (
                  <>
                    <CheckCircle className="w-3 h-3" />
                    Notes
                  </>
                ) : (
                  <>
                    <Plus className="w-3 h-3" />
                    Notes
                  </>
                )}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
