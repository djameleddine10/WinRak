-- ═══════════════════════════════════════════════════════════════════════════
--  WinRak — Système de parrainage chauffeur (Driver Referral)
--  Run AFTER 20260624_pricing_engine.sql. 100% idempotent.
--
--  Logique :
--    • Chaque chauffeur reçoit un code unique (WIN-XXXXX)
--    • Un nouveau chauffeur entre le code à l'inscription
--    • Après 10 courses complétées par le filleul →
--        le parrain reçoit -5% de commission pendant 30 jours
--        (10%→5%  ou  5%→0%  selon sa phase actuelle)
-- ═══════════════════════════════════════════════════════════════════════════

-- ─── 1. Code de parrainage sur le profil chauffeur ────────────────────────────

ALTER TABLE public.drivers
  ADD COLUMN IF NOT EXISTS referral_code       TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS referral_code_uses  INTEGER NOT NULL DEFAULT 0;

-- Génère un code WIN-XXXXX déterministe à partir de l'UUID
CREATE OR REPLACE FUNCTION public.generate_referral_code(p_driver_id UUID)
RETURNS TEXT LANGUAGE plpgsql AS $$
DECLARE
  v_code TEXT;
BEGIN
  -- Prend les 5 premiers caractères hex du MD5 de l'UUID, en majuscules
  v_code := 'WIN-' || UPPER(SUBSTRING(MD5(p_driver_id::TEXT) FROM 1 FOR 5));
  RETURN v_code;
END;
$$;

-- Trigger : attribue le code automatiquement à chaque nouveau chauffeur
CREATE OR REPLACE FUNCTION public.assign_referral_code()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.referral_code IS NULL THEN
    NEW.referral_code := public.generate_referral_code(NEW.id);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS driver_referral_code_assign ON public.drivers;
CREATE TRIGGER driver_referral_code_assign
  BEFORE INSERT ON public.drivers
  FOR EACH ROW EXECUTE FUNCTION public.assign_referral_code();

-- Backfill : génère les codes pour les chauffeurs existants
UPDATE public.drivers
SET referral_code = public.generate_referral_code(id)
WHERE referral_code IS NULL;

-- ─── 2. Table driver_referrals ────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.driver_referrals (
  id                  BIGSERIAL     PRIMARY KEY,
  referrer_id         UUID          NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  referred_id         UUID          NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status              TEXT          NOT NULL DEFAULT 'pending'
                                    CHECK (status IN ('pending','rewarded','cancelled')),
  referred_trips_done INTEGER       NOT NULL DEFAULT 0,
  trips_required      INTEGER       NOT NULL DEFAULT 10,
  reward_granted_at   TIMESTAMPTZ,
  created_at          TIMESTAMPTZ   NOT NULL DEFAULT now(),
  UNIQUE (referred_id)   -- chaque filleul ne peut avoir qu'un seul parrain
);

-- ─── 3. Colonnes de remise dans driver_commission_phases ──────────────────────

ALTER TABLE public.driver_commission_phases
  ADD COLUMN IF NOT EXISTS discount_pct   NUMERIC(4,1) NOT NULL DEFAULT 0.0,
  ADD COLUMN IF NOT EXISTS discount_until TIMESTAMPTZ;

-- ─── 4. Trigger : octroie la remise après 10 courses du filleul ───────────────

CREATE OR REPLACE FUNCTION public.check_referral_reward()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE
  v_referral     RECORD;
  v_trip_count   INTEGER;
BEGIN
  -- Intéresse uniquement les courses qui viennent d'être complétées
  IF NEW.status <> 'completed' OR OLD.status = 'completed' THEN
    RETURN NEW;
  END IF;

  -- Le filleul a-t-il un parrain en attente ?
  SELECT * INTO v_referral
  FROM public.driver_referrals
  WHERE referred_id = NEW.driver_id AND status = 'pending'
  LIMIT 1;

  IF NOT FOUND THEN RETURN NEW; END IF;

  -- Compter les courses complétées du filleul
  SELECT COUNT(*) INTO v_trip_count
  FROM public.trips
  WHERE driver_id = NEW.driver_id AND status = 'completed';

  -- Mise à jour du compteur
  UPDATE public.driver_referrals
  SET referred_trips_done = v_trip_count
  WHERE id = v_referral.id;

  -- Seuil atteint → octroyer la remise au parrain
  IF v_trip_count >= v_referral.trips_required THEN

    -- Marquer le parrainage comme récompensé
    UPDATE public.driver_referrals
    SET status = 'rewarded', reward_granted_at = now()
    WHERE id = v_referral.id;

    -- Incrémenter le compteur d'utilisations du code du parrain
    UPDATE public.drivers
    SET referral_code_uses = referral_code_uses + 1
    WHERE id = v_referral.referrer_id;

    -- Appliquer -5% pendant 30 jours au parrain
    -- Si une remise est déjà active, on prolonge la durée
    INSERT INTO public.driver_commission_phases (driver_id, commission_pct, discount_pct, discount_until)
    VALUES (v_referral.referrer_id, 0.0, 5.0, now() + INTERVAL '30 days')
    ON CONFLICT (driver_id) DO UPDATE SET
      discount_pct   = 5.0,
      discount_until = GREATEST(
                         public.driver_commission_phases.discount_until,
                         now() + INTERVAL '30 days'
                       ),
      updated_at     = now();

  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS referral_reward_check ON public.trips;
