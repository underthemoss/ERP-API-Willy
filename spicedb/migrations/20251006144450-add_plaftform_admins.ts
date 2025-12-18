import { Db, MongoClient } from 'mongodb';
import {
  createAuthZ,
  ERP_GLOBAL_PLATFORM_ID,
  ERP_PLATFORM_SUBJECT_RELATIONS,
} from '../../src/lib/authz';
import { getRedisClient } from '../../src/redis';
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
    const ady = await db.collection('users').findOne({
      email: 'ady.young@equipmentshare.com',
    });

    const brian = await db.collection('users').findOne({
      email: 'brian.mullan@equipmentshare.com',
    });

    if (ady) {
      await authZ.platform.writeRelation({
        resourceId: ERP_GLOBAL_PLATFORM_ID,
        relation: ERP_PLATFORM_SUBJECT_RELATIONS.USER_USER_ADMIN,
        subjectId: ady._id.toString(),
      });
    }

    if (brian) {
      await authZ.platform.writeRelation({
        resourceId: ERP_GLOBAL_PLATFORM_ID,
        relation: ERP_PLATFORM_SUBJECT_RELATIONS.USER_USER_ADMIN,
        subjectId: brian._id.toString(),
      });
    }
  },

  /**
   * @param db {import('mongodb').Db}
   * @param client {import('mongodb').MongoClient}
   * @returns {Promise<void>}
   */
  async down(db: Db, client: MongoClient) {
    const ady = await db.collection('users').findOne({
      email: 'ady.young@equipmentshare.com',
    });

    const brian = await db.collection('users').findOne({
      email: 'brian.mullan@equipmentshare.com',
    });

    if (ady) {
      await authZ.platform.deleteRelationships({
        resourceId: ERP_GLOBAL_PLATFORM_ID,
        relation: ERP_PLATFORM_SUBJECT_RELATIONS.USER_USER_ADMIN,
        subjectId: ady._id.toString(),
      });
    }

    if (brian) {
      await authZ.platform.deleteRelationships({
        resourceId: ERP_GLOBAL_PLATFORM_ID,
        relation: ERP_PLATFORM_SUBJECT_RELATIONS.USER_USER_ADMIN,
        subjectId: brian._id.toString(),
      });
    }
  },
};
