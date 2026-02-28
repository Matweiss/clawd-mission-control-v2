#!/usr/bin/env node
/**
 * Real-Time Sync Service
 * Fetches Calendar, Gmail, and HubSpot data every 5 minutes
 */

const { execSync } = require('child_process');
const https = require('https');

// Supabase config
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://nmhbmgtyqutbztdafzjl.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

// HubSpot config - set via environment variable
const HUBSPOT_TOKEN = process.env.HUBSPOT_TOKEN;
const HUBSPOT_OWNER_ID = '728033696';

// Stage mapping
const STAGE_MAP = {
  'c9e227ad-c38d-4922-9501-fc2053229be9': 'Qualification',
  '997831554': 'Discovery', 
  'eb3b0309-9555-4de9-bdec-b653a0a1efeb': 'Evaluation',
  '94890f5c-dbc4-4c28-865c-fc032a485684': 'Confirmation',
  '17b10f58-1abb-447b-a8bc-c7965662690d': 'Negotiation',
};

async function fetchFromSupabase(endpoint, options = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(endpoint, SUPABASE_URL);
    const req = https.request(url, {
      method: options.method || 'GET',
      headers: {
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
        'apikey': SUPABASE_SERVICE_KEY,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch {
          resolve(data);
        }
      });
    });
    req.on('error', reject);
    if (options.body) req.write(JSON.stringify(options.body));
    req.end();
  });
}

async function getGoogleToken() {
  // Fetch tokens from Supabase
  const result = await fetchFromSupabase('/rest/v1/api_tokens?service=eq.google&select=*');
  if (!result || result.length === 0) {
    console.error('No Google tokens found. Run OAuth setup first.');
    return null;
  }
  
  const tokenData = result[0];
  
  // Check if expired
  if (new Date(tokenData.expires_at) < new Date()) {
    console.log('Token expired, refreshing...');
    // Refresh token logic here
    return tokenData.token; // For now, use existing
  }
  
  return tokenData.token;
}

async function fetchCalendarEvents(accessToken) {
  console.log('Fetching Calendar events...');
  
  const now = new Date();
  const weekLater = new Date();
  weekLater.setDate(weekLater.getDate() + 7);
  
  try {
    const response = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/primary/events?` +
      `timeMin=${now.toISOString()}&` +
      `timeMax=${weekLater.toISOString()}&` +
      `singleEvents=true&` +
      `orderBy=startTime&` +
      `maxResults=50`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );
    
    if (!response.ok) {
      console.error('Calendar API error:', response.status);
      return [];
    }
    
    const data = await response.json();
    return data.items || [];
  } catch (err) {
    console.error('Calendar fetch error:', err);
    return [];
  }
}

async function fetchGmailMessages(accessToken) {
  console.log('Fetching Gmail messages...');
  
  try {
    // Get recent messages
    const listResponse = await fetch(
      'https://www.googleapis.com/gmail/v1/users/me/messages?maxResults=50&labelIds=INBOX',
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );
    
    if (!listResponse.ok) {
      console.error('Gmail API error:', listResponse.status);
      return [];
    }
    
    const listData = await listResponse.json();
    const messages = listData.messages || [];
    
    // Fetch full details for each message
    const fullMessages = await Promise.all(
      messages.slice(0, 20).map(async (msg) => {
        try {
          const msgResponse = await fetch(
            `https://www.googleapis.com/gmail/v1/users/me/messages/${msg.id}?format=metadata&metadataHeaders=From&metadataHeaders=Subject&metadataHeaders=Date`,
            {
              headers: { Authorization: `Bearer ${accessToken}` },
            }
          );
          return msgResponse.json();
        } catch {
          return null;
        }
      })
    );
    
    return fullMessages.filter(Boolean);
  } catch (err) {
    console.error('Gmail fetch error:', err);
    return [];
  }
}

async function fetchHubSpotDeals() {
  console.log('Fetching HubSpot deals...');
  
  try {
    const response = await fetch('https://api.hubapi.com/crm/v3/objects/deals/search', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${HUBSPOT_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        filterGroups: [
          {
            filters: [
              { propertyName: 'hubspot_owner_id', operator: 'EQ', value: HUBSPOT_OWNER_ID }
            ]
          }
        ],
        properties: ['dealname', 'amount', 'dealstage', 'closedate', 'hubspot_owner_id', 'notes_last_updated'],
        limit: 100,
      }),
    });
    
    if (!response.ok) {
      console.error('HubSpot API error:', response.status);
      return [];
    }
    
    const data = await response.json();
    return data.results || [];
  } catch (err) {
    console.error('HubSpot fetch error:', err);
    return [];
  }
}

function processCalendarEvents(events) {
  return events.map(event => ({
    id: event.id,
    summary: event.summary || 'No Title',
    start_time: event.start?.dateTime || event.start?.date,
    end_time: event.end?.dateTime || event.end?.date,
    attendees: event.attendees?.map(a => a.email) || [],
    meet_link: event.hangoutLink || null,
    location: event.location || null,
    description: event.description?.substring(0, 500) || null,
    synced_at: new Date().toISOString(),
  }));
}

