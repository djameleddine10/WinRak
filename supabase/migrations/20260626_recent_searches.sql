-- ════════════════════════════════════════════════════════════════════
--  WinRak — recent_searches JSONB on profiles
--  Stocke les 10 dernières recherches du passager côté Supabase.
--  Array de max 10 objets { id, name, address, lat, lng, type? }
-- ════════════════════════════════════════════════════════════════════

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS recent_searches JSONB DEFAULT '[]'::jsonb;

COMMENT ON COLUMN public.profiles.recent_searches IS
  'Dernières destinations recherchées (max 10). Array JSON de { id, name, address, lat, lng }.';
