import os from 'os';
import { logger } from '../lib/logger';

/**
 * Returns a Kafka consumer group ID, prefixing with the host machine name in dev/local environments.
 * @param baseId The base group ID from config/env.
 */
export function getKafkaConsumerGroupId(baseId: string): string {
  const isProd = process.env.NODE_ENV === 'production';
  const hostname = os.hostname();
  const consumerGroupId = isProd ? baseId : `${hostname}-${baseId}`;
  logger.info({ consumerGroupId }, 'Kafka consumer group ID');
  return consumerGroupId;
}
