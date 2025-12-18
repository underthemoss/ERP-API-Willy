/// <reference types="jest" />
import { ChargeType, WorkspaceAccessType } from './generated/graphql';
import { createTestEnvironment } from './test-environment';
import { gql } from 'graphql-request';

gql`
  fragment ChargeFields on Charge {
    id

    amountInCents
    description
    chargeType
    contactId
    createdAt
    projectId
    salesOrderId
    purchaseOrderNumber
    salesOrderLineItemId
    fulfilmentId
    invoiceId
  }

  mutation CreateCharge($input: CreateChargeInput!) {
    createCharge(input: $input) {
      ...ChargeFields
    }
  }
`;

const { createClient } = createTestEnvironment();

describe('Charges CRUD e2e', () => {
  let workspaceId: string;
  let testClient: Awaited<ReturnType<typeof createClient>>;

  beforeAll(async () => {
    // Create a test client
    testClient = await createClient();
    const { sdk } = testClient;

    // Create a workspace for testing
    const { createWorkspace } = await sdk.UtilCreateWorkspace({
      accessType: WorkspaceAccessType.SameDomain,
      name: 'Charges Test Workspace',
    });

    if (!createWorkspace) {
      throw new Error('Failed to create workspace');
    }

    workspaceId = createWorkspace.id;
  });

  it('should throw if no contact is set', async () => {
    const { sdk } = testClient;
    await expect(
      sdk.CreateCharge({
        input: {
          workspaceId,
          amountInCents: 10000,
          description: 'Test Charge',
          chargeType: ChargeType.Sale,
          contactId: '',
        },
      }),
    ).rejects.toThrow('Contact is required');
  });

  it('Should create a charge', async () => {
    const { sdk } = testClient;

    const { createBusinessContact: businessContact } =
      await sdk.CreateBusinessContact({
        input: {
          name: 'big company',
          workspaceId,
        },
      });

    if (!businessContact) {
      throw new Error('Failed to create business contact');
    }

    const { createCharge: createChargeResult } = await sdk.CreateCharge({
      input: {
        workspaceId,
        amountInCents: 10000,
        description: 'Test Charge',
        chargeType: ChargeType.Sale,
        contactId: businessContact.id,
      },
    });

    expect(createChargeResult).toEqual(
      expect.objectContaining({
        id: expect.any(String),
        chargeType: ChargeType.Sale,
        amountInCents: 10000,
        description: 'Test Charge',
        contactId: businessContact.id,
      }),
    );
  });
});
