import type { NextApiRequest, NextApiResponse } from 'next';

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;

interface TokenData {
  access_token: string;
  refresh_token: string;
  expires_at: string;
}

// Store tokens in memory for serverless (in production use Redis/DB)
let cachedTokens: TokenData | null = null;

export async function refreshGoogleToken(refreshToken: string): Promise<TokenData | null> {
  try {
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: GOOGLE_CLIENT_ID || '',
        client_secret: GOOGLE_CLIENT_SECRET || '',
        refresh_token: refreshToken,
        grant_type: 'refresh_token'
      })
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Token refresh failed:', error);
      return null;
    }

    const data = await response.json();
    const expiresAt = new Date();
    expiresAt.setSeconds(expiresAt.getSeconds() + data.expires_in);

    const newTokens: TokenData = {
      access_token: data.access_token,
      refresh_token: refreshToken, // Keep the same refresh token
      expires_at: expiresAt.toISOString()
    };

    // Update cache
    cachedTokens = newTokens;

    return newTokens;
  } catch (error) {
    console.error('Error refreshing token:', error);
    return null;
  }
}

export async function getValidGoogleToken(): Promise<string | null> {
  // Use cached tokens if available
  if (cachedTokens) {
    const expiresAt = new Date(cachedTokens.expires_at);
    const now = new Date();
    
    // If token expires in less than 5 minutes, refresh it
    if (expiresAt.getTime() - now.getTime() > 5 * 60 * 1000) {
      return cachedTokens.access_token;
    }
  }

  // Try to get refresh token from environment
  const refreshToken = process.env.GOOGLE_REFRESH_TOKEN;
  
  if (!refreshToken) {
    console.error('No GOOGLE_REFRESH_TOKEN in environment');
    return null;
  }

  // Refresh the token
  const refreshed = await refreshGoogleToken(refreshToken);
  
  if (refreshed) {
    return refreshed.access_token;
  }

  return null;
}

// API endpoint to manually refresh if needed
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const refreshToken = process.env.GOOGLE_REFRESH_TOKEN;
    
    if (!refreshToken) {
      return res.status(500).json({ 
        error: 'No refresh token configured',
        message: 'Set GOOGLE_REFRESH_TOKEN in environment variables'
      });
    }

    const tokens = await refreshGoogleToken(refreshToken);
    
    if (tokens) {
      res.status(200).json({
        success: true,
        expires_at: tokens.expires_at,
        message: 'Token refreshed successfully'
      });
    } else {
      res.status(500).json({ error: 'Failed to refresh token' });
    }
  } catch (error) {
    console.error('Refresh endpoint error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
