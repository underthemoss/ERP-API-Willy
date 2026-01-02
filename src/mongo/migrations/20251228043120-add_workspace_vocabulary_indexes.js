module.exports = {
  /**
   * @param db {import('mongodb').Db}
   * @param client {import('mongodb').MongoClient}
   * @returns {Promise<void>}
   */
  async up(db, client) {
    await db
      .collection('workspace_tags')
      .createIndex(
        { workspaceId: 1, label: 1 },
        { unique: true, name: 'workspace_tags_workspaceId_label_unique' },
      );

    await db
      .collection('workspace_tags')
      .createIndex(
        { workspaceId: 1, synonyms: 1 },
        { name: 'workspace_tags_workspaceId_synonyms' },
      );

    await db
      .collection('workspace_tags')
      .createIndex(
        { workspaceId: 1, globalTagId: 1 },
        { name: 'workspace_tags_workspaceId_globalTagId' },
      );

    await db.collection('workspace_attribute_types').createIndex(
      { workspaceId: 1, name: 1 },
      {
        unique: true,
        name: 'workspace_attribute_types_workspaceId_name_unique',
      },
    );

    await db
      .collection('workspace_attribute_types')
      .createIndex(
        { workspaceId: 1, synonyms: 1 },
        { name: 'workspace_attribute_types_workspaceId_synonyms' },
      );

    await db
      .collection('workspace_attribute_types')
      .createIndex(
        { workspaceId: 1, globalAttributeTypeId: 1 },
        { name: 'workspace_attribute_types_workspaceId_globalAttributeTypeId' },
      );
  },

  /**
   * @param db {import('mongodb').Db}
   * @param client {import('mongodb').MongoClient}
   * @returns {Promise<void>}
   */
  async down(db, client) {
    await db
      .collection('workspace_tags')
      .dropIndex('workspace_tags_workspaceId_label_unique');
    await db
      .collection('workspace_tags')
      .dropIndex('workspace_tags_workspaceId_synonyms');
    await db
      .collection('workspace_tags')
      .dropIndex('workspace_tags_workspaceId_globalTagId');

    await db
      .collection('workspace_attribute_types')
      .dropIndex('workspace_attribute_types_workspaceId_name_unique');
    await db
      .collection('workspace_attribute_types')
      .dropIndex('workspace_attribute_types_workspaceId_synonyms');
    await db
      .collection('workspace_attribute_types')
      .dropIndex('workspace_attribute_types_workspaceId_globalAttributeTypeId');
  },
};
