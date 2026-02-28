import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

interface CalendarEvent {
  id: string;
  summary: string;
  start: { dateTime?: string; date?: string };
  end: { dateTime?: string; date?: string };
  attendees?: { email: string; displayName?: string; responseStatus?: string }[];
  hangoutLink?: string;
  description?: string;
  location?: string;
}

interface GmailMessage {
  id: string;
  threadId: string;
  snippet: string;
  payload: {
    headers: { name: string; value: string }[];
    parts?: any[];
  };
  internalDate: string;
}

interface HubSpotDeal {
  id: string;
  properties: {
    dealname: string;
    amount: string;
    dealstage: string;
    closedate: string;
    hubspot_owner_id: string;
  };
}

export class RealTimeSync {
  private googleToken: string | null = null;
  private hubspotToken: string;
  private refreshInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.hubspotToken = process.env.HUBSPOT_TOKEN || '';
  }

  // Initialize Google OAuth
  async initGoogleAuth(): Promise<boolean> {
    try {
      // Check if we have a valid token in Supabase
      const { data, error } = await supabase
        .from('api_tokens')
        .select('token, expires_at')
        .eq('service', 'google')
        .single();

      if (error || !data) {
        console.log('No Google token found, needs authentication');
        return false;
      }

      // Check if token is expired
      if (new Date(data.expires_at) < new Date()) {
        // Refresh token
        await this.refreshGoogleToken(data.token);
      } else {
        this.googleToken = data.token;
      }

      return !!this.googleToken;
    } catch (err) {
      console.error('Google auth error:', err);
      return false;
    }
  }

  async refreshGoogleToken(refreshToken: string): Promise<void> {
    try {
      const response = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          refresh_token: refreshToken,
          client_id: process.env.GOOGLE_CLIENT_ID || '',
          client_secret: process.env.GOOGLE_CLIENT_SECRET || '',
          grant_type: 'refresh_token',
        }),
      });

      const data = await response.json();
      
      if (data.access_token) {
        this.googleToken = data.access_token;
        
        // Update in Supabase
        await supabase.from('api_tokens').upsert({
          service: 'google',
          token: this.googleToken,
          refresh_token: refreshToken,
          expires_at: new Date(Date.now() + data.expires_in * 1000).toISOString(),
          updated_at: new Date().toISOString(),
        });
      }
    } catch (err) {
      console.error('Token refresh error:', err);
    }
  }

  // Fetch Calendar Events
  async fetchCalendarEvents(daysAhead: number = 7): Promise<CalendarEvent[]> {
    if (!this.googleToken) {
      const authed = await this.initGoogleAuth();
      if (!authed) return [];
    }

    try {
      const now = new Date();
      const future = new Date();
      future.setDate(future.getDate() + daysAhead);

      const timeMin = now.toISOString();
      const timeMax = future.toISOString();

      const response = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${timeMin}&timeMax=${timeMax}&singleEvents=true&orderBy=startTime`,
        {
          headers: { Authorization: `Bearer ${this.googleToken}` },
        }
      );

      if (response.status === 401) {
        // Token expired, try refresh
        await this.initGoogleAuth();
        return this.fetchCalendarEvents(daysAhead);
      }

      const data = await response.json();
      return data.items || [];
    } catch (err) {
      console.error('Calendar fetch error:', err);
      return [];
    }
  }

  // Fetch Gmail Messages
  async fetchGmailMessages(maxResults: number = 20): Promise<GmailMessage[]> {
    if (!this.googleToken) {
      const authed = await this.initGoogleAuth();
      if (!authed) return [];
    }

    try {
      // Get message list
      const listResponse = await fetch(
        `https://www.googleapis.com/gmail/v1/users/me/messages?maxResults=${maxResults}&labelIds=INBOX`,
        {
          headers: { Authorization: `Bearer ${this.googleToken}` },
        }
      );

      if (listResponse.status === 401) {
        await this.initGoogleAuth();
        return this.fetchGmailMessages(maxResults);
      }

      const listData = await listResponse.json();
      const messages = listData.messages || [];

      // Fetch full message details
      const fullMessages = await Promise.all(
        messages.map(async (msg: { id: string }) => {
          const msgResponse = await fetch(
            `https://www.googleapis.com/gmail/v1/users/me/messages/${msg.id}`,
            {
              headers: { Authorization: `Bearer ${this.googleToken}` },
            }
          );
          return msgResponse.json();
        })
      );

      return fullMessages;
    } catch (err) {
      console.error('Gmail fetch error:', err);
      return [];
    }
  }

  // Fetch HubSpot Pipeline
  async fetchHubSpotPipeline(): Promise<HubSpotDeal[]> {
    try {
      const filters = {
        filterGroups: [
          { filters: [{ propertyName: 'hubspot_owner_id', operator: 'EQ', value: '728033696' }] }
        ],
        properties: ['dealname', 'amount', 'dealstage', 'closedate', 'hubspot_owner_id'],
        limit: 100,
      };

      const response = await fetch('https://api.hubapi.com/crm/v3/objects/deals/search', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.hubspotToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(filters),
      });

      const data = await response.json();
      return data.results || [];
    } catch (err) {
      console.error('HubSpot fetch error:', err);
      return [];
    }
  }

  // Process and sync all data
  async syncAll(): Promise<void> {
    console.log('Starting real-time sync...');

    // Fetch all data in parallel
    const [events, messages, deals] = await Promise.all([
      this.fetchCalendarEvents(),
      this.fetchGmailMessages(),
      this.fetchHubSpotPipeline(),
    ]);

    // Process calendar events
    await this.processCalendarEvents(events);

    // Process emails
    await this.processEmails(messages);

    // Process deals
    await this.processDeals(deals);

    // Log sync completion
    await supabase.from('clawd_logs').insert({
      agent: 'clawd-prime',
      action: `Real-time sync completed: ${events.length} events, ${messages.length} emails, ${deals.length} deals`,
      status: 'success',
    });

    console.log('Sync complete');
  }

  private async processCalendarEvents(events: CalendarEvent[]): Promise<void> {
    const processedEvents = events.map(event => ({
      id: event.id,
      summary: event.summary,
      start_time: event.start?.dateTime || event.start?.date,
      end_time: event.end?.dateTime || event.end?.date,
      attendees: event.attendees?.map(a => a.email) || [],
      meet_link: event.hangoutLink,
      location: event.location,
      description: event.description?.substring(0, 500), // Truncate
      synced_at: new Date().toISOString(),
    }));

    // Upsert to Supabase
    for (const event of processedEvents) {
      await supabase.from('calendar_events').upsert(event, { onConflict: 'id' });
    }
  }

  private async processEmails(messages: GmailMessage[]): Promise<void> {
    const processedEmails = messages.map(msg => {
      const headers = msg.payload?.headers || [];
      const from = headers.find((h: any) => h.name === 'From')?.value || '';
      const subject = headers.find((h: any) => h.name === 'Subject')?.value || '';
      
      return {
        message_id: msg.id,
        thread_id: msg.threadId,
        from_email: from.match(/<(.+)>/)?.[1] || from,
        from_name: from.split('<')[0]?.trim() || '',
        subject: subject,
        snippet: msg.snippet,
        received_at: new Date(parseInt(msg.internalDate)).toISOString(),
        category: this.categorizeEmail(from, subject, msg.snippet),
        synced_at: new Date().toISOString(),
      };
    });

    // Upsert to Supabase
    for (const email of processedEmails) {
      await supabase.from('email_categories').upsert(email, { onConflict: 'message_id' });
    }
  }

  private categorizeEmail(from: string, subject: string, snippet: string): string {
    const text = `${subject} ${snippet}`.toLowerCase();
    
    // Check for urgent keywords
    if (text.includes('urgent') || text.includes('asap') || text.includes('contract') || 
        text.includes('cancel') || text.includes('problem')) {
      return 'URGENT';
    }
    
    // Check for reply needed
    if (text.includes('re:') || text.includes('reply') || text.includes('question') ||
        text.includes('follow up')) {
      return 'REPLY_NEEDED';
    }
    
    // Check for FYI
    if (text.includes('newsletter') || text.includes('update') || text.includes('digest')) {
      return 'FYI';
    }
    
    return 'REPLY_NEEDED'; // Default
  }

  private async processDeals(deals: HubSpotDeal[]): Promise<void> {
    const stageMap: Record<string, string> = {
      'c9e227ad-c38d-4922-9501-fc2053229be9': 'Qualification',
      '997831554': 'Discovery',
      'eb3b0309-9555-4de9-bdec-b653a0a1efeb': 'Evaluation',
      '94890f5c-dbc4-4c28-865c-fc032a485684': 'Confirmation',
      '17b10f58-1abb-447b-a8bc-c7965662690d': 'Negotiation',
    };

    const processedDeals = deals.map(deal => ({
      deal_id: deal.id,
      name: deal.properties.dealname,
      amount: parseFloat(deal.properties.amount) || 0,
      stage_id: deal.properties.dealstage,
      stage_name: stageMap[deal.properties.dealstage] || 'Unknown',
      close_date: deal.properties.closedate,
      owner_id: deal.properties.hubspot_owner_id,
      synced_at: new Date().toISOString(),
    }));

    // Clear and re-insert (deals change frequently)
    await supabase.from('pipeline_cache').delete().neq('deal_id', '');
    
    if (processedDeals.length > 0) {
      await supabase.from('pipeline_cache').insert(processedDeals);
    }
  }

  // Start automatic sync
  startAutoSync(intervalMinutes: number = 5): void {
    console.log(`Starting auto-sync every ${intervalMinutes} minutes`);
    
    // Initial sync
    this.syncAll();
    
    // Set up interval
    this.refreshInterval = setInterval(() => {
      this.syncAll();
    }, intervalMinutes * 60 * 1000);
  }

  stopAutoSync(): void {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
      this.refreshInterval = null;
    }
  }
}

export const realTimeSync = new RealTimeSync();
