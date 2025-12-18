module.exports = {
  /**
   * @param db {import('mongodb').Db}
   * @param client {import('mongodb').MongoClient}
   * @returns {Promise<void>}
   */
  async up(db, client) {
    const collections = await db
      .listCollections({ name: 'purchase_orders' })
      .toArray();
    if (collections.length === 0) {
      await db.createCollection('purchase_orders');
    }
  },

  /**
   * @param db {import('mongodb').Db}
   * @param client {import('mongodb').MongoClient}
   * @returns {Promise<void>}
   */
  async down(db, client) {
    await db.collection('purchase_orders').drop();
  },
};
