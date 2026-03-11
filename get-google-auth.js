#!/usr/bin/env node
const https = require('https');
const readline = require('readline');

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3000/auth/callback';

const SCOPES = [
  'https://www.googleapis.com/auth/calendar.readonly',
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/gmail.modify',
  'https://www.googleapis.com/auth/spreadsheets',
];

if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error('❌ Missing GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET in environment.');
  process.exit(1);
}

console.log('\n🦞 Google Authorization Helper\n');
console.log('Open this URL in your browser and approve access:\n');

const authUrl = 'https://accounts.google.com/o/oauth2/v2/auth?' + new URLSearchParams({
  client_id: CLIENT_ID,
  redirect_uri: REDIRECT_URI,
  response_type: 'code',
  scope: SCOPES.join(' '),
  access_type: 'offline',
  prompt: 'consent',
}).toString();

console.log(authUrl + '\n');
console.log('Paste the full redirect URL after approval.\n');

rl.question('Redirect URL: ', async (redirectUrl) => {
  const match = redirectUrl.match(/[?&]code=([^&]+)/);
  if (!match) {
    console.error('❌ Could not find code= in the redirect URL.');
    rl.close();
    process.exit(1);
  }

  const code = decodeURIComponent(match[1]);

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
        const tokens = JSON.parse(data);
        if (tokens.error) {
          console.error('❌ Error:', tokens.error_description || tokens.error);
          rl.close();
          process.exit(1);
        }

        console.log('\n✅ Token exchange succeeded.');
        console.log('Add these to your environment (do not commit them):\n');
        console.log(`GOOGLE_CLIENT_ID=${CLIENT_ID}`);
        console.log(`GOOGLE_CLIENT_SECRET=${CLIENT_SECRET}`);
        if (tokens.refresh_token) {
          console.log(`GOOGLE_REFRESH_TOKEN=${tokens.refresh_token}`);
        } else {
          console.log('# No refresh token returned. Re-run with prompt=consent and a fresh approval.');
        }
        rl.close();
      } catch (err) {
        console.error('❌ Parse error:', err.message);
        rl.close();
        process.exit(1);
      }
    });
  });

  req.on('error', (err) => {
    console.error('❌ Request error:', err.message);
    rl.close();
    process.exit(1);
  });

  req.write(postData);
  req.end();
});
