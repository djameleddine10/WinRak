-- ═══════════════════════════════════════════════════════════════════════════
--  WinRak — Admin write policies for restaurants, menu_items, pharmacies
--  Run AFTER 20260624_restaurants.sql and 20260624_pharmacy.sql
-- ═══════════════════════════════════════════════════════════════════════════

-- Helper: true when the calling user is an admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
  );
$$;

-- ─── Restaurants: admin full access ──────────────────────────────────────────
DROP POLICY IF EXISTS restaurants_admin ON public.restaurants;
CREATE POLICY restaurants_admin ON public.restaurants
  FOR ALL
  USING    (public.is_admin())
  WITH CHECK (public.is_admin());

-- ─── Menu items: admin full access ───────────────────────────────────────────
DROP POLICY IF EXISTS menu_items_admin ON public.menu_items;
CREATE POLICY menu_items_admin ON public.menu_items
  FOR ALL
  USING    (public.is_admin())
  WITH CHECK (public.is_admin());

-- ─── Pharmacies: admin full access ───────────────────────────────────────────
DROP POLICY IF EXISTS pharmacies_admin ON public.pharmacies;
CREATE POLICY pharmacies_admin ON public.pharmacies
  FOR ALL
  USING    (public.is_admin())
  WITH CHECK (public.is_admin());

-- ─── Set admin role on your account ──────────────────────────────────────────
-- Replace the email below with your real email, then run this block once.
-- UPDATE public.profiles SET role = 'admin' WHERE email = 'djameleddinetroudi@gmail.com';
