module.exports = {
  /**
   * @param db {import('mongodb').Db}
   * @param client {import('mongodb').MongoClient}
   * @returns {Promise<void>}
   */
  async up(db, client) {
    await db
      .collection('prices')
      .createIndex(
        { company_id: 1, createdAt: -1 },
        { name: 'company_createdAt' },
      );
    await db.collection('prices').createIndex(
      {
        company_id: 1,
        pim_product_id: 1,
        createdAt: -1,
      },
      { name: 'company_pim_product_createdAt' },
    );
    await db.collection('prices').createIndex(
      {
        company_id: 1,
        asset_id: 1,
        createdAt: -1,
      },
      { name: 'company_asset_createdAt' },
    );
  },

  /**
   * @param db {import('mongodb').Db}
   * @param client {import('mongodb').MongoClient}
   * @returns {Promise<void>}
   */
  async down(db, client) {
    await db.collection('prices').dropIndex('company_createdAt');
    await db.collection('prices').dropIndex('company_pim_product_createdAt');
    await db.collection('prices').dropIndex('company_asset_createdAt');
  },
};
