module.exports = {
  async up(db) {
    const collections = await db
      .listCollections({ name: 'sales_orders' })
      .toArray();
    if (collections.length === 0) {
      await db.createCollection('sales_orders');
    }

    await db.collection('sales_orders').createIndex({ companyId: 1 });

    await db.collection('sales_orders').createIndex({ order_id: 1 });
  },

  async down(db) {
    await db
      .collection('sales_orders')
      .dropIndex('companyId_1')
      .catch(() => {});
    await db
      .collection('sales_orders')
      .dropIndex('order_id_1')
      .catch(() => {});

    await db.collection('sales_orders').drop();
  },
};
