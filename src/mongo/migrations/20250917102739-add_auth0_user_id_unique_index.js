module.exports = {
  /**
   * @param db {import('mongodb').Db}
   * @param client {import('mongodb').MongoClient}
   * @returns {Promise<void>}
   */
  async up(db, client) {
    // Add unique index on auth0_user_id field
    await db.collection('users').createIndex(
      { auth0_user_id: 1 },
      {
        unique: true,
        sparse: true, // Allow null values but ensure uniqueness when present
        name: 'auth0_user_id_unique',
      },
    );
  },

  /**
   * @param db {import('mongodb').Db}
   * @param client {import('mongodb').MongoClient}
   * @returns {Promise<void>}
   */
  async down(db, client) {
    // Drop the unique index
    await db.collection('users').dropIndex('auth0_user_id_unique');
  },
};
