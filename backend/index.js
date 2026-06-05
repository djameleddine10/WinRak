const express = require('express');
const http = require('http');

const app = express();
const server = http.createServer(app);

app.use(express.json());

// CORS
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET,POST,PATCH,PUT,DELETE,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

// ─── Health ───────────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'WinRak Backend is running!' });
});
app.get('/api/v1/health', (req, res) => {
  res.json({ status: 'ok', service: 'WinRak', timestamp: new Date() });
});

// ─── In-memory ride store ─────────────────────────────────────
const ridesStore = [];

// ─── Auth ─────────────────────────────────────────────────────
app.post('/api/v1/auth/send-otp', (req, res) => {
  res.json({ success: true, message: 'OTP sent' });
});

app.post('/api/v1/auth/verify-otp', (req, res) => {
  const { phone } = req.body;
  const isDriver = phone === '+213660000001';
  res.json({
    success: true,
    accessToken: 'winrak-token-' + Date.now(),
    user: {
      id: isDriver ? 'driver-1' : 'passenger-1',
      phone: phone,
      fullName: isDriver ? 'كريم بن علي' : 'أحمد المسافر',
      role: isDriver ? 'DRIVER' : 'PASSENGER',
      winPoints: isDriver ? 0 : 250,
    },
  });
});

// ─── Rides ────────────────────────────────────────────────────
const PRICES = { GO: 35, PLUS: 50, XL: 70, SHE: 45, DELIVER: 30 };

function calcEstimate(vehicleType) {
  const distance = 8.4; // km (demo route حيدرة → باب الوادي)
  const duration = 22; // min
  const base = 100;
  const perKm = PRICES[vehicleType] || 35;
  const total = Math.round(base + distance * perKm);
  return { total, estimatedDistance: distance, estimatedDuration: duration };
}

app.post('/api/v1/rides/estimate', (req, res) => {
  const { vehicleType } = req.body;
  res.json(calcEstimate(vehicleType));
});

app.post('/api/v1/rides/request', (req, res) => {
  const { serviceType, pickupAddress, dropoffAddress } = req.body;
  const est = calcEstimate(serviceType);
  const ride = {
    id: 'ride-' + Date.now(),
    totalFare: est.total,
    status: 'SEARCHING',
    serviceType: serviceType,
    pickupAddress: pickupAddress || 'حيدرة، الجزائر',
    dropoffAddress: dropoffAddress || 'باب الوادي، الجزائر',
    requestedAt: new Date().toISOString(),
  };
  ridesStore.unshift(ride);
  res.json({ success: true, ride });
});

app.get('/api/v1/rides/my', (req, res) => {
  // Return stored rides + some demo history
  const demo = [
    {
      id: 'demo-1', totalFare: 380, status: 'COMPLETED',
      serviceType: 'GO', pickupAddress: 'حيدرة', dropoffAddress: 'باب الوادي',
      requestedAt: new Date(Date.now() - 86400000).toISOString(),
    },
    {
      id: 'demo-2', totalFare: 520, status: 'COMPLETED',
      serviceType: 'PLUS', pickupAddress: 'الأبيار', dropoffAddress: 'المرادية',
      requestedAt: new Date(Date.now() - 172800000).toISOString(),
    },
  ];
  res.json({ success: true, rides: [...ridesStore, ...demo] });
});

// ─── Drivers ──────────────────────────────────────────────────
let driverOnline = false;

app.get('/api/v1/drivers/me/earnings', (req, res) => {
  res.json({
    success: true,
    total: 3450,
    period: 'today',
    driver: { totalTrips: 127 },
  });
});

app.patch('/api/v1/drivers/status', (req, res) => {
  driverOnline = !!req.body.isOnline;
  res.json({ success: true, isOnline: driverOnline });
});

// ─── Contracts ────────────────────────────────────────────────
app.get('/api/v1/contracts/my', (req, res) => {
  res.json({
    success: true,
    contract: {
      contractType: 'STANDARD',
      profitDriverPercent: 85,
      profitWinrakPercent: 15,
      lossWinrakPercent: 30,
      monthlyLossCap: 20000,
    },
  });
});

// ─── Admin (dashboard) ────────────────────────────────────────
app.get('/api/v1/admin/stats', (req, res) => {
  res.json({ totalRides: 127, totalRevenue: 48500, activeDrivers: 12, activeUsers: 340 });
});

// ─── Start ────────────────────────────────────────────────────
const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', () => {
  console.log('✅ WinRak Backend running on port ' + PORT);
});
