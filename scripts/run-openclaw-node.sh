#!/bin/bash
set -euo pipefail

export PATH="/opt/homebrew/bin:/opt/homebrew/sbin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin"
export OPENCLAW_GATEWAY_TOKEN="mat-relay-2026"

exec /opt/homebrew/bin/openclaw node run \
  --host 127.0.0.1 \
  --port 14535 \
  --display-name "Mat's MacBook Pro"
