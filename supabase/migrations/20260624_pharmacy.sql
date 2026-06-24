-- ═══════════════════════════════════════════════════════════════════════════
--  WinRak — Pharmacies & Medicines
--  100% idempotent. Seeds the 5 mock pharmacies + 13 OTC medicines.
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.pharmacies (
  id           TEXT         PRIMARY KEY,
  name         TEXT         NOT NULL,
  area         TEXT         NOT NULL,
  distance_km  NUMERIC(4,1) NOT NULL DEFAULT 0,
  eta_min      INTEGER      NOT NULL DEFAULT 20,
  rating       NUMERIC(3,1) NOT NULL DEFAULT 4.5,
  delivery_fee INTEGER      NOT NULL DEFAULT 150,
  open_24h     BOOLEAN      NOT NULL DEFAULT false,
  open_now     BOOLEAN      NOT NULL DEFAULT true,
  status       TEXT         NOT NULL DEFAULT 'active'
);

CREATE TABLE IF NOT EXISTS public.medicines (
  id            TEXT    PRIMARY KEY,
  name_key      TEXT    NOT NULL,
  detail_key    TEXT    NOT NULL,
  category      TEXT    NOT NULL,  -- pain | cold | digestive | firstaid | baby | vitamins
  price         INTEGER NOT NULL,
  icon          TEXT    NOT NULL,
  rx            BOOLEAN NOT NULL DEFAULT false,
  is_available  BOOLEAN NOT NULL DEFAULT true
);

-- ─── RLS ─────────────────────────────────────────────────────────────────────
ALTER TABLE public.pharmacies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medicines  ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS pharmacies_read ON public.pharmacies;
DROP POLICY IF EXISTS medicines_read  ON public.medicines;

CREATE POLICY pharmacies_read ON public.pharmacies FOR SELECT USING (status = 'active');
CREATE POLICY medicines_read  ON public.medicines  FOR SELECT USING (true);

-- ─── Seed pharmacies ─────────────────────────────────────────────────────────
INSERT INTO public.pharmacies (id, name, area, distance_km, eta_min, rating, delivery_fee, open_24h, open_now) VALUES
  ('ph01', 'صيدلية الشفاء',        'ديدوش مراد، الجزائر', 1.2, 15, 4.9, 120, true,  true),
  ('ph02', 'صيدلية النور الليلية', 'الحراش، الجزائر',     3.4, 25, 4.7, 180, true,  true),
  ('ph03', 'صيدلية السلام',        'باب الوادي، الجزائر', 2.1, 20, 4.6, 150, false, true),
  ('ph04', 'صيدلية الأمل',         'بئر مراد رايس',       4.0, 28, 4.5, 200, true,  true),
  ('ph05', 'صيدلية الحياة',        'القبة، الجزائر',      5.2, 35, 4.4, 220, false, false)
ON CONFLICT (id) DO NOTHING;

-- ─── Seed medicines (OTC — no prescription) ──────────────────────────────────
INSERT INTO public.medicines (id, name_key, detail_key, category, price, icon, rx) VALUES
  ('m01', 'med.m01', 'med.m01.d', 'pain',      120,  'pill',               false),
  ('m02', 'med.m02', 'med.m02.d', 'pain',      180,  'pill',               false),
  ('m03', 'med.m03', 'med.m03.d', 'cold',      350,  'bottle-tonic',       false),
  ('m04', 'med.m04', 'med.m04.d', 'cold',      300,  'spray',              false),
  ('m05', 'med.m05', 'med.m05.d', 'digestive', 250,  'stomach',            false),
  ('m06', 'med.m06', 'med.m06.d', 'digestive', 120,  'cup-water',          false),
  ('m07', 'med.m07', 'med.m07.d', 'firstaid',  150,  'bandage',            false),
  ('m08', 'med.m08', 'med.m08.d', 'firstaid',  1200, 'thermometer',        false),
  ('m09', 'med.m09', 'med.m09.d', 'firstaid',  200,  'bottle-tonic-plus',  false),
  ('m10', 'med.m10', 'med.m10.d', 'firstaid',  400,  'face-mask',          false),
  ('m11', 'med.m11', 'med.m11.d', 'baby',      750,  'baby-bottle-outline', false),
  ('m12', 'med.m12', 'med.m12.d', 'vitamins',  450,  'leaf',               false),
  ('m13', 'med.m13', 'med.m13.d', 'vitamins',  500,  'leaf',               false)
ON CONFLICT (id) DO NOTHING;

-- ─── RPC: pharmacies (camelCase keys match TS Pharmacy interface) ─────────────
CREATE OR REPLACE FUNCTION public.get_pharmacies()
RETURNS JSON LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  SELECT COALESCE(json_agg(
    json_build_object(
      'id',          p.id,
      'name',        p.name,
      'area',        p.area,
      'distanceKm',  p.distance_km,
      'etaMin',      p.eta_min,
      'rating',      p.rating,
      'deliveryFee', p.delivery_fee,
      'open24h',     p.open_24h,
      'openNow',     p.open_now
    ) ORDER BY p.distance_km
  ), '[]'::json)
  FROM public.pharmacies p
  WHERE p.status = 'active';
$$;

-- ─── RPC: medicines (camelCase keys match TS Med interface) ──────────────────
CREATE OR REPLACE FUNCTION public.get_medicines()
RETURNS JSON LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  SELECT COALESCE(json_agg(
    json_build_object(
      'id',        m.id,
      'nameKey',   m.name_key,
      'detailKey', m.detail_key,
      'category',  m.category,
      'price',     m.price,
      'icon',      m.icon,
      'rx',        m.rx
    ) ORDER BY m.category, m.id
  ), '[]'::json)
  FROM public.medicines m
  WHERE m.is_available = true;
$$;

GRANT EXECUTE ON FUNCTION public.get_pharmacies() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_medicines()  TO anon, authenticated;
