-- ═══════════════════════════════════════════════════════════════════════════
--  WinRak — Restaurants & Menu Items
--  100% idempotent. No seed data — real restaurants added via app or dashboard.
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
  name          TEXT    NOT NULL,   -- plain Arabic/French text
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
          json_build_object('id', m.id, 'name', m.name, 'price', m.price)
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
