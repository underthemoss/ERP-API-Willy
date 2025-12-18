module.exports = {
  /**
   * @param db {import('mongodb').Db}
   * @param client {import('mongodb').MongoClient}
   * @returns {Promise<void>}
   */
  async up(db, client) {
    // Create the sequence_numbers collection
    const collections = await db
      .listCollections({ name: 'sequence_numbers' })
      .toArray();
    if (collections.length === 0) {
      await db.createCollection('sequence_numbers');
    }

    // Create indexes for efficient querying
    await db.collection('sequence_numbers').createIndex(
      { companyId: 1, type: 1, templateId: 1 },
      {
        name: 'companyId_type_templateId_index',
        background: true,
      },
    );

    // Index for queries without templateId (global sequences)
    await db.collection('sequence_numbers').createIndex(
      { companyId: 1, type: 1 },
      {
        name: 'companyId_type_index',
        background: true,
      },
    );

    // Index for deleted flag to support soft deletes
    await db.collection('sequence_numbers').createIndex(
      { deleted: 1 },
      {
        name: 'deleted_index',
        background: true,
      },
    );

    // Compound index for efficient sorting by value
    await db.collection('sequence_numbers').createIndex(
      { companyId: 1, type: 1, templateId: 1, value: -1 },
      {
        name: 'companyId_type_templateId_value_desc_index',
        background: true,
      },
    );
  },

  /**
   * @param db {import('mongodb').Db}
   * @param client {import('mongodb').MongoClient}
   * @returns {Promise<void>}
   */
  async down(db, client) {
    // Drop the collection and all its indexes
    await db.collection('sequence_numbers').drop();
  },
};
