-- ═══════════════════════════════════════════════════════════════════
--  WinRak — Système de répartition (dispatch) des courses
--  À exécuter dans Supabase SQL Editor APRÈS schema.sql + rls.sql.
--  100% idempotent ET réconciliateur : ré-exécutable sans danger, et
--  remplace proprement toute version partielle d'une session antérieure.
--
--  Relie passager ↔ chauffeur :
--   1. table trip_offers   — une offre = une course proposée à UN chauffeur
--   2. find_next_driver()  — chauffeur en ligne le plus proche, non déjà sollicité
--   3. create_trip_offer() — insère l'offre pour ce chauffeur
--   4. trigger INSERT trip — crée automatiquement la 1ʳᵉ offre
--   5. advance_trip_offer()— refus/expiration → passe au chauffeur suivant (RPC)
--   6. trigger accept      — fige l'offre acceptée, expire les autres
--   7. get_trip_driver_info() — infos chauffeur pour le passager (RPC)
--   8. RLS + Realtime
-- ═══════════════════════════════════════════════════════════════════

-- ─── 1. TABLE TRIP_OFFERS (+ réconciliation des colonnes) ────────────
CREATE TABLE IF NOT EXISTS public.trip_offers (
  id           UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
  trip_id      UUID         NOT NULL REFERENCES public.trips(id)   ON DELETE CASCADE,
  driver_id    UUID         NOT NULL REFERENCES public.drivers(id) ON DELETE CASCADE,
  offer_rank   INTEGER      NOT NULL DEFAULT 1,
  distance_m   INTEGER,
  status       TEXT         NOT NULL DEFAULT 'pending',
  created_at   TIMESTAMPTZ  DEFAULT NOW(),
  responded_at TIMESTAMPTZ
);

-- Si une table trip_offers d'une version antérieure existe avec des colonnes
-- différentes, on ajoute celles qui manquent (sans toucher aux existantes).
ALTER TABLE public.trip_offers ADD COLUMN IF NOT EXISTS offer_rank   INTEGER NOT NULL DEFAULT 1;
ALTER TABLE public.trip_offers ADD COLUMN IF NOT EXISTS distance_m   INTEGER;
ALTER TABLE public.trip_offers ADD COLUMN IF NOT EXISTS status       TEXT NOT NULL DEFAULT 'pending';
ALTER TABLE public.trip_offers ADD COLUMN IF NOT EXISTS created_at   TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE public.trip_offers ADD COLUMN IF NOT EXISTS responded_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS trip_offers_driver_idx ON public.trip_offers(driver_id, status);
CREATE INDEX IF NOT EXISTS trip_offers_trip_idx   ON public.trip_offers(trip_id);

-- ─── 2. NETTOYAGE : supprimer toute version antérieure des fonctions ─
-- (toutes signatures confondues) pour éviter l'erreur "cannot change
-- return type". CASCADE retire aussi leurs triggers — recréés plus bas.
DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN
    SELECT oid::regprocedure AS sig
    FROM pg_proc
    WHERE pronamespace = 'public'::regnamespace
      AND proname IN (
        'haversine_m','find_next_driver','create_trip_offer',
        'advance_trip_offer','get_trip_driver_info',
        'on_trip_created','on_trip_accepted'
      )
  LOOP
    EXECUTE 'DROP FUNCTION IF EXISTS ' || r.sig || ' CASCADE';
  END LOOP;
END $$;

-- ─── 3. DISTANCE HAVERSINE (mètres) ──────────────────────────────────
CREATE FUNCTION public.haversine_m(
  lat1 DOUBLE PRECISION, lng1 DOUBLE PRECISION,
  lat2 DOUBLE PRECISION, lng2 DOUBLE PRECISION
) RETURNS DOUBLE PRECISION LANGUAGE sql IMMUTABLE AS $$
  SELECT 6371000 * 2 * asin(sqrt(
    power(sin(radians(lat2 - lat1) / 2), 2) +
    cos(radians(lat1)) * cos(radians(lat2)) * power(sin(radians(lng2 - lng1) / 2), 2)
  ));
$$;

-- ─── 4. CHAUFFEUR DISPONIBLE LE PLUS PROCHE (non déjà sollicité) ──────
CREATE FUNCTION public.find_next_driver(p_trip_id UUID)
RETURNS TABLE(driver_id UUID, distance_m INTEGER)
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_trip public.trips;
BEGIN
  SELECT * INTO v_trip FROM public.trips WHERE id = p_trip_id;
  IF v_trip.id IS NULL THEN RETURN; END IF;

  RETURN QUERY
  SELECT
    d.id,
    public.haversine_m(
      v_trip.from_lat, v_trip.from_lng,
      COALESCE(dl.lat, d.current_lat), COALESCE(dl.lng, d.current_lng)
    )::INTEGER AS dist
  FROM public.drivers d
  LEFT JOIN public.driver_locations dl ON dl.driver_id = d.id
  WHERE d.status = 'online'
    AND d.is_verified = TRUE
    AND (v_trip.vehicle_type IS NULL OR d.vehicle_type = v_trip.vehicle_type)
    AND COALESCE(dl.lat, d.current_lat) IS NOT NULL
    AND NOT EXISTS (
      SELECT 1 FROM public.trip_offers o
      WHERE o.trip_id = p_trip_id AND o.driver_id = d.id
    )
  ORDER BY dist ASC
  LIMIT 1;
