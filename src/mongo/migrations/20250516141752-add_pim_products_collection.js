module.exports = {
  /**
   * @param db {import('mongodb').Db}
   * @param client {import('mongodb').MongoClient}
   * @returns {Promise<void>}
   */
  async up(db, client) {
    const collections = await db
      .listCollections({ name: 'pim_products' })
      .toArray();
    if (collections.length === 0) {
      await db.createCollection('pim_products');
    }
    await db
      .collection('pim_products')
      .createIndex(
        { tenant_id: 1, is_deleted: 1 },
        { name: 'pim_products_tenant_id_index' },
      );
  },

  /**
   * @param db {import('mongodb').Db}
   * @param client {import('mongodb').MongoClient}
   * @returns {Promise<void>}
   */
  async down(db, client) {
    await db.dropCollection('pim_products');
  },
};