function processEmails(messages) {
  return messages.map(msg => {
    const headers = msg.payload?.headers || [];
    const from = headers.find(h => h.name === 'From')?.value || '';
    const subject = headers.find(h => h.name === 'Subject')?.value || '';
    const date = headers.find(h => h.name === 'Date')?.value || '';
    
    // Parse from
    const fromMatch = from.match(/<(.+)>/);
    const fromEmail = fromMatch ? fromMatch[1] : from;
    const fromName = from.split('<')[0]?.trim() || '';
    
    // Categorize
    const text = `${subject} ${msg.snippet || ''}`.toLowerCase();
    let category = 'REPLY_NEEDED';
    if (text.includes('urgent') || text.includes('asap') || text.includes('contract') || 
        text.includes('cancel') || text.includes('problem')) {
      category = 'URGENT';
    } else if (text.includes('newsletter') || text.includes('digest') || text.includes('unsubscribe')) {
      category = 'FYI';
    }
    
    return {
      message_id: msg.id,
      thread_id: msg.threadId,
      from_email: fromEmail,
      from_name: fromName,
      subject: subject,
      snippet: msg.snippet || '',
      received_at: new Date(parseInt(msg.internalDate)).toISOString(),
      category: category,
      synced_at: new Date().toISOString(),
    };
  });
}

function processDeals(deals) {
  return deals.map(deal => ({
    deal_id: deal.id,
    name: deal.properties.dealname,
    amount: parseFloat(deal.properties.amount) || 0,
    stage_id: deal.properties.dealstage,
    stage_name: STAGE_MAP[deal.properties.dealstage] || 'Unknown',
    close_date: deal.properties.closedate,
    owner_id: deal.properties.hubspot_owner_id,
    synced_at: new Date().toISOString(),
  }));
}

async function syncAll() {
  console.log(`\n[${new Date().toISOString()}] Starting sync...`);
  
  try {
    // Get Google token
    const googleToken = await getGoogleToken();
    
    // Fetch all data in parallel
    const [calendarEvents, emails, deals] = await Promise.all([
      googleToken ? fetchCalendarEvents(googleToken) : Promise.resolve([]),
      googleToken ? fetchGmailMessages(googleToken) : Promise.resolve([]),
      fetchHubSpotDeals(),
    ]);
    
    console.log(`Fetched: ${calendarEvents.length} events, ${emails.length} emails, ${deals.length} deals`);
    
    // Process and store
    const processedEvents = processCalendarEvents(calendarEvents);
    const processedEmails = processEmails(emails);
    const processedDeals = processDeals(deals);
    
    // Store in Supabase (upsert)
    for (const event of processedEvents) {
      await fetchFromSupabase('/rest/v1/calendar_events', {
        method: 'POST',
        body: event,
        headers: { 'Prefer': 'resolution=merge-duplicates' },
      });
    }
    
    for (const email of processedEmails) {
      await fetchFromSupabase('/rest/v1/email_categories', {
        method: 'POST',
        body: email,
        headers: { 'Prefer': 'resolution=merge-duplicates' },
      });
    }
    
    // Clear and re-insert pipeline (deals change frequently)
    await fetchFromSupabase('/rest/v1/pipeline_cache', { method: 'DELETE' });
    
    if (processedDeals.length > 0) {
      await fetchFromSupabase('/rest/v1/pipeline_cache', {
        method: 'POST',
        body: processedDeals,
      });
    }
    
    // Log sync
    await fetchFromSupabase('/rest/v1/clawd_logs', {
      method: 'POST',
      body: {
        agent: 'sync-service',
        action: `Sync complete: ${processedEvents.length} events, ${processedEmails.length} emails, ${processedDeals.length} deals`,
        status: 'success',
      },
    });
    
    // Update sync status
    await fetchFromSupabase('/rest/v1/sync_status', {
      method: 'POST',
      body: {
        service: 'all',
        last_sync_at: new Date().toISOString(),
        status: 'completed',
        items_synced: processedEvents.length + processedEmails.length + processedDeals.length,
      },
      headers: { 'Prefer': 'resolution=merge-duplicates' },
    });
    
    console.log(`[${new Date().toISOString()}] Sync complete!`);
    
  } catch (err) {
    console.error('Sync error:', err);
    
    await fetchFromSupabase('/rest/v1/clawd_logs', {
      method: 'POST',
      body: {
        agent: 'sync-service',
        action: `Sync failed: ${err.message}`,
        status: 'error',
      },
    });
  }
}

// Run immediately
syncAll();

// Then every 5 minutes
setInterval(syncAll, 5 * 60 * 1000);

console.log('Sync service started. Running every 5 minutes...');
