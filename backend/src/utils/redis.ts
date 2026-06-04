// Redis wrapper — uses real Redis if available, falls back to in-memory Map for dev/testing
import { logger } from './logger';

interface IRedisClient {
  get(key: string): Promise<string | null>;
  set(key: string, value: string, mode?: string, ttl?: number): Promise<void>;
  del(key: string): Promise<void>;
  ping(): Promise<string>;
}

// In-memory fallback (for development without Redis)
class InMemoryRedis implements IRedisClient {
  private store = new Map<string, { value: string; expiry?: number }>();

  async get(key: string) {
    const item = this.store.get(key);
    if (!item) return null;
    if (item.expiry && Date.now() > item.expiry) { this.store.delete(key); return null; }
    return item.value;
  }

  async set(key: string, value: string, mode?: string, ttl?: number) {
    const expiry = (mode === 'EX' && ttl) ? Date.now() + ttl * 1000 : undefined;
    this.store.set(key, { value, expiry });
  }

  async del(key: string) { this.store.delete(key); }
  async ping() { return 'PONG'; }
}

let redisClient: IRedisClient = new InMemoryRedis();
logger.info('🗄️  Using in-memory store (no Redis required for dev)');

// Try to connect to real Redis if available
async function tryConnectRedis() {
  try {
    const Redis = (await import('ioredis')).default;
    const client = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
      lazyConnect: true, connectTimeout: 2000, maxRetriesPerRequest: 1,
    });
    await client.connect();
    const pong = await client.ping();
    if (pong === 'PONG') {
      redisClient = {
        get: (k) => client.get(k),
        set: async (k, v, mode, ttl) => {
          if (mode === 'EX' && ttl) await client.set(k, v, 'EX', ttl);
          else await client.set(k, v);
        },
        del: (k) => client.del(k).then(() => {}),
        ping: () => client.ping(),
      };
      logger.info('✅ Redis connected (real)');
    }
  } catch {
    logger.info('📦 Redis not available — using in-memory fallback');
  }
}

tryConnectRedis();

export const redis = {
  get: (key: string) => redisClient.get(key),
  set: (key: string, value: string, mode?: string, ttl?: number) => redisClient.set(key, value, mode, ttl),
  del: (key: string) => redisClient.del(key),
  ping: () => redisClient.ping(),
};

export const setWithExpiry = (key: string, value: string, seconds: number) =>
  redisClient.set(key, value, 'EX', seconds);

export const getAndDelete = async (key: string) => {
  const value = await redisClient.get(key);
  if (value) await redisClient.del(key);
  return value;
};
