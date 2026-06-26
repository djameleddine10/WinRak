# Phase 3 — Supabase Real Data

## Files
1. [x] userStore.ts — remove mock, define interfaces, login fetches profile
2. [ ] driverStore.ts — remove mockRides, RideOffer interface, Realtime subscription
3. [ ] wallet.tsx — call loadWallet() in useEffect (paymentStore already has it)
4. [ ] search.tsx — recent places via profiles.recent_searches JSONB (migration needed)

## Key DB Info
- profiles: id, phone, role, full_name, full_name_ar, avatar_url, is_active
- passengers: id, rating, total_trips, total_spent
- trips: id, trip_code, passenger_id, driver_id, from_address, from_lat/lng, to_address, to_lat/lng, distance_km, price, vehicle_type, status
- trip_offers: id, trip_id, driver_id, offer_rank, distance_m, status, created_at, responded_at
  - Realtime enabled on trip_offers
- No recent_searches column in profiles yet — need migration

## Decisions
- recent_searches stored as JSONB on profiles table (max 10 items)
- RideOffer interface defined independently from mockRides
- userStore: passenger/driver typed as independent interfaces
- driverStore: Realtime subscription on trip_offers with filter driver_id=eq.{uid}
