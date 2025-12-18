module.exports = {
  /**
   * @param db {import('mongodb').Db}
   * @param client {import('mongodb').MongoClient}
   * @returns {Promise<void>}
   */
  async up(db, client) {
    await db
      .collection('contacts')
      .createIndex(
        { workspaceId: 1, contactType: 1 },
        { name: 'workspaceId_contactType_index' },
      );
  },

  /**
   * @param db {import('mongodb').Db}
   * @param client {import('mongodb').MongoClient}
   * @returns {Promise<void>}
   */
  async down(db, client) {
    await db.collection('contacts').dropIndex('workspaceId_contactType_index');
  },
};