END;
$$;

-- ─── 5. CRÉER UNE OFFRE POUR LE PROCHAIN CHAUFFEUR ───────────────────
CREATE FUNCTION public.create_trip_offer(p_trip_id UUID, p_rank INTEGER DEFAULT 1)
RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_driver UUID;
  v_dist   INTEGER;
  v_offer  UUID;
BEGIN
  SELECT driver_id, distance_m INTO v_driver, v_dist
    FROM public.find_next_driver(p_trip_id);

  IF v_driver IS NULL THEN
    RETURN NULL;
  END IF;

  INSERT INTO public.trip_offers (trip_id, driver_id, offer_rank, distance_m, status)
  VALUES (p_trip_id, v_driver, p_rank, v_dist, 'pending')
  RETURNING id INTO v_offer;

  RETURN v_offer;
END;
$$;

-- ─── 6. TRIGGER : nouvelle course → 1ʳᵉ offre automatique ────────────
CREATE FUNCTION public.on_trip_created()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF NEW.status = 'pending' THEN
    PERFORM public.create_trip_offer(NEW.id, 1);
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER after_trip_created
  AFTER INSERT ON public.trips
  FOR EACH ROW EXECUTE FUNCTION public.on_trip_created();

-- ─── 7. RPC : refus / expiration → chauffeur suivant ─────────────────
CREATE FUNCTION public.advance_trip_offer(p_offer_id UUID, p_status TEXT DEFAULT 'rejected')
RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_trip UUID;
  v_rank INTEGER;
BEGIN
  UPDATE public.trip_offers
     SET status = p_status, responded_at = NOW()
   WHERE id = p_offer_id AND status = 'pending'
   RETURNING trip_id, offer_rank INTO v_trip, v_rank;

  IF v_trip IS NULL THEN
    RETURN NULL;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.trips WHERE id = v_trip AND status = 'pending') THEN
    RETURN NULL;
  END IF;

  RETURN public.create_trip_offer(v_trip, v_rank + 1);
END;
$$;

-- ─── 8. TRIGGER : acceptation → figer offres + chauffeur on_trip ─────
CREATE FUNCTION public.on_trip_accepted()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF NEW.status = 'accepted' AND OLD.status = 'pending' AND NEW.driver_id IS NOT NULL THEN
    UPDATE public.trip_offers
       SET status = 'accepted', responded_at = NOW()
     WHERE trip_id = NEW.id AND driver_id = NEW.driver_id AND status = 'pending';
    UPDATE public.trip_offers
       SET status = 'expired', responded_at = NOW()
     WHERE trip_id = NEW.id AND driver_id <> NEW.driver_id AND status = 'pending';
    UPDATE public.drivers SET status = 'on_trip' WHERE id = NEW.driver_id;
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER after_trip_accepted
  AFTER UPDATE ON public.trips
  FOR EACH ROW EXECUTE FUNCTION public.on_trip_accepted();

-- ─── 9. RPC : infos chauffeur pour le passager (objet JSON unique) ───
CREATE FUNCTION public.get_trip_driver_info(p_trip_id UUID)
RETURNS JSON LANGUAGE sql SECURITY DEFINER AS $$
  SELECT json_build_object(
    'full_name',     p.full_name,
    'phone',         p.phone,
    'rating',        d.rating,
    'vehicle_make',  d.vehicle_make,
    'vehicle_model', d.vehicle_model,
    'vehicle_plate', d.vehicle_plate,
    'vehicle_color', d.vehicle_color
  )
  FROM public.trips t
  JOIN public.drivers  d ON t.driver_id = d.id
  JOIN public.profiles p ON d.id = p.id
  WHERE t.id = p_trip_id;
$$;

-- ─── 10. RLS pour trip_offers ────────────────────────────────────────
ALTER TABLE public.trip_offers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "offer_select_own" ON public.trip_offers;
CREATE POLICY "offer_select_own" ON public.trip_offers
  FOR SELECT USING (driver_id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS "offer_update_own" ON public.trip_offers;
CREATE POLICY "offer_update_own" ON public.trip_offers
  FOR UPDATE USING (driver_id = auth.uid());

-- ─── 11. REALTIME (idempotent) ───────────────────────────────────────
DO $$
DECLARE tbl TEXT;
BEGIN
  FOREACH tbl IN ARRAY ARRAY['trip_offers','trips','driver_locations','notifications'] LOOP
    IF NOT EXISTS (
      SELECT 1 FROM pg_publication_tables
      WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = tbl
    ) THEN
      EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE public.%I', tbl);
    END IF;
  END LOOP;
END $$;
