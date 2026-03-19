# mac browser-node persistent setup

Goal: make browser coworking survive restarts and scheduled runs without manual terminal juggling.

## Required services

### 1) SSH tunnel LaunchAgent
Keep an SSH local forward from Mac → VPS:

- Local port: `14535`
- Remote target: `127.0.0.1:45350` on VPS

Command:
```bash
ssh -N -L 14535:127.0.0.1:45350 root@srv882799.hstgr.cloud
```

### 2) OpenClaw node host LaunchAgent
Run the Mac as a browser-capable node host:

```bash
export OPENCLAW_GATEWAY_TOKEN="mat-relay-2026"
openclaw node run --host 127.0.0.1 --port 14535 --display-name "Mat's MacBook Pro"
```

## Health checks

On Mac:
```bash
nc -vz 127.0.0.1 14535
```

On VPS:
```bash
openclaw nodes status
```
Expected:
- Connected: 1
- Caps include browser

## Why this is the permanent fix
- avoids invalid/insecure public ws remote config
- avoids misusing `openclaw gateway` as the node layer
- gives scheduled jobs a stable browser-capable remote host
