module.exports = {
  /**
   * @param db {import('mongodb').Db}
   * @param client {import('mongodb').MongoClient}
   * @returns {Promise<void>}
   */
  async up(db, client) {
    // Add index for workspaceId on prices collection
    await db.collection('prices').createIndex(
      { workspaceId: 1 },
      {
        name: 'workspaceId_1',
        background: true,
      },
    );

    // Add index for workspaceId on price_books collection
    await db.collection('price_books').createIndex(
      { workspaceId: 1 },
      {
        name: 'workspaceId_1',
        background: true,
      },
    );

    console.log(
      'Successfully added workspaceId indexes to prices and price_books collections',
    );
  },

  /**
   * @param db {import('mongodb').Db}
   * @param client {import('mongodb').MongoClient}
   * @returns {Promise<void>}
   */
  async down(db, client) {
    // Remove index for workspaceId on prices collection
    await db.collection('prices').dropIndex('workspaceId_1');

    // Remove index for workspaceId on price_books collection
    await db.collection('price_books').dropIndex('workspaceId_1');

    console.log(
      'Successfully removed workspaceId indexes from prices and price_books collections',
    );
  },
};
