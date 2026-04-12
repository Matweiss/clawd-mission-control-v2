import React, { useEffect, useMemo, useState } from 'react';
import { Plane, CheckSquare, CloudSun, Shield, Clock, MapPin, CalendarDays, RefreshCw } from 'lucide-react';

type EventType = 'work' | 'personal' | 'travel' | 'social' | 'family';

interface CalendarEvent {
  id: string;
  summary: string;
  start: string;
  end: string;
  location?: string;
  description?: string;
  type: EventType;
}

interface ChecklistItem {
  label: string;
  done: boolean;
  urgency: 'soon' | 'now' | 'later';
}

interface TripPlan {
  id: string;
  title: string;
  start: string;
  end: string;
  destination: string;
  daysUntil: number;
  nights: number;
  checklist: ChecklistItem[];
  source: 'calendar';
}

const TRAVEL_KEYWORDS = ['✈️', 'flight', 'fly', 'airport', 'trip', 'travel', 'lax', 'jfk', 'ewr', 'phx'];

function isTravelEvent(event: CalendarEvent) {
  const haystack = `${event.summary} ${event.description || ''} ${event.location || ''}`.toLowerCase();
  return event.type === 'travel' || TRAVEL_KEYWORDS.some((keyword) => haystack.includes(keyword));
}

function startOfDay(date: Date) {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
}

function diffDays(from: Date, to: Date) {
  return Math.ceil((startOfDay(to).getTime() - startOfDay(from).getTime()) / (1000 * 60 * 60 * 24));
}

function extractDestination(event: CalendarEvent) {
  const text = `${event.summary} ${event.description || ''}`;
  const dashMatch = text.match(/[-–]\s*([^\n]+)/);
  if (dashMatch?.[1]) return dashMatch[1].trim();

  const routeMatch = text.match(/\b([A-Z]{3})\s*[→-]\s*([A-Z]{3})\b/);
  if (routeMatch?.[2]) return routeMatch[2];

  if (event.location) return event.location;
  return 'Destination TBD';
}

function buildChecklist(event: CalendarEvent, daysUntil: number): ChecklistItem[] {
  const items: ChecklistItem[] = [
    { label: 'Weather check for destination', done: daysUntil < 0, urgency: daysUntil <= 7 ? 'now' : 'later' },
    { label: 'Packing checklist ready', done: false, urgency: daysUntil <= 5 ? 'now' : 'soon' },
    { label: 'Travel docs and IDs confirmed', done: false, urgency: daysUntil <= 3 ? 'now' : 'soon' },
    { label: 'Home security prep and lock-it-down test', done: false, urgency: daysUntil <= 2 ? 'now' : 'soon' },
    { label: 'Check-in reminder (24h before)', done: false, urgency: daysUntil <= 1 ? 'now' : 'later' },
    { label: 'Airport ride / traffic check', done: false, urgency: daysUntil <= 1 ? 'now' : 'later' },
  ];

  const text = `${event.summary} ${event.description || ''}`.toLowerCase();
  if (text.includes('golf')) {
    items.splice(2, 0, { label: 'Pack activity-specific gear (golf / event items)', done: false, urgency: daysUntil <= 3 ? 'now' : 'soon' });
  }

  if (text.includes('red-eye') || text.includes('overnight')) {
    items.splice(3, 0, { label: 'Prep red-eye comfort kit', done: false, urgency: daysUntil <= 2 ? 'now' : 'soon' });
  }

  return items;
}

