import { Db, MongoClient } from 'mongodb';
import { createAuthZ } from '../../src/lib/authz';
import { getRedisClient } from '../../src/redis';
import {
  ERP_SALES_ORDER_SUBJECT_RELATIONS,
  ERP_FULFILMENT_SUBJECT_RELATIONS,
} from '../../src/lib/authz/spicedb-generated-types';

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
    console.log('Starting backfill of portal relations...');

    // 1. Backfill sales_order -> intake_form_submission relations
    console.log('Finding intake form submissions with sales orders...');
    const submissions = await db
      .collection('intake_form_submissions')
      .find({ salesOrderId: { $exists: true, $ne: null } })
      .toArray();

    console.log(`Found ${submissions.length} submissions with sales orders`);

    if (submissions.length > 0) {
      const salesOrderRelations = submissions.map((submission) => ({
        resourceId: submission.salesOrderId,
        relation:
          ERP_SALES_ORDER_SUBJECT_RELATIONS.INTAKE_FORM_SUBMISSION_INTAKE_FORM_SUBMISSION,
        subjectId: submission._id.toString(),
      }));

      console.log(
        `Writing ${salesOrderRelations.length} sales order relations in batch...`,
      );
      await authZ.salesOrder.writeRelations(salesOrderRelations);
      console.log('Sales order relations written successfully');
    }

    // 2. Backfill fulfilment -> sales_order relations
    console.log('Finding fulfilments with sales orders...');
    const fulfilments = await db
      .collection('fulfilments')
      .find({ salesOrderId: { $exists: true, $ne: null } })
      .toArray();

    console.log(`Found ${fulfilments.length} fulfilments with sales orders`);

    if (fulfilments.length > 0) {
      const fulfilmentRelations = fulfilments.map((fulfilment) => ({
        resourceId: fulfilment._id.toString(),
        relation: ERP_FULFILMENT_SUBJECT_RELATIONS.SALES_ORDER_SALES_ORDER,
        subjectId: fulfilment.salesOrderId,
      }));

      console.log(
        `Writing ${fulfilmentRelations.length} fulfilment relations in batch...`,
      );
      await authZ.fulfilment.writeRelations(fulfilmentRelations);
      console.log('Fulfilment relations written successfully');
    }

    console.log('Backfill completed successfully!');
    console.log(
      `Summary: ${submissions.length} sales order relations and ${fulfilments.length} fulfilment relations written`,
    );
  },

  /**
   * @param db {import('mongodb').Db}
   * @param client {import('mongodb').MongoClient}
   * @returns {Promise<void>}
   */
  async down(db: Db, client: MongoClient) {
    // No rollback needed as per requirements
  },
};
