-- ═══════════════════════════════════════════════════════════════════
--  WinRak — Transactions sécurisées côté serveur (anti-fraude + RLS)
--  À exécuter dans Supabase SQL Editor APRÈS 20260623_secure_pricing.sql.
--  100% idempotent : ré-exécutable sans danger.
--
--  PROBLÈMES corrigés :
--   1. CONFLIT RLS : completeTrip() (appelé par le CHAUFFEUR) faisait un
--      INSERT dans public.transactions, mais la policy "txn_insert_system"
--      n'autorise QUE l'admin → l'insertion échouait silencieusement, donc
--      AUCUNE transaction n'était enregistrée à la fin d'une course.
--   2. CONFIANCE CLIENT : le client envoyait amount / commission /
--      driver_amount. Un client malveillant pouvait falsifier ces montants.
--
--  SOLUTION :
--   La transaction est créée AUTOMATIQUEMENT côté serveur, par un trigger
--   AFTER UPDATE sur trips quand status passe à 'completed'. Les montants
--   proviennent de la course (déjà sécurisés par trip_pricing_guard). Le
--   client ne crée plus jamais de transaction lui-même.
-- ═══════════════════════════════════════════════════════════════════

-- ─── 1. Création automatique de la transaction à la fin de course ────
CREATE OR REPLACE FUNCTION public.create_transaction_on_complete()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF NEW.status = 'completed' AND OLD.status <> 'completed' THEN
    -- Évite les doublons si le trigger se déclenche deux fois
    IF NOT EXISTS (
      SELECT 1 FROM public.transactions WHERE trip_id = NEW.id
    ) AND NEW.driver_id IS NOT NULL THEN
      INSERT INTO public.transactions (
        trip_id, passenger_id, driver_id,
        amount, commission, driver_amount,
        payment_method, status
      ) VALUES (
        NEW.id, NEW.passenger_id, NEW.driver_id,
        COALESCE(NEW.price, 0),
        COALESCE(NEW.commission, 0),
        COALESCE(NEW.driver_earnings, 0),
        COALESCE(NEW.payment_method, 'cash'),
        'completed'
      );
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

-- Le trigger s'exécute APRÈS after_trip_complete (ordre alphabétique des
-- noms de triggers : "after_trip_complete" < "zz_create_transaction").
DROP TRIGGER IF EXISTS zz_create_transaction ON public.trips;
CREATE TRIGGER zz_create_transaction
  AFTER UPDATE ON public.trips
  FOR EACH ROW EXECUTE FUNCTION public.create_transaction_on_complete();

-- ─── 2. Garde-fou : montants de transaction toujours cohérents ───────
ALTER TABLE public.transactions
  DROP CONSTRAINT IF EXISTS txn_amounts_positive;
ALTER TABLE public.transactions
  ADD CONSTRAINT txn_amounts_positive
  CHECK (amount >= 0 AND commission >= 0 AND driver_amount >= 0);
