-- ═══════════════════════════════════════════════════════════════════════════
--  WinRak — Admin broadcast notifications log
--  Run AFTER 20260624_admin.sql (requires is_admin()).
--  100% idempotent.
--
--  admin_notifications: one row per broadcast sent from the admin panel.
--  The Edge Function notify-broadcast writes here after each send.
--  Notifications.tsx reads from this table for the history panel.
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.admin_notifications (
  id         UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  target     TEXT        NOT NULL,          -- 'all' | 'drivers' | 'passengers'
  title      TEXT        NOT NULL,
  body       TEXT        NOT NULL,
  data       JSONB,
  sent_count INTEGER     NOT NULL DEFAULT 0,
  status     TEXT        NOT NULL DEFAULT 'sent', -- 'sent' | 'partial' | 'no_tokens'
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.admin_notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS admin_notifications_admin ON public.admin_notifications;
CREATE POLICY admin_notifications_admin ON public.admin_notifications
  FOR ALL USING (public.is_admin());

GRANT ALL ON public.admin_notifications TO authenticated;
