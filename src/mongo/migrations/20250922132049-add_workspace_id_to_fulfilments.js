module.exports = {
  async up(db, client) {
    // Add index for workspace_id
    await db
      .collection('fulfilments')
      .createIndex({ workspace_id: 1, companyId: 1 });
    console.log('Created index on workspace_id and companyId');
  },

  async down(db, client) {
    // Drop the index
    await db
      .collection('fulfilments')
      .dropIndex({ workspace_id: 1, companyId: 1 });
  },
};
