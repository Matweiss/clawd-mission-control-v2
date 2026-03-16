---
type: context
created: 2026-03-16 01:15 PT
updated: 2026-03-16 01:15 PT
tags: [stack, tools, infrastructure]
status: active
---

# Tech Stack & Tools

## Infrastructure
- **VPS:** Hostinger (`srv882799.hstgr.cloud`) — runs OpenClaw, sync services, cron jobs
- **Dashboard:** Next.js 14 + React 18 + TypeScript on Vercel
- **Database:** Supabase (project: nmhbmgtyqutbztdafzjl) — realtime subscriptions
- **Repo:** github.com/Matweiss/clawd-mission-control-v2
- **Domain:** thematweiss.com (Cloudflare), clawd-dashboard-eight.vercel.app

## AI / LLM Models (Current)
- **Primary:** `kimi-coding/k2p5` (Kimi K2.5 Coding)
- **Fallbacks:** `kimi-coding/kimi-k2-thinking-turbo`, OpenAI Codex models
- **OpenRouter:** DeepSeek R1, GPT-4o, Claude 3.5 Sonnet, Hunter Alpha, Healer Alpha
- **NVIDIA:** z.ai GLM 5

## CRM & Sales
- **Google Sheets:** Primary CRM (replaced HubSpot March 2026)
- **Avoma:** Meeting intelligence and notes

## Communication
- **Gmail:** mat@craftable.com (transitioning), mat.weiss@att.net
- **Telegram:** Primary channel for all proactive agent messages
- **Google Calendar:** Scheduling and event management

## Smart Home (HA)
- **Home Assistant:** Raspberry Pi + Nabu Casa Cloud
- **Key entities:**
  - `button.theo_s_food_feed` — Feed Theo
  - `automation.lock_it_down` — Lock doors + turn off lights
  - `device_tracker.sarah_s_iphone2` — Sarah location
  - `sensor.sarah_s_iphone2_geocoded_location` — Sarah exact location

## Automation
- **n8n:** Webhook-based workflow automation (hosted on VPS)
- **Cron jobs:** Python scripts on VPS for scheduled tasks
- **Google Sheets:** Task queue for agent system

## Voice
- **TTS:** Grok ✅, ElevenLabs ✅
- **STT:** Groq Whisper ✅

## Sarah's Business Stack
- **Shopify:** E-commerce for Sarah J. Schwartz Fine Art
- **Instagram:** Marketing channel
- **Google Sheets:** BI dashboard
- **n8n + GraphQL:** Shopify order sync

## Credentials
> ⚠️ NEVER store actual secrets in memory files.
> All credentials are in environment variables on Vercel and .env files on VPS.
