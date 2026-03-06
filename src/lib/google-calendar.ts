// src/lib/google-calendar.ts
// Direct Google Calendar API integration

const GOOGLE_CALENDAR_API = 'https://www.googleapis.com/calendar/v3';

export interface CalendarEvent {
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

// Get stored token
async function getToken(): Promise<string | null> {
  try {
    const response = await fetch('/api/auth/google-token');
    if (response.ok) {
      const data = await response.json();
      return data.access_token;
    }
    return null;
  } catch (error) {
    console.error('Error getting token:', error);
    return null;
  }
}

export async function fetchCalendarEvents(timeMin?: string, timeMax?: string): Promise<CalendarEvent[]> {
  const token = await getToken();
  
  if (!token) {
    console.log('No Google token available');
    return [];
  }

  // Default: next 7 days
  const now = new Date();
  const defaultTimeMin = now.toISOString();
  const defaultTimeMax = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString();

  const params = new URLSearchParams({
    timeMin: timeMin || defaultTimeMin,
    timeMax: timeMax || defaultTimeMax,
    maxResults: '50',
    orderBy: 'startTime',
    singleEvents: 'true',
  });

  try {
    const response = await fetch(
      `${GOOGLE_CALENDAR_API}/calendars/primary/events?${params}`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      if (response.status === 401) {
        console.log('Token expired, needs refresh');
      }
      throw new Error(`Google Calendar API error: ${response.status}`);
    }

    const data = await response.json();
    
    return (data.items || []).map((event: any) => ({
      id: event.id,
      title: event.summary || 'Untitled',
      start: event.start?.dateTime || event.start?.date,
      end: event.end?.dateTime || event.end?.date,
      attendees: event.attendees?.map((a: any) => a.email) || [],
      description: event.description,
      location: event.location,
      meetLink: event.hangoutLink || event.conferenceData?.entryPoints?.[0]?.uri,
      // Detect battle cards from description/title
      isBattleCard: detectBattleCard(event),
      dealValue: extractDealValue(event.description),
      company: extractCompany(event.description, event.summary),
    }));
  } catch (error) {
    console.error('Error fetching calendar:', error);
    return [];
  }
}

function detectBattleCard(event: any): boolean {
  const text = `${event.summary} ${event.description || ''}`.toLowerCase();
  return text.includes('craftable') || 
         text.includes('deal') || 
         text.includes('$') ||
         text.includes('battle card');
}

function extractDealValue(description?: string): string | undefined {
  if (!description) return undefined;
  const match = description.match(/\$([\d,]+[Kk]?)/);
  return match ? match[0] : undefined;
}

function extractCompany(description?: string, title?: string): string | undefined {
  // Try to extract company name from title like "Craftable + Company Name"
  if (title) {
    const match = title.match(/\+\s*(.+?)(\s*[-:|]|$)/);
    if (match) return match[1].trim();
  }
  return undefined;
}
