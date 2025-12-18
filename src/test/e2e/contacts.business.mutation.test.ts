import { createTestEnvironment } from './test-environment';
import { gql } from 'graphql-request';
import { WorkspaceAccessType } from './generated/graphql';

gql`
  mutation CreateBusinessContact_BusinessMutation(
    $input: BusinessContactInput!
  ) {
    createBusinessContact(input: $input) {
      id
      name
      phone
      address
      taxId
      website
      workspaceId
      contactType
    }
  }
  mutation UpdateBusinessName_BusinessMutation($id: ID!, $name: String!) {
    updateBusinessName(id: $id, name: $name) {
      id
      name
    }
  }
  mutation UpdateBusinessPhone_BusinessMutation($id: ID!, $phone: String!) {
    updateBusinessPhone(id: $id, phone: $phone) {
      id
      phone
    }
  }
  mutation UpdateBusinessAddress_BusinessMutation($id: ID!, $address: String!) {
    updateBusinessAddress(id: $id, address: $address) {
      id
      address
    }
  }
  mutation UpdateBusinessTaxId_BusinessMutation($id: ID!, $taxId: String!) {
    updateBusinessTaxId(id: $id, taxId: $taxId) {
      id
      taxId
    }
  }
  mutation UpdateBusinessWebsite_BusinessMutation($id: ID!, $website: String!) {
    updateBusinessWebsite(id: $id, website: $website) {
      id
      website
    }
  }
  query GetContactById_BusinessMutation($id: ID!) {
    getContactById(id: $id) {
      ... on BusinessContact {
        __typename
        id
        name
        phone
        address
        taxId
        website
      }
    }
  }
`;

const { createClient } = createTestEnvironment();

describe('BusinessContact field patch mutations e2e', () => {
  let workspaceId: string;
  let testClient: Awaited<ReturnType<typeof createClient>>;

  beforeAll(async () => {
    // Create a test client with a unique user
    testClient = await createClient();
    const { sdk } = testClient;

    // Create a workspace for testing contacts
    const { createWorkspace } = await sdk.UtilCreateWorkspace({
      accessType: WorkspaceAccessType.SameDomain,
      name: 'Business Mutation Test Workspace',
    });

    if (!createWorkspace) {
      throw new Error('Failed to create workspace');
    }

    workspaceId = createWorkspace.id;
  });

  it('updates individual fields on a BusinessContact', async () => {
    const { sdk } = testClient;

    // Create a business contact
    const input = {
      workspaceId,
      name: 'Patch Business',
      phone: '111-111-1111',
      address: '1 Patch St',
      taxId: 'PATCH-1',
      website: 'https://patch.biz',
    };
    const { createBusinessContact } =
      await sdk.CreateBusinessContact_BusinessMutation({ input });
    expect(createBusinessContact).toBeDefined();
    if (!createBusinessContact) {
      throw new Error('createBusinessContact is null or undefined');
    }
    const businessId = createBusinessContact.id;

    // updateBusinessName
    const { updateBusinessName } =
      await sdk.UpdateBusinessName_BusinessMutation({
        id: businessId,
        name: 'Updated Name',
      });
    expect(updateBusinessName).toBeDefined();
    if (!updateBusinessName) {
      throw new Error('updateBusinessName is null or undefined');
    }
    expect(updateBusinessName.name).toBe('Updated Name');

    // updateBusinessPhone
    const { updateBusinessPhone } =
      await sdk.UpdateBusinessPhone_BusinessMutation({
        id: businessId,
        phone: '222-222-2222',
      });
    expect(updateBusinessPhone).toBeDefined();
    if (!updateBusinessPhone) {
      throw new Error('updateBusinessPhone is null or undefined');
    }
    expect(updateBusinessPhone.phone).toBe('222-222-2222');

    // updateBusinessAddress
    const { updateBusinessAddress } =
      await sdk.UpdateBusinessAddress_BusinessMutation({
        id: businessId,
        address: '2 Patch Ave',
      });
    expect(updateBusinessAddress).toBeDefined();
    if (!updateBusinessAddress) {
      throw new Error('updateBusinessAddress is null or undefined');
    }
    expect(updateBusinessAddress.address).toBe('2 Patch Ave');

    // updateBusinessTaxId
    const { updateBusinessTaxId } =
      await sdk.UpdateBusinessTaxId_BusinessMutation({
        id: businessId,
        taxId: 'PATCH-2',
      });
    expect(updateBusinessTaxId).toBeDefined();
    if (!updateBusinessTaxId) {
      throw new Error('updateBusinessTaxId is null or undefined');
    }
    expect(updateBusinessTaxId.taxId).toBe('PATCH-2');

    // updateBusinessWebsite
    const { updateBusinessWebsite } =
      await sdk.UpdateBusinessWebsite_BusinessMutation({
        id: businessId,
        website: 'https://updated.biz',
      });
    expect(updateBusinessWebsite).toBeDefined();
    if (!updateBusinessWebsite) {
      throw new Error('updateBusinessWebsite is null or undefined');
    }
    expect(updateBusinessWebsite.website).toBe('https://updated.biz');

    // Verify all fields via getContactById
    const { getContactById } = await sdk.GetContactById_BusinessMutation({
      id: businessId,
    });
    expect(getContactById).toBeDefined();
    // Type guard for BusinessContact
    if (getContactById && getContactById.__typename === 'BusinessContact') {
      expect(getContactById.name).toBe('Updated Name');
      expect(getContactById.phone).toBe('222-222-2222');
      expect(getContactById.address).toBe('2 Patch Ave');
      expect(getContactById.taxId).toBe('PATCH-2');
      expect(getContactById.website).toBe('https://updated.biz');
    } else {
      throw new Error('Expected BusinessContact');
    }
  });
});
