-- Real-time Sync Database Schema
-- Run this in Supabase SQL Editor

-- Calendar Events Table
CREATE TABLE IF NOT EXISTS calendar_events (
    id TEXT PRIMARY KEY,
    summary TEXT NOT NULL,
    start_time TIMESTAMP WITH TIME ZONE,
    end_time TIMESTAMP WITH TIME ZONE,
    attendees TEXT[],
    meet_link TEXT,
    location TEXT,
    description TEXT,
    synced_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- API Tokens Table (for OAuth tokens)
CREATE TABLE IF NOT EXISTS api_tokens (
    service TEXT PRIMARY KEY,
    token TEXT NOT NULL,
    refresh_token TEXT,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Sync Status Table
CREATE TABLE IF NOT EXISTS sync_status (
    id SERIAL PRIMARY KEY,
    service TEXT NOT NULL,
    last_sync_at TIMESTAMP WITH TIME ZONE,
    status TEXT DEFAULT 'idle',
    items_synced INTEGER DEFAULT 0,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on new tables
ALTER TABLE calendar_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE sync_status ENABLE ROW LEVEL SECURITY;

-- RLS Policies for anon read (dashboard)
CREATE POLICY "allow_anon_read_calendar" ON calendar_events
    FOR SELECT TO anon USING (true);

CREATE POLICY "allow_service_write_calendar" ON calendar_events
    FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "allow_service_write_tokens" ON api_tokens
    FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "allow_service_write_sync" ON sync_status
    FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_calendar_events_start ON calendar_events(start_time);
CREATE INDEX IF NOT EXISTS idx_email_categories_received ON email_categories(received_at);
CREATE INDEX IF NOT EXISTS idx_pipeline_cache_stage ON pipeline_cache(stage_name);

-- Function to update synced_at timestamp
CREATE OR REPLACE FUNCTION update_synced_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.synced_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for calendar events
DROP TRIGGER IF EXISTS set_synced_at ON calendar_events;
CREATE TRIGGER set_synced_at
    BEFORE UPDATE ON calendar_events
    FOR EACH ROW
    EXECUTE FUNCTION update_synced_at();

-- Verify setup
SELECT 'Tables created successfully' as status;
