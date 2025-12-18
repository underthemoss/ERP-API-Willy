import { gql } from 'graphql-request';
import { createTestEnvironment } from './test-environment';

const { createClient } = createTestEnvironment();

gql`
  query GetDefaultTemplates($workspaceId: String!) {
    getDefaultTemplates(workspaceId: $workspaceId) {
      id
      workspaceId
      type
      template
      seqPadding
      startAt
      resetFrequency
      useGlobalSequence
      createdBy
      createdAt
      updatedAt
      updatedBy
      businessContactId
      projectId
      deleted
    }
  }
`;

describe('getDefaultTemplates Query', () => {
  it('should return default templates for all types (PO, SO, INVOICE)', async () => {
    const { sdk, utils } = await createClient();
    const workspace = await utils.createWorkspace();

    const response = await sdk.GetDefaultTemplates({
      workspaceId: workspace.id,
    });

    expect(response.getDefaultTemplates).toHaveLength(3);

    // Check that we have one template for each type
    const types = response.getDefaultTemplates.map((t: any) => t.type);
    expect(types).toContain('PO');
    expect(types).toContain('SO');
    expect(types).toContain('INVOICE');

    // Check that all templates are default templates (no projectId or businessContactId)
    response.getDefaultTemplates.forEach((template: any) => {
      expect(template.projectId).toBeNull();
      expect(template.businessContactId).toBeNull();
      expect(template.useGlobalSequence).toBe(true);
      expect(template.resetFrequency).toBe('never');
      expect(template.seqPadding).toBe(4);
      expect(template.startAt).toBe(1);
      expect(template.deleted).toBe(false);
    });

    // Check template formats
    const poTemplate = response.getDefaultTemplates.find(
      (t: any) => t.type === 'PO',
    );
    const soTemplate = response.getDefaultTemplates.find(
      (t: any) => t.type === 'SO',
    );
    const invoiceTemplate = response.getDefaultTemplates.find(
      (t: any) => t.type === 'INVOICE',
    );

    expect(poTemplate).toBeDefined();
    expect(soTemplate).toBeDefined();
    expect(invoiceTemplate).toBeDefined();

    expect(poTemplate!.template).toBe('PO-{seq}');
    expect(soTemplate!.template).toBe('SO-{seq}');
    expect(invoiceTemplate!.template).toBe('INVOICE-{seq}');

    // Verify INVOICE template uses global sequencing (validation requirement)
    expect(invoiceTemplate!.useGlobalSequence).toBe(true);
  });

  it('should return the same templates on subsequent calls (get or create behavior)', async () => {
    const { sdk, utils } = await createClient();
    const workspace = await utils.createWorkspace();

    // First call
    const response1 = await sdk.GetDefaultTemplates({
      workspaceId: workspace.id,
    });

    // Second call
    const response2 = await sdk.GetDefaultTemplates({
      workspaceId: workspace.id,
    });

    expect(response1.getDefaultTemplates).toHaveLength(3);
    expect(response2.getDefaultTemplates).toHaveLength(3);

    // Templates should have the same IDs (not creating duplicates)
    const ids1 = response1.getDefaultTemplates.map((t: any) => t.id).sort();
    const ids2 = response2.getDefaultTemplates.map((t: any) => t.id).sort();

    expect(ids1).toEqual(ids2);
  });
});
