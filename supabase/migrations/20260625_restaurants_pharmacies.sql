-- Drop old tables (incompatible types from earlier attempts) and recreate clean.
DROP TABLE IF EXISTS restaurant_menu_items CASCADE;
DROP TABLE IF EXISTS menu_items CASCADE;
DROP TABLE IF EXISTS restaurants CASCADE;
DROP TABLE IF EXISTS pharmacies CASCADE;

-- ============================================================
-- Restaurants
-- ============================================================
CREATE TABLE restaurants (
  id           uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name         text        NOT NULL,
  cuisine      text        NOT NULL DEFAULT 'fastfood',
  area         text        NOT NULL DEFAULT '',
  rating       numeric     NOT NULL DEFAULT 5.0,
  eta_min      integer     NOT NULL DEFAULT 30,
  delivery_fee integer     NOT NULL DEFAULT 150,
  is_open      boolean     NOT NULL DEFAULT true,
  is_active    boolean     NOT NULL DEFAULT true,
  phone        text        NOT NULL DEFAULT '',
  reception    text        NOT NULL DEFAULT 'الاستقبال',
  icon         text        NOT NULL DEFAULT 'food',
  created_at   timestamptz NOT NULL DEFAULT now()
);

-- cuisine values: fastfood | pizza | grill | traditional | seafood | sweets

-- ============================================================
-- Menu items
-- ============================================================
CREATE TABLE restaurant_menu_items (
  id            uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  restaurant_id uuid NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  name          text    NOT NULL,
  price         integer NOT NULL DEFAULT 0,
  created_at    timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- Pharmacies
-- ============================================================
CREATE TABLE pharmacies (
  id           uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name         text        NOT NULL,
  area         text        NOT NULL DEFAULT '',
  distance_km  numeric     NOT NULL DEFAULT 0,
  eta_min      integer     NOT NULL DEFAULT 30,
  rating       numeric     NOT NULL DEFAULT 5.0,
  delivery_fee integer     NOT NULL DEFAULT 150,
  open_24h     boolean     NOT NULL DEFAULT false,
  open_now     boolean     NOT NULL DEFAULT false,
  created_at   timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- RLS — public read, admin writes via Table Editor
-- ============================================================
ALTER TABLE restaurants           ENABLE ROW LEVEL SECURITY;
ALTER TABLE restaurant_menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE pharmacies            ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anyone can read restaurants"
  ON restaurants FOR SELECT USING (true);

CREATE POLICY "anyone can read menu items"
  ON restaurant_menu_items FOR SELECT USING (true);

CREATE POLICY "anyone can read pharmacies"
  ON pharmacies FOR SELECT USING (true);
