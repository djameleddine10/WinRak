-- ═══════════════════════════════════════════════════════════════════
--  WinRak — Données de test (seed)
--  ⚠ À exécuter APRÈS schema.sql et rls.sql
--  Ces données correspondent aux mocks actuels du dashboard
-- ═══════════════════════════════════════════════════════════════════

-- NOTE : En production, les utilisateurs sont créés via auth.users (OTP SMS).
-- Pour les tests, on insère directement avec des UUIDs fixes.

-- UUIDs fixes pour les tests
DO $$
DECLARE
  -- Chauffeurs
  d1 UUID := 'aaaaaaaa-0001-0001-0001-000000000001';
  d2 UUID := 'aaaaaaaa-0002-0002-0002-000000000002';
  d3 UUID := 'aaaaaaaa-0003-0003-0003-000000000003';
  d4 UUID := 'aaaaaaaa-0004-0004-0004-000000000004';
  d5 UUID := 'aaaaaaaa-0005-0005-0005-000000000005';
  -- Passagers
  p1 UUID := 'bbbbbbbb-0001-0001-0001-000000000001';
  p2 UUID := 'bbbbbbbb-0002-0002-0002-000000000002';
  p3 UUID := 'bbbbbbbb-0003-0003-0003-000000000003';
  p4 UUID := 'bbbbbbbb-0004-0004-0004-000000000004';
  p5 UUID := 'bbbbbbbb-0005-0005-0005-000000000005';
  -- Admin
  adm UUID := 'cccccccc-0001-0001-0001-000000000001';
BEGIN

-- ─── PROFILES ─────────────────────────────────────────────────────────
INSERT INTO public.profiles (id, phone, role, full_name, full_name_ar, is_active, created_at) VALUES
  (d1,  '+213555100200', 'driver',    'Djamel Troudi',    'جمال الدين ترودي', TRUE, '2024-06-01'),
  (d2,  '+213555200300', 'driver',    'Mohamed Issa',     'محمد عيسى',        TRUE, '2024-07-15'),
  (d3,  '+213555300400', 'driver',    'Amina Rahhal',     'أمينة رحال',       TRUE, '2024-08-20'),
  (d4,  '+213555400500', 'driver',    'Younes Rezzig',    'يونس رزيق',        TRUE, '2024-10-10'),
  (d5,  '+213555500600', 'driver',    'Hassan Belmahi',   'حسان بلمهي',       TRUE, '2024-12-05'),
  (p1,  '+213555010203', 'passenger', 'Karim Bouzid',     'كريم بوزيد',       TRUE, '2025-01-15'),
  (p2,  '+213555020304', 'passenger', 'Yacine Aït Ali',   'ياسين آيت علي',    TRUE, '2025-02-03'),
  (p3,  '+213555030405', 'passenger', 'Amira Haddad',     'أميرة حداد',       TRUE, '2024-11-20'),
  (p4,  '+213555050607', 'passenger', 'Nadia Brahimi',    'نادية براهيمي',    TRUE, '2025-01-08'),
  (p5,  '+213555070809', 'passenger', 'Yasmine Rezki',    'ياسمين رزقي',      TRUE, '2024-10-01'),
  (adm, NULL,            'admin',     'Administrateur',   'المسؤول',          TRUE, '2024-01-01')
ON CONFLICT (id) DO NOTHING;

-- ─── DRIVERS ──────────────────────────────────────────────────────────
INSERT INTO public.drivers (id, vehicle_make, vehicle_model, vehicle_year, vehicle_plate, vehicle_type, vehicle_color, rating, total_trips, total_earnings, wallet_balance, status, current_lat, current_lng, is_verified, verified_at) VALUES
  (d1, 'Toyota',  'Corolla', 2022, '123 TUN 16', 'confort',    'Blanc',   4.9, 348, 245000, 12500, 'on_trip', 36.7538, 3.0588, TRUE, NOW() - INTERVAL '30 days'),
  (d2, 'Peugeot', '208',     2021, '456 ALG 16', 'economique', 'Gris',    4.7, 212, 147000,  8200, 'online',  36.7300, 3.0870, TRUE, NOW() - INTERVAL '25 days'),
  (d3, 'Dacia',   'Logan',   2020, '789 ALG 16', 'she',        'Blanc',   4.8, 156, 108000,  6100, 'offline', 36.7700, 3.0420, TRUE, NOW() - INTERVAL '20 days'),
  (d4, 'Toyota',  'Yaris',   2023, '321 TUN 16', 'economique', 'Rouge',   4.6,  89,  62000,  3800, 'online',  36.7938, 3.0588, TRUE, NOW() - INTERVAL '15 days'),
  (d5, 'Hyundai', 'i20',     2021, '654 ALG 16', 'economique', 'Bleu',    4.5,  44,  30800,  1500, 'offline', 36.7538, 3.0988, FALSE, NULL)
