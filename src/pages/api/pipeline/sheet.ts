import type { NextApiRequest, NextApiResponse } from 'next';
import { getValidGoogleToken } from '../auth/refresh-google';

const SHEET_ID = '1pJJ7dP5hw1un18g0yprfw4sc__ITvdzdsfSFFVqhepQ';

interface Deal {
  id: string;
  name: string;
  mrr: number;
  arr: number;
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

    // Fetch data from Google Sheets - try first sheet if 'Deals' doesn't exist
    let response = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/Deals!A:Z`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      }
    );

    // If 'Deals' tab doesn't exist, try 'Sheet1' or get sheet metadata
    if (response.status === 400) {
      // Try to get sheet metadata first
      const metaRes = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}?fields=sheets.properties.title`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json'
          }
        }
      );
      
      if (metaRes.ok) {
        const meta = await metaRes.json();
        const firstSheet = meta.sheets?.[0]?.properties?.title;
        if (firstSheet) {
          response = await fetch(
            `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/'${firstSheet}'!A:Z`,
            {
              headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json'
              }
            }
          );
        }
      }
    }

    if (!response.ok) {
      throw new Error(`Sheets API error: ${response.status}`);
    }

    const data = await response.json();
    const rows = data.values || [];
    
    // Skip header row, parse deals
    // Column D (index 3) = MRR value, Column E (index 4) = ARR value (MRR * 12), Column F (index 5) = Stage
    const deals: Deal[] = rows.slice(1).map((row: string[], index: number) => {
      const mrr = parseFloat(row[3]?.replace(/[^0-9.]/g, '')) || 0;
      const arr = parseFloat(row[4]?.replace(/[^0-9.]/g, '')) || (mrr * 12);
      return {
        id: `sheet-${index}`,
        name: row[0] || 'Unnamed Deal',
        mrr,
        arr,
        stage: row[5] || 'Unknown', // Column F = Stage
        closeDate: row[6] || undefined, // Column G = Close Date
        probability: parseInt(row[7]) || 0, // Column H = Probability
        notes: row[8] || '', // Column I = Notes
      };
    }).filter((d: Deal) => d.name && d.name !== 'Unnamed Deal' && d.name !== 'TOTALS:');

    // Calculate totals by stage
    const totalMRR = deals.reduce((sum: number, d: Deal) => sum + d.mrr, 0);
    const totalARR = deals.reduce((sum: number, d: Deal) => sum + d.arr, 0);
    const byStage = deals.reduce((acc: any, deal: Deal) => {
      const stage = deal.stage || 'Unknown';
      if (!acc[stage]) acc[stage] = { count: 0, mrr: 0, arr: 0 };
      acc[stage].count++;
      acc[stage].mrr += deal.mrr;
      acc[stage].arr += deal.arr;
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
      totalMRR,
      totalARR,
      byStage,
      closingThisWeek,
      count: deals.length,
      lastUpdated: new Date().toISOString(),
      source: 'Google Sheets'
    });

  } catch (error) {
    console.error('Pipeline API error:', error);
    // Return fallback data with error info
    res.status(200).json({ 
      deals: [],
      total: 0,
      byStage: {},
      closingThisWeek: [],
      count: 0,
      lastUpdated: new Date().toISOString(),
      source: 'Google Sheets',
      error: error instanceof Error ? error.message : 'Unknown error',
      help: 'Sheet may need permission or correct tab name. Check sheet ID and ensure "Deals" tab exists.'
    });
  }
}
