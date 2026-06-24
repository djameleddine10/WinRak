-- ═══════════════════════════════════════════════════════════════════════════
--  WinRak — Finance: Driver Earnings + Passenger Wallet
--  100% idempotent.
-- ═══════════════════════════════════════════════════════════════════════════

-- ─── PASSENGER WALLETS ────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.passenger_wallets (
  user_id    UUID    PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  balance    INTEGER NOT NULL DEFAULT 0,
  points     INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.passenger_transactions (
  id         UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id    UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type       TEXT        NOT NULL, -- 'debit' | 'credit'
  label_key  TEXT        NOT NULL,
  vars       JSONB,
  amount     INTEGER     NOT NULL,
  method     TEXT        NOT NULL DEFAULT 'wallet',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── RLS ─────────────────────────────────────────────────────────────────────
ALTER TABLE public.passenger_wallets       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.passenger_transactions  ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS wallet_own ON public.passenger_wallets;
DROP POLICY IF EXISTS txn_own    ON public.passenger_transactions;

CREATE POLICY wallet_own ON public.passenger_wallets      FOR ALL USING (user_id = auth.uid());
CREATE POLICY txn_own    ON public.passenger_transactions FOR ALL USING (user_id = auth.uid());

-- ─── Auto-create wallet on profile creation ──────────────────────────────────
CREATE OR REPLACE FUNCTION public.init_passenger_wallet()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  INSERT INTO public.passenger_wallets (user_id)
  VALUES (NEW.id) ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS passenger_wallet_init ON public.profiles;
CREATE TRIGGER passenger_wallet_init
  AFTER INSERT ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.init_passenger_wallet();

-- ─── PASSENGER WALLET RPCs ────────────────────────────────────────────────────

-- Get wallet balance + points
CREATE OR REPLACE FUNCTION public.get_passenger_wallet(p_user_id UUID)
RETURNS TABLE (balance INTEGER, points INTEGER)
LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  SELECT COALESCE(balance, 0), COALESCE(points, 0)
  FROM public.passenger_wallets
  WHERE user_id = p_user_id;
$$;

-- Get last 50 transactions
CREATE OR REPLACE FUNCTION public.get_passenger_transactions(p_user_id UUID)
RETURNS TABLE (id UUID, type TEXT, label_key TEXT, vars JSONB, amount INTEGER, method TEXT, created_at TIMESTAMPTZ)
LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  SELECT id, type, label_key, vars, amount, method, created_at
  FROM public.passenger_transactions
  WHERE user_id = p_user_id
  ORDER BY created_at DESC
  LIMIT 50;
$$;

-- Top-up: credit wallet + insert transaction
CREATE OR REPLACE FUNCTION public.wallet_topup(p_user_id UUID, p_amount INTEGER)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.passenger_wallets (user_id, balance)
  VALUES (p_user_id, p_amount)
  ON CONFLICT (user_id) DO UPDATE
    SET balance = passenger_wallets.balance + p_amount, updated_at = now();

  INSERT INTO public.passenger_transactions (user_id, type, label_key, amount, method)
  VALUES (p_user_id, 'credit', 'wallet.tx.topup', p_amount, 'wallet');
END;
$$;

-- Charge: debit wallet (if wallet method) + insert transaction. Returns FALSE if insufficient.
CREATE OR REPLACE FUNCTION public.wallet_charge(
  p_user_id  UUID,
  p_amount   INTEGER,
  p_label_key TEXT,
  p_vars     JSONB    DEFAULT NULL,
  p_method   TEXT     DEFAULT 'wallet'
) RETURNS BOOLEAN LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_balance INTEGER;
BEGIN
  SELECT COALESCE(balance, 0) INTO v_balance
  FROM public.passenger_wallets WHERE user_id = p_user_id;

  IF p_method = 'wallet' AND v_balance < p_amount THEN RETURN false; END IF;

  IF p_method = 'wallet' THEN
    UPDATE public.passenger_wallets
    SET balance = balance - p_amount, updated_at = now()
    WHERE user_id = p_user_id;
  END IF;

  INSERT INTO public.passenger_transactions (user_id, type, label_key, vars, amount, method)
  VALUES (p_user_id, 'debit', p_label_key, p_vars, p_amount, p_method);

  RETURN true;
END;
$$;

-- ─── DRIVER EARNINGS RPCs ─────────────────────────────────────────────────────

-- Driver wallet balance = sum of driver_earnings from completed trips
CREATE OR REPLACE FUNCTION public.get_driver_wallet(p_driver_id UUID)
RETURNS JSON LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  SELECT json_build_object(
    'wallet_balance', COALESCE(SUM(driver_earnings), 0)
  )
  FROM public.trips
  WHERE driver_id = p_driver_id AND status = 'completed';
$$;

-- Driver transaction history = completed trips as earnings entries
CREATE OR REPLACE FUNCTION public.get_driver_transactions(p_driver_id UUID)
RETURNS TABLE (driver_amount NUMERIC, created_at TIMESTAMPTZ)
LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  SELECT driver_earnings AS driver_amount, created_at
  FROM public.trips
  WHERE driver_id = p_driver_id AND status = 'completed'
  ORDER BY created_at DESC
  LIMIT 100;
$$;

-- ─── GRANTS ───────────────────────────────────────────────────────────────────
GRANT EXECUTE ON FUNCTION public.get_passenger_wallet(UUID)                               TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_passenger_transactions(UUID)                         TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.wallet_topup(UUID, INTEGER)                              TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.wallet_charge(UUID, INTEGER, TEXT, JSONB, TEXT)          TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_driver_wallet(UUID)                                  TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_driver_transactions(UUID)                            TO anon, authenticated;
