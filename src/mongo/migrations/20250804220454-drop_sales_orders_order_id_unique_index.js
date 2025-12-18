module.exports = {
  /**
   * @param db {import('mongodb').Db}
   * @param client {import('mongodb').MongoClient}
   * @returns {Promise<void>}
   */
  async up(db, client) {
    // Drop the unique index on order_id in sales_orders collection
    // This index is no longer needed since we're using sales_order_number instead
    try {
      await db
        .collection('sales_orders')
        .dropIndex('sales_orders_order_id_unique');
      console.log('Successfully dropped sales_orders_order_id_unique index');
    } catch (error) {
      // If the index doesn't exist, that's fine - it may have already been dropped
      if (error.code === 27 || error.codeName === 'IndexNotFound') {
        console.log(
          'Index sales_orders_order_id_unique does not exist, skipping',
        );
      } else {
        throw error;
      }
    }
  },

  /**
   * @param db {import('mongodb').Db}
   * @param client {import('mongodb').MongoClient}
   * @returns {Promise<void>}
   */
  async down(db, client) {
    // Recreate the unique index on order_id in sales_orders collection
    // This is the rollback operation
    await db
      .collection('sales_orders')
      .createIndex(
        { order_id: 1 },
        { unique: true, name: 'sales_orders_order_id_unique' },
      );
    console.log('Recreated sales_orders_order_id_unique index');
  },
};
