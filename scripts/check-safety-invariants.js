#!/usr/bin/env node
/*
 * Safety invariant checker for Mission Control production changes.
 *
 * Intent: fail fast on non-negotiable engineering rules before risky changes
 * land, without printing secrets or requiring external services.
 */

const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();
const argv = process.argv.slice(2);

function hasFlag(flag) {
  return argv.includes(flag);
}

function argValue(name) {
  const idx = argv.indexOf(name);
  return idx >= 0 ? argv[idx + 1] : undefined;
}

function splitList(value) {
  return String(value || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

function git(args, fallback = '') {
  try {
    return execFileSync('git', args, { cwd: ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
  } catch {
    return fallback;
  }
}

function walk(dir) {
  if (!fs.existsSync(dir)) return [];
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name === '.next' || entry.name === '.git') continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(full));
    else out.push(path.relative(ROOT, full));
  }
  return out;
}

function trackedProjectFiles() {
  const tracked = git(['ls-files'], '')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
  return tracked.length ? tracked : walk(ROOT);
}

function changedFiles() {
  const names = new Set();
  for (const line of git(['diff', '--name-only'], '').split('\n')) if (line.trim()) names.add(line.trim());
  for (const line of git(['diff', '--cached', '--name-only'], '').split('\n')) if (line.trim()) names.add(line.trim());
  return [...names];
}

function selectedFiles() {
  const explicit = splitList(argValue('--files'));
  if (explicit.length) return explicit;
  if (hasFlag('--all')) return trackedProjectFiles();
  return changedFiles();
}

function isTextFile(file) {
  return /\.(ts|tsx|js|jsx|mjs|cjs|json|md|yml|yaml|env\.example|txt)$/i.test(file);
}

function readFile(file) {
  try {
    return fs.readFileSync(path.join(ROOT, file), 'utf8');
  } catch {
    return null;
  }
}

function addFinding(findings, severity, invariant, file, message, line) {
  findings.push({ severity, invariant, file, line: line || null, message });
}

function lineNumber(content, index) {
  return content.slice(0, index).split('\n').length;
}

function checkNoMockData(files, findings) {
  const liveSource = files.filter((file) =>
    /^src\//.test(file) &&
    /\.(ts|tsx|js|jsx)$/.test(file) &&
    !/(^|\/)(__tests__|test|tests|fixtures|stories)(\/|\.)/.test(file)
  );

  const mockPattern = /\b(mock|fake|dummy)\s+(data|response|payload|user|users|deal|deals|email|emails|task|tasks)\b|\b(useMock|mockData|fakeData|dummyData)\b/gi;

  for (const file of liveSource) {
    const content = readFile(file);
    if (!content) continue;
    for (const match of content.matchAll(mockPattern)) {
      addFinding(
        findings,
        'error',
        'no-mock-data-in-live-dashboard',
        file,
        'Live dashboard/API code appears to include mock or fake data. Move it to fixtures/tests or gate it behind explicit non-production config.',
        lineNumber(content, match.index || 0)
      );
    }
  }
}

function checkAuthBoundaries(files, findings) {
  const apiFiles = files.filter((file) => /^src\/pages\/api\/.*\.(ts|tsx|js|jsx)$/.test(file));
  const mutatingMethodPattern = /req\.method\s*!==\s*['"](POST|PUT|PATCH|DELETE)['"]|req\.method\s*===\s*['"](POST|PUT|PATCH|DELETE)['"]|case\s+['"](POST|PUT|PATCH|DELETE)['"]/;
  const sensitivePathPattern = /\/(action|command|lock|webhook|create|import|backup)(\.|\/)/;
  const authPattern = /authorization|bearer|x-[a-z0-9-]*secret|webhook_secret|api[_-]?key|auth|required|getValidGoogleToken|HA_TOKEN|SUPABASE_SERVICE_ROLE_KEY|GITHUB_TOKEN|PAPERCLIP_API_KEY|process\.env\.[A-Z0-9_]*(SECRET|TOKEN|KEY)/i;

  for (const file of apiFiles) {
    const content = readFile(file);
    if (!content) continue;
    const mutates = mutatingMethodPattern.test(content) || sensitivePathPattern.test(file);
    if (mutates && !authPattern.test(content)) {
      addFinding(
        findings,
        'error',
        'auth-boundary-required',
        file,
        'Mutating or sensitive API route lacks an obvious auth/token/secret boundary. Add authentication or document why this endpoint is intentionally public.'
      );
    }
  }
}

function checkUnboundedRetries(files, findings) {
  const source = files.filter((file) => /\.(ts|tsx|js|jsx|mjs|cjs)$/.test(file));
  const patterns = [
    { name: 'while-true', regex: new RegExp('while\\\\s*\\\\(\\\\s*true\\\\s*\\\\)', 'g'), message: 'Unbounded while(true) loop found. Add a max attempt/time limit and backoff.' },
    { name: 'for-ever', regex: new RegExp('for\\\\s*\\\\(\\\\s*;\\\\s*;\\\\s*\\\\)', 'g'), message: 'Unbounded for(;;) loop found. Add a max attempt/time limit and backoff.' },
  ];

  for (const file of source) {
    const content = readFile(file);
    if (!content) continue;
    for (const { regex, message } of patterns) {
      for (const match of content.matchAll(regex)) {
        addFinding(findings, 'error', 'no-unbounded-retries', file, message, lineNumber(content, match.index || 0));
      }
    }

    const retryish = /retry|retries|attempt/i.test(content);
    const bounded = /maxRetries|maxAttempts|attempts?\s*[<>=]{1,2}\s*\d+|AbortSignal|timeout|setTimeout/i.test(content);
    if (retryish && !bounded) {
      addFinding(
        findings,
        'warning',
        'bounded-retry-required',
        file,
        'Retry-related code should declare a visible max attempt count, timeout, abort signal, or backoff cap.'
      );
    }
  }
}

function checkRollbackReadiness(findings) {
  const required = hasFlag('--require-rollback-notes') || process.env.REQUIRE_ROLLBACK_NOTES === '1';
  if (!required) return;

  const configured = argValue('--rollback-notes') || process.env.ROLLBACK_NOTES_FILE || 'docs/rollback-readiness.md';
  const full = path.join(ROOT, configured);
  if (!fs.existsSync(full)) {
    addFinding(findings, 'error', 'rollback-readiness-required', configured, 'Rollback notes are required for this deploy, but the rollback notes file is missing.');
    return;
  }

  const content = fs.readFileSync(full, 'utf8');
  const hasRollbackTarget = /last known good|rollback target|revert|restore|vercel rollback|git revert/i.test(content);
  const hasOwnerOrWhen = /owner|when to rollback|trigger|decision/i.test(content);
  if (!hasRollbackTarget || !hasOwnerOrWhen) {
    addFinding(
      findings,
      'error',
      'rollback-readiness-required',
      configured,
      'Rollback notes must name the rollback target/mechanism and the owner or decision trigger.'
    );
  }
}

function main() {
  const files = selectedFiles()
    .filter((file) => isTextFile(file))
    .filter((file) => fs.existsSync(path.join(ROOT, file)))
    .filter((file) => !file.startsWith('node_modules/') && !file.startsWith('.next/'));

  const findings = [];
  checkNoMockData(files, findings);
  checkAuthBoundaries(files, findings);
  checkUnboundedRetries(files, findings);
  checkRollbackReadiness(findings);

  const errors = findings.filter((f) => f.severity === 'error');
  const warnings = findings.filter((f) => f.severity === 'warning');
  const payload = {
    ok: errors.length === 0,
    checkedFiles: files.length,
    errors: errors.length,
    warnings: warnings.length,
    findings,
  };

  if (hasFlag('--json')) {
    console.log(JSON.stringify(payload, null, 2));
  } else {
    console.log(`Safety invariants: ${payload.ok ? 'PASS' : 'FAIL'} (${files.length} files, ${errors.length} errors, ${warnings.length} warnings)`);
    for (const finding of findings) {
      const loc = finding.line ? `${finding.file}:${finding.line}` : finding.file;
      console.log(`- [${finding.severity}] ${finding.invariant} ${loc} — ${finding.message}`);
    }
  }

  if (errors.length) process.exit(1);
}

main();
