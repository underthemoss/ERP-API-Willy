/**
 * Migration to remove inventory records that were created by the asset inventory sink connector.
 * These records were synced from assets automatically but are no longer needed.
 *
 * Identifies inventory by:
 * - createdBy: 'system' (the asset sink used 'system' as the principal)
 * - assetId exists (the asset sink always set this)
 * - purchaseOrderId is null/undefined (asset sink inventory was not tied to purchase orders)
 *
 * Processes in batches to handle large datasets efficiently.
 */
module.exports = {
  async up(db, client) {
    const inventoryCollection = db.collection('inventory');
    const eventsCollection = db.collection('inventory_events');

    // Batch size for processing
    const BATCH_SIZE = 1000;

    // Find all inventory records created by the asset sink
    const criteria = {
      createdBy: 'system',
      assetId: { $exists: true, $ne: null },
      purchaseOrderId: { $exists: false },
    };

    // First, get the total count
    const totalCount = await inventoryCollection.countDocuments(criteria);
    console.log(`Found ${totalCount} inventory records to delete`);

    if (totalCount === 0) {
      console.log('No inventory records to delete');
      return;
    }

    let deletedInventoryCount = 0;
    let deletedEventsCount = 0;
    let batchNumber = 0;

    // Process in batches using a cursor
    while (true) {
      const session = client.startSession();

      try {
        await session.withTransaction(async () => {
          // Find a batch of IDs to delete
          const batch = await inventoryCollection
            .find(criteria, { projection: { _id: 1 }, session })
            .limit(BATCH_SIZE)
            .toArray();

          if (batch.length === 0) {
            // No more records to delete
            return;
          }

          const batchIds = batch.map((doc) => doc._id);
          batchNumber++;

          // Delete the inventory events first (to maintain referential integrity)
          const eventsResult = await eventsCollection.deleteMany(
            { aggregateId: { $in: batchIds } },
            { session },
          );
          deletedEventsCount += eventsResult.deletedCount;

          // Delete the inventory records
          const inventoryResult = await inventoryCollection.deleteMany(
            { _id: { $in: batchIds } },
            { session },
          );
          deletedInventoryCount += inventoryResult.deletedCount;

          console.log(
            `Batch ${batchNumber}: Deleted ${inventoryResult.deletedCount} inventory records and ${eventsResult.deletedCount} events (Progress: ${deletedInventoryCount}/${totalCount})`,
          );
        });
      } finally {
        await session.endSession();
      }

      // Check if we're done
      const remainingCount = await inventoryCollection.countDocuments(criteria);
      if (remainingCount === 0) {
        break;
      }
    }

    console.log('');
    console.log('=== Migration Complete ===');
    console.log(`Total inventory records deleted: ${deletedInventoryCount}`);
    console.log(`Total events deleted: ${deletedEventsCount}`);
  },

  async down(db, client) {
    // This migration cannot be reversed as we're deleting data
    // The asset sink connector no longer exists, so we cannot recreate the data
    console.log(
      'This migration cannot be reversed - data has been permanently deleted',
    );
  },
};
