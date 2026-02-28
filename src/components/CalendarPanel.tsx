import React from 'react';
import { Calendar, Clock, Video, MapPin, ExternalLink } from 'lucide-react';

interface CalendarEvent {
  id: string;
  summary: string;
  start_time: string;
  end_time: string;
  attendees?: string[];
  meet_link?: string;
  location?: string;
}

interface CalendarPanelProps {
  events: CalendarEvent[];
}

export function CalendarPanel({ events }: CalendarPanelProps) {
  const formatTime = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
      timeZone: 'America/Los_Angeles'
    });
  };

  const isToday = (isoString: string) => {
    const date = new Date(isoString);
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const isTomorrow = (isoString: string) => {
    const date = new Date(isoString);
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return date.toDateString() === tomorrow.toDateString();
  };

  const getDayLabel = (isoString: string) => {
    if (isToday(isoString)) return 'Today';
    if (isTomorrow(isoString)) return 'Tomorrow';
    return new Date(isoString).toLocaleDateString('en-US', { 
      weekday: 'short',
      timeZone: 'America/Los_Angeles'
    });
  };

  // Group events by day
  const groupedEvents = events.reduce((acc, event) => {
    const day = getDayLabel(event.start_time);
    if (!acc[day]) acc[day] = [];
    acc[day].push(event);
    return acc;
  }, {} as Record<string, CalendarEvent[]>);

  const days = Object.keys(groupedEvents);

  return (
    <div className="bg-surface border border-border rounded-xl overflow-hidden">
      <div className="px-4 py-3 border-b border-border flex items-center justify-between">
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-2">
          <Calendar className="w-4 h-4" />
          Calendar
        </h2>
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

      <div className="p-4 max-h-[350px] overflow-y-auto">
        {events.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Calendar className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No upcoming events</p>
            <p className="text-xs mt-1">Calendar sync will populate this</p>
          </div>
        ) : (
          <div className="space-y-4">
            {days.map(day => (
              <div key={day}>
                <h3 className="text-xs font-medium text-gray-500 uppercase mb-2 flex items-center gap-2">
                  {day}
                  {day === 'Today' && <span className="w-2 h-2 bg-green-500 rounded-full" />}
                </h3>
                <div className="space-y-2">
                  {groupedEvents[day].map(event => (
                    <div 
                      key={event.id} 
                      className="p-3 bg-surface-light rounded-lg hover:bg-border transition-colors cursor-pointer group"
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex flex-col items-center min-w-[50px]">
                          <span className="text-xs text-gray-500">
                            {formatTime(event.start_time)}
                          </span>
                          <span className="text-xs text-gray-600">-</span>
                          <span className="text-xs text-gray-500">
                            {formatTime(event.end_time)}
                          </span>
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-sm truncate group-hover:text-white">
                            {event.summary}
                          </h4>
                          
                          {event.location && (
                            <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                              <MapPin className="w-3 h-3" />
                              <span className="truncate">{event.location}</span>
                            </div>
                          )}
                          
                          {event.attendees && event.attendees.length > 0 && (
                            <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                              <span className="truncate">
                                {event.attendees.length} attendee{event.attendees.length > 1 ? 's' : ''}
                              </span>
                            </div>
                          )}
                        </div>

                        {event.meet_link && (
                          <a
                            href={event.meet_link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 bg-green-500/20 text-green-400 rounded hover:bg-green-500/30"
                            onClick={(e) => e.stopPropagation()}
                            title="Join Meet"
                          >
                            <Video className="w-3 h-3" />
                          </a>
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
    </div>
  );
}
