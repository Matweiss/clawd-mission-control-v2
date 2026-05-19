import type { NextApiRequest, NextApiResponse } from 'next';
import { runOpenClawJson } from '../../../lib/openclaw-cli';

interface OpenClawCronJob {
  id: string;
  name?: string;
  agentId?: string;
  enabled?: boolean;
  schedule?: { kind?: string; expr?: string; tz?: string };
  state?: {
    nextRunAtMs?: number;
    lastRunAtMs?: number;
    lastRunStatus?: string;
    lastStatus?: string;
    lastDurationMs?: number;
    consecutiveErrors?: number;
  };
}

interface OpenClawCronListPayload {
  jobs?: OpenClawCronJob[];
}

export interface CronJobRow {
  id: string;
  name: string;
  agentId: string;
  enabled: boolean;
  schedule: string;
  timezone: string | null;
  nextRunAt: string | null;
  lastRunAt: string | null;
  lastStatus: string | null;
  consecutiveErrors: number;
}

function toIso(ms?: number) {
  if (!ms || !Number.isFinite(ms)) return null;
  return new Date(ms).toISOString();
}

function normalize(job: OpenClawCronJob): CronJobRow {
  const status = job.state?.lastRunStatus || job.state?.lastStatus || null;
  return {
    id: job.id,
    name: job.name || job.id,
    agentId: job.agentId || 'main',
    enabled: Boolean(job.enabled),
    schedule: job.schedule?.expr || job.schedule?.kind || '—',
    timezone: job.schedule?.tz || null,
    nextRunAt: toIso(job.state?.nextRunAtMs),
    lastRunAt: toIso(job.state?.lastRunAtMs),
    lastStatus: status,
    consecutiveErrors: Number(job.state?.consecutiveErrors || 0),
  };
}

export default async function handler(_req: NextApiRequest, res: NextApiResponse) {
  const payload = runOpenClawJson<OpenClawCronListPayload>(['cron', 'list'], { jobs: [] }, 5000);
  const jobs = Array.isArray(payload.jobs) ? payload.jobs.map(normalize) : [];

  // Sort by next-run ascending; jobs without a nextRunAt fall to the end.
  jobs.sort((a, b) => {
    const aT = a.nextRunAt ? new Date(a.nextRunAt).getTime() : Number.POSITIVE_INFINITY;
    const bT = b.nextRunAt ? new Date(b.nextRunAt).getTime() : Number.POSITIVE_INFINITY;
    return aT - bT;
  });

  res.setHeader('Cache-Control', 's-maxage=30, stale-while-revalidate=60');
  return res.status(200).json({ jobs, count: jobs.length });
}
