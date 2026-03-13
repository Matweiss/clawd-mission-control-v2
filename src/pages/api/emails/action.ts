import type { NextApiRequest, NextApiResponse } from 'next';
import { getValidGoogleToken } from '../auth/refresh-google';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { messageId, action } = req.body;

  if (!messageId || !action) {
    return res.status(400).json({ error: 'Missing messageId or action' });
  }

  if (action !== 'delete' && action !== 'star' && action !== 'unstar') {
    return res.status(400).json({ error: 'Invalid action. Use delete, star, or unstar' });
  }

  try {
    const token = await getValidGoogleToken();
    
    if (!token) {
      return res.status(401).json({ 
        error: 'Google authentication required',
        message: 'Please run the Google auth setup'
      });
    }

    let endpoint = '';
    let method = 'POST';
    let body: any = {};

    if (action === 'delete') {
      // Move to trash
      endpoint = `https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}/trash`;
    } else if (action === 'star') {
      // Add STARRED label
      endpoint = `https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}/modify`;
      body = { addLabelIds: ['STARRED'] };
    } else if (action === 'unstar') {
      // Remove STARRED label
      endpoint = `https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}/modify`;
      body = { removeLabelIds: ['STARRED'] };
    }

    const response = await fetch(endpoint, {
      method,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: Object.keys(body).length > 0 ? JSON.stringify(body) : undefined
    });

    if (!response.ok) {
      const error = await response.text();
      return res.status(response.status).json({ 
        error: `Gmail API error: ${response.status}`,
        details: error
      });
    }

    const data = await response.json();
    
    return res.status(200).json({
      success: true,
      messageId,
      action,
      result: data
    });

  } catch (error) {
    console.error('Gmail action error:', error);
    res.status(500).json({ 
      error: 'Failed to perform action',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
