import { createTestEnvironment } from './test-environment';
import { gql } from 'graphql-request';
import { ContactType, WorkspaceAccessType } from './generated/graphql';

// GraphQL operations for codegen (for reference, not used directly in tests)
gql`
  mutation CreateBusinessContact($input: BusinessContactInput!) {
    createBusinessContact(input: $input) {
      id
      name
      workspaceId
      contactType
      createdBy
      createdAt
      updatedAt
      notes
      profilePicture
      phone
      address
      taxId
      website
      accountsPayableContactId
    }
  }
`;

gql`
  mutation CreatePersonContact($input: PersonContactInput!) {
    createPersonContact(input: $input) {
      id
      name
      workspaceId
      contactType
      createdBy
      createdAt
      updatedAt
      notes
      profilePicture
      phone
      email
      businessId
      business {
        id
        name
      }
    }
  }
`;

gql`
  mutation UpdateBusinessContact(
    $id: ID!
    $input: UpdateBusinessContactInput!
  ) {
    updateBusinessContact(id: $id, input: $input) {
      id
      name
      notes
      phone
      address
      taxId
      website
      accountsPayableContactId
      updatedAt
    }
  }
`;

gql`
  mutation UpdatePersonContact($id: ID!, $input: UpdatePersonContactInput!) {
    updatePersonContact(id: $id, input: $input) {
      id
      name
      notes
      phone
      email
      businessId
      updatedAt
    }
  }
`;

gql`
  mutation DeleteContactById($id: ID!) {
    deleteContactById(id: $id)
  }
`;

gql`
  query GetContactById($id: ID!) {
    getContactById(id: $id) {
      ... on BusinessContact {
        id
        name
        contactType
      }
      ... on PersonContact {
        id
        name
        contactType
        businessId
      }
    }
  }
`;

gql`
  query GetBusinessContactWithEmployees($id: ID!) {
    getContactById(id: $id) {
      ... on BusinessContact {
        __typename
        id
        name
        contactType
        employees {
          items {
            id
            name
            email
            businessId
          }
          page {
            number
            size
            totalItems
            totalPages
          }
        }
      }
      ... on PersonContact {
        __typename
        id
        name
        contactType
      }
    }
  }
`;

gql`
  query ListContacts($filter: ListContactsFilter!) {
    listContacts(filter: $filter) {
      items {
        ... on BusinessContact {
          id
          name
          contactType
        }
        ... on PersonContact {
          id
          name
          contactType
          businessId
        }
      }
      page {
        number
        size
      }
    }
  }
`;

gql`
  query GetBusinessContactWithAssociatedPriceBooks($id: ID!) {
    getContactById(id: $id) {
      ... on BusinessContact {
        __typename
        id
        name
        associatedPriceBooks {
          items {
            id
            name
            businessContactId
            workspaceId
          }
          page {
            number
            size
          }
        }
      }
    }
  }
`;

const { createClient } = createTestEnvironment();