ON CONFLICT (id) DO NOTHING;

-- ─── PASSENGERS ───────────────────────────────────────────────────────
INSERT INTO public.passengers (id, rating, total_trips, total_spent) VALUES
  (p1, 4.9, 12, 14800),
  (p2, 4.6,  8,  9200),
  (p3, 4.8, 25, 31500),
  (p4, 5.0, 18, 22400),
  (p5, 4.9, 32, 41200)
ON CONFLICT (id) DO NOTHING;

-- ─── DRIVER LOCATIONS ─────────────────────────────────────────────────
INSERT INTO public.driver_locations (driver_id, lat, lng, heading, speed, updated_at) VALUES
  (d1, 36.7538, 3.0588, 45,  35, NOW()),
  (d2, 36.7300, 3.0870, 180, 28, NOW()),
  (d4, 36.7938, 3.0588, 270, 0,  NOW())
ON CONFLICT (driver_id) DO UPDATE SET lat = EXCLUDED.lat, lng = EXCLUDED.lng, updated_at = NOW();

-- ─── TRIPS (15 dernières courses) ─────────────────────────────────────
INSERT INTO public.trips (trip_code, passenger_id, driver_id, from_address, from_lat, from_lng, to_address, to_lat, to_lng, distance_km, duration_min, price, commission, driver_earnings, vehicle_type, payment_method, status, completed_at, created_at) VALUES
  ('TR-1284', p1, d1, 'Didouche Mourad', 36.767, 3.054, 'Aéroport HB',    36.692, 3.215, 18.4, 28, 1500, 180, 1320, 'confort',    'cib',      'completed', NOW()-INTERVAL '2h',  NOW()-INTERVAL '2.5h'),
  ('TR-1283', p4, d2, 'Hussein Dey',     36.741, 3.091, 'Bab El Oued',    36.780, 3.044, 7.2,  14, 620,   74,  546, 'economique', 'edahabia', 'completed', NOW()-INTERVAL '3h',  NOW()-INTERVAL '3.5h'),
  ('TR-1282', p5, d3, 'El Harrach',      36.718, 3.118, 'Ben Aknoun',     36.758, 3.004, 14.1, 22, 890,  107,  783, 'she',        'cash',     'completed', NOW()-INTERVAL '4h',  NOW()-INTERVAL '4.5h'),
  ('TR-1281', p2, d4, 'Alger Centre',    36.753, 3.058, 'Kouba',          36.720, 3.100, 9.3,  18, 720,   86,  634, 'economique', 'cash',     'cancelled', NULL,                  NOW()-INTERVAL '5h'),
  ('TR-1280', p3, d1, 'Bab Ezzouar',     36.722, 3.175, 'Alger Centre',   36.753, 3.058, 12.6, 20, 980,  118,  862, 'confort',    'cib',      'in_progress', NULL,               NOW()-INTERVAL '30min'),
  ('TR-1279', p2, d2, 'Birmandreis',     36.718, 3.052, 'El Biar',        36.768, 3.024, 5.8,  11, 480,   58,  422, 'economique', 'edahabia', 'completed', NOW()-INTERVAL '6h',  NOW()-INTERVAL '6.5h'),
  ('TR-1278', p1, d5, 'Chéraga',         36.764, 2.975, 'Alger Centre',   36.753, 3.058, 16.2, 25, 1200, 144, 1056, 'confort',    'cib',      'completed', NOW()-INTERVAL '15h', NOW()-INTERVAL '15.5h'),
  ('TR-1277', p5, d4, 'Alger Centre',    36.753, 3.058, 'Dar El Beïda',   36.681, 3.218, 21.3, 32, 1800, 216, 1584, 'economique', 'cash',     'completed', NOW()-INTERVAL '16h', NOW()-INTERVAL '16.5h'),
  ('TR-1276', p3, d3, 'Hydra',           36.748, 3.021, 'Sidi M''hamed',  36.763, 3.072, 8.4,  16, 690,   83,  607, 'she',        'edahabia', 'cancelled', NULL,                  NOW()-INTERVAL '17h'),
  ('TR-1275', p2, d1, 'Belouizdad',      36.741, 3.082, 'Bab El Oued',    36.780, 3.044, 6.1,  12, 520,   62,  458, 'confort',    'cib',      'completed', NOW()-INTERVAL '18h', NOW()-INTERVAL '18.5h'),
  ('TR-1274', p4, d2, 'Oued Smar',       36.710, 3.168, 'Alger Centre',   36.753, 3.058, 11.7, 19, 850,  102,  748, 'economique', 'edahabia', 'completed', NOW()-INTERVAL '19h', NOW()-INTERVAL '19.5h'),
  ('TR-1273', p5, d5, 'El Biar',         36.768, 3.024, 'Hussein Dey',    36.741, 3.091, 9.9,  18, 760,   91,  669, 'economique', 'cash',     'completed', NOW()-INTERVAL '20h', NOW()-INTERVAL '20.5h'),
  ('TR-1272', p2, d4, 'Kouba',           36.720, 3.100, 'Bir Mourad Raïs',36.734, 3.044, 5.2,  10, 440,   53,  387, 'economique', 'cash',     'completed', NOW()-INTERVAL '21h', NOW()-INTERVAL '21.5h'),
  ('TR-1271', p3, d3, 'Bab El Oued',     36.780, 3.044, 'Alger Centre',   36.753, 3.058, 3.8,   8, 350,   42,  308, 'she',        'edahabia', 'completed', NOW()-INTERVAL '22h', NOW()-INTERVAL '22.5h'),
  ('TR-1270', p5, d1, 'Alger Centre',    36.753, 3.058, 'Ben Aknoun',     36.758, 3.004, 13.5, 21, 1050, 126,  924, 'confort',    'cib',      'completed', NOW()-INTERVAL '23h', NOW()-INTERVAL '23.5h')
