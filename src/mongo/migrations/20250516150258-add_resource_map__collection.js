module.exports = {
  /**
   * @param db {import('mongodb').Db}
   * @param client {import('mongodb').MongoClient}
   * @returns {Promise<void>}
   */
  async up(db, client) {
    const collections = await db
      .listCollections({ name: 'resource_map_resources' })
      .toArray();
    if (collections.length === 0) {
      await db.createCollection('resource_map_resources');
    }
    await db
      .collection('resource_map_resources')
      .createIndex(
        { tenant_id: 1, parent_id: 1, resource_id: 1, hierarchy_id: 1 },
        { name: 'resource_map_tenant_id_index' },
      );
  },

  /**
   * @param db {import('mongodb').Db}
   * @param client {import('mongodb').MongoClient}
   * @returns {Promise<void>}
   */
  async down(db, client) {
    await db.dropCollection('resource_map_resources');
  },
};
