-- ═══════════════════════════════════════════════════════════════════════════
--  WinRak — Pricing Engine v2 (City-Based, 3 Tiers, 5 Services)
--  Run AFTER all previous migrations. 100 % idempotent.
--
--  Tables created / replaced:
--    cities                   — wilayas/cities with tier A/B/C
--    pricing_config           — base fares per tier × service
--    surge_config             — time/event multipliers (auto)
--    surge_events             — manual surges activated from dashboard
--    driver_commission_phases — per-driver 0→5→10% commission tracker
--
--  RPCs (SECURITY DEFINER, called from dashboard):
--    rpc_get_cities()
--    rpc_get_pricing_config()
--    rpc_upsert_pricing_config(tier, service_type, ...)
--    rpc_get_surge_config()
--    rpc_upsert_surge_config(id, multiplier, label)
--    rpc_get_active_surge(city_id)
--    rpc_toggle_manual_surge(city_id, trigger_type, multiplier, reason, ends_at)
--    rpc_get_driver_commission(driver_id)
-- ═══════════════════════════════════════════════════════════════════════════

-- ─── ENUMS ────────────────────────────────────────────────────────────────────

DO $$ BEGIN
  CREATE TYPE city_tier    AS ENUM ('A', 'B', 'C');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE service_kind AS ENUM ('ride', 'women', 'delivery', 'medicine', 'food');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE surge_trigger AS ENUM (
    'morning_peak', 'evening_peak', 'night', 'ramadan', 'holiday',
    'rain', 'event'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ─── CITIES ───────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.cities (
  id          SERIAL       PRIMARY KEY,
  name_ar     TEXT         NOT NULL,
  name_fr     TEXT         NOT NULL,
  wilaya_code SMALLINT     NOT NULL,
  tier        city_tier    NOT NULL DEFAULT 'B',
  is_active   BOOLEAN      NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT now()
);

ALTER TABLE public.cities
  ADD COLUMN IF NOT EXISTS is_active  BOOLEAN     NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT now();

-- Seed cities (idempotent via ON CONFLICT)
DO $$ BEGIN
  ALTER TABLE public.cities ADD CONSTRAINT cities_wilaya_name_unique UNIQUE (wilaya_code, name_fr);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

INSERT INTO public.cities (name_ar, name_fr, wilaya_code, tier) VALUES
-- Tier A — مرتفع
  ('الجزائر العاصمة', 'Alger',         16, 'A'),
  ('وهران',            'Oran',           31, 'A'),
  ('تمنراست',          'Tamanrasset',    11, 'A'),
  ('حاسي مسعود',       'Hassi Messaoud', 30, 'A'),
-- Tier B — متوسط
  ('عنابة',            'Annaba',         23, 'B'),
  ('سطيف',             'Sétif',          19, 'B'),
  ('بجاية',            'Béjaïa',          6, 'B'),
  ('تيزي وزو',         'Tizi Ouzou',     15, 'B'),
  ('باتنة',            'Batna',           5, 'B'),
  ('سكيكدة',           'Skikda',         21, 'B'),
-- Tier C — منخفض
  ('قسنطينة',          'Constantine',    25, 'C'),
  ('الجلفة',           'Djelfa',         17, 'C'),
  ('المسيلة',          'M''Sila',        28, 'C'),
  ('معسكر',            'Mascara',        29, 'C'),
  ('سعيدة',            'Saïda',          20, 'C'),
  ('بسكرة',            'Biskra',          7, 'C'),
  ('الأغواط',          'Laghouat',       3,  'C')
ON CONFLICT (wilaya_code, name_fr) DO UPDATE
  SET tier = EXCLUDED.tier, name_ar = EXCLUDED.name_ar;

-- ─── PRICING CONFIG ───────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.pricing_config (
  id               SERIAL        PRIMARY KEY,
  tier             city_tier     NOT NULL,
  service_type     service_kind  NOT NULL,
  -- Short-trip flat fare (0 → short_km_limit km)
  base_fare        INTEGER       NOT NULL DEFAULT 250,   -- DZD
  short_km_limit   NUMERIC(4,1)  NOT NULL DEFAULT 2.0,   -- km
  -- Per-km after the short threshold
  per_km_rate      INTEGER       NOT NULL DEFAULT 32,    -- DZD/km
  -- Per-minute (applies to ride & women)
  per_min_rate     NUMERIC(4,1)  NOT NULL DEFAULT 3.0,   -- DZD/min
  -- Women service extra on top of ride base (%)
  women_premium_pct NUMERIC(4,1) NOT NULL DEFAULT 15.0,
  -- Speed tiers (delivery, medicine, food): multipliers stored as JSON
  -- {"normal":1.0,"fast":1.25,"urgent":1.50}
  speed_multipliers JSONB         NOT NULL DEFAULT '{"normal":1.0,"fast":1.25,"urgent":1.50}',
  updated_at       TIMESTAMPTZ   NOT NULL DEFAULT now(),
  UNIQUE (tier, service_type)
);

-- Seed 15 rows (3 tiers × 5 services)
INSERT INTO public.pricing_config
  (tier, service_type, base_fare, short_km_limit, per_km_rate, per_min_rate, women_premium_pct, speed_multipliers)
VALUES
-- ── TIER A ──────────────────────────────────────────────────────────────────
('A', 'ride',     250, 2.0, 32, 3.0, 15.0, '{"normal":1.0,"fast":1.0,"urgent":1.0}'),
('A', 'women',    250, 2.0, 32, 3.0, 15.0, '{"normal":1.0,"fast":1.0,"urgent":1.0}'),
('A', 'delivery', 250, 3.0, 30, 0.0, 0.0,  '{"normal":1.0,"fast":1.25,"urgent":1.50}'),
('A', 'medicine', 300, 3.0, 30, 0.0, 0.0,  '{"normal":1.0,"fast":1.35,"urgent":1.70}'),
('A', 'food',     250, 3.0, 30, 0.0, 0.0,  '{"normal":1.0,"fast":1.25,"urgent":1.50}'),
-- ── TIER B ──────────────────────────────────────────────────────────────────
('B', 'ride',     220, 2.0, 28, 3.0, 15.0, '{"normal":1.0,"fast":1.0,"urgent":1.0}'),
('B', 'women',    220, 2.0, 28, 3.0, 15.0, '{"normal":1.0,"fast":1.0,"urgent":1.0}'),
('B', 'delivery', 220, 3.0, 27, 0.0, 0.0,  '{"normal":1.0,"fast":1.25,"urgent":1.50}'),
('B', 'medicine', 270, 3.0, 27, 0.0, 0.0,  '{"normal":1.0,"fast":1.35,"urgent":1.70}'),
('B', 'food',     220, 3.0, 27, 0.0, 0.0,  '{"normal":1.0,"fast":1.25,"urgent":1.50}'),
-- ── TIER C ──────────────────────────────────────────────────────────────────
('C', 'ride',     200, 2.0, 25, 3.0, 15.0, '{"normal":1.0,"fast":1.0,"urgent":1.0}'),
('C', 'women',    200, 2.0, 25, 3.0, 15.0, '{"normal":1.0,"fast":1.0,"urgent":1.0}'),
('C', 'delivery', 200, 3.0, 24, 0.0, 0.0,  '{"normal":1.0,"fast":1.25,"urgent":1.50}'),
('C', 'medicine', 250, 3.0, 24, 0.0, 0.0,  '{"normal":1.0,"fast":1.35,"urgent":1.70}'),
('C', 'food',     200, 3.0, 24, 0.0, 0.0,  '{"normal":1.0,"fast":1.25,"urgent":1.50}')
ON CONFLICT (tier, service_type) DO NOTHING;

-- ─── SURGE CONFIG ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.surge_config (
  id            SERIAL         PRIMARY KEY,
  trigger_type  surge_trigger  NOT NULL UNIQUE,
  label_ar      TEXT           NOT NULL,
  label_fr      TEXT           NOT NULL,
  multiplier    NUMERIC(4,2)   NOT NULL DEFAULT 1.20,
  is_auto       BOOLEAN        NOT NULL DEFAULT true,
  -- For time-based auto surges (NULL means not time-based)
  start_hour    SMALLINT,   -- 0–23
  end_hour      SMALLINT,   -- 0–23
  -- For calendar-based auto surges
  is_calendar   BOOLEAN        NOT NULL DEFAULT false,
  is_enabled    BOOLEAN        NOT NULL DEFAULT true,
  updated_at    TIMESTAMPTZ    NOT NULL DEFAULT now()
);

INSERT INTO public.surge_config
  (trigger_type, label_ar, label_fr, multiplier, is_auto, start_hour, end_hour, is_calendar)
VALUES
  ('morning_peak', 'ذروة الصباح',       'Pointe matin',       1.20, true,  7,  9,  false),
  ('evening_peak', 'ذروة المساء',       'Pointe soir',        1.20, true,  17, 20, false),
  ('night',        'الليل المتأخر',     'Nuit tardive',       1.30, true,  22, 5,  false),
  ('ramadan',      'رمضان بعد الإفطار', 'Ramadan post-ftour', 1.35, true,  null, null, true),
  ('holiday',      'أعياد ومناسبات',   'Fêtes et événements',1.40, true,  null, null, true),
  ('rain',         'طقس سيئ / مطر',    'Mauvais temps',      1.25, false, null, null, false),
  ('event',        'حدث استثنائي',     'Événement spécial',  1.00, false, null, null, false)
ON CONFLICT (trigger_type) DO NOTHING;

-- ─── SURGE EVENTS (manual activations) ────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.surge_events (
  id            BIGSERIAL      PRIMARY KEY,
  city_id       INTEGER        REFERENCES public.cities(id) ON DELETE CASCADE,
  trigger_type  surge_trigger  NOT NULL DEFAULT 'event',
  multiplier    NUMERIC(4,2)   NOT NULL DEFAULT 1.25,
  reason        TEXT,
  created_by    TEXT           NOT NULL DEFAULT 'admin',
  created_at    TIMESTAMPTZ    NOT NULL DEFAULT now(),
  ends_at       TIMESTAMPTZ,
  is_active     BOOLEAN        NOT NULL DEFAULT true
);

ALTER TABLE public.surge_events
  ADD COLUMN IF NOT EXISTS city_id INTEGER REFERENCES public.cities(id) ON DELETE CASCADE;

-- ─── DRIVER COMMISSION PHASES ─────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.driver_commission_phases (
  driver_id         UUID         PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  first_trip_at     TIMESTAMPTZ,
  first_100_done_at TIMESTAMPTZ,
  commission_pct    NUMERIC(4,1) NOT NULL DEFAULT 0.0,
  override_pct      NUMERIC(4,1),                      -- manual override from dashboard
  updated_at        TIMESTAMPTZ  NOT NULL DEFAULT now()
);

-- Trigger: auto-advance phase when 100 trips done (called from trip insert)
CREATE OR REPLACE FUNCTION public.advance_driver_commission()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE
  v_trips INTEGER;
  v_first TIMESTAMPTZ;
  v_phase NUMERIC;
BEGIN
  -- Only applies to completed trips
  IF NEW.status <> 'completed' OR OLD.status = 'completed' THEN
    RETURN NEW;
  END IF;

  SELECT commission_pct, first_trip_at
  INTO v_phase, v_first
  FROM public.driver_commission_phases
  WHERE driver_id = NEW.driver_id;

  IF NOT FOUND THEN RETURN NEW; END IF;

  -- First trip ever
  IF v_first IS NULL THEN
    UPDATE public.driver_commission_phases
    SET first_trip_at = now(), updated_at = now()
    WHERE driver_id = NEW.driver_id;
    v_first := now();
  END IF;

  -- Count completed trips
  SELECT COUNT(*) INTO v_trips
  FROM public.trips
  WHERE driver_id = NEW.driver_id AND status = 'completed';

  -- Phase logic: 0→5 after 100 trips OR 30 days; 5→10 after 90 more days
  IF v_phase = 0 AND (v_trips >= 100 OR now() - v_first > INTERVAL '30 days') THEN
    UPDATE public.driver_commission_phases
    SET commission_pct = 5.0, first_100_done_at = now(), updated_at = now()
    WHERE driver_id = NEW.driver_id;
  ELSIF v_phase = 5 AND now() - v_first > INTERVAL '120 days' THEN
    UPDATE public.driver_commission_phases
    SET commission_pct = 10.0, updated_at = now()
    WHERE driver_id = NEW.driver_id;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS driver_commission_advance ON public.trips;
CREATE TRIGGER driver_commission_advance
  AFTER UPDATE ON public.trips
  FOR EACH ROW EXECUTE FUNCTION public.advance_driver_commission();

-- ─── UPDATE TRIP PRICING TRIGGER (uses new pricing_config) ───────────────────

CREATE OR REPLACE FUNCTION public.enforce_trip_pricing()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE
  cfg            RECORD;
  city_rec       RECORD;
  v_tier         city_tier;
  v_service      service_kind;
  v_extra_km     NUMERIC;
  v_base         NUMERIC;
  v_surge        NUMERIC := 1.0;
  v_speed        NUMERIC := 1.0;
  v_fair         NUMERIC;
  v_min_price    NUMERIC;
  v_max_price    NUMERIC;
  v_final        INTEGER;
  v_commission   NUMERIC;
  v_driver_pct   NUMERIC;
BEGIN
  -- Resolve tier from city_id (default Tier B if missing)
  IF NEW.city_id IS NOT NULL THEN
    SELECT tier INTO v_tier FROM public.cities WHERE id = NEW.city_id;
  END IF;
  IF v_tier IS NULL THEN v_tier := 'B'; END IF;

  -- Resolve service type
  v_service := CASE NEW.vehicle_type
    WHEN 'women'    THEN 'women'::service_kind
    WHEN 'delivery' THEN 'delivery'::service_kind
    WHEN 'medicine' THEN 'medicine'::service_kind
    WHEN 'food'     THEN 'food'::service_kind
    ELSE 'ride'::service_kind
  END;

  -- Fetch pricing config
  SELECT * INTO cfg
  FROM public.pricing_config
  WHERE tier = v_tier AND service_type = v_service;

  IF NOT FOUND THEN
    -- Fallback safe values
    cfg.base_fare      := 250;
    cfg.short_km_limit := 2.0;
    cfg.per_km_rate    := 30;
    cfg.per_min_rate   := 3.0;
    cfg.women_premium_pct := 0;
  END IF;

  -- Calculate fair price
  v_extra_km := GREATEST(0, COALESCE(NEW.distance_km, 0) - cfg.short_km_limit);
  v_base := cfg.base_fare + v_extra_km * cfg.per_km_rate
            + COALESCE(NEW.duration_min, 0) * cfg.per_min_rate;

  -- Women premium
  IF v_service = 'women' THEN
    v_base := v_base * (1 + cfg.women_premium_pct / 100.0);
  END IF;

  -- Active manual surge for this city
  SELECT COALESCE(MAX(multiplier), 1.0) INTO v_surge
  FROM public.surge_events
  WHERE is_active = true
    AND (city_id = NEW.city_id OR city_id IS NULL)
    AND (ends_at IS NULL OR ends_at > now());

  v_fair := v_base * v_surge;

  -- Clamp customer-proposed price to ±30% of fair
  v_min_price := ROUND(v_fair * 0.70 / 50.0) * 50;
  v_max_price := ROUND(v_fair * 1.30 / 50.0) * 50;

  IF NEW.price IS NULL THEN
    v_final := GREATEST(cfg.base_fare, ROUND(v_fair / 50.0) * 50);
  ELSE
    v_final := LEAST(GREATEST(NEW.price::INTEGER, v_min_price::INTEGER), v_max_price::INTEGER);
  END IF;

  NEW.price := v_final;

  -- Driver commission (lookup phase; default 0% for new drivers)
  SELECT COALESCE(override_pct, commission_pct) INTO v_driver_pct
  FROM public.driver_commission_phases
  WHERE driver_id = NEW.driver_id;

  IF v_driver_pct IS NULL THEN v_driver_pct := 0; END IF;

  NEW.commission      := ROUND(v_final * v_driver_pct / 100.0);
  NEW.driver_earnings := v_final - NEW.commission;

  -- Store surge multiplier used
  NEW.surge_multiplier := v_surge;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trip_pricing_guard ON public.trips;
CREATE TRIGGER trip_pricing_guard
  BEFORE INSERT ON public.trips
  FOR EACH ROW EXECUTE FUNCTION public.enforce_trip_pricing();

-- Add missing columns to trips (idempotent)
ALTER TABLE public.trips
  ADD COLUMN IF NOT EXISTS city_id          INTEGER     REFERENCES public.cities(id),
  ADD COLUMN IF NOT EXISTS surge_multiplier NUMERIC(4,2) DEFAULT 1.0,
  ADD COLUMN IF NOT EXISTS speed_tier       TEXT         DEFAULT 'normal',
  ADD COLUMN IF NOT EXISTS duration_min     NUMERIC(6,1);

-- ─── SECURITY DEFINER RPCs (called from Dashboard) ────────────────────────────

-- 1. Get all active cities
CREATE OR REPLACE FUNCTION public.rpc_get_cities()
RETURNS TABLE (id INTEGER, name_ar TEXT, name_fr TEXT, wilaya_code SMALLINT, tier TEXT, is_active BOOLEAN)
LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  SELECT id, name_ar, name_fr, wilaya_code, tier::TEXT, is_active
  FROM public.cities
  ORDER BY tier, name_fr;
$$;

-- 2. Get full pricing config
CREATE OR REPLACE FUNCTION public.rpc_get_pricing_config()
RETURNS TABLE (
  id INTEGER, tier TEXT, service_type TEXT,
  base_fare INTEGER, short_km_limit NUMERIC, per_km_rate INTEGER,
  per_min_rate NUMERIC, women_premium_pct NUMERIC, speed_multipliers JSONB,
  updated_at TIMESTAMPTZ
)
LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  SELECT id, tier::TEXT, service_type::TEXT,
         base_fare, short_km_limit, per_km_rate,
         per_min_rate, women_premium_pct, speed_multipliers, updated_at
  FROM public.pricing_config
  ORDER BY tier, service_type;
$$;

-- 3. Upsert a pricing config row
CREATE OR REPLACE FUNCTION public.rpc_upsert_pricing_config(
  p_tier             TEXT,
  p_service_type     TEXT,
  p_base_fare        INTEGER,
  p_short_km_limit   NUMERIC,
  p_per_km_rate      INTEGER,
  p_per_min_rate     NUMERIC,
  p_women_premium_pct NUMERIC,
  p_speed_multipliers JSONB
) RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.pricing_config
    (tier, service_type, base_fare, short_km_limit, per_km_rate,
     per_min_rate, women_premium_pct, speed_multipliers, updated_at)
  VALUES
    (p_tier::city_tier, p_service_type::service_kind,
     p_base_fare, p_short_km_limit, p_per_km_rate,
     p_per_min_rate, p_women_premium_pct, p_speed_multipliers, now())
  ON CONFLICT (tier, service_type) DO UPDATE SET
    base_fare          = EXCLUDED.base_fare,
    short_km_limit     = EXCLUDED.short_km_limit,
    per_km_rate        = EXCLUDED.per_km_rate,
    per_min_rate       = EXCLUDED.per_min_rate,
    women_premium_pct  = EXCLUDED.women_premium_pct,
    speed_multipliers  = EXCLUDED.speed_multipliers,
    updated_at         = now();
END;
$$;

-- 4. Get surge config
CREATE OR REPLACE FUNCTION public.rpc_get_surge_config()
RETURNS TABLE (
  id INTEGER, trigger_type TEXT, label_ar TEXT, label_fr TEXT,
  multiplier NUMERIC, is_auto BOOLEAN, start_hour SMALLINT, end_hour SMALLINT,
  is_calendar BOOLEAN, is_enabled BOOLEAN, updated_at TIMESTAMPTZ
)
LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  SELECT id, trigger_type::TEXT, label_ar, label_fr,
         multiplier, is_auto, start_hour, end_hour, is_calendar, is_enabled, updated_at
  FROM public.surge_config
  ORDER BY id;
$$;

-- 5. Update a surge config row
CREATE OR REPLACE FUNCTION public.rpc_upsert_surge_config(
  p_trigger_type TEXT,
  p_multiplier   NUMERIC,
  p_is_enabled   BOOLEAN
) RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE public.surge_config
  SET multiplier = p_multiplier, is_enabled = p_is_enabled, updated_at = now()
  WHERE trigger_type = p_trigger_type::surge_trigger;
END;
$$;

-- 6. Get active surge for a city (used by mobile app / trip creation)
CREATE OR REPLACE FUNCTION public.rpc_get_active_surge(p_city_id INTEGER DEFAULT NULL)
RETURNS NUMERIC
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_auto_surge   NUMERIC := 1.0;
  v_manual_surge NUMERIC := 1.0;
  v_hour         SMALLINT;
  v_cfg          RECORD;
BEGIN
  v_hour := EXTRACT(HOUR FROM now() AT TIME ZONE 'Africa/Algiers');

  -- Time-based auto surges
  FOR v_cfg IN
    SELECT multiplier, start_hour, end_hour
    FROM public.surge_config
    WHERE is_auto = true AND is_enabled = true AND is_calendar = false
      AND start_hour IS NOT NULL
  LOOP
    IF v_cfg.start_hour < v_cfg.end_hour THEN
      -- Normal range (e.g., 7–9)
      IF v_hour >= v_cfg.start_hour AND v_hour < v_cfg.end_hour THEN
        v_auto_surge := GREATEST(v_auto_surge, v_cfg.multiplier);
      END IF;
    ELSE
      -- Overnight range (e.g., 22–5)
      IF v_hour >= v_cfg.start_hour OR v_hour < v_cfg.end_hour THEN
        v_auto_surge := GREATEST(v_auto_surge, v_cfg.multiplier);
      END IF;
    END IF;
  END LOOP;

  -- Manual surge events
  SELECT COALESCE(MAX(multiplier), 1.0) INTO v_manual_surge
  FROM public.surge_events
  WHERE is_active = true
    AND (city_id = p_city_id OR city_id IS NULL)
    AND (ends_at IS NULL OR ends_at > now());

  RETURN GREATEST(v_auto_surge, v_manual_surge);
END;
$$;

-- 7. Toggle manual surge (dashboard "mauvais temps / événement" button)
CREATE OR REPLACE FUNCTION public.rpc_toggle_manual_surge(
  p_trigger_type TEXT,
  p_city_id      INTEGER    DEFAULT NULL,
  p_multiplier   NUMERIC    DEFAULT 1.25,
  p_reason       TEXT       DEFAULT NULL,
  p_ends_at      TIMESTAMPTZ DEFAULT NULL
) RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_existing_id BIGINT;
  v_active      BOOLEAN;
BEGIN
  -- Check if one is already active for this trigger + city
  SELECT id, is_active INTO v_existing_id, v_active
  FROM public.surge_events
  WHERE trigger_type = p_trigger_type::surge_trigger
    AND (city_id = p_city_id OR (city_id IS NULL AND p_city_id IS NULL))
    AND is_active = true
  LIMIT 1;

  IF v_existing_id IS NOT NULL THEN
    -- Deactivate (toggle off)
    UPDATE public.surge_events SET is_active = false WHERE id = v_existing_id;
    RETURN jsonb_build_object('action', 'deactivated', 'id', v_existing_id);
  ELSE
    -- Activate
    INSERT INTO public.surge_events (city_id, trigger_type, multiplier, reason, ends_at)
    VALUES (p_city_id, p_trigger_type::surge_trigger, p_multiplier, p_reason, p_ends_at)
    RETURNING id INTO v_existing_id;
    RETURN jsonb_build_object('action', 'activated', 'id', v_existing_id);
  END IF;
END;
$$;

-- 8. Get driver commission phase
CREATE OR REPLACE FUNCTION public.rpc_get_driver_commission(p_driver_id UUID)
RETURNS TABLE (
  driver_id UUID, commission_pct NUMERIC, override_pct NUMERIC,
  first_trip_at TIMESTAMPTZ, first_100_done_at TIMESTAMPTZ, updated_at TIMESTAMPTZ
)
LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  SELECT driver_id, commission_pct, override_pct, first_trip_at, first_100_done_at, updated_at
  FROM public.driver_commission_phases
  WHERE driver_id = p_driver_id;
$$;

-- 9. Initialize commission phase on driver creation
CREATE OR REPLACE FUNCTION public.init_driver_commission()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  INSERT INTO public.driver_commission_phases (driver_id, commission_pct)
  VALUES (NEW.id, 0.0)
  ON CONFLICT (driver_id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS driver_commission_init ON public.drivers;
CREATE TRIGGER driver_commission_init
  AFTER INSERT ON public.drivers
  FOR EACH ROW EXECUTE FUNCTION public.init_driver_commission();

-- ─── RLS ─────────────────────────────────────────────────────────────────────
-- Cities and pricing_config: public read, no write (all writes via SECURITY DEFINER RPC)

ALTER TABLE public.cities               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pricing_config       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.surge_config         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.surge_events         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.driver_commission_phases ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS cities_read        ON public.cities;
DROP POLICY IF EXISTS pricing_read       ON public.pricing_config;
DROP POLICY IF EXISTS surge_cfg_read     ON public.surge_config;
DROP POLICY IF EXISTS surge_evt_read     ON public.surge_events;
DROP POLICY IF EXISTS commission_self    ON public.driver_commission_phases;

CREATE POLICY cities_read     ON public.cities           FOR SELECT USING (true);
CREATE POLICY pricing_read    ON public.pricing_config   FOR SELECT USING (true);
CREATE POLICY surge_cfg_read  ON public.surge_config     FOR SELECT USING (true);
CREATE POLICY surge_evt_read  ON public.surge_events     FOR SELECT USING (true);
CREATE POLICY commission_self ON public.driver_commission_phases
  FOR SELECT USING (driver_id = auth.uid());

-- Grant execute on all RPCs to anon + authenticated
GRANT EXECUTE ON FUNCTION public.rpc_get_cities()                                               TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.rpc_get_pricing_config()                                       TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.rpc_upsert_pricing_config(TEXT,TEXT,INTEGER,NUMERIC,INTEGER,NUMERIC,NUMERIC,JSONB) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.rpc_get_surge_config()                                         TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.rpc_upsert_surge_config(TEXT,NUMERIC,BOOLEAN)                  TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.rpc_get_active_surge(INTEGER)                                  TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.rpc_toggle_manual_surge(TEXT,INTEGER,NUMERIC,TEXT,TIMESTAMPTZ) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.rpc_get_driver_commission(UUID)                                TO anon, authenticated;
