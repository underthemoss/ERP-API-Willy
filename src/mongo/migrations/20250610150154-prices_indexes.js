module.exports = {
  /**
   * @param db {import('mongodb').Db}
   * @param client {import('mongodb').MongoClient}
   * @returns {Promise<void>}
   */
  async up(db, client) {
    await db.collection('prices').createIndex(
      {
        companyId: 1,
        pimCategoryId: 1,
        priceBookId: 1,
        priceType: 1,
        name: 1,
        createdAt: -1,
      },
      { name: 'prices_compound_index' },
    );
  },

  /**
   * @param db {import('mongodb').Db}
   * @param client {import('mongodb').MongoClient}
   * @returns {Promise<void>}
   */
  async down(db, client) {
    await db.collection('prices').dropIndex('prices_compound_index');
  },
};
