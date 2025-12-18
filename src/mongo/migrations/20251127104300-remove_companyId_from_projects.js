module.exports = {
  /**
   * @param db {import('mongodb').Db}
   * @param client {import('mongodb').MongoClient}
   * @returns {Promise<void>}
   */
  async up(db, client) {
    // Remove companyId field from all projects documents
    const result = await db
      .collection('projects')
      .updateMany({}, { $unset: { companyId: '' } });

    console.log(
      `Successfully removed companyId field from ${result.modifiedCount} project documents`,
    );
  },

  /**
   * @param db {import('mongodb').Db}
   * @param client {import('mongodb').MongoClient}
   * @returns {Promise<void>}
   */
  async down(db, client) {
    // Note: Cannot restore companyId values as we don't know what they were
    // This migration is not reversible
    console.log(
      'Warning: Cannot restore companyId field - migration is not reversible',
    );
  },
};
