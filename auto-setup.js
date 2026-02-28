#!/usr/bin/env node
/**
 * Automated Sync Setup
 * Minimal user interaction required
 */

const { execSync } = require('child_process');
const https = require('https');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const SUPABASE_URL = 'https://nmhbmgtyqutbztdafzjl.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5taGJtZ3R5cXV0Ynp0ZGFmempsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTY0NzgzOCwiZXhwIjoyMDg3MjIzODM4fQ.9MBfNDENHCENroVRLFgbuh9nM4DARcLr-4j8dgpHLos';

// Use a pre-configured Google OAuth app
const CLIENT_ID = '271371034887-4ua8h3cra4j7k4g9j7p5k8j6j7.apps.googleusercontent.com';
const CLIENT_SECRET = 'GOCSPX-xxxxxxxxxxxxxxxx'; // Will need real one

const SCOPES = [
  'https://www.googleapis.com/auth/calendar.readonly',
  'https://www.googleapis.com/auth/gmail.readonly',
];

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

async function setup() {
  console.log('\n🦞 CLAWD Sync Service Auto-Setup\n');
  
  // Check if we already have tokens
  console.log('Checking for existing Google tokens...');
  
  try {
    const result = await fetch(`${SUPABASE_URL}/rest/v1/api_tokens?service=eq.google`, {
      headers: {
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
        'apikey': SUPABASE_SERVICE_KEY,
      }
    }).then(r => r.json());
    
    if (result && result.length > 0) {
      console.log('✅ Google tokens already exist!\n');
      console.log('Starting sync service...\n');
      
      // Start the sync service
      execSync('node sync-service.js', { stdio: 'inherit' });
      return;
    }
  } catch (e) {
    // Continue to OAuth
  }
  
  // Need to do OAuth
  console.log('🔐 Google authentication required.\n');
  console.log('Step 1: Click this link to authorize access:\n');
  
  const authUrl = 'https://accounts.google.com/o/oauth2/v2/auth?' + new URLSearchParams({
    client_id: CLIENT_ID,
    redirect_uri: 'urn:ietf:wg:oauth:2.0:oob',
    response_type: 'code',
    scope: SCOPES.join(' '),
    access_type: 'offline',
    prompt: 'consent',
  }).toString();
  
  console.log(authUrl);
  console.log('\n👆 Click the link above, sign in, and approve access.\n');
  console.log('Step 2: Google will give you a code. Paste it here:\n');
  
  const code = await question('Authorization code: ');
  
  console.log('\n⏳ Exchanging code for tokens...\n');
  
  // Exchange code for tokens
  try {
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code: code.trim(),
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        redirect_uri: 'urn:ietf:wg:oauth:2.0:oob',
        grant_type: 'authorization_code',
      }),
    }).then(r => r.json());
    
    if (tokenResponse.error) {
      console.log('❌ OAuth error:', tokenResponse.error_description);
      rl.close();
      return;
    }
    
    // Store tokens
    const expiresAt = new Date(Date.now() + tokenResponse.expires_in * 1000).toISOString();
    
    await fetch(`${SUPABASE_URL}/rest/v1/api_tokens`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
        'apikey': SUPABASE_SERVICE_KEY,
        'Content-Type': 'application/json',
        'Prefer': 'resolution=merge-duplicates',
      },
      body: JSON.stringify({
        service: 'google',
        token: tokenResponse.access_token,
        refresh_token: tokenResponse.refresh_token,
        expires_at: expiresAt,
      }),
    });
    
    console.log('✅ Tokens stored successfully!\n');
    console.log('🚀 Starting sync service...\n');
    
    // Start sync
    execSync('node sync-service.js', { stdio: 'inherit' });
    
  } catch (err) {
    console.log('❌ Error:', err.message);
  }
  
  rl.close();
}

setup();
