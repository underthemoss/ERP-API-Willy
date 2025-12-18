import { MongoMemoryReplSet } from 'mongodb-memory-server';
import { MongoClient } from 'mongodb';
import { createReferenceNumberTemplateModel } from '../templates-model';

describe('ReferenceNumberTemplateModel - INVOICE Global Sequencing Validation', () => {
  let client: MongoClient;
  let replSet: MongoMemoryReplSet;

  beforeAll(async () => {
    replSet = await MongoMemoryReplSet.create({ replSet: { count: 1 } });
    client = await MongoClient.connect(replSet.getUri(), {});
  });

  afterAll(async () => {
    if (client) await client.close();
    if (replSet) await replSet.stop();
  });

  describe('createReferenceNumberTemplate', () => {
    it('should allow creating INVOICE template with useGlobalSequence=true', async () => {
      const model = createReferenceNumberTemplateModel({ mongoClient: client });

      const template = await model.createReferenceNumberTemplate({
        workspaceId: 'company1',
        type: 'INVOICE',
        template: 'INV-{seq}',
        resetFrequency: 'never',
        useGlobalSequence: true,
        createdBy: 'user1',
        updatedBy: 'user1',
        deleted: false,
      });

      expect(template).toBeTruthy();
      expect(template.type).toBe('INVOICE');
      expect(template.useGlobalSequence).toBe(true);
    });

    it('should throw error when creating INVOICE template with useGlobalSequence=false', async () => {
      const model = createReferenceNumberTemplateModel({ mongoClient: client });

      await expect(
        model.createReferenceNumberTemplate({
          workspaceId: 'company2',
          type: 'INVOICE',
          template: 'INV-{seq}',
          resetFrequency: 'never',
          useGlobalSequence: false,
          createdBy: 'user1',
          updatedBy: 'user1',
          deleted: false,
        }),
      ).rejects.toThrow(
        'INVOICE templates must use global sequencing (useGlobalSequence must be true)',
      );
    });

    it('should allow creating PO template with useGlobalSequence=false', async () => {
      const model = createReferenceNumberTemplateModel({ mongoClient: client });

      const template = await model.createReferenceNumberTemplate({
        workspaceId: 'company3',
        type: 'PO',
        template: 'PO-{seq}',
        resetFrequency: 'never',
        useGlobalSequence: false,
        createdBy: 'user1',
        updatedBy: 'user1',
        deleted: false,
      });

      expect(template).toBeTruthy();
      expect(template.type).toBe('PO');
      expect(template.useGlobalSequence).toBe(false);
    });

    it('should allow creating SO template with useGlobalSequence=false', async () => {
      const model = createReferenceNumberTemplateModel({ mongoClient: client });

      const template = await model.createReferenceNumberTemplate({
        workspaceId: 'company4',
        type: 'SO',
        template: 'SO-{seq}',
        resetFrequency: 'never',
        useGlobalSequence: false,
        createdBy: 'user1',
        updatedBy: 'user1',
        deleted: false,
      });

      expect(template).toBeTruthy();
      expect(template.type).toBe('SO');
      expect(template.useGlobalSequence).toBe(false);
    });
  });

  describe('updateReferenceNumberTemplateById', () => {
    it('should allow updating INVOICE template without changing useGlobalSequence', async () => {
      const model = createReferenceNumberTemplateModel({ mongoClient: client });

      // Create an INVOICE template
      const template = await model.createReferenceNumberTemplate({
        workspaceId: 'company5',
        type: 'INVOICE',
        template: 'INV-{seq}',
        resetFrequency: 'never',
        useGlobalSequence: true,
        createdBy: 'user1',
        updatedBy: 'user1',
        deleted: false,
      });

      // Update the template (without changing useGlobalSequence)
      const updated = await model.updateReferenceNumberTemplateById(
        template.id,
        {
          workspaceId: 'company5',
          type: 'INVOICE',
          template: 'INVOICE-{seq}', // Changed template format
          resetFrequency: 'never',
          useGlobalSequence: true, // Keep as true
          createdBy: 'user1',
          updatedBy: 'user2',
          deleted: false,
        },
      );

      expect(updated.template).toBe('INVOICE-{seq}');
      expect(updated.useGlobalSequence).toBe(true);
      expect(updated.updatedBy).toBe('user2');
    });

    it('should throw error when trying to update INVOICE template to useGlobalSequence=false', async () => {
      const model = createReferenceNumberTemplateModel({ mongoClient: client });

      // Create an INVOICE template
      const template = await model.createReferenceNumberTemplate({
        workspaceId: 'company6',
        type: 'INVOICE',
        template: 'INV-{seq}',
        resetFrequency: 'never',
        useGlobalSequence: true,
        createdBy: 'user1',
        updatedBy: 'user1',
        deleted: false,
      });

      // Try to update useGlobalSequence to false
      await expect(
        model.updateReferenceNumberTemplateById(template.id, {
          workspaceId: 'company6',
          type: 'INVOICE',
          template: 'INV-{seq}',
          resetFrequency: 'never',
          useGlobalSequence: false, // This should fail
          createdBy: 'user1',
          updatedBy: 'user2',
          deleted: false,
        }),
      ).rejects.toThrow(
        'INVOICE templates must use global sequencing (useGlobalSequence cannot be set to false)',
      );
    });

    it('should allow updating PO template to useGlobalSequence=false', async () => {
      const model = createReferenceNumberTemplateModel({ mongoClient: client });

      // Create a PO template
      const template = await model.createReferenceNumberTemplate({
        workspaceId: 'company7',
        type: 'PO',
        template: 'PO-{seq}',
        resetFrequency: 'never',
        useGlobalSequence: true,
        createdBy: 'user1',
        updatedBy: 'user1',
        deleted: false,
      });

      // Update useGlobalSequence to false (should work for PO)
      const updated = await model.updateReferenceNumberTemplateById(
        template.id,
        {
          workspaceId: 'company7',
          type: 'PO',
          template: 'PO-{seq}',
          resetFrequency: 'never',
          useGlobalSequence: false,
          createdBy: 'user1',
          updatedBy: 'user2',
          deleted: false,
        },
      );

      expect(updated.useGlobalSequence).toBe(false);
      expect(updated.updatedBy).toBe('user2');
    });

    it('should allow updating SO template to useGlobalSequence=false', async () => {
      const model = createReferenceNumberTemplateModel({ mongoClient: client });

      // Create an SO template
      const template = await model.createReferenceNumberTemplate({
        workspaceId: 'company8',
        type: 'SO',
        template: 'SO-{seq}',
        resetFrequency: 'never',
        useGlobalSequence: true,
        createdBy: 'user1',
        updatedBy: 'user1',
        deleted: false,
      });

      // Update useGlobalSequence to false (should work for SO)
      const updated = await model.updateReferenceNumberTemplateById(
        template.id,
        {
          workspaceId: 'company8',
          type: 'SO',
          template: 'SO-{seq}',
          resetFrequency: 'never',
          useGlobalSequence: false,
          createdBy: 'user1',
          updatedBy: 'user2',
          deleted: false,
        },
      );

      expect(updated.useGlobalSequence).toBe(false);
      expect(updated.updatedBy).toBe('user2');
    });
  });
});
