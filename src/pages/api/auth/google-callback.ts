// src/pages/api/auth/google-callback.ts
// OAuth2 callback for adding a new Google account (e.g., Lucra work email).
// After auth, displays the refresh token so it can be added to Vercel env vars.

import type { NextApiRequest, NextApiResponse } from 'next';

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const REDIRECT_URI = 'https://clawd-mission-control-v2.vercel.app/api/auth/google-callback';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { code, error } = req.query;

  if (error) {
    return res.status(400).send(`<html><body><h2>OAuth Error</h2><p>${error}</p></body></html>`);
  }

  if (!code || typeof code !== 'string') {
    return res.status(400).send('<html><body><h2>Missing code parameter</h2></body></html>');
  }

  try {
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: GOOGLE_CLIENT_ID || '',
        client_secret: GOOGLE_CLIENT_SECRET || '',
        redirect_uri: REDIRECT_URI,
        code,
        grant_type: 'authorization_code',
      }),
    });

    const data = await tokenRes.json();

    if (!tokenRes.ok || data.error) {
      return res.status(500).send(`<html><body><h2>Token exchange failed</h2><pre>${JSON.stringify(data, null, 2)}</pre></body></html>`);
    }

    const { refresh_token, access_token } = data;

    // Get account email
    let email = 'unknown';
    try {
      const profileRes = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/profile', {
        headers: { Authorization: `Bearer ${access_token}` },
      });
      const profile = await profileRes.json();
      email = profile.emailAddress || 'unknown';
    } catch {}

    return res.status(200).send(`
      <html>
        <head><title>Google Auth Success</title></head>
        <body style="font-family:monospace;padding:40px;background:#111;color:#0f0;">
          <h2>✅ Auth successful for: ${email}</h2>
          <p>Add this as <strong>GOOGLE_REFRESH_TOKEN_LUCRA</strong> in Vercel:</p>
          <textarea rows="3" cols="80" style="background:#000;color:#0f0;border:1px solid #0f0;padding:10px;">${refresh_token || 'NO REFRESH TOKEN — make sure prompt=consent was set'}</textarea>
          <br/><br/>
          <p style="color:#aaa;">Close this window when done. Do not share this token.</p>
        </body>
      </html>
    `);
  } catch (err) {
    return res.status(500).send(`<html><body><h2>Error</h2><pre>${err}</pre></body></html>`);
  }
}
