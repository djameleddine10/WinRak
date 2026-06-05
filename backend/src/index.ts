import 'dotenv/config';
import express from 'express';
import http from 'http';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import { Server } from 'socket.io';

import { logger } from './utils/logger';
import { errorHandler } from './middleware/errorHandler';
import { rateLimiter } from './middleware/rateLimiter';
import { setupSocketHandlers } from './socket';
import { router } from './router';

const app = express();
const server = http.createServer(app);

// ─── Socket.io ────────────────────────────────────────────────
export const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || '*',
    methods: ['GET', 'POST'],
  },
  transports: ['websocket', 'polling'],
});

setupSocketHandlers(io);

// ─── Middleware ────────────────────────────────────────────────
app.use(helmet());
app.use(cors({ origin: process.env.CLIENT_URL || '*', credentials: true }));
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan('combined', { stream: { write: (msg) => logger.info(msg.trim()) } }));
app.use(rateLimiter);

// ─── Routes ───────────────────────────────────────────────────
app.use('/api/v1', router);

app.get('/health', (_, res) => {
  res.json({ status: 'ok', service: 'WinRak API', timestamp: new Date().toISOString() });
});

// ─── Error Handler ────────────────────────────────────────────
app.use(errorHandler);

// ─── Start ────────────────────────────────────────────────────
const PORT = parseInt(process.env.PORT || '3000', 10);
const HOST = '0.0.0.0';
server.listen(PORT, HOST, () => {
  logger.info(`🚖 WinRak API running on ${HOST}:${PORT} — وين راك؟ نجيك!`);
});

export default app;
