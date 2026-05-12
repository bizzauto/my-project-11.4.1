// @ts-nocheck
import { createClient, RedisClientType } from 'redis';

let redisClient: RedisClientType | null = null;
let isConnected = false;

export async function initRedis(): Promise<RedisClientType | null> {
  if (redisClient && isConnected) {
    return redisClient;
  }

  try {
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
    
    redisClient = createClient({
      url: redisUrl,
      socket: {
        reconnectStrategy: (retries) => {
          if (retries > 20) {
            return new Error('Redis reconnection failed');
          }
          return Math.min(retries * 100, 3000);
        },
      },
    });

    redisClient.on('error', (err) => {
      console.error('Redis error:', err.message);
      isConnected = false;
    });

    redisClient.on('connect', () => {
      console.log('✅ Redis connected');
      isConnected = true;
    });

    await redisClient.connect();
    return redisClient;
  } catch (error) {
    console.error('Redis connection failed:', error);
    return null;
  }
}

export function getRedisClient(): RedisClientType | null {
  return redisClient;
}

// Cache helpers
export const cacheHelpers = {
  // Get with expiration
  async getOrSet<T>(
    key: string,
    callback: () => Promise<T>,
    expirationSeconds: number = 300
  ): Promise<T> {
    if (!redisClient || !isConnected) {
      return callback();
    }

    try {
      const cached = await redisClient.get(key);
      if (cached) {
        return JSON.parse(cached) as T;
      }

      const data = await callback();
      if (data) {
        await redisClient.setEx(key, expirationSeconds, JSON.stringify(data));
      }
      return data;
    } catch (error) {
      console.error('Cache error:', error);
      return callback();
    }
  },

  // Invalidate pattern
  async invalidatePattern(pattern: string): Promise<void> {
    if (!redisClient || !isConnected) return;

    try {
      const keys = await redisClient.keys(pattern);
      if (keys.length > 0) {
        await redisClient.del(keys);
        console.log(`🗑️ Invalidated ${keys.length} cache keys matching: ${pattern}`);
      }
    } catch (error) {
      console.error('Cache invalidation error:', error);
    }
  },

  // User-specific cache
  async cacheUserData<T>(userId: string, key: string, data: T, ttl: number = 3600): Promise<void> {
    if (!redisClient || !isConnected) return;
    
    try {
      await redisClient.setEx(`user:${userId}:${key}`, ttl, JSON.stringify(data));
    } catch (error) {
      console.error('User cache error:', error);
    }
  },

  async getUserData<T>(userId: string, key: string): Promise<T | null> {
    if (!redisClient || !isConnected) return null;
    
    try {
      const data = await redisClient.get(`user:${userId}:${key}`);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('User cache get error:', error);
      return null;
    }
  },

  // Business-specific cache
  async cacheBusinessData<T>(businessId: string, key: string, data: T, ttl: number = 600): Promise<void> {
    if (!redisClient || !isConnected) return;
    
    try {
      await redisClient.setEx(`business:${businessId}:${key}`, ttl, JSON.stringify(data));
    } catch (error) {
      console.error('Business cache error:', error);
    }
  },

  async getBusinessData<T>(businessId: string, key: string): Promise<T | null> {
    if (!redisClient || !isConnected) return null;
    
    try {
      const data = await redisClient.get(`business:${businessId}:${key}`);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Business cache get error:', error);
      return null;
    }
  },

  // Rate limiting with Redis
  async checkRateLimit(key: string, limit: number, windowSeconds: number): Promise<boolean> {
    if (!redisClient || !isConnected) return true;

    try {
      const current = await redisClient.incr(key);
      if (current === 1) {
        await redisClient.expire(key, windowSeconds);
      }
      return current <= limit;
    } catch (error) {
      console.error('Rate limit check error:', error);
      return true;
    }
  },
};

export default redisClient;