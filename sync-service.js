#!/usr/bin/env node
/**
 * Real-Time Sync Service - Fixed
 * Fetches Calendar, Gmail, and HubSpot data every 5 minutes
 */

const https = require('https');
const fs = require('fs');

// Config
const SUPABASE_URL = 'https://nmhbmgtyqutbztdafzjl.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5taGJtZ3R5cXV0Ynp0ZGFmempsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTY0NzgzOCwiZXhwIjoyMDg3MjIzODM4fQ.9MBfNDENHCENroVRLFgbuh9nM4DARcLr-4j8dgpHLos';
const HUBSPOT_TOKEN = 'pat-na1-a249996e-eb7d-4184-841f-2759d28a8323';
const HUBSPOT_OWNER_ID = '728033696';

// Load Google tokens
let GOOGLE_ACCESS_TOKEN = '';
let GOOGLE_REFRESH_TOKEN = '';

try {
  const tokenFile = '/tmp/google_tokens.json';
  if (fs.existsSync(tokenFile)) {
    const tokens = JSON.parse(fs.readFileSync(tokenFile, 'utf8'));
    GOOGLE_ACCESS_TOKEN = tokens.access_token;
    GOOGLE_REFRESH_TOKEN = tokens.refresh_token;
    console.log('✅ Loaded Google tokens');
  }
} catch (e) {
  console.log('⚠️ Could not load tokens:', e.message);
}

const STAGE_MAP = {
  'c9e227ad-c38d-4922-9501-fc2053229be9': 'Qualification',
  '997831554': 'Discovery', 
  'eb3b0309-9555-4de9-bdec-b653a0a1efeb': 'Evaluation',
  '94890f5c-dbc4-4c28-865c-fc032a485684': 'Confirmation',
  '17b10f58-1abb-447b-a8bc-c7965662690d': 'Negotiation',
};

async function fetchSupabase(endpoint, opts = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(endpoint, SUPABASE_URL);
    const req = https.request(url, {
      method: opts.method || 'GET',
      headers: {
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'apikey': SUPABASE_KEY,
        'Content-Type': 'application/json',
        ...opts.headers,
      },
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); } catch { resolve(data); }
      });
    });
    req.on('error', reject);
    if (opts.body) req.write(JSON.stringify(opts.body));
    req.end();
  });
}

async function fetchGoogle(url, token) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { Authorization: `Bearer ${token}` } }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); } catch { resolve({}); }
      });
    }).on('error', reject);
  });
}

