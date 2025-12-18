module.exports = {
  async up(db, client) {
    // Create a sparse unique index on the email field in the users collection
    // Sparse index only indexes documents where the field exists
    // This handles cases where email might not exist for some users
    await db.collection('users').createIndex(
      { email: 1 },
      {
        unique: true,
        sparse: true,
        name: 'email_unique_sparse_idx',
        background: true, // Create index in background to avoid blocking operations
      },
    );

    console.log(
      'Successfully created sparse unique index on users.email field',
    );
  },

  async down(db, client) {
    // Drop the email index if we need to rollback
    await db.collection('users').dropIndex('email_unique_sparse_idx');

    console.log('Successfully dropped index on users.email field');
  },
};
