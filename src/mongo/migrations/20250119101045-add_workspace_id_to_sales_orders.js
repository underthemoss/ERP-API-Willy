module.exports = {
  async up(db, client) {
    // Migration to add workspace_id field to sales_orders collection
    // This field will be optional initially to maintain backward compatibility

    // Add index for workspace_id to improve query performance
    await db.collection('sales_orders').createIndex(
      { workspace_id: 1 },
      {
        sparse: true, // Only index documents that have workspace_id
        background: true,
      },
    );

    // Add compound index for workspace_id and deleted_at for efficient filtering
    await db.collection('sales_orders').createIndex(
      { workspace_id: 1, deleted_at: 1 },
      {
        sparse: true,
        background: true,
      },
    );

    console.log('Added workspace_id indexes to sales_orders collection');
  },

  async down(db, client) {
    // Remove the indexes
    await db.collection('sales_orders').dropIndex({ workspace_id: 1 });
    await db
      .collection('sales_orders')
      .dropIndex({ workspace_id: 1, deleted_at: 1 });

    console.log('Removed workspace_id indexes from sales_orders collection');
  },
};
