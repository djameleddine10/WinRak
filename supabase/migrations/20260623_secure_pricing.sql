-- ═══════════════════════════════════════════════════════════════════
--  WinRak — Tarification sécurisée côté serveur (anti-fraude)
--  À exécuter dans Supabase SQL Editor APRÈS schema.sql + rls.sql.
--  100% idempotent : ré-exécutable sans danger.
--
--  PROBLÈME corrigé :
--   Avant, price / commission / driver_earnings étaient calculés dans
--   l'app cliente et insérés tels quels. Un passager malveillant pouvait
--   payer 1 DZD, ou forcer une commission négative.
--
--  SOLUTION :
--   Un trigger BEFORE INSERT recalcule le tarif équitable à partir de la
--   distance et du type de véhicule (mêmes barèmes que route.service.ts),
--   borne le prix proposé à ±30% du tarif équitable, et calcule TOUJOURS
--   commission (12%) + driver_earnings côté serveur. Le client ne peut
--   plus fixer librement ces montants.
-- ═══════════════════════════════════════════════════════════════════

-- ─── 1. Barème officiel (source de vérité unique, côté serveur) ──────
-- BASE = 150 DZD ; PER_KM dépend du type de véhicule.
-- Types DB : economique | confort | she | intercites
CREATE OR REPLACE FUNCTION public.winrak_fair_price(
  p_vehicle_type TEXT,
  p_distance_km  NUMERIC
) RETURNS INTEGER
LANGUAGE plpgsql IMMUTABLE AS $$
DECLARE
  base   INTEGER := 150;
  per_km INTEGER;
  raw    NUMERIC;
BEGIN
  per_km := CASE p_vehicle_type
    WHEN 'economique' THEN 80
    WHEN 'confort'    THEN 100
    WHEN 'she'        THEN 90
    WHEN 'intercites' THEN 70
    ELSE 80
  END;

  -- distance négative ou nulle => uniquement la base
  IF p_distance_km IS NULL OR p_distance_km < 0 THEN
    p_distance_km := 0;
  END IF;

  raw := base + per_km * p_distance_km;
  -- arrondi au multiple de 50 DZD le plus proche (comme estimatePrice)
  RETURN GREATEST(base, (ROUND(raw / 50.0) * 50)::INTEGER);
END;
$$;

-- ─── 2. Trigger BEFORE INSERT : sécurise prix + commission ───────────
CREATE OR REPLACE FUNCTION public.enforce_trip_pricing()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE
  fair        INTEGER;
  min_price   INTEGER;
  max_price   INTEGER;
  final_price INTEGER;
BEGIN
  -- Tarif équitable calculé côté serveur (jamais fourni par le client)
  fair := public.winrak_fair_price(NEW.vehicle_type, COALESCE(NEW.distance_km, 0));

  -- Le passager peut proposer un prix (modèle Heetch), borné à ±30%
  min_price := (ROUND(fair * 0.70 / 50.0) * 50)::INTEGER;
  max_price := (ROUND(fair * 1.30 / 50.0) * 50)::INTEGER;

  IF NEW.price IS NULL THEN
    final_price := fair;
  ELSE
    final_price := LEAST(GREATEST(NEW.price, min_price), max_price);
  END IF;

  NEW.price := final_price;

  -- Commission (12% WinRak) et part chauffeur : TOUJOURS recalculées ici.
  NEW.commission      := ROUND(final_price * 0.12);
  NEW.driver_earnings := final_price - NEW.commission;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trip_pricing_guard ON public.trips;
CREATE TRIGGER trip_pricing_guard
  BEFORE INSERT ON public.trips
  FOR EACH ROW EXECUTE FUNCTION public.enforce_trip_pricing();

-- ─── 3. Garde-fou supplémentaire au niveau colonne (défense en profondeur)
-- Empêche toute valeur aberrante même si le trigger était contourné.
ALTER TABLE public.trips
  DROP CONSTRAINT IF EXISTS trips_price_positive;
ALTER TABLE public.trips
  ADD CONSTRAINT trips_price_positive
  CHECK (price >= 0 AND commission >= 0 AND driver_earnings >= 0);
