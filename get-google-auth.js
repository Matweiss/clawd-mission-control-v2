const https = require('https');
const readline = require('readline');

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

// Using Google's OAuth 2.0 for installed apps
const CLIENT_ID = '271371034887-4ua8h3cra4j7k4g9j7p5k8j6j7.apps.googleusercontent.com';
const CLIENT_SECRET = 'GOCSPX-xxxxxxxxxxxx'; // Placeholder - need actual secret

const SCOPES = [
  'https://www.googleapis.com/auth/calendar.readonly',
  'https://www.googleapis.com/auth/gmail.readonly',
];

console.log('\n🦞 Google Calendar/Gmail Authorization\n');
console.log('Step 1: Click this link to authorize:\n');

const authUrl = 'https://accounts.google.com/o/oauth2/v2/auth?' + new URLSearchParams({
  client_id: CLIENT_ID,
  redirect_uri: 'urn:ietf:wg:oauth:2.0:oob',
  response_type: 'code',
  scope: SCOPES.join(' '),
  access_type: 'offline',
  prompt: 'consent',
}).toString();

console.log('\x1b[34m%s\x1b[0m\n', authUrl);
console.log('Step 2: After approving, Google will give you a code.');
console.log('Step 3: Paste that code here:\n');

rl.question('Authorization code: ', async (code) => {
  console.log('\nExchanging code for tokens...\n');
  
  // Exchange code for tokens
  const postData = new URLSearchParams({
    code: code.trim(),
    client_id: CLIENT_ID,
    client_secret: CLIENT_SECRET,
    redirect_uri: 'urn:ietf:wg:oauth:2.0:oob',
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
          console.log('❌ Error:', tokens.error_description);
          rl.close();
          return;
        }
        
        console.log('✅ Success! Tokens received.\n');
        console.log('Access Token:', tokens.access_token.substring(0, 20) + '...');
        console.log('Refresh Token:', tokens.refresh_token ? 'Yes' : 'No');
        console.log('\nSaving to Supabase...\n');
        
        // Store in Supabase via curl
        const supabaseData = JSON.stringify({
          service: 'google',
          token: tokens.access_token,
          refresh_token: tokens.refresh_token,
          expires_at: new Date(Date.now() + tokens.expires_in * 1000).toISOString(),
        });
        
        const supReq = https.request({
          hostname: 'nmhbmgtyqutbztdafzjl.supabase.co',
          path: '/rest/v1/api_tokens',
          method: 'POST',
          headers: {
            'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5taGJtZ3R5cXV0Ynp0ZGFmempsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTY0NzgzOCwiZXhwIjoyMDg3MjIzODM4fQ.9MBfNDENHCENroVRLFgbuh9nM4DARcLr-4j8dgpHLos',
            'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5taGJtZ3R5cXV0Ynp0ZGFmempsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTY0NzgzOCwiZXhwIjoyMDg3MjIzODM4fQ.9MBfNDENHCENroVRLFgbuh9nM4DARcLr-4j8dgpHLos',
            'Content-Type': 'application/json',
            'Prefer': 'resolution=merge-duplicates',
          },
        }, (supRes) => {
          let supData = '';
          supRes.on('data', chunk => supData += chunk);
          supRes.on('end', () => {
            if (supRes.statusCode === 201 || supRes.statusCode === 200) {
              console.log('✅ Tokens saved to Supabase!\n');
              console.log('The sync service will now automatically fetch Calendar and Gmail data.\n');
            } else {
              console.log('❌ Failed to save:', supData);
            }
            rl.close();
          });
        });
        
        supReq.on('error', (err) => {
          console.log('❌ Supabase error:', err.message);
          rl.close();
        });
        
        supReq.write(supabaseData);
        supReq.end();
        
      } catch (err) {
        console.log('❌ Parse error:', err.message);
        rl.close();
      }
    });
  });
  
  req.on('error', (err) => {
    console.log('❌ Request error:', err.message);
    rl.close();
  });
  
  req.write(postData);
  req.end();
});