CREATE TRIGGER referral_reward_check
  AFTER UPDATE ON public.trips
  FOR EACH ROW EXECUTE FUNCTION public.check_referral_reward();

-- ─── 5. Mettre à jour enforce_trip_pricing pour appliquer la remise ───────────

CREATE OR REPLACE FUNCTION public.enforce_trip_pricing()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE
  cfg            RECORD;
  v_tier         city_tier;
  v_service      service_kind;
  v_extra_km     NUMERIC;
  v_base         NUMERIC;
  v_surge        NUMERIC := 1.0;
  v_fair         NUMERIC;
  v_min_price    NUMERIC;
  v_max_price    NUMERIC;
  v_final        INTEGER;
  v_commission_pct  NUMERIC := 0;
  v_discount_pct    NUMERIC := 0;
  v_effective_pct   NUMERIC := 0;
BEGIN
  -- Résoudre le tier depuis city_id
  IF NEW.city_id IS NOT NULL THEN
    SELECT tier INTO v_tier FROM public.cities WHERE id = NEW.city_id;
  END IF;
  IF v_tier IS NULL THEN v_tier := 'B'; END IF;

  -- Résoudre le type de service
  v_service := CASE NEW.vehicle_type
    WHEN 'women'    THEN 'women'::service_kind
    WHEN 'delivery' THEN 'delivery'::service_kind
    WHEN 'medicine' THEN 'medicine'::service_kind
    WHEN 'food'     THEN 'food'::service_kind
    ELSE 'ride'::service_kind
  END;

  -- Config tarifaire
  SELECT * INTO cfg FROM public.pricing_config
  WHERE tier = v_tier AND service_type = v_service;

  IF NOT FOUND THEN
    cfg.base_fare      := 250;
    cfg.short_km_limit := 2.0;
    cfg.per_km_rate    := 30;
    cfg.per_min_rate   := 3.0;
    cfg.women_premium_pct := 0;
  END IF;

  -- Prix équitable
  v_extra_km := GREATEST(0, COALESCE(NEW.distance_km, 0) - cfg.short_km_limit);
  v_base := cfg.base_fare
            + v_extra_km * cfg.per_km_rate
            + COALESCE(NEW.duration_min, 0) * cfg.per_min_rate;

  IF v_service = 'women' THEN
    v_base := v_base * (1 + cfg.women_premium_pct / 100.0);
  END IF;

  -- Surge actif
  SELECT COALESCE(MAX(multiplier), 1.0) INTO v_surge
  FROM public.surge_events
  WHERE is_active = true
    AND (city_id = NEW.city_id OR city_id IS NULL)
    AND (ends_at IS NULL OR ends_at > now());

  v_fair := v_base * v_surge;

  -- Borner le prix proposé par le client à ±30%
  v_min_price := ROUND(v_fair * 0.70 / 50.0) * 50;
  v_max_price := ROUND(v_fair * 1.30 / 50.0) * 50;

  IF NEW.price IS NULL THEN
    v_final := GREATEST(cfg.base_fare, ROUND(v_fair / 50.0) * 50);
  ELSE
    v_final := LEAST(GREATEST(NEW.price::INTEGER, v_min_price::INTEGER), v_max_price::INTEGER);
  END IF;

  NEW.price := v_final;

  -- Commission effective = phase% - remise% (min 0), sauf si override
  SELECT
    COALESCE(override_pct, commission_pct),
    CASE WHEN discount_until > now() THEN discount_pct ELSE 0 END
  INTO v_commission_pct, v_discount_pct
  FROM public.driver_commission_phases
  WHERE driver_id = NEW.driver_id;

  IF v_commission_pct IS NULL THEN v_commission_pct := 0; END IF;
  v_effective_pct := GREATEST(0, v_commission_pct - v_discount_pct);

  NEW.commission      := ROUND(v_final * v_effective_pct / 100.0);
  NEW.driver_earnings := v_final - NEW.commission;
  NEW.surge_multiplier := v_surge;

  RETURN NEW;
END;
$$;

-- ─── 6. RPCs SECURITY DEFINER ─────────────────────────────────────────────────

