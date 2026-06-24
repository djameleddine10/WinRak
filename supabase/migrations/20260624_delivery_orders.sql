-- ═══════════════════════════════════════════════════════════════════════════
--  WinRak — Delivery Orders (real tracking)
--  100% idempotent. Run after base migrations.
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.delivery_orders (
  id            UUID         DEFAULT gen_random_uuid() PRIMARY KEY,
  passenger_id  UUID         NOT NULL REFERENCES public.profiles(id),
  service_type  TEXT         NOT NULL,  -- food | pharmacy | parcel
  restaurant_id TEXT,
  pharmacy_id   TEXT,
  items         JSONB        NOT NULL DEFAULT '[]',
  dropoff_addr  TEXT         NOT NULL,
  note          TEXT,
  status        TEXT         NOT NULL DEFAULT 'finding',
  total_price   INTEGER      NOT NULL DEFAULT 0,
  delivery_fee  INTEGER      NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ  NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ  NOT NULL DEFAULT now()
);

-- ─── RLS ─────────────────────────────────────────────────────────────────────
ALTER TABLE public.delivery_orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS delivery_own_read   ON public.delivery_orders;
DROP POLICY IF EXISTS delivery_own_insert ON public.delivery_orders;

CREATE POLICY delivery_own_read   ON public.delivery_orders FOR SELECT USING (passenger_id = auth.uid());
CREATE POLICY delivery_own_insert ON public.delivery_orders FOR INSERT WITH CHECK (passenger_id = auth.uid());

-- ─── updated_at trigger ───────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

DROP TRIGGER IF EXISTS delivery_orders_updated_at ON public.delivery_orders;
CREATE TRIGGER delivery_orders_updated_at
  BEFORE UPDATE ON public.delivery_orders
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ─── Realtime ─────────────────────────────────────────────────────────────────
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.delivery_orders;
EXCEPTION WHEN others THEN NULL; END $$;

-- ─── Dashboard RPC ────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.dash_delivery_orders(p_limit INTEGER DEFAULT 50)
RETURNS TABLE (
  id           UUID,
  passenger_name TEXT,
  service_type TEXT,
  restaurant_id TEXT,
  dropoff_addr TEXT,
  status       TEXT,
  total_price  INTEGER,
  created_at   TIMESTAMPTZ
)
LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  SELECT
    d.id,
    p.full_name AS passenger_name,
    d.service_type,
    d.restaurant_id,
    d.dropoff_addr,
    d.status,
    d.total_price,
    d.created_at
  FROM public.delivery_orders d
  JOIN public.profiles p ON p.id = d.passenger_id
  ORDER BY d.created_at DESC
  LIMIT p_limit;
$$;

GRANT EXECUTE ON FUNCTION public.dash_delivery_orders(INTEGER) TO anon, authenticated;
