module.exports = {
  async up(db, client) {
    // Add indexes for salesOrderId, purchaseOrderId, and other essential fields
    const collection = db.collection('intake_form_submissions');

    // Create index for salesOrderId
    await collection.createIndex(
      { salesOrderId: 1 },
      {
        sparse: true, // Only index documents that have this field
        name: 'salesOrderId_1',
      },
    );

    // Create index for purchaseOrderId
    await collection.createIndex(
      { purchaseOrderId: 1 },
      {
        sparse: true, // Only index documents that have this field
        name: 'purchaseOrderId_1',
      },
    );

    // ESSENTIAL INDEXES for common query patterns

    // Index for workspaceId - heavily used in listings
    await collection.createIndex(
      { workspaceId: 1 },
      {
        name: 'workspaceId_1',
      },
    );

    // Index for formId - used in form submissions
    await collection.createIndex(
      { formId: 1 },
      {
        name: 'formId_1',
      },
    );

    // Index for status - used for DRAFT vs SUBMITTED filtering
    await collection.createIndex(
      { status: 1 },
      {
        name: 'status_1',
      },
    );

    // Index for createdAt - used for ordering results
    await collection.createIndex(
      { createdAt: -1 },
      {
        name: 'createdAt_-1',
      },
    );

    // Compound index for efficient filtered listings
    await collection.createIndex(
      { workspaceId: 1, status: 1 },
      {
        name: 'workspaceId_1_status_1',
      },
    );

    console.log(
      'Added indexes for salesOrderId, purchaseOrderId, and essential query fields on intake_form_submissions collection',
    );
  },

  async down(db, client) {
    // Remove the indexes
    const collection = db.collection('intake_form_submissions');

    const indexesToDrop = [
      'salesOrderId_1',
      'purchaseOrderId_1',
      'workspaceId_1',
      'formId_1',
      'status_1',
      'createdAt_-1',
      'workspaceId_1_status_1',
    ];

    for (const indexName of indexesToDrop) {
      try {
        await collection.dropIndex(indexName);
        console.log(`Dropped ${indexName} index`);
      } catch (error) {
        console.log(`${indexName} index does not exist or already dropped`);
      }
    }
  },
};
