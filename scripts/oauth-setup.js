#!/usr/bin/env node
/**
 * Google OAuth Helper
 * Generates auth URL, exchanges code for tokens, stores in Supabase
 */

const https = require('https');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Google OAuth config
const CLIENT_ID = process.env.GOOGLE_CLIENT_ID || 'YOUR_CLIENT_ID_HERE';
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || 'YOUR_CLIENT_SECRET_HERE';
const REDIRECT_URI = 'http://localhost:3000/auth/callback';

// Supabase config
const SUPABASE_URL = 'https://nmhbmgtyqutbztdafzjl.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5taGJtZ3R5cXV0Ynp0ZGFmempsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTY0NzgzOCwiZXhwIjoyMDg3MjIzODM4fQ.9MBfNDENHCENroVRLFgbuh9nM4DARcLr-4j8dgpHLos';

// Scopes needed
const SCOPES = [
  'https://www.googleapis.com/auth/calendar.readonly',
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/gmail.modify',
];

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

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

async function exchangeCodeForTokens(code) {
  return new Promise((resolve, reject) => {
    const postData = new URLSearchParams({
      code,
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      redirect_uri: REDIRECT_URI,
      grant_type: 'authorization_code',
    }).toString();

    const req = https.request({
      hostname: 'oauth2.googleapis.com',
      path: '/token',
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(postData),
      },
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (err) {
          reject(new Error('Failed to parse token response'));
        }
      });
    });

    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

async function main() {
  console.log('\n🦞 CLAWD Google OAuth Setup\n');
  console.log('This will authorize access to your Gmail and Calendar.\n');

  // Check if client ID is set
  if (CLIENT_ID.includes('YOUR_CLIENT_ID')) {
    console.log('❌ GOOGLE_CLIENT_ID not set in environment.');
    console.log('\nTo get one:');
    console.log('1. Go to https://console.cloud.google.com/apis/credentials');
    console.log('2. Create OAuth 2.0 credentials');
    console.log('3. Enable Gmail API and Calendar API');
    console.log('4. Add redirect URI: http://localhost:3000/auth/callback');
    console.log('\nThen run: GOOGLE_CLIENT_ID=xxx GOOGLE_CLIENT_SECRET=yyy node scripts/oauth-setup.js\n');
    rl.close();
    return;
  }

  // Generate auth URL
  const authUrl = 'https://accounts.google.com/o/oauth2/v2/auth?' + new URLSearchParams({
    client_id: CLIENT_ID,
    redirect_uri: REDIRECT_URI,
    response_type: 'code',
    scope: SCOPES.join(' '),
    access_type: 'offline',
    prompt: 'consent',
  }).toString();

  console.log('🔗 Authorization URL:');
  console.log(authUrl);
  console.log('\n👆 Click this link in your browser, approve access, then paste the FULL redirect URL here.\n');

  const redirectUrl = await question('Paste redirect URL (with code=...): ');

  // Extract code from URL
  const codeMatch = redirectUrl.match(/[?&]code=([^&]+)/);
  if (!codeMatch) {
    console.log('❌ Could not find code in URL. Please try again.');
    rl.close();
    return;
  }

  const code = decodeURIComponent(codeMatch[1]);
  console.log('\n✅ Code extracted, exchanging for tokens...\n');

  try {
    const tokens = await exchangeCodeForTokens(code);
    
    if (!tokens.access_token) {
      console.log('❌ Failed to get tokens:', tokens);
      rl.close();
      return;
    }

    console.log('✅ Got access token!');
    console.log('✅ Got refresh token!');

    // Calculate expiry
    const expiresAt = new Date(Date.now() + tokens.expires_in * 1000).toISOString();

    // Store in Supabase
    await fetchFromSupabase('/rest/v1/api_tokens', {
      method: 'POST',
      body: {
        service: 'google',
        token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        expires_at: expiresAt,
      },
      headers: { 'Prefer': 'resolution=merge-duplicates' },
    });

    console.log('\n✅ Tokens stored in Supabase!\n');
    console.log('You can now run: node sync-service.js\n');

  } catch (err) {
    console.log('❌ Error exchanging code:', err.message);
  }

  rl.close();
}

main();
