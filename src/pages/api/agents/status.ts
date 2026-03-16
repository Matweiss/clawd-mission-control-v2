import type { NextApiRequest, NextApiResponse } from 'next';
import { execSync } from 'child_process';

interface AgentStatus {
  id: string;
  name: string;
  emoji: string;
  color: string;
  role: string;
  level: number;
  status: 'running' | 'idle' | 'error' | 'offline' | 'weekend';
  lastActive: string;
  uptime?: string;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get OpenClaw status
    let openclawStatus: any = {};
    try {
      const statusOutput = execSync('openclaw status --json 2>/dev/null || echo "{}"', { 
        encoding: 'utf8',
        timeout: 5000 
      });
      openclawStatus = JSON.parse(statusOutput);
    } catch (e) {
      console.log('OpenClaw status not available');
    }

    // Get session info
    let sessions: any[] = [];
    try {
      const sessionsOutput = execSync('openclaw sessions list --json 2>/dev/null || echo "[]"', {
        encoding: 'utf8',
        timeout: 5000
      });
      sessions = JSON.parse(sessionsOutput);
    } catch (e) {
      console.log('Sessions not available');
    }

    // Agent configuration - 3-Tier Architecture
    const agents: AgentStatus[] = [
      {
        id: 'clawd-prime',
        name: 'CLAWD Prime',
        emoji: '🦞',
        color: 'work',
        role: 'Director & Orchestrator',
        level: 1,
        status: sessions.length > 0 ? 'running' : 'idle',
        lastActive: sessions[0]?.lastActive || new Date().toISOString(),
      },
      {
        id: 'work-agent',
        name: 'Work Agent',
        emoji: '🤖',
        color: 'work',
        role: 'Sales & Business Operations',
        level: 2,
        status: 'idle',
        lastActive: new Date().toISOString(),
      },
      {
        id: 'lifestyle-agent',
        name: 'Lifestyle Agent',
        emoji: '🧘',
        color: 'lifestyle',
        role: 'Wellness & Life Balance',
        level: 2,
        status: 'idle',
        lastActive: new Date().toISOString(),
      },
      {
        id: 'build-agent',
        name: 'Build Agent',
        emoji: '🔧',
        color: 'build',
        role: 'Engineering & Infrastructure',
        level: 2,
        status: 'running',
        lastActive: new Date().toISOString(),
      },
      {
        id: 'email-agent',
        name: 'Email Agent',
        emoji: '📧',
        color: 'email',
        role: 'Inbox Monitor → Work Agent',
        level: 3,
        status: 'offline',
        lastActive: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
      },
      {
        id: 'hubspot-agent',
        name: 'HubSpot Agent',
        emoji: '📊',
        color: 'hubspot',
        role: 'CRM Data → Work Agent',
        level: 3,
        status: 'offline',
        lastActive: new Date(Date.now() - 86400000).toISOString(),
      },
      {
        id: 'research-agent',
        name: 'Research Agent',
        emoji: '🔍',
        color: 'research',
        role: 'Intelligence Gathering',
        level: 3,
        status: 'weekend',
        lastActive: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
      },
    ];

    return res.status(200).json({
      agents,
      openclaw: {
        gateway: openclawStatus.gateway?.state || 'unknown',
        nodes: openclawStatus.nodes?.length || 0,
        sessions: sessions.length,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Agent status API error:', error);
    return res.status(500).json({ 
      error: 'Failed to fetch agent status',
      agents: []
    });
  }
}
