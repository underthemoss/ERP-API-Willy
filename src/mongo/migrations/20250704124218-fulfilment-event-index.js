module.exports = {
  /**
   * @param db {import('mongodb').Db}
   * @param client {import('mongodb').MongoClient}
   * @returns {Promise<void>}
   */
  async up(db, client) {
    // Create the fulfilment_events collection if it doesn't exist
    const collections = await db
      .listCollections({ name: 'fulfilment_events' })
      .toArray();
    if (collections.length === 0) {
      await db.createCollection('fulfilment_events');
    }

    // Create an index on aggregateId
    await db.collection('fulfilment_events').createIndex({ aggregateId: 1 });

    // Create a unique index on aggregateId + sequence
    await db
      .collection('fulfilment_events')
      .createIndex({ aggregateId: 1, sequence: 1 }, { unique: true });
  },

  /**
   * @param db {import('mongodb').Db}
   * @param client {import('mongodb').MongoClient}
   * @returns {Promise<void>}
   */
  async down(db, client) {
    // Drop the fulfilment_events collection to rollback
    await db.collection('fulfilment_events').drop();
  },
};
