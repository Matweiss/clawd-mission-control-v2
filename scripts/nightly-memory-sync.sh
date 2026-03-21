#!/bin/bash
# Nightly memory sync to Obsidian (runs via cron)
# This script is called by the OpenClaw cron system
#
# IMPORTANT: If your Obsidian vault is on a different machine,
# you must set OBSIDIAN_SSH_HOST and OBSIDIAN_SSH_USER environment variables
# in your crontab or ~/.openclaw/.env file
#
# Example crontab:
# 0 2 * * * OBSIDIAN_SSH_HOST=192.168.1.50 OBSIDIAN_SSH_USER=mat /root/.openclaw/workspace/clawd-mission-control-v2/scripts/nightly-memory-sync.sh

LOG_FILE="/root/.openclaw/workspace/logs/memory-sync.log"
mkdir -p "$(dirname "$LOG_FILE")"

echo "[$(date '+%Y-%m-%d %H:%M:%S')] Starting nightly memory sync..." >> "$LOG_FILE"

# Run the sync
if /root/.openclaw/workspace/clawd-mission-control-v2/scripts/sync-memories-to-obsidian.sh >> "$LOG_FILE" 2>&1; then
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] ✅ Sync completed successfully" >> "$LOG_FILE"
else
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] ❌ Sync failed" >> "$LOG_FILE"
fi

echo "---" >> "$LOG_FILE"
