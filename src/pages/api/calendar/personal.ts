import type { NextApiRequest, NextApiResponse } from 'next';

interface PersonalEvent {
  id: string;
  summary: string;
  start: string;
  end: string;
  location?: string;
  description?: string;
  type: 'personal' | 'travel' | 'social' | 'family';
}

// Personal events from memory/2026-03-12.md
const PERSONAL_EVENTS: PersonalEvent[] = [
  {
    id: 'personal-1',
    summary: 'Sushi Making Class with Sarah',
    start: '2026-03-14T19:00:00-07:00',
    end: '2026-03-14T21:00:00-07:00',
    type: 'personal',
    description: 'Evening sushi making class'
  },
  {
    id: 'personal-2',
    summary: 'Dinner with Family + Financial Advisor (Amy)',
    start: '2026-03-18T18:00:00-07:00',
    end: '2026-03-18T20:00:00-07:00',
    location: 'Cosa Nostra, Westlake',
    type: 'family',
    description: 'Dinner with Aunt, Uncle, Cousins Mike & Lisa, Financial Advisor Amy'
  },
  {
    id: 'travel-1',
    summary: '✈️ Arizona - Jason Leon Bachelor Party',
    start: '2026-03-26T11:15:00-07:00',
    end: '2026-03-30T23:59:00-07:00',
    type: 'travel',
    description: 'Southwest 2416 LAX→PHX, 11:15 AM PST. With Wes and Saunders. Golf at We-Ko-Pa Friday.'
  },
  {
    id: 'travel-2',
    summary: '✈️ NYC Trip - Sarah',
    start: '2026-03-30T10:20:00-07:00',
    end: '2026-04-06T13:00:00-07:00',
    type: 'travel',
    description: 'Sarah: UA 2127 LAX→EWR. Mat meets her there. Work with Dylan, family visits, Passover in Philly.'
  },
  {
    id: 'travel-3',
    summary: '✈️ NYC Trip - Mat Departure',
    start: '2026-03-31T23:59:00-07:00',
    end: '2026-04-01T08:30:00-04:00',
    type: 'travel',
    description: 'DL 0915 LAX→JFK, 11:59 PM PST (red-eye)'
  },
  {
    id: 'family-1',
    summary: 'Passover + Baby 1st Birthday (Philly)',
    start: '2026-04-04T11:00:00-04:00',
    end: '2026-04-04T14:00:00-04:00',
    location: 'Horsham, PA',
    type: 'family',
    description: "Sarah's half-sister's baby 1st birthday, ~11 AM"
  }
];

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Get today's date
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Filter events from today onwards
  const upcomingEvents = PERSONAL_EVENTS.filter(event => {
    const eventDate = new Date(event.start);
    return eventDate >= today;
  }).sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());

  return res.status(200).json({
    events: upcomingEvents,
    count: upcomingEvents.length,
    source: 'Personal Events (Memory)',
    lastUpdated: new Date().toISOString()
  });
}
