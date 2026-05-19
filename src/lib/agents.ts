// Single source of truth for the Paperclip agent roster.
//
// Anywhere in the dashboard that previously hardcoded an agent UUID, name,
// emoji, color, role, or capabilities should import from here so the roster
// can't drift across files.

export interface AgentProfile {
  /** Paperclip agent UUID — the canonical identifier. */
  id: string;
  /** Display name shown in the UI. */
  name: string;
  /** OpenClaw agent bucket (matches `openclaw status --json` keys). */
  openclawAgentId: string;
  emoji: string;
  /** Tailwind palette key (e.g. 'work', 'lifestyle') or hex color. */
  color: string;
  /** Hex color for inline styling in the AgentCommandCenter modal. */
  hexColor: string;
  /** Short title shown under the name. */
  role: string;
  /** Org level: 1 = CEO, 2 = department lead, 3 = specialist. */
  level: 1 | 2 | 3;
  responsibilities: string[];
  capabilities: string[];
}

export const AGENT_ROSTER: AgentProfile[] = [
  {
    id: 'a0edadcb-f994-40e3-a9a1-d3ffde595c3e',
    name: 'Clawd',
    openclawAgentId: 'main',
    emoji: '🦞',
    color: 'work',
    hexColor: '#F97316',
    role: 'CEO & Orchestrator',
    level: 1,
    responsibilities: ['Cross-agent orchestration', 'Strategic oversight', 'Decision authority', 'System health', 'Escalation handling'],
    capabilities: ['Coordinate Paperclip roster', 'Route tasks across agents', 'Spawn cron / one-shot agents', 'Monitor session telemetry', 'Resolve approvals'],
  },
  {
    id: '6ec7b59f-8955-4d21-b4c3-c4b5a68772c8',
    name: 'Vandalay',
    openclawAgentId: 'vandalay',
    emoji: '📈',
    color: 'vandalay',
    hexColor: '#8B5CF6',
    role: 'Chief Strategy Officer',
    level: 2,
    responsibilities: ['Scope and review enhancements', 'System design critiques', 'Sprint shaping', 'Risk surfacing', 'Cross-team alignment'],
    capabilities: ['Review proposals', 'Draft sprint briefs', 'Audit dashboard surfaces', 'Recommend scope cuts', 'Hand off to Bob'],
  },
  {
    id: '1ef5e05b-7a16-4ebc-8c05-cdb03a321197',
    name: 'Sloan',
    openclawAgentId: 'sloan',
    emoji: '📋',
    color: 'sloan',
    hexColor: '#06B6D4',
    role: 'Chief of Staff',
    level: 2,
    responsibilities: ['Calendar & schedule ownership', 'Meeting prep', 'Action-item routing', 'Daily/weekly rhythm', 'Status synthesis'],
    capabilities: ['Manage calendar slots', 'Prep meeting briefs', 'Track follow-ups', 'Coordinate roster check-ins'],
  },
  {
    id: 'fd4efc78-5969-47f3-878a-457654682548',
    name: 'Bob',
    openclawAgentId: 'builder',
    emoji: '🔧',
    color: 'build',
    hexColor: '#3B82F6',
    role: 'Head of Build',
    level: 2,
    responsibilities: ['Dashboard / API implementation', 'Infrastructure changes', 'Build verification', 'Bugfix execution', 'Integration wiring'],
    capabilities: ['Edit Next.js dashboard', 'Wire Paperclip APIs', 'Run builds and tests', 'Deploy via Vercel', 'Author migrations'],
  },
  {
    id: '8c40bdd4-7e82-40a7-9fa7-982b0931d705',
    name: 'Luke',
    openclawAgentId: 'lucra',
    emoji: '💼',
    color: 'work',
    hexColor: '#F59E0B',
    role: 'Sales & Lucra Ops',
    level: 2,
    responsibilities: ['Lucra pipeline ownership', 'Deal follow-ups', 'Commission tracking', 'Granola routing', 'Notion deal notes'],
    capabilities: ['Update HubSpot deals', 'Pull Granola meeting context', 'Draft sales follow-ups', 'Manage Lucra commissions'],
  },
  {
    id: 'd61e45f1-a8ad-4c2c-afeb-1cad12ec17c6',
    name: 'Sage',
    openclawAgentId: 'lifestyle',
    emoji: '🌿',
    color: 'lifestyle',
    hexColor: '#22C55E',
    role: 'Personal & Lifestyle',
    level: 2,
    responsibilities: ['Wellness/yoga tracking', 'Home + lifestyle context', 'Date night memory bank', 'Personal reminders'],
    capabilities: ['Update yoga schedule', 'Track wellness signals', 'Surface lifestyle goals', 'Manage memory bank'],
  },
  {
    id: 'e6822182-3611-4152-a1f2-aab9975fce3d',
    name: 'Hermes',
    openclawAgentId: 'hermes',
    emoji: '✉️',
    color: 'email',
    hexColor: '#EC4899',
    role: 'Google Workspace Ops',
    level: 3,
    responsibilities: ['Gmail triage', 'Calendar event mgmt', 'Drive doc ops', 'Drafts and replies', 'Workspace automation'],
    capabilities: ['Categorize inbox', 'Create calendar events', 'Open Gmail threads', 'Draft replies', 'Manage Drive files'],
  },
  {
    id: 'dd20d11e-6a2e-4de1-bdfd-c068b5f1499f',
    name: 'Scout',
    openclawAgentId: 'scout',
    emoji: '🔍',
    color: 'research',
    hexColor: '#10B981',
    role: 'Research & Intelligence',
    level: 3,
    responsibilities: ['Company / prospect research', 'Competitor scans', 'Battle cards', 'Market signals'],
    capabilities: ['Run web searches', 'Build battle cards', 'Summarize prospects', 'Track competitor moves'],
  },
  {
    id: '951c871e-fcb0-4211-bf92-19b0812d16bd',
    name: 'Pixel',
    openclawAgentId: 'pixel',
    emoji: '🌐',
    color: 'hubspot',
    hexColor: '#0EA5E9',
    role: 'Browser & Scheduling',
    level: 3,
    responsibilities: ['Browser automation', 'Booking flows', 'Scheduling via web UIs', 'Movie / Regal sync'],
    capabilities: ['Drive Mac Chrome via CDP', 'Scrape protected sites', 'Book and reschedule', 'Sync schedule data'],
  },
  {
    id: '61ee0d8e-ac57-47bc-8402-5d3a756427ad',
    name: 'Arty',
    openclawAgentId: 'sarah',
    emoji: '🎨',
    color: 'arty',
    hexColor: '#F472B6',
    role: 'Art & Shopify Ops',
    level: 3,
    responsibilities: ['Creative production', 'Shopify lightweight ops', 'Visual review', 'Brand consistency'],
    capabilities: ['Generate creative drafts', 'Run Shopify checks', 'Review brand surfaces'],
  },
];

export const AGENT_BY_ID: Record<string, AgentProfile> = Object.fromEntries(
  AGENT_ROSTER.map((agent) => [agent.id, agent])
);

export const AGENT_NAME_BY_ID: Record<string, string> = Object.fromEntries(
  AGENT_ROSTER.map((agent) => [agent.id, agent.name])
);

export function getAgentById(id: string | null | undefined): AgentProfile | undefined {
  if (!id) return undefined;
  return AGENT_BY_ID[id];
}

export function agentNameOrFallback(id: string | null | undefined, fallback = 'Agent'): string | null {
  if (!id) return null;
  return AGENT_NAME_BY_ID[id] ?? fallback;
}
