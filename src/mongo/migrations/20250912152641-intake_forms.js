module.exports = {
  async up(db, client) {
    // Create intake_forms collection if it doesn't exist
    const intakeFormsExists = await db
      .listCollections({ name: 'intake_forms' })
      .toArray();
    if (intakeFormsExists.length === 0) {
      await db.createCollection('intake_forms');
    }

    // Create intake_form_submissions collection if it doesn't exist
    const intakeFormSubmissionsExists = await db
      .listCollections({ name: 'intake_form_submissions' })
      .toArray();
    if (intakeFormSubmissionsExists.length === 0) {
      await db.createCollection('intake_form_submissions');
    }

    // Add indexes for intake_forms collection
    const intakeFormsCollection = db.collection('intake_forms');
    await intakeFormsCollection.createIndex(
      { workspaceId: 1, isDeleted: 1 },
      { name: 'workspaceId_1_isDeleted_1' },
    );

    // Add indexes for intake_form_submissions collection
    const intakeFormSubmissionsCollection = db.collection(
      'intake_form_submissions',
    );
    await intakeFormSubmissionsCollection.createIndex(
      { workspaceId: 1 },
      { name: 'workspaceId_1' },
    );
    await intakeFormSubmissionsCollection.createIndex(
      { formId: 1 },
      { name: 'formId_1' },
    );
  },

  async down(db, client) {
    // Drop indexes from intake_forms collection
    const intakeFormsCollection = db.collection('intake_forms');
    try {
      await intakeFormsCollection.dropIndex('workspaceId_1_isDeleted_1');
    } catch (error) {
      // Index might not exist, continue
    }

    // Drop indexes from intake_form_submissions collection
    const intakeFormSubmissionsCollection = db.collection(
      'intake_form_submissions',
    );
    try {
      await intakeFormSubmissionsCollection.dropIndex('workspaceId_1');
    } catch (error) {
      // Index might not exist, continue
    }
    try {
      await intakeFormSubmissionsCollection.dropIndex('formId_1');
    } catch (error) {
      // Index might not exist, continue
    }

    // Note: We're not dropping the collections in the down migration
    // as they might contain data. If you want to drop them, uncomment below:
    // await db.dropCollection('intake_forms');
    // await db.dropCollection('intake_form_submissions');
  },
};
