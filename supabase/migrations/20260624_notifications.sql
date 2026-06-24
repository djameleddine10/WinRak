-- ═══════════════════════════════════════════════════════════════════════════
--  WinRak — Notifications (real push-backed table)
--  100% idempotent.
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.notifications (
  id         UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id    UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type       TEXT        NOT NULL DEFAULT 'info', -- ride_completed | promo | sos_resolved | info | driver_arrived
  title      TEXT        NOT NULL,
  body       TEXT,
  read       BOOLEAN     NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── RLS ─────────────────────────────────────────────────────────────────────
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS notif_own_read   ON public.notifications;
DROP POLICY IF EXISTS notif_own_update ON public.notifications;

CREATE POLICY notif_own_read   ON public.notifications FOR SELECT USING (user_id = auth.uid());
CREATE POLICY notif_own_update ON public.notifications FOR UPDATE USING (user_id = auth.uid());

-- ─── Realtime ─────────────────────────────────────────────────────────────────
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
EXCEPTION WHEN others THEN NULL; END $$;

-- ─── RPC: mark all notifications as read ─────────────────────────────────────
CREATE OR REPLACE FUNCTION public.mark_all_notifications_read(p_user_id UUID)
RETURNS VOID LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  UPDATE public.notifications SET read = true
  WHERE user_id = p_user_id AND read = false;
$$;

-- ─── RPC: insert push notification (called from Edge Function / trigger) ──────
CREATE OR REPLACE FUNCTION public.push_notification(
  p_user_id UUID,
  p_type    TEXT,
  p_title   TEXT,
  p_body    TEXT DEFAULT NULL
) RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_id UUID;
BEGIN
  INSERT INTO public.notifications (user_id, type, title, body)
  VALUES (p_user_id, p_type, p_title, p_body)
  RETURNING id INTO v_id;
  RETURN v_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.mark_all_notifications_read(UUID) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.push_notification(UUID, TEXT, TEXT, TEXT)   TO anon, authenticated;
