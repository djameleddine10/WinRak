-- ════════════════════════════════════════════════════════════════════
-- 20260627_driver_approval.sql
-- نظام الموافقة الرسمي على السائقين (WinRak)
--
-- المرحلة A — قاعدة البيانات:
--   1. توسيع أنواع الوثائق ليشمل piece_identite (هوية مالك carte grise — للموتو)
--   2. عمود registration_status صريح على drivers
--   3. دالة required_doc_types(vehicle_type) — الوثائق المطلوبة حسب النوع
--   4. trigger ديناميكي يقارن الموافَق عليها بالمطلوبة فعلياً
--   5. RLS policies للوثائق + سياسة Storage للـ bucket driver-docs
--
-- قرارات المستخدم المعتمدة:
--   • صور المركبة (أمام/خلف) إجبارية لكل الأنواع بما فيها moto
--   • moto يحتاج وثيقة إضافية: piece_identite (هوية مالك carte grise)
--   • سبب الرفض: قائمة جاهزة + نص حر (reject_reason يخزّن النص النهائي)
--   • رفض وثيقة واحدة = إعادة تلك الوثيقة فقط، الباقي يبقى approved
-- ════════════════════════════════════════════════════════════════════

-- ─── 1. توسيع أنواع الوثائق ────────────────────────────────────────────
ALTER TABLE public.driver_documents
  DROP CONSTRAINT IF EXISTS driver_documents_type_check;

ALTER TABLE public.driver_documents
  ADD CONSTRAINT driver_documents_type_check
  CHECK (type IN (
    'permis',         -- رخصة السياقة
    'carte_grise',    -- البطاقة الرمادية
    'vehicle_front',  -- صورة المركبة من الأمام
    'vehicle_rear',   -- صورة المركبة من الخلف
    'selfie',         -- صورة شخصية (سيلفي)
    'piece_identite'  -- هوية مالك البطاقة الرمادية (للموتو/الدليفري)
  ));

-- ─── 2. حالة التسجيل الصريحة على drivers ──────────────────────────────
ALTER TABLE public.drivers
  ADD COLUMN IF NOT EXISTS registration_status TEXT
    DEFAULT 'not_started'
    CHECK (registration_status IN ('not_started','pending','approved','rejected'));

-- إعادة مزامنة القيمة لأي سائقين محقّقين سابقاً
UPDATE public.drivers
  SET registration_status = 'approved'
  WHERE is_verified = TRUE AND registration_status <> 'approved';

-- ─── 3. الوثائق المطلوبة حسب نوع المركبة ──────────────────────────────
-- ترجع مصفوفة أنواع الوثائق المطلوبة لإتمام التحقق.
CREATE OR REPLACE FUNCTION public.required_doc_types(p_vehicle_type TEXT)
RETURNS TEXT[] LANGUAGE sql IMMUTABLE AS $$
  SELECT CASE
    WHEN p_vehicle_type = 'moto' THEN
      ARRAY['permis','carte_grise','vehicle_front','vehicle_rear','selfie','piece_identite']
    ELSE
      ARRAY['permis','carte_grise','vehicle_front','vehicle_rear','selfie']
  END;
$$;

-- ─── 4. Trigger التحقق الديناميكي ─────────────────────────────────────
CREATE OR REPLACE FUNCTION public.check_driver_verification()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_type        TEXT;
  v_required    TEXT[];
  v_approved    TEXT[];
  v_all_ok      BOOLEAN;
