-- ═══════════════════════════════════════════════════════════════════
--  WinRak — Schéma PostgreSQL complet (à exécuter dans Supabase SQL Editor)
--  Ordre d'exécution : ce fichier en entier, puis rls.sql, puis seed.sql
-- ═══════════════════════════════════════════════════════════════════

-- Extension UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─── SÉQUENCES ───────────────────────────────────────────────────────
CREATE SEQUENCE IF NOT EXISTS trip_counter  START 1270 INCREMENT 1;
CREATE SEQUENCE IF NOT EXISTS txn_counter   START 8836 INCREMENT 1;
CREATE SEQUENCE IF NOT EXISTS payout_counter START 1001 INCREMENT 1;

-- ─── PROFILES (extension de auth.users) ──────────────────────────────
-- Supabase Auth gère l'authentification. Cette table stocke les données métier.
CREATE TABLE IF NOT EXISTS public.profiles (
  id           UUID        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  phone        TEXT        UNIQUE,
  role         TEXT        NOT NULL CHECK (role IN ('passenger', 'driver', 'admin')),
  full_name    TEXT,
  full_name_ar TEXT,
  avatar_url   TEXT,
  is_active    BOOLEAN     DEFAULT TRUE,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);

-- ─── PASSENGERS ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.passengers (
  id          UUID        PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  rating      DECIMAL(2,1) DEFAULT 5.0 CHECK (rating BETWEEN 1 AND 5),
  total_trips INTEGER     DEFAULT 0,
  total_spent INTEGER     DEFAULT 0  -- DZD centimes
);

-- ─── DRIVERS ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.drivers (
  id               UUID         PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  vehicle_make     TEXT,
  vehicle_model    TEXT,
  vehicle_year     INTEGER,
  vehicle_plate    TEXT         UNIQUE,
  vehicle_type     TEXT         CHECK (vehicle_type IN ('economique','confort','she','intercites')),
  vehicle_color    TEXT,
  rating           DECIMAL(2,1) DEFAULT 5.0 CHECK (rating BETWEEN 1 AND 5),
  total_trips      INTEGER      DEFAULT 0,
  total_earnings   INTEGER      DEFAULT 0,  -- DZD
  wallet_balance   INTEGER      DEFAULT 0,  -- DZD (solde disponible)
  status           TEXT         DEFAULT 'offline' CHECK (status IN ('online','offline','on_trip')),
  current_lat      REAL,
  current_lng      REAL,
  is_verified      BOOLEAN      DEFAULT FALSE,
  verified_at      TIMESTAMPTZ,
  verified_by      UUID         REFERENCES public.profiles(id)
);

-- ─── DRIVER DOCUMENTS ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.driver_documents (
  id            UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
  driver_id     UUID         NOT NULL REFERENCES public.drivers(id) ON DELETE CASCADE,
  type          TEXT         NOT NULL CHECK (type IN ('permis','carte_grise','vehicle_front','vehicle_rear','selfie')),
  file_url      TEXT         NOT NULL,   -- URL Supabase Storage
  file_name     TEXT,
  file_size     INTEGER,                 -- octets
  mime_type     TEXT,
  status        TEXT         DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  reject_reason TEXT,
  reviewed_by   UUID         REFERENCES public.profiles(id),
  reviewed_at   TIMESTAMPTZ,
  uploaded_at   TIMESTAMPTZ  DEFAULT NOW()
);

