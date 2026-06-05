// ═══ WinRak Backend — Real (DB + Live Matching) ═══════════════
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const crypto = require('crypto');
const db = require('./db');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

app.use(express.json());
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET,POST,PATCH,PUT,DELETE,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

const id = (p) => p + '-' + crypto.randomBytes(6).toString('hex');
const PRICES = { GO: 35, PLUS: 50, XL: 70, SHE: 45, DELIVER: 30 };

// distance between 2 GPS points (Haversine, km)
function distKm(lat1, lng1, lat2, lng2) {
  const R = 6371, toR = (d) => d * Math.PI / 180;
  const dLat = toR(lat2 - lat1), dLng = toR(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toR(lat1)) * Math.cos(toR(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function estimate(vehicleType, distance) {
  const d = distance || 8.4;
  const total = Math.round(100 + d * (PRICES[vehicleType] || 35));
  return { total, estimatedDistance: Math.round(d * 10) / 10, estimatedDuration: Math.round(d * 2.6) };
}

// ─── Health ───────────────────────────────────────────────────
app.get('/health', (req, res) => res.json({ status: 'ok', message: 'WinRak Backend is running!' }));
app.get('/api/v1/health', (req, res) => res.json({ status: 'ok', service: 'WinRak', timestamp: new Date() }));

// ─── Auth ─────────────────────────────────────────────────────
app.post('/api/v1/auth/send-otp', (req, res) => {
  // In production: send real SMS. Demo: master code 000000
  res.json({ success: true, message: 'OTP sent' });
});

app.post('/api/v1/auth/verify-otp', (req, res) => {
  const { phone, code } = req.body;
  if (code !== '000000') return res.json({ success: false, message: 'رمز خاطئ' });

  const isDriver = phone === '+213660000001' || phone.startsWith('+21366');
  let user = db.prepare('SELECT * FROM users WHERE phone = ?').get(phone);

  if (!user) {
    const uid = id(isDriver ? 'driver' : 'passenger');
    db.prepare('INSERT INTO users (id, phone, fullName, role, winPoints) VALUES (?,?,?,?,?)')
      .run(uid, phone, isDriver ? 'سائق WinRak' : 'راكب WinRak', isDriver ? 'DRIVER' : 'PASSENGER', isDriver ? 0 : 100);
    user = db.prepare('SELECT * FROM users WHERE id = ?').get(uid);

    if (isDriver) {
      const did = id('drv');
      db.prepare('INSERT INTO drivers (id, userId, carModel, carPlate, lat, lng) VALUES (?,?,?,?,?,?)')
        .run(did, uid, 'هيونداي i10', '12345-116-16', 36.752, 3.042);
      db.prepare('INSERT INTO contracts (id, driverId) VALUES (?,?)').run(id('ctr'), did);
    }
  }
  res.json({ success: true, accessToken: 'winrak-' + user.id, user });
});

// helper: get user from token "winrak-<userId>"
function userFromToken(req) {
  const t = (req.headers.authorization || '').replace('Bearer ', '');
  const uid = t.replace('winrak-', '');
  return db.prepare('SELECT * FROM users WHERE id = ?').get(uid);
}

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
  const rid = id('ride');

  db.prepare(`INSERT INTO rides
    (id, passengerId, status, serviceType, pickupLat, pickupLng, pickupAddress,
     dropoffLat, dropoffLng, dropoffAddress, totalFare, distance, duration, paymentMethod)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`)
    .run(rid, u.id, 'SEARCHING', b.serviceType, b.pickupLat, b.pickupLng, b.pickupAddress,
      b.dropoffLat, b.dropoffLng, b.dropoffAddress, est.total, est.estimatedDistance, est.estimatedDuration, b.paymentMethod || 'CASH');

  const ride = db.prepare('SELECT * FROM rides WHERE id = ?').get(rid);

  // 🔴 LIVE: notify all online drivers
  io.to('drivers').emit('new_ride', ride);

  res.json({ success: true, ride });
});

app.get('/api/v1/rides/my', (req, res) => {
  const u = userFromToken(req);
  if (!u) return res.json({ success: false, rides: [] });
  const rides = db.prepare('SELECT * FROM rides WHERE passengerId = ? ORDER BY requestedAt DESC').all(u.id);
  res.json({ success: true, rides });
});

// driver accepts a ride
app.post('/api/v1/rides/:id/accept', (req, res) => {
  const u = userFromToken(req);
  const drv = db.prepare('SELECT * FROM drivers WHERE userId = ?').get(u.id);
  db.prepare("UPDATE rides SET status='ACCEPTED', driverId=? WHERE id=?").run(drv.id, req.params.id);
  const ride = db.prepare('SELECT * FROM rides WHERE id = ?').get(req.params.id);
  io.emit('ride_accepted_' + ride.passengerId, { ride, driver: { ...drv, fullName: u.fullName } });
  res.json({ success: true, ride });
});

// ─── Drivers ──────────────────────────────────────────────────
app.get('/api/v1/drivers/me/earnings', (req, res) => {
  const u = userFromToken(req);
  const drv = db.prepare('SELECT * FROM drivers WHERE userId = ?').get(u?.id);
  res.json({ success: true, total: drv?.totalEarnings || 0, period: 'today', driver: { totalTrips: drv?.totalTrips || 0 } });
});

app.patch('/api/v1/drivers/status', (req, res) => {
  const u = userFromToken(req);
  const online = req.body.isOnline ? 1 : 0;
  db.prepare('UPDATE drivers SET isOnline=? WHERE userId=?').run(online, u.id);
  res.json({ success: true, isOnline: !!online });
});

// available rides for drivers
app.get('/api/v1/rides/available', (req, res) => {
  const rides = db.prepare("SELECT * FROM rides WHERE status='SEARCHING' ORDER BY requestedAt DESC LIMIT 20").all();
  res.json({ success: true, rides });
});

// ─── Contracts ────────────────────────────────────────────────
app.get('/api/v1/contracts/my', (req, res) => {
  const u = userFromToken(req);
  const drv = db.prepare('SELECT * FROM drivers WHERE userId = ?').get(u?.id);
  const c = drv ? db.prepare('SELECT * FROM contracts WHERE driverId = ?').get(drv.id) : null;
  res.json({ success: true, contract: c });
});

// ─── Admin (dashboard) ────────────────────────────────────────
app.get('/api/v1/admin/stats', (req, res) => {
  const totalRides = db.prepare('SELECT COUNT(*) n FROM rides').get().n;
  const revenue = db.prepare("SELECT COALESCE(SUM(totalFare),0) s FROM rides WHERE status='COMPLETED'").get().s;
  const drivers = db.prepare('SELECT COUNT(*) n FROM drivers WHERE isOnline=1').get().n;
  const users = db.prepare('SELECT COUNT(*) n FROM users').get().n;
  res.json({ totalRides, totalRevenue: revenue, activeDrivers: drivers, activeUsers: users });
});

// ═══ Socket.io — Live tracking ════════════════════════════════
io.on('connection', (socket) => {
  socket.on('join_drivers', () => socket.join('drivers'));

  // driver sends location → forward to the passenger tracking that ride
  socket.on('driver_location', ({ rideId, passengerId, lat, lng }) => {
    io.emit('driver_moved_' + passengerId, { rideId, lat, lng });
  });

  socket.on('ride_status', ({ rideId, passengerId, status }) => {
    db.prepare('UPDATE rides SET status=? WHERE id=?').run(status, rideId);
    io.emit('ride_status_' + passengerId, { rideId, status });
  });
});

// ─── Start ────────────────────────────────────────────────────
const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', () => console.log('✅ WinRak Backend (real) running on port ' + PORT));