BEGIN
  -- نوع المركبة للسائق
  SELECT vehicle_type INTO v_type
    FROM public.drivers WHERE id = NEW.driver_id;

  v_required := public.required_doc_types(v_type);

  IF NEW.status = 'approved' THEN
    -- أنواع الوثائق الموافَق عليها حالياً
    SELECT COALESCE(array_agg(DISTINCT type), ARRAY[]::TEXT[])
      INTO v_approved
      FROM public.driver_documents
      WHERE driver_id = NEW.driver_id AND status = 'approved';

    -- هل كل المطلوب موجود ضمن الموافَق عليه؟
    v_all_ok := (v_required <@ v_approved);

    IF v_all_ok THEN
      UPDATE public.drivers SET
        is_verified         = TRUE,
        verified_at         = NOW(),
        verified_by         = NEW.reviewed_by,
        registration_status = 'approved'
      WHERE id = NEW.driver_id;

      INSERT INTO public.notifications (user_id, title, body, type, data)
      VALUES (
        NEW.driver_id,
        'Dossier approuvé ✓',
        'Félicitations ! Votre dossier a été validé. Vous pouvez démarrer le service.',
        'doc_approved',
        jsonb_build_object('driver_id', NEW.driver_id)
      );
    END IF;

  ELSIF NEW.status = 'rejected' THEN
    -- رفض وثيقة واحدة لا يلغي الموافقة على الباقي — فقط نعيد حالة التسجيل لـ rejected
    UPDATE public.drivers SET
      is_verified         = FALSE,
      registration_status = 'rejected'
    WHERE id = NEW.driver_id;

    INSERT INTO public.notifications (user_id, title, body, type, data)
    VALUES (
      NEW.driver_id,
      'Document refusé',
      COALESCE(NEW.reject_reason, 'Un document a été refusé. Veuillez le soumettre à nouveau.'),
      'doc_rejected',
      jsonb_build_object('doc_type', NEW.type, 'reason', NEW.reject_reason)
    );
  END IF;

  RETURN NEW;
END;
$$;

-- عند رفع/تحديث وثيقة جديدة (insert) نضمن أن حالة التسجيل = pending
CREATE OR REPLACE FUNCTION public.on_doc_uploaded()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE public.drivers
    SET registration_status = 'pending'
    WHERE id = NEW.driver_id
      AND registration_status IN ('not_started','rejected');
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS after_doc_reviewed ON public.driver_documents;
CREATE TRIGGER after_doc_reviewed
  AFTER UPDATE ON public.driver_documents
  FOR EACH ROW EXECUTE FUNCTION public.check_driver_verification();

DROP TRIGGER IF EXISTS after_doc_uploaded ON public.driver_documents;
CREATE TRIGGER after_doc_uploaded
  AFTER INSERT ON public.driver_documents
  FOR EACH ROW EXECUTE FUNCTION public.on_doc_uploaded();

-- ─── 5. RLS على driver_documents ──────────────────────────────────────
ALTER TABLE public.driver_documents ENABLE ROW LEVEL SECURITY;

-- السائق يرى/يرفع وثائقه فقط
DROP POLICY IF EXISTS dd_select_own ON public.driver_documents;
CREATE POLICY dd_select_own ON public.driver_documents
  FOR SELECT USING (driver_id = auth.uid());

DROP POLICY IF EXISTS dd_insert_own ON public.driver_documents;
CREATE POLICY dd_insert_own ON public.driver_documents
  FOR INSERT WITH CHECK (driver_id = auth.uid());

DROP POLICY IF EXISTS dd_update_own ON public.driver_documents;
CREATE POLICY dd_update_own ON public.driver_documents
  FOR UPDATE USING (driver_id = auth.uid());

-- الأدمن يرى ويراجع كل الوثائق
DROP POLICY IF EXISTS dd_admin_all ON public.driver_documents;
CREATE POLICY dd_admin_all ON public.driver_documents
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ─── 6. سياسات Storage للـ bucket driver-docs ─────────────────────────
-- المسار: {driver_id}/{type}_{ts}.{ext}  →  المجلد الأول هو معرّف السائق
DROP POLICY IF EXISTS dd_storage_insert ON storage.objects;
CREATE POLICY dd_storage_insert ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'driver-docs'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS dd_storage_select ON storage.objects;
CREATE POLICY dd_storage_select ON storage.objects
  FOR SELECT USING (
    bucket_id = 'driver-docs'
    AND (
      (storage.foldername(name))[1] = auth.uid()::text
      OR EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'admin'
      )
    )
  );

DROP POLICY IF EXISTS dd_storage_update ON storage.objects;
CREATE POLICY dd_storage_update ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'driver-docs'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- ─── 7. تحديث pending_docs_view ليشمل reviewed_at/reviewed_by ─────────
CREATE OR REPLACE VIEW public.pending_docs_view AS
SELECT
  dd.id,
  dd.driver_id,
  p.full_name,
  p.full_name_ar,
  p.phone,
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
  dd.uploaded_at
FROM public.driver_documents dd
JOIN public.profiles p  ON dd.driver_id = p.id
JOIN public.drivers dr  ON dd.driver_id = dr.id
ORDER BY dd.uploaded_at DESC;
