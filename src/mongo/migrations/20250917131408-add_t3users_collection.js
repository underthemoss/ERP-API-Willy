module.exports = {
  async up(db, client) {
    // Create the t3users collection

    const collections = await db.listCollections({ name: 't3users' }).toArray();
    if (collections.length === 0) {
      await db.createCollection('t3users');
    }

    // No indexes for now as per requirement
    console.log('Created t3users collection');
  },

  async down(db, client) {
    // Drop the t3users collection
    await db.dropCollection('t3users');
    console.log('Dropped t3users collection');
  },
};
