module.exports = {
  /**
   * @param db {import('mongodb').Db}
   * @param client {import('mongodb').MongoClient}
   * @returns {Promise<void>}
   */
  async up(db, client) {
    const lineItemsCollection = db.collection(
      'intake_form_submission_line_items',
    );
    const submissionsCollection = db.collection('intake_form_submissions');

    // Step 1: Add subtotalInCents field to all line items that don't have it (default to 0)
    const lineItemsResult = await lineItemsCollection.updateMany(
      { subtotalInCents: { $exists: false } },
      { $set: { subtotalInCents: 0 } },
    );
    console.log(
      `Updated ${lineItemsResult.modifiedCount} line items with subtotalInCents: 0`,
    );

    // Step 2: Add totalInCents field to all submissions that don't have it (default to 0)
    const submissionsResult = await submissionsCollection.updateMany(
      { totalInCents: { $exists: false } },
      { $set: { totalInCents: 0 } },
    );
    console.log(
      `Updated ${submissionsResult.modifiedCount} submissions with totalInCents: 0`,
    );

    // Step 3: Create index for sorting/filtering submissions by total
    await submissionsCollection.createIndex(
      { workspaceId: 1, totalInCents: 1 },
      { name: 'workspaceId_totalInCents' },
    );
    console.log('Created index: workspaceId_totalInCents');

    console.log(
      '\nNOTE: All values set to 0 by default. To calculate actual subtotals based on prices,',
    );
    console.log(
      'run the backfill script after deployment: npm run backfill:intake-form-subtotals',
    );
  },

  /**
   * @param db {import('mongodb').Db}
   * @param client {import('mongodb').MongoClient}
   * @returns {Promise<void>}
   */
  async down(db, client) {
    const lineItemsCollection = db.collection(
      'intake_form_submission_line_items',
    );
    const submissionsCollection = db.collection('intake_form_submissions');

    // Remove subtotalInCents from line items
    await lineItemsCollection.updateMany(
      {},
      { $unset: { subtotalInCents: '' } },
    );
    console.log('Removed subtotalInCents from line items');

    // Remove totalInCents from submissions
    await submissionsCollection.updateMany(
      {},
      { $unset: { totalInCents: '' } },
    );
    console.log('Removed totalInCents from submissions');

    // Drop the index
    try {
      await submissionsCollection.dropIndex('workspaceId_totalInCents');
      console.log('Dropped index: workspaceId_totalInCents');
    } catch (e) {
      console.log(
        'Index workspaceId_totalInCents may not exist, skipping drop',
      );
    }
  },
};
