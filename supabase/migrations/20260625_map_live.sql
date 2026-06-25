-- ═══════════════════════════════════════════════════════════════════════════
--  WinRak — Live Map RPCs (admin dashboard "Carte")
--  Run AFTER schema.sql + 20260624_admin.sql (requires is_admin()).
--  100% idempotent.
--
--  WHY: the mobile driver app broadcasts GPS to public.driver_locations
--       (lat/lng), NOT to drivers.current_lat/current_lng. Active rides live
--       in public.trips, not a "rides" table. These RPCs read the correct
--       sources and return coordinates the admin map needs.
--
--  map_drivers()      — every driver that has broadcast a position, with
--                       live lat/lng + status + name/phone/vehicle/rating
--  map_active_trips() — accepted / in_progress trips with pickup + dropoff
--                       coordinates and passenger / driver names
--
--  Both are SECURITY DEFINER and gated by is_admin() (return 0 rows for
--  non-admins). Granted to authenticated only.
-- ═══════════════════════════════════════════════════════════════════════════

-- ─── 1. Live driver positions ──────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.map_drivers()
RETURNS TABLE (
  id            UUID,
  full_name     TEXT,
  phone         TEXT,
  status        TEXT,
  lat           REAL,
  lng           REAL,
  heading       REAL,
  updated_at    TIMESTAMPTZ,
  vehicle_type  TEXT,
  vehicle_plate TEXT,
  rating        NUMERIC
)
LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  SELECT
    d.id,
    p.full_name,
    p.phone,
    d.status,
    dl.lat,
    dl.lng,
    dl.heading,
    dl.updated_at,
    d.vehicle_type,
    d.vehicle_plate,
    d.rating
  FROM public.drivers d
  JOIN public.driver_locations dl ON dl.driver_id = d.id
  JOIN public.profiles p          ON p.id = d.id
  WHERE public.is_admin()
  ORDER BY dl.updated_at DESC;
$$;

-- ─── 2. Active trips with coordinates ──────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.map_active_trips()
RETURNS TABLE (
  id             UUID,
  trip_code      TEXT,
  passenger_id   UUID,
  driver_id      UUID,
  from_address   TEXT,
  from_lat       REAL,
  from_lng       REAL,
  to_address     TEXT,
  to_lat         REAL,
  to_lng         REAL,
  status         TEXT,
  price          INTEGER,
  distance_km    NUMERIC,
  passenger_name TEXT,
  driver_name    TEXT
)
LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  SELECT
    t.id,
    t.trip_code,
    t.passenger_id,
    t.driver_id,
    t.from_address,
    t.from_lat,
    t.from_lng,
    t.to_address,
    t.to_lat,
    t.to_lng,
    t.status,
    t.price,
    t.distance_km,
    pp.full_name AS passenger_name,
    dp.full_name AS driver_name
  FROM public.trips t
  JOIN public.profiles pp      ON pp.id = t.passenger_id
  LEFT JOIN public.profiles dp ON dp.id = t.driver_id
  WHERE t.status IN ('accepted', 'in_progress')
    AND public.is_admin()
  ORDER BY t.created_at DESC;
$$;

-- ─── Grants ─────────────────────────────────────────────────────────────────────
GRANT EXECUTE ON FUNCTION public.map_drivers()      TO authenticated;
GRANT EXECUTE ON FUNCTION public.map_active_trips() TO authenticated;
