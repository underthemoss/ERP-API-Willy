/**
 * Migration: Update compound indexes for user search optimization to include deleted flag
 *
 * Indexes:
 *   { company_id: 1, deleted: 1, first_name: 1 }
 *   { company_id: 1, deleted: 1, last_name: 1 }
 *   { company_id: 1, deleted: 1, username: 1 }
 */

module.exports = {
  async up(db) {
    await db
      .collection('users')
      .createIndex(
        { company_id: 1, deleted: 1, first_name: 1 },
        { name: 'companyId_firstName' },
      );
    await db
      .collection('users')
      .createIndex(
        { company_id: 1, deleted: 1, last_name: 1 },
        { name: 'companyId_lastName' },
      );
    await db
      .collection('users')
      .createIndex(
        { company_id: 1, deleted: 1, username: 1 },
        { name: 'companyId_username' },
      );
  },

  async down(db) {
    await db.collection('users').dropIndex('companyId_firstName');
    await db.collection('users').dropIndex('companyId_lastName');
    await db.collection('users').dropIndex('companyId_username');
  },
};
