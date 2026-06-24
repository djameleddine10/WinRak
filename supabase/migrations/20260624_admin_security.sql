-- ═══════════════════════════════════════════════════════════════════════════
--  WinRak — Sécurité Admin : journal des événements réels
--  Run AFTER all previous migrations. 100% idempotent.
--
--  Tables :
--    admin_events   — chaque login/logout/action depuis le dashboard
--
--  RPCs (SECURITY DEFINER) :
--    dash_log_event(type, icon, title, detail, ip)  — écriture
--    dash_security_events(limit)                    — lecture
-- ═══════════════════════════════════════════════════════════════════════════

-- ─── Table ────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.admin_events (
  id          BIGSERIAL    PRIMARY KEY,
  event_type  TEXT         NOT NULL CHECK (event_type IN ('ok','warn','err','info')),
  icon        TEXT         NOT NULL DEFAULT 'fa-circle-info',
  title       TEXT         NOT NULL,
  detail      TEXT,
  ip_address  TEXT,
  user_agent  TEXT,
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT now()
);

-- Index pour tri rapide par date
CREATE INDEX IF NOT EXISTS admin_events_created_idx ON public.admin_events (created_at DESC);

-- ─── RPC : écrire un événement ────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.dash_log_event(
  p_type       TEXT,
  p_icon       TEXT,
  p_title      TEXT,
  p_detail     TEXT    DEFAULT NULL,
  p_ip         TEXT    DEFAULT NULL,
  p_user_agent TEXT    DEFAULT NULL
) RETURNS BIGINT
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_id BIGINT;
BEGIN
  INSERT INTO public.admin_events (event_type, icon, title, detail, ip_address, user_agent)
  VALUES (p_type, p_icon, p_title, p_detail, p_ip, p_user_agent)
  RETURNING id INTO v_id;
  RETURN v_id;
END;
$$;

-- ─── RPC : lire les derniers événements ───────────────────────────────────────

CREATE OR REPLACE FUNCTION public.dash_security_events(p_limit INTEGER DEFAULT 50)
RETURNS TABLE (
  id         BIGINT,
  event_type TEXT,
  icon       TEXT,
  title      TEXT,
  detail     TEXT,
  ip_address TEXT,
  created_at TIMESTAMPTZ
)
LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  SELECT id, event_type, icon, title, detail, ip_address, created_at
  FROM public.admin_events
  ORDER BY created_at DESC
  LIMIT p_limit;
$$;

-- ─── RLS : table privée (aucun accès direct RLS — tout passe par SECURITY DEFINER) ──

ALTER TABLE public.admin_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS admin_events_deny ON public.admin_events;
CREATE POLICY admin_events_deny ON public.admin_events
  FOR ALL USING (false);   -- aucune lecture/écriture directe

-- ─── Grants ───────────────────────────────────────────────────────────────────

GRANT EXECUTE ON FUNCTION public.dash_log_event(TEXT,TEXT,TEXT,TEXT,TEXT,TEXT)  TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.dash_security_events(INTEGER)                  TO anon, authenticated;
