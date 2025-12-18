module.exports = {
  /**
   * @param db {import('mongodb').Db}
   * @param client {import('mongodb').MongoClient}
   * @returns {Promise<void>}
   */
  async up(db, client) {
    await db.collection('pim_products').createIndex(
      {
        tenant_id: 1,
        is_deleted: 1,
        pim_category_platform_id: 1,
      },
      {
        name: 'tenant_id_is_deleted_pim_category_platform_id',
        background: true,
      },
    );
  },

  /**
   * @param db {import('mongodb').Db}
   * @param client {import('mongodb').MongoClient}
   * @returns {Promise<void>}
   */
  async down(db, client) {
    await db
      .collection('pim_products')
      .dropIndex('tenant_id_is_deleted_pim_category_platform_id');
  },
};
