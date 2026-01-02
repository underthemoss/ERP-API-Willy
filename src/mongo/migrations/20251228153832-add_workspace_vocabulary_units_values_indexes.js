module.exports = {
  /**
   * @param db {import('mongodb').Db}
   * @param client {import('mongodb').MongoClient}
   * @returns {Promise<void>}
   */
  async up(db, client) {
    await db
      .collection('workspace_units')
      .createIndex(
        { workspaceId: 1, code: 1 },
        { unique: true, name: 'workspace_units_workspaceId_code_unique' },
      );

    await db
      .collection('workspace_units')
      .createIndex(
        { workspaceId: 1, globalUnitCode: 1 },
        { name: 'workspace_units_workspaceId_globalUnitCode' },
      );

    await db.collection('workspace_attribute_values').createIndex(
      { workspaceId: 1, attributeTypeId: 1, value: 1 },
      {
        unique: true,
        name: 'workspace_attribute_values_workspaceId_attributeTypeId_value_unique',
      },
    );

    await db.collection('workspace_attribute_values').createIndex(
      { workspaceId: 1, attributeTypeId: 1, synonyms: 1 },
      {
        name: 'workspace_attribute_values_workspaceId_attributeTypeId_synonyms',
      },
    );

    await db.collection('workspace_attribute_values').createIndex(
      { workspaceId: 1, globalAttributeValueId: 1 },
      {
        name: 'workspace_attribute_values_workspaceId_globalAttributeValueId',
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
      .collection('workspace_units')
      .dropIndex('workspace_units_workspaceId_code_unique');
    await db
      .collection('workspace_units')
      .dropIndex('workspace_units_workspaceId_globalUnitCode');

    await db
      .collection('workspace_attribute_values')
      .dropIndex(
        'workspace_attribute_values_workspaceId_attributeTypeId_value_unique',
      );
    await db
      .collection('workspace_attribute_values')
      .dropIndex(
        'workspace_attribute_values_workspaceId_attributeTypeId_synonyms',
      );
    await db
      .collection('workspace_attribute_values')
      .dropIndex(
        'workspace_attribute_values_workspaceId_globalAttributeValueId',
      );
  },
};
