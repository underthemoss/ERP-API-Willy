module.exports = {
  /**
   * @param db {import('mongodb').Db}
   * @param client {import('mongodb').MongoClient}
   * @returns {Promise<void>}
   */
  async up(db, client) {
    db.collection('pim_categories').createIndex(
      { tenant_id: 1, has_products: 1, path: 1 },
      {
        partialFilterExpression: { is_deleted: false },
        name: 'pim_categories_index',
      },
    );
  },

  /**
   * @param db {import('mongodb').Db}
   * @param client {import('mongodb').MongoClient}
   * @returns {Promise<void>}
   */
  async down(db, client) {
    await db.collection('pim_categories').dropIndex('pim_categories_index');
  },
};
