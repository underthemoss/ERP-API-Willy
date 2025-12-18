module.exports = {
  async up(db, client) {
    // Check if the emails collection already exists
    const collections = await db.listCollections({ name: 'emails' }).toArray();

    if (collections.length === 0) {
      // Create the emails collection only if it doesn't exist
      await db.createCollection('emails');
    }

    // Create indexes for efficient querying
    const collection = db.collection('emails');

    // Unique index on msgId (SendGrid message ID)
    await collection.createIndex(
      { msgId: 1 },
      {
        unique: true,
        sparse: true, // Allow null values since msgId is set after sending
        name: 'msgId_unique',
      },
    );

    // Index on workspaceId for filtering by workspace
    await collection.createIndex(
      { workspaceId: 1 },
      { name: 'workspaceId_index' },
    );

    // Index on companyId for filtering by company
    await collection.createIndex({ companyId: 1 }, { name: 'companyId_index' });

    // Index on sentAt for date range queries
    await collection.createIndex({ sentAt: -1 }, { name: 'sentAt_desc_index' });

    // Index on createdAt for sorting
    await collection.createIndex(
      { createdAt: -1 },
      { name: 'createdAt_desc_index' },
    );

    // Compound index for common query patterns
    await collection.createIndex(
      { workspaceId: 1, status: 1, sentAt: -1 },
      { name: 'workspace_status_sentAt_index' },
    );

    // Index on to field for searching by recipient
    await collection.createIndex({ to: 1 }, { name: 'to_index' });

    // Index on from field for searching by sender
    await collection.createIndex({ from: 1 }, { name: 'from_index' });

    // Index on status for filtering
    await collection.createIndex({ status: 1 }, { name: 'status_index' });
  },

  async down(db, client) {
    // Drop the emails collection
    await db.dropCollection('emails');
  },
};
