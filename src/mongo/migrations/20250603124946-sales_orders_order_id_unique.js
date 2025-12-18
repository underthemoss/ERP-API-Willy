module.exports = {
  /**
   * @param db {import('mongodb').Db}
   * @param client {import('mongodb').MongoClient}
   * @returns {Promise<void>}
   */
  async up(db, client) {
    // Add a unique index to order_id in sales_orders collection
    await db
      .collection('sales_orders')
      .createIndex(
        { order_id: 1 },
        { unique: true, name: 'sales_orders_order_id_unique' },
      );
  },

  /**
   * @param db {import('mongodb').Db}
   * @param client {import('mongodb').MongoClient}
   * @returns {Promise<void>}
   */
  async down(db, client) {
    // Remove the unique index from order_id in sales_orders collection
    await db
      .collection('sales_orders')
      .dropIndex('sales_orders_order_id_unique');
  },
};
