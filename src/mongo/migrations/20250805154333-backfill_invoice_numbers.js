module.exports = {
  /**
   * @param db {import('mongodb').Db}
   * @param client {import('mongodb').MongoClient}
   * @returns {Promise<void>}
   */
  async up(db, client) {
    console.log('Starting backfill of invoice numbers...');

    const invoicesCollection = db.collection('invoices');
    const sequenceNumbersCollection = db.collection('sequence_numbers');
    const referenceNumberTemplatesCollection = db.collection(
      'reference_number_templates',
    );

    // Get all unique company IDs from invoices that don't have invoiceNumber
    const companiesWithMissingNumbers = await invoicesCollection.distinct(
      'companyId',
      {
        $or: [
          { invoiceNumber: { $exists: false } },
          { invoiceNumber: null },
          { invoiceNumber: '' },
        ],
      },
    );

    console.log(
      `Found ${companiesWithMissingNumbers.length} companies with invoices missing numbers`,
    );

    for (const companyId of companiesWithMissingNumbers) {
      console.log(`Processing company: ${companyId}`);

      // Get all invoices for this company that need numbers
      const invoices = await invoicesCollection
        .find({
          companyId,
          $or: [
            { invoiceNumber: { $exists: false } },
            { invoiceNumber: null },
            { invoiceNumber: '' },
          ],
        })
        .sort({ createdAt: 1 })
        .toArray(); // Sort by creation date to maintain order

      if (invoices.length === 0) {
        console.log(`No invoices to update for company ${companyId}`);
        continue;
      }

      console.log(
        `Found ${invoices.length} invoices to update for company ${companyId}`,
      );

      // Check if there's already a default INVOICE template for this company
      let template = await referenceNumberTemplatesCollection.findOne({
        companyId,
        type: 'INVOICE',
        projectId: { $exists: false },
        businessContactId: { $exists: false },
        deleted: { $ne: true },
      });

      // If no template exists, create a default one
      if (!template) {
        template = {
          companyId,
          type: 'INVOICE',
          template: 'INVOICE-{seq}',
          resetFrequency: 'never',
          useGlobalSequence: true, // INVOICE templates must use global sequencing
          seqPadding: 4,
          startAt: 1,
          createdBy: 'migration-script',
          updatedBy: 'migration-script',
          deleted: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        await referenceNumberTemplatesCollection.insertOne(template);
        console.log(
          `Created default INVOICE template for company ${companyId}`,
        );
      }

      // Get or create sequence number for this company
      let sequenceDoc = await sequenceNumbersCollection.findOne({
        companyId,
        type: 'INVOICE',
        templateId: 'GLOBAL', // INVOICE templates always use global sequence
        deleted: { $ne: true },
      });

      let currentSequence = template.startAt || 1;

      if (sequenceDoc) {
        currentSequence = sequenceDoc.value + 1;
      } else {
        // Create new sequence document
        sequenceDoc = {
          companyId,
          type: 'INVOICE',
          templateId: 'GLOBAL',
          value: currentSequence - 1, // Will be incremented for each invoice
          createdBy: 'migration-script',
          updatedBy: 'migration-script',
          deleted: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        await sequenceNumbersCollection.insertOne(sequenceDoc);
        console.log(
          `Created sequence number document for company ${companyId}`,
        );
      }

      // Update each invoice with a sequential number
      for (const invoice of invoices) {
        const paddedSequence = currentSequence
          .toString()
          .padStart(template.seqPadding || 4, '0');
        const invoiceNumber = template.template.replace(
          '{seq}',
          paddedSequence,
        );

        // Update the invoice
        await invoicesCollection.updateOne(
          { _id: invoice._id },
          {
            $set: {
              invoiceNumber,
              updatedAt: new Date(),
              updatedBy: 'migration-script',
            },
          },
        );

        console.log(
          `Updated Invoice ${invoice._id} with number: ${invoiceNumber}`,
        );
        currentSequence++;
      }

      // Update the sequence number document with the final value
      await sequenceNumbersCollection.updateOne(
        { _id: sequenceDoc._id },
        {
          $set: {
            value: currentSequence - 1,
            updatedAt: new Date(),
            updatedBy: 'migration-script',
          },
        },
      );

      console.log(
        `Updated sequence for company ${companyId} to ${currentSequence - 1}`,
      );
    }

    console.log('Completed backfill of invoice numbers');
  },

  /**
   * @param db {import('mongodb').Db}
   * @param client {import('mongodb').MongoClient}
   * @returns {Promise<void>}
   */
  async down(db, client) {
    console.log('Rolling back invoice number backfill...');

    const invoicesCollection = db.collection('invoices');

    // Remove invoiceNumber field from all documents that were updated by the migration
    const result = await invoicesCollection.updateMany(
      { updatedBy: 'migration-script' },
      {
        $unset: { invoiceNumber: '' },
        $set: {
          updatedAt: new Date(),
          updatedBy: 'migration-rollback',
        },
      },
    );

    console.log(`Removed invoiceNumber from ${result.modifiedCount} invoices`);

    // Note: We're not removing the reference number templates and sequence numbers
    // created during the migration as they might be used by new invoices
    // created after the migration. If you need to remove them, uncomment below:

    /*
    const referenceNumberTemplatesCollection = db.collection('reference_number_templates');
    const sequenceNumbersCollection = db.collection('sequence_numbers');

    await referenceNumberTemplatesCollection.deleteMany({
      createdBy: 'migration-script',
      type: 'INVOICE'
    });

    await sequenceNumbersCollection.deleteMany({
      createdBy: 'migration-script',
      type: 'INVOICE'
    });
    */

    console.log('Completed rollback of invoice number backfill');
  },
};
