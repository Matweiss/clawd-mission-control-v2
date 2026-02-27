# Clawd Mission Control v2

A dark cyberpunk-themed dashboard for monitoring AI agents, email, and sales pipeline in real-time.

## 🎨 Design

- **Theme:** Dark cyberpunk with neon accents
- **Colors:**
  - Orange `#F97316` (Work Agent)
  - Blue `#3B82F6` (Build Agent)
  - Green `#10B981` (Research Agent)
  - Purple `#8B5CF6` (Lifestyle Agent)
  - Pink `#EC4899` (Email Agent)
  - Cyan `#06B6D4` (HubSpot Agent)
- **Style:** Glassmorphism cards with glowing borders
- **Responsive:** 3-column desktop, 2-column tablet, single column mobile

## 🚀 Features

### 6 Agent Cards (Real-time)
- 🤖 Work Agent — Orchestrator
- 🔧 Build Agent — Engineering
- 🔍 Research Agent — Intelligence
- 🧘 Lifestyle Agent — Wellness
- 📧 Email Agent — Inbox Monitor
- 📊 HubSpot Agent — CRM Data

### Email Intelligence Panel
- 🔴 URGENT emails from active deals
- 🟡 REPLY NEEDED queue
- 🟢 FYI (informational)
- ⚪ JUNK (auto-archived)

### Sales Pipeline Command
- $260K pipeline overview
- Weighted forecasts by stage
- Deals closing this week
- Stale deal alerts

### System Monitoring
- API health grid (HubSpot, Gmail, Calendar, etc.)
- Real-time activity feed
- Cron job timeline

## 🛠️ Tech Stack

- Next.js 14
- React 18
- TypeScript
- Tailwind CSS
- Supabase (real-time subscriptions)
- Lucide React icons

## 📦 Installation

```bash
cd /root/.openclaw/workspace/clawd-mission-control-v2
npm install
```

## 🔧 Environment Variables

Create `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://nmhbmgtyqutbztdafzjl.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## 🗄️ Database Setup

1. Run `security-fix.sql` in Supabase to fix RLS policies
2. Ensure all tables have data:
   - `agent_status` — 6 agents
   - `email_categories` — Processed emails
   - `pipeline_cache` — HubSpot deals
   - `stale_deals` — Flagged deals
   - `clawd_logs` — Activity feed

## 🏃 Development

```bash
npm run dev
# Open http://localhost:3000
```

## 🚀 Production Deploy

```bash
npm run build
# Deploy to Vercel or your preferred host
```

## 🎨 Customization

Edit `tailwind.config.js` to change:
- Color schemes
- Animations
- Fonts

## 🔒 Security

All tables use Row Level Security (RLS):
- Authenticated users can read
- Service role can read/write (for agents)

## 📱 Responsive Breakpoints

- Desktop: 3-column grid (≥1024px)
- Tablet: 2-column grid (768px-1023px)
- Mobile: Single column (<768px)

## 🤖 Agent Integration

The dashboard receives real-time updates from:
- Email Agent (every 5 min)
- HubSpot Agent (every 30 min)
- Work Agent (8am/12pm/4pm)

Via Supabase realtime subscriptions.

---

*Built with ❤️‍🔥 by Kimi Claw*
