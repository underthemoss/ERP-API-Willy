import { createTestEnvironment } from './test-environment';
import { gql } from 'graphql-request';
import {
  WorkspaceAccessType,
  SearchableCollectionType,
} from './generated/graphql';

// GraphQL operations for codegen
gql`
  query SearchDocuments(
    $workspaceId: String!
    $searchText: String
    $collections: [SearchableCollectionType!]
    $page: Int
    $pageSize: Int
  ) {
    searchDocuments(
      workspaceId: $workspaceId
      searchText: $searchText
      collections: $collections
      page: $page
      pageSize: $pageSize
    ) {
      documents {
        id
        documentId
        collection
        workspaceId
        title
        subtitle
        documentType
        metadata
        createdAt
        updatedAt
      }
      total
      page {
        number
        size
        totalItems
        totalPages
      }
    }
  }

  query GetSearchDocumentById($id: String!) {
    getSearchDocumentById(id: $id) {
      id
      documentId
      collection
      workspaceId
      title
      subtitle
      documentType
      metadata
      createdAt
      updatedAt
    }
  }

  query GetBulkSearchDocumentsById($ids: [String!]!) {
    getBulkSearchDocumentsById(ids: $ids) {
      id
      documentId
      collection
      workspaceId
      title
      subtitle
      documentType
      metadata
      createdAt
      updatedAt
    }
  }

  query GetSearchUserState($workspaceId: String!) {
    getSearchUserState(workspaceId: $workspaceId) {
      id
      userId
      workspaceId
      favorites {
        searchDocumentId
        addedAt
      }
      recents {
        searchDocumentId
        accessedAt
      }
      createdAt
      updatedAt
    }
  }

  mutation ToggleSearchFavorite(
    $workspaceId: String!
    $searchDocumentId: String!
  ) {
    toggleSearchFavorite(
      workspaceId: $workspaceId
      searchDocumentId: $searchDocumentId
    ) {
      id
      userId
      workspaceId
      favorites {
        searchDocumentId
        addedAt
      }
      recents {
        searchDocumentId
        accessedAt
      }
      updatedAt
    }
  }

  mutation AddSearchRecent($workspaceId: String!, $searchDocumentId: String!) {
    addSearchRecent(
      workspaceId: $workspaceId
      searchDocumentId: $searchDocumentId
    ) {
      id
      userId
      workspaceId
      favorites {
        searchDocumentId
        addedAt
      }
      recents {
        searchDocumentId
        accessedAt
      }
      updatedAt
    }
  }

  mutation RemoveSearchRecent(
    $workspaceId: String!
    $searchDocumentId: String!
  ) {
    removeSearchRecent(
      workspaceId: $workspaceId
      searchDocumentId: $searchDocumentId
    ) {
      id
      userId
      workspaceId
      favorites {
        searchDocumentId
        addedAt
      }
      recents {
        searchDocumentId
        accessedAt
      }
      updatedAt
    }
  }

  mutation ClearSearchRecents($workspaceId: String!) {
    clearSearchRecents(workspaceId: $workspaceId) {
      id
      userId
      workspaceId
      favorites {
        searchDocumentId
        addedAt
      }
      recents {
        searchDocumentId
        accessedAt
      }
      updatedAt
    }
  }
`;

const { createClient } = createTestEnvironment();

/**
 * Helper function to wait for entities to be indexed in search
 * Polls the search API until expected number of results are found or timeout
 */
async function waitForSearchIndexing(
  sdk: Awaited<ReturnType<typeof createClient>>['sdk'],
  workspaceId: string,
  searchText: string,
  expectedCount: number,
  timeoutMs: number = 10000,
): Promise<void> {
  const startTime = Date.now();
  const pollInterval = 500; // Check every 500ms

  while (Date.now() - startTime < timeoutMs) {
    try {
      const result = await sdk.SearchDocuments({
        workspaceId,
        searchText,
      });

      if (result.searchDocuments.total >= expectedCount) {
        return; // Success!
      }
    } catch (error) {
      // Ignore errors during polling
    }

    await new Promise((resolve) => setTimeout(resolve, pollInterval));
  }

  throw new Error(
    `Timeout waiting for ${expectedCount} search results for "${searchText}"`,
  );
}

