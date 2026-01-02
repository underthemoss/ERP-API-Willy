module.exports = {
  /**
   * @param db {import('mongodb').Db}
   * @param client {import('mongodb').MongoClient}
   * @returns {Promise<void>}
   */
  async up(db, client) {
    const nodes = await db
      .listCollections({ name: 'studio_fs_nodes' })
      .toArray();
    if (nodes.length === 0) {
      await db.createCollection('studio_fs_nodes');
    }

    await db
      .collection('studio_fs_nodes')
      .createIndex(
        { companyId: 1, workspaceId: 1, path: 1 },
        { name: 'companyId_workspaceId_path_idx', unique: true },
      );

    await db
      .collection('studio_fs_nodes')
      .createIndex(
        { companyId: 1, workspaceId: 1, parentPath: 1, deleted: 1, name: 1 },
        { name: 'companyId_workspaceId_parentPath_deleted_name_idx' },
      );
  },

  /**
   * @param db {import('mongodb').Db}
   * @param client {import('mongodb').MongoClient}
   * @returns {Promise<void>}
   */
  async down(db, client) {
    await db.dropCollection('studio_fs_nodes');
  },
};
