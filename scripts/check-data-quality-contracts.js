#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const apiDir = path.join(root, 'src/pages/api');
const required = [
  'pipeline/sheet.ts',
  'pipeline/summary.ts',
  'yoga/schedule.ts',
  'movies/regal-sherman-oaks.ts',
];

const failures = [];

for (const relative of required) {
  const file = path.join(apiDir, relative);
  const source = fs.readFileSync(file, 'utf8');
  if (!source.includes('buildDataQuality')) {
    failures.push(`${relative}: missing buildDataQuality contract`);
  }
  if (!source.includes('dataQuality')) {
    failures.push(`${relative}: response does not include dataQuality`);
  }
}

const panel = fs.readFileSync(path.join(root, 'src/components/IntegrationStatusPanel.tsx'), 'utf8');
if (!panel.includes('readDataQuality') || !panel.includes('statusFromResponse')) {
  failures.push('IntegrationStatusPanel.tsx: integration status does not consume dataQuality');
}

if (failures.length) {
  console.error('Data quality contract check failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(`Data quality contract check passed for ${required.length} API routes.`);
