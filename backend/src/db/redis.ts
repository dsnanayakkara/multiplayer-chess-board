import Redis from 'ioredis';

let redisClient: Redis | null = null;

export const getRedis = (): Redis => {
  if (!redisClient) {
    redisClient = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
  }

  return redisClient;
};
