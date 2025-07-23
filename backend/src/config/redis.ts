import Redis from 'ioredis';

class RedisConnection {
  private static instance: Redis;

  private constructor() {}

  public static getInstance(): Redis {
    if (!RedisConnection.instance) {
      const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
      RedisConnection.instance = new Redis(redisUrl, {
        retryDelayOnFailover: 100,
        maxRetriesPerRequest: 3,
        lazyConnect: true,
      });

      RedisConnection.instance.on('error', (error) => {
        console.error('Redis connection error:', error);
      });

      RedisConnection.instance.on('connect', () => {
        console.log('✅ Redis connected successfully');
      });
    }
    return RedisConnection.instance;
  }

  public static async disconnect(): Promise<void> {
    if (RedisConnection.instance) {
      await RedisConnection.instance.quit();
    }
  }
}

export const redis = RedisConnection.getInstance();
export default RedisConnection;