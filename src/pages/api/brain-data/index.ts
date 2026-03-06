import type { NextApiRequest, NextApiResponse } from 'next';

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const REPO_OWNER = 'Matweiss';
const REPO_NAME = 'clawd-brain-data';

interface MemoryFile {
  path: string;
  filename: string;
  title: string;
  date: string;
  type: string;
  tags: string[];
  preview: string;
  lastModified: string;
  content?: string;
}

// Fetch file content from GitHub
async function fetchFileContent(path: string): Promise<string | null> {
  try {
    const response = await fetch(
      `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${path}`,
      {
        headers: {
          'Authorization': `Bearer ${GITHUB_TOKEN}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      }
    );
    
    if (!response.ok) return null;
    
    const data = await response.json();
    if (data.content) {
      return Buffer.from(data.content, 'base64').toString('utf-8');
    }
    return null;
  } catch (error) {
    console.error('Error fetching file:', error);
    return null;
  }
}

// Fetch directory contents from GitHub
async function fetchDirectoryContents(path: string = ''): Promise<any[]> {
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
    
    if (!response.ok) return [];
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching directory:', error);
    return [];
  }
}

// Recursively get all markdown files
async function getAllMarkdownFiles(dir: string = ''): Promise<MemoryFile[]> {
  const files: MemoryFile[] = [];
  const contents = await fetchDirectoryContents(dir);
  
  for (const item of contents) {
    if (item.type === 'dir') {
      const subFiles = await getAllMarkdownFiles(item.path);
      files.push(...subFiles);
    } else if (item.type === 'file' && item.name.endsWith('.md') && item.name !== 'README.md') {
      const content = await fetchFileContent(item.path);
      if (content) {
        const metadata = parseFrontmatter(content);
        const preview = content
          .replace(/^---\n[\s\S]*?\n---/, '')
          .replace(/#+ /g, '')
          .slice(0, 200) + '...';
        
        files.push({
          path: item.path,
          filename: item.name,
          title: metadata.title,
          date: metadata.date,
          type: metadata.type,
          tags: metadata.tags,
          preview: preview,
          lastModified: item.sha // Using sha as proxy for modification
        });
      }
    }
  }
  
  return files.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

// Parse markdown frontmatter
function parseFrontmatter(content: string) {
  const frontmatterRegex = /^---\n([\s\S]*?)\n---/;
  const match = content.match(frontmatterRegex);
  
  if (!match) {
    return {
      title: 'Untitled',
      date: new Date().toISOString(),
      type: 'memory',
      tags: []
    };
  }
  
  const frontmatter = match[1];
  const metadata: any = {};
  
  frontmatter.split('\n').forEach(line => {
    const colonIndex = line.indexOf(':');
    if (colonIndex > 0) {
      const key = line.slice(0, colonIndex).trim();
      const rawValue = line.slice(colonIndex + 1).trim();
      
      let parsedValue: string | string[];
      
      // Parse arrays
      if (rawValue.startsWith('[') && rawValue.endsWith(']')) {
        parsedValue = rawValue.slice(1, -1).split(',').map((v: string) => v.trim().replace(/"/g, ''));
      } else {
        parsedValue = rawValue.replace(/"/g, '');
      }
      
      metadata[key] = parsedValue;
    }
  });
  
  return {
    title: metadata.title || 'Untitled',
    date: metadata.date || new Date().toISOString(),
    type: metadata.type || 'memory',
    tags: Array.isArray(metadata.tags) ? metadata.tags : []
  };
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const { type, limit = '50', path } = req.query;
    
    // Get specific file content
    if (path) {
      const content = await fetchFileContent(path as string);
      if (content) {
        const metadata = parseFrontmatter(content);
        return res.status(200).json({
          content,
          ...metadata
        });
      }
      return res.status(404).json({ error: 'File not found' });
    }
    
    // Get list of files based on type
    let files: MemoryFile[] = [];
    
    if (type === 'memories') {
      files = await getAllMarkdownFiles('memories');
    } else if (type === 'handoffs') {
      const active = await getAllMarkdownFiles('handoffs/active');
      const archived = await getAllMarkdownFiles('handoffs/archived');
      files = [...active, ...archived];
    } else if (type === 'docs') {
      files = await getAllMarkdownFiles('docs');
    } else if (type === 'daily') {
      files = await getAllMarkdownFiles('daily');
    } else {
      // Get all
      const [memories, handoffsActive, handoffsArchived, docs, daily] = await Promise.all([
        getAllMarkdownFiles('memories'),
        getAllMarkdownFiles('handoffs/active'),
        getAllMarkdownFiles('handoffs/archived'),
        getAllMarkdownFiles('docs'),
        getAllMarkdownFiles('daily')
      ]);
      files = [...memories, ...handoffsActive, ...handoffsArchived, ...docs, ...daily]
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }
    
    const limitNum = parseInt(limit as string, 10);
    const limitedFiles = files.slice(0, limitNum);
    
    res.status(200).json({
      files: limitedFiles,
      total: files.length,
      type: type || 'all'
    });
  } catch (error) {
    console.error('Brain data API error:', error);
    res.status(500).json({ error: 'Failed to fetch brain data' });
  }
}
