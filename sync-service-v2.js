#!/usr/bin/env node
/**
 * Mission Control Sync Service
 * Syncs Gmail, Calendar, and other data sources
 * Auto-refreshes OAuth tokens when needed
 */

const https = require('https');
const fs = require('fs');
const { refreshToken } = require('../tools/refresh-google-token.js');

// Config
const TOKEN_FILE = process.env.HOME + '/.config/clawd/google_tokens.json';
const SUPABASE_URL = 'https://nmhbmgtyqutbztdafzjl.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || '';

// Load tokens
function loadTokens() {
  try {
    return JSON.parse(fs.readFileSync(TOKEN_FILE, 'utf8'));
  } catch (e) {
    console.error('❌ Failed to load tokens:', e.message);
    return null;
  }
}

// Check if token needs refresh
function needsRefresh(tokens) {
  if (!tokens.expires_at) return true;
  const expires = new Date(tokens.expires_at);
  const now = new Date();
  // Refresh if less than 10 minutes remaining
  return (expires - now) < 10 * 60 * 1000;
}

// Fetch with automatic token refresh
async function fetchWithAuth(url, options = {}) {
  let tokens = loadTokens();
  
  if (!tokens) {
    throw new Error('No tokens available');
  }
  
  // Refresh if needed
  if (needsRefresh(tokens)) {
    console.log('🔄 Token expired, refreshing...');
    await refreshToken();
    tokens = loadTokens(); // Reload after refresh
  }
  
  // Add auth header
  options.headers = options.headers || {};
  options.headers['Authorization'] = `Bearer ${tokens.access_token}`;
  
  return new Promise((resolve, reject) => {
    const req = https.request(url, options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode === 401) {
          // Token invalid, try refresh once
          console.log('🔄 Got 401, attempting refresh...');
          refreshToken().then(() => {
            // Retry with new token
            fetchWithAuth(url, options).then(resolve).catch(reject);
          }).catch(reject);
        } else {
          try {
            resolve(JSON.parse(data));
          } catch {
            resolve(data);
          }
        }
      });
    });
    req.on('error', reject);
    if (options.body) req.write(options.body);
    req.end();
  });
}

// Sync Gmail
async function syncGmail() {
  console.log('📧 Syncing Gmail...');
  
  try {
    const list = await fetchWithAuth(
      'https://www.googleapis.com/gmail/v1/users/me/messages?maxResults=20&labelIds=INBOX'
    );
    
    const messages = list.messages || [];
    console.log(`   Found ${messages.length} messages`);
    
    for (const msg of messages.slice(0, 10)) {
      const detail = await fetchWithAuth(
        `https://www.googleapis.com/gmail/v1/users/me/messages/${msg.id}?format=metadata&metadataHeaders=From&metadataHeaders=Subject&metadataHeaders=Date`
      );
      
      const headers = detail.payload?.headers || [];
      const from = headers.find(h => h.name === 'From')?.value || '';
      const subject = headers.find(h => h.name === 'Subject')?.value || '';
      const fromName = from.split('<')[0]?.trim() || '';
      
      // Categorize
      const text = (subject + ' ' + (detail.snippet || '')).toLowerCase();
      let category = 'REPLY_NEEDED';
      if (text.includes('urgent') || text.includes('asap') || text.includes('contract')) category = 'URGENT';
      else if (text.includes('newsletter') || text.includes('digest') || text.includes('unsubscribe')) category = 'FYI';
      
      // Insert to Supabase
      await insertToSupabase('email_categories', {
        message_id: detail.id,
        thread_id: detail.threadId,
        from_email: from.match(/<(.+)>/) ? from.match(/<(.+)>/)[1] : from,
        from_name: fromName,
        subject: subject,
        snippet: detail.snippet || '',
        received_at: new Date(parseInt(detail.internalDate)).toISOString(),
        category: category,
        synced_at: new Date().toISOString()
      });
    }
    
    console.log('✅ Gmail sync complete');
  } catch (error) {
    console.error('❌ Gmail sync failed:', error.message);
  }
}

// Sync Calendar
async function syncCalendar() {
  console.log('📅 Syncing Calendar...');
  
  try {
    const now = new Date().toISOString();
    const weekFromNow = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    
    const events = await fetchWithAuth(
      `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${now}&timeMax=${weekFromNow}&maxResults=20&singleEvents=true&orderBy=startTime`
    );
    
    for (const event of events.items || []) {
      await insertToSupabase('calendar_events', {
        id: event.id,
        summary: event.summary,
        start_time: event.start?.dateTime || event.start?.date,
        end_time: event.end?.dateTime || event.end?.date,
        location: event.location || '',
        attendees: event.attendees?.map(a => a.email).join(', ') || '',
        meet_link: event.hangoutLink || '',
        synced_at: new Date().toISOString()
      });
    }
    
    console.log(`✅ Calendar sync complete (${events.items?.length || 0} events)`);
  } catch (error) {
    console.error('❌ Calendar sync failed:', error.message);
  }
}

// Helper: Insert to Supabase
async function insertToSupabase(table, data) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(data);
    const options = {
      hostname: 'nmhbmgtyqutbztdafzjl.supabase.co',
      path: `/rest/v1/${table}`,
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'apikey': SUPABASE_KEY,
        'Content-Type': 'application/json',
        'Prefer': 'resolution=merge-duplicates'
      }
    };
    
    const req = https.request(options, (res) => {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        resolve();
      } else {
        reject(new Error(`HTTP ${res.statusCode}`));
      }
    });
    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

// Main sync function
async function sync() {
  console.log('🚀 Mission Control Sync Started');
  console.log('================================');
  console.log('');
  
  await syncGmail();
  await syncCalendar();
  
  console.log('');
  console.log('✅ Sync complete!');
}

// Run if called directly
if (require.main === module) {
  sync().catch(console.error);
}

module.exports = { sync, syncGmail, syncCalendar };
