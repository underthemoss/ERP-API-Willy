module.exports = {
  /**
   * @param db {import('mongodb').Db}
   * @param client {import('mongodb').MongoClient}
   * @returns {Promise<void>}
   */
  async up(db, client) {
    console.log('Starting backfill of sales order numbers...');

    const salesOrdersCollection = db.collection('sales_orders');
    const sequenceNumbersCollection = db.collection('sequence_numbers');
    const referenceNumberTemplatesCollection = db.collection(
      'reference_number_templates',
    );

    // Get all unique company IDs from sales orders that don't have sales_order_number
    const companiesWithMissingNumbers = await salesOrdersCollection.distinct(
      'company_id',
      {
        $or: [
          { sales_order_number: { $exists: false } },
          { sales_order_number: null },
          { sales_order_number: '' },
        ],
      },
    );

    console.log(
      `Found ${companiesWithMissingNumbers.length} companies with sales orders missing numbers`,
    );

    for (const companyId of companiesWithMissingNumbers) {
      console.log(`Processing company: ${companyId}`);

      // Get all sales orders for this company that need numbers
      const salesOrders = await salesOrdersCollection
        .find({
          company_id: companyId,
          $or: [
            { sales_order_number: { $exists: false } },
            { sales_order_number: null },
            { sales_order_number: '' },
          ],
        })
        .sort({ created_at: 1 })
        .toArray(); // Sort by creation date to maintain order

      if (salesOrders.length === 0) {
        console.log(`No sales orders to update for company ${companyId}`);
        continue;
      }

      console.log(
        `Found ${salesOrders.length} sales orders to update for company ${companyId}`,
      );

      // Check if there's already a default SO template for this company
      let template = await referenceNumberTemplatesCollection.findOne({
        companyId,
        type: 'SO',
        projectId: { $exists: false },
        businessContactId: { $exists: false },
        deleted: { $ne: true },
      });

      // If no template exists, create a default one
      if (!template) {
        template = {
          companyId,
          type: 'SO',
          template: 'SO-{seq}',
          resetFrequency: 'never',
          useGlobalSequence: true,
          seqPadding: 4,
          startAt: 1,
          createdBy: 'migration-script',
          updatedBy: 'migration-script',
          deleted: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        await referenceNumberTemplatesCollection.insertOne(template);
        console.log(`Created default SO template for company ${companyId}`);
      }

      // Get or create sequence number for this company
      let sequenceDoc = await sequenceNumbersCollection.findOne({
        companyId,
        type: 'SO',
        templateId: 'GLOBAL', // Using global sequence as per template
        deleted: { $ne: true },
      });

      let currentSequence = template.startAt || 1;

      if (sequenceDoc) {
        currentSequence = sequenceDoc.value + 1;
      } else {
        // Create new sequence document
        sequenceDoc = {
          companyId,
          type: 'SO',
          templateId: 'GLOBAL',
          value: currentSequence - 1, // Will be incremented for each SO
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

      // Update each sales order with a sequential number
      for (const so of salesOrders) {
        const paddedSequence = currentSequence
          .toString()
          .padStart(template.seqPadding || 4, '0');
        const salesOrderNumber = template.template.replace(
          '{seq}',
          paddedSequence,
        );

        // Update the sales order
        await salesOrdersCollection.updateOne(
          { _id: so._id },
          {
            $set: {
              sales_order_number: salesOrderNumber,
              updated_at: new Date(),
              updated_by: 'migration-script',
            },
          },
        );

        console.log(`Updated SO ${so._id} with number: ${salesOrderNumber}`);
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

    console.log('Completed backfill of sales order numbers');
  },

  /**
   * @param db {import('mongodb').Db}
   * @param client {import('mongodb').MongoClient}
   * @returns {Promise<void>}
   */
  async down(db, client) {
    console.log('Rolling back sales order number backfill...');

    const salesOrdersCollection = db.collection('sales_orders');

    // Remove sales_order_number field from all documents that were updated by the migration
    const result = await salesOrdersCollection.updateMany(
      { updated_by: 'migration-script' },
      {
        $unset: { sales_order_number: '' },
        $set: {
          updated_at: new Date(),
          updated_by: 'migration-rollback',
        },
      },
    );

    console.log(
      `Removed sales_order_number from ${result.modifiedCount} sales orders`,
    );

    // Note: We're not removing the reference number templates and sequence numbers
    // created during the migration as they might be used by new sales orders
    // created after the migration. If you need to remove them, uncomment below:

    /*
    const referenceNumberTemplatesCollection = db.collection('reference_number_templates');
    const sequenceNumbersCollection = db.collection('sequence_numbers');

    await referenceNumberTemplatesCollection.deleteMany({
      createdBy: 'migration-script',
      type: 'SO'
    });

    await sequenceNumbersCollection.deleteMany({
      createdBy: 'migration-script',
      type: 'SO'
    });
    */

    console.log('Completed rollback of sales order number backfill');
  },
};
