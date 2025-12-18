import Pulse from '@pulsecron/pulse';
import { EnvConfig } from '../../config';
import { MongoClient } from 'mongodb';
import { logger } from '../../lib/logger';

export type PulseServiceConstructorArgs = {
  envConfig: EnvConfig;
  mongoClient: MongoClient;
};

/**
 * Factory function to create and return a new PulseService instance.
 * Accepts a single object with all service dependencies.
 */
export async function createPulseService(args: PulseServiceConstructorArgs) {
  const pulse = new Pulse({
    mongo: args.mongoClient.db('es-erp'),
    defaultConcurrency: 4,
    maxConcurrency: 4,
    processEvery: '10 seconds',
    resumeOnRestart: true,
  });

  await pulse.start();

  logger.info('⏱️ Pulse started');
  pulse.define('heartbeat', () => {
    logger.info('pulse job heartbeat');
  });
  pulse.every('1 minute', 'heartbeat');

  return pulse;
}

export default createPulseService;
