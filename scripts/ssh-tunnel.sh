#!/bin/bash
# SSH Tunnel for OpenClaw Browser Coworking

VPS_HOST="root@srv882799.hstgr.cloud"
LOCAL_PORT=18800
REMOTE_PORT=18800

# Check if tunnel already exists
if lsof -Pi :$LOCAL_PORT -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo "Tunnel already running on port $LOCAL_PORT"
    exit 0
fi

# Establish reverse tunnel
exec ssh -N \
    -R ${REMOTE_PORT}:127.0.0.1:${LOCAL_PORT} \
    -o ServerAliveInterval=60 \
    -o ServerAliveCountMax=3 \
    -o ExitOnForwardFailure=yes \
    -o StrictHostKeyChecking=no \
    $VPS_HOST
