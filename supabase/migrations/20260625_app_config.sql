-- ─────────────────────────────────────────────────────────────────────────────
-- Migration: 20260625_app_config
-- Persistent key-value store for admin settings (maintenance, app info, wilayas)
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.app_config (
  key        TEXT PRIMARY KEY,
  value      JSONB        NOT NULL DEFAULT 'null',
  updated_at TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_by UUID         REFERENCES public.profiles(id)
);

-- Seed defaults
INSERT INTO public.app_config (key, value) VALUES
  ('maintenance',    'false'),
  ('app_name',       '"WinRak"'),
  ('support_email',  '"support@winrak.dz"'),
  ('support_phone',  '"+213 555 000 000"'),
  ('active_wilayas', '["Alger","Oran","Constantine"]')
ON CONFLICT (key) DO NOTHING;

-- RLS: only admins can read/write
ALTER TABLE public.app_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_read_app_config"
  ON public.app_config FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "admin_write_app_config"
  ON public.app_config FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

GRANT SELECT, INSERT, UPDATE ON public.app_config TO authenticated;
GRANT ALL ON public.app_config TO service_role;
