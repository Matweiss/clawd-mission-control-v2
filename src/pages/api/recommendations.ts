import type { NextApiRequest, NextApiResponse } from 'next';

interface CalendarEvent {
  id: string;
  summary: string;
  start: string;
  end: string;
}

interface TimeSlot {
  start: Date;
  end: Date;
  duration: number; // minutes
}

interface Recommendation {
  type: 'yoga' | 'movie' | 'break';
  title: string;
  time: string;
  duration: string;
  reason: string;
  action: string;
}

function findFreeTimeSlots(events: CalendarEvent[], startHour: number = 6, endHour: number = 23): TimeSlot[] {
  const slots: TimeSlot[] = [];
  const now = new Date();
  const dayStart = new Date(now);
  dayStart.setHours(startHour, 0, 0, 0);
  const dayEnd = new Date(now);
  dayEnd.setHours(endHour, 0, 0, 0);

  // Sort events by start time
  const sortedEvents = events
    .map(e => ({
      ...e,
      startTime: new Date(e.start),
      endTime: new Date(e.end),
    }))
    .sort((a, b) => a.startTime.getTime() - b.startTime.getTime());

  let currentTime = dayStart;

  for (const event of sortedEvents) {
    if (event.startTime > currentTime) {
      const duration = (event.startTime.getTime() - currentTime.getTime()) / (1000 * 60);
      if (duration >= 30) {
        slots.push({
          start: currentTime,
          end: event.startTime,
          duration,
        });
      }
    }
    currentTime = new Date(Math.max(currentTime.getTime(), event.endTime.getTime()));
  }

  // Check for slot after last event
  if (currentTime < dayEnd) {
    const duration = (dayEnd.getTime() - currentTime.getTime()) / (1000 * 60);
    if (duration >= 30) {
      slots.push({
        start: currentTime,
        end: dayEnd,
        duration,
      });
    }
  }

  return slots;
}

function generateRecommendations(slots: TimeSlot[]): Recommendation[] {
  const recommendations: Recommendation[] = [];

  for (const slot of slots) {
    const hour = slot.start.getHours();
    const duration = slot.duration;

    // Morning yoga (before 10am)
    if (hour >= 6 && hour < 10 && duration >= 60) {
      recommendations.push({
        type: 'yoga',
        title: 'Morning C1 - CorePower Yoga 1',
        time: slot.start.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
        duration: '60 min',
        reason: 'Perfect morning flow to start the day',
        action: 'Book at Encino',
      });
    }

    // Lunch yoga (11am-2pm)
    if (hour >= 11 && hour < 14 && duration >= 45) {
      recommendations.push({
        type: 'yoga',
        title: 'C2 - CorePower Yoga 2',
        time: '12:15pm',
        duration: '60 min',
        reason: 'Midday energizer between meetings',
        action: 'Book at Encino',
      });
    }

    // Evening yoga (after 4pm) - Mat's preferred time
    if (hour >= 16 && hour < 19 && duration >= 60) {
      recommendations.push({
        type: 'yoga',
        title: 'YS - Yoga Sculpt',
        time: '4:15pm',
        duration: '60 min',
        reason: 'Your usual time - consistency is key',
        action: 'Book at Encino',
      });
    }

    // Late evening movie (after 8pm)
    if (hour >= 20 && duration >= 90) {
      recommendations.push({
        type: 'movie',
        title: 'Dune: Part Two',
        time: slot.start.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
        duration: '2h 46m',
        reason: 'Wind down with epic sci-fi',
        action: 'Add to watchlist',
      });
    }

    // Short break
    if (duration >= 30 && duration < 60) {
      recommendations.push({
        type: 'break',
        title: 'Quick Breathing Exercise',
        time: slot.start.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
        duration: `${Math.floor(duration)} min`,
        reason: 'Short reset between activities',
        action: 'Start now',
      });
    }
  }

  return recommendations.slice(0, 5); // Top 5 recommendations
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Fetch calendar events from Supabase or Google Calendar API
    let events: CalendarEvent[] = [];
    
    // Try Supabase first
    try {
      const { createClient } = require('@supabase/supabase-js');
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      );
      
      const { data, error } = await supabase
        .from('calendar_events')
        .select('id, summary, start_time, end_time')
        .gte('start_time', new Date().toISOString())
        .order('start_time', { ascending: true })
        .limit(20);
      
      if (!error && data) {
        events = data.map((e: any) => ({
          id: e.id,
          summary: e.summary,
          start: e.start_time,
          end: e.end_time,
        }));
      }
    } catch (e) {
      console.warn('Calendar fetch failed', e);
    }

    if (events.length === 0) {
      return res.status(200).json({
        recommendations: [],
        freeSlots: 0,
        eventsToday: 0,
        timestamp: new Date().toISOString(),
        mode: 'empty-calendar',
      });
    }

    const freeSlots = findFreeTimeSlots(events);
    const recommendations = generateRecommendations(freeSlots);

    return res.status(200).json({
      recommendations,
      freeSlots: freeSlots.length,
      eventsToday: events.length,
      timestamp: new Date().toISOString(),
      mode: 'live-calendar',
    });
  } catch (error) {
    console.error('Recommendation engine error:', error);
    return res.status(500).json({ error: 'Failed to generate recommendations' });
  }
}
