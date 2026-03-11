// Google Sheets API integration using the existing Google OAuth flow.

const SHEET_ID = '1pJJ7dP5hw1un18g0yprfw4sc__ITvdzdsfSFFVqhepQ';
const RANGE = 'March 2025 Close Deals!A1:K100';

export interface Deal {
  id: string;
  dealId: string;
  name: string;
  company: string;
  contactEmail?: string;
  amount: number;
  stage: string;
  closeDate: string;
  priority: 'high' | 'medium' | 'low';
  status: 'active' | 'stalled' | 'at_risk' | 'closing' | 'closed_won' | 'closed_lost';
  notes: string;
  nextAction: string;
  hubspotUrl?: string;
}

async function getValidToken(): Promise<string | null> {
  try {
    const response = await fetch('/api/auth/google-token');
    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    return data.access_token || null;
  } catch (error) {
    console.error('Error getting token:', error);
    return null;
  }
}

export async function fetchDealsFromSheet(): Promise<Deal[]> {
  try {
    const token = await getValidToken();

    if (!token) {
      console.log('No valid token, returning empty array');
      return [];
    }

    const response = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${RANGE}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      if (response.status === 401) {
        console.log('Token expired');
        return [];
      }
      throw new Error('Failed to fetch from Google Sheets');
    }

    const data = await response.json();
    const rows = data.values || [];

    return rows.slice(1).map((row: any[], index: number) => ({
      id: index.toString(),
      dealId: row[0] || '',
      name: row[1] || '',
      company: row[2] || '',
      contactEmail: row[3] || '',
      amount: parseFloat(row[4]) || 0,
      stage: row[5] || '',
      closeDate: row[6] || '',
      priority: (row[7] || 'medium') as Deal['priority'],
      status: (row[8] || 'active') as Deal['status'],
      notes: row[9] || '',
      nextAction: row[10] || '',
    }));
  } catch (error) {
    console.error('Error fetching deals:', error);
    return [];
  }
}

export async function updateDealInSheet(deal: Deal, rowIndex: number): Promise<boolean> {
  try {
    const token = await getValidToken();
    if (!token) return false;

    const range = `March 2025 Close Deals!A${rowIndex + 2}:K${rowIndex + 2}`;
    const values = [[
      deal.dealId,
      deal.name,
      deal.company,
      deal.contactEmail,
      deal.amount,
      deal.stage,
      deal.closeDate,
      deal.priority,
      deal.status,
      deal.notes,
      deal.nextAction,
    ]];

    const response = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${range}?valueInputOption=USER_ENTERED`,
      {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ values }),
      }
    );

    return response.ok;
  } catch (error) {
    console.error('Error updating deal:', error);
    return false;
  }
}

export async function addDealToSheet(deal: Omit<Deal, 'id'>): Promise<boolean> {
  try {
    const token = await getValidToken();
    if (!token) return false;

    const response = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${RANGE}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const data = await response.json();
    const rowCount = (data.values || []).length;
    const range = `March 2025 Close Deals!A${rowCount + 1}:K${rowCount + 1}`;

    const values = [[
      deal.dealId,
      deal.name,
      deal.company,
      deal.contactEmail,
      deal.amount,
      deal.stage,
      deal.closeDate,
      deal.priority,
      deal.status,
      deal.notes,
      deal.nextAction,
    ]];

    const updateResponse = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${range}?valueInputOption=USER_ENTERED`,
      {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ values }),
      }
    );

    return updateResponse.ok;
  } catch (error) {
    console.error('Error adding deal:', error);
    return false;
  }
}
