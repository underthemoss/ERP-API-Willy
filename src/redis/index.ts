import { logger } from '../lib/logger';
import { RedisOptions, Redis } from 'ioredis';

let instance: Redis | null = null;

type ClientOps = {
  REDIS_HOST: string;
  REDIS_PORT: number;
  ENABLE_REDIS_AUTO_PIPELINING: boolean;
  redisOptions?: RedisOptions;
};

function newClient(options: ClientOps): Redis {
  const client = new Redis({
    host: options.REDIS_HOST,
    port: options.REDIS_PORT,
    enableAutoPipelining: options.ENABLE_REDIS_AUTO_PIPELINING,
    ...options.redisOptions,
  });

  client.on('connect', () => {
    logger.info('Redis - Connection status: connected');
  });
  client.on('end', () => {
    logger.info('Redis - Connection status: disconnected');
  });
  client.on('reconnecting', () => {
    logger.info('Redis - Connection status: reconnecting');
  });
  client.on('error', (err: any) => {
    logger.error({ message: 'Redis - Connection status: error ', err });
  });

  return client;
}

export function getRedisClient(options: ClientOps): Redis {
  if (instance) {
    return instance;
  }

  instance = newClient(options);
  return instance;
}

export async function closeRedis(): Promise<void> {
  if (!instance) return;
  try {
    // If we never connected, disconnect() is instant & safe.
    // If connected, prefer graceful quit().
    if (instance.status === 'ready' || instance.status === 'connecting') {
      await instance.quit();
    } else {
      instance.disconnect();
    }
  } finally {
    instance = null;
  }
}
