module.exports = {
  /**
   * @param db {import('mongodb').Db}
   * @param client {import('mongodb').MongoClient}
   * @returns {Promise<void>}
   */
  async up(db, client) {
    // Drop the existing unique index on companyId + assetId
    try {
      await db.collection('inventory').dropIndex('companyId_1_assetId_1');
    } catch (error) {
      console.log('Index companyId_1_assetId_1 not found or already dropped');
    }

    try {
      // Create a new non-unique index on assetId + companyId for query performance
      await db
        .collection('inventory')
        .createIndex(
          { assetId: 1, companyId: 1 },
          { name: 'assetId_companyId_index' },
        );
    } catch (error) {
      console.log('could not create assetId_companyId_index');
    }
  },

  /**
   * @param db {import('mongodb').Db}
   * @param client {import('mongodb').MongoClient}
   * @returns {Promise<void>}
   */
  async down(db, client) {},
};
