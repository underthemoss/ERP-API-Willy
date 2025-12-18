module.exports = {
  /**
   * @param db {import('mongodb').Db}
   * @param client {import('mongodb').MongoClient}
   * @returns {Promise<void>}
   */
  async up(db, client) {
    await db.collection('users').insertOne({
      _id: 'SYSTEM',
      company_id: '*',
      first_name: 'System',
      last_name: 'User',
      username: 'system@equipmentshare.com',
      deleted: false,
    });
  },

  /**
   * @param db {import('mongodb').Db}
   * @param client {import('mongodb').MongoClient}
   * @returns {Promise<void>}
   */
  async down(db, client) {
    await db.collection('users').deleteOne({ _id: 'SYSTEM' });
  },
};
