import type { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs/promises';
import path from 'path';
import { spawn } from 'child_process';
import { getValidGoogleToken } from './auth/refresh-google';

const WORKSPACE_ROOT = process.env.OPENCLAW_WORKSPACE || '/root/.openclaw/workspace';
const STATE_PATH = path.join(WORKSPACE_ROOT, 'memory/lucra-tracker-state.json');
const TRACKER_SCRIPT = path.join(WORKSPACE_ROOT, 'scripts/lucra-outreach-tracker.py');
const SHEET_ID = '1EfCK7TFd8mtzZJFTdFvf7jKToC7liAd5-z_xpRs0lNs';
const SHEET_TAB = 'Sheet1';

type LucraProspect = {
  key: string;
  company: string;
  contactEmail: string;
  contactName?: string;
  subject?: string;
  category?: string;
  stage?: string;
  lastContact?: string;
  nextAction?: string;
  nextActionDate?: string;
  threadId?: string;
  messageCount?: number;
  notes?: string;
};

type LucraState = {
  generatedAt?: string;
  summary?: { prospects?: number; dueToday?: number; appended?: number; updated?: number; dryRun?: boolean };
  due_today?: LucraProspect[];
  prospects?: LucraProspect[];
};

async function readState(): Promise<LucraState> {
  try {
    return JSON.parse(await fs.readFile(STATE_PATH, 'utf8'));
  } catch {
    return { generatedAt: null as any, summary: { prospects: 0, dueToday: 0 }, due_today: [], prospects: [] };
  }
}

function runTracker(): Promise<{ stdout: string; stderr: string }> {
  return new Promise((resolve, reject) => {
    const child = spawn('python3', [TRACKER_SCRIPT, '--limit', '80'], {
      cwd: WORKSPACE_ROOT,
      env: process.env,
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    let stdout = '';
    let stderr = '';
    child.stdout.on('data', chunk => { stdout += chunk.toString(); });
    child.stderr.on('data', chunk => { stderr += chunk.toString(); });
    child.on('error', reject);
    child.on('close', code => {
      if (code === 0) resolve({ stdout, stderr });
      else reject(new Error(stderr || stdout || `Lucra tracker exited with ${code}`));
    });
  });
}

function extractName(prospect: LucraProspect) {
  return prospect.contactName || prospect.company || 'there';
}

function buildDraft(prospect: LucraProspect) {
  const subject = prospect.subject?.startsWith('Re:') ? prospect.subject : `Re: ${prospect.subject || `Lucra <> ${prospect.company}`}`;
  const body = [
    `Hi ${extractName(prospect)},`,
    '',
    `Wanted to follow up on the Lucra ${prospect.stage === 'Proposal' ? 'proposal/deck' : 'conversation'} and see if it would be helpful to compare notes this week.`,
    '',
    'Happy to send over anything else that would help evaluate fit.',
    '',
    'Best,',
    'Mat',
  ].join('\n');
  return { subject, body };
}

function base64Url(input: string) {
  return Buffer.from(input).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

async function createGmailDraft(prospect: LucraProspect) {
  const token = await getValidGoogleToken();
  if (!token) throw new Error('Google authentication required');
  const { subject, body } = buildDraft(prospect);
  const raw = [
    `To: ${prospect.contactEmail}`,
    `Subject: ${subject}`,
    'Content-Type: text/plain; charset="UTF-8"',
    '',
    body,
  ].join('\r\n');
  const response = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/drafts', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ message: { raw: base64Url(raw), threadId: prospect.threadId || undefined } }),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data?.error?.message || `Gmail draft failed: ${response.status}`);
  return { id: data.id, messageId: data.message?.id, subject };
}

async function updateProspectSheet(prospect: LucraProspect, patch: { nextActionDate?: string; wonLost?: string; stage?: string }) {
  const token = await getValidGoogleToken();
  if (!token) throw new Error('Google authentication required');
  const rowsRes = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${encodeURIComponent(SHEET_TAB)}!A1:S200`, {
    headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
  });
  if (!rowsRes.ok) throw new Error(`Sheets read failed: ${rowsRes.status}`);
  const rows = (await rowsRes.json()).values || [];
  const targetIndex = rows.findIndex((row: string[]) => String(row[5] || '').toLowerCase() === prospect.contactEmail.toLowerCase());
  if (targetIndex < 0) throw new Error('Prospect row not found in Lucra sheet');
  const sheetRow = targetIndex + 1;
  const requests: Promise<Response>[] = [];
  if (patch.nextActionDate !== undefined) {
    requests.push(fetch(`https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${encodeURIComponent(SHEET_TAB)}!M${sheetRow}:M${sheetRow}?valueInputOption=USER_ENTERED`, {
      method: 'PUT', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ values: [[patch.nextActionDate]] }),
    }));
  }
  if (patch.stage || patch.wonLost) {
    requests.push(fetch(`https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${encodeURIComponent(SHEET_TAB)}!G${sheetRow}:R${sheetRow}?valueInputOption=USER_ENTERED`, {
      method: 'PUT', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ values: [[patch.stage || rows[targetIndex][6] || '', '', '', '', rows[targetIndex][10] || '', rows[targetIndex][11] || '', patch.nextActionDate || rows[targetIndex][12] || '', rows[targetIndex][13] || '', rows[targetIndex][14] || '', rows[targetIndex][15] || '', rows[targetIndex][16] || '', patch.wonLost || rows[targetIndex][17] || '']] }),
    }));
  }
  const responses = await Promise.all(requests);
  const failed = responses.find(r => !r.ok);
  if (failed) throw new Error(`Sheets update failed: ${failed.status}`);
  return { row: sheetRow };
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method === 'GET') {
      const state = await readState();
      return res.status(200).json({ ...state, source: STATE_PATH });
    }

    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    const state = await readState();
    const prospects = state.prospects || [];
    const prospect = prospects.find(p => p.key === req.body?.key || p.contactEmail === req.body?.contactEmail);
    const action = req.body?.action;

    if (action === 'run-scan') {
      const run = await runTracker();
      const fresh = await readState();
      return res.status(200).json({ success: true, run, state: fresh });
    }

    if (!prospect) return res.status(404).json({ error: 'Prospect not found in tracker cache' });

    if (action === 'draft-follow-up') {
      const draft = await createGmailDraft(prospect);
      return res.status(200).json({ success: true, draft });
    }

    if (action === 'snooze') {
      const days = Number(req.body?.days || 3);
      const next = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
      const update = await updateProspectSheet(prospect, { nextActionDate: next });
      return res.status(200).json({ success: true, nextActionDate: next, update });
    }

    if (action === 'mark-closed-lost') {
      const update = await updateProspectSheet(prospect, { stage: 'Closed Lost', wonLost: 'Closed Lost' });
      return res.status(200).json({ success: true, update });
    }

    return res.status(400).json({ error: 'Invalid action' });
  } catch (error) {
    console.error('Lucra tracker API error:', error);
    return res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
}
