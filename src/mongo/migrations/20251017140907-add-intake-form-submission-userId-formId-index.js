module.exports = {
  async up(db, client) {
    const collection = db.collection('intake_form_submissions');

    // Create compound index for userId and formId
    // This will optimize queries that look up submissions by userId
    // and need to get distinct formIds
    await collection.createIndex(
      { userId: 1, formId: 1 },
      {
        sparse: true, // Only index documents that have userId field
        name: 'userId_1_formId_1',
      },
    );

    console.log(
      'Added compound index (userId, formId) on intake_form_submissions collection for optimized user submission queries',
    );
  },

  async down(db, client) {
    const collection = db.collection('intake_form_submissions');

    try {
      await collection.dropIndex('userId_1_formId_1');
      console.log('Dropped userId_1_formId_1 index');
    } catch (error) {
      console.log('userId_1_formId_1 index does not exist or already dropped');
    }
  },
};