ON CONFLICT (trip_code) DO NOTHING;

-- ─── TRANSACTIONS ─────────────────────────────────────────────────────
INSERT INTO public.transactions (txn_code, trip_id, passenger_id, driver_id, amount, commission, driver_amount, payment_method, status, created_at)
SELECT
  'TXN-' || (8836 + ROW_NUMBER() OVER (ORDER BY t.created_at DESC) - 1)::TEXT,
  t.id,
  t.passenger_id,
  t.driver_id,
  t.price,
  t.commission,
  t.driver_earnings,
  t.payment_method,
  'completed',
  t.completed_at
FROM public.trips t
WHERE t.status = 'completed' AND t.price IS NOT NULL
ON CONFLICT (txn_code) DO NOTHING;

-- ─── NOTIFICATIONS DE TEST ─────────────────────────────────────────────
INSERT INTO public.notifications (user_id, title, body, type, is_read, created_at) VALUES
  (d1, 'Paiement reçu', 'Vous avez reçu 1 320 DZD pour la course TR-1284', 'payment', TRUE, NOW()-INTERVAL '2h'),
  (d1, 'Nouvelle course disponible', 'Course depuis Hydra vers Ben Aknoun — 12 km', 'trip_request', FALSE, NOW()-INTERVAL '10min'),
  (d5, 'Dossier refusé', 'Votre carte grise est illisible. Veuillez la soumettre à nouveau.', 'doc_rejected', FALSE, NOW()-INTERVAL '1 day'),
  (p1, 'Course terminée', 'Votre course vers l''Aéroport HB est terminée. Notez votre chauffeur !', 'trip_update', TRUE, NOW()-INTERVAL '2h')
ON CONFLICT DO NOTHING;

END $$;
