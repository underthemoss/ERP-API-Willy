module.exports = {
  async up(db, client) {
    // Create the brandfetch collection
    const collections = await db
      .listCollections({ name: 'brandfetch' })
      .toArray();
    if (collections.length === 0) {
      await db.createCollection('brandfetch');
    }

    // Create indexes
    const collection = db.collection('brandfetch');

    // Index on domain for quick lookups by domain
    await collection.createIndex(
      { domain: 1 },
      {
        name: 'domain_1',
        background: true,
      },
    );

    // Index on createdAt for potential TTL or sorting
    await collection.createIndex(
      { createdAt: 1 },
      {
        name: 'createdAt_1',
        background: true,
      },
    );

    // Index on updatedAt for tracking recent updates
    await collection.createIndex(
      { updatedAt: 1 },
      {
        name: 'updatedAt_1',
        background: true,
      },
    );

    // Index on fetchedFromApiAt for TTL management (30-day expiration)
    await collection.createIndex(
      { fetchedFromApiAt: 1 },
      {
        name: 'fetchedFromApiAt_1',
        background: true,
      },
    );
  },

  async down(db, client) {
    // Drop the brandfetch collection
    await db.dropCollection('brandfetch');
  },
};
