import type { NextApiRequest, NextApiResponse } from 'next';
import { getValidGoogleToken } from '../auth/refresh-google';

const SHEET_ID = '1pJJ7dP5hw1un18g0yprfw4sc__ITvdzdsfSFFVqhepQ';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const token = await getValidGoogleToken();
    
    if (!token) {
      // Return fallback data if not authenticated
      return res.status(200).json({
        totalValue: '$18.4k',
        totalMRR: 18400,
        dealCount: 3,
        byStage: {
          'Qualification': { count: 1, mrr: 5400 },
          'Discovery': { count: 1, mrr: 8000 },
          'Evaluation': { count: 1, mrr: 5000 },
        },
        closingThisWeek: 1,
        source: 'Fallback (auth required)',
        lastUpdated: new Date().toISOString(),
      });
    }

    // Fetch from Google Sheets
    let response = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/Deals!A:Z`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      }
    );

    // Try first sheet if 'Deals' doesn't exist
    if (response.status === 400) {
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
    
    // Parse deals - skip header
    let totalMRR = 0;
    let dealCount = 0;
    const byStage: Record<string, { count: number; mrr: number }> = {};
    
    rows.slice(1).forEach((row: string[]) => {
      const name = row[0]?.trim();
      if (!name || name === 'TOTALS:' || name === 'Company') return;
      
      const mrr = parseFloat(row[3]?.replace(/[^0-9.]/g, '')) || 0;
      const stage = row[5] || 'Unknown';
      
      totalMRR += mrr;
      dealCount++;
      
      if (!byStage[stage]) {
        byStage[stage] = { count: 0, mrr: 0 };
      }
      byStage[stage].count++;
      byStage[stage].mrr += mrr;
    });

    // Format value nicely
    const formatValue = (mrr: number) => {
      if (mrr >= 1000) {
        return `$${(mrr / 1000).toFixed(1)}k`;
      }
      return `$${mrr}`;
    };

    // Find deals closing this week
    const today = new Date();
    const weekFromNow = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
    let closingThisWeek = 0;
    
    rows.slice(1).forEach((row: string[]) => {
      const closeDate = row[6];
      if (closeDate) {
        const close = new Date(closeDate);
        if (close >= today && close <= weekFromNow) {
          closingThisWeek++;
        }
      }
    });

    return res.status(200).json({
      totalValue: formatValue(totalMRR),
      totalMRR,
      dealCount,
      byStage,
      closingThisWeek,
      source: 'Google Sheets',
      lastUpdated: new Date().toISOString(),
    });

  } catch (error) {
    console.error('Pipeline summary error:', error);
    // Return fallback
    res.status(200).json({
      totalValue: '$18.4k',
      totalMRR: 18400,
      dealCount: 3,
      byStage: {
        'Qualification': { count: 1, mrr: 5400 },
        'Discovery': { count: 1, mrr: 8000 },
        'Evaluation': { count: 1, mrr: 5000 },
      },
      closingThisWeek: 1,
      source: 'Fallback',
      error: error instanceof Error ? error.message : 'Unknown error',
      lastUpdated: new Date().toISOString(),
    });
  }
}
