module.exports = {
  /**
   * @param db {import('mongodb').Db}
   * @param client {import('mongodb').MongoClient}
   * @returns {Promise<void>}
   */
  async up(db, client) {
    const collections = await db.listCollections({ name: 'notes' }).toArray();
    if (collections.length === 0) {
      await db.createCollection('notes');
    }
    await db
      .collection('notes')
      .createIndex(
        { company_id: 1, parent_entity_id: 1, deleted: 1 },
        { name: 'company_id_parent_entity_id_deleted_idx' },
      );
  },

  /**
   * @param db {import('mongodb').Db}
   * @param client {import('mongodb').MongoClient}
   * @returns {Promise<void>}
   */
  async down(db, client) {
    await db.dropCollection('notes');
  },
};
