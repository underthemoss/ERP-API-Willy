module.exports = {
  async up(db, client) {
    // Create index for workspace_id for better query performance
    await db
      .collection('notes')
      .createIndex({ workspace_id: 1, company_id: 1 });
  },

  async down(db, client) {
    // Drop the index we created
    await db.collection('notes').dropIndex({ workspace_id: 1, company_id: 1 });
  },
};
