module.exports = {
  async up(db, client) {
    // Create search_documents collection
    const collections = await db
      .listCollections({ name: 'search_documents' })
      .toArray();
    if (collections.length === 0) {
      await db.createCollection('search_documents');
    }

    const collection = db.collection('search_documents');

    // Text index for full-text search - create this BEFORE inserting any documents
    await collection.createIndex(
      { searchableText: 'text', title: 'text' },
      { name: 'search_text_index', weights: { title: 10, searchableText: 5 } },
    );

    // Insert a permanent dummy document to maintain the collection and text index
    // This document uses a special workspace ID that will never match real queries
    const dummyId = '__MIGRATION_INIT__';
    await collection.insertOne({
      _id: dummyId,
      documentId: dummyId,
      collection: '__SYSTEM__',
      workspaceId: '__SYSTEM_DO_NOT_DELETE__',
      searchableText:
        'system initialization document for text index maintenance',
      title: '__system_init__',
      subtitle: null,
      documentType: '__SYSTEM__',
      metadata: { _system: true },
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Compound index for workspace and collection filtering
    await collection.createIndex(
      { workspaceId: 1, collection: 1 },
      { name: 'workspace_collection_index' },
    );

    // Unique index for document lookup
    await collection.createIndex(
      { documentId: 1, collection: 1 },
      { name: 'document_id_collection_index', unique: true },
    );

    // Index for soft deletes (sparse because not all documents have this field)
    await collection.createIndex(
      { deleted: 1 },
      { name: 'deleted_index', sparse: true },
    );

    // Compound index for workspace + deleted flag queries
    await collection.createIndex(
      { workspaceId: 1, deleted: 1 },
      { name: 'workspace_deleted_index' },
    );

    // Note: The system dummy document is kept permanently to maintain the collection
    // and text index. It won't appear in real searches because queries filter by
    // actual workspace IDs, and this uses __SYSTEM_DO_NOT_DELETE__.
  },

  async down(db, client) {
    // Drop all indexes
    await db.collection('search_documents').dropIndexes();

    // Drop the collection
    await db.collection('search_documents').drop();
  },
};
