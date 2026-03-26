import { execFileSync } from 'child_process';

export function normalizeOpenClawAgentId(agentId: string) {
  if (['clawd-prime', 'work-agent', 'build-agent', 'email-agent', 'hubspot-agent'].includes(agentId)) return 'main';
  if (['lifestyle-agent', 'research-agent'].includes(agentId)) return 'sarah';
  return agentId;
}

export function runOpenClawJson<T>(args: string[], fallback: T, timeout = 5000): T {
  try {
    const output = execFileSync('openclaw', [...args, '--json'], {
      encoding: 'utf8',
      timeout,
    });
    return JSON.parse(output) as T;
  } catch {
    return fallback;
  }
}
