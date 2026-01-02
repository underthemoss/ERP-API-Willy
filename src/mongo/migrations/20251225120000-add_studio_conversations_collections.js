module.exports = {
  /**
   * @param db {import('mongodb').Db}
   * @param client {import('mongodb').MongoClient}
   * @returns {Promise<void>}
   */
  async up(db, client) {
    const conversations = await db
      .listCollections({ name: 'studio_conversations' })
      .toArray();
    if (conversations.length === 0) {
      await db.createCollection('studio_conversations');
    }

    const messages = await db
      .listCollections({ name: 'studio_conversation_messages' })
      .toArray();
    if (messages.length === 0) {
      await db.createCollection('studio_conversation_messages');
    }

    await db
      .collection('studio_conversations')
      .createIndex(
        { companyId: 1, workspaceId: 1, deleted: 1, updatedAt: -1 },
        { name: 'companyId_workspaceId_deleted_updatedAt_idx' },
      );

    await db
      .collection('studio_conversations')
      .createIndex(
        { companyId: 1, workspaceId: 1, deleted: 1, lastMessageAt: -1 },
        { name: 'companyId_workspaceId_deleted_lastMessageAt_idx' },
      );

    await db
      .collection('studio_conversations')
      .createIndex(
        { companyId: 1, workspaceId: 1, deleted: 1, titleLower: 1 },
        { name: 'companyId_workspaceId_deleted_titleLower_idx' },
      );

    await db
      .collection('studio_conversation_messages')
      .createIndex(
        { companyId: 1, conversationId: 1, createdAt: 1, _id: 1 },
        { name: 'companyId_conversationId_createdAt_id_idx' },
      );
  },

  /**
   * @param db {import('mongodb').Db}
   * @param client {import('mongodb').MongoClient}
   * @returns {Promise<void>}
   */
  async down(db, client) {
    await db.dropCollection('studio_conversation_messages');
    await db.dropCollection('studio_conversations');
  },
};
