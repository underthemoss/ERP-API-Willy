module.exports = {
  /**
   * @param db {import('mongodb').Db}
   * @param client {import('mongodb').MongoClient}
   * @returns {Promise<void>}
   */
  async up(db, client) {
    await db
      .collection('resource_map_resources')
      .createIndex(
        { location_geo: '2dsphere' },
        { name: 'resource_map_location_geo' },
      );
    await db
      .collection('resource_map_resources')
      .createIndex(
        { tenant_id: 1, type: 1 },
        { name: 'resource_map_tenant_type' },
      );
  },

  /**
   * @param db {import('mongodb').Db}
   * @param client {import('mongodb').MongoClient}
   * @returns {Promise<void>}
   */
  async down(db, client) {
    await db
      .collection('resource_map_resources')
      .dropIndex('resource_map_location_geo');
    await db
      .collection('resource_map_resources')
      .dropIndex('resource_map_tenant_type');
  },
};
