module.exports = {
  async up(db, client) {
    // Create indexes for better query performance
    await db
      .collection('charges')
      .createIndex({ workspaceId: 1, companyId: 1 });
    await db
      .collection('charges')
      .createIndex({ workspaceId: 1, contactId: 1 });
  },

  async down(db, client) {
    // Drop the indexes we created
    await db.collection('charges').dropIndex({ workspaceId: 1, companyId: 1 });
    await db.collection('charges').dropIndex({ workspaceId: 1, contactId: 1 });
  },
};