-- ─── DRIVER LOCATIONS (temps réel) ────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.driver_locations (
  driver_id  UUID    PRIMARY KEY REFERENCES public.drivers(id) ON DELETE CASCADE,
  lat        REAL    NOT NULL,
  lng        REAL    NOT NULL,
  heading    REAL    DEFAULT 0,
  speed      REAL    DEFAULT 0,   -- km/h
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── TRIPS ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.trips (
  id               UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
  trip_code        TEXT         UNIQUE NOT NULL,
  passenger_id     UUID         NOT NULL REFERENCES public.passengers(id),
  driver_id        UUID         REFERENCES public.drivers(id),
  from_address     TEXT         NOT NULL,
  from_lat         REAL         NOT NULL,
  from_lng         REAL         NOT NULL,
  to_address       TEXT         NOT NULL,
  to_lat           REAL         NOT NULL,
  to_lng           REAL         NOT NULL,
  distance_km      DECIMAL(6,2),
  duration_min     INTEGER,
  price            INTEGER,               -- DZD
  commission       INTEGER,               -- 12% WinRak
  driver_earnings  INTEGER,               -- 88%
  vehicle_type     TEXT,
  payment_method   TEXT         CHECK (payment_method IN ('cib','edahabia','cash')),
  status           TEXT         DEFAULT 'pending'
                   CHECK (status IN ('pending','accepted','in_progress','completed','cancelled')),
  cancel_reason    TEXT,
  passenger_rating INTEGER      CHECK (passenger_rating BETWEEN 1 AND 5),
  driver_rating    INTEGER      CHECK (driver_rating BETWEEN 1 AND 5),
  started_at       TIMESTAMPTZ,
  completed_at     TIMESTAMPTZ,
  created_at       TIMESTAMPTZ  DEFAULT NOW()
);

-- ─── TRANSACTIONS ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.transactions (
  id              UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
  txn_code        TEXT         UNIQUE NOT NULL,
  trip_id         UUID         NOT NULL REFERENCES public.trips(id),
  passenger_id    UUID         NOT NULL REFERENCES public.passengers(id),
  driver_id       UUID         NOT NULL REFERENCES public.drivers(id),
  amount          INTEGER      NOT NULL,  -- total DZD
  commission      INTEGER      NOT NULL,  -- part WinRak
  driver_amount   INTEGER      NOT NULL,  -- part chauffeur
  payment_method  TEXT         NOT NULL,
  status          TEXT         DEFAULT 'completed'
                  CHECK (status IN ('pending','completed','refunded')),
  created_at      TIMESTAMPTZ  DEFAULT NOW()
);

-- ─── DRIVER PAYOUTS (retraits du portefeuille) ────────────────────────
CREATE TABLE IF NOT EXISTS public.driver_payouts (
  id           UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
  payout_code  TEXT         UNIQUE NOT NULL,
  driver_id    UUID         NOT NULL REFERENCES public.drivers(id),
  amount       INTEGER      NOT NULL,   -- DZD
  method       TEXT         NOT NULL CHECK (method IN ('cib','edahabia','virement','cash')),
  bank_rib     TEXT,
  status       TEXT         DEFAULT 'pending'
               CHECK (status IN ('pending','processing','completed','rejected')),
  processed_by UUID         REFERENCES public.profiles(id),
  processed_at TIMESTAMPTZ,
  notes        TEXT,
  created_at   TIMESTAMPTZ  DEFAULT NOW()
);

-- ─── NOTIFICATIONS ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.notifications (
  id         UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID         NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title      TEXT         NOT NULL,
  body       TEXT         NOT NULL,
  type       TEXT         NOT NULL
             CHECK (type IN ('trip_request','trip_update','doc_approved','doc_rejected','payment','payout','system')),
  data       JSONB        DEFAULT '{}',
  is_read    BOOLEAN      DEFAULT FALSE,
  created_at TIMESTAMPTZ  DEFAULT NOW()
);

-- ═══════════════════════════════════════════════════════════════════
--  FONCTIONS & TRIGGERS
-- ═══════════════════════════════════════════════════════════════════

-- Auto-génération du code de trajet
CREATE OR REPLACE FUNCTION generate_trip_code()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.trip_code := 'TR-' || nextval('trip_counter')::TEXT;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER set_trip_code
  BEFORE INSERT ON public.trips
  FOR EACH ROW WHEN (NEW.trip_code IS NULL)
  EXECUTE FUNCTION generate_trip_code();

-- Auto-génération du code de transaction
CREATE OR REPLACE FUNCTION generate_txn_code()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.txn_code := 'TXN-' || nextval('txn_counter')::TEXT;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER set_txn_code
  BEFORE INSERT ON public.transactions
  FOR EACH ROW WHEN (NEW.txn_code IS NULL)
  EXECUTE FUNCTION generate_txn_code();

-- Auto-génération du code de retrait
CREATE OR REPLACE FUNCTION generate_payout_code()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.payout_code := 'PAY-' || nextval('payout_counter')::TEXT;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER set_payout_code
  BEFORE INSERT ON public.driver_payouts
  FOR EACH ROW WHEN (NEW.payout_code IS NULL)
  EXECUTE FUNCTION generate_payout_code();

-- Mise à jour automatique de updated_at
CREATE OR REPLACE FUNCTION touch_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION touch_updated_at();

-- Mise à jour stats chauffeur + passager à la fin de course
CREATE OR REPLACE FUNCTION on_trip_completed()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF NEW.status = 'completed' AND OLD.status <> 'completed' THEN
    -- Statistiques chauffeur
    UPDATE public.drivers SET
      total_trips    = total_trips + 1,
      total_earnings = total_earnings + COALESCE(NEW.driver_earnings, 0),
      wallet_balance = wallet_balance + COALESCE(NEW.driver_earnings, 0),
      status         = 'online'
    WHERE id = NEW.driver_id;

    -- Statistiques passager
    UPDATE public.passengers SET
      total_trips = total_trips + 1,
      total_spent = total_spent + COALESCE(NEW.price, 0)
    WHERE id = NEW.passenger_id;
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER after_trip_complete
  AFTER UPDATE ON public.trips
  FOR EACH ROW EXECUTE FUNCTION on_trip_completed();

-- Vérification driver : quand tous les docs sont approuvés → is_verified = true
CREATE OR REPLACE FUNCTION check_driver_verification()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  doc_count INTEGER;
  approved_count INTEGER;
BEGIN
  IF NEW.status = 'approved' THEN
    SELECT COUNT(*) INTO doc_count
      FROM public.driver_documents WHERE driver_id = NEW.driver_id;
    SELECT COUNT(*) INTO approved_count
      FROM public.driver_documents WHERE driver_id = NEW.driver_id AND status = 'approved';
    IF doc_count >= 4 AND approved_count = doc_count THEN
      UPDATE public.drivers SET
        is_verified = TRUE,
        verified_at = NOW(),
        verified_by = NEW.reviewed_by
      WHERE id = NEW.driver_id;
      -- Notification au chauffeur
      INSERT INTO public.notifications (user_id, title, body, type, data)
      VALUES (
        NEW.driver_id,
        'Dossier approuvé ✓',
        'Félicitations ! Votre dossier a été validé. Vous pouvez démarrer le service.',
        'doc_approved',
        jsonb_build_object('driver_id', NEW.driver_id)
      );
    END IF;
  ELSIF NEW.status = 'rejected' THEN
    -- Notification de refus
    INSERT INTO public.notifications (user_id, title, body, type, data)
    VALUES (
      NEW.driver_id,
      'Document refusé',
      COALESCE(NEW.reject_reason, 'Un document a été refusé. Veuillez le soumettre à nouveau.'),
      'doc_rejected',
      jsonb_build_object('doc_type', NEW.type, 'reason', NEW.reject_reason)
    );
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER after_doc_reviewed
  AFTER UPDATE ON public.driver_documents
  FOR EACH ROW EXECUTE FUNCTION check_driver_verification();

-- ═══════════════════════════════════════════════════════════════════
--  VUES UTILES
-- ═══════════════════════════════════════════════════════════════════

-- Vue chauffeurs avec profil complet
CREATE OR REPLACE VIEW public.drivers_full AS
SELECT
  d.id,
  p.full_name,
  p.full_name_ar,
  p.phone,
  p.avatar_url,
  p.is_active,
  d.vehicle_make,
  d.vehicle_model,
  d.vehicle_year,
  d.vehicle_plate,
  d.vehicle_type,
  d.vehicle_color,
  d.rating,
  d.total_trips,
  d.total_earnings,
  d.wallet_balance,
  d.status,
  d.current_lat,
  d.current_lng,
  d.is_verified,
  d.verified_at,
  p.created_at
FROM public.drivers d
JOIN public.profiles p ON d.id = p.id;

-- Vue passagers avec profil complet
CREATE OR REPLACE VIEW public.passengers_full AS
SELECT
  ps.id,
  p.full_name,
  p.full_name_ar,
  p.phone,
  p.avatar_url,
  p.is_active,
  ps.rating,
  ps.total_trips,
  ps.total_spent,
  p.created_at
FROM public.passengers ps
JOIN public.profiles p ON ps.id = p.id;

-- Vue trips avec noms passager + chauffeur
CREATE OR REPLACE VIEW public.trips_full AS
SELECT
  t.*,
  pp.full_name   AS passenger_name,
  pp.phone       AS passenger_phone,
  dp.full_name   AS driver_name,
  dp.phone       AS driver_phone,
  d.vehicle_make,
  d.vehicle_model,
  d.vehicle_plate
FROM public.trips t
JOIN public.passengers ps ON t.passenger_id = ps.id
JOIN public.profiles pp   ON ps.id = pp.id
LEFT JOIN public.drivers d  ON t.driver_id = d.id
LEFT JOIN public.profiles dp ON d.id = dp.id;

-- Résumé financier par mois
CREATE OR REPLACE VIEW public.finance_monthly AS
SELECT
  DATE_TRUNC('month', created_at) AS month,
  COUNT(*)                         AS trip_count,
  SUM(amount)                      AS total_revenue,
  SUM(commission)                  AS total_commission,
  SUM(driver_amount)               AS total_driver_earnings,
  AVG(amount)                      AS avg_trip_price
FROM public.transactions
WHERE status = 'completed'
GROUP BY 1
ORDER BY 1 DESC;

-- Résumé documents en attente
CREATE OR REPLACE VIEW public.pending_docs_view AS
SELECT
  dd.id,
  dd.driver_id,
  p.full_name,
  p.full_name_ar,
  p.phone,
  dr.vehicle_make,
  dr.vehicle_model,
  dr.vehicle_plate,
  dr.vehicle_type,
  dd.type,
  dd.file_url,
  dd.file_name,
  dd.status,
  dd.reject_reason,
  dd.uploaded_at
FROM public.driver_documents dd
JOIN public.profiles p  ON dd.driver_id = p.id
JOIN public.drivers dr  ON dd.driver_id = dr.id
ORDER BY dd.uploaded_at DESC;
