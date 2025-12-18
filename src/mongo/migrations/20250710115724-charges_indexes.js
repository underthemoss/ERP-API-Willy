module.exports = {
  /**
   * @param db {import('mongodb').Db}
   * @param client {import('mongodb').MongoClient}
   * @returns {Promise<void>}
   */

  async up(db, client) {
    await db.collection('charges').createIndex(
      { companyId: 1, contactId: 1 },
      {
        name: 'companyId_contactId',
      },
    );

    await db.collection('charges').createIndex(
      { companyId: 1, contactId: 1, invoiceId: 1 },
      {
        name: 'companyId_contactId_invoiceId',
      },
    );

    await db.collection('charges').createIndex(
      { companyId: 1, fulfilmentId: 1 },
      {
        name: 'companyId_fulfilmentId',
      },
    );

    await db.collection('charges').createIndex(
      { companyId: 1, projectId: 1, salesOrderId: 1 },
      {
        name: 'companyId_projectId_salesOrderId',
      },
    );
  },

  /**
   * @param db {import('mongodb').Db}
   * @param client {import('mongodb').MongoClient}
   * @returns {Promise<void>}
   */
  async down(db, client) {
    await db.collection('charges').dropIndex('companyId_contactId');
    await db.collection('charges').dropIndex('companyId_contactId_invoiceId');
    await db.collection('charges').dropIndex('companyId_fulfilmentId');
    await db
      .collection('charges')
      .dropIndex('companyId_projectId_salesOrderId');
  },
};
