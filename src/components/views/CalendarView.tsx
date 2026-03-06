import React, { useState, useEffect } from 'react';
import { Calendar as CalendarIcon, Clock, Users, FileText, ExternalLink, ChevronLeft, ChevronRight, X, MapPin, Video, RefreshCw } from 'lucide-react';
import { fetchCalendarEvents, CalendarEvent as GoogleCalendarEvent } from '../../lib/google-calendar';

interface CalendarEvent {
  id: string;
  title: string;
  start: string;
  end: string;
  attendees?: string[];
  description?: string;
  location?: string;
  meetLink?: string;
  isBattleCard?: boolean;
  dealValue?: string;
  company?: string;
}

const SAMPLE_EVENTS: CalendarEvent[] = [
  // REAL EVENTS from your Google Calendar (Tuesday March 3, 2026)
  {
    id: '1',
    title: 'Craftable + Bracketts Crossing Country Club',
    start: '2026-03-03T08:00:00',
    end: '2026-03-03T08:30:00',
    attendees: ['lrother@brackettscrossingcc.com'],
    description: 'Initial exploratory call with country club',
    location: 'Google Meet',
    isBattleCard: true,
    dealValue: '$45K',
    company: 'Bracketts Crossing Country Club'
  },
  {
    id: '2',
    title: 'Caldwell County BBQ + Craftable',
    start: '2026-03-03T10:45:00',
    end: '2026-03-03T11:15:00',
    attendees: ['Casey Lane', 'Travis Taylor', 'Addison Taylor', 'Jaden Taylor'],
    description: 'Multi-stakeholder call. Focus on expansion to 3rd location',
    location: 'Google Meet',
    isBattleCard: true,
    dealValue: '$85K',
    company: 'Caldwell County BBQ'
  },
  {
    id: '3',
    title: 'Mat / Chet: 1 on 1',
    start: '2026-03-03T11:00:00',
    end: '2026-03-03T11:45:00',
    attendees: ['Mat', 'Chet'],
    description: 'Weekly sync',
    location: 'Zoom'
  },
  {
    id: '4',
    title: 'Internal Deal Desk',
    start: '2026-03-03T13:00:00',
    end: '2026-03-03T14:00:00',
    attendees: ['Rob', 'James', 'Harrison', 'Mat'],
    description: 'Q1 pipeline review',
    location: 'Zoom'
  },
  {
    id: '5',
    title: 'Pennbridge Hospitality - Hunter Durgan',
    start: '2026-03-03T14:15:00',
    end: '2026-03-03T14:45:00',
    attendees: ['Hunter Durgan', 'Mat'],
    description: 'Toast POS integration discussion',
    location: 'Google Meet',
    isBattleCard: true,
    dealValue: '$35K',
    company: 'Pennbridge Hospitality'
  },
  // Wednesday March 4 events
  {
    id: '6',
    title: 'Springs Hotels - Daniel Valdez',
    start: '2026-03-04T09:15:00',
    end: '2026-03-04T09:45:00',
    attendees: ['Daniel Valdez'],
    description: 'Exploratory call',
    location: 'Google Meet',
    isBattleCard: true
  },
  {
    id: '7',
    title: 'Future Bars Group - Michael Winetroub',
    start: '2026-03-04T16:00:00',
    end: '2026-03-04T16:30:00',
    attendees: ['Michael Winetroub'],
    description: 'Exploratory call',
    location: 'Google Meet',
    isBattleCard: true
  },
  // Thursday March 5 (TODAY)
  {
    id: '8',
    title: 'Morning Catch Up',
    start: '2026-03-05T08:45:00',
    end: '2026-03-05T09:00:00',
    attendees: ['Team'],
    description: 'Daily standup',
    location: 'Google Meet'
  },
  {
    id: '9',
    title: 'Sales Pipeline Review',
    start: '2026-03-05T09:00:00',
    end: '2026-03-05T10:00:00',
    attendees: ['Sales Team'],
    description: 'Weekly pipeline review',
    location: 'Google Meet',
    isBattleCard: true
  },
  // Friday March 6
  {
    id: '10',
    title: 'Chubby Group - Contract Review',
    start: '2026-03-06T10:00:00',
    end: '2026-03-06T11:00:00',
    attendees: ['Will', 'Tim', 'Mat'],
    description: 'Review contract redlines and finalize terms',
    location: 'Zoom',
    isBattleCard: true,
    dealValue: '$7.2K',
    company: 'Chubby Group'
  },
  // Monday March 9
  {
    id: '11',
    title: 'Holland America Princess - Proposal Review',
    start: '2026-03-09T14:00:00',
    end: '2026-03-09T15:00:00',
    attendees: ['HAP Team', 'Mat'],
    description: 'Review proposal before sending to legal',
    location: 'Google Meet',
    isBattleCard: true,
    dealValue: '$91.3K',
    company: 'Holland America Princess'
  },
];

