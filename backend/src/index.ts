import 'dotenv/config';
import express from 'express';
import http from 'http';
import cors from 'cors';
import helmet from 'helmet';

const app = express();
const server = http.createServer(app);

// ─── Middleware ────────────────────────────────────────────────
app.use(helmet());
app.use(cors({ origin: '*', credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ─── Health Check ─────────────────────────────────────────────
app.get('/health', (_, res) => {
  res.json({ status: 'ok', service: 'WinRak API' });
});

// ─── API Routes ───────────────────────────────────────────────
app.get('/api/v1/health', (_, res) => {
  res.json({ status: 'ok', message: 'WinRak Backend is running!' });
});

// ─── Start Server ──────────────────────────────────────────────
const PORT = parseInt(process.env.PORT || '3000', 10);
const HOST = '0.0.0.0';

server.listen(PORT, HOST, () => {
  console.log(`✅ WinRak Backend running on ${HOST}:${PORT}`);
});

export default app;
