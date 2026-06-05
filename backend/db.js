// ─── WinRak Database (SQLite - file based, zero install) ──────
const Database = require('better-sqlite3');
const path = require('path');

const db = new Database(path.join(__dirname, 'winrak.db'));
db.pragma('journal_mode = WAL');

// ─── Schema ───────────────────────────────────────────────────
db.exec(`
CREATE TABLE IF NOT EXISTS users (
  id          TEXT PRIMARY KEY,
  phone       TEXT UNIQUE NOT NULL,
  fullName    TEXT,
  role        TEXT DEFAULT 'PASSENGER',
  winPoints   INTEGER DEFAULT 0,
  createdAt   TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS drivers (
  id          TEXT PRIMARY KEY,
  userId      TEXT,
  isOnline    INTEGER DEFAULT 0,
  lat         REAL,
  lng         REAL,
  carModel    TEXT DEFAULT 'سيارة',
  carPlate    TEXT DEFAULT '00000-000-16',
  rating      REAL DEFAULT 5.0,
  totalTrips  INTEGER DEFAULT 0,
  totalEarnings REAL DEFAULT 0,
  FOREIGN KEY(userId) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS rides (
  id            TEXT PRIMARY KEY,
  passengerId   TEXT,
  driverId      TEXT,
  status        TEXT DEFAULT 'SEARCHING',
  serviceType   TEXT,
  pickupLat     REAL,
  pickupLng     REAL,
  pickupAddress TEXT,
  dropoffLat    REAL,
  dropoffLng    REAL,
  dropoffAddress TEXT,
  totalFare     REAL,
  distance      REAL,
  duration      INTEGER,
  paymentMethod TEXT DEFAULT 'CASH',
  requestedAt   TEXT DEFAULT (datetime('now')),
  completedAt   TEXT
);

CREATE TABLE IF NOT EXISTS contracts (
  id                  TEXT PRIMARY KEY,
  driverId            TEXT,
  contractType        TEXT DEFAULT 'STANDARD',
  profitDriverPercent INTEGER DEFAULT 85,
  profitWinrakPercent INTEGER DEFAULT 15,
  lossWinrakPercent   INTEGER DEFAULT 30,
  monthlyLossCap      INTEGER DEFAULT 20000,
  signedAt            TEXT DEFAULT (datetime('now'))
);
`);

module.exports = db;
