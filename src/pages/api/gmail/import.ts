import type { NextApiRequest, NextApiResponse } from 'next';
import { getValidGoogleToken } from '../auth/refresh-google';

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const REPO_OWNER = 'Matweiss';
const REPO_NAME = 'clawd-brain-data';

async function fetchGmailMessages(accessToken: string, query: string = '', maxResults: number = 10) {
  const url = `https://gmail.googleapis.com/gmail/v1/users/me/messages?q=${encodeURIComponent(query)}&maxResults=${maxResults}`;
  
  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Accept': 'application/json'
    }
  });

  if (!response.ok) {
    throw new Error(`Gmail API error: ${response.status}`);
  }

  return await response.json();
}

async function fetchMessageDetails(accessToken: string, messageId: string) {
  const response = await fetch(
    `https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}?format=full`,
    {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json'
      }
    }
  );

  if (!response.ok) {
    throw new Error(`Gmail API error: ${response.status}`);
  }

  return await response.json();
}

function decodeBase64Url(base64Url: string): string {
  const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
  return Buffer.from(base64, 'base64').toString('utf-8');
}

function extractEmailContent(message: any): { subject: string; from: string; body: string; date: string } {
  const headers = message.payload.headers;
  const subject = headers.find((h: any) => h.name === 'Subject')?.value || 'No Subject';
  const from = headers.find((h: any) => h.name === 'From')?.value || 'Unknown';
  const date = headers.find((h: any) => h.name === 'Date')?.value || new Date().toISOString();

  let body = '';
  
  // Try to get plain text body
  if (message.payload.parts) {
    const textPart = message.payload.parts.find((p: any) => p.mimeType === 'text/plain');
    if (textPart && textPart.body.data) {
      body = decodeBase64Url(textPart.body.data);
    }
  } else if (message.payload.body && message.payload.body.data) {
    body = decodeBase64Url(message.payload.body.data);
  }

  // Limit body length
  body = body.slice(0, 2000);

  return { subject, from, body, date };
}

async function createMemoryFromEmail(email: { subject: string; from: string; body: string; date: string }, messageId: string) {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const slug = email.subject.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 50);
  
  const path = `memories/${year}/${month}/${year}-${month}-${day}-email-${slug}.md`;
  
  const content = `---
title: "Email: ${email.subject}"
date: ${new Date().toISOString()}
type: memory
tags: ["email", "imported"]
source: gmail
from: "${email.from}"
gmail_id: "${messageId}"
---

## Original Email

**From:** ${email.from}
**Subject:** ${email.subject}
**Date:** ${email.date}

## Content

${email.body}

## Notes

_Add your notes here..._
`;

  // Push to GitHub
  const contentBase64 = Buffer.from(content).toString('base64');
  
  const response = await fetch(
    `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${path}`,
    {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message: `[email] ${email.subject}`,
        content: contentBase64,
        branch: 'main'
      })
    }
  );

  return response.ok;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { action, messageId, query = 'is:unread' } = req.body;

    // For now, we'll need the user to provide their token
    // In production, this would be stored securely
    const accessToken = await getValidGoogleToken();
    
    if (!accessToken) {
      return res.status(401).json({ 
        error: 'Google authentication required',
        setup_url: '/api/auth/google-token'
      });
    }

    if (action === 'list') {
      // List recent emails
      const messages = await fetchGmailMessages(accessToken, query, 20);
      
      const emailList = await Promise.all(
        (messages.messages || []).slice(0, 10).map(async (msg: any) => {
          const details = await fetchMessageDetails(accessToken, msg.id);
          const content = extractEmailContent(details);
          return {
            id: msg.id,
            subject: content.subject,
            from: content.from,
            snippet: details.snippet,
            date: content.date
          };
        })
      );

      return res.status(200).json({ emails: emailList });
    }

    if (action === 'import' && messageId) {
      // Import specific email as memory
      const details = await fetchMessageDetails(accessToken, messageId);
      const content = extractEmailContent(details);
      
      const success = await createMemoryFromEmail(content, messageId);
      
      if (success) {
        return res.status(200).json({ 
          success: true, 
          message: 'Email imported as memory' 
        });
      } else {
        return res.status(500).json({ error: 'Failed to create memory' });
      }
    }

    return res.status(400).json({ error: 'Invalid action' });
  } catch (error) {
    console.error('Gmail API error:', error);
    res.status(500).json({ error: 'Failed to process Gmail request' });
  }
}