describe('Contacts CRUD e2e', () => {
  let workspaceId: string;
  let testClient: Awaited<ReturnType<typeof createClient>>;

  beforeAll(async () => {
    // Create a test client with a unique user
    testClient = await createClient();
    const { sdk } = testClient;

    // Create a workspace for testing contacts
    const { createWorkspace } = await sdk.UtilCreateWorkspace({
      accessType: WorkspaceAccessType.SameDomain,
      name: 'Contacts Test Workspace',
    });

    if (!createWorkspace) {
      throw new Error('Failed to create workspace');
    }

    workspaceId = createWorkspace.id;
  });

  it('creates, lists, gets, updates, and deletes a BusinessContact', async () => {
    const { sdk } = testClient;

    // Create
    const input = {
      workspaceId,
      name: 'E2E Business',
      notes: 'Business notes',
      phone: '123-456-7890',
      address: '123 Main St',
      taxId: 'TAX-123',
      website: 'https://business.com',
    };
    const { createBusinessContact } = await sdk.CreateBusinessContact({
      input,
    });
    expect(createBusinessContact).toBeDefined();
    expect(createBusinessContact?.name).toBe(input.name);
    expect(createBusinessContact?.workspaceId).toBe(workspaceId);
    expect(createBusinessContact?.contactType).toBe('BUSINESS');
    const businessId = createBusinessContact!.id;

    // List
    const { listContacts } = await sdk.ListContacts({
      filter: { workspaceId, contactType: ContactType.Business },
    });
    expect(listContacts?.items.some((c: any) => c.id === businessId)).toBe(
      true,
    );

    // Get by id
    const { getContactById } = await sdk.GetContactById({ id: businessId });
    expect(getContactById).toBeDefined();
    expect(getContactById?.id).toBe(businessId);

    // Update
    const updateInput = {
      name: 'Updated Business Name',
      notes: 'Updated notes',
      phone: '987-654-3210',
      address: '456 Elm St',
      taxId: 'TAX-456',
      website: 'https://updated.com',
    };
    const { updateBusinessContact } = await sdk.UpdateBusinessContact({
      id: businessId,
      input: updateInput,
    });
    expect(updateBusinessContact).toBeDefined();
    expect(updateBusinessContact?.name).toBe(updateInput.name);

    // Delete
    const { deleteContactById } = await sdk.DeleteContactById({
      id: businessId,
    });
    expect(deleteContactById).toBe(true);

    await expect(sdk.GetContactById({ id: businessId })).rejects.toThrow();
  });

  it('creates, lists, gets, updates, and deletes a PersonContact', async () => {
    const { sdk } = testClient;

    // First, create a business contact to link the person to
    const businessInput = {
      workspaceId,
      name: 'Person Business',
    };
    const { createBusinessContact } = await sdk.CreateBusinessContact({
      input: businessInput,
    });
    expect(createBusinessContact).toBeDefined();
    const businessId = createBusinessContact!.id;

    // Create person contact
    const input = {
      workspaceId,
      name: 'E2E Person',
      email: 'person@e2e.com',
      businessId,
      notes: 'Person notes',
      phone: '555-555-5555',
    };
    const { createPersonContact } = await sdk.CreatePersonContact({ input });
    expect(createPersonContact).toBeDefined();
    expect(createPersonContact?.name).toBe(input.name);
    expect(createPersonContact?.businessId).toBe(businessId);
    expect(createPersonContact?.contactType).toBe('PERSON');
    const personId = createPersonContact!.id;

    // List
    const { listContacts } = await sdk.ListContacts({
      filter: { workspaceId, contactType: ContactType.Person },
    });
    expect(listContacts?.items.some((c: any) => c.id === personId)).toBe(true);

    // Get by id
    const { getContactById } = await sdk.GetContactById({ id: personId });
    expect(getContactById).toBeDefined();
    expect(getContactById?.id).toBe(personId);

    // Update
    const updateInput = {
      name: 'Updated Person Name',
      notes: 'Updated person notes',
      phone: '111-222-3333',
      email: 'updated@e2e.com',
    };
    const { updatePersonContact } = await sdk.UpdatePersonContact({
      id: personId,
      input: updateInput,
    });
    expect(updatePersonContact).toBeDefined();
    expect(updatePersonContact?.name).toBe(updateInput.name);

    // Delete
    const { deleteContactById } = await sdk.DeleteContactById({ id: personId });
    expect(deleteContactById).toBe(true);
  });

  it('throws an error when updating a non-existent contact', async () => {
    const { sdk } = testClient;
    const updateInput = {
      name: 'Should Not Exist',
    };
    await expect(
      sdk.UpdateBusinessContact({ id: 'nonexistent-id', input: updateInput }),
    ).rejects.toThrow();
    await expect(
      sdk.UpdatePersonContact({ id: 'nonexistent-id', input: updateInput }),
    ).rejects.toThrow();
  });

  it('throws an error when deleting a non-existent contact', async () => {
    const { sdk } = testClient;
    await expect(
      sdk.DeleteContactById({ id: 'nonexistent-id' }),
    ).rejects.toThrow();
  });

  it('throws an error when creating a business contact with missing required fields', async () => {
    const { sdk } = testClient;
    // Missing name and workspaceId
    const badInput = {
      notes: 'Missing required fields',
    };
    await expect(
      sdk.CreateBusinessContact({ input: badInput as any }),
    ).rejects.toThrow();
  });

  it('throws an error when creating a person contact with missing required fields', async () => {
    const { sdk } = testClient;
    // Missing name, workspaceId, email, businessId
    const badInput = {
      notes: 'Missing required fields',
    };
    await expect(
      sdk.CreatePersonContact({ input: badInput as any }),
    ).rejects.toThrow();
  });

  describe('BusinessContact employees field', () => {
    it('should return employees for a business contact', async () => {
      const { sdk } = testClient;

      // Create a business contact
      const businessInput = {
        workspaceId,
        name: 'Business with Employees',
        phone: '555-0100',
        address: '123 Business St',
      };

      const { createBusinessContact } = await sdk.CreateBusinessContact({
        input: businessInput,
      });

      expect(createBusinessContact).toBeDefined();
      const businessId = createBusinessContact!.id;

      // Create person contacts linked to the business
      const person1Input = {
        workspaceId,
        name: 'Employee One',
        email: 'employee1@business.com',
        businessId,
      };

      const { createPersonContact: person1 } = await sdk.CreatePersonContact({
        input: person1Input,
      });

      expect(person1).toBeDefined();
      const person1Id = person1!.id;

      const person2Input = {
        workspaceId,
        name: 'Employee Two',
        email: 'employee2@business.com',
        businessId,
      };

      const { createPersonContact: person2 } = await sdk.CreatePersonContact({
        input: person2Input,
      });

      expect(person2).toBeDefined();
      const person2Id = person2!.id;

      // Query the business contact with employees field
      const { getContactById } = await sdk.GetBusinessContactWithEmployees({
        id: businessId,
      });

      expect(getContactById).toBeDefined();

      // Type guard to ensure we have a BusinessContact
      if (!getContactById || getContactById.__typename !== 'BusinessContact') {
        throw new Error('Expected BusinessContact');
      }

      expect(getContactById.id).toBe(businessId);
      expect(getContactById.name).toBe(businessInput.name);

      // Check that employees field returns the person contacts
      expect(getContactById.employees).toBeDefined();
      expect(getContactById.employees?.items).toHaveLength(2);

      // Check that both employees are returned (order may vary)
      const employeeIds = getContactById.employees?.items.map((e: any) => e.id);
      expect(employeeIds).toContain(person1Id);
      expect(employeeIds).toContain(person2Id);

      // Check pagination info
      expect(getContactById.employees?.page).toBeDefined();
      expect(getContactById.employees?.page.totalItems).toBe(2);
    });

    it('should return empty employees list when business has no employees', async () => {
      const { sdk } = testClient;

      // Create a business contact without any employees
      const businessInput = {
        workspaceId,
        name: 'Business Without Employees',
        phone: '555-0200',
      };

      const { createBusinessContact } = await sdk.CreateBusinessContact({
        input: businessInput,
      });

      expect(createBusinessContact).toBeDefined();
      const businessId = createBusinessContact!.id;

      // Query the business contact with employees field
      const { getContactById } = await sdk.GetBusinessContactWithEmployees({
        id: businessId,
      });

      expect(getContactById).toBeDefined();

      // Type guard to ensure we have a BusinessContact
      if (!getContactById || getContactById.__typename !== 'BusinessContact') {
        throw new Error('Expected BusinessContact');
      }

      expect(getContactById.employees).toBeDefined();
      expect(getContactById.employees?.items).toHaveLength(0);
      expect(getContactById.employees?.page.totalItems).toBe(0);
    });
  });

  describe('BusinessContact associatedPriceBooks field', () => {
    it('returns empty associatedPriceBooks for a business contact with no price books', async () => {
      const { sdk } = testClient;

      // Create business contact
      const businessInput = {
        workspaceId,
        name: 'Business Without Price Books',
        phone: '555-0300',
      };
      const { createBusinessContact } = await sdk.CreateBusinessContact({
        input: businessInput,
      });
      if (!createBusinessContact) {
        throw new Error('Business contact was not created');
      }

      // Query business contact with associatedPriceBooks
      const { getContactById } =
        await sdk.GetBusinessContactWithAssociatedPriceBooks({
          id: createBusinessContact.id,
        });

      expect(getContactById).toBeDefined();

      // Type guard to ensure we have a BusinessContact
      if (!getContactById || getContactById.__typename !== 'BusinessContact') {
        throw new Error('Expected BusinessContact');
      }

      expect(getContactById.associatedPriceBooks).toBeDefined();
      expect(getContactById.associatedPriceBooks?.items).toEqual([]);
      expect(getContactById.associatedPriceBooks?.page).toBeDefined();
    });

    it('returns all associated price books for a business contact', async () => {
      const { sdk } = testClient;

      // Create business contact
      const businessInput = {
        workspaceId,
        name: 'Business With Price Books',
        phone: '555-0400',
      };
      const { createBusinessContact } = await sdk.CreateBusinessContact({
        input: businessInput,
      });
      if (!createBusinessContact) {
        throw new Error('Business contact was not created');
      }
      const businessContactId = createBusinessContact.id;

      // Create multiple price books associated with the business contact
      const priceBook1Input = {
        workspaceId,
        name: 'Price Book 1 for Business',
        notes: 'First price book',
        businessContactId,
      };
      const { createPriceBook: pb1 } = await sdk.CreatePriceBook({
        input: priceBook1Input,
      });
      expect(pb1).toBeDefined();

      const priceBook2Input = {
        workspaceId,
        name: 'Price Book 2 for Business',
        notes: 'Second price book',
        businessContactId,
      };
      const { createPriceBook: pb2 } = await sdk.CreatePriceBook({
        input: priceBook2Input,
      });
      expect(pb2).toBeDefined();

      const priceBook3Input = {
        workspaceId,
        name: 'Price Book 3 for Business',
        notes: 'Third price book',
        businessContactId,
      };
      const { createPriceBook: pb3 } = await sdk.CreatePriceBook({
        input: priceBook3Input,
      });
      expect(pb3).toBeDefined();

      // Query business contact with associatedPriceBooks
      const { getContactById } =
        await sdk.GetBusinessContactWithAssociatedPriceBooks({
          id: businessContactId,
        });

      expect(getContactById).toBeDefined();

      // Type guard to ensure we have a BusinessContact
      if (!getContactById || getContactById.__typename !== 'BusinessContact') {
        throw new Error('Expected BusinessContact');
      }

      expect(getContactById.associatedPriceBooks).toBeDefined();
      expect(getContactById.associatedPriceBooks?.items).toHaveLength(3);

      const priceBookIds = getContactById.associatedPriceBooks?.items.map(
        (pb) => pb?.id,
      );
      expect(priceBookIds).toContain(pb1?.id);
      expect(priceBookIds).toContain(pb2?.id);
      expect(priceBookIds).toContain(pb3?.id);

      // Verify each price book has the correct businessContactId
      getContactById.associatedPriceBooks?.items.forEach((pb) => {
        expect(pb?.businessContactId).toBe(businessContactId);
        expect(pb?.workspaceId).toBe(workspaceId);
      });
    });

    it('does not return price books from other business contacts', async () => {
      const { sdk } = testClient;

      // Create two business contacts
      const business1Input = {
        workspaceId,
        name: 'Business 1',
        phone: '555-0500',
      };
      const { createBusinessContact: business1 } =
        await sdk.CreateBusinessContact({
          input: business1Input,
        });
      if (!business1) throw new Error('Business 1 was not created');

      const business2Input = {
        workspaceId,
        name: 'Business 2',
        phone: '555-0600',
      };
      const { createBusinessContact: business2 } =
        await sdk.CreateBusinessContact({
          input: business2Input,
        });
      if (!business2) throw new Error('Business 2 was not created');

      // Create price book for business 1
      const pb1Input = {
        workspaceId,
        name: 'Price Book for Business 1',
        notes: 'Belongs to business 1',
        businessContactId: business1.id,
      };
      const { createPriceBook: pb1 } = await sdk.CreatePriceBook({
        input: pb1Input,
      });
      expect(pb1).toBeDefined();

      // Create price book for business 2
      const pb2Input = {
        workspaceId,
        name: 'Price Book for Business 2',
        notes: 'Belongs to business 2',
        businessContactId: business2.id,
      };
      const { createPriceBook: pb2 } = await sdk.CreatePriceBook({
        input: pb2Input,
      });
      expect(pb2).toBeDefined();

      // Query business 1 - should only see its own price book
      const { getContactById: business1Result } =
        await sdk.GetBusinessContactWithAssociatedPriceBooks({
          id: business1.id,
        });

      // Type guard to ensure we have a BusinessContact
      if (
        !business1Result ||
        business1Result.__typename !== 'BusinessContact'
      ) {
        throw new Error('Expected BusinessContact');
      }

      expect(business1Result.associatedPriceBooks?.items).toHaveLength(1);
      expect(business1Result.associatedPriceBooks?.items[0]?.id).toBe(pb1?.id);
      expect(
        business1Result.associatedPriceBooks?.items[0]?.businessContactId,
      ).toBe(business1.id);

      // Query business 2 - should only see its own price book
      const { getContactById: business2Result } =
        await sdk.GetBusinessContactWithAssociatedPriceBooks({
          id: business2.id,
        });

      // Type guard to ensure we have a BusinessContact
      if (
        !business2Result ||
        business2Result.__typename !== 'BusinessContact'
      ) {
        throw new Error('Expected BusinessContact');
      }

      expect(business2Result.associatedPriceBooks?.items).toHaveLength(1);
      expect(business2Result.associatedPriceBooks?.items[0]?.id).toBe(pb2?.id);
      expect(
        business2Result.associatedPriceBooks?.items[0]?.businessContactId,
      ).toBe(business2.id);
    });

    it('respects authorization when querying associatedPriceBooks', async () => {
      // User A creates a business contact with price books
      const { sdk: sdkA } = await createClient({
        companyId: 'company-authz-contacts',
        userId: 'user-a-contacts-authz',
        userName: 'Alice Contacts Authz',
      });

      const { createWorkspace: workspaceA } = await sdkA.UtilCreateWorkspace({
        accessType: WorkspaceAccessType.SameDomain,
        name: 'User A Contacts Authz Workspace',
      });
      if (!workspaceA) throw new Error('Workspace A was not created');
      const workspaceIdA = workspaceA.id;

      // Create business contact
      const businessInput = {
        workspaceId: workspaceIdA,
        name: 'Authz Test Business Contact',
        phone: '555-0700',
      };
      const { createBusinessContact } = await sdkA.CreateBusinessContact({
        input: businessInput,
      });
      if (!createBusinessContact) {
        throw new Error('Business contact was not created');
      }

      // Create price book for the business contact
      const priceBookInput = {
        workspaceId: workspaceIdA,
        name: 'Authz Price Book',
        notes: 'Should not be visible to unauthorized users',
        businessContactId: createBusinessContact.id,
      };
      const { createPriceBook } = await sdkA.CreatePriceBook({
        input: priceBookInput,
      });
      expect(createPriceBook).toBeDefined();

      // User A can see the price books
      const { getContactById: userAResult } =
        await sdkA.GetBusinessContactWithAssociatedPriceBooks({
          id: createBusinessContact.id,
        });

      // Type guard to ensure we have a BusinessContact
      if (!userAResult || userAResult.__typename !== 'BusinessContact') {
        throw new Error('Expected BusinessContact');
      }

      expect(userAResult.associatedPriceBooks?.items).toHaveLength(1);
      expect(userAResult.associatedPriceBooks?.items[0]?.id).toBe(
        createPriceBook?.id,
      );

      // User B (no access to workspace A) tries to query
      const { sdk: sdkB } = await createClient({
        companyId: 'company-authz-contacts',
        userId: 'user-b-contacts-authz',
        userName: 'Bob Contacts Authz',
      });

      // User B creates their own workspace
      const { createWorkspace: workspaceB } = await sdkB.UtilCreateWorkspace({
        accessType: WorkspaceAccessType.SameDomain,
        name: 'User B Contacts Authz Workspace',
      });
      if (!workspaceB) throw new Error('Workspace B was not created');

      // User B tries to query User A's business contact - should throw an error (no access)
      await expect(
        sdkB.GetBusinessContactWithAssociatedPriceBooks({
          id: createBusinessContact.id,
        }),
      ).rejects.toThrow();
    });
  });
});
