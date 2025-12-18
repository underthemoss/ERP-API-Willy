module.exports = {
  /**
   * @param db {import('mongodb').Db}
   * @param client {import('mongodb').MongoClient}
   * @returns {Promise<void>}
   */
  async up(db, client) {
    console.log('Starting backfill of purchase order numbers...');

    const purchaseOrdersCollection = db.collection('purchase_orders');
    const sequenceNumbersCollection = db.collection('sequence_numbers');
    const referenceNumberTemplatesCollection = db.collection(
      'reference_number_templates',
    );

    // Get all unique company IDs from purchase orders that don't have purchase_order_number
    const companiesWithMissingNumbers = await purchaseOrdersCollection.distinct(
      'company_id',
      {
        $or: [
          { purchase_order_number: { $exists: false } },
          { purchase_order_number: null },
          { purchase_order_number: '' },
        ],
      },
    );

    console.log(
      `Found ${companiesWithMissingNumbers.length} companies with purchase orders missing numbers`,
    );

    for (const companyId of companiesWithMissingNumbers) {
      console.log(`Processing company: ${companyId}`);

      // Get all purchase orders for this company that need numbers
      const purchaseOrders = await purchaseOrdersCollection
        .find({
          company_id: companyId,
          $or: [
            { purchase_order_number: { $exists: false } },
            { purchase_order_number: null },
            { purchase_order_number: '' },
          ],
        })
        .sort({ created_at: 1 })
        .toArray(); // Sort by creation date to maintain order

      if (purchaseOrders.length === 0) {
        console.log(`No purchase orders to update for company ${companyId}`);
        continue;
      }

      console.log(
        `Found ${purchaseOrders.length} purchase orders to update for company ${companyId}`,
      );

      // Check if there's already a default PO template for this company
      let template = await referenceNumberTemplatesCollection.findOne({
        companyId,
        type: 'PO',
        projectId: { $exists: false },
        businessContactId: { $exists: false },
        deleted: { $ne: true },
      });

      // If no template exists, create a default one
      if (!template) {
        template = {
          companyId,
          type: 'PO',
          template: 'PO-{seq}',
          resetFrequency: 'never',
          useGlobalSequence: true,
          seqPadding: 4,
          startAt: 1,
          createdBy: 'SYSTEM',
          updatedBy: 'SYSTEM',
          deleted: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        await referenceNumberTemplatesCollection.insertOne(template);
      }

      // Get or create sequence number for this company
      let sequenceDoc = await sequenceNumbersCollection.findOne({
        companyId,
        type: 'PO',
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
          type: 'PO',
          templateId: 'GLOBAL',
          value: currentSequence - 1, // Will be incremented for each PO
          createdBy: 'SYSTEM',
          updatedBy: 'SYSTEM',
          deleted: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        await sequenceNumbersCollection.insertOne(sequenceDoc);
      }

      // Update each purchase order with a sequential number
      for (const po of purchaseOrders) {
        const paddedSequence = currentSequence
          .toString()
          .padStart(template.seqPadding || 4, '0');
        const purchaseOrderNumber = template.template.replace(
          '{seq}',
          paddedSequence,
        );

        // Update the purchase order
        await purchaseOrdersCollection.updateOne(
          { _id: po._id },
          {
            $set: {
              purchase_order_number: purchaseOrderNumber,
              updated_at: new Date(),
              updated_by: 'SYSTEM',
            },
          },
        );

        console.log(
          `Updated PO._id: ${po._id} with number: ${purchaseOrderNumber}`,
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
            updatedBy: 'SYSTEM',
          },
        },
      );

      console.log(
        `Updated sequence for company ${companyId} to ${currentSequence - 1}`,
      );
    }

    console.log('Completed backfill of purchase order numbers');
  },

  /**
   * @param db {import('mongodb').Db}
   * @param client {import('mongodb').MongoClient}
   * @returns {Promise<void>}
   */
  async down(db, client) {
    console.log('Rolling back purchase order number backfill...');

    const purchaseOrdersCollection = db.collection('purchase_orders');

    // Remove purchase_order_number field from all documents that were updated by the migration
    const result = await purchaseOrdersCollection.updateMany(
      { updated_by: 'SYSTEM' },
      {
        $unset: { purchase_order_number: '' },
        $set: {
          updated_at: new Date(),
          updated_by: 'migration-rollback',
        },
      },
    );

    console.log(
      `Removed purchase_order_number from ${result.modifiedCount} purchase orders`,
    );

    // Note: We're not removing the reference number templates and sequence numbers
    // created during the migration as they might be used by new purchase orders
    // created after the migration. If you need to remove them, uncomment below:

    /*
    const referenceNumberTemplatesCollection = db.collection('reference_number_templates');
    const sequenceNumbersCollection = db.collection('sequence_numbers');

    await referenceNumberTemplatesCollection.deleteMany({
      createdBy: 'SYSTEM'
    });

    await sequenceNumbersCollection.deleteMany({
      createdBy: 'SYSTEM'
    });
    */

    console.log('Completed rollback of purchase order number backfill');
  },
};
