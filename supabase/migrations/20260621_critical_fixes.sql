-- ============================================================
-- WinRak — Critical Fixes Migration
-- Run this in Supabase SQL Editor before deploying the app.
-- ============================================================

-- Fix 2: Real driver data — add push_token column for Fix 5 as well
ALTER TABLE drivers
  ADD COLUMN IF NOT EXISTS push_token TEXT;

-- Fix 4: Doc types already added in previous session —
-- keep these idempotent so re-running is safe.
ALTER TYPE doc_type ADD VALUE IF NOT EXISTS 'national_id';
ALTER TYPE doc_type ADD VALUE IF NOT EXISTS 'insurance';
ALTER TYPE doc_type ADD VALUE IF NOT EXISTS 'technical_visit';

-- Fix 5: Edge Function setup instructions
-- After running this migration:
-- 1. Deploy the Edge Function:
--      supabase functions deploy notify-driver
-- 2. Create a Database Webhook in Supabase Dashboard:
--      Database → Webhooks → Create webhook
--      Name:    notify-driver
--      Table:   trip_offers
--      Event:   INSERT
--      URL:     https://<your-project-ref>.supabase.co/functions/v1/notify-driver
--      Headers: { "Authorization": "Bearer <your-anon-key>" }
