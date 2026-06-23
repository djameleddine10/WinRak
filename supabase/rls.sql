-- ═══════════════════════════════════════════════════════════════════
--  WinRak — Row Level Security
--  À exécuter APRÈS schema.sql
-- ═══════════════════════════════════════════════════════════════════

-- Activation RLS sur toutes les tables
ALTER TABLE public.profiles          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.passengers        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.drivers           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.driver_documents  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.driver_locations  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trips             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.driver_payouts    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications     ENABLE ROW LEVEL SECURITY;

-- Fonction helper : est-ce que l'utilisateur courant est admin ?
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
$$;

-- Fonction helper : est-ce que l'utilisateur courant est chauffeur ?
CREATE OR REPLACE FUNCTION public.is_driver()
RETURNS BOOLEAN LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'driver'
  );
$$;

-- ─── PROFILES ─────────────────────────────────────────────────────────
CREATE POLICY "profile_select_own_or_admin" ON public.profiles
  FOR SELECT USING (id = auth.uid() OR public.is_admin());

CREATE POLICY "profile_insert_own" ON public.profiles
  FOR INSERT WITH CHECK (id = auth.uid());

CREATE POLICY "profile_update_own_or_admin" ON public.profiles
  FOR UPDATE USING (id = auth.uid() OR public.is_admin());

-- ─── PASSENGERS ───────────────────────────────────────────────────────
CREATE POLICY "passenger_select" ON public.passengers
  FOR SELECT USING (id = auth.uid() OR public.is_admin());

CREATE POLICY "passenger_insert_own" ON public.passengers
  FOR INSERT WITH CHECK (id = auth.uid());

CREATE POLICY "passenger_update_system" ON public.passengers
  FOR UPDATE USING (public.is_admin());

-- ─── DRIVERS ──────────────────────────────────────────────────────────
CREATE POLICY "driver_select" ON public.drivers
  FOR SELECT USING (id = auth.uid() OR public.is_admin());

CREATE POLICY "driver_insert_own" ON public.drivers
  FOR INSERT WITH CHECK (id = auth.uid());

CREATE POLICY "driver_update_own_or_admin" ON public.drivers
  FOR UPDATE USING (id = auth.uid() OR public.is_admin());

-- ─── DRIVER DOCUMENTS ─────────────────────────────────────────────────
-- Le chauffeur peut voir et uploader ses propres docs
-- L'admin peut tout voir et modifier le statut
CREATE POLICY "doc_select" ON public.driver_documents
  FOR SELECT USING (driver_id = auth.uid() OR public.is_admin());

CREATE POLICY "doc_insert_own" ON public.driver_documents
  FOR INSERT WITH CHECK (driver_id = auth.uid());

CREATE POLICY "doc_update_admin" ON public.driver_documents
  FOR UPDATE USING (public.is_admin());

CREATE POLICY "doc_delete_own_or_admin" ON public.driver_documents
  FOR DELETE USING (driver_id = auth.uid() OR public.is_admin());

-- ─── DRIVER LOCATIONS ─────────────────────────────────────────────────
-- Le chauffeur met à jour sa propre position
-- Tout le monde peut lire les positions (pour la carte passager + dashboard)
CREATE POLICY "location_select_all" ON public.driver_locations
  FOR SELECT USING (TRUE);

CREATE POLICY "location_upsert_own" ON public.driver_locations
  FOR ALL USING (driver_id = auth.uid() OR public.is_admin());

-- ─── TRIPS ────────────────────────────────────────────────────────────
-- Passager voit ses courses, Chauffeur voit ses courses, Admin voit tout
CREATE POLICY "trip_select" ON public.trips
  FOR SELECT USING (
    passenger_id = auth.uid() OR
    driver_id    = auth.uid() OR
    public.is_admin()
  );

CREATE POLICY "trip_insert_passenger" ON public.trips
  FOR INSERT WITH CHECK (passenger_id = auth.uid());

CREATE POLICY "trip_update_driver_or_admin" ON public.trips
  FOR UPDATE USING (
    driver_id = auth.uid() OR
    public.is_admin()
  );

-- ─── TRANSACTIONS ─────────────────────────────────────────────────────
CREATE POLICY "txn_select" ON public.transactions
  FOR SELECT USING (
    passenger_id = auth.uid() OR
    driver_id    = auth.uid() OR
    public.is_admin()
  );

CREATE POLICY "txn_insert_system" ON public.transactions
  FOR INSERT WITH CHECK (public.is_admin());

-- ─── DRIVER PAYOUTS ───────────────────────────────────────────────────
CREATE POLICY "payout_select" ON public.driver_payouts
  FOR SELECT USING (driver_id = auth.uid() OR public.is_admin());

CREATE POLICY "payout_insert_driver" ON public.driver_payouts
  FOR INSERT WITH CHECK (driver_id = auth.uid());

CREATE POLICY "payout_update_admin" ON public.driver_payouts
  FOR UPDATE USING (public.is_admin());

-- ─── NOTIFICATIONS ────────────────────────────────────────────────────
CREATE POLICY "notif_select_own" ON public.notifications
  FOR SELECT USING (user_id = auth.uid() OR public.is_admin());

CREATE POLICY "notif_update_own" ON public.notifications
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "notif_insert_system" ON public.notifications
  FOR INSERT WITH CHECK (public.is_admin());

-- ─── Activer Realtime sur les tables importantes ───────────────────────
-- (À faire dans le dashboard Supabase : Table Editor > Realtime)
-- Ou via SQL :
ALTER PUBLICATION supabase_realtime ADD TABLE public.driver_locations;
ALTER PUBLICATION supabase_realtime ADD TABLE public.trips;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.driver_documents;
