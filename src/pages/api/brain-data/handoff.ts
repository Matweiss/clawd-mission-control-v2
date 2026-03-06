import type { NextApiRequest, NextApiResponse } from 'next';
import { writeFileSync, mkdirSync, existsSync, readFileSync, renameSync } from 'fs';
import { join, dirname } from 'path';
import { execSync } from 'child_process';

const BRAIN_DATA_PATH = '/root/.openclaw/workspace/clawd-brain-data';

export type HandoffStatus = 'draft' | 'pending' | 'active' | 'complete' | 'archived';
export type HandoffPriority = 'low' | 'medium' | 'high' | 'urgent';

interface HandoffData {
  title: string;
  from: string;
  to: string;
  status: HandoffStatus;
  priority: HandoffPriority;
  due?: string;
  content: string;
  context?: string;
  deliverables?: string[];
  blockers?: string[];
  tags?: string[];
}

const HANDOFF_TEMPLATES: Record<HandoffStatus, string> = {
  draft: `# 📝 Draft Handoff

## Context
{context}

## Work Completed
- [ ] 

## Next Steps
- [ ] 

## Notes
`,
  pending: `# ⏳ Pending Handoff

**From:** {from}  
**To:** {to}  
**Priority:** {priority}  
**Due:** {due}

## Context
{context}

## Deliverables
{deliverables}

## Blockers
{blockers}

## Next Steps
- [ ] Awaiting assignment
`,
  active: `# 🚀 Active Handoff

**From:** {from}  
**To:** {to}  
**Priority:** {priority}  
**Due:** {due}

## Context
{context}

## Current Status
Work in progress...

## Deliverables
{deliverables}

## Blockers
{blockers}
`,
  complete: `# ✅ Completed Handoff

**From:** {from}  
**To:** {to}  
**Completed:** {date}

## Summary
{context}

## Deliverables Completed
{deliverables}

## Lessons Learned
- 
`,
  archived: `# 📦 Archived Handoff

**From:** {from}  
**To:** {to}  
**Status:** Completed & Archived

## Original Context
{context}

## Final Deliverables
{deliverables}
`
};

function generateHandoffContent(data: HandoffData): string {
  const template = HANDOFF_TEMPLATES[data.status];
  const now = new Date().toISOString().split('T')[0];
  
  const deliverablesList = data.deliverables?.map(d => `- [ ] ${d}`).join('\n') || '- [ ] TBD';
  const blockersList = data.blockers?.map(b => `- ${b}`).join('\n') || '- None identified';
  
  return template
    .replace('{from}', data.from)
    .replace('{to}', data.to)
    .replace('{priority}', data.priority)
    .replace('{due}', data.due || 'TBD')
    .replace('{date}', now)
    .replace('{context}', data.context || data.content || 'TBD')
    .replace('{deliverables}', deliverablesList)
    .replace('{blockers}', blockersList);
}

function generateFrontmatter(data: HandoffData): string {
  const date = new Date().toISOString();
  const tags = [...(data.tags || []), 'handoff', data.status, data.priority];
  const tagsStr = tags.map(t => `"${t}"`).join(', ');
  
  let fm = `---
title: "${data.title}"
date: ${date}
type: handoff
status: ${data.status}
from: "${data.from}"
to: "${data.to}"
priority: ${data.priority}`;

  if (data.due) fm += `\ndue: ${data.due}`;
  fm += `\ntags: [${tagsStr}]`;
  fm += '\n---\n\n';
  
  return fm;
}

function getFilePath(status: HandoffStatus, title: string): { path: string; isActive: boolean } {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 50);
  const filename = `${year}-${month}-${day}-${slug}.md`;
  
  if (status === 'archived' || status === 'complete') {
    return { path: `handoffs/archived/${year}/${month}/${filename}`, isActive: false };
  }
  return { path: `handoffs/active/${filename}`, isActive: true };
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === 'POST') {
    // Create new handoff
    try {
      const data: HandoffData = req.body;
      
      if (!data.title || !data.from || !data.to) {
        return res.status(400).json({ error: 'Title, from, and to are required' });
      }

      const { path: relativePath, isActive } = getFilePath(data.status, data.title);
      const fullPath = join(BRAIN_DATA_PATH, relativePath);
      
      // Ensure directory exists
      const dir = dirname(fullPath);
      if (!existsSync(dir)) {
        mkdirSync(dir, { recursive: true });
      }

      // Generate content
      const frontmatter = generateFrontmatter(data);
      const content = generateHandoffContent(data);
      const fullContent = frontmatter + content;
      
      writeFileSync(fullPath, fullContent, 'utf-8');
      
      // Git commit
      try {
        execSync('git add -A', { cwd: BRAIN_DATA_PATH });
        execSync(`git commit -m "[handoff] ${data.title} (${data.status})"`, { cwd: BRAIN_DATA_PATH });
        execSync('git push origin main', { cwd: BRAIN_DATA_PATH });
      } catch (e) {
        console.log('Git commit optional, continuing...');
      }
      
      res.status(200).json({
        success: true,
        path: relativePath,
        status: data.status,
        isActive
      });
    } catch (error) {
      console.error('Create handoff error:', error);
      res.status(500).json({ error: 'Failed to create handoff' });
    }
  } else if (req.method === 'PUT') {
    // Update handoff status (move between active/archived)
    try {
      const { path: currentPath, newStatus } = req.body;
      
      if (!currentPath || !newStatus) {
        return res.status(400).json({ error: 'Path and newStatus are required' });
      }

      const currentFullPath = join(BRAIN_DATA_PATH, currentPath);
      
      if (!existsSync(currentFullPath)) {
        return res.status(404).json({ error: 'Handoff not found' });
      }

      // Read current content
      const content = readFileSync(currentFullPath, 'utf-8');
      
      // Update status in frontmatter
      const updatedContent = content.replace(
        /status: (\w+)/,
        `status: ${newStatus}`
      );
      
      // Get new path based on status
      const titleMatch = content.match(/title: "([^"]+)"/);
      const title = titleMatch ? titleMatch[1] : 'untitled';
      const { path: newRelativePath } = getFilePath(newStatus, title);
      const newFullPath = join(BRAIN_DATA_PATH, newRelativePath);
      
      // Ensure new directory exists
      const newDir = dirname(newFullPath);
      if (!existsSync(newDir)) {
        mkdirSync(newDir, { recursive: true });
      }
      
      // Write to new location
      writeFileSync(newFullPath, updatedContent, 'utf-8');
      
      // Remove old file if path changed
      if (currentPath !== newRelativePath) {
        try {
          const { unlinkSync } = require('fs');
          unlinkSync(currentFullPath);
        } catch (e) {
          console.log('Could not remove old file');
        }
      }
      
      // Git commit
      try {
        execSync('git add -A', { cwd: BRAIN_DATA_PATH });
        execSync(`git commit -m "[handoff] ${title} → ${newStatus}"`, { cwd: BRAIN_DATA_PATH });
        execSync('git push origin main', { cwd: BRAIN_DATA_PATH });
      } catch (e) {
        console.log('Git commit optional');
      }
      
      res.status(200).json({
        success: true,
        oldPath: currentPath,
        newPath: newRelativePath,
        newStatus
      });
    } catch (error) {
      console.error('Update handoff error:', error);
      res.status(500).json({ error: 'Failed to update handoff' });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}