export function CalendarView({ events = [] }: { events?: CalendarEvent[] }) {
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [currentDate, setCurrentDate] = useState(new Date('2026-03-03')); // Tuesday (your meeting day)
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch real calendar data on mount
  useEffect(() => {
    loadCalendarEvents();
  }, []);

  const loadCalendarEvents = async () => {
    setLoading(true);
    try {
      // Get events for the current week
      const startOfWeek = new Date(currentDate);
      startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 7);

      const events = await fetchCalendarEvents(
        startOfWeek.toISOString(),
        endOfWeek.toISOString()
      );

      if (events.length > 0) {
        setCalendarEvents(events);
      } else {
        // Fallback to sample data if no events found
        setCalendarEvents(SAMPLE_EVENTS);
      }
    } catch (error) {
      console.error('Failed to load calendar:', error);
      setCalendarEvents(SAMPLE_EVENTS);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (isoString: string) => {
    return new Date(isoString).toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const navigateDay = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    newDate.setDate(currentDate.getDate() + (direction === 'next' ? 1 : -1));
    setCurrentDate(newDate);
  };

  // Filter events for current date
  const todaysEvents = calendarEvents.filter(event => {
    const eventDate = new Date(event.start).toDateString();
    return eventDate === currentDate.toDateString();
  }).sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Calendar</h1>
          <p className="text-sm text-gray-500 mt-1">Meetings, battle cards, and schedule</p>
        </div>
        
        <div className="flex items-center gap-2">
          <button 
            onClick={loadCalendarEvents}
            disabled={loading}
            className="flex items-center gap-2 px-3 py-2 bg-[#2A2A2A] hover:bg-[#3A3A3A] rounded-lg text-sm text-gray-300 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            {loading ? 'Loading...' : 'Sync'}
          </button>

          <button 
            onClick={() => setCurrentDate(new Date('2026-03-05'))}
            className="px-3 py-2 bg-[#2A2A2A] hover:bg-[#3A3A3A] rounded-lg text-sm text-gray-300 transition-colors"
          >
            Today
          </button>

          <button 
            onClick={() => navigateDay('prev')}
            className="p-2 hover:bg-[#2A2A2A] rounded-lg"
          >
            <ChevronLeft className="w-5 h-5 text-gray-400" />
          </button>
          
          <span className="text-white font-medium min-w-[200px] text-center">
            {formatDate(currentDate)}
          </span>
          
          <button 
            onClick={() => navigateDay('next')}
            className="p-2 hover:bg-[#2A2A2A] rounded-lg"
          >
            <ChevronRight className="w-5 h-5 text-gray-400" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Events List */}
        <div className="col-span-2 space-y-4">
          {loading ? (
            <div className="bg-[#161616] rounded-xl p-8 text-center">
              <RefreshCw className="w-12 h-12 text-gray-600 mx-auto mb-3 animate-spin" />
              <p className="text-gray-400">Loading your calendar...</p>
            </div>
          ) : todaysEvents.length === 0 ? (
            <div className="bg-[#161616] rounded-xl p-8 text-center">
              <CalendarIcon className="w-12 h-12 text-gray-600 mx-auto mb-3" />
              <p className="text-gray-400">No meetings scheduled for this day</p>
            </div>
          ) : (
            todaysEvents.map((event) => (
              <div 
                key={event.id}
                onClick={() => setSelectedEvent(event)}
                className={`bg-[#161616] rounded-xl p-4 hover:bg-[#1A1A1A] transition-colors cursor-pointer ${
                  event.isBattleCard ? 'border-l-4 border-orange-500' : ''
                }`}
              >
                <div className="flex items-start gap-4">
                  {/* Time Column */}
                  <div className="text-center min-w-[80px]">
                    <p className="text-lg font-semibold text-white">{formatTime(event.start)}</p>
                    <p className="text-sm text-gray-500">{formatTime(event.end)}</p>
                  </div>

                  {/* Content */}
                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-white font-medium">{event.title}</h3>
                        
                        {event.company && (
                          <p className="text-sm text-orange-400 mt-0.5">{event.company}</p>
                        )}
                      </div>
                      
                      {event.isBattleCard && event.dealValue && (
                        <span className="px-2 py-1 bg-orange-500/20 text-orange-400 rounded text-sm">
                          {event.dealValue}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-4 mt-2 text-sm text-gray-400">
                      <span className="flex items-center gap-1">
                        <Video className="w-3.5 h-3.5" />
                        {event.location}
                      </span>
                      
                      {event.attendees && (
                        <span className="flex items-center gap-1">
                          <Users className="w-3.5 h-3.5" />
                          {event.attendees.length} attendees
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Battle Cards Panel */}
        <div className="space-y-4">
          <div className="bg-[#161616] rounded-xl p-4">
            <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-orange-500"></span>
              Today's Battle Cards
            </h3>
            
            <div className="space-y-3">
              {todaysEvents.filter(e => e.isBattleCard).map((event) => (
                <div 
                  key={event.id}
                  onClick={() => setSelectedEvent(event)}
                  className="p-3 bg-[#1A1A1A] rounded-lg cursor-pointer hover:bg-[#2A2A2A] transition-colors"
                >
                  <p className="text-sm text-white font-medium">{event.company}</p>
                  <p className="text-xs text-orange-400 mt-0.5">{event.dealValue} • {formatTime(event.start)}</p>
                  <p className="text-xs text-gray-500 mt-1 line-clamp-2">{event.description}</p>
                </div>
              ))}
              
              {todaysEvents.filter(e => e.isBattleCard).length === 0 && (
                <p className="text-sm text-gray-500 text-center py-4">No battle cards today</p>
              )}
            </div>
          </div>

          <div className="bg-[#161616] rounded-xl p-4">
            <h3 className="text-sm font-semibold text-white mb-3">Quick Actions</h3>
            <div className="space-y-2">
              <button className="w-full py-2 bg-[#1A1A1A] hover:bg-[#2A2A2A] rounded-lg text-sm text-gray-300 transition-colors">
                Schedule Meeting
              </button>
              <button className="w-full py-2 bg-[#1A1A1A] hover:bg-[#2A2A2A] rounded-lg text-sm text-gray-300 transition-colors">
                Generate Battle Card
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Event Detail Modal */}
      {selectedEvent && (
        <EventDetailModal 
          event={selectedEvent} 
          onClose={() => setSelectedEvent(null)} 
        />
      )}
    </div>
  );
}

function EventDetailModal({ event, onClose }: { event: CalendarEvent; onClose: () => void }) {
  const formatTime = (isoString: string) => {
    return new Date(isoString).toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  };

  const formatDate = (isoString: string) => {
    return new Date(isoString).toLocaleDateString('en-US', { 
      weekday: 'long',
      month: 'long', 
      day: 'numeric' 
    });
  };

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
      <div className="bg-[#161616] rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-[#161616] border-b border-[#2A2A2A] p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {event.isBattleCard && (
              <span className="px-2 py-1 bg-orange-500/20 text-orange-400 rounded text-xs">
                Battle Card
              </span>
            )}
            <h2 className="text-lg font-bold text-white">{event.title}</h2>
          </div>
          
          <button onClick={onClose} className="p-1 hover:bg-[#2A2A2A] rounded-lg">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {/* Time */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
              <Clock className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <p className="text-white">{formatTime(event.start)} - {formatTime(event.end)}</p>
              <p className="text-sm text-gray-500">{formatDate(event.start)}</p>
            </div>
          </div>

          {/* Location */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
              <MapPin className="w-5 h-5 text-purple-400" />
            </div>
            <div className="flex-1">
              <p className="text-white">{event.location}</p>
              {event.meetLink && (
                <a 
                  href={`https://${event.meetLink}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-blue-400 flex items-center gap-1 hover:underline"
                >
                  Join Meeting
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>
          </div>

          {/* Description */}
          {event.description && (
            <div className="bg-[#1A1A1A] rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <FileText className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-400">Description</span>
              </div>
              <p className="text-gray-300">{event.description}</p>
            </div>
          )}

          {/* Attendees */}
          {event.attendees && event.attendees.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Users className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-400">Attendees ({event.attendees.length})</span>
              </div>
              
              <div className="flex flex-wrap gap-2">
                {event.attendees.map((attendee, i) => (
                  <div key={i} className="flex items-center gap-2 px-3 py-1.5 bg-[#1A1A1A] rounded-full">
                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-xs font-bold text-white">
                      {attendee.charAt(0)}
                    </div>
                    <span className="text-sm text-gray-300">{attendee}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Deal Info (for battle cards) */}
          {event.isBattleCard && (
            <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-4">
              <h4 className="text-orange-400 font-medium mb-2">Deal Intelligence</h4>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Company: </span>
                  <span className="text-white">{event.company}</span>
                </div>
                <div>
                  <span className="text-gray-500">Deal Value: </span>
                  <span className="text-orange-400">{event.dealValue}</span>
                </div>
              </div>
              
              <button className="mt-3 w-full py-2 bg-orange-500/20 text-orange-400 rounded-lg hover:bg-orange-500/30 transition-colors text-sm">
                View Full Battle Card
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
