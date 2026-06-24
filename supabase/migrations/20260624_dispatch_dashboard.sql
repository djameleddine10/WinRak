-- ═══════════════════════════════════════════════════════════════════════════
--  WinRak — Dispatch Dashboard RPCs
--  Run AFTER 20260622_dispatch_system.sql (requires trip_offers table).
--  100% idempotent.
--
--  dash_dispatch()      — offres en attente (file de répartition)
--  dash_active_trips()  — courses acceptées / en cours
-- ═══════════════════════════════════════════════════════════════════════════

-- ─── 1. Offres en attente ─────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.dash_dispatch()
RETURNS TABLE (
  offer_id      UUID,
  offer_rank    INTEGER,
  distance_m    INTEGER,
  offered_at    TIMESTAMPTZ,
  trip_id       UUID,
  trip_code     TEXT,
  from_address  TEXT,
  to_address    TEXT,
  price         NUMERIC,
  vehicle_type  TEXT,
  distance_km   NUMERIC,
  duration_min  INTEGER,
  driver_name   TEXT,
  driver_phone  TEXT,
  vehicle_plate TEXT,
  passenger_name TEXT
)
LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  SELECT
    o.id                AS offer_id,
    o.offer_rank,
    o.distance_m,
    o.created_at        AS offered_at,
    t.id                AS trip_id,
    t.trip_code,
    t.from_address,
    t.to_address,
    t.price,
    t.vehicle_type,
    t.distance_km,
    t.duration_min,
    dp.full_name        AS driver_name,
    dp.phone            AS driver_phone,
    d.vehicle_plate,
    pp.full_name        AS passenger_name
  FROM public.trip_offers o
  JOIN public.trips    t  ON t.id  = o.trip_id
  JOIN public.drivers  d  ON d.id  = o.driver_id
  JOIN public.profiles dp ON dp.id = o.driver_id
  JOIN public.profiles pp ON pp.id = t.passenger_id
  WHERE o.status = 'pending'
    AND t.status = 'pending'
  ORDER BY o.created_at DESC
  LIMIT 100;
$$;

-- ─── 2. Courses actives ───────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.dash_active_trips()
RETURNS TABLE (
  trip_id       UUID,
  trip_code     TEXT,
  status        TEXT,
  from_address  TEXT,
  to_address    TEXT,
  price         NUMERIC,
  vehicle_type  TEXT,
  distance_km   NUMERIC,
  duration_min  INTEGER,
  started_at    TIMESTAMPTZ,
  created_at    TIMESTAMPTZ,
  driver_name   TEXT,
  vehicle_plate TEXT,
  passenger_name TEXT
)
LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  SELECT
    t.id             AS trip_id,
    t.trip_code,
    t.status,
    t.from_address,
    t.to_address,
    t.price,
    t.vehicle_type,
    t.distance_km,
    t.duration_min,
    t.started_at,
    t.created_at,
    dp.full_name     AS driver_name,
    d.vehicle_plate,
    pp.full_name     AS passenger_name
  FROM public.trips    t
  JOIN public.drivers  d  ON d.id  = t.driver_id
  JOIN public.profiles dp ON dp.id = t.driver_id
  JOIN public.profiles pp ON pp.id = t.passenger_id
  WHERE t.status IN ('accepted', 'in_progress')
  ORDER BY t.created_at DESC
  LIMIT 100;
$$;

-- ─── Grants ───────────────────────────────────────────────────────────────────
GRANT EXECUTE ON FUNCTION public.dash_dispatch()     TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.dash_active_trips() TO anon, authenticated;
