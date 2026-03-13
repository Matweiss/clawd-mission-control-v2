import type { NextApiRequest, NextApiResponse } from 'next';
import { getValidGoogleToken } from '../auth/refresh-google';

const SHEET_ID = '1pJJ7dP5hw1un18g0yprfw4sc__ITvdzdsfSFFVqhepQ';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST' && req.method !== 'PUT') {
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

    // Get sheet name
    const sheetRes = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}?fields=sheets.properties.title`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      }
    );

    let sheetName = 'Sheet1';
    if (sheetRes.ok) {
      const meta = await sheetRes.json();
      sheetName = meta.sheets?.[0]?.properties?.title || 'Sheet1';
    }

    if (req.method === 'POST') {
      // Add new deal row
      const { name, mrr, arr, stage, closeDate, probability, notes } = req.body;

      const values = [[
        name || '',
        '', // Column B
        '', // Column C
        mrr || '',
        arr || '',
        stage || '',
        closeDate || '',
        probability || '',
        notes || ''
      ]];

      const response = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/'${sheetName}'!A:I:append?valueInputOption=USER_ENTERED`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify({ values })
        }
      );

      if (!response.ok) {
        const error = await response.text();
        return res.status(response.status).json({ 
          error: `Sheets API error: ${response.status}`,
          details: error
        });
      }

      const data = await response.json();
      
      return res.status(200).json({ 
        success: true, 
        action: 'create',
        updatedRange: data.updates?.updatedRange
      });
    }

    if (req.method === 'PUT') {
      // Update existing deal
      const { rowIndex, name, mrr, arr, stage, closeDate, probability, notes } = req.body;

      if (rowIndex === undefined) {
        return res.status(400).json({ error: 'Missing rowIndex' });
      }

      // Row index is 0-based in our data, but sheets are 1-based and we skip header
      const sheetRow = rowIndex + 2; // +2 because header is row 1

      const values = [[
        name || '',
        '', // Column B
        '', // Column C
        mrr || '',
        arr || '',
        stage || '',
        closeDate || '',
        probability || '',
        notes || ''
      ]];

      const response = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/'${sheetName}'!A${sheetRow}:I${sheetRow}?valueInputOption=USER_ENTERED`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify({ values })
        }
      );

      if (!response.ok) {
        const error = await response.text();
        return res.status(response.status).json({ 
          error: `Sheets API error: ${response.status}`,
          details: error
        });
      }

      const data = await response.json();
      
      return res.status(200).json({ 
        success: true, 
        action: 'update',
        updatedRange: data.updatedRange
      });
    }

  } catch (error) {
    console.error('Pipeline action error:', error);
    res.status(500).json({ 
      error: 'Failed to perform action',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
