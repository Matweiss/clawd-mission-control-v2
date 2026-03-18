---
type: sop
created: 2026-03-18 17:56 UTC
updated: 2026-03-18 17:56 UTC
tags: [sop, authentication, login, corepower, regal, browser-coworking]
---

# SOP: Account Authentication via Browser Coworking

## Overview
Standard procedure for logging into CorePower Yoga and Regal accounts using live browser coworking session.

## Prerequisites
- SSH tunnel active (Mac → VPS port 18800)
- Chrome running with remote debugging on Mac
- Chrome DevTools MCP connected

## Credentials
| Service | Email | Status |
|---------|-------|--------|
| CorePower Yoga | mat.weiss@att.net | Saved in browser |
| Regal | mat.weiss@att.net | Saved in browser |

## Part 1: CorePower Yoga Login

### Step 1: Navigate to homepage
```bash
mcporter call chrome-devtools.navigate_page url="https://www.corepoweryoga.com/"
```

### Step 2: Verify login status
Look for:
- "Hello, Mat" greeting
- "MW" initials in header
- "Your Upcoming Classes" section

### Step 3: If not logged in
1. Look for "Sign In" or "Login" button in header
2. Click it
3. Wait for login form
4. Credentials should auto-fill (mat.weiss@att.net + saved password)
5. Click submit
6. Verify: Check for "Hello, Mat" on homepage

## Part 2: Regal Login

### Step 1: Navigate to theater page
```bash
mcporter call chrome-devtools.navigate_page url="https://www.regmovies.com/theatres/regal-sherman-oaks-galleria-1483"
```

### Step 2: Check login status
**Logged OUT indicators:**
- Button: "Login" or "Sign In"
- No account menu

**Logged IN indicators:**
- Button: "account" (with user icon)
- Clicking shows: "My Account", "Edit Account", "Logout"

### Step 3: Login if needed
If showing "Login" button:

1. **Click Login button**
   ```bash
   mcporter call chrome-devtools.click uid="LOGIN_BUTTON_UID"
   ```

2. **Navigate to login page (if modal doesn't open)**
   ```bash
   mcporter call chrome-devtools.navigate_page url="https://www.regmovies.com/login"
   ```

3. **Verify credentials are filled**
   - Email field: `mat.weiss@att.net` ✅
   - Password field: `•••••••••` ✅

4. **Click Log In button**
   ```bash
   mcporter call chrome-devtools.click uid="LOG_IN_BUTTON_UID"
   ```

5. **Verify success**
   - Navigate back to theater page
   - Check for "account" button (not "Login")
   - Click account → should see "My Account", "Edit Account", "Logout"

## Quick Verification Commands

### Check CorePower login
```bash
mcporter call chrome-devtools.navigate_page url="https://www.corepoweryoga.com/"
sleep 2
mcporter call chrome-devtools.take_snapshot | grep -i "hello, mat"
```

### Check Regal login
```bash
mcporter call chrome-devtools.navigate_page url="https://www.regmovies.com/theatres/regal-sherman-oaks-galleria-1483"
sleep 2
mcporter call chrome-devtools.click uid="ACCOUNT_BUTTON_UID"
mcporter call chrome-devtools.take_snapshot | grep -i "logout"
```

## Troubleshooting

### Credentials not auto-filling
- Check Chrome password manager has saved credentials
- May need to manually enter once and save

### Login button not found
- Page structure may have changed
- Take snapshot to find new button UID
- Update this SOP with new selectors

### Session expires
- Regal: May require re-login every 30 days
- CorePower: Stays logged in longer
- Re-run this SOP when needed

## Automation Notes
For cron jobs, session should persist if Chrome stays running.
If session expires during automated run:
1. Log error
2. Notify Mat via Telegram
3. Manual re-login required
