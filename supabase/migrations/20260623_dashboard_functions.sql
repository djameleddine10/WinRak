-- ═══════════════════════════════════════════════════════════════════
--  WinRak Dashboard — Fonctions SECURITY DEFINER
--  Ces fonctions s'exécutent sous postgres (bypass RLS).
--  Accessibles via anon key car le dashboard est protégé par mot de passe JS.
--  À exécuter dans Supabase SQL Editor.
-- ═══════════════════════════════════════════════════════════════════

-- ─── Chauffeurs ───────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.dash_drivers(p_status TEXT DEFAULT NULL)
RETURNS TABLE (
  id UUID, full_name TEXT, full_name_ar TEXT, phone TEXT,
  avatar_url TEXT, is_active BOOLEAN, vehicle_make TEXT, vehicle_model TEXT,
  vehicle_year INT, vehicle_plate TEXT, vehicle_type TEXT, vehicle_color TEXT,
  rating NUMERIC, total_trips INT, total_earnings INT, wallet_balance INT,
  status TEXT, current_lat REAL, current_lng REAL,
  is_verified BOOLEAN, verified_at TIMESTAMPTZ, created_at TIMESTAMPTZ
)
LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT
    d.id, p.full_name, p.full_name_ar, p.phone,
    p.avatar_url, p.is_active, d.vehicle_make, d.vehicle_model,
    d.vehicle_year, d.vehicle_plate, d.vehicle_type, d.vehicle_color,
    d.rating, d.total_trips, d.total_earnings, d.wallet_balance,
    d.status, d.current_lat, d.current_lng,
    d.is_verified, d.verified_at, p.created_at
  FROM public.drivers d
  JOIN public.profiles p ON d.id = p.id
  WHERE (p_status IS NULL OR d.status = p_status)
  ORDER BY d.total_trips DESC;
$$;
GRANT EXECUTE ON FUNCTION public.dash_drivers(TEXT) TO anon;

-- ─── Passagers ────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.dash_passengers(p_search TEXT DEFAULT NULL)
RETURNS TABLE (
  id UUID, full_name TEXT, full_name_ar TEXT, phone TEXT,
  avatar_url TEXT, is_active BOOLEAN,
  rating NUMERIC, total_trips INT, total_spent INT, created_at TIMESTAMPTZ
)
LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT
    ps.id, p.full_name, p.full_name_ar, p.phone,
    p.avatar_url, p.is_active,
    ps.rating, ps.total_trips, ps.total_spent, p.created_at
  FROM public.passengers ps
  JOIN public.profiles p ON ps.id = p.id
  WHERE (p_search IS NULL OR p.full_name ILIKE '%' || p_search || '%')
  ORDER BY ps.total_trips DESC;
$$;
GRANT EXECUTE ON FUNCTION public.dash_passengers(TEXT) TO anon;

-- ─── Trajets ──────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.dash_trips(
  p_status       TEXT DEFAULT NULL,
  p_vehicle_type TEXT DEFAULT NULL
)
RETURNS TABLE (
  id UUID, trip_code TEXT, status TEXT, vehicle_type TEXT,
  from_address TEXT, to_address TEXT,
  price INT, commission INT, driver_earnings INT,
  created_at TIMESTAMPTZ, started_at TIMESTAMPTZ, completed_at TIMESTAMPTZ,
  passenger_id UUID, driver_id UUID,
  passenger_name TEXT, passenger_phone TEXT,
  driver_name TEXT, driver_phone TEXT,
  vehicle_make TEXT, vehicle_model TEXT, vehicle_plate TEXT
)
LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT
    t.id, t.trip_code, t.status, t.vehicle_type,
    t.from_address, t.to_address,
    t.price, t.commission, t.driver_earnings,
    t.created_at, t.started_at, t.completed_at,
    t.passenger_id, t.driver_id,
    pp.full_name AS passenger_name, pp.phone AS passenger_phone,
    dp.full_name AS driver_name,   dp.phone AS driver_phone,
    d.vehicle_make, d.vehicle_model, d.vehicle_plate
  FROM public.trips t
  JOIN public.passengers ps ON t.passenger_id = ps.id
  JOIN public.profiles pp   ON ps.id = pp.id
  LEFT JOIN public.drivers d  ON t.driver_id = d.id
  LEFT JOIN public.profiles dp ON d.id = dp.id
  WHERE (p_status IS NULL OR t.status = p_status)
  AND   (p_vehicle_type IS NULL OR t.vehicle_type = p_vehicle_type)
  ORDER BY t.created_at DESC
  LIMIT 50;
