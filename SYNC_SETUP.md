# Sync Service Setup

## 1. Environment Variables

Add to `.env.local`:

```
# Supabase
SUPABASE_URL=https://nmhbmgtyqutbztdafzjl.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# HubSpot
HUBSPOT_TOKEN=your_hubspot_token_here

# Google OAuth (will be populated by setup)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_REFRESH_TOKEN=will_be_set_after_oauth
```

## 2. Google OAuth Setup

1. Go to https://console.cloud.google.com/apis/credentials
2. Create OAuth 2.0 credentials
3. Enable APIs:
   - Google Calendar API
   - Gmail API
4. Add redirect URI: `http://localhost:3000/auth/google/callback`
5. Download credentials, add to env

## 3. Get Refresh Token

Run once:
```bash
node scripts/get-google-token.js
```

This will:
- Open browser for OAuth consent
- Exchange code for refresh token
- Store in Supabase

## 4. Run Sync Service

```bash
# Start the sync service
node sync-service.js

# Or with PM2 for production
pm2 start sync-service.js --name "clawd-sync"
```

## 5. Verify

Check Supabase tables:
- `calendar_events` - Should have your meetings
- `email_categories` - Should have your emails
- `pipeline_cache` - Should have your HubSpot deals

## Troubleshooting

**No Google token:**
- Run OAuth setup again
- Check `api_tokens` table in Supabase

**HubSpot 401:**
- Token may be expired
- Regenerate at https://app.hubspot.com/private-apps/43832131

**Rate limits:**
- Gmail: 250 quota units/user/second
- Calendar: Default quotas are generous
- HubSpot: 100 requests/10 seconds
