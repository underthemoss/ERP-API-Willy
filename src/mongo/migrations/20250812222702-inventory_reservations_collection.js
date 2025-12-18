module.exports = {
  async up(db, client) {
    // Create the inventory_reservations collection
    const collections = await db
      .listCollections({ name: 'inventory_reservations' })
      .toArray();
    if (collections.length === 0) {
      await db.createCollection('inventory_reservations');
    }

    // Create indexes for efficient querying
    const collection = db.collection('inventory_reservations');

    // Compound index for company and inventory lookups
    await collection.createIndex(
      { companyId: 1, inventoryId: 1 },
      { name: 'companyId_inventoryId_idx' },
    );

    // Index for fulfilment lookups
    await collection.createIndex(
      { fulfilmentId: 1 },
      { name: 'fulfilmentId_idx' },
    );

    // Index for date range queries
    await collection.createIndex(
      { startDate: 1, endDate: 1 },
      { name: 'startDate_endDate_idx' },
    );

    // Index for deleted flag
    await collection.createIndex({ deleted: 1 }, { name: 'deleted_idx' });

    // Compound index for overlapping reservation queries
    await collection.createIndex(
      { inventoryId: 1, startDate: 1, endDate: 1, deleted: 1 },
      { name: 'inventoryId_dates_deleted_idx' },
    );

    // Index for type filtering
    await collection.createIndex({ type: 1 }, { name: 'type_idx' });

    // Create the inventory_reservation_events collection for EventStore
    await db.createCollection('inventory_reservation_events');
    const eventsCollections = await db
      .listCollections({ name: 'inventory_reservation_events' })
      .toArray();
    if (eventsCollections.length === 0) {
      await db.createCollection('inventory_reservation_events');
    }

    const eventsCollection = db.collection('inventory_reservation_events');

    // Create indexes for the events collection
    await eventsCollection.createIndex(
      { aggregateId: 1, eventId: 1 },
      { unique: true, name: 'aggregateId_eventId_idx' },
    );

    await eventsCollection.createIndex({ ts: 1 }, { name: 'ts_idx' });
  },

  async down(db, client) {
    // Drop the inventory_reservations collection
    await db.collection('inventory_reservations').drop();

    // Drop the inventory_reservation_events collection
    await db.collection('inventory_reservation_events').drop();
  },
};