$$;
GRANT EXECUTE ON FUNCTION public.dash_trips(TEXT, TEXT) TO anon;

-- ─── Transactions ─────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.dash_transactions(p_limit INT DEFAULT 50)
RETURNS TABLE (
  id UUID, amount INT, commission INT, driver_amount INT,
  status TEXT, payment_method TEXT, created_at TIMESTAMPTZ,
  trip_code TEXT, passenger_name TEXT, driver_name TEXT
)
LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT
    tx.id, tx.amount, tx.commission, tx.driver_amount,
    tx.status, tx.payment_method, tx.created_at,
    t.trip_code,
    pp.full_name AS passenger_name,
    dp.full_name AS driver_name
  FROM public.transactions tx
  LEFT JOIN public.trips t    ON tx.trip_id      = t.id
  LEFT JOIN public.profiles pp ON tx.passenger_id = pp.id
  LEFT JOIN public.profiles dp ON tx.driver_id    = dp.id
  ORDER BY tx.created_at DESC
  LIMIT p_limit;
$$;
GRANT EXECUTE ON FUNCTION public.dash_transactions(INT) TO anon;

-- ─── Documents en attente ─────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.dash_pending_docs()
RETURNS TABLE (
  id UUID, driver_id UUID,
  full_name TEXT, full_name_ar TEXT, phone TEXT,
  vehicle_make TEXT, vehicle_model TEXT, vehicle_plate TEXT, vehicle_type TEXT,
  type TEXT, file_url TEXT, file_name TEXT,
  status TEXT, reject_reason TEXT, uploaded_at TIMESTAMPTZ
)
LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT
    dd.id, dd.driver_id,
    p.full_name, p.full_name_ar, p.phone,
    dr.vehicle_make, dr.vehicle_model, dr.vehicle_plate, dr.vehicle_type,
    dd.type, dd.file_url, dd.file_name,
    dd.status, dd.reject_reason, dd.uploaded_at
  FROM public.driver_documents dd
  JOIN public.profiles p  ON dd.driver_id = p.id
  JOIN public.drivers  dr ON dd.driver_id = dr.id
  ORDER BY dd.uploaded_at DESC;
$$;
GRANT EXECUTE ON FUNCTION public.dash_pending_docs() TO anon;

-- ─── Finance mensuelle ────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.dash_finance_monthly()
RETURNS TABLE (
  month TIMESTAMPTZ, trip_count BIGINT,
  total_revenue BIGINT, total_commission BIGINT,
  total_driver_earnings BIGINT, avg_trip_price NUMERIC
)
LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT
    DATE_TRUNC('month', created_at) AS month,
    COUNT(*)                        AS trip_count,
    SUM(amount)                     AS total_revenue,
    SUM(commission)                 AS total_commission,
    SUM(driver_amount)              AS total_driver_earnings,
    AVG(amount)                     AS avg_trip_price
  FROM public.transactions
  WHERE status = 'completed'
  GROUP BY 1
  ORDER BY 1 DESC
  LIMIT 6;
$$;
GRANT EXECUTE ON FUNCTION public.dash_finance_monthly() TO anon;

-- ─── Révision document (action admin) ────────────────────────────
CREATE OR REPLACE FUNCTION public.dash_review_doc(
  p_doc_id      UUID,
  p_status      TEXT,
  p_reason      TEXT    DEFAULT NULL,
  p_reviewer_id UUID    DEFAULT NULL
)
RETURNS void LANGUAGE sql SECURITY DEFINER AS $$
  UPDATE public.driver_documents
  SET
    status        = p_status,
    reject_reason = p_reason,
    reviewed_by   = p_reviewer_id,
    reviewed_at   = NOW()
  WHERE id = p_doc_id;
$$;
GRANT EXECUTE ON FUNCTION public.dash_review_doc(UUID, TEXT, TEXT, UUID) TO anon;