describe.skip('Search Service e2e', () => {
  let workspaceId: string;
  let testClient: Awaited<ReturnType<typeof createClient>>;

  beforeAll(async () => {
    testClient = await createClient();
    const { sdk } = testClient;

    // Create a workspace for testing search
    const { createWorkspace } = await sdk.UtilCreateWorkspace({
      accessType: WorkspaceAccessType.SameDomain,
      name: 'Search Test Workspace',
    });

    if (!createWorkspace) {
      throw new Error('Failed to create workspace');
    }

    workspaceId = createWorkspace.id;
  });

  describe('Basic Search Functionality', () => {
    it('should search for contacts by name', async () => {
      const { sdk } = testClient;

      // Create a business contact with simple searchable name
      const contactName = `Dave Smith ${Date.now()}`;
      const { createBusinessContact } = await sdk.CreateBusinessContact({
        input: {
          workspaceId,
          name: contactName,
          notes: 'Test business for search',
        },
      });

      expect(createBusinessContact).toBeDefined();

      // Wait for the contact to be indexed via CDC
      await waitForSearchIndexing(sdk, workspaceId, 'Dave', 1, 10000);

      // Search for the contact by first name
      const { searchDocuments } = await sdk.SearchDocuments({
        workspaceId,
        searchText: 'Dave',
      });

      expect(searchDocuments.total).toBeGreaterThanOrEqual(1);
      expect(searchDocuments.documents).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            collection: 'contacts',
            title: contactName,
          }),
        ]),
      );
    });

    it('should search for projects by name', async () => {
      const { sdk } = testClient;

      const projectName = `Test Project ${Date.now()}`;
      const { createProject } = await sdk.CreateProject({
        input: {
          workspaceId,
          name: projectName,
          project_code: `TEST-${Date.now()}`,
          description: 'A test project for search',
          deleted: false,
        },
      });

      expect(createProject).toBeDefined();

      // Wait for the project to be indexed
      await waitForSearchIndexing(sdk, workspaceId, 'Test Project', 1, 10000);

      // Search for the project
      const { searchDocuments } = await sdk.SearchDocuments({
        workspaceId,
        searchText: 'Test Project',
      });

      expect(searchDocuments.total).toBeGreaterThanOrEqual(1);
      expect(searchDocuments.documents).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            collection: 'projects',
            title: projectName,
          }),
        ]),
      );
    });

    it('should search for notes by content', async () => {
      const { sdk } = testClient;

      // Create a project to attach the note to
      const { createProject } = await sdk.CreateProject({
        input: {
          workspaceId,
          name: `Project for Note ${Date.now()}`,
          project_code: `NOTE-${Date.now()}`,
          deleted: false,
        },
      });

      expect(createProject).toBeDefined();

      const uniqueText = `SearchableNoteContent${Date.now()}`;
      const noteValue = {
        plainText: `This note contains ${uniqueText} for testing`,
      };

      await sdk.CreateNote({
        input: {
          workspace_id: workspaceId,
          parent_entity_id: createProject!.id,
          value: noteValue,
        },
      });

      // Wait for the note to be indexed
      await waitForSearchIndexing(sdk, workspaceId, uniqueText, 1, 10000);

      // Search for the note by its content
      const { searchDocuments } = await sdk.SearchDocuments({
        workspaceId,
        searchText: uniqueText,
      });

      expect(searchDocuments.total).toBeGreaterThanOrEqual(1);
      expect(searchDocuments.documents).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            collection: 'notes',
            documentType: 'Note',
          }),
        ]),
      );

      // Verify the note's searchable content is included
      const noteDoc = searchDocuments.documents.find(
        (doc) => doc.collection === 'notes',
      );
      expect(noteDoc).toBeDefined();
      // Note: The title field contains the parent entity reference, not the note content
      // The actual note content should be searchable but may be in metadata or indexed separately
      expect(noteDoc?.title).toBeDefined();
    });

    it('should return empty results for non-existent search term', async () => {
      const { sdk } = testClient;

      const { searchDocuments } = await sdk.SearchDocuments({
        workspaceId,
        searchText: `NonExistentTerm${Date.now()}`,
      });

      expect(searchDocuments.total).toBe(0);
      expect(searchDocuments.documents).toHaveLength(0);
    });
  });

  describe('Collection Filtering', () => {
    it('should filter search results by collection type', async () => {
      const { sdk } = testClient;

      // Create a contact and project with similar names
      const timestamp = Date.now();
      const contactName = `Searchable Entity ${timestamp}`;
      const projectName = `Searchable Entity Project ${timestamp}`;

      await sdk.CreateBusinessContact({
        input: {
          workspaceId,
          name: contactName,
        },
      });

      await sdk.CreateProject({
        input: {
          workspaceId,
          name: projectName,
          project_code: `SE-${timestamp}`,
          deleted: false,
        },
      });

      // Wait for both to be indexed
      await waitForSearchIndexing(
        sdk,
        workspaceId,
        'Searchable Entity',
        2,
        10000,
      );

      // Search with contacts filter
      const contactsOnly = await sdk.SearchDocuments({
        workspaceId,
        searchText: 'Searchable Entity',
        collections: [SearchableCollectionType.Contacts],
      });

      expect(contactsOnly.searchDocuments.documents).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            collection: 'contacts',
          }),
        ]),
      );

      // Verify no projects in contacts-only search
      const projectsInContactSearch =
        contactsOnly.searchDocuments.documents.filter(
          (doc) => doc.collection === 'projects',
        );
      expect(projectsInContactSearch).toHaveLength(0);

      // Search with projects filter
      const projectsOnly = await sdk.SearchDocuments({
        workspaceId,
        searchText: 'Searchable Entity',
        collections: [SearchableCollectionType.Projects],
      });

      expect(projectsOnly.searchDocuments.documents).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            collection: 'projects',
          }),
        ]),
      );

      // Verify no contacts in projects-only search
      const contactsInProjectSearch =
        projectsOnly.searchDocuments.documents.filter(
          (doc) => doc.collection === 'contacts',
        );
      expect(contactsInProjectSearch).toHaveLength(0);
    });
  });

  describe('Pagination', () => {
    it('should paginate search results correctly', async () => {
      const { sdk } = testClient;

      const baseName = `Pagination Test ${Date.now()}`;

      // Create multiple contacts
      for (let i = 1; i <= 5; i++) {
        await sdk.CreateBusinessContact({
          input: {
            workspaceId,
            name: `${baseName} Contact ${i}`,
          },
        });
      }

      // Wait for all to be indexed
      await waitForSearchIndexing(sdk, workspaceId, baseName, 5, 15000);

      // Get first page (2 items)
      const page1 = await sdk.SearchDocuments({
        workspaceId,
        searchText: baseName,
        page: 1,
        pageSize: 2,
      });

      expect(page1.searchDocuments.documents).toHaveLength(2);
      expect(page1.searchDocuments.page?.number).toBe(1);
      expect(page1.searchDocuments.page?.size).toBe(2);
      expect(page1.searchDocuments.page?.totalItems).toBeGreaterThanOrEqual(5);
      expect(page1.searchDocuments.page?.totalPages).toBeGreaterThanOrEqual(3);

      // Get second page
      const page2 = await sdk.SearchDocuments({
        workspaceId,
        searchText: baseName,
        page: 2,
        pageSize: 2,
      });

      expect(page2.searchDocuments.documents).toHaveLength(2);
      expect(page2.searchDocuments.page?.number).toBe(2);

      // Verify different documents on different pages
      const page1Ids = page1.searchDocuments.documents.map((d) => d.id);
      const page2Ids = page2.searchDocuments.documents.map((d) => d.id);
      const overlap = page1Ids.filter((id) => page2Ids.includes(id));
      expect(overlap).toHaveLength(0);
    });
  });

  describe('Update and Delete Operations', () => {
    it('should reflect updates in search results', async () => {
      const { sdk } = testClient;

      const originalName = `Original Name ${Date.now()}`;
      const { createBusinessContact } = await sdk.CreateBusinessContact({
        input: {
          workspaceId,
          name: originalName,
        },
      });

      expect(createBusinessContact).toBeDefined();
      const contactId = createBusinessContact!.id;

      // Wait for initial index
      await waitForSearchIndexing(sdk, workspaceId, 'Original Name', 1, 10000);

      // Update the contact
      const updatedName = `Updated Name ${Date.now()}`;
      await sdk.UpdateBusinessContact({
        id: contactId,
        input: {
          name: updatedName,
        },
      });

      // Wait for update to be indexed (updates can take longer)
      await waitForSearchIndexing(sdk, workspaceId, 'Updated Name', 1, 15000);

      // Wait a bit more to ensure old index is removed
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Search with new name should find it
      const updatedSearch = await sdk.SearchDocuments({
        workspaceId,
        searchText: 'Updated Name',
      });

      expect(updatedSearch.searchDocuments.documents).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            documentId: contactId,
            title: updatedName,
          }),
        ]),
      );
    });

    it('should remove deleted documents from search', async () => {
      const { sdk } = testClient;

      const contactName = `To Be Deleted ${Date.now()}`;
      const { createBusinessContact } = await sdk.CreateBusinessContact({
        input: {
          workspaceId,
          name: contactName,
        },
      });

      expect(createBusinessContact).toBeDefined();
      const contactId = createBusinessContact!.id;

      // Wait for index
      await waitForSearchIndexing(sdk, workspaceId, 'To Be Deleted', 1, 10000);

      // Verify it's searchable
      const beforeDelete = await sdk.SearchDocuments({
        workspaceId,
        searchText: 'To Be Deleted',
      });
      expect(beforeDelete.searchDocuments.total).toBeGreaterThanOrEqual(1);

      // Delete the contact
      await sdk.DeleteContactById({
        id: contactId,
      });

      // Wait a bit for deletion to process
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Search should not find the deleted contact
      const afterDelete = await sdk.SearchDocuments({
        workspaceId,
        searchText: 'To Be Deleted',
      });

      const deletedContact = afterDelete.searchDocuments.documents.find(
        (doc) => doc.documentId === contactId,
      );
      expect(deletedContact).toBeUndefined();
    });
  });

  describe('Partial Matching', () => {
    it('should match partial words like "constr" finding "construction"', async () => {
      const { sdk } = testClient;

      const projectName = `Active Construction Project ${Date.now()}`;
      const { createProject } = await sdk.CreateProject({
        input: {
          workspaceId,
          name: projectName,
          project_code: `CONSTR-${Date.now()}`,
          description: 'Construction site project',
          deleted: false,
        },
      });

      expect(createProject).toBeDefined();

      // Wait for the project to be indexed
      await waitForSearchIndexing(sdk, workspaceId, 'construction', 1, 10000);

      // Search with partial word "constr" - should find "construction"
      const { searchDocuments } = await sdk.SearchDocuments({
        workspaceId,
        searchText: 'constr',
      });

      expect(searchDocuments.total).toBeGreaterThanOrEqual(1);
      expect(searchDocuments.documents).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            collection: 'projects',
            title: projectName,
          }),
        ]),
      );
    });
  });

  describe('Search Across Multiple Collections', () => {
    it('should search across multiple document types', async () => {
      const { sdk } = testClient;

      const searchTerm = `MultiCollection ${Date.now()}`;

      // Create documents in different collections
      await sdk.CreateBusinessContact({
        input: {
          workspaceId,
          name: `${searchTerm} Contact`,
        },
      });

      await sdk.CreateProject({
        input: {
          workspaceId,
          name: `${searchTerm} Project`,
          project_code: `MC-${Date.now()}`,
          deleted: false,
        },
      });

      // Wait for both to be indexed
      await waitForSearchIndexing(sdk, workspaceId, searchTerm, 2, 15000);

      // Search without collection filter
      const { searchDocuments } = await sdk.SearchDocuments({
        workspaceId,
        searchText: searchTerm,
      });

      expect(searchDocuments.total).toBeGreaterThanOrEqual(2);

      const collections = new Set(
        searchDocuments.documents.map((d) => d.collection),
      );
      expect(collections.size).toBeGreaterThanOrEqual(2);
      const collectionArray = Array.from(collections);
      expect(collectionArray).toEqual(
        expect.arrayContaining(['contacts', 'projects']),
      );
    });
  });

  describe('Get Search Document By ID', () => {
    it('should retrieve a search document by its ID', async () => {
      const { sdk } = testClient;

      const uniqueName = `GetById Contact ${Date.now()}`;

      // Create a contact
      const { createBusinessContact } = await sdk.CreateBusinessContact({
        input: {
          workspaceId,
          name: uniqueName,
          phone: '555-1234',
        },
      });

      expect(createBusinessContact).toBeDefined();

      // Wait for indexing
      await waitForSearchIndexing(sdk, workspaceId, uniqueName, 1, 10000);

      // Search to get the search document
      const { searchDocuments } = await sdk.SearchDocuments({
        workspaceId,
        searchText: uniqueName,
      });

      expect(searchDocuments.documents.length).toBeGreaterThanOrEqual(1);

      const searchDoc = searchDocuments.documents[0];
      const searchDocId = searchDoc.id;

      // Now use getSearchDocumentById
      const result = await sdk.GetSearchDocumentById({
        id: searchDocId,
      });

      expect(result.getSearchDocumentById).toBeDefined();
      expect(result.getSearchDocumentById?.id).toBe(searchDocId);
      expect(result.getSearchDocumentById?.documentId).toBe(
        createBusinessContact!.id,
      );
      expect(result.getSearchDocumentById?.collection).toBe('contacts');
      expect(result.getSearchDocumentById?.workspaceId).toBe(workspaceId);
      expect(result.getSearchDocumentById?.title).toBe(uniqueName);
      expect(result.getSearchDocumentById?.documentType).toBe(
        'Business Contact',
      );
    });

    it('should return null for non-existent search document ID', async () => {
      const { sdk } = testClient;

      const result = await sdk.GetSearchDocumentById({
        id: 'NON_EXISTENT_ID_12345',
      });

      expect(result.getSearchDocumentById).toBeNull();
    });

    it('should retrieve multiple search documents by their IDs (bulk)', async () => {
      const { sdk } = testClient;

      const baseName = `BulkGetById ${Date.now()}`;

      // Create multiple contacts
      await sdk.CreateBusinessContact({
        input: {
          workspaceId,
          name: `${baseName} Contact 1`,
        },
      });

      await sdk.CreateBusinessContact({
        input: {
          workspaceId,
          name: `${baseName} Contact 2`,
        },
      });

      await sdk.CreateProject({
        input: {
          workspaceId,
          name: `${baseName} Project`,
          project_code: `BULK-${Date.now()}`,
          deleted: false,
        },
      });

      // Wait for all to be indexed
      await waitForSearchIndexing(sdk, workspaceId, baseName, 3, 15000);

      // Search to get the search documents
      const { searchDocuments } = await sdk.SearchDocuments({
        workspaceId,
        searchText: baseName,
      });

      expect(searchDocuments.documents.length).toBeGreaterThanOrEqual(3);

      // Get the search document IDs
      const searchDocIds = searchDocuments.documents
        .slice(0, 3)
        .map((doc) => doc.id);

      // Now use getBulkSearchDocumentsById
      const result = await sdk.GetBulkSearchDocumentsById({
        ids: searchDocIds,
      });

      expect(result.getBulkSearchDocumentsById).toHaveLength(3);

      // Verify all documents are returned
      const returnedIds = result.getBulkSearchDocumentsById.map(
        (doc) => doc?.id,
      );
      expect(returnedIds).toEqual(expect.arrayContaining(searchDocIds));

      // Verify different document types
      const collections = new Set(
        result.getBulkSearchDocumentsById.map((doc) => doc?.collection),
      );
      expect(collections.has(SearchableCollectionType.Contacts)).toBe(true);
      expect(collections.has(SearchableCollectionType.Projects)).toBe(true);
    });

    it('should handle bulk request with some non-existent IDs', async () => {
      const { sdk } = testClient;

      const uniqueName = `BulkWithInvalid ${Date.now()}`;

      // Create one valid contact
      await sdk.CreateBusinessContact({
        input: {
          workspaceId,
          name: uniqueName,
        },
      });

      // Wait for indexing
      await waitForSearchIndexing(sdk, workspaceId, uniqueName, 1, 10000);

      // Search to get one valid ID
      const { searchDocuments } = await sdk.SearchDocuments({
        workspaceId,
        searchText: uniqueName,
      });

      const validId = searchDocuments.documents[0].id;

      // Mix valid and invalid IDs
      const result = await sdk.GetBulkSearchDocumentsById({
        ids: [validId, 'INVALID_ID_1', 'INVALID_ID_2'],
      });

      // Should return array with valid document and nulls for invalid IDs
      expect(result.getBulkSearchDocumentsById).toHaveLength(3);

      const nonNullDocs = result.getBulkSearchDocumentsById.filter(
        (doc) => doc !== null,
      );
      expect(nonNullDocs).toHaveLength(1);
      expect(nonNullDocs[0]?.id).toBe(validId);
    });
  });

  describe('Searchable Fields by Entity Type', () => {
    describe('Contact Searchable Fields', () => {
      it('should search business contacts by phone number', async () => {
        const { sdk } = testClient;
        const uniquePhone = `555-${Date.now().toString().slice(-7)}`;

        await sdk.CreateBusinessContact({
          input: {
            workspaceId,
            name: `Business With Phone ${Date.now()}`,
            phone: uniquePhone,
          },
        });

        await waitForSearchIndexing(sdk, workspaceId, uniquePhone, 1, 10000);

        const { searchDocuments } = await sdk.SearchDocuments({
          workspaceId,
          searchText: uniquePhone,
          collections: [SearchableCollectionType.Contacts],
        });

        expect(searchDocuments.total).toBeGreaterThanOrEqual(1);
        expect(searchDocuments.documents[0].collection).toBe('contacts');
      });

      it('should search business contacts by address', async () => {
        const { sdk } = testClient;
        const uniqueAddress = `123 Main St Suite ${Date.now()}`;

        await sdk.CreateBusinessContact({
          input: {
            workspaceId,
            name: `Business With Address ${Date.now()}`,
            address: uniqueAddress,
          },
        });

        await waitForSearchIndexing(sdk, workspaceId, 'Main St', 1, 10000);

        const { searchDocuments } = await sdk.SearchDocuments({
          workspaceId,
          searchText: 'Main St',
          collections: [SearchableCollectionType.Contacts],
        });

        expect(searchDocuments.total).toBeGreaterThanOrEqual(1);
      });

      it('should search business contacts by website', async () => {
        const { sdk } = testClient;
        const uniqueDomain = `example${Date.now()}.com`;

        await sdk.CreateBusinessContact({
          input: {
            workspaceId,
            name: `Business With Website ${Date.now()}`,
            website: `https://${uniqueDomain}`,
          },
        });

        await waitForSearchIndexing(sdk, workspaceId, uniqueDomain, 1, 10000);

        const { searchDocuments } = await sdk.SearchDocuments({
          workspaceId,
          searchText: uniqueDomain,
          collections: [SearchableCollectionType.Contacts],
        });

        expect(searchDocuments.total).toBeGreaterThanOrEqual(1);
      });

      it('should search person contacts by email', async () => {
        const { sdk } = testClient;
        const uniqueEmail = `person${Date.now()}@test.com`;

        // Create a business first (person contacts need a businessId)
        const { createBusinessContact: business } =
          await sdk.CreateBusinessContact({
            input: {
              workspaceId,
              name: `Business for Person ${Date.now()}`,
            },
          });

        await sdk.CreatePersonContact({
          input: {
            workspaceId,
            name: `Person With Email ${Date.now()}`,
            email: uniqueEmail,
            businessId: business!.id,
          },
        });

        await waitForSearchIndexing(sdk, workspaceId, uniqueEmail, 1, 10000);

        const { searchDocuments } = await sdk.SearchDocuments({
          workspaceId,
          searchText: uniqueEmail,
          collections: [SearchableCollectionType.Contacts],
        });

        expect(searchDocuments.total).toBeGreaterThanOrEqual(1);
        expect(searchDocuments.documents[0].documentType).toBe(
          'Person Contact',
        );
      });

      it('should search person contacts by name', async () => {
        const { sdk } = testClient;
        const uniqueName = `Person Name ${Date.now()}`;

        // Create a business first (person contacts need a businessId)
        const { createBusinessContact: business } =
          await sdk.CreateBusinessContact({
            input: {
              workspaceId,
              name: `Business for Person ${Date.now()}`,
            },
          });

        await sdk.CreatePersonContact({
          input: {
            workspaceId,
            name: uniqueName,
            email: `role${Date.now()}@test.com`,
            businessId: business!.id,
          },
        });

        await waitForSearchIndexing(sdk, workspaceId, uniqueName, 1, 10000);

        const { searchDocuments } = await sdk.SearchDocuments({
          workspaceId,
          searchText: uniqueName,
          collections: [SearchableCollectionType.Contacts],
        });

        expect(searchDocuments.total).toBeGreaterThanOrEqual(1);
      });

      it('should search contacts by notes', async () => {
        const { sdk } = testClient;
        const uniqueNote = `UniqueNote${Date.now()}`;

        await sdk.CreateBusinessContact({
          input: {
            workspaceId,
            name: `Contact With Notes ${Date.now()}`,
            notes: `This is a ${uniqueNote} for testing`,
          },
        });

        await waitForSearchIndexing(sdk, workspaceId, uniqueNote, 1, 10000);

        const { searchDocuments } = await sdk.SearchDocuments({
          workspaceId,
          searchText: uniqueNote,
          collections: [SearchableCollectionType.Contacts],
        });

        expect(searchDocuments.total).toBeGreaterThanOrEqual(1);
      });
    });

    describe('Project Searchable Fields', () => {
      it('should search projects by project code', async () => {
        const { sdk } = testClient;
        const uniqueCode = `PRJ-${Date.now()}`;

        await sdk.CreateProject({
          input: {
            workspaceId,
            name: `Project ${Date.now()}`,
            project_code: uniqueCode,
            deleted: false,
          },
        });

        await waitForSearchIndexing(sdk, workspaceId, uniqueCode, 1, 10000);

        const { searchDocuments } = await sdk.SearchDocuments({
          workspaceId,
          searchText: uniqueCode,
          collections: [SearchableCollectionType.Projects],
        });

        expect(searchDocuments.total).toBeGreaterThanOrEqual(1);
        expect(searchDocuments.documents[0].collection).toBe('projects');
      });

      it('should search projects by description', async () => {
        const { sdk } = testClient;
        const uniqueDesc = `UniqueDescription${Date.now()}`;

        await sdk.CreateProject({
          input: {
            workspaceId,
            name: `Project With Desc ${Date.now()}`,
            project_code: `DESC-${Date.now()}`,
            description: `This project has ${uniqueDesc} in its description`,
            deleted: false,
          },
        });

        await waitForSearchIndexing(sdk, workspaceId, uniqueDesc, 1, 10000);

        const { searchDocuments } = await sdk.SearchDocuments({
          workspaceId,
          searchText: uniqueDesc,
          collections: [SearchableCollectionType.Projects],
        });

        expect(searchDocuments.total).toBeGreaterThanOrEqual(1);
      });
    });

    // TODO: Add tests for Sales Orders, Purchase Orders, and Invoices
    // These require additional helper functions or direct SDK understanding
    // that needs to be implemented in the test environment
  });

  describe('Search User State Management', () => {
    // Clear user state before each test to avoid state pollution
    beforeEach(async () => {
      const { sdk } = testClient;
      try {
        // First ensure state exists
        await sdk.GetSearchUserState({ workspaceId });

        // Get current state and remove all favorites one by one
        const state = await sdk.GetSearchUserState({ workspaceId });
        if (
          state.getSearchUserState?.favorites &&
          state.getSearchUserState.favorites.length > 0
        ) {
          for (const fav of state.getSearchUserState.favorites) {
            await sdk.ToggleSearchFavorite({
              workspaceId,
              searchDocumentId: fav.searchDocumentId,
            });
          }
        }

        // Clear all recents after clearing favorites
        await sdk.ClearSearchRecents({ workspaceId });
      } catch (error) {
        // Ignore errors if state doesn't exist yet
        console.log('Error in beforeEach cleanup:', error);
      }
    });

    describe('Get User State', () => {
      it('should create and return user state for a workspace', async () => {
        const { sdk } = testClient;

        const result = await sdk.GetSearchUserState({
          workspaceId,
        });

        expect(result.getSearchUserState).toBeDefined();
        expect(result.getSearchUserState?.workspaceId).toBe(workspaceId);
        expect(result.getSearchUserState?.favorites).toEqual([]);
        expect(result.getSearchUserState?.recents).toEqual([]);
      });
    });

    describe('Favorites Management', () => {
      it('should add a document to favorites', async () => {
        const { sdk } = testClient;

        // Create a contact to favorite
        await sdk.CreateBusinessContact({
          input: {
            workspaceId,
            name: `Favorite Contact ${Date.now()}`,
          },
        });

        // Wait for indexing
        await waitForSearchIndexing(
          sdk,
          workspaceId,
          'Favorite Contact',
          1,
          10000,
        );

        // Get the search document ID
        const { searchDocuments } = await sdk.SearchDocuments({
          workspaceId,
          searchText: 'Favorite Contact',
        });

        const searchDocId = searchDocuments.documents[0].id;

        // Toggle to add favorite
        const result = await sdk.ToggleSearchFavorite({
          workspaceId,
          searchDocumentId: searchDocId,
        });

        expect(result.toggleSearchFavorite.favorites).toHaveLength(1);
        expect(result.toggleSearchFavorite.favorites[0].searchDocumentId).toBe(
          searchDocId,
        );
        expect(result.toggleSearchFavorite.favorites[0].addedAt).toBeDefined();
      });

      it('should remove a document from favorites when toggled again', async () => {
        const { sdk } = testClient;

        // Create a contact
        await sdk.CreateBusinessContact({
          input: {
            workspaceId,
            name: `Toggle Favorite ${Date.now()}`,
          },
        });

        // Wait for indexing
        await waitForSearchIndexing(
          sdk,
          workspaceId,
          'Toggle Favorite',
          1,
          10000,
        );

        // Get the search document ID
        const { searchDocuments } = await sdk.SearchDocuments({
          workspaceId,
          searchText: 'Toggle Favorite',
        });

        const searchDocId = searchDocuments.documents[0].id;

        // Add to favorites
        const addResult = await sdk.ToggleSearchFavorite({
          workspaceId,
          searchDocumentId: searchDocId,
        });
        expect(addResult.toggleSearchFavorite.favorites).toHaveLength(1);

        // Remove from favorites
        const removeResult = await sdk.ToggleSearchFavorite({
          workspaceId,
          searchDocumentId: searchDocId,
        });
        expect(removeResult.toggleSearchFavorite.favorites).toHaveLength(0);
      });

      it('should add document to recents when unfavorited', async () => {
        const { sdk } = testClient;

        // Create a contact
        await sdk.CreateBusinessContact({
          input: {
            workspaceId,
            name: `Unfavorite To Recent ${Date.now()}`,
          },
        });

        // Wait for indexing
        await waitForSearchIndexing(
          sdk,
          workspaceId,
          'Unfavorite To Recent',
          1,
          10000,
        );

        // Get the search document ID
        const { searchDocuments } = await sdk.SearchDocuments({
          workspaceId,
          searchText: 'Unfavorite To Recent',
        });

        const searchDocId = searchDocuments.documents[0].id;

        // Add to favorites
        const addResult = await sdk.ToggleSearchFavorite({
          workspaceId,
          searchDocumentId: searchDocId,
        });
        expect(addResult.toggleSearchFavorite.favorites).toHaveLength(1);
        expect(
          addResult.toggleSearchFavorite.favorites[0].searchDocumentId,
        ).toBe(searchDocId);

        // Verify it's NOT in recents (favorites take precedence)
        expect(
          addResult.toggleSearchFavorite.recents.some(
            (r) => r.searchDocumentId === searchDocId,
          ),
        ).toBe(false);

        // Unfavorite it (toggle again)
        const unfavoriteResult = await sdk.ToggleSearchFavorite({
          workspaceId,
          searchDocumentId: searchDocId,
        });

        // Should no longer be in favorites
        expect(unfavoriteResult.toggleSearchFavorite.favorites).toHaveLength(0);

        // Should now be in recents
        expect(unfavoriteResult.toggleSearchFavorite.recents).toHaveLength(1);
        expect(
          unfavoriteResult.toggleSearchFavorite.recents[0].searchDocumentId,
        ).toBe(searchDocId);
        expect(
          unfavoriteResult.toggleSearchFavorite.recents[0].accessedAt,
        ).toBeDefined();
      });

      it('should maintain multiple favorites', async () => {
        const { sdk } = testClient;

        const baseName = `Multi Favorite ${Date.now()}`;

        // Create multiple contacts
        await sdk.CreateBusinessContact({
          input: {
            workspaceId,
            name: `${baseName} A`,
          },
        });

        await sdk.CreateBusinessContact({
          input: {
            workspaceId,
            name: `${baseName} B`,
          },
        });

        // Wait for indexing
        await waitForSearchIndexing(sdk, workspaceId, baseName, 2, 10000);

        // Get search documents
        const { searchDocuments } = await sdk.SearchDocuments({
          workspaceId,
          searchText: baseName,
        });

        const searchDocIds = searchDocuments.documents
          .slice(0, 2)
          .map((d) => d.id);

        // Add both to favorites
        await sdk.ToggleSearchFavorite({
          workspaceId,
          searchDocumentId: searchDocIds[0],
        });

        const result = await sdk.ToggleSearchFavorite({
          workspaceId,
          searchDocumentId: searchDocIds[1],
        });

        expect(result.toggleSearchFavorite.favorites).toHaveLength(2);
        const favoriteIds = result.toggleSearchFavorite.favorites.map(
          (f) => f.searchDocumentId,
        );
        expect(favoriteIds).toEqual(expect.arrayContaining(searchDocIds));
      });
    });

    describe('Recents Management', () => {
      it('should add a document to recents', async () => {
        const { sdk } = testClient;

        // Create a contact
        await sdk.CreateBusinessContact({
          input: {
            workspaceId,
            name: `Recent Contact ${Date.now()}`,
          },
        });

        // Wait for indexing
        await waitForSearchIndexing(
          sdk,
          workspaceId,
          'Recent Contact',
          1,
          10000,
        );

        // Get the search document ID
        const { searchDocuments } = await sdk.SearchDocuments({
          workspaceId,
          searchText: 'Recent Contact',
        });

        const searchDocId = searchDocuments.documents[0].id;

        // Add to recents
        const result = await sdk.AddSearchRecent({
          workspaceId,
          searchDocumentId: searchDocId,
        });

        expect(result.addSearchRecent.recents).toHaveLength(1);
        expect(result.addSearchRecent.recents[0].searchDocumentId).toBe(
          searchDocId,
        );
        expect(result.addSearchRecent.recents[0].accessedAt).toBeDefined();
      });

      it('should move existing recent to top when accessed again', async () => {
        const { sdk } = testClient;

        const baseName = `Move Recent ${Date.now()}`;

        // Create two contacts
        await sdk.CreateBusinessContact({
          input: {
            workspaceId,
            name: `${baseName} First`,
          },
        });

        await sdk.CreateBusinessContact({
          input: {
            workspaceId,
            name: `${baseName} Second`,
          },
        });

        // Wait for indexing
        await waitForSearchIndexing(sdk, workspaceId, baseName, 2, 10000);

        // Get search documents
        const { searchDocuments } = await sdk.SearchDocuments({
          workspaceId,
          searchText: baseName,
        });

        const docIds = searchDocuments.documents.slice(0, 2).map((d) => d.id);

        // Add first document to recents
        await sdk.AddSearchRecent({
          workspaceId,
          searchDocumentId: docIds[0],
        });

        // Add second document to recents (should be at top)
        await sdk.AddSearchRecent({
          workspaceId,
          searchDocumentId: docIds[1],
        });

        // Get state to verify order
        const stateAfterBoth = await sdk.GetSearchUserState({ workspaceId });
        expect(stateAfterBoth.getSearchUserState?.recents).toHaveLength(2);
        expect(
          stateAfterBoth.getSearchUserState?.recents[0].searchDocumentId,
        ).toBe(docIds[1]);

        // Re-access first document (should move to top)
        const result = await sdk.AddSearchRecent({
          workspaceId,
          searchDocumentId: docIds[0],
        });

        // Should still have 2 recents (no duplicate), but order changed
        expect(result.addSearchRecent.recents).toHaveLength(2);
        expect(result.addSearchRecent.recents[0].searchDocumentId).toBe(
          docIds[0],
        );
        expect(result.addSearchRecent.recents[1].searchDocumentId).toBe(
          docIds[1],
        );
      });

      it('should auto-prune recents to 20 items max', async () => {
        const { sdk } = testClient;

        const baseName = `Prune Recent ${Date.now()}`;

        // Create 25 contacts
        const contactPromises = [];
        for (let i = 0; i < 25; i++) {
          contactPromises.push(
            sdk.CreateBusinessContact({
              input: {
                workspaceId,
                name: `${baseName} ${i}`,
              },
            }),
          );
        }
        await Promise.all(contactPromises);

        // Wait for all to be indexed
        await waitForSearchIndexing(sdk, workspaceId, baseName, 25, 20000);

        // Get all search documents
        const { searchDocuments } = await sdk.SearchDocuments({
          workspaceId,
          searchText: baseName,
          pageSize: 30,
        });

        const docIds = searchDocuments.documents.map((d) => d.id);

        // Add all 25 to recents
        for (const docId of docIds) {
          await sdk.AddSearchRecent({
            workspaceId,
            searchDocumentId: docId,
          });
        }

        // Get final state
        const finalState = await sdk.GetSearchUserState({ workspaceId });

        // Should only have 20 recents (oldest 5 pruned)
        expect(finalState.getSearchUserState?.recents).toHaveLength(20);

        // Most recent (last added) should be first
        expect(finalState.getSearchUserState?.recents[0].searchDocumentId).toBe(
          docIds[docIds.length - 1],
        );
      });

      it('should remove a document from recents', async () => {
        const { sdk } = testClient;

        // Create a contact
        await sdk.CreateBusinessContact({
          input: {
            workspaceId,
            name: `Remove Recent ${Date.now()}`,
          },
        });

        // Wait for indexing
        await waitForSearchIndexing(
          sdk,
          workspaceId,
          'Remove Recent',
          1,
          10000,
        );

        // Get the search document ID
        const { searchDocuments } = await sdk.SearchDocuments({
          workspaceId,
          searchText: 'Remove Recent',
        });

        const searchDocId = searchDocuments.documents[0].id;

        // Add to recents
        await sdk.AddSearchRecent({
          workspaceId,
          searchDocumentId: searchDocId,
        });

        // Verify it's there
        const stateBeforeRemove = await sdk.GetSearchUserState({
          workspaceId,
        });
        expect(
          stateBeforeRemove.getSearchUserState?.recents.some(
            (r) => r.searchDocumentId === searchDocId,
          ),
        ).toBe(true);

        // Remove from recents
        const result = await sdk.RemoveSearchRecent({
          workspaceId,
          searchDocumentId: searchDocId,
        });

        expect(
          result.removeSearchRecent.recents.some(
            (r) => r.searchDocumentId === searchDocId,
          ),
        ).toBe(false);
      });

      it('should clear all recents', async () => {
        const { sdk } = testClient;

        const baseName = `Clear Recents ${Date.now()}`;

        // Create multiple contacts
        for (let i = 0; i < 3; i++) {
          await sdk.CreateBusinessContact({
            input: {
              workspaceId,
              name: `${baseName} ${i}`,
            },
          });
        }

        // Wait for indexing
        await waitForSearchIndexing(sdk, workspaceId, baseName, 3, 10000);

        // Get search documents
        const { searchDocuments } = await sdk.SearchDocuments({
          workspaceId,
          searchText: baseName,
        });

        // Add all to recents
        for (const doc of searchDocuments.documents) {
          await sdk.AddSearchRecent({
            workspaceId,
            searchDocumentId: doc.id,
          });
        }

        // Verify recents exist
        const stateBeforeClear = await sdk.GetSearchUserState({ workspaceId });
        expect(
          stateBeforeClear.getSearchUserState?.recents.length,
        ).toBeGreaterThanOrEqual(3);

        // Clear all recents
        const result = await sdk.ClearSearchRecents({ workspaceId });

        expect(result.clearSearchRecents.recents).toHaveLength(0);
      });
    });

    describe('Combined Favorites and Recents', () => {
      it('should maintain both favorites and recents independently', async () => {
        const { sdk } = testClient;

        const baseName = `Combined ${Date.now()}`;

        // Create two contacts
        await sdk.CreateBusinessContact({
          input: {
            workspaceId,
            name: `${baseName} Fav`,
          },
        });

        await sdk.CreateBusinessContact({
          input: {
            workspaceId,
            name: `${baseName} Recent`,
          },
        });

        // Wait for indexing
        await waitForSearchIndexing(sdk, workspaceId, baseName, 2, 10000);

        // Get search documents
        const { searchDocuments } = await sdk.SearchDocuments({
          workspaceId,
          searchText: baseName,
        });

        const favDocId = searchDocuments.documents[0].id;
        const recentDocId = searchDocuments.documents[1].id;

        // Add first to favorites
        await sdk.ToggleSearchFavorite({
          workspaceId,
          searchDocumentId: favDocId,
        });

        // Add second to recents
        await sdk.AddSearchRecent({
          workspaceId,
          searchDocumentId: recentDocId,
        });

        // Get state
        const state = await sdk.GetSearchUserState({ workspaceId });

        expect(state.getSearchUserState?.favorites).toHaveLength(1);
        expect(state.getSearchUserState?.favorites[0].searchDocumentId).toBe(
          favDocId,
        );

        expect(
          state.getSearchUserState?.recents.some(
            (r) => r.searchDocumentId === recentDocId,
          ),
        ).toBe(true);
      });

      it('should not add to recents if document is in favorites', async () => {
        const { sdk } = testClient;

        // Create a contact
        await sdk.CreateBusinessContact({
          input: {
            workspaceId,
            name: `Favorite Over Recent ${Date.now()}`,
          },
        });

        // Wait for indexing
        await waitForSearchIndexing(
          sdk,
          workspaceId,
          'Favorite Over Recent',
          1,
          10000,
        );

        // Get the search document ID
        const { searchDocuments } = await sdk.SearchDocuments({
          workspaceId,
          searchText: 'Favorite Over Recent',
        });

        const searchDocId = searchDocuments.documents[0].id;

        // Add to recents first
        await sdk.AddSearchRecent({
          workspaceId,
          searchDocumentId: searchDocId,
        });

        // Verify it's in recents
        const stateAfterRecent = await sdk.GetSearchUserState({ workspaceId });
        expect(
          stateAfterRecent.getSearchUserState?.recents.some(
            (r) => r.searchDocumentId === searchDocId,
          ),
        ).toBe(true);

        // Add to favorites (should remove from recents)
        await sdk.ToggleSearchFavorite({
          workspaceId,
          searchDocumentId: searchDocId,
        });

        // Get state
        const state = await sdk.GetSearchUserState({ workspaceId });

        // Should be in favorites
        expect(state.getSearchUserState?.favorites).toHaveLength(1);
        expect(state.getSearchUserState?.favorites[0].searchDocumentId).toBe(
          searchDocId,
        );

        // Should NOT be in recents (favorites take precedence)
        expect(
          state.getSearchUserState?.recents.some(
            (r) => r.searchDocumentId === searchDocId,
          ),
        ).toBe(false);

        // Try to add to recents while it's in favorites (should be ignored)
        await sdk.AddSearchRecent({
          workspaceId,
          searchDocumentId: searchDocId,
        });

        // Get state again
        const stateFinal = await sdk.GetSearchUserState({ workspaceId });

        // Should still only be in favorites, not in recents
        expect(
          stateFinal.getSearchUserState?.recents.some(
            (r) => r.searchDocumentId === searchDocId,
          ),
        ).toBe(false);
      });
    });

    describe('Workspace Isolation', () => {
      it('should maintain separate user state per workspace', async () => {
        const { sdk } = testClient;

        // Create a second workspace
        const { createWorkspace: workspace2 } = await sdk.UtilCreateWorkspace({
          accessType: WorkspaceAccessType.SameDomain,
          name: `Search Test Workspace 2 ${Date.now()}`,
        });

        if (!workspace2) {
          throw new Error('Failed to create second workspace');
        }

        const workspace2Id = workspace2.id;

        // Create contacts in both workspaces
        await sdk.CreateBusinessContact({
          input: {
            workspaceId,
            name: `WS1 Contact ${Date.now()}`,
          },
        });

        await sdk.CreateBusinessContact({
          input: {
            workspaceId: workspace2Id,
            name: `WS2 Contact ${Date.now()}`,
          },
        });

        // Wait for indexing
        await waitForSearchIndexing(sdk, workspaceId, 'WS1 Contact', 1, 10000);
        await waitForSearchIndexing(sdk, workspace2Id, 'WS2 Contact', 1, 10000);

        // Get search docs
        const ws1Docs = await sdk.SearchDocuments({
          workspaceId,
          searchText: 'WS1 Contact',
        });
        const ws2Docs = await sdk.SearchDocuments({
          workspaceId: workspace2Id,
          searchText: 'WS2 Contact',
        });

        const ws1DocId = ws1Docs.searchDocuments.documents[0].id;
        const ws2DocId = ws2Docs.searchDocuments.documents[0].id;

        // Add to favorites in workspace 1
        await sdk.ToggleSearchFavorite({
          workspaceId,
          searchDocumentId: ws1DocId,
        });

        // Add to recents in workspace 2
        await sdk.AddSearchRecent({
          workspaceId: workspace2Id,
          searchDocumentId: ws2DocId,
        });

        // Get states for both workspaces
        const ws1State = await sdk.GetSearchUserState({ workspaceId });
        const ws2State = await sdk.GetSearchUserState({
          workspaceId: workspace2Id,
        });

        // Workspace 1 should have favorite but no recent for ws2 doc
        expect(ws1State.getSearchUserState?.favorites).toHaveLength(1);
        expect(ws1State.getSearchUserState?.favorites[0].searchDocumentId).toBe(
          ws1DocId,
        );

        // Workspace 2 should have recent but no favorite for ws1 doc
        expect(
          ws2State.getSearchUserState?.recents.some(
            (r) => r.searchDocumentId === ws2DocId,
          ),
        ).toBe(true);
        expect(
          ws2State.getSearchUserState?.favorites.some(
            (f) => f.searchDocumentId === ws1DocId,
          ),
        ).toBe(false);
      });
    });
  });
});
