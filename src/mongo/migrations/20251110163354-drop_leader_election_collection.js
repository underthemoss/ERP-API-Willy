/**
 * Migration to drop the leader_election collection.
 *
 * This collection was used by the legacy leader election service for CDC publishing.
 * Since we've removed leader election functionality and CDC source connectors,
 * this collection is no longer needed.
 */
module.exports = {
  async up(db, client) {
    const collectionName = 'leader_election';

    // Check if the collection exists
    const collections = await db
      .listCollections({ name: collectionName })
      .toArray();

    if (collections.length === 0) {
      console.log(
        `Collection '${collectionName}' does not exist - nothing to drop`,
      );
      return;
    }

    // Get document count before dropping
    const collection = db.collection(collectionName);
    const count = await collection.countDocuments();

    console.log(`Dropping collection '${collectionName}' (${count} documents)`);

    // Drop the collection
    await collection.drop();

    console.log(`Successfully dropped collection '${collectionName}'`);
  },

  async down(db, client) {
    // This migration cannot be reversed as we're dropping the collection
    // The leader election service has been removed from the codebase
    console.log(
      'This migration cannot be reversed - the leader_election collection has been dropped and the service no longer exists',
    );
  },
};
