-- ════════════════════════════════════════════════════════════════════
-- 20260627_vehicle_types.sql
-- توسيع أنواع المركبات المدعومة في WinRak.
-- الأنواع النهائية المعتمدة: economique, confort, sedan, she, moto, intercites
--   • sedan : سيارة برلين عادية (اختيار صريح للسائق)
--   • moto  : دراجة نارية — للتوصيل (delivery) فقط
--   • she   : يُحدَّد تلقائياً حسب جنس السائقة (ليس اختياراً يدوياً في النموذج)
-- ════════════════════════════════════════════════════════════════════

ALTER TABLE public.drivers
  DROP CONSTRAINT IF EXISTS drivers_vehicle_type_check;

ALTER TABLE public.drivers
  ADD CONSTRAINT drivers_vehicle_type_check
  CHECK (vehicle_type IN ('economique','confort','sedan','she','moto','intercites'));

-- جدول الرحلات يستعمل نفس القيم لنوع المركبة
ALTER TABLE public.trips
  DROP CONSTRAINT IF EXISTS trips_vehicle_type_check;

ALTER TABLE public.trips
  ADD CONSTRAINT trips_vehicle_type_check
  CHECK (vehicle_type IS NULL OR vehicle_type IN ('economique','confort','sedan','she','moto','intercites'));
