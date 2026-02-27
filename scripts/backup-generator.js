#!/usr/bin/env node
/**
 * Clawd Backup & Handoff Generator
 * Creates complete restoration package for disaster recovery
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const WORKSPACE = '/root/.openclaw/workspace';
const BACKUP_DIR = path.join(WORKSPACE, 'backups');
const HANDOFF_DIR = path.join(WORKSPACE, 'handoff');

// Ensure directories exist
[BACKUP_DIR, HANDOFF_DIR].forEach(dir => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

class BackupGenerator {
  constructor() {
    this.timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    this.backupPath = path.join(BACKUP_DIR, `backup-${this.timestamp}`);
    this.manifest = {
      version: '1.0.0',
      created: new Date().toISOString(),
      timestamp: this.timestamp,
      components: {},
      restoration: {}
    };
  }

  async generate() {
    console.log('🔒 Generating Clawd Backup & Handoff Package...\n');

    // Create backup directory
    fs.mkdirSync(this.backupPath, { recursive: true });

    // 1. Backup Core Identity Files
    await this.backupIdentityFiles();

    // 2. Backup Agent Souls
    await this.backupAgentSouls();

    // 3. Backup Memory Files
    await this.backupMemories();

    // 4. Backup Configuration
    await this.backupConfig();

    // 5. Backup Mission Control
    await this.backupMissionControl();

    // 6. Backup Agent Repos
    await this.backupAgentRepos();

    // 7. Backup Database Schema
    await this.backupDatabaseSchema();

    // 8. Backup Skills
    await this.backupSkills();

    // 9. Generate Restoration Guide
    await this.generateRestorationGuide();

    // 10. Generate Handoff Package
    await this.generateHandoffPackage();

    // 11. Create Manifest
    await this.createManifest();

    // 12. Create Compressed Archive
    await this.createArchive();

    console.log(`\n✅ Backup complete: ${this.backupPath}`);
    console.log(`📦 Archive: ${this.backupPath}.tar.gz`);
    
    return {
      backupPath: this.backupPath,
      archivePath: `${this.backupPath}.tar.gz`,
      manifest: this.manifest
    };
  }

  async backupIdentityFiles() {
    console.log('📄 Backing up identity files...');
    
    const files = [
      'SOUL.md',
      'IDENTITY.md',
      'USER.md',
      'AGENTS.md',
      'TOOLS.md',
      'BOOTSTRAP.md',
      'HEARTBEAT.md'
    ];

    const identityDir = path.join(this.backupPath, 'identity');
    fs.mkdirSync(identityDir, { recursive: true });

    files.forEach(file => {
      const src = path.join(WORKSPACE, file);
      if (fs.existsSync(src)) {
        fs.copyFileSync(src, path.join(identityDir, file));
        this.manifest.components.identity = this.manifest.components.identity || [];
        this.manifest.components.identity.push(file);
      }
    });
  }

  async backupAgentSouls() {
    console.log('🤖 Backing up agent souls...');
    
    const agentsDir = path.join(WORKSPACE, 'agents');
    const backupAgentsDir = path.join(this.backupPath, 'agents');
    
    if (fs.existsSync(agentsDir)) {
      fs.mkdirSync(backupAgentsDir, { recursive: true });
      
      const agents = fs.readdirSync(agentsDir)
        .filter(f => f.endsWith('.md'));
      
      agents.forEach(agent => {
        fs.copyFileSync(
          path.join(agentsDir, agent),
          path.join(backupAgentsDir, agent)
        );
      });
      
      this.manifest.components.agents = agents;
    }
  }

  async backupMemories() {
    console.log('🧠 Backing up memories...');
    
    const memoryDir = path.join(WORKSPACE, 'memory');
    const backupMemoryDir = path.join(this.backupPath, 'memory');
    
    if (fs.existsSync(memoryDir)) {
      fs.mkdirSync(backupMemoryDir, { recursive: true });
      
      const memories = fs.readdirSync(memoryDir)
        .filter(f => f.endsWith('.md'));
      
      memories.forEach(mem => {
        fs.copyFileSync(
          path.join(memoryDir, mem),
          path.join(backupMemoryDir, mem)
        );
      });
      
      this.manifest.components.memories = memories;
    }

    // Also backup MEMORY.md if it exists
    const memoryMd = path.join(WORKSPACE, 'MEMORY.md');
    if (fs.existsSync(memoryMd)) {
      fs.copyFileSync(memoryMd, path.join(this.backupPath, 'MEMORY.md'));
      this.manifest.components.coreMemory = 'MEMORY.md';
    }
  }

  async backupConfig() {
    console.log('⚙️ Backing up configuration...');
    
    const configDir = path.join(this.backupPath, 'config');
    fs.mkdirSync(configDir, { recursive: true });

    // Environment variables (sanitized)
    const envFiles = [
      '.env.local',
      '.env',
      '.env.example'
    ];

    envFiles.forEach(file => {
      const src = path.join(WORKSPACE, file);
      if (fs.existsSync(src)) {
        // Read and sanitize
        let content = fs.readFileSync(src, 'utf8');
        // Mask sensitive values but keep keys
        content = content.replace(/(TOKEN|KEY|SECRET|PWD|PASSWORD)=.+/g, '$1=[REDACTED]');
        fs.writeFileSync(path.join(configDir, file), content);
      }
    });

    // Cron configurations
    const cronDir = path.join(WORKSPACE, 'clawd-crons');
    if (fs.existsSync(cronDir)) {
      const backupCronDir = path.join(this.backupPath, 'crons');
      fs.mkdirSync(backupCronDir, { recursive: true });
      
      this.copyDirectory(cronDir, backupCronDir, ['node_modules', '.git']);
      this.manifest.components.crons = true;
    }

    this.manifest.components.config = envFiles.filter(f => 
      fs.existsSync(path.join(WORKSPACE, f))
    );
  }

  async backupMissionControl() {
    console.log('🎛️ Backing up Mission Control...');
    
    const mcDir = path.join(WORKSPACE, 'clawd-mission-control-v2');
    if (fs.existsSync(mcDir)) {
      const backupMcDir = path.join(this.backupPath, 'mission-control');
      fs.mkdirSync(backupMcDir, { recursive: true });
      
      // Only backup source files, not node_modules
      this.copyDirectory(mcDir, backupMcDir, ['node_modules', '.next', 'dist', '.git']);
      
      this.manifest.components.missionControl = {
        path: 'clawd-mission-control-v2',
        excluded: ['node_modules', '.next', 'dist']
      };
    }
  }

  async backupAgentRepos() {
    console.log('📦 Backing up agent repositories...');
    
    const repos = [
      'clawd-email-agent',
      'clawd-hubspot-agent',
      'clawd-oauth-manager',
      'clawd-searxng',
      'clawd-knowledge-base',
      'clawd-meeting-intel',
      'clawd-tier3'
    ];

    const backupReposDir = path.join(this.backupPath, 'agent-repos');
    fs.mkdirSync(backupReposDir, { recursive: true });

    repos.forEach(repo => {
      const repoPath = path.join(WORKSPACE, repo);
      if (fs.existsSync(repoPath)) {
        const backupRepoPath = path.join(backupReposDir, repo);
        fs.mkdirSync(backupRepoPath, { recursive: true });
        
        this.copyDirectory(repoPath, backupRepoPath, ['node_modules', '.git', 'dist', '.next']);
        
        this.manifest.components.agentRepos = this.manifest.components.agentRepos || [];
        this.manifest.components.agentRepos.push(repo);
      }
    });
  }

  async backupDatabaseSchema() {
    console.log('🗄️ Backing up database schema...');
    
    const schemaDir = path.join(this.backupPath, 'database');
    fs.mkdirSync(schemaDir, { recursive: true });

    // Find all SQL files
    const sqlFiles = [];
    const findSql = (dir) => {
      if (!fs.existsSync(dir)) return;
      const items = fs.readdirSync(dir);
      items.forEach(item => {
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory() && !item.includes('node_modules')) {
          findSql(fullPath);
        } else if (item.endsWith('.sql')) {
          sqlFiles.push(fullPath);
        }
      });
    };

    findSql(WORKSPACE);

    sqlFiles.forEach(sqlFile => {
      const relativePath = path.relative(WORKSPACE, sqlFile);
      const destPath = path.join(schemaDir, relativePath);
      fs.mkdirSync(path.dirname(destPath), { recursive: true });
      fs.copyFileSync(sqlFile, destPath);
    });

    this.manifest.components.database = {
      schemaFiles: sqlFiles.map(f => path.relative(WORKSPACE, f))
    };
  }

  async backupSkills() {
    console.log('🛠️ Backing up skills...');
    
    const skillsDir = path.join(WORKSPACE, 'skills');
    if (fs.existsSync(skillsDir)) {
      const backupSkillsDir = path.join(this.backupPath, 'skills');
      fs.mkdirSync(backupSkillsDir, { recursive: true });
      
      this.copyDirectory(skillsDir, backupSkillsDir, ['node_modules']);
      
      this.manifest.components.skills = true;
    }
  }

  async generateRestorationGuide() {
    console.log('📖 Generating restoration guide...');
    
    const guide = `# Clawd Restoration Guide
## Generated: ${new Date().toISOString()}

### 🚨 Emergency Restoration

If your Clawd agent is lost or corrupted, follow these steps to restore:

#### Step 1: Environment Setup
Choose your deployment target:

**Option A: Cloud Agent (Recommended)**
- Platform: OpenClaw Cloud
- Steps: Upload handoff package, import identity files
- Best for: Quick recovery, minimal setup

**Option B: Docker/VPS**

docker run -v /path/to/handoff:/workspace openclaw/agent:latest

- Best for: Persistent hosting, custom infrastructure

**Option C: Local Agent**
- Install OpenClaw locally
- Copy handoff package to workspace
- Best for: Development, privacy-focused

#### Step 2: Identity Restoration
1. Copy SOUL.md, IDENTITY.md, USER.md to workspace root
2. Copy AGENTS.md, TOOLS.md to workspace root
3. Copy agent souls from /agents/ folder

#### Step 3: Memory Restoration
1. Copy MEMORY.md to workspace root
2. Copy all files from /memory/ folder
3. Copy all files from /backups/ folder (for historical data)

#### Step 4: Configuration Restoration
1. Review .env.example for required environment variables
2. Set up API keys (HubSpot, Supabase, Telegram, etc.)
3. Configure cron jobs from /crons/ folder

#### Step 5: Mission Control Deployment
1. Navigate to /mission-control/
2. Run: npm install && npm run build
3. Deploy to Vercel or your preferred host
4. Set environment variables in hosting platform

#### Step 6: Database Restoration
1. Run SQL files from /database/ in Supabase
2. Enable RLS policies (see security-fix.sql)
3. Seed initial data if needed

#### Step 7: Agent Repositories
1. Push agent repos to GitHub (if not already)
2. Configure GitHub Actions or deployment hooks
3. Test agent functionality

### 📋 Component Checklist

${this.generateComponentChecklist()}

### 🔑 Required Environment Variables

\`\`\`
# Supabase
SUPABASE_URL=https://nmhbmgtyqutbztdafzjl.supabase.co
SUPABASE_ANON_KEY=[Get from Supabase dashboard]
SUPABASE_SERVICE_ROLE_KEY=[Get from Supabase dashboard]

# HubSpot
HUBSPOT_TOKEN=[Your HubSpot private app token]
HUBSPOT_OWNER_ID=728033696

# Telegram
TELEGRAM_BOT_TOKEN=[From @BotFather]
TELEGRAM_CHAT_ID=8001393940

# Google Calendar
GOOGLE_CLIENT_ID=[From Google Cloud Console]
GOOGLE_CLIENT_SECRET=[From Google Cloud Console]
GOOGLE_REFRESH_TOKEN=[From OAuth flow]

# APIs
PERPLEXITY_API_KEY=[Your Perplexity key]
GROQ_API_KEY=[Your Groq key]
ELEVENLABS_API_KEY=[Your ElevenLabs key]
\`\`\`

### 🧪 Verification Steps

After restoration, verify:
- [ ] Agent can read SOUL.md and IDENTITY.md
- [ ] Agent can access memories in /memory/
- [ ] HubSpot Agent can fetch pipeline data
- [ ] Email Agent can process inbox
- [ ] Mission Control dashboard displays data
- [ ] Cron jobs are running on schedule
- [ ] Telegram notifications working

### 📞 Support

If restoration fails:
1. Check manifest.json for component list
2. Verify all files in backup are present
3. Check environment variables are set
4. Review agent logs for errors
`;

    fs.writeFileSync(
      path.join(this.backupPath, 'RESTORATION_GUIDE.md'),
      guide
    );
  }

  async generateHandoffPackage() {
    console.log('📦 Generating handoff package...');
    
    const handoff = {
      version: '1.0.0',
      created: new Date().toISOString(),
      agent: {
        name: 'Kimi Claw',
        type: 'AI Assistant',
        platform: 'OpenClaw',
        workspace: '/root/.openclaw/workspace'
      },
      identity: {
        soul: this.readFile('SOUL.md'),
        identity: this.readFile('IDENTITY.md'),
        user: this.readFile('USER.md'),
        agents: this.readFile('AGENTS.md'),
        tools: this.readFile('TOOLS.md')
      },
      capabilities: {
        agents: [
          {
            id: 'work-agent',
            name: 'Work Agent',
            role: 'Orchestrator',
            repo: 'clawd-hubspot-agent',
            schedule: '8am/12pm/4pm PT'
          },
          {
            id: 'email-agent',
            name: 'Email Agent',
            role: 'Inbox Monitor',
            repo: 'clawd-email-agent',
            schedule: 'Every 5 minutes'
          },
          {
            id: 'hubspot-agent',
            name: 'HubSpot Agent',
            role: 'CRM Data',
            repo: 'clawd-hubspot-agent',
            schedule: 'Every 30 minutes'
          }
        ],
        integrations: [
          'HubSpot CRM',
          'Gmail',
          'Google Calendar',
          'Supabase Database',
          'Telegram',
          'SearXNG Search',
          'Groq Whisper',
          'ElevenLabs TTS'
        ],
        dashboards: [
          {
            name: 'Mission Control',
            repo: 'clawd-mission-control-v2',
            url: 'https://clawd-mission-control-v2.vercel.app',
            tech: 'Next.js 14 + React + Tailwind + Supabase'
          }
        ]
      },
      restoration: {
        prompt: this.generateRestorationPrompt(),
        steps: [
          'Install OpenClaw agent',
          'Copy identity files to workspace',
          'Set environment variables',
          'Deploy Mission Control to Vercel',
          'Configure database in Supabase',
          'Set up cron jobs',
          'Verify all integrations'
        ]
      }
    };

    fs.writeFileSync(
      path.join(this.backupPath, 'handoff.json'),
      JSON.stringify(handoff, null, 2)
    );

    // Also create a copy in handoff directory (latest)
    fs.writeFileSync(
      path.join(HANDOFF_DIR, 'latest-handoff.json'),
      JSON.stringify(handoff, null, 2)
    );
  }

  generateRestorationPrompt() {
    return `You are a restoration agent. Your task is to recreate the complete Clawd AI ecosystem from the provided handoff package.

CONTEXT:
- This is a handoff package for "Kimi Claw", an AI assistant
- The ecosystem includes: 6 agents, Mission Control dashboard, HubSpot CRM integration, Email processing, and more
- Target environment: OpenClaw agent (cloud, docker, or local)

YOUR TASK:
1. Read and internalize SOUL.md, IDENTITY.md, USER.md to understand who you are
2. Read AGENTS.md, TOOLS.md to understand the agent architecture
3. Examine the Mission Control dashboard code (Next.js app)
4. Review agent repositories (email-agent, hubspot-agent, etc.)
5. Set up all required environment variables
6. Deploy Mission Control to Vercel
7. Configure Supabase database with RLS policies
8. Set up cron jobs for agent execution
9. Verify all integrations work

REQUIRED ENVIRONMENT VARIABLES:
- SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY
- HUBSPOT_TOKEN, HUBSPOT_OWNER_ID=728033696
- TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID=8001393940
- GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REFRESH_TOKEN
- PERPLEXITY_API_KEY, GROQ_API_KEY

DEPLOYMENT OPTIONS:
Choose the best deployment path based on available infrastructure:
1. Cloud Agent (OpenClaw hosted) - Easiest, fully managed
2. Docker/VPS - Persistent, custom infrastructure  
3. Local Agent - Development, maximum privacy

SUCCESS CRITERIA:
- Mission Control dashboard shows 6 agents, pipeline data, emails
- HubSpot Agent syncs pipeline every 30 minutes
- Email Agent processes inbox every 5 minutes
- Work Agent sends briefings at 8am/12pm/4pm PT
- Telegram notifications work
- All data persists in Supabase

Begin restoration now.`;
  }

  generateComponentChecklist() {
    const components = this.manifest.components;
    let checklist = '';
    
    if (components.identity) {
      checklist += '- [ ] Identity files (SOUL.md, IDENTITY.md, USER.md)\n';
    }
    if (components.agents?.length) {
      checklist += `- [ ] Agent souls (${components.agents.length} agents)\n`;
    }
    if (components.memories?.length || components.coreMemory) {
      checklist += `- [ ] Memory files (${components.memories?.length || 0} daily + core)\n`;
    }
    if (components.missionControl) {
      checklist += '- [ ] Mission Control dashboard\n';
    }
    if (components.agentRepos?.length) {
      checklist += `- [ ] Agent repositories (${components.agentRepos.length} repos)\n`;
    }
    if (components.database) {
      checklist += '- [ ] Database schema\n';
    }
    if (components.crons) {
      checklist += '- [ ] Cron configurations\n';
    }
    if (components.skills) {
      checklist += '- [ ] Skills\n';
    }
    
    return checklist;
  }

  async createManifest() {
    console.log('📝 Creating manifest...');
    
    fs.writeFileSync(
      path.join(this.backupPath, 'manifest.json'),
      JSON.stringify(this.manifest, null, 2)
    );

    // Also create latest manifest
    fs.writeFileSync(
      path.join(HANDOFF_DIR, 'latest-manifest.json'),
      JSON.stringify(this.manifest, null, 2)
    );
  }

  async createArchive() {
    console.log('🗜️ Creating compressed archive...');
    
    try {
      execSync(`tar -czf ${this.backupPath}.tar.gz -C ${BACKUP_DIR} ${path.basename(this.backupPath)}`, {
        stdio: 'inherit'
      });
      console.log(`✅ Archive created: ${this.backupPath}.tar.gz`);
    } catch (err) {
      console.error('⚠️ Failed to create archive:', err.message);
    }
  }

  copyDirectory(src, dest, exclude = []) {
    if (!fs.existsSync(src)) return;
    
    fs.mkdirSync(dest, { recursive: true });
    const items = fs.readdirSync(src);
    
    items.forEach(item => {
      if (exclude.includes(item)) return;
      
      const srcPath = path.join(src, item);
      const destPath = path.join(dest, item);
      const stat = fs.statSync(srcPath);
      
      if (stat.isDirectory()) {
        this.copyDirectory(srcPath, destPath, exclude);
      } else {
        fs.copyFileSync(srcPath, destPath);
      }
    });
  }

  readFile(filename) {
    const filepath = path.join(WORKSPACE, filename);
    if (fs.existsSync(filepath)) {
      return fs.readFileSync(filepath, 'utf8');
    }
    return null;
  }
}

// Run if called directly
if (require.main === module) {
  const generator = new BackupGenerator();
  generator.generate().catch(err => {
    console.error('❌ Backup failed:', err);
    process.exit(1);
  });
}

module.exports = BackupGenerator;
