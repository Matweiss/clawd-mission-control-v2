// src/pages/api/auth/google-token.ts
// Returns the current valid Google OAuth token

import type { NextApiRequest, NextApiResponse } from 'next';
import { readFileSync } from 'fs';
import { join } from 'path';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Read from the token file
    const tokenPath = join(process.cwd(), 'google_tokens.json');
    const tokenData = JSON.parse(readFileSync(tokenPath, 'utf8'));
    
    // Check if token is expired
    const expiresAt = new Date(tokenData.expires_at);
    const now = new Date();
    
    if (now > expiresAt) {
      return res.status(401).json({ error: 'Token expired', refresh_needed: true });
    }
    
    return res.status(200).json({ 
      access_token: tokenData.access_token,
      expires_at: tokenData.expires_at 
    });
  } catch (error) {
    console.error('Error reading token:', error);
    return res.status(500).json({ error: 'Failed to read token' });
  }
}
