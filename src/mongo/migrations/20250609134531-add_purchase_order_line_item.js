module.exports = {
  /**
   * @param db {import('mongodb').Db}
   * @param client {import('mongodb').MongoClient}
   * @returns {Promise<void>}
   */
  async up(db, client) {
    // Create the collection if it doesn't exist
    const collections = await db
      .listCollections({ name: 'purchase_order_line_items' })
      .toArray();
    if (collections.length === 0) {
      await db.createCollection('purchase_order_line_items');
    }
    // Create an index on purchase_order_id for efficient lookup
    await db
      .collection('purchase_order_line_items')
      .createIndex({ purchase_order_id: 1 }, { name: 'purchase_order_id_idx' });
  },

  /**
   * @param db {import('mongodb').Db}
   * @param client {import('mongodb').MongoClient}
   * @returns {Promise<void>}
   */
  async down(db, client) {
    // Drop the collection to rollback
    await db.collection('purchase_order_line_items').drop();
  },
};
