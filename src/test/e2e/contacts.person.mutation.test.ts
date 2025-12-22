import { createTestEnvironment } from './test-environment';
import { gql } from 'graphql-request';
import { WorkspaceAccessType } from './generated/graphql';

gql`
  mutation CreatePersonContact_PersonMutation($input: PersonContactInput!) {
    createPersonContact(input: $input) {
      id
      name
      email
      phone
      businessId
      resourceMapIds
      workspaceId
    }
  }
  mutation UpdatePersonName_PersonMutation($id: ID!, $name: String!) {
    updatePersonName(id: $id, name: $name) {
      id
      name
    }
  }
  mutation UpdatePersonPhone_PersonMutation($id: ID!, $phone: String!) {
    updatePersonPhone(id: $id, phone: $phone) {
      id
      phone
    }
  }
  mutation UpdatePersonEmail_PersonMutation($id: ID!, $email: String!) {
    updatePersonEmail(id: $id, email: $email) {
      id
      email
    }
  }
  mutation UpdatePersonBusiness_PersonMutation($id: ID!, $businessId: ID!) {
    updatePersonBusiness(id: $id, businessId: $businessId) {
      id
      businessId
    }
  }
  mutation UpdatePersonResourceMap_PersonMutation(
    $id: ID!
    $resourceMapIds: [ID!]!
  ) {
    updatePersonResourceMap(id: $id, resourceMapIds: $resourceMapIds) {
      id
      resourceMapIds
    }
  }
  query GetContactById_PersonMutation($id: ID!) {
    getContactById(id: $id) {
      ... on PersonContact {
        __typename
        id
        name
        email
        phone
        businessId
        resourceMapIds
      }
    }
  }
`;

const { createClient } = createTestEnvironment();

describe('PersonContact field patch mutations e2e', () => {
  let workspaceId: string;
  let testClient: Awaited<ReturnType<typeof createClient>>;

  beforeAll(async () => {
    // Create a test client with a unique user
    testClient = await createClient();
    const { sdk } = testClient;

    // Create a workspace for testing contacts
    const { createWorkspace } = await sdk.UtilCreateWorkspace({
      accessType: WorkspaceAccessType.SameDomain,
      name: 'Person Mutation Test Workspace',
    });

    if (!createWorkspace) {
      throw new Error('Failed to create workspace');
    }

    workspaceId = createWorkspace.id;
  });

  it('updates individual fields on a PersonContact', async () => {
    const { sdk } = testClient;

    // Create a business contact to link the person to
    const businessInput = {
      workspaceId,
      name: 'Person Business',
    };
    const { createBusinessContact } =
      await sdk.CreateBusinessContact_BusinessMutation({
        input: businessInput,
      });
    expect(createBusinessContact).toBeDefined();
    if (!createBusinessContact) {
      throw new Error('createBusinessContact is null or undefined');
    }
    const businessId = createBusinessContact.id;

    // Create a person contact
    const input = {
      workspaceId,
      name: 'Patch Person',
      email: 'patch@person.com',
      phone: '333-333-3333',
      businessId,
      resourceMapIds: [],
    };
    const { createPersonContact } =
      await sdk.CreatePersonContact_PersonMutation({ input });
    expect(createPersonContact).toBeDefined();
    if (!createPersonContact) {
      throw new Error('createPersonContact is null or undefined');
    }
    const personId = createPersonContact.id;

    // updatePersonName
    const { updatePersonName } = await sdk.UpdatePersonName_PersonMutation({
      id: personId,
      name: 'Updated Person',
    });
    expect(updatePersonName).toBeDefined();
    if (!updatePersonName) {
      throw new Error('updatePersonName is null or undefined');
    }
    expect(updatePersonName.name).toBe('Updated Person');

    // updatePersonPhone
    const { updatePersonPhone } = await sdk.UpdatePersonPhone_PersonMutation({
      id: personId,
      phone: '444-444-4444',
    });
    expect(updatePersonPhone).toBeDefined();
    if (!updatePersonPhone) {
      throw new Error('updatePersonPhone is null or undefined');
    }
    expect(updatePersonPhone.phone).toBe('444-444-4444');

    // updatePersonEmail
    const { updatePersonEmail } = await sdk.UpdatePersonEmail_PersonMutation({
      id: personId,
      email: 'updated@person.com',
    });
    expect(updatePersonEmail).toBeDefined();
    if (!updatePersonEmail) {
      throw new Error('updatePersonEmail is null or undefined');
    }
    expect(updatePersonEmail.email).toBe('updated@person.com');

    // updatePersonBusiness
    const { updatePersonBusiness } =
      await sdk.UpdatePersonBusiness_PersonMutation({
        id: personId,
        businessId,
      });
    expect(updatePersonBusiness).toBeDefined();
    if (!updatePersonBusiness) {
      throw new Error('updatePersonBusiness is null or undefined');
    }
    expect(updatePersonBusiness.businessId).toBe(businessId);

    // updatePersonResourceMap
    const { updatePersonResourceMap } =
      await sdk.UpdatePersonResourceMap_PersonMutation({
        id: personId,
        resourceMapIds: ['res-1', 'res-2'],
      });
    expect(updatePersonResourceMap).toBeDefined();
    if (!updatePersonResourceMap) {
      throw new Error('updatePersonResourceMap is null or undefined');
    }
    expect(updatePersonResourceMap.resourceMapIds).toEqual(['res-1', 'res-2']);

    // Verify all fields via getContactById
    const { getContactById } = await sdk.GetContactById_PersonMutation({
      id: personId,
    });
    expect(getContactById).toBeDefined();
    // Debug: log the actual value returned

    if (getContactById && getContactById.__typename === 'PersonContact') {
      expect(getContactById.name).toBe('Updated Person');
      expect(getContactById.phone).toBe('444-444-4444');
      expect(getContactById.email).toBe('updated@person.com');
      expect(getContactById.businessId).toBe(businessId);
      expect(getContactById.resourceMapIds).toEqual(['res-1', 'res-2']);
    } else {
      throw new Error('Expected PersonContact');
    }
  });
});
