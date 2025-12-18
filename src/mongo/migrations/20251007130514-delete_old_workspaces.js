module.exports = {
  /**
   * @param db {import('mongodb').Db}
   * @param client {import('mongodb').MongoClient}
   * @returns {Promise<void>}
   */
  async up(db, client) {
    const batchSize = 1000;
    let totalDeleted = 0;
    let batchNumber = 0;

    console.log('Starting deletion of workspaces with null ownerId...');

    while (true) {
      // Find a batch of documents to delete (only get their IDs to save memory)
      const docsToDelete = await db
        .collection('workspaces')
        .find({ ownerId: null }, { projection: { _id: 1 } })
        .limit(batchSize)
        .toArray();

      // If no more documents found, we're done
      if (docsToDelete.length === 0) {
        break;
      }

      // Extract the IDs
      const idsToDelete = docsToDelete.map((doc) => doc._id);

      // Delete this batch
      const deleteResult = await db
        .collection('workspaces')
        .deleteMany({ _id: { $in: idsToDelete } });

      totalDeleted += deleteResult.deletedCount;
      batchNumber++;

      // Log progress every 10 batches (10,000 documents)
      if (batchNumber % 10 === 0) {
        console.log(`Progress: Deleted ${totalDeleted} workspaces so far...`);
      }
    }

    console.log(`Completed: Deleted ${totalDeleted} workspaces in total`);
  },

  /**
   * @param db {import('mongodb').Db}
   * @param client {import('mongodb').MongoClient}
   * @returns {Promise<void>}
   */
  async down(db, client) {
    // N/A - Cannot restore deleted documents
  },
};
