# Apple Health Integration Setup
## iPhone Shortcuts Automation

This guide sets up automatic health data syncing from your iPhone/Apple Watch to Mission Control.

---

## What Gets Tracked

✅ **Sleep** (duration, quality, bedtime/waketime)
✅ **Heart Rate Variability (HRV)** - Stress indicator
✅ **Resting Heart Rate**
✅ **Activity** (Steps, Exercise, Stand hours)
✅ **Mindful Minutes** (Breathe app, meditation)
✅ **Screen Time** (Daily total, pickups)

---

## Setup (5 minutes)

### Step 1: Get Your Webhook URL

Your personal webhook endpoint:
```
https://clawd-mission-control-v2.vercel.app/api/health/webhook
```

Your secret key (save this):
```
hc_7f8a9b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0
```

---

### Step 2: Create Sleep Shortcut

**Open Shortcuts app → + Create Shortcut**

**Name:** `Log Sleep to CLAWD`

**Actions:**

1. **Find Health Samples**
   - Category: Sleep
   - Get: 1 sample
   - From: Yesterday

2. **Get Details of Health Sample**
   - Get: Duration
   - From: Health Sample

3. **Get Numbers from Input**
   - (This extracts the hours)

4. **Calculate**
   - Operation: Round
   - Number: [the duration]

5. **Get My Shortcuts**
   - (Skip this, next action:)

6. **Get Contents of URL**
   - URL: `https://clawd-mission-control-v2.vercel.app/api/health/webhook`
   - Method: POST
   - Headers:
     - `x-health-secret`: `hc_7f8a9b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0`
     - `Content-Type`: `application/json`
   - Request Body: JSON
   ```json
   {
     "type": "sleep",
     "value": [Duration in hours],
     "unit": "hours",
     "timestamp": "[Current Date]",
     "source": "apple_health"
   }
   ```

---

### Step 3: Automate the Shortcut

**In Shortcuts app → Automation tab**

1. Tap **+ Create Personal Automation**
2. Select **Sleep** → **Wakes Up**
3. Tap **Next**
4. Add Action: **Run Shortcut** → Select `Log Sleep to CLAWD`
5. Tap **Next** → Turn OFF **Ask Before Running**
6. Tap **Done**

**Result:** Every morning when you wake up, sleep data automatically syncs.

---

### Step 4: Create HRV Shortcut (Optional but recommended)

**New Shortcut:** `Log HRV to CLAWD`

**Actions:**

1. **Find Health Samples**
   - Category: Heart Rate Variability
   - Get: 1 sample
   - From: Today

2. **Get Details**
   - Get: Value

3. **Get Contents of URL** (same as above)
   - JSON body:
   ```json
   {
     "type": "hrv",
     "value": [HRV value],
     "unit": "ms",
     "timestamp": "[Current Date]"
   }
   ```

**Automation:**
- Trigger: **Time of Day** → 11:00 AM daily
- Action: Run `Log HRV to CLAWD`

---

### Step 5: Screen Time Shortcut

**New Shortcut:** `Log Screen Time to CLAWD`

This one is trickier - Apple doesn't expose screen time to Shortcuts directly. 

**Alternative:** Use **Screen Time API** through a third-party app:
- Download **"Health Auto Export"** app
- Or manually log at 6 PM via Shortcut that asks you

**Manual version:**
1. **Ask for Input** (Number)
   - Question: "Hours of screen time today?"
2. **Get Contents of URL**
   - JSON:
   ```json
   {
     "type": "screen_time",
     "value": [Input],
     "unit": "hours"
   }
   ```

---

## Testing

1. Run the Sleep shortcut manually first
2. Check Telegram - you should get a confirmation
3. Check dashboard - health data appears in Lifestyle Agent panel

---

## Troubleshooting

**"Shortcut failed"**
- Check internet connection
- Verify webhook URL is correct
- Check secret key is copied exactly

**Data not showing**
- Check Shortcuts app → Automation tab → Ensure automations are ON
- Check iPhone Settings → Privacy & Security → Health → Shortcuts → Allow

**Duplicate entries**
- Add a "Wait 1 second" action before the URL call
- Or: Check if already logged today (advanced)

---

## Privacy

- Your health data is encrypted in transit (HTTPS)
- Stored securely in your private Supabase database
- Only accessible to your Lifestyle Agent
- You can delete anytime via dashboard

---

## Advanced: Real-time Sync

For HRV/stress spike detection in real-time:

1. **Auto Export** app (paid, $5/year)
2. Set up webhook to same endpoint
3. Data syncs every 15 minutes instead of daily

---

**Questions?** The Lifestyle Agent will monitor your patterns and adapt its check-ins based on your actual data. 🧘
