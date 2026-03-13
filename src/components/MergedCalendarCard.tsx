import React, { useEffect, useState } from 'react';
import { Calendar, ExternalLink, MapPin, Video, Plane, Users, Heart, Trash2, Plus } from 'lucide-react';

interface CalendarEvent {
  id: string;
  summary: string;
  start: string;
  end: string;
  location?: string;
  description?: string;
  meet_link?: string;
  type: 'work' | 'personal' | 'travel' | 'social' | 'family';
  attendees?: string[];
}

export function MergedCalendarCard() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newEvent, setNewEvent] = useState({
    summary: '',
    start: '',
    end: '',
    location: '',
    description: ''
  });

  const fetchEvents = async () => {
    setLoading(true);
    try {
      // Fetch both work and personal events
      const [workRes, personalRes] = await Promise.all([
        fetch('/api/calendar/meetings'),
        fetch('/api/calendar/personal')
      ]);

      const workData = workRes.ok ? await workRes.json() : { events: [] };
      const personalData = personalRes.ok ? await personalRes.json() : { events: [] };

      // Merge and format events
      const workEvents: CalendarEvent[] = (workData.events || []).map((e: any) => ({
        id: e.id,
        summary: e.summary,
        start: e.start,
        end: e.end,
        location: e.location,
        meet_link: e.meet_link,
        type: 'work',
        attendees: e.attendees
      }));

      const personalEvents: CalendarEvent[] = (personalData.events || []).map((e: any) => ({
        id: e.id,
        summary: e.summary,
        start: e.start,
        end: e.end,
        location: e.location,
        description: e.description,
        type: e.type || 'personal'
      }));

      // Combine and sort by date
      const allEvents = [...workEvents, ...personalEvents].sort(
        (a, b) => new Date(a.start).getTime() - new Date(b.start).getTime()
      );

      setEvents(allEvents);
    } catch (error) {
      console.error('Calendar fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const handleDeleteEvent = async (eventId: string, type: string) => {
    // Only allow deleting work events (personal events are hardcoded)
    if (type !== 'work') {
      alert('Can only delete work events from Google Calendar. Personal events are managed in memory.');
      return;
    }

    setActionLoading(eventId);
    try {
      const response = await fetch(`/api/calendar/action?eventId=${eventId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        fetchEvents();
      } else {
        const error = await response.json();
        alert(`Failed to delete event: ${error.error || 'Unknown error'}`);
      }
    } catch (err) {
      alert(`Failed to delete event: ${err}`);
    } finally {
      setActionLoading(null);
    }
  };

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading('create');
    try {
      const response = await fetch('/api/calendar/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newEvent)
      });

      if (response.ok) {
        setShowAddForm(false);
        setNewEvent({ summary: '', start: '', end: '', location: '', description: '' });
        fetchEvents();
      } else {
        const error = await response.json();
        alert(`Failed to create event: ${error.error || 'Unknown error'}`);
      }
    } catch (err) {
      alert(`Failed to create event: ${err}`);
    } finally {
      setActionLoading(null);
    }
  };

  const formatTime = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
      timeZone: 'America/Los_Angeles'
    });
  };

  const formatDate = (isoString: string) => {
    const date = new Date(isoString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.toDateString() === today.toDateString()) return 'Today';
    if (date.toDateString() === tomorrow.toDateString()) return 'Tomorrow';
    
    return date.toLocaleDateString('en-US', { 
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      timeZone: 'America/Los_Angeles'
    });
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'work': return <Calendar className="w-3 h-3 text-blue-400" />;
      case 'travel': return <Plane className="w-3 h-3 text-purple-400" />;
      case 'family': return <Heart className="w-3 h-3 text-red-400" />;
      case 'social': return <Users className="w-3 h-3 text-green-400" />;
      default: return <Calendar className="w-3 h-3 text-gray-400" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'work': return 'border-l-blue-500';
      case 'travel': return 'border-l-purple-500';
      case 'family': return 'border-l-red-500';
      case 'social': return 'border-l-green-500';
      default: return 'border-l-gray-500';
    }
  };

  // Group by day
  const grouped = events.reduce((acc, event) => {
    const day = formatDate(event.start);
    if (!acc[day]) acc[day] = [];
    acc[day].push(event);
    return acc;
  }, {} as Record<string, CalendarEvent[]>);

  return (
    <div className="bg-surface border border-border rounded-xl overflow-hidden">
      <div className="px-4 py-3 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-blue-400" />
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Calendar</h2>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="p-1.5 bg-blue-500/20 text-blue-400 rounded hover:bg-blue-500/30 transition-colors"
            title="Add Event"
          >
            <Plus className="w-4 h-4" />
          </button>
          <a 
            href="https://calendar.google.com/calendar/u/0/r"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-blue-400 hover:underline flex items-center gap-1"
          >
            Open
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>

      {showAddForm && (
        <div className="p-4 border-b border-border bg-surface-light">
          <h3 className="text-sm font-medium mb-3">Add New Event</h3>
          <form onSubmit={handleCreateEvent} className="space-y-2">
            <input
              type="text"
              placeholder="Event title"
              value={newEvent.summary}
              onChange={(e) => setNewEvent({...newEvent, summary: e.target.value})}
              className="w-full px-3 py-2 bg-surface border border-border rounded text-sm"
              required
            />
            <div className="grid grid-cols-2 gap-2">
              <input
                type="datetime-local"
                value={newEvent.start}
                onChange={(e) => setNewEvent({...newEvent, start: e.target.value})}
                className="px-3 py-2 bg-surface border border-border rounded text-sm"
                required
              />
              <input
                type="datetime-local"
                value={newEvent.end}
                onChange={(e) => setNewEvent({...newEvent, end: e.target.value})}
                className="px-3 py-2 bg-surface border border-border rounded text-sm"
                required
              />
            </div>
            <input
              type="text"
              placeholder="Location (optional)"
              value={newEvent.location}
              onChange={(e) => setNewEvent({...newEvent, location: e.target.value})}
              className="w-full px-3 py-2 bg-surface border border-border rounded text-sm"
            />
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={actionLoading === 'create'}
                className="flex-1 py-2 bg-blue-500/20 text-blue-400 rounded text-sm hover:bg-blue-500/30 transition-colors"
              >
                {actionLoading === 'create' ? 'Creating...' : 'Create'}
              </button>
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-4 py-2 bg-surface border border-border rounded text-sm hover:bg-border transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="p-4 max-h-[400px] overflow-y-auto">
        {events.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Calendar className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">{loading ? 'Loading...' : 'No upcoming events'}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {Object.entries(grouped).map(([day, dayEvents]) => (
              <div key={day}>
                <h3 className="text-xs font-medium text-gray-500 uppercase mb-2 flex items-center gap-2">
                  {day}
                  {day === 'Today' && <span className="w-2 h-2 bg-green-500 rounded-full" />}
                </h3>
                <div className="space-y-2">
                  {dayEvents.map(event => (
                    <div 
                      key={event.id} 
                      className={`p-3 bg-surface-light rounded-lg border-l-2 ${getTypeColor(event.type)} hover:bg-border transition-colors`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex flex-col items-center min-w-[50px]">
                          <span className="text-xs text-gray-500">{formatTime(event.start)}</span>
                          <span className="text-xs text-gray-600">-</span>
                          <span className="text-xs text-gray-500">{formatTime(event.end)}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            {getTypeIcon(event.type)}
                            <h4 className="font-medium text-sm truncate">{event.summary}</h4>
                          </div>
                          
                          {event.location && (
                            <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                              <MapPin className="w-3 h-3" />
                              <span className="truncate">{event.location}</span>
                            </div>
                          )}
                          
                          {event.description && (
                            <p className="text-xs text-gray-400 mt-1 truncate">{event.description}</p>
                          )}
                        </div>

                        {event.meet_link && (
                          <a
                            href={event.meet_link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 bg-green-500/20 text-green-400 rounded hover:bg-green-500/30"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Video className="w-3 h-3" />
                          </a>
                        )}
                        
                        {event.type === 'work' && (
                          <button
                            onClick={() => handleDeleteEvent(event.id, event.type)}
                            disabled={actionLoading === event.id}
                            className="p-1.5 text-gray-600 hover:text-red-400 rounded hover:bg-red-500/10 transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="px-4 py-3 border-t border-border flex items-center justify-between text-xs text-gray-500">
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1"><span className="w-2 h-2 bg-blue-500 rounded-full" /> Work</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 bg-purple-500 rounded-full" /> Travel</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 bg-red-500 rounded-full" /> Family</span>
        </div>
        <span>{events.length} events</span>
      </div>
    </div>
  );
}
