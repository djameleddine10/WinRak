import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding WinRak database...');

  // ─── Admin User ────────────────────────────────────────────────
  const admin = await prisma.user.upsert({
    where: { phone: '+213000000000' },
    update: {},
    create: {
      phone: '+213000000000',
      fullName: 'مشرف WinRak',
      email: 'admin@winrak.dz',
      role: 'ADMIN',
      isVerified: true,
    },
  });

  // ─── Test Passenger ────────────────────────────────────────────
  const passenger = await prisma.user.upsert({
    where: { phone: '+213555000001' },
    update: {},
    create: {
      phone: '+213555000001',
      fullName: 'محمد الأمين',
      role: 'PASSENGER',
      isVerified: true,
      winPoints: 150,
    },
  });

  // ─── Test Drivers ──────────────────────────────────────────────
  const driverUsers = [
    { phone: '+213660000001', fullName: 'علي بن عمر',   rating: 4.8 },
    { phone: '+213661000002', fullName: 'سامي مرزوق',   rating: 4.5 },
    { phone: '+213770000003', fullName: 'كمال شعبان',   rating: 4.7 },
  ];

  const vehicles = [
    { brand: 'Renault', model: 'Symbol', year: 2019, color: 'أبيض',   plate: '01234-01-23', type: 'GO' },
    { brand: 'Peugeot', model: '301',    year: 2020, color: 'رمادي',  plate: '05678-02-23', type: 'PLUS' },
    { brand: 'Toyota',  model: 'Hilux',  year: 2021, color: 'أسود',   plate: '09012-03-23', type: 'XL' },
  ];

  for (let i = 0; i < driverUsers.length; i++) {
    const du = driverUsers[i];
    const v = vehicles[i];

    const driverUser = await prisma.user.upsert({
      where: { phone: du.phone },
      update: {},
      create: { phone: du.phone, fullName: du.fullName, role: 'DRIVER', isVerified: true },
    });

    const driver = await prisma.driver.upsert({
      where: { userId: driverUser.id },
      update: {},
      create: {
        userId: driverUser.id,
        status: 'ACTIVE',
        rating: du.rating,
        totalTrips: Math.floor(Math.random() * 300) + 50,
        totalEarnings: Math.floor(Math.random() * 300000) + 50000,
        currentLat: 36.7372 + (Math.random() - 0.5) * 0.05,
        currentLng:  3.0865 + (Math.random() - 0.5) * 0.05,
        isOnline: i < 2,
      },
    });

    await prisma.vehicle.upsert({
      where: { plateNumber: v.plate },
      update: {},
      create: {
        driverId: driver.id,
        brand: v.brand, model: v.model, year: v.year,
        color: v.color, plateNumber: v.plate,
        vehicleType: v.type, isVerified: true,
      },
    });

    // Contract for each driver
    const existing = await prisma.driverContract.findFirst({ where: { driverId: driver.id, isActive: true } });
    if (!existing) {
      await prisma.driverContract.create({
        data: {
          driverId: driver.id,
          contractType: i === 0 ? 'PREMIUM' : 'STANDARD',
          profitWinrakPercent: i === 0 ? 12 : 15,
          profitDriverPercent: i === 0 ? 88 : 85,
          lossWinrakPercent:   i === 0 ? 40 : 30,
          lossDriverPercent:   i === 0 ? 60 : 70,
          monthlyLossCap:      i === 0 ? 8000 : 5000,
          signedAt: new Date(),
          validUntil: new Date(Date.now() + 365 * 24 * 3600 * 1000),
          digitalSignature: crypto.randomBytes(16).toString('hex'),
          termsHash: crypto.createHash('sha256').update('winrak-terms-v1').digest('hex'),
          isActive: true,
        },
      });
    }
  }

  // ─── Pricing Config ────────────────────────────────────────────
  const pricingData = [
    { vehicleType: 'GO',      baseFare: 150, pricePerKm: 45,  waitingPerMin: 15 },
    { vehicleType: 'PLUS',    baseFare: 250, pricePerKm: 75,  waitingPerMin: 20 },
    { vehicleType: 'XL',      baseFare: 350, pricePerKm: 100, waitingPerMin: 25 },
    { vehicleType: 'SHE',     baseFare: 200, pricePerKm: 55,  waitingPerMin: 18 },
    { vehicleType: 'DELIVER', baseFare: 200, pricePerKm: 50,  waitingPerMin: 10 },
  ];

  for (const p of pricingData) {
    await prisma.pricingConfig.upsert({
      where: { vehicleType: p.vehicleType },
      update: p,
      create: p,
    });
  }

  // ─── Sample Completed Rides ────────────────────────────────────
  const allDrivers = await prisma.driver.findMany({ include: { vehicles: true } });
  const sampleRides = [
    { pickup: 'حيدرة', dropoff: 'باب الوادي', pLat: 36.7490, pLng: 3.0520, dLat: 36.7700, dLng: 2.9900, km: 8.2, fare: 519 },
    { pickup: 'القبة',  dropoff: 'المطار',     pLat: 36.7630, pLng: 3.1100, dLat: 36.6960, dLng: 3.2150, km: 14.5, fare: 803 },
    { pickup: 'بولوغين', dropoff: 'الجامعة',  pLat: 36.7340, pLng: 2.9800, dLat: 36.7200, dLng: 3.1800, km: 18.0, fare: 960 },
  ];

  for (let i = 0; i < sampleRides.length; i++) {
    const r = sampleRides[i];
    const driver = allDrivers[i % allDrivers.length];
    const vehicle = driver.vehicles[0];
    if (!vehicle) continue;

    await prisma.ride.create({
      data: {
        passengerId: passenger.id,
        driverId: driver.id,
        vehicleId: vehicle.id,
        status: 'COMPLETED',
        serviceType: 'GO',
        pickupLat: r.pLat, pickupLng: r.pLng, pickupAddress: r.pickup,
        dropoffLat: r.dLat, dropoffLng: r.dLng, dropoffAddress: r.dropoff,
        distanceKm: r.km,
        durationMinutes: Math.round(r.km * 3),
        baseFare: 150,
        totalFare: r.fare,
        paymentMethod: 'CASH',
        paymentStatus: 'COMPLETED',
        requestedAt: new Date(Date.now() - (i + 1) * 3600000),
        startedAt:   new Date(Date.now() - (i + 1) * 3600000 + 600000),
        completedAt: new Date(Date.now() - (i + 1) * 3600000 + 3000000),
      },
    });
  }

  // ─── Sample Incident ───────────────────────────────────────────
  const firstDriver = allDrivers[0];
  const firstContract = await prisma.driverContract.findFirst({ where: { driverId: firstDriver.id } });
  const firstRide = await prisma.ride.findFirst({ where: { driverId: firstDriver.id } });

  if (firstRide && !await prisma.incident.findFirst({ where: { rideId: firstRide.id } })) {
    await prisma.incident.create({
      data: {
        rideId: firstRide.id,
        driverId: firstDriver.id,
        contractId: firstContract?.id,
        incidentType: 'ACCIDENT_MINOR',
        description: 'خدش بسيط في الباب الأمامي الأيمن أثناء التوقف',
        totalLossAmount: 15000,
        winrakCovers: 4500,
        driverCovers: 10500,
        status: 'PENDING',
        evidenceUrls: '[]',
      },
    });
  }

  console.log('✅ Seed complete!');
  console.log('');
  console.log('📱 Test accounts:');
  console.log('   Passenger: +213555000001  (OTP: 123456)');
  console.log('   Driver:    +213660000001  (OTP: 123456)');
  console.log('   Admin:     +213000000000  (OTP: 123456)');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
