import type { NextApiRequest, NextApiResponse } from 'next';

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const REPO_OWNER = 'Matweiss';
const REPO_NAME = 'clawd-brain-data';

interface MemoryData {
  title: string;
  content: string;
  type: 'memory' | 'handoff' | 'decision' | 'doc';
  tags: string[];
  related?: string[];
  author?: string;
  mood?: string;
}

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 50);
}

function generateFrontmatter(data: MemoryData): string {
  const date = new Date().toISOString();
  const tagsStr = data.tags.map(t => `"${t}"`).join(', ');
  const relatedStr = data.related ? data.related.map(r => `"${r}"`).join(', ') : '';
  
  let frontmatter = `---
title: "${data.title}"
date: ${date}
type: ${data.type}
tags: [${tagsStr}]`;

  if (data.author) frontmatter += `\nauthor: ${data.author}`;
  if (data.mood) frontmatter += `\nmood: ${data.mood}`;
  if (relatedStr) frontmatter += `\nrelated: [${relatedStr}]`;
  
  frontmatter += '\n---\n\n';
  return frontmatter;
}

function getFilePath(type: string, title: string): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const slug = generateSlug(title);
  
  switch (type) {
    case 'memory':
      return `memories/${year}/${month}/${year}-${month}-${day}-${slug}.md`;
    case 'handoff':
      return `handoffs/active/${year}-${month}-${day}-${slug}.md`;
    case 'decision':
      return `docs/decisions/${year}-${month}-${day}-${slug}.md`;
    case 'doc':
      return `docs/processes/${year}-${month}-${day}-${slug}.md`;
    default:
      return `memories/${year}/${month}/${year}-${month}-${day}-${slug}.md`;
  }
}

async function createFileInGitHub(path: string, content: string, message: string): Promise<boolean> {
  try {
    // Encode content to base64
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
    
    if (!response.ok) {
      const error = await response.json();
      console.error('GitHub API error:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error creating file:', error);
    return false;
  }
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const data: MemoryData = req.body;
    
    // Validate
    if (!data.title || !data.content) {
      return res.status(400).json({ error: 'Title and content are required' });
    }

    // Generate file path
    const relativePath = getFilePath(data.type, data.title);
    
    // Generate content
    const frontmatter = generateFrontmatter(data);
    const fullContent = frontmatter + data.content;
    
    // Commit to GitHub
    const success = await createFileInGitHub(
      relativePath,
      fullContent,
      `[memory] ${data.title}`
    );
    
    if (!success) {
      return res.status(500).json({ error: 'Failed to create file in GitHub' });
    }
    
    res.status(200).json({
      success: true,
      path: relativePath,
      message: 'Memory created successfully'
    });
  } catch (error) {
    console.error('Create memory error:', error);
    res.status(500).json({ error: 'Failed to create memory' });
  }
}