export function TravelPrepAssistantCard() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const [workRes, personalRes] = await Promise.all([
        fetch('/api/calendar/meetings'),
        fetch('/api/calendar/personal'),
      ]);

      const workData = workRes.ok ? await workRes.json() : { events: [] };
      const personalData = personalRes.ok ? await personalRes.json() : { events: [] };

      const merged: CalendarEvent[] = [
        ...((workData.events || []).map((e: any) => ({
          id: e.id,
          summary: e.summary,
          start: e.start,
          end: e.end,
          location: e.location,
          description: e.description,
          type: 'work' as const,
        })) || []),
        ...((personalData.events || []).map((e: any) => ({
          id: e.id,
          summary: e.summary,
          start: e.start,
          end: e.end,
          location: e.location,
          description: e.description,
          type: (e.type || 'personal') as EventType,
        })) || []),
      ];

      setEvents(merged.sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime()));
    } catch (error) {
      console.error('Failed to load trip events:', error);
      setEvents([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const trips = useMemo<TripPlan[]>(() => {
    const now = new Date();

    return events
      .filter((event) => isTravelEvent(event))
      .filter((event) => new Date(event.end) >= now)
      .map((event) => {
        const start = new Date(event.start);
        const end = new Date(event.end);
        const daysUntil = diffDays(now, start);
        const nights = Math.max(0, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));

        return {
          id: event.id,
          title: event.summary,
          start: event.start,
          end: event.end,
          destination: extractDestination(event),
          daysUntil,
          nights,
          checklist: buildChecklist(event, daysUntil),
          source: 'calendar' as const,
        };
      })
      .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime())
      .slice(0, 3);
  }, [events]);

  const formatDate = (value: string) =>
    new Date(value).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      weekday: 'short',
      timeZone: 'America/Los_Angeles',
    });

  return (
    <div className="bg-surface border border-border rounded-xl overflow-hidden">
      <div className="px-4 py-3 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Plane className="w-4 h-4 text-purple-400" />
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Travel Prep Assistant</h2>
        </div>
        <button
          onClick={fetchEvents}
          className="p-1.5 rounded hover:bg-surface-light transition-colors text-gray-400"
          title="Refresh trips"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="p-4 space-y-4">
        {loading ? (
          <div className="text-sm text-gray-500">Scanning calendar for upcoming trips...</div>
        ) : trips.length === 0 ? (
          <div className="text-center py-6 text-gray-500">
            <Plane className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No upcoming trips detected</p>
            <p className="text-xs mt-1">Travel events from calendar will auto-generate prep checklists here.</p>
          </div>
        ) : (
          trips.map((trip) => {
            const visibleItems = trip.checklist.slice(0, 4);
            const urgentCount = trip.checklist.filter((item) => item.urgency === 'now' && !item.done).length;

            return (
              <div key={trip.id} className="rounded-xl border border-purple-500/20 bg-purple-500/5 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-white font-medium">{trip.title}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300">calendar</span>
                    </div>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-gray-400">
                      <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{trip.destination}</span>
                      <span className="flex items-center gap-1"><CalendarDays className="w-3 h-3" />{formatDate(trip.start)}</span>
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{trip.daysUntil <= 0 ? 'Today / in progress' : `${trip.daysUntil} day${trip.daysUntil === 1 ? '' : 's'} out`}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold text-purple-300">{trip.nights} night{trip.nights === 1 ? '' : 's'}</div>
                    <div className="text-[11px] text-gray-500">{urgentCount > 0 ? `${urgentCount} urgent` : 'on track'}</div>
                  </div>
                </div>

                <div className="mt-3 grid gap-2">
                  {visibleItems.map((item) => (
                    <div key={item.label} className="flex items-center justify-between rounded-lg bg-surface-light px-3 py-2 text-sm">
                      <div className="flex items-center gap-2 min-w-0">
                        <CheckSquare className={`w-4 h-4 ${item.done ? 'text-green-400' : item.urgency === 'now' ? 'text-yellow-400' : 'text-gray-500'}`} />
                        <span className="truncate">{item.label}</span>
                      </div>
                      <span className={`text-[10px] uppercase ${item.urgency === 'now' ? 'text-yellow-400' : item.urgency === 'soon' ? 'text-blue-400' : 'text-gray-500'}`}>
                        {item.urgency}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="mt-3 flex flex-wrap gap-2 text-[11px] text-gray-400">
                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-surface-light"><CloudSun className="w-3 h-3" />Weather</span>
                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-surface-light"><CheckSquare className="w-3 h-3" />Packing</span>
                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-surface-light"><Shield className="w-3 h-3" />Home prep</span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
