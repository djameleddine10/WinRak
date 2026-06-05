const express = require('express');
const http = require('http');

const app = express();
const server = http.createServer(app);

app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'WinRak Backend is running!' });
});

// API Health
app.get('/api/v1/health', (req, res) => {
  res.json({ status: 'ok', service: 'WinRak', timestamp: new Date() });
});

// Auth - OTP Login
app.post('/api/v1/auth/request-otp', (req, res) => {
  const { phone } = req.body;
  res.json({ success: true, message: 'OTP sent', otp: '000000' });
});

app.post('/api/v1/auth/verify-otp', (req, res) => {
  const { phone, otp } = req.body;
  res.json({
    success: true,
    token: 'test-token-' + Date.now(),
    user: { id: '1', phone, role: 'passenger' }
  });
});

// Admin Stats
app.get('/api/v1/admin/stats', (req, res) => {
  res.json({
    totalRides: 15,
    totalRevenue: 4500,
    activeDrivers: 8,
    activeUsers: 42
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ WinRak Backend running on port ${PORT}`);
});
