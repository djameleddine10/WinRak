-- ═══════════════════════════════════════════════════════════════════════════
--  WinRak — Restaurants & Menu Items
--  100% idempotent. Seeds the 5 mock restaurants as real DB rows.
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.restaurants (
  id                TEXT         PRIMARY KEY,
  name              TEXT         NOT NULL,
  cuisine           TEXT         NOT NULL,
  cuisine_label_key TEXT         NOT NULL,
  area              TEXT         NOT NULL,
  rating            NUMERIC(3,1) NOT NULL DEFAULT 5.0,
  eta_min           INTEGER      NOT NULL DEFAULT 30,
  delivery_fee      INTEGER      NOT NULL DEFAULT 150,
  is_open           BOOLEAN      NOT NULL DEFAULT true,
  phone             TEXT,
  reception         TEXT,
  icon              TEXT,
  status            TEXT         NOT NULL DEFAULT 'active',  -- active | pending
  owner_id          UUID         REFERENCES public.profiles(id),
  created_at        TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.menu_items (
  id            TEXT    PRIMARY KEY,
  restaurant_id TEXT    NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  name_key      TEXT    NOT NULL,
  price         INTEGER NOT NULL,
  is_available  BOOLEAN NOT NULL DEFAULT true
);

-- ─── RLS ─────────────────────────────────────────────────────────────────────
ALTER TABLE public.restaurants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menu_items  ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS restaurants_read ON public.restaurants;
DROP POLICY IF EXISTS menu_items_read  ON public.menu_items;

CREATE POLICY restaurants_read ON public.restaurants FOR SELECT USING (status = 'active');
CREATE POLICY menu_items_read  ON public.menu_items  FOR SELECT USING (true);

-- ─── Seed restaurants ────────────────────────────────────────────────────────
INSERT INTO public.restaurants
  (id, name, cuisine, cuisine_label_key, area, rating, eta_min, delivery_fee, is_open, phone, reception, icon)
VALUES
  ('r01', 'مطعم البركة',    'traditional', 'rest.catTraditional', 'الجزائر الوسطى', 4.8, 30, 150, true,  '+213 555 11 22 33', 'سمير',  'pot-steam'),
  ('r02', 'بيتزا روما',     'pizza',       'rest.catPizza',       'حيدرة',          4.7, 25, 180, true,  '+213 555 44 55 66', 'نبيل',  'pizza'),
  ('r03', 'سناك الأصيل',   'fastfood',    'rest.catFastfood',    'باب الزوار',     4.5, 20, 120, true,  '+213 555 77 88 99', 'ياسين', 'hamburger'),
  ('r04', 'مشاوي الفردوس', 'grill',       'rest.catGrill',       'القبة',          4.9, 35, 200, true,  '+213 555 10 20 30', 'كمال',  'grill'),
  ('r05', 'حلويات اللوز',  'sweets',      'rest.catSweets',      'بئر مراد رايس', 4.6, 25, 100, false, '+213 555 40 50 60', 'أمين',  'cupcake')
ON CONFLICT (id) DO NOTHING;

-- ─── Seed menu items ─────────────────────────────────────────────────────────
INSERT INTO public.menu_items (id, restaurant_id, name_key, price) VALUES
  ('r01m1', 'r01', 'rest.r01m1',  800),
  ('r01m2', 'r01', 'rest.r01m2',  650),
  ('r01m3', 'r01', 'rest.r01m3',  200),
  ('r01m4', 'r01', 'rest.r01m4',  300),
  ('r02m1', 'r02', 'rest.r02m1',  700),
  ('r02m2', 'r02', 'rest.r02m2',  950),
  ('r02m3', 'r02', 'rest.r02m3',  600),
  ('r03m1', 'r03', 'rest.r03m1',  450),
  ('r03m2', 'r03', 'rest.r03m2',  350),
  ('r03m3', 'r03', 'rest.r03m3',  600),
  ('r04m1', 'r04', 'rest.r04m1', 1200),
  ('r04m2', 'r04', 'rest.r04m2',  900),
  ('r04m3', 'r04', 'rest.r04m3',  800),
  ('r05m1', 'r05', 'rest.r05m1',  600),
  ('r05m2', 'r05', 'rest.r05m2', 1400),
  ('r05m3', 'r05', 'rest.r05m3',  500)
ON CONFLICT (id) DO NOTHING;

-- ─── RPC: fetch restaurants with menus (camelCase keys match TS interface) ──
CREATE OR REPLACE FUNCTION public.get_restaurants()
RETURNS JSON
LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  SELECT COALESCE(json_agg(r_menu ORDER BY r_menu.rating DESC), '[]'::json)
  FROM (
    SELECT
      r.id,
      r.name,
      r.cuisine,
      r.cuisine_label_key   AS "cuisineLabelKey",
      r.area,
      r.rating,
      r.eta_min             AS "etaMin",
      r.delivery_fee        AS "deliveryFee",
      r.is_open             AS "isOpen",
      r.phone,
      r.reception,
      r.icon,
      COALESCE(
        json_agg(
          json_build_object('id', m.id, 'nameKey', m.name_key, 'price', m.price)
          ORDER BY m.id
        ) FILTER (WHERE m.id IS NOT NULL AND m.is_available = true),
        '[]'::json
      ) AS menu
    FROM public.restaurants r
    LEFT JOIN public.menu_items m ON m.restaurant_id = r.id
    WHERE r.status = 'active'
    GROUP BY r.id, r.name, r.cuisine, r.cuisine_label_key, r.area, r.rating,
             r.eta_min, r.delivery_fee, r.is_open, r.phone, r.reception, r.icon
  ) r_menu;
$$;

GRANT EXECUTE ON FUNCTION public.get_restaurants() TO anon, authenticated;
