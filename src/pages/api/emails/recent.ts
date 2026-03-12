import type { NextApiRequest, NextApiResponse } from 'next';
import { getValidGoogleToken } from '../auth/refresh-google';

interface EmailMessage {
  id: string;
  subject: string;
  from: string;
  fromEmail: string;
  snippet: string;
  receivedAt: string;
  isUnread: boolean;
  category?: 'URGENT' | 'REPLY_NEEDED' | 'FYI';
}

async function fetchGmailMessages(accessToken: string, maxResults: number = 20) {
  // Get recent messages
  const listUrl = `https://gmail.googleapis.com/gmail/v1/users/me/messages?q=is:inbox&maxResults=${maxResults}`;
  
  const listResponse = await fetch(listUrl, {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Accept': 'application/json'
    }
  });

  if (!listResponse.ok) {
    throw new Error(`Gmail list error: ${listResponse.status}`);
  }

  const listData = await listResponse.json();
  return listData.messages || [];
}

async function fetchMessageDetails(accessToken: string, messageId: string): Promise<EmailMessage> {
  const response = await fetch(
    `https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}?format=metadata&metadataHeaders=Subject&metadataHeaders=From&metadataHeaders=Date`,
    {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json'
      }
    }
  );

  if (!response.ok) {
    throw new Error(`Gmail fetch error: ${response.status}`);
  }

  const data = await response.json();
  
  const headers = data.payload?.headers || [];
  const subject = headers.find((h: any) => h.name === 'Subject')?.value || 'No Subject';
  const fromHeader = headers.find((h: any) => h.name === 'From')?.value || 'Unknown';
  const date = headers.find((h: any) => h.name === 'Date')?.value || new Date().toISOString();
  
  // Parse from: "Name" <email> or just email
  const fromMatch = fromHeader.match(/"?([^"<]+)"?\s*(?:<([^>]+)>)?/);
  const fromName = fromMatch?.[1]?.trim() || fromHeader;
  const fromEmail = fromMatch?.[2]?.trim() || fromHeader;
  
  // Simple categorization based on subject/content
  const subjectLower = subject.toLowerCase();
  let category: 'URGENT' | 'REPLY_NEEDED' | 'FYI' = 'FYI';
  
  if (subjectLower.includes('urgent') || subjectLower.includes('asap') || subjectLower.includes('action required')) {
    category = 'URGENT';
  } else if (subjectLower.includes('re:') || subjectLower.includes('reply') || subjectLower.includes('question')) {
    category = 'REPLY_NEEDED';
  }
  
  return {
    id: messageId,
    subject,
    from: fromName,
    fromEmail,
    snippet: data.snippet || '',
    receivedAt: new Date(date).toISOString(),
    isUnread: data.labelIds?.includes('UNREAD') || false,
    category
  };
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const token = await getValidGoogleToken();
    
    if (!token) {
      return res.status(401).json({ 
        error: 'Google authentication required',
        message: 'Please run the Google auth setup'
      });
    }

    const messages = await fetchGmailMessages(token, 15);
    
    const emails = await Promise.all(
      messages.map((msg: any) => fetchMessageDetails(token, msg.id))
    );

    // Sort by date, newest first
    emails.sort((a, b) => new Date(b.receivedAt).getTime() - new Date(a.receivedAt).getTime());

    return res.status(200).json({
      emails,
      count: emails.length,
      unreadCount: emails.filter((e: EmailMessage) => e.isUnread).length,
      urgentCount: emails.filter((e: EmailMessage) => e.category === 'URGENT').length,
      replyNeededCount: emails.filter((e: EmailMessage) => e.category === 'REPLY_NEEDED').length,
      lastUpdated: new Date().toISOString(),
      source: 'Gmail API'
    });

  } catch (error) {
    console.error('Gmail API error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch emails',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
