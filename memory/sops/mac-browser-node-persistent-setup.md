# Mac browser-node persistent setup

Goal: make browser coworking survive restarts and support unattended scheduled pulls.

## Correct architecture

- VPS hosts the primary OpenClaw gateway
- Mac keeps Chrome local
- Mac maintains an SSH local forward to the VPS gateway
- Mac runs `openclaw node run` as the browser-capable node host

## Files created in this repo

- `scripts/ssh-tunnel.sh`
- `scripts/com.openclaw.ssh-tunnel.plist`
- `scripts/run-openclaw-node.sh`
- `scripts/com.openclaw.node-host.plist`

## Recommended install location on Mac

Copy scripts to:
- `/Users/mat/Documents/obsidian-memory/scripts/ssh-tunnel.sh`
- `/Users/mat/Documents/obsidian-memory/scripts/run-openclaw-node.sh`

Copy LaunchAgents to:
- `/Users/mat/Library/LaunchAgents/com.openclaw.ssh-tunnel.plist`
- `/Users/mat/Library/LaunchAgents/com.openclaw.node-host.plist`

Then make scripts executable:

```bash
chmod +x ~/Documents/obsidian-memory/scripts/ssh-tunnel.sh
chmod +x ~/Documents/obsidian-memory/scripts/run-openclaw-node.sh
```

## Load services

```bash
launchctl bootout gui/$UID ~/Library/LaunchAgents/com.openclaw.ssh-tunnel.plist 2>/dev/null || true
launchctl bootout gui/$UID ~/Library/LaunchAgents/com.openclaw.node-host.plist 2>/dev/null || true

launchctl bootstrap gui/$UID ~/Library/LaunchAgents/com.openclaw.ssh-tunnel.plist
launchctl bootstrap gui/$UID ~/Library/LaunchAgents/com.openclaw.node-host.plist
```

## Verify

### Tunnel
```bash
nc -vz 127.0.0.1 14535
```
Expected: succeeded/open

### Node host
```bash
tail -n 50 /tmp/openclaw-node-host.log
```

### VPS sees node
On VPS:
```bash
openclaw nodes status
```
Expected:
- Known: 1
- Paired: 1
- Connected: 1
- Caps include browser/system

## Notes

- The node host uses `OPENCLAW_GATEWAY_TOKEN="mat-relay-2026"`
- It connects through the SSH tunnel on `127.0.0.1:14535`
- This is the correct replacement for the earlier failed attempts to run the Mac gateway itself in remote mode
- For true unattended schedule execution, these LaunchAgents should remain loaded after login
