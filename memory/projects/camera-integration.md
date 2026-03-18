---
type: project
created: 2026-03-18 04:36 PT
updated: 2026-03-18 04:36 PT
tags: [smart-home, cameras, aqara, eufy, reolink, home-assistant, vision]
status: planned
priority: medium
---

# Camera Integration Project

## Overview
Integrate all security cameras into Home Assistant and enable OpenClaw vision capabilities for house monitoring.

## Hardware Inventory
| Camera | Model | Location | Status |
|--------|-------|----------|--------|
| Aqara | *(TBD)* | *(TBD)* | Needs HA integration |
| Eufy | *(TBD)* | *(TBD)* | Needs HA integration |
| Reolink | *(TBD)* | *(TBD)* | Needs HA integration |

## Goals
1. **Home Assistant Integration**
   - All cameras visible in HA dashboard
   - Live feeds accessible
   - Motion detection events

2. **OpenClaw Vision Access**
   - I can view camera feeds on request
   - Automated monitoring (e.g., "check if Sarah is home")
   - Security alerts and notifications

3. **Use Cases**
   - "Show me the front door camera"
   - "Is anyone in the living room?"
   - Security monitoring while traveling (Arizona/NYC trips)
   - Check on pets (Theo)

## Integration Options

### Option 1: Home Assistant Camera Entities
- Cameras added to HA via native integrations
- OpenClaw uses HA API to fetch snapshots/video
- Pros: Unified interface, motion events, recording

### Option 2: Direct Camera Access
- OpenClaw connects directly to camera streams
- Pros: Lower latency, works even if HA is down
- Cons: More complex auth, bypasses HA recording

### Option 3: Hybrid
- HA for primary viewing/recording
- Direct access for OpenClaw vision tasks
- Best of both worlds

## Technical Requirements

### For OpenClaw Vision
- Snapshot endpoint (JPEG stills)
- OR RTSP stream access for live view
- Network connectivity from VPS to cameras

### For Home Assistant
- Camera integrations per brand:
  - **Aqara:** HomeKit Controller or Aqara integration
  - **Eufy:** Eufy Security integration (custom component)
  - **Reolink:** Reolink IP Camera integration (official)

## Security Considerations
- Camera feeds are sensitive — local network only
- VPN or Tailscale for remote access
- Consider privacy zones (blur sensitive areas)
- Motion detection only, not continuous recording

## Next Steps
- [ ] Mat provides camera models and current locations
- [ ] Audit current HA camera integrations
- [ ] Test each camera brand's HA integration
- [ ] Configure network access for OpenClaw VPS
- [ ] Test vision capabilities with snapshots
- [ ] Document camera entities for voice commands

## Future Automations
- Person detection (Sarah home/away confirmation)
- Pet monitoring (Theo activity)
- Package delivery alerts
- Security alerts for unexpected motion
- "Lock it down" includes camera snapshot to Telegram
