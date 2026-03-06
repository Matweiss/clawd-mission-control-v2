import type { NextApiRequest, NextApiResponse } from 'next';
import { getValidGoogleToken } from '../auth/refresh-google';

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const REPO_OWNER = 'Matweiss';
const REPO_NAME = 'clawd-brain-data';

interface CalendarEvent {
  id: string;
  summary: string;
  start: { dateTime: string };
  end: { dateTime: string };
  attendees?: { email: string; displayName?: string }[];
  description?: string;
  hangoutLink?: string;
}

async function fetchTodayEvents(accessToken: string): Promise<CalendarEvent[]> {
  const now = new Date();
  const startOfDay = new Date(now.setHours(0, 0, 0, 0)).toISOString();
  const endOfDay = new Date(now.setHours(23, 59, 59, 999)).toISOString();

  const url = `https://www.googleapis.com/calendar/v3/calendars/primary/events?` +
    `timeMin=${encodeURIComponent(startOfDay)}&` +
    `timeMax=${encodeURIComponent(endOfDay)}&` +
    `singleEvents=true&` +
    `orderBy=startTime`;

  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Accept': 'application/json'
    }
  });

  if (!response.ok) {
    throw new Error(`Calendar API error: ${response.status}`);
  }

  const data = await response.json();
  return data.items || [];
}

async function createMeetingMemory(event: CalendarEvent) {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const slug = event.summary.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 50);
  
  const path = `memories/${year}/${month}/${year}-${month}-${day}-meeting-${slug}.md`;
  
  const attendees = event.attendees 
    ? event.attendees.map(a => `- ${a.displayName || a.email} (${a.email})`).join('\n')
    : '- TBD';

  const content = `---
title: "Meeting: ${event.summary}"
date: ${new Date().toISOString()}
type: memory
tags: ["meeting", "calendar"]
source: calendar
calendar_event_id: "${event.id}"
---

## Meeting Info

**Title:** ${event.summary}
**Date:** ${new Date(event.start.dateTime).toLocaleDateString()}
**Time:** ${new Date(event.start.dateTime).toLocaleTimeString()} - ${new Date(event.end.dateTime).toLocaleTimeString()}
${event.hangoutLink ? `**Meet Link:** ${event.hangoutLink}` : ''}

## Attendees

${attendees}

## Agenda

${event.description || '_No agenda provided_'}

## Notes

_Meeting notes go here..._

## Action Items

- [ ] 

## Decisions

- 
`;

  // Push to GitHub
  const contentBase64 = Buffer.from(content).toString('base64');
  
  const response = await fetch(
    `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${path}`,
    {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message: `[meeting] ${event.summary}`,
        content: contentBase64,
        branch: 'main'
      })
    }
  );

  return response.ok ? path : null;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const token = await getValidGoogleToken();
    
    if (!token) {
      return res.status(401).json({ 
        error: 'Google authentication required',
        message: 'Please run the Google auth setup'
      });
    }

    if (req.method === 'GET') {
      // List today's meetings
      const events = await fetchTodayEvents(token);
      
      return res.status(200).json({
        events: events.map(e => ({
          id: e.id,
          summary: e.summary,
          start: e.start.dateTime,
          end: e.end.dateTime,
          attendees: e.attendees?.map(a => a.email) || [],
          hasNotes: false // Could check if memory already exists
        }))
      });
    }

    if (req.method === 'POST') {
      const { eventId } = req.body;
      
      if (!eventId) {
        return res.status(400).json({ error: 'eventId required' });
      }

      // Fetch specific event
      const response = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json'
          }
        }
      );

      if (!response.ok) {
        return res.status(404).json({ error: 'Event not found' });
      }

      const event: CalendarEvent = await response.json();
      const path = await createMeetingMemory(event);

      if (path) {
        return res.status(200).json({ 
          success: true, 
          path,
          message: 'Meeting notes template created'
        });
      } else {
        return res.status(500).json({ error: 'Failed to create meeting notes' });
      }
    }
  } catch (error) {
    console.error('Calendar API error:', error);
    res.status(500).json({ error: 'Failed to process calendar request' });
  }
}
