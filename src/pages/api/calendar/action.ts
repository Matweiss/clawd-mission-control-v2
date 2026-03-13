import type { NextApiRequest, NextApiResponse } from 'next';
import { getValidGoogleToken } from '../auth/refresh-google';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST' && req.method !== 'DELETE') {
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

    if (req.method === 'DELETE') {
      // Delete event
      const { eventId } = req.query;
      
      if (!eventId) {
        return res.status(400).json({ error: 'Missing eventId' });
      }

      const response = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json'
          }
        }
      );

      if (!response.ok && response.status !== 204) {
        const error = await response.text();
        return res.status(response.status).json({ 
          error: `Calendar API error: ${response.status}`,
          details: error
        });
      }

      return res.status(200).json({ success: true, action: 'delete', eventId });
    }

    if (req.method === 'POST') {
      // Create new event
      const { summary, start, end, description, location } = req.body;

      if (!summary || !start || !end) {
        return res.status(400).json({ error: 'Missing required fields: summary, start, end' });
      }

      const event = {
        summary,
        description,
        location,
        start: { dateTime: start },
        end: { dateTime: end }
      };

      const response = await fetch(
        'https://www.googleapis.com/calendar/v3/calendars/primary/events',
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify(event)
        }
      );

      if (!response.ok) {
        const error = await response.text();
        return res.status(response.status).json({ 
          error: `Calendar API error: ${response.status}`,
          details: error
        });
      }

      const data = await response.json();
      
      return res.status(200).json({ 
        success: true, 
        action: 'create',
        event: {
          id: data.id,
          summary: data.summary,
          start: data.start,
          end: data.end
        }
      });
    }

  } catch (error) {
    console.error('Calendar action error:', error);
    res.status(500).json({ 
      error: 'Failed to perform action',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