async function fetchHubSpotDeals() {
  console.log('📊 Fetching HubSpot deals...');
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({
      filterGroups: [{ filters: [{ propertyName: 'hubspot_owner_id', operator: 'EQ', value: HUBSPOT_OWNER_ID }] }],
      properties: ['dealname', 'amount', 'dealstage', 'closedate', 'hubspot_owner_id'],
      limit: 100,
    });

    const req = https.request({
      hostname: 'api.hubapi.com',
      path: '/crm/v3/objects/deals/search',
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${HUBSPOT_TOKEN}`,
        'Content-Type': 'application/json',
      },
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(data).results || []); } catch { resolve([]); }
      });
    });
    req.on('error', (e) => { console.error('HubSpot error:', e.message); resolve([]); });
    req.write(postData);
    req.end();
  });
}

async function syncCalendar() {
  if (!GOOGLE_ACCESS_TOKEN) {
    console.log('⚠️ No Google token, skipping Calendar');
    return 0;
  }
  
  console.log('📅 Fetching Calendar...');
  const now = new Date().toISOString();
  const weekLater = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
  
  const url = `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${now}&timeMax=${weekLater}&singleEvents=true&orderBy=startTime&maxResults=50`;
  
  try {
    const data = await fetchGoogle(url, GOOGLE_ACCESS_TOKEN);
    const events = (data.items || []).map(e => ({
      id: e.id,
      summary: e.summary || 'No Title',
      start_time: e.start?.dateTime || e.start?.date,
      end_time: e.end?.dateTime || e.end?.date,
      attendees: e.attendees?.map(a => a.email) || [],
      meet_link: e.hangoutLink || null,
      location: e.location || null,
      description: e.description?.substring(0, 500) || null,
      synced_at: new Date().toISOString(),
    }));
    
    for (const event of events) {
      await fetchSupabase('/rest/v1/calendar_events', {
        method: 'POST',
        body: event,
        headers: { 'Prefer': 'resolution=merge-duplicates' },
      });
    }
    
    console.log(`✅ Synced ${events.length} calendar events`);
    return events.length;
  } catch (e) {
    console.error('Calendar error:', e.message);
    return 0;
  }
}

async function syncGmail() {
  if (!GOOGLE_ACCESS_TOKEN) {
    console.log('⚠️ No Google token, skipping Gmail');
    return 0;
  }
  
  console.log('📧 Fetching Gmail...');
  
  try {
    // Get message list
    const listUrl = 'https://www.googleapis.com/gmail/v1/users/me/messages?maxResults=20&labelIds=INBOX';
    const listData = await fetchGoogle(listUrl, GOOGLE_ACCESS_TOKEN);
    const messages = listData.messages || [];
    
    // Fetch details
    const fullMessages = await Promise.all(
      messages.slice(0, 10).map(async (msg) => {
        const url = `https://www.googleapis.com/gmail/v1/users/me/messages/${msg.id}?format=metadata&metadataHeaders=From&metadataHeaders=Subject&metadataHeaders=Date`;
        return fetchGoogle(url, GOOGLE_ACCESS_TOKEN);
      })
    );
    
    const emails = fullMessages.filter(Boolean).map(msg => {
      const headers = msg.payload?.headers || [];
      const from = headers.find(h => h.name === 'From')?.value || '';
      const subject = headers.find(h => h.name === 'Subject')?.value || '';
      const fromMatch = from.match(/<(.+)>/);
      const fromEmail = fromMatch ? fromMatch[1] : from;
      const fromName = from.split('<')[0]?.trim() || '';
      
      const text = `${subject} ${msg.snippet || ''}`.toLowerCase();
      let category = 'REPLY_NEEDED';
      if (text.includes('urgent') || text.includes('asap') || text.includes('contract')) category = 'URGENT';
      else if (text.includes('newsletter') || text.includes('digest')) category = 'FYI';
      
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
    
    for (const email of emails) {
      await fetchSupabase('/rest/v1/email_categories', {
        method: 'POST',
        body: email,
        headers: { 'Prefer': 'resolution=merge-duplicates' },
      });
    }
    
    console.log(`✅ Synced ${emails.length} emails`);
    return emails.length;
  } catch (e) {
    console.error('Gmail error:', e.message);
    return 0;
  }
}

async function syncHubSpot() {
  console.log('📊 Fetching HubSpot...');
  
  try {
    const deals = await fetchHubSpotDeals();
    
    const processed = deals.map(d => ({
      deal_id: d.id,
      name: d.properties.dealname,
      amount: parseFloat(d.properties.amount) || 0,
      stage_id: d.properties.dealstage,
      stage_name: STAGE_MAP[d.properties.dealstage] || 'Unknown',
      close_date: d.properties.closedate,
      owner_id: d.properties.hubspot_owner_id,
      synced_at: new Date().toISOString(),
    }));
    
    // Clear and re-insert
    await fetchSupabase('/rest/v1/pipeline_cache', { method: 'DELETE' });
    
    if (processed.length > 0) {
      await fetchSupabase('/rest/v1/pipeline_cache', {
        method: 'POST',
        body: processed,
      });
    }
    
    console.log(`✅ Synced ${processed.length} deals`);
    return processed.length;
  } catch (e) {
    console.error('HubSpot error:', e.message);
    return 0;
  }
}

async function syncAll() {
  console.log(`\n[${new Date().toISOString()}] Starting sync...`);
  
  const [calCount, gmailCount, hubCount] = await Promise.all([
    syncCalendar(),
    syncGmail(),
    syncHubSpot(),
  ]);
  
  const total = calCount + gmailCount + hubCount;
  
  await fetchSupabase('/rest/v1/sync_status', {
    method: 'POST',
    body: {
      service: 'all',
      last_sync_at: new Date().toISOString(),
      status: 'completed',
      items_synced: total,
    },
    headers: { 'Prefer': 'resolution=merge-duplicates' },
  });
  
  await fetchSupabase('/rest/v1/clawd_logs', {
    method: 'POST',
    body: {
      agent: 'sync-service',
      action: `Sync: ${calCount} calendar, ${gmailCount} emails, ${hubCount} deals`,
      status: 'success',
    },
  });
  
  console.log(`[${new Date().toISOString()}] Sync complete! Total: ${total}\n`);
}

// Run immediately
syncAll();

// Then every 5 minutes
setInterval(syncAll, 5 * 60 * 1000);

console.log('🚀 Sync service started. Running every 5 minutes...\n');
