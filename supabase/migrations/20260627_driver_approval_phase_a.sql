-- ═══════════════════════════════════════════════════════════════════
--  PHASE A — Système de validation des chauffeurs
--  Date : 2026-06-27
--  Auteur : WinRak
-- ═══════════════════════════════════════════════════════════════════

-- ─── 1. Ajouter 'moto' dans vehicle_type ─────────────────────────────
--  On supprime l'ancienne contrainte et on la recrée avec 'moto'
ALTER TABLE public.drivers
  DROP CONSTRAINT IF EXISTS drivers_vehicle_type_check;

ALTER TABLE public.drivers
  ADD CONSTRAINT drivers_vehicle_type_check
  CHECK (vehicle_type IN ('economique','confort','she','intercites','moto'));

-- ─── 2. Ajouter 'piece_identite' dans driver_documents.type ──────────
--  Requis pour les chauffeurs moto (propriétaire de la carte grise)
ALTER TABLE public.driver_documents
  DROP CONSTRAINT IF EXISTS driver_documents_type_check;

ALTER TABLE public.driver_documents
  ADD CONSTRAINT driver_documents_type_check
  CHECK (type IN ('permis','carte_grise','vehicle_front','vehicle_rear','selfie','piece_identite'));

-- ─── 3. Ajouter registration_status sur drivers ──────────────────────
--  Statut clair du dossier d'inscription (indépendant de is_verified)
ALTER TABLE public.drivers
  ADD COLUMN IF NOT EXISTS registration_status TEXT
  DEFAULT 'not_started'
  CHECK (registration_status IN ('not_started','pending','approved','rejected'));

-- ─── 4. Mettre à jour le trigger check_driver_verification ───────────
--  - Met à jour registration_status en même temps que is_verified
--  - Si toute doc rejetée → registration_status = 'rejected' (pas reset)
--  - Notifications en arabe/français selon le contexte
CREATE OR REPLACE FUNCTION check_driver_verification()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  doc_count      INTEGER;
  approved_count INTEGER;
  rejected_count INTEGER;
BEGIN
  -- Compter les docs de ce chauffeur
  SELECT COUNT(*)
    INTO doc_count
    FROM public.driver_documents
   WHERE driver_id = NEW.driver_id;

  SELECT COUNT(*)
    INTO approved_count
    FROM public.driver_documents
   WHERE driver_id = NEW.driver_id AND status = 'approved';

  SELECT COUNT(*)
    INTO rejected_count
    FROM public.driver_documents
   WHERE driver_id = NEW.driver_id AND status = 'rejected';

  IF NEW.status = 'approved' THEN
    -- Tous les docs approuvés (min 4) → chauffeur vérifié
    IF doc_count >= 4 AND approved_count = doc_count THEN
      UPDATE public.drivers SET
        is_verified         = TRUE,
        verified_at         = NOW(),
        verified_by         = NEW.reviewed_by,
        registration_status = 'approved'
      WHERE id = NEW.driver_id;

      INSERT INTO public.notifications (user_id, title, body, type, data)
      VALUES (
        NEW.driver_id,
        'تم قبول ملفك ✓',
        'مبروك! تم التحقق من ملفك. يمكنك الآن بدء العمل.',
        'doc_approved',
        jsonb_build_object('driver_id', NEW.driver_id)
      );
    END IF;

  ELSIF NEW.status = 'rejected' THEN
    -- Mettre registration_status = pending (en attente de re-soumission)
    -- On ne reset pas is_verified (qui reste false de toute façon)
    UPDATE public.drivers SET
      registration_status = 'pending'
    WHERE id = NEW.driver_id AND registration_status != 'approved';

    -- Notifier le chauffeur du refus avec le type de doc et la raison
    INSERT INTO public.notifications (user_id, title, body, type, data)
    VALUES (
      NEW.driver_id,
      'تم رفض وثيقة',
      COALESCE(NEW.reject_reason, 'تم رفض إحدى وثائقك. يرجى إعادة رفعها.'),
      'doc_rejected',
      jsonb_build_object(
        'doc_id',    NEW.id,
        'doc_type',  NEW.type,
        'reason',    NEW.reject_reason
      )
    );
  END IF;

  RETURN NEW;
END;
$$;

-- ─── 5. Mettre à jour pending_docs_view ──────────────────────────────
--  Ajouter registration_status + reviewed_at pour l'admin
CREATE OR REPLACE VIEW public.pending_docs_view AS
SELECT
  dd.id,
  dd.driver_id,
  p.full_name,
  p.full_name_ar,
  p.phone,
  p.avatar_url,
  dr.vehicle_make,
  dr.vehicle_model,
  dr.vehicle_plate,
  dr.vehicle_type,
  dr.registration_status,
  dd.type,
  dd.file_url,
  dd.file_name,
  dd.status,
  dd.reject_reason,
  dd.reviewed_at,
  dd.reviewed_by,
  dd.uploaded_at
FROM public.driver_documents dd
JOIN public.profiles p  ON dd.driver_id = p.id
JOIN public.drivers dr  ON dd.driver_id = dr.id
ORDER BY dd.uploaded_at DESC;

-- ─── 6. Vue : résumé par chauffeur (pour la liste admin) ─────────────
CREATE OR REPLACE VIEW public.driver_approval_summary AS
SELECT
  dr.id                                                          AS driver_id,
  p.full_name,
  p.full_name_ar,
  p.phone,
  p.avatar_url,
  dr.vehicle_type,
  dr.vehicle_make,
  dr.vehicle_model,
  dr.vehicle_plate,
  dr.registration_status,
  dr.is_verified,
  COUNT(dd.id)                                                   AS total_docs,
  COUNT(dd.id) FILTER (WHERE dd.status = 'pending')             AS pending_docs,
  COUNT(dd.id) FILTER (WHERE dd.status = 'approved')            AS approved_docs,
  COUNT(dd.id) FILTER (WHERE dd.status = 'rejected')            AS rejected_docs,
  MAX(dd.uploaded_at)                                            AS last_upload_at
FROM public.drivers dr
JOIN public.profiles p ON dr.id = p.id
LEFT JOIN public.driver_documents dd ON dd.driver_id = dr.id
WHERE dr.registration_status IN ('pending', 'rejected')
   OR (dr.registration_status = 'approved' AND dr.is_verified = FALSE)
GROUP BY dr.id, p.full_name, p.full_name_ar, p.phone, p.avatar_url,
         dr.vehicle_type, dr.vehicle_make, dr.vehicle_model, dr.vehicle_plate,
         dr.registration_status, dr.is_verified
ORDER BY last_upload_at DESC NULLS LAST;

-- ─── 7. RLS sur driver_approval_summary ──────────────────────────────
-- (les vues héritent du RLS des tables sous-jacentes, mais on sécurise explicitement)
GRANT SELECT ON public.driver_approval_summary TO authenticated;
GRANT SELECT ON public.pending_docs_view TO authenticated;
