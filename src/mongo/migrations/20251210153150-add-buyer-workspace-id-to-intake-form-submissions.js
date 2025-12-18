module.exports = {
  /**
   * @param db {import('mongodb').Db}
   * @param client {import('mongodb').MongoClient}
   * @returns {Promise<void>}
   */
  async up(db, client) {
    const collection = db.collection('intake_form_submissions');

    // Create sparse index for buyerWorkspaceId
    // Sparse because most submissions won't have this field (off-platform buyers)
    await collection.createIndex(
      { buyerWorkspaceId: 1 },
      {
        sparse: true,
        name: 'buyerWorkspaceId_1',
      },
    );

    console.log(
      'Added buyerWorkspaceId index on intake_form_submissions collection',
    );
  },

  /**
   * @param db {import('mongodb').Db}
   * @param client {import('mongodb').MongoClient}
   * @returns {Promise<void>}
   */
  async down(db, client) {
    const collection = db.collection('intake_form_submissions');

    try {
      await collection.dropIndex('buyerWorkspaceId_1');
      console.log('Dropped buyerWorkspaceId_1 index');
    } catch (error) {
      console.log('buyerWorkspaceId_1 index does not exist or already dropped');
    }
  },
};
