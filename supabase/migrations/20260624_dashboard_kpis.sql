-- ═══════════════════════════════════════════════════════════════════════════
--  WinRak — Dashboard KPIs (une seule fonction, un seul aller-retour réseau)
--  Run AFTER all previous migrations. 100% idempotent.
--
--  dash_kpis() retourne TOUT en un seul appel JSON :
--    · KPIs principaux (trajets, revenus, chauffeurs, note)
--    · KPIs finance (CA mois, commission, reversements)
--    · Données des 4 graphiques (trips 7j, revenus 7j, types, mensuel)
-- ═══════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.dash_kpis()
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v JSONB;
BEGIN
  SELECT jsonb_build_object(

    -- ── KPIs principaux ──────────────────────────────────────────────────
    'trips_this_month', (
      SELECT COUNT(*) FROM trips
      WHERE created_at >= date_trunc('month', now() AT TIME ZONE 'Africa/Algiers')
    ),
    'trips_today', (
      SELECT COUNT(*) FROM trips
      WHERE created_at >= date_trunc('day', now() AT TIME ZONE 'Africa/Algiers')
    ),
    'revenue_today', (
      SELECT COALESCE(SUM(price), 0) FROM trips
      WHERE status = 'completed'
        AND created_at >= date_trunc('day', now() AT TIME ZONE 'Africa/Algiers')
    ),
    'revenue_this_month', (
      SELECT COALESCE(SUM(price), 0) FROM trips
      WHERE status = 'completed'
        AND created_at >= date_trunc('month', now() AT TIME ZONE 'Africa/Algiers')
    ),
    'commission_this_month', (
      SELECT COALESCE(SUM(commission), 0) FROM trips
      WHERE status = 'completed'
        AND created_at >= date_trunc('month', now() AT TIME ZONE 'Africa/Algiers')
    ),
    'driver_earnings_this_month', (
      SELECT COALESCE(SUM(driver_earnings), 0) FROM trips
      WHERE status = 'completed'
        AND created_at >= date_trunc('month', now() AT TIME ZONE 'Africa/Algiers')
    ),
    'drivers_online', (
      SELECT COUNT(*) FROM drivers WHERE status IN ('online', 'on_trip')
    ),
    'drivers_total', (
      SELECT COUNT(*) FROM drivers
    ),
    'passengers_total', (
      SELECT COUNT(*) FROM passengers
    ),
    'avg_rating', (
      SELECT ROUND(AVG(rating)::NUMERIC, 1)
      FROM drivers WHERE rating > 0
    ),
    'trips_cancelled_today', (
      SELECT COUNT(*) FROM trips
      WHERE status = 'cancelled'
        AND created_at >= date_trunc('day', now() AT TIME ZONE 'Africa/Algiers')
    ),
    'docs_pending', (
      SELECT COUNT(DISTINCT driver_id) FROM driver_documents WHERE status = 'pending'
    ),

    -- ── Graphique : Trajets 7 derniers jours ─────────────────────────────
    'trips_7d', (
      SELECT COALESCE(jsonb_agg(
        jsonb_build_object(
          'day',       to_char(d::date, 'Dy'),
          'total',     COALESCE(cnt.total,     0),
          'completed', COALESCE(cnt.completed, 0),
          'cancelled', COALESCE(cnt.cancelled, 0)
        ) ORDER BY d
      ), '[]'::jsonb)
      FROM generate_series(
        (now() AT TIME ZONE 'Africa/Algiers')::date - 6,
        (now() AT TIME ZONE 'Africa/Algiers')::date,
        '1 day'::interval
      ) AS d
      LEFT JOIN (
        SELECT
          (created_at AT TIME ZONE 'Africa/Algiers')::date                  AS day,
          COUNT(*)                                                           AS total,
          COUNT(*) FILTER (WHERE status = 'completed')                      AS completed,
          COUNT(*) FILTER (WHERE status = 'cancelled')                      AS cancelled
        FROM trips
        WHERE created_at >= now() - INTERVAL '7 days'
        GROUP BY 1
      ) cnt ON d::date = cnt.day
    ),

    -- ── Graphique : Revenus 7 derniers jours ─────────────────────────────
    'revenue_7d', (
      SELECT COALESCE(jsonb_agg(
        jsonb_build_object(
          'day',     to_char(d::date, 'Dy'),
          'revenue', COALESCE(cnt.revenue, 0)
        ) ORDER BY d
      ), '[]'::jsonb)
      FROM generate_series(
        (now() AT TIME ZONE 'Africa/Algiers')::date - 6,
        (now() AT TIME ZONE 'Africa/Algiers')::date,
        '1 day'::interval
      ) AS d
      LEFT JOIN (
        SELECT
          (created_at AT TIME ZONE 'Africa/Algiers')::date AS day,
          SUM(price)                                        AS revenue
        FROM trips
        WHERE status = 'completed' AND created_at >= now() - INTERVAL '7 days'
        GROUP BY 1
      ) cnt ON d::date = cnt.day
    ),

    -- ── Graphique : Répartition par type de véhicule (mois en cours) ─────
    'trips_by_type', (
      SELECT COALESCE(
        jsonb_object_agg(vehicle_type, cnt),
        '{}'::jsonb
      )
      FROM (
        SELECT vehicle_type, COUNT(*) AS cnt
        FROM trips
        WHERE created_at >= date_trunc('month', now() AT TIME ZONE 'Africa/Algiers')
        GROUP BY vehicle_type
      ) t
    ),

    -- ── Graphique : Revenus mensuels (année en cours) ────────────────────
    'revenue_monthly', (
      SELECT COALESCE(jsonb_agg(
        jsonb_build_object(
          'month',   to_char(m, 'Mon'),
          'revenue', COALESCE(cnt.revenue, 0)
        ) ORDER BY m
      ), '[]'::jsonb)
      FROM generate_series(
        date_trunc('year',  now() AT TIME ZONE 'Africa/Algiers'),
        date_trunc('month', now() AT TIME ZONE 'Africa/Algiers'),
        '1 month'::interval
      ) AS m
      LEFT JOIN (
        SELECT
          date_trunc('month', created_at AT TIME ZONE 'Africa/Algiers') AS month,
          SUM(price)                                                      AS revenue
        FROM trips
        WHERE status = 'completed'
          AND created_at >= date_trunc('year', now() AT TIME ZONE 'Africa/Algiers')
        GROUP BY 1
      ) cnt ON m = cnt.month
    )

  ) INTO v;

  RETURN v;
END;
$$;

GRANT EXECUTE ON FUNCTION public.dash_kpis() TO anon, authenticated;
