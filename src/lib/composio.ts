// Server-side Composio helper.
//
// The dashboard calls Composio's hosted Tool Router MCP endpoint
// (connect.composio.dev/mcp) so Vercel functions can fetch Notion pages,
// Granola meetings, etc. without running the Composio CLI. Auth uses the
// MCP consumer key (X-CONSUMER-API-KEY) tied to a connection that already
// has the toolkits attached.
//
// COMPOSIO_MCP_URL  — MCP endpoint (default https://connect.composio.dev/mcp).
// COMPOSIO_MCP_KEY  — consumer key (starts "ck_…").
//
// Tools are executed through the router's COMPOSIO_MULTI_EXECUTE_TOOL meta-tool.
// All execute calls return a normalized shape:
//   { ok: boolean; data: unknown; error: string | null }
// so callers can render gracefully when env is missing or a toolkit isn't
// connected.

const DEFAULT_MCP_URL = 'https://connect.composio.dev/mcp';

export function getComposioMcpUrl() {
  return (process.env.COMPOSIO_MCP_URL || DEFAULT_MCP_URL).trim();
}

export function getComposioKey() {
  return (process.env.COMPOSIO_MCP_KEY || process.env.COMPOSIO_API_KEY || '').trim();
}

export function isComposioConfigured() {
  return getComposioKey().length > 0;
}

export interface ComposioResult<T = unknown> {
  ok: boolean;
  data: T | null;
  error: string | null;
}

// Parse an MCP Streamable-HTTP (SSE) response body into JSON-RPC messages.
function parseMcpSse(raw: string): any[] {
  const out: any[] = [];
  for (const line of raw.split('\n')) {
    const trimmed = line.startsWith('data:') ? line.slice(5).trim() : '';
    if (!trimmed || trimmed[0] !== '{') continue;
    try { out.push(JSON.parse(trimmed)); } catch { /* skip */ }
  }
  return out;
}

export async function executeComposioTool<T = unknown>(
  toolSlug: string,
  args: Record<string, unknown>,
  options: { timeoutMs?: number } = {}
): Promise<ComposioResult<T>> {
  const key = getComposioKey();
  if (!key) {
    return { ok: false, data: null, error: 'COMPOSIO_MCP_KEY not set' };
  }

  const timeoutMs = options.timeoutMs ?? 20_000;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(getComposioMcpUrl(), {
      method: 'POST',
      headers: {
        'X-CONSUMER-API-KEY': key,
        'Content-Type': 'application/json',
        Accept: 'application/json, text/event-stream',
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: Date.now(),
        method: 'tools/call',
        params: {
          name: 'COMPOSIO_MULTI_EXECUTE_TOOL',
          arguments: { tools: [{ tool_slug: toolSlug, arguments: args }] },
        },
      }),
      signal: controller.signal,
    });

    const raw = await res.text();
    if (!res.ok) {
      return { ok: false, data: null, error: `Composio MCP → ${res.status}` };
    }

    // Find the JSON-RPC message carrying the tool result.
    const messages = parseMcpSse(raw);
    const msg = messages.find((m) => m?.result?.content) || messages[0];
    const content = msg?.result?.content || [];
    let blob = '';
    for (const c of content) {
      if (c?.type === 'text' && typeof c.text === 'string') blob += c.text;
    }
    if (!blob) {
      return { ok: false, data: null, error: msg?.error?.message || 'Empty Composio MCP response' };
    }

    let inner: any = null;
    try { inner = JSON.parse(blob); } catch { /* non-JSON */ }
    // COMPOSIO_MULTI_EXECUTE_TOOL → { data: { results: [{ response: { successful, data, error } }] } }
    const toolResponse = inner?.data?.results?.[0]?.response ?? inner;
    if (toolResponse?.successful === false || toolResponse?.error) {
      const errMsg = typeof toolResponse?.error === 'string' ? toolResponse.error : `${toolSlug} failed`;
      return { ok: false, data: null, error: errMsg };
    }
    return { ok: true, data: (toolResponse?.data ?? toolResponse) as T, error: null };
  } catch (err: any) {
    return { ok: false, data: null, error: err?.message || 'Composio MCP fetch failed' };
  } finally {
    clearTimeout(timer);
  }
}

