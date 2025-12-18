module.exports = {
  /**
   * @param db {import('mongodb').Db}
   * @param client {import('mongodb').MongoClient}
   * @returns {Promise<void>}
   */
  async up(db, client) {
    // Create inventory collection
    const inventoryCollections = await db
      .listCollections({ name: 'inventory' })
      .toArray();
    if (inventoryCollections.length === 0) {
      await db.createCollection('inventory');
    }

    // Create inventory_events collection for event sourcing
    const inventoryEventCollections = await db
      .listCollections({ name: 'inventory_events' })
      .toArray();
    if (inventoryEventCollections.length === 0) {
      await db.createCollection('inventory_events');
    }

    // Create indexes for inventory collection - only the essential ones
    await db.collection('inventory').createIndex({ companyId: 1 });
    await db.collection('inventory').createIndex({ companyId: 1, status: 1 });
    await db
      .collection('inventory')
      .createIndex({ companyId: 1, isThirdPartyRental: 1 });

    // Create unique index on companyId + assetId to ensure one inventory per asset per company
    await db
      .collection('inventory')
      .createIndex(
        { companyId: 1, assetId: 1 },
        { unique: true, sparse: true },
      );

    // Create indexes for inventory_events collection
    await db.collection('inventory_events').createIndex({ aggregateId: 1 });

    // Create a unique index on aggregateId + sequence
    await db
      .collection('inventory_events')
      .createIndex({ aggregateId: 1, sequence: 1 }, { unique: true });
  },

  /**
   * @param db {import('mongodb').Db}
   * @param client {import('mongodb').MongoClient}
   * @returns {Promise<void>}
   */
  async down(db, client) {
    // Drop the collections
    await db.collection('inventory').drop();
    await db.collection('inventory_events').drop();
  },
};
