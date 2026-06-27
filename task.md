# WinRak — Driver Approval System

## Status
- [x] Phase A — DB migration (20260627_driver_approval_phase_a.sql)
- [ ] Phase B — Mobile (driver-registration upload + driverStore + driver-pending realtime)
- [ ] Phase C — Admin Web (driver validation page)
- [ ] Phase D — Remove mocks, real flow

## Phase A — Done
### Changes
1. `drivers.vehicle_type` → added 'moto'
2. `driver_documents.type` → added 'piece_identite' (for moto drivers)
3. `drivers.registration_status` → new column (not_started|pending|approved|rejected)
4. `check_driver_verification()` trigger → updated: sets registration_status, Arabic notifications, handles rejected
5. `pending_docs_view` → added avatar_url, registration_status, reviewed_at, reviewed_by
6. `driver_approval_summary` → new view for admin list

## Doc types per driver type
- VTC (سيارة): selfie, permis, carte_grise, vehicle_front, vehicle_rear
- Moto (دليفري): selfie, permis, carte_grise, vehicle_front, vehicle_rear + piece_identite

## Decisions
- Reject 1 doc → ask re-upload of that doc only (others stay approved)
- Reject reason: predefined list + free text
- Trigger: 4+ docs all approved → is_verified=true + registration_status='approved'

## Next: Phase B
- driver-registration.tsx: wire PhotoUpload onPhotoSelected for permis, carte_grise, vehicle_front, vehicle_rear, selfie, piece_identite (moto)
- driverStore: real submitRegistration() → write to drivers table + uploadDocument for each photo
- driver-pending.tsx: realtime subscription on driver_documents + notifications
