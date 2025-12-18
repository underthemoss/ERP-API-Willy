module.exports = {
  async up(db, client) {
    const collection = db.collection('workspaces');

    // Index for querying workspaces by domain
    await collection.createIndex(
      { domain: 1 },
      {
        sparse: true,
        name: 'domain_1',
      },
    );

    // Index for querying workspaces by brandId
    await collection.createIndex(
      { brandId: 1 },
      {
        sparse: true,
        name: 'brandId_1',
      },
    );

    // Index for querying workspaces by accessType
    await collection.createIndex(
      { accessType: 1 },
      {
        name: 'accessType_1',
      },
    );

    // Index for querying non-archived workspaces
    await collection.createIndex(
      { archived: 1 },
      {
        name: 'archived_1',
      },
    );

    // Compound index for querying workspaces by companyId and archived status
    await collection.createIndex(
      { companyId: 1, archived: 1 },
      {
        name: 'companyId_1_archived_1',
      },
    );

    // Index for querying workspaces by createdBy
    await collection.createIndex(
      { createdBy: 1 },
      {
        name: 'createdBy_1',
      },
    );

    // Index for querying workspaces by ownerId
    await collection.createIndex(
      { ownerId: 1 },
      {
        name: 'ownerId_1',
      },
    );
  },

  async down(db, client) {
    const collection = db.collection('workspaces');

    // Drop all the indexes we created
    await collection.dropIndex('domain_1');
    await collection.dropIndex('brandId_1');
    await collection.dropIndex('accessType_1');
    await collection.dropIndex('archived_1');
    await collection.dropIndex('companyId_1_archived_1');
    await collection.dropIndex('createdBy_1');
    await collection.dropIndex('ownerId_1');
  },
};
