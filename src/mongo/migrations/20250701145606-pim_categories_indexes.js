module.exports = {
  /**
   * @param db {import('mongodb').Db}
   * @param client {import('mongodb').MongoClient}
   * @returns {Promise<void>}
   */
  async up(db, client) {
    await db.collection('pim_categories').createIndex(
      { tenant_id: 1, is_deleted: 1, path: 1, name: 1 },
      {
        name: 'tenant_id_is_deleted_path_name',
      },
    );

    await db.collection('pim_categories').createIndex(
      { tenant_id: 1, is_deleted: 1, name: 1 },
      {
        name: 'tenant_id_is_deleted_name',
      },
    );

    // drop the old index
    await db.collection('pim_categories').dropIndex('pim_categories_index');
  },

  /**
   * @param db {import('mongodb').Db}
   * @param client {import('mongodb').MongoClient}
   * @returns {Promise<void>}
   */
  async down(db, client) {
    await db.dropCollection('tenant_id_is_deleted_path_name');
    await db.dropCollection('tenant_id_is_deleted_name');
  },
};
