import { Db, MongoClient } from 'mongodb';
import {
  createAuthZ,
  ERP_GLOBAL_PLATFORM_ID,
  ERP_PLATFORM_SUBJECT_RELATIONS,
} from '../../src/lib/authz';
import { getRedisClient } from '../../src/redis';
import { SYSTEM_USER } from '../../src/authentication';

if (!process.env.SPICEDB_ENDPOINT) {
  throw new Error('SPICEDB_ENDPOINT environment variable is not set');
}
if (!process.env.SPICEDB_TOKEN) {
  throw new Error('SPICEDB_TOKEN environment variable is not set');
}
if (!process.env.REDIS_HOST) {
  throw new Error('REDIS_HOST environment variable is not set');
}
if (!process.env.REDIS_PORT) {
  throw new Error('REDIS_PORT environment variable is not set');
}

const redisClient = getRedisClient({
  REDIS_HOST: process.env.REDIS_HOST,
  REDIS_PORT: parseInt(process.env.REDIS_PORT),
  ENABLE_REDIS_AUTO_PIPELINING: true,
});

 
const authZ = createAuthZ({
  spicedbEndpoint: process.env.SPICEDB_ENDPOINT!,
  spicedbToken: process.env.SPICEDB_TOKEN!,
  redisClient,
});

module.exports = {
  /**
   * @param db {import('mongodb').Db}
   * @param client {import('mongodb').MongoClient}
   * @returns {Promise<void>}
   */
  async up(db: Db, client: MongoClient) {
    // deprecating service account relationships
    // This is a poor DX since we'd have to pass the correct subjectType to each call
    // When we need service accounts we swap to a actor model, which can be a user, service, token etc.
    await authZ.platform.deleteRelationships({
      resourceId: ERP_GLOBAL_PLATFORM_ID,
      relation:
        ERP_PLATFORM_SUBJECT_RELATIONS.SERVICE_ACCOUNT_SERVICE_ACCOUNT_ADMIN,
      subjectId: SYSTEM_USER.id,
    });
  },

  /**
   * @param db {import('mongodb').Db}
   * @param client {import('mongodb').MongoClient}
   * @returns {Promise<void>}
   */
  async down(db: Db, client: MongoClient) {
    // N/A
  },
};
