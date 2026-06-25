-- ─────────────────────────────────────────────────────────────────────────────
-- Migration: 20260625_rides_view
-- Creates a `rides` compatibility view over `trips` so admin-web works
-- without TypeScript changes.
--
-- NOTE: Supabase PostgREST nested selects (passenger:profiles!passenger_id)
-- won't work on a VIEW because FK metadata isn't carried over.
-- The Rides page and Dashboard use flat column access after the join,
-- so we embed passenger/driver name & phone directly in the view.
-- Dashboard recent-rides query is updated separately (see admin-web patch).
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE VIEW public.rides AS
SELECT
  t.id,
  t.trip_code,
  t.passenger_id,
  t.driver_id,
  t.vehicle_type                      AS ride_type,
  t.from_address,
  t.from_lat,
  t.from_lng,
  t.to_address,
  t.to_lat,
  t.to_lng,
  t.distance_km,
  t.duration_min                      AS duration_minutes,
  t.price,
  t.commission,
  t.driver_earnings,
  t.payment_method,
  t.status,
  t.cancel_reason,
  t.passenger_rating,
  t.driver_rating,
  t.started_at                        AS accepted_at,
  t.started_at                        AS picked_up_at,
  t.completed_at,
  t.created_at,

  -- Embedded passenger info (avoids FK join issues on views)
  pp.full_name                        AS passenger_name,
  pp.phone                            AS passenger_phone,

  -- Embedded driver info
  dp.full_name                        AS driver_name,
  dp.phone                            AS driver_phone

FROM public.trips t
JOIN  public.passengers pas ON t.passenger_id = pas.id
JOIN  public.profiles   pp  ON pas.id = pp.id
LEFT JOIN public.drivers    drv ON t.driver_id = drv.id
LEFT JOIN public.profiles   dp  ON drv.id = dp.id;

-- Grant access
GRANT SELECT ON public.rides TO authenticated;
GRANT SELECT ON public.rides TO service_role;
GRANT SELECT ON public.rides TO anon;
