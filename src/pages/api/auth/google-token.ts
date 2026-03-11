// src/pages/api/auth/google-token.ts
// Returns a current valid Google OAuth access token using the configured refresh token.

import type { NextApiRequest, NextApiResponse } from 'next';
import { getValidGoogleToken } from './refresh-google';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const accessToken = await getValidGoogleToken();

    if (!accessToken) {
      return res.status(401).json({
        error: 'Google authentication not configured',
        message: 'Set GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, and GOOGLE_REFRESH_TOKEN in environment variables.'
      });
    }

    return res.status(200).json({ access_token: accessToken });
  } catch (error) {
    console.error('Error getting Google token:', error);
    return res.status(500).json({ error: 'Failed to get Google token' });
  }
}
