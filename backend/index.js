// ═══ WinRak Backend — Real (In-Memory, zero file I/O) ═════════
const express = require('express');
const http = require('http');
const crypto = require('crypto');

const app = express();
const server = http.createServer(app);

app.use(express.json());
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET,POST,PATCH,PUT,DELETE,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

// ─── In-memory store ──────────────────────────────────────────
const DB = { users: {}, drivers: {}, rides: {}, contracts: {} };

// 🤖 سائق محاكاة للتجربة على جهاز واحد
const SIM_DRIVER = {
  id: 'sim-driver', userId: 'sim-user', isOnline: true,
  lat: 36.751, lng: 3.048, carModel: 'رينو سيمبول', carPlate: '09823-114-16',
  rating: 4.8, totalTrips: 342, totalEarnings: 0,
};
DB.drivers['sim-user'] = SIM_DRIVER;
DB.users['sim-user'] = { id: 'sim-user', phone: '+213699999999', fullName: 'محمد السائق', role: 'DRIVER' };
const uid = (p) => p + '-' + crypto.randomBytes(6).toString('hex');
const PRICES = { GO: 35, PLUS: 50, XL: 70, SHE: 45, DELIVER: 30 };

function distKm(lat1, lng1, lat2, lng2) {
  const R = 6371, toR = (d) => d * Math.PI / 180;
  const dLat = toR(lat2 - lat1), dLng = toR(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toR(lat1)) * Math.cos(toR(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
function estimate(vt, d) {
  const dist = d || 8.4;
  return { total: Math.round(100 + dist * (PRICES[vt] || 35)), estimatedDistance: Math.round(dist * 10) / 10, estimatedDuration: Math.round(dist * 2.6) };
}
function userFromToken(req) {
  const t = (req.headers.authorization || '').replace('Bearer ', '');
  return DB.users[t.replace('winrak-', '')];
}

// ─── Health ───────────────────────────────────────────────────
app.get('/health', (req, res) => res.json({ status: 'ok', message: 'WinRak Backend is running!' }));
app.get('/api/v1/health', (req, res) => res.json({ status: 'ok', service: 'WinRak', timestamp: new Date() }));

// ─── Auth ─────────────────────────────────────────────────────
app.post('/api/v1/auth/send-otp', (req, res) => res.json({ success: true, message: 'OTP sent' }));

app.post('/api/v1/auth/verify-otp', (req, res) => {
  const { phone, code, fullName } = req.body;
  if (code !== '000000') return res.json({ success: false, message: 'رمز خاطئ' });
  const isDriver = phone === '+213660000001' || phone.startsWith('+21366');

  let user = Object.values(DB.users).find(u => u.phone === phone);
  if (!user) {
    const id = uid(isDriver ? 'driver' : 'passenger');
    const name = (fullName && fullName.trim()) ? fullName.trim() : (isDriver ? 'سائق WinRak' : 'راكب WinRak');
    user = { id, phone, fullName: name, role: isDriver ? 'DRIVER' : 'PASSENGER', winPoints: isDriver ? 0 : 100, createdAt: new Date().toISOString() };
    DB.users[id] = user;
    if (isDriver) {
      const did = uid('drv');
      DB.drivers[id] = { id: did, userId: id, isOnline: false, lat: 36.752, lng: 3.042, carModel: 'هيونداي i10', carPlate: '12345-116-16', rating: 4.9, totalTrips: 0, totalEarnings: 0 };
      DB.contracts[did] = { contractType: 'STANDARD', profitDriverPercent: 85, profitWinrakPercent: 15, lossWinrakPercent: 30, monthlyLossCap: 20000 };
    }
  }
  res.json({ success: true, accessToken: 'winrak-' + user.id, user });
});

// ─── Rides ────────────────────────────────────────────────────
app.post('/api/v1/rides/estimate', (req, res) => {
  const { vehicleType, pickupLat, pickupLng, dropoffLat, dropoffLng } = req.body;
  const d = (pickupLat && dropoffLat) ? distKm(pickupLat, pickupLng, dropoffLat, dropoffLng) : 8.4;
  res.json(estimate(vehicleType, d));
});

app.post('/api/v1/rides/request', (req, res) => {
  const u = userFromToken(req);
  if (!u) return res.json({ success: false, message: 'غير مسجل' });
  const b = req.body;
  const d = (b.pickupLat && b.dropoffLat) ? distKm(b.pickupLat, b.pickupLng, b.dropoffLat, b.dropoffLng) : 8.4;
  const est = estimate(b.serviceType, d);
  const id = uid('ride');
  const ride = {
    id, passengerId: u.id, driverId: null, status: 'SEARCHING', serviceType: b.serviceType,
    pickupLat: b.pickupLat, pickupLng: b.pickupLng, pickupAddress: b.pickupAddress,
    dropoffLat: b.dropoffLat, dropoffLng: b.dropoffLng, dropoffAddress: b.dropoffAddress,
    totalFare: est.total, distance: est.estimatedDistance, duration: est.estimatedDuration,
    paymentMethod: b.paymentMethod || 'CASH', requestedAt: new Date().toISOString(), completedAt: null,
  };
  DB.rides[id] = ride;
  res.json({ success: true, ride });

  // 🤖 محاكاة: سائق افتراضي يقبل ويتقدّم تلقائياً (للتجربة على جهاز واحد)
  // إن قبِلها سائق حقيقي قبل 6 ثوان، تتوقف المحاكاة
  setTimeout(() => {
    const r = DB.rides[id];
    if (r && r.status === 'SEARCHING') {
      r.status = 'ACCEPTED'; r.driverId = SIM_DRIVER.id; r.simulated = true;
    }
  }, 6000);
  setTimeout(() => { const r = DB.rides[id]; if (r && r.simulated && r.status === 'ACCEPTED') r.status = 'ARRIVED'; }, 14000);
  setTimeout(() => { const r = DB.rides[id]; if (r && r.simulated && r.status === 'ARRIVED') r.status = 'ONGOING'; }, 22000);
  setTimeout(() => {
    const r = DB.rides[id];
    if (r && r.simulated && r.status === 'ONGOING') { r.status = 'COMPLETED'; r.completedAt = new Date().toISOString(); }
  }, 38000);
});

app.get('/api/v1/rides/my', (req, res) => {
  const u = userFromToken(req);
  if (!u) return res.json({ success: false, rides: [] });
  const rides = Object.values(DB.rides).filter(r => r.passengerId === u.id).sort((a, b) => b.requestedAt.localeCompare(a.requestedAt));
  res.json({ success: true, rides });
});

// enrich a ride with passenger info for the driver UI
function enrichRide(r) {
  const p = DB.users[r.passengerId];
  return { ...r, passengerName: p?.fullName || 'راكب', passengerPhone: p?.phone || '', passengerRating: 4.8 };
}

app.get('/api/v1/rides/available', (req, res) => {
  const rides = Object.values(DB.rides).filter(r => r.status === 'SEARCHING').sort((a, b) => b.requestedAt.localeCompare(a.requestedAt)).slice(0, 20).map(enrichRide);
  res.json({ success: true, rides });
});

app.post('/api/v1/rides/:id/accept', (req, res) => {
  const u = userFromToken(req);
  const drv = DB.drivers[u?.id];
  const ride = DB.rides[req.params.id];
  if (!ride || !drv) return res.json({ success: false });
  ride.status = 'ACCEPTED';
  ride.driverId = drv.id;
  res.json({ success: true, ride: enrichRide(ride) });
});

app.post('/api/v1/rides/:id/status', (req, res) => {
  const u = userFromToken(req);
  const { status } = req.body;
  const ride = DB.rides[req.params.id];
  if (!ride) return res.json({ success: false });
  if (status === 'COMPLETED') {
    ride.status = 'COMPLETED';
    ride.completedAt = new Date().toISOString();
    const drv = DB.drivers[u?.id];
    if (drv) { drv.totalTrips += 1; drv.totalEarnings += Math.round(ride.totalFare * 0.85); drv.hoursOnline = Math.round(((drv.hoursOnline || 0) + 0.4) * 10) / 10; }
  } else ride.status = status;
  res.json({ success: true });
});

app.get('/api/v1/rides/:id', (req, res) => {
  const ride = DB.rides[req.params.id];
  if (!ride) return res.json({ success: false });
  let driver = null;
  if (ride.driverId) {
    const d = Object.values(DB.drivers).find(x => x.id === ride.driverId);
    if (d) {
      const du = DB.users[d.userId];
      // السائق الافتراضي يظهر قرب موقع الراكب (~300م) ليبدو واقعياً في أي مدينة
      let lat = d.lat, lng = d.lng;
      if (d.id === SIM_DRIVER.id && ride.pickupLat) {
        lat = ride.pickupLat + 0.003; lng = ride.pickupLng + 0.002;
      }
      driver = { fullName: du?.fullName || 'سائق', carModel: d.carModel, carPlate: d.carPlate, rating: d.rating, lat, lng };
    }
  }
  res.json({ success: true, ride, driver });
});

// ─── Drivers ──────────────────────────────────────────────────
app.get('/api/v1/drivers/me/earnings', (req, res) => {
  const u = userFromToken(req);
  const drv = DB.drivers[u?.id];
  res.json({ success: true, total: drv?.totalEarnings || 0, hoursOnline: drv?.hoursOnline || 0, rating: drv?.rating || 4.9, acceptance: 95.0, cancellation: 2.0, period: 'today', driver: { totalTrips: drv?.totalTrips || 0 } });
});

// رحلات السائق (السجل + الحالية) لشاشة Home
app.get('/api/v1/drivers/me/trips', (req, res) => {
  const u = userFromToken(req);
  const drv = DB.drivers[u?.id];
  if (!drv) return res.json({ success: true, trips: [] });
  const trips = Object.values(DB.rides)
    .filter(r => r.driverId === drv.id)
    .sort((a, b) => (b.completedAt || b.requestedAt).localeCompare(a.completedAt || a.requestedAt));
  res.json({ success: true, trips });
});

app.patch('/api/v1/drivers/status', (req, res) => {
  const u = userFromToken(req);
  const drv = DB.drivers[u?.id];
  if (drv) drv.isOnline = !!req.body.isOnline;
  res.json({ success: true, isOnline: !!req.body.isOnline });
});

// ─── Contracts ────────────────────────────────────────────────
app.get('/api/v1/contracts/my', (req, res) => {
  const u = userFromToken(req);
  const drv = DB.drivers[u?.id];
  res.json({ success: true, contract: drv ? DB.contracts[drv.id] : null });
});

// ─── Admin ────────────────────────────────────────────────────
app.get('/api/v1/admin/stats', (req, res) => {
  const rides = Object.values(DB.rides);
  res.json({
    totalRides: rides.length,
    totalRevenue: rides.filter(r => r.status === 'COMPLETED').reduce((s, r) => s + r.totalFare, 0),
    activeDrivers: Object.values(DB.drivers).filter(d => d.isOnline).length,
    activeUsers: Object.keys(DB.users).length,
  });
});

// ─── Start ────────────────────────────────────────────────────
const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', () => console.log('✅ WinRak Backend (in-memory) running on port ' + PORT));
