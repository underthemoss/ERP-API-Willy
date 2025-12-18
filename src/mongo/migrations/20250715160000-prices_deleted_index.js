module.exports = {
  /**
   * @param db {import('mongodb').Db}
   * @param client {import('mongodb').MongoClient}
   * @returns {Promise<void>}
   */
  async up(db, client) {
    await db.collection('prices').dropIndex('prices_compound_index');
    await db.collection('prices').dropIndex('company_createdAt');
    await db.collection('prices').dropIndex('company_pim_product_createdAt');
    await db.collection('prices').dropIndex('company_asset_createdAt');

    await db.collection('prices').createIndex(
      {
        companyId: 1,
        pimCategoryId: 1,
        priceBookId: 1,
        priceType: 1,
        name: 1,
        deleted: 1,
        createdAt: -1,
      },
      { name: 'prices_compound_index' },
    );

    await db
      .collection('price_books')
      .createIndex(
        { companyId: 1, deleted: 1 },
        { name: 'price_books_companyId_deleted' },
      );
  },

  /**
   * @param db {import('mongodb').Db}
   * @param client {import('mongodb').MongoClient}
   * @returns {Promise<void>}
   */
  async down(db, client) {
    await db.collection('prices').dropIndex('prices_compound_index');
    await db
      .collection('price_books')
      .dropIndex('price_books_companyId_deleted');
  },
};
