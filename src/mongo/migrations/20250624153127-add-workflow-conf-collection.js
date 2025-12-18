module.exports = {
  /**
   * @param db {import('mongodb').Db}
   * @param client {import('mongodb').MongoClient}
   * @returns {Promise<void>}
   */
  async up(db, client) {
    // Create the workflow_configuration collection if it doesn't exist
    const collections = await db
      .listCollections({ name: 'workflow_configuration' })
      .toArray();
    if (collections.length === 0) {
      await db.createCollection('workflow_configuration');
    }

    await db
      .collection('workflow_configuration')
      .createIndex(
        { companyId: 1, deletedAt: 1 },
        { name: 'companyId_deletedAt_idx' },
      );
  },

  /**
   * @param db {import('mongodb').Db}
   * @param client {import('mongodb').MongoClient}
   * @returns {Promise<void>}
   */
  async down(db, client) {
    // Drop the workflow_configuration collection
    await db.collection('workflow_configuration').drop();
  },
};
