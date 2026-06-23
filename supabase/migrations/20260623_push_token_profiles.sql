-- ════════════════════════════════════════════════════════════════════
--  WinRak — push_token on profiles
--  Run in Supabase SQL Editor.
--  push_token now lives on profiles (common to passengers AND drivers).
--  drivers.push_token is kept in sync by the app for the existing
--  notify-driver edge function, so nothing there breaks.
-- ════════════════════════════════════════════════════════════════════

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS push_token TEXT;
