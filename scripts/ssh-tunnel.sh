#!/bin/bash
set -euo pipefail

REMOTE_HOST="srv882799.hstgr.cloud"
REMOTE_USER="root"
LOCAL_PORT="14535"
REMOTE_PORT="45350"

exec /usr/bin/ssh \
  -o ServerAliveInterval=30 \
  -o ServerAliveCountMax=3 \
  -o ExitOnForwardFailure=yes \
  -o StrictHostKeyChecking=accept-new \
  -N \
  -L ${LOCAL_PORT}:127.0.0.1:${REMOTE_PORT} \
  ${REMOTE_USER}@${REMOTE_HOST}
