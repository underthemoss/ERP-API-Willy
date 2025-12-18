module.exports = {
  /**
   * @param db {import('mongodb').Db}
   * @param client {import('mongodb').MongoClient}
   * @returns {Promise<void>}
   */
  async up(db, client) {
    // Create the files collection if it doesn't exist
    const collections = await db.listCollections({ name: 'files' }).toArray();
    if (collections.length === 0) {
      await db.createCollection('files');
    }
    // Add compound index for parent_entity_id, company_id, and deleted
    await db
      .collection('files')
      .createIndex(
        { parent_entity_id: 1, company_id: 1, deleted: 1 },
        { name: 'company_id_parent_entity_id_deleted_idx' },
      );
  },

  /**
   * @param db {import('mongodb').Db}
   * @param client {import('mongodb').MongoClient}
   * @returns {Promise<void>}
   */
  async down(db, client) {
    // Remove the index
    await db
      .collection('files')
      .dropIndex('company_id_parent_entity_id_deleted_idx')
      .catch(() => {});
  },
};
