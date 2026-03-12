import type { NextApiRequest, NextApiResponse } from 'next';
import { getValidGoogleToken } from '../auth/refresh-google';

const SHEET_ID = '1pJJ7dP5hw1un18g0yprfw4sc__ITvdzdsfSFFVqhepQ';

interface Deal {
  id: string;
  name: string;
  amount: number;
  stage: string;
  closeDate?: string;
  probability?: number;
  notes?: string;
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

    // Fetch data from Google Sheets
    const response = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/Deals!A:Z`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      }
    );

    if (!response.ok) {
      throw new Error(`Sheets API error: ${response.status}`);
    }

    const data = await response.json();
    const rows = data.values || [];
    
    // Skip header row, parse deals
    const deals: Deal[] = rows.slice(1).map((row: string[], index: number) => ({
      id: `sheet-${index}`,
      name: row[0] || 'Unnamed Deal',
      amount: parseFloat(row[1]?.replace(/[^0-9.]/g, '')) || 0,
      stage: row[2] || 'Unknown',
      closeDate: row[3] || undefined,
      probability: parseInt(row[4]) || 0,
      notes: row[5] || '',
    })).filter((d: Deal) => d.name && d.name !== 'Unnamed Deal');

    // Calculate totals by stage
    const total = deals.reduce((sum: number, d: Deal) => sum + d.amount, 0);
    const byStage = deals.reduce((acc: any, deal: Deal) => {
      const stage = deal.stage || 'Unknown';
      if (!acc[stage]) acc[stage] = { count: 0, value: 0 };
      acc[stage].count++;
      acc[stage].value += deal.amount;
      return acc;
    }, {});

    // Find deals closing this week
    const today = new Date();
    const weekFromNow = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
    const closingThisWeek = deals.filter((d: Deal) => {
      if (!d.closeDate) return false;
      const close = new Date(d.closeDate);
      return close >= today && close <= weekFromNow;
    });

    return res.status(200).json({
      deals,
      total,
      byStage,
      closingThisWeek,
      count: deals.length,
      lastUpdated: new Date().toISOString(),
      source: 'Google Sheets'
    });

  } catch (error) {
    console.error('Pipeline API error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch pipeline',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
