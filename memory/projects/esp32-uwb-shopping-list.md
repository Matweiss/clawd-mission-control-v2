# ESP32 + UWB Presence Detection Project — Shopping List

## Based on Video Analysis: ESP32S3 + MaUWB Module

---

## Core Components

### 1. Microcontroller
**Option A: ESP32S3 (Recommended from video)**
- More powerful than standard ESP32
- Better for complex positioning calculations
- WiFi + Bluetooth 5.0
- **Price:** ~$8-15 per unit
- **Where to buy:** Amazon, AliExpress, DigiKey, Mouser

**Option B: Standard ESP32 (Your current setup)**
- Can work but less processing power
- May limit number of anchors
- **Price:** ~$4-8 per unit

### 2. UWB Module: MaUWB
- Based on DW1000 chip (Decawave)
- Range: ~30-100m indoors
- Precision: 10-30cm accuracy
- **Price:** ~$15-25 per module
- **Where to buy:** 
  - AliExpress (search "MaUWB" or "DW1000 ESP32")
  - Makerfabs
  - Electronic Clinic store (from video)

### 3. Alternative UWB Options

| Module | Chip | Price | Notes |
|--------|------|-------|-------|
| MaUWB | DW1000 | $15-25 | Video recommendation |
| DWM1000 | DW1000 | $20-30 | Decawave official |
| DWM1001 | DW1001 | $25-35 | Built-in MCU |
| Apple U1 | Apple | N/A | Not available for purchase |
| Qorvo DWM3000 | DW3000 | $30-40 | Newer, better |

---

## Project Architecture Options

### Option 1: Tag + Multiple Anchors (Recommended)
**For precise zone-level tracking:**

| Role | Hardware | Quantity | Purpose |
|------|----------|----------|---------|
| **Anchors** | ESP32 + MaUWB | 4-8+ | Fixed positions around house |
| **Tag** | ESP32 + MaUWB | 1-2 | Wearable or phone attachment |
| **Gateway** | ESP32 or Raspberry Pi | 1 | Central coordinator |

**How it works:**
- Anchors are placed in corners/rooms
- Tag measures distance to each anchor
- Triangulation calculates exact position
- Gateway sends data to Home Assistant

### Option 2: Anchor-Only System (Simpler)
**For presence detection (your current LD2410 approach):**

| Role | Hardware | Quantity | Purpose |
|------|----------|----------|---------|
| **Anchors** | ESP32 + MaUWB | 1 per room | Detect if tag is in range |
| **Tag** | ESP32 + MaUWB | 1 | Simple beacon mode |

---

## Software/Firmware

### 1. Arduino IDE / PlatformIO
- Primary development environment
- Free

### 2. UWB Libraries
- **DW1000 library** (arduino-dw1000)
- **Pozyx Arduino library** (alternative)
- **ESP32 UWB library** (community)

### 3. Positioning Algorithms
- **Trilateration** (3 anchors minimum)
- **Multilateration** (4+ anchors for 3D)
- **Kalman filtering** (smooth movement)
- **Particle filtering** (advanced, noisy environments)

### 4. Home Assistant Integration
- ESPHome (if supported)
- MQTT for custom positioning data
- Custom component for zone mapping

---

## Additional Components

### Power Supplies
| Item | Purpose | Price |
|------|---------|-------|
| USB-C cables | Programming/power | $2-5 each |
| 5V 2A power adapters | Wall power for anchors | $5-8 each |
| Battery packs (optional) | Portable tags | $10-20 |
| LiPo batteries + charger | Battery-powered tags | $15-30 |

### Enclosures
- 3D printed cases (DIY)
- IP65 waterproof boxes (outdoor anchors)
- **Price:** $2-10 per enclosure

### Antennas
- UWB antennas (usually included with module)
- External antennas for better range
- **Price:** $3-8 each

### Debugging Tools
- JTAG debugger (optional)
- Logic analyzer (optional)
- Multimeter

---

## Cost Estimate

### Minimum Setup (1 Tag + 4 Anchors)
| Item | Qty | Unit Price | Total |
|------|-----|------------|-------|
| ESP32S3 | 5 | $10 | $50 |
| MaUWB Module | 5 | $20 | $100 |
| Power supplies | 4 | $6 | $24 |
| Enclosures | 5 | $3 | $15 |
| Cables/misc | - | - | $20 |
| **TOTAL** | | | **~$210** |

### Full House Setup (1 Tag + 8 Anchors)
| Item | Qty | Unit Price | Total |
|------|-----|------------|-------|
| ESP32S3 | 9 | $10 | $90 |
| MaUWB Module | 9 | $20 | $180 |
| Power supplies | 8 | $6 | $48 |
| Enclosures | 9 | $3 | $27 |
| Cables/misc | - | - | $35 |
| **TOTAL** | | | **~$380** |

---

## Where to Buy

### Recommended Suppliers
1. **AliExpress** (cheapest, longer shipping)
   - Search: "MaUWB ESP32", "DW1000 module"
   
2. **Amazon** (faster, more expensive)
   - Search: "ESP32S3 DevKit", "UWB module"
   
3. **DigiKey / Mouser** (professional, fastest)
   - DWM1000 modules
   - ESP32-S3-DevKitC-1

4. **Makerfabs** (specialized)
   - ESP32 UWB boards

5. **Electronic Clinic Store** (from video)
   - May have pre-built kits

---

## Alternative: Pre-built Solutions

### Pozyx Creator Tag + Anchors
- Professional UWB positioning
- Price: ~$500-1000 for kit
- Easier setup, more expensive

### Makerfabs ESP32 UWB
- Pre-integrated ESP32 + UWB
- Price: ~$25-35 per board
- Less wiring, cleaner setup

---

## Next Steps

1. **Watch the video fully** — note specific MaUWB module model
2. **Decide on architecture:**
   - Simple presence (anchor-only)?
   - Precise positioning (tag + anchors)?
3. **Order test kit:**
   - Start with 1 ESP32S3 + 1 MaUWB for testing
   - Add more anchors after validation
4. **Prototype layout:**
   - Map your house
   - Plan anchor placement (corners, central hallway)

---

## Questions to Answer

1. Do you want **precise location** (which room/zone) or just **presence** (home/away)?
2. How many **rooms** need coverage?
3. Will tags be **wearable** (keychain, wristband) or **phone-based**?
4. Do you need **battery-powered** anchors or can they be plugged in?
5. What's your **budget** — prototype (~$200) or full deployment (~$400)?

---

*Research compiled from video analysis and ESP32 UWB project documentation.*