// ——— Notion ———

export interface NotionPageHit {
  id: string;
  title: string;
  url: string;
  lastEdited: string | null;
  preview: string;
}

function notionTitleFromObject(obj: any): string {
  // Try common locations for a page title in Notion search results.
  if (typeof obj?.title === 'string') return obj.title;
  const props = obj?.properties || {};
  for (const key of Object.keys(props)) {
    const value = props[key];
    if (value?.type === 'title' && Array.isArray(value.title)) {
      return value.title.map((t: any) => t?.plain_text || '').join('').trim() || 'Untitled';
    }
  }
  return 'Untitled';
}

export async function searchNotionPages(query: string, pageSize = 5): Promise<NotionPageHit[]> {
  if (!isComposioConfigured()) return [];
  const result = await executeComposioTool<any>('NOTION_SEARCH_NOTION_PAGE', {
    query,
    page_size: pageSize,
    filter_property: 'object',
    filter_value: 'page',
  });
  if (!result.ok || !result.data) return [];
  // Notion search payload often nests results under .results or .data.results
  const pages: any[] =
    result.data?.results ||
    result.data?.data?.results ||
    result.data?.pages ||
    [];
  return pages.slice(0, pageSize).map((page) => {
    const title = notionTitleFromObject(page);
    const url = page?.url || page?.public_url || '';
    const lastEdited = page?.last_edited_time || null;
    return {
      id: page?.id || url,
      title,
      url,
      lastEdited,
      preview: title.slice(0, 140),
    };
  });
}

// ——— Granola ———

export interface GranolaMeeting {
  id: string;
  title: string;
  date: string | null;
  participants: string[];
}

// Granola's MCP returns its meeting list as an XML-ish text blob inside
// data.data[0].text. Parse out <meeting id="..." title="..." date="...">
// entries so the UI can render structured rows without depending on the
// model output format.
function parseGranolaMeetingsText(text: string): GranolaMeeting[] {
  const meetings: GranolaMeeting[] = [];
  const meetingRegex = /<meeting id="([^"]+)" title="([^"]*)" date="([^"]*)">([\s\S]*?)<\/meeting>/g;
  let match: RegExpExecArray | null;
  while ((match = meetingRegex.exec(text)) !== null) {
    const [, id, title, date, inner] = match;
    const participantBlock = (inner.match(/<known_participants>([\s\S]*?)<\/known_participants>/) || [])[1] || '';
    const participants = participantBlock
      .split(',')
      .map((s) => s.trim().replace(/\s+/g, ' '))
      .filter(Boolean);
    meetings.push({ id, title: title.trim() || 'Untitled meeting', date: date || null, participants });
  }
  return meetings;
}

export async function listRecentGranolaMeetings(
  timeRange: 'this_week' | 'last_week' | 'last_30_days' = 'last_30_days'
): Promise<GranolaMeeting[]> {
  if (!isComposioConfigured()) return [];
  const result = await executeComposioTool<any>('GRANOLA_MCP_LIST_MEETINGS', { time_range: timeRange });
  if (!result.ok || !result.data) return [];
  const text: string = result.data?.data?.[0]?.text || result.data?.text || '';
  if (!text) return [];
  return parseGranolaMeetingsText(text);
}

export function filterMeetingsForQuery(meetings: GranolaMeeting[], needles: string[]): GranolaMeeting[] {
  const lowered = needles.map((n) => n.toLowerCase().trim()).filter((n) => n.length >= 3);
  if (lowered.length === 0) return [];
  return meetings.filter((m) => {
    const haystack = `${m.title} ${m.participants.join(' ')}`.toLowerCase();
    return lowered.some((n) => haystack.includes(n));
  });
}
