import type { NextApiRequest, NextApiResponse } from 'next';

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const REPO_OWNER = 'Matweiss';
const REPO_NAME = 'clawd-brain-data';

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

async function createFileInGitHub(path: string, content: string, message: string): Promise<boolean> {
  try {
    const contentBase64 = Buffer.from(content).toString('base64');
    
    const response = await fetch(
      `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${path}`,
      {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${GITHUB_TOKEN}`,
          'Accept': 'application/vnd.github.v3+json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: message,
          content: contentBase64,
          branch: 'main'
        })
      }
    );
    
    return response.ok;
  } catch (error) {
    console.error('Error creating file:', error);
    return false;
  }
}

async function getFileSha(path: string): Promise<string | null> {
  try {
    const response = await fetch(
      `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${path}?ref=main`,
      {
        headers: {
          'Authorization': `Bearer ${GITHUB_TOKEN}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      }
    );
    
    if (!response.ok) return null;
    
    const data = await response.json();
    return data.sha;
  } catch (error) {
    return null;
  }
}

async function deleteFileFromGitHub(path: string, sha: string, message: string): Promise<boolean> {
  try {
    const response = await fetch(
      `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${path}`,
      {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${GITHUB_TOKEN}`,
          'Accept': 'application/vnd.github.v3+json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: message,
          sha: sha,
          branch: 'main'
        })
      }
    );
    
    return response.ok;
  } catch (error) {
    console.error('Error deleting file:', error);
    return false;
  }
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

      const frontmatter = generateFrontmatter(data);
      const content = generateHandoffContent(data);
      const fullContent = frontmatter + content;
      
      const success = await createFileInGitHub(
        relativePath,
        fullContent,
        `[handoff] ${data.title} (${data.status})`
      );
      
      if (!success) {
        return res.status(500).json({ error: 'Failed to create handoff' });
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
    // Update handoff status
    try {
      const { path: currentPath, newStatus, content: newContent } = req.body;
      
      if (!currentPath || !newStatus) {
        return res.status(400).json({ error: 'Path and newStatus are required' });
      }

      // Get current file content
      const fileResponse = await fetch(
        `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${currentPath}?ref=main`,
        {
          headers: {
            'Authorization': `Bearer ${GITHUB_TOKEN}`,
            'Accept': 'application/vnd.github.v3+json'
          }
        }
      );
      
      if (!fileResponse.ok) {
        return res.status(404).json({ error: 'Handoff not found' });
      }
      
      const fileData = await fileResponse.json();
      const currentContent = Buffer.from(fileData.content, 'base64').toString('utf-8');
      
      // Update status in frontmatter
      const updatedContent = newContent || currentContent.replace(
        /status: (\w+)/,
        `status: ${newStatus}`
      );
      
      // Get new path based on status
      const titleMatch = updatedContent.match(/title: "([^"]+)"/);
      const title = titleMatch ? titleMatch[1] : 'untitled';
      const { path: newRelativePath } = getFilePath(newStatus, title);
      
      // Create new file
      const contentBase64 = Buffer.from(updatedContent).toString('base64');
      const createResponse = await fetch(
        `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${newRelativePath}`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${GITHUB_TOKEN}`,
            'Accept': 'application/vnd.github.v3+json',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            message: `[handoff] ${title} → ${newStatus}`,
            content: contentBase64,
            branch: 'main'
          })
        }
      );
      
      if (!createResponse.ok) {
        return res.status(500).json({ error: 'Failed to create new file' });
      }
      
      // Delete old file if path changed
      if (currentPath !== newRelativePath) {
        await deleteFileFromGitHub(
          currentPath,
          fileData.sha,
          `[handoff] Archive ${title}`
        );
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
