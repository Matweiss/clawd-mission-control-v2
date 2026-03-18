---
type: project
created: 2026-03-18 04:33 PT
updated: 2026-03-18 04:33 PT
tags: [smart-home, esp32, presence-detection, ld2410, triangulation, iot]
status: planned
priority: medium
---

# ESP32 Presence Detection Optimization

## Overview
Optimize existing ESP32 + LD2410 presence detection system using triangulation/multilateration techniques for improved accuracy and zone-level precision.

## Current State
- **Hardware:** 9× ESP32 + LD2410 radar sensors deployed
- **Coverage:** Full house coverage
- **Integration:** Home Assistant
- **Issue:** Feels unoptimized — potential gaps/overlap issues

## Goal
Move from room-level presence to **zone-level precision** (e.g., "kitchen island" vs "kitchen sink") using triangulation between multiple sensors.

## Key Resources
- **Triangulation Video:** https://youtu.be/Lj3wN7UPukg
- **RuView Reference:** https://github.com/ruvnet/RuView (WiFi CSI mesh sensing)
- **Current Hardware Cost:** ~$72 (9× $8 ESP32s)

## Technical Approach

### Phase 1: Assessment
- [ ] Receive floor plan + current sensor placement from Mat
- [ ] Map coverage zones and identify overlaps/gaps
- [ ] Document problem areas (false positives, dead zones, latency)

### Phase 2: Triangulation Design
- [ ] Group sensors into zone clusters (3-4 per area)
- [ ] Design multilateration algorithm
- [ ] Signal strength weighting strategy
- [ ] Cross-room handoff logic

### Phase 3: Implementation
- [ ] Reposition sensors for optimal overlap
- [ ] Update ESP32 firmware for coordinated sensing
- [ ] Deploy triangulation logic to Home Assistant
- [ ] Test in single room first

### Phase 4: Optimization
- [ ] Fine-tune detection zones
- [ ] Reduce false positives
- [ ] Enable predictive automations

## Success Metrics
| Metric | Current | Target |
|--------|---------|--------|
| Location precision | Room-level | Zone-level (2-3m) |
| Detection latency | <2s | <500ms |
| False positives | Unknown | <5% |
| Coverage confidence | 85% | 95%+ |

## Future Automations Enabled
- Room-level HVAC control
- Predictive lighting (anticipate movement)
- Advanced occupancy-based energy savings
- Fall detection for elderly care

## Blockers
- [ ] Waiting for floor plan and sensor placement map from Mat

## Next Action
Mat to send:
1. Floor plan with measurements
2. Current ESP32/LD2410 locations (9 units)
3. Problem areas list
