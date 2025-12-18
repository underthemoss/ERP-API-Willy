module.exports = {
  async up(db, client) {
    // Create search_user_state collection
    const collections = await db
      .listCollections({ name: 'search_user_state' })
      .toArray();
    if (collections.length === 0) {
      await db.createCollection('search_user_state');
    }

    const collection = db.collection('search_user_state');

    // Unique compound index for userId and workspaceId
    // This ensures one state document per user per workspace
    await collection.createIndex(
      { userId: 1, workspaceId: 1 },
      { name: 'user_workspace_unique_index', unique: true },
    );

    // Index for querying by userId (for looking up all states for a user)
    await collection.createIndex({ userId: 1 }, { name: 'user_id_index' });

    // Index for querying by workspaceId (for looking up all states in a workspace)
    await collection.createIndex(
      { workspaceId: 1 },
      { name: 'workspace_id_index' },
    );

    // Index for favorites array to efficiently query by searchDocumentId
    await collection.createIndex(
      { 'favorites.searchDocumentId': 1 },
      { name: 'favorites_search_document_index', sparse: true },
    );

    // Index for recents array to efficiently query by searchDocumentId
    await collection.createIndex(
      { 'recents.searchDocumentId': 1 },
      { name: 'recents_search_document_index', sparse: true },
    );
  },

  async down(db, client) {
    // Drop all indexes
    await db.collection('search_user_state').dropIndexes();

    // Drop the collection
    await db.collection('search_user_state').drop();
  },
};