-- Résoudre un code parrain → retourne referrer_id
CREATE OR REPLACE FUNCTION public.rpc_resolve_referral_code(p_code TEXT)
RETURNS UUID
LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  SELECT id FROM public.drivers WHERE referral_code = UPPER(TRIM(p_code)) LIMIT 1;
$$;

-- Enregistrer un parrainage à l'inscription du filleul
CREATE OR REPLACE FUNCTION public.rpc_register_referral(
  p_referred_id  UUID,
  p_referral_code TEXT
) RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_referrer_id UUID;
BEGIN
  -- Résoudre le code
  SELECT id INTO v_referrer_id
  FROM public.drivers
  WHERE referral_code = UPPER(TRIM(p_referral_code));

  IF v_referrer_id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Code invalide');
  END IF;

  IF v_referrer_id = p_referred_id THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Auto-parrainage interdit');
  END IF;

  INSERT INTO public.driver_referrals (referrer_id, referred_id)
  VALUES (v_referrer_id, p_referred_id)
  ON CONFLICT (referred_id) DO NOTHING;

  RETURN jsonb_build_object('ok', true, 'referrer_id', v_referrer_id);
END;
$$;

-- Stats de parrainage d'un chauffeur (dashboard + mobile)
CREATE OR REPLACE FUNCTION public.rpc_get_referral_stats(p_driver_id UUID)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_code         TEXT;
  v_total        INTEGER;
  v_rewarded     INTEGER;
  v_pending      INTEGER;
  v_discount_pct NUMERIC;
  v_discount_until TIMESTAMPTZ;
  v_result       JSONB;
BEGIN
  SELECT referral_code INTO v_code FROM public.drivers WHERE id = p_driver_id;

  SELECT
    COUNT(*),
    COUNT(*) FILTER (WHERE status = 'rewarded'),
    COUNT(*) FILTER (WHERE status = 'pending')
  INTO v_total, v_rewarded, v_pending
  FROM public.driver_referrals WHERE referrer_id = p_driver_id;

  SELECT
    CASE WHEN discount_until > now() THEN discount_pct ELSE 0 END,
    CASE WHEN discount_until > now() THEN discount_until ELSE NULL END
  INTO v_discount_pct, v_discount_until
  FROM public.driver_commission_phases
  WHERE driver_id = p_driver_id;

  -- Filleuls en attente avec leur progression
  SELECT jsonb_build_object(
    'referral_code',    v_code,
    'total_referrals',  COALESCE(v_total, 0),
    'rewarded',         COALESCE(v_rewarded, 0),
    'pending',          COALESCE(v_pending, 0),
    'active_discount',  COALESCE(v_discount_pct, 0),
    'discount_until',   v_discount_until,
    'referrals', (
      SELECT jsonb_agg(jsonb_build_object(
        'referred_id',    r.referred_id,
        'status',         r.status,
        'trips_done',     r.referred_trips_done,
        'trips_required', r.trips_required,
        'reward_at',      r.reward_granted_at
      ) ORDER BY r.created_at DESC)
      FROM public.driver_referrals r
      WHERE r.referrer_id = p_driver_id
    )
  ) INTO v_result;

  RETURN v_result;
END;
$$;

-- Liste de tous les parrainages (dashboard admin)
CREATE OR REPLACE FUNCTION public.rpc_dash_referrals(p_limit INTEGER DEFAULT 100)
RETURNS TABLE (
  referrer_id   UUID, referrer_name TEXT, referral_code TEXT,
  referred_id   UUID, referred_name TEXT,
  status        TEXT, trips_done INTEGER, trips_required INTEGER,
  reward_at     TIMESTAMPTZ, created_at TIMESTAMPTZ
)
LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  SELECT
    r.referrer_id,
    pr.full_name   AS referrer_name,
    d.referral_code,
    r.referred_id,
    pf.full_name   AS referred_name,
    r.status,
    r.referred_trips_done,
    r.trips_required,
    r.reward_granted_at,
    r.created_at
  FROM public.driver_referrals r
  JOIN public.profiles pr ON pr.id = r.referrer_id
  JOIN public.profiles pf ON pf.id = r.referred_id
  JOIN public.drivers  d  ON d.id  = r.referrer_id
  ORDER BY r.created_at DESC
  LIMIT p_limit;
$$;

-- ─── 7. RLS ───────────────────────────────────────────────────────────────────

ALTER TABLE public.driver_referrals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS referral_own ON public.driver_referrals;
CREATE POLICY referral_own ON public.driver_referrals
  FOR SELECT USING (referrer_id = auth.uid() OR referred_id = auth.uid());

GRANT EXECUTE ON FUNCTION public.rpc_resolve_referral_code(TEXT)          TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.rpc_register_referral(UUID, TEXT)        TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.rpc_get_referral_stats(UUID)             TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.rpc_dash_referrals(INTEGER)              TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.generate_referral_code(UUID)             TO anon, authenticated;
