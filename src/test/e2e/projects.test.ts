import { createTestEnvironment } from './test-environment';

import { gql } from 'graphql-request';

import {
  ScopeOfWorkEnum,
  ProjectContactRelationEnum,
  ProjectStatusEnum,
  WorkspaceAccessType,
} from './generated/graphql';

/* GraphQL operations for codegen */
gql`
  query ListProjects($workspaceId: String!) {
    listProjects(workspaceId: $workspaceId) {
      id
      name
      project_code
      description
      deleted
      scope_of_work
      project_contacts {
        contact_id
        relation_to_project
      }
    }
  }
`;

gql`
  mutation DeleteProject($id: String!) {
    deleteProject(id: $id) {
      id
      scope_of_work
      project_contacts {
        contact_id
        relation_to_project
      }
    }
  }
`;

gql`
  mutation CreateProject($input: ProjectInput) {
    createProject(input: $input) {
      id
      name
      project_code
      description
      created_by
      created_at
      updated_at
      deleted
      scope_of_work
      status
      project_contacts {
        contact_id
        relation_to_project
      }
    }
  }
`;

gql`
  mutation UpdateProject($id: String!, $input: ProjectInput) {
    updateProject(id: $id, input: $input) {
      id
      name
      project_code
      description
      created_by
      created_at
      updated_at
      deleted
      scope_of_work
      status
      project_contacts {
        contact_id
        relation_to_project
      }
    }
  }
`;

gql`
  query GetProjectById($id: String!) {
    getProjectById(id: $id) {
      id
      name
      project_code
      description
      created_by
      created_at
      updated_at
      deleted
      scope_of_work
      status
      project_contacts {
        contact_id
        relation_to_project
      }
    }
  }
`;

const { createClient } = createTestEnvironment();

gql`
  query GetProjectWithContact($id: String!) {
    getProjectById(id: $id) {
      id
      name
      project_contacts {
        contact_id
        relation_to_project
        contact {
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
    }
  }
`;

gql`
  query GetProjectWithAssociatedPriceBooks($id: String!) {
    getProjectById(id: $id) {
      id
      name
      project_code
      associatedPriceBooks {
        items {
          id
          name
          projectId
          workspaceId
        }
        page {
          number
          size
        }
      }
    }
  }
`;

it('creates, lists, and soft deletes a project', async () => {
  const { sdk } = await createClient();

  // Create a workspace for this test
  const { createWorkspace } = await sdk.UtilCreateWorkspace({
    accessType: WorkspaceAccessType.SameDomain,
    name: 'E2E Test Workspace',
  });
  if (!createWorkspace) throw new Error('Workspace was not created');
  const workspaceId = createWorkspace.id;

  const input = {
    workspaceId,
    name: 'E2E Project',
    project_code: 'E2E-001',
    description: 'Project for create/list/soft-delete test',
    deleted: false,
  };

  // Create the project
  const createResult = await sdk.CreateProject({ input });
  const created = createResult.createProject;
  if (!created) throw new Error('Project was not created');
  expect(created).toMatchObject({
    name: input.name,
    project_code: input.project_code,
    description: input.description,
    deleted: input.deleted,
    id: expect.any(String),
  });

  // List projects and verify the new project is present
  const listResult = await sdk.ListProjects({ workspaceId });
  const found = listResult.listProjects?.find((p) => p?.id === created.id);
  expect(found).toBeDefined();
  expect(found).toMatchObject({
    name: input.name,
    project_code: input.project_code,
    description: input.description,
    deleted: input.deleted,
    id: created.id,
  });

  // Soft delete the project (mark as deleted)
  const softDeleteResult = await sdk.DeleteProject({ id: created.id });
  expect(softDeleteResult.deleteProject).toBeDefined();
  expect(softDeleteResult.deleteProject?.id).toBe(created.id);

  // List projects again and verify the project is marked as deleted (soft deleted)
  const listAfterSoftDelete = await sdk.ListProjects({ workspaceId });
  const stillThere = listAfterSoftDelete.listProjects?.find(
    (p) => p?.id === created.id,
  );
  expect(stillThere).toBeDefined();
  expect(stillThere?.deleted).toBe(true);
});

it('updates a project and verifies the changes (including status)', async () => {
  const { sdk } = await createClient();

  // Create a workspace for this test
  const { createWorkspace } = await sdk.UtilCreateWorkspace({
    accessType: WorkspaceAccessType.SameDomain,
    name: 'Update Test Workspace',
  });
  if (!createWorkspace) throw new Error('Workspace was not created');
  const workspaceId = createWorkspace.id;

  // Create a project first
  const input = {
    workspaceId,
    name: 'Update Test Project',
    project_code: 'UPD-001',
    description: 'Project before update',
    deleted: false,
    status: ProjectStatusEnum.ConceptOpportunity,
  };
  const { createProject } = await sdk.CreateProject({ input });
  if (!createProject) throw new Error('Project was not created');
  expect(createProject.status).toBe(ProjectStatusEnum.ConceptOpportunity);

  // Update the project
  const updateInput = {
    workspaceId,
    name: 'Updated Project Name',
    project_code: 'UPD-002',
    description: 'Project after update',
    deleted: true,
    status: ProjectStatusEnum.ActiveConstruction,
  };
  const { updateProject } = await sdk.UpdateProject({
    id: createProject.id,
    input: updateInput,
  });
  expect(updateProject).toBeDefined();
  expect(updateProject).toMatchObject({
    id: createProject.id,
    name: updateInput.name,
    project_code: updateInput.project_code,
    description: updateInput.description,
    deleted: updateInput.deleted,
    status: updateInput.status,
  });

  // Fetch by id and verify
  const { getProjectById } = await sdk.GetProjectById({ id: createProject.id });
  expect(getProjectById).toBeDefined();
  expect(getProjectById).toMatchObject({
    id: createProject.id,
    name: updateInput.name,
    project_code: updateInput.project_code,
    description: updateInput.description,
    deleted: updateInput.deleted,
    status: updateInput.status,
  });
});

it('creates, updates, and deletes a project with scope_of_work', async () => {
  const { sdk } = await createClient();

  // Create a workspace for this test
  const { createWorkspace } = await sdk.UtilCreateWorkspace({
    accessType: WorkspaceAccessType.SameDomain,
    name: 'Scope Test Workspace',
  });
  if (!createWorkspace) throw new Error('Workspace was not created');
  const workspaceId = createWorkspace.id;

  const initialScope = [ScopeOfWorkEnum.SiteCivil, ScopeOfWorkEnum.Foundations];
  const updatedScope = [ScopeOfWorkEnum.StructuralFrame, ScopeOfWorkEnum.Mep];

  // Create project with scope_of_work
  const input = {
    workspaceId,
    name: 'Scope CRUD Project',
    project_code: 'SCOPE-001',
    description: 'Project for scope_of_work CRUD test',
    deleted: false,
    scope_of_work: initialScope,
  };
  const { createProject } = await sdk.CreateProject({ input });
  if (!createProject) throw new Error('Project was not created');
  expect(createProject.scope_of_work).toEqual(initialScope);

  // Get by id and verify scope_of_work
  const { getProjectById } = await sdk.GetProjectById({ id: createProject.id });
  if (!getProjectById) throw new Error('Project not found after creation');
  expect(getProjectById.scope_of_work).toEqual(initialScope);

  // Update scope_of_work
  const updateInput = {
    workspaceId,
    name: 'Scope CRUD Project Updated',
    project_code: 'SCOPE-002',
    description: 'Updated scope_of_work',
    deleted: false,
    scope_of_work: updatedScope,
  };
  const { updateProject } = await sdk.UpdateProject({
    id: createProject.id,
    input: updateInput,
  });
  if (!updateProject) throw new Error('Project was not updated');
  expect(updateProject.scope_of_work).toEqual(updatedScope);

  // List and verify updated scope_of_work
  const { listProjects } = await sdk.ListProjects({ workspaceId });
  if (!listProjects) throw new Error('No projects returned');
  const found = listProjects.find((p) => p && p.id === createProject.id);
  if (!found) throw new Error('Updated project not found in list');
  expect(found.scope_of_work).toEqual(updatedScope);

  // Soft delete and verify still present
  const { deleteProject } = await sdk.DeleteProject({ id: createProject.id });
  if (!deleteProject) throw new Error('Project was not deleted');
  expect(deleteProject.scope_of_work).toEqual(updatedScope);
});

it('creates, updates, and queries a project with project_contacts', async () => {
  const { sdk } = await createClient();

  // Create a workspace for this test
  const { createWorkspace } = await sdk.UtilCreateWorkspace({
    accessType: WorkspaceAccessType.SameDomain,
    name: 'Contacts Test Workspace',
  });
  if (!createWorkspace) throw new Error('Workspace was not created');
  const workspaceId = createWorkspace.id;

  const initialContacts = [
    {
      contact_id: 'contact-1',
      relation_to_project: ProjectContactRelationEnum.ProjectManagerGc,
    },
    {
      contact_id: 'contact-2',
      relation_to_project: ProjectContactRelationEnum.SiteSuperintendent,
    },
  ];
  const updatedContacts = [
    {
      contact_id: 'contact-3',
      relation_to_project: ProjectContactRelationEnum.ArchitectEngineerOfRecord,
    },
  ];

  // Create project with project_contacts
  const input = {
    workspaceId,
    name: 'Contacts CRUD Project',
    project_code: 'CONTACTS-001',
    description: 'Project for project_contacts CRUD test',
    deleted: false,
    project_contacts: initialContacts,
  };
  const { createProject } = await sdk.CreateProject({ input });
  if (!createProject) throw new Error('Project was not created');
  expect(createProject.project_contacts).toEqual(initialContacts);

  // Get by id and verify project_contacts
  const { getProjectById } = await sdk.GetProjectById({ id: createProject.id });
  if (!getProjectById) throw new Error('Project not found after creation');
  expect(getProjectById.project_contacts).toEqual(initialContacts);

  // Update project_contacts
  const updateInput = {
    workspaceId,
    name: 'Contacts CRUD Project Updated',
    project_code: 'CONTACTS-002',
    description: 'Updated project_contacts',
    deleted: false,
    project_contacts: updatedContacts,
  };
  const { updateProject } = await sdk.UpdateProject({
    id: createProject.id,
    input: updateInput,
  });
  if (!updateProject) throw new Error('Project was not updated');
  expect(updateProject.project_contacts).toEqual(updatedContacts);

  // List and verify updated project_contacts
  const { listProjects } = await sdk.ListProjects({ workspaceId });
  if (!listProjects) throw new Error('No projects returned');
  const found = listProjects.find((p) => p && p.id === createProject.id);
  if (!found) throw new Error('Updated project not found in list');
  expect(found.project_contacts).toEqual(updatedContacts);

  // Soft delete and verify still present
  const { deleteProject } = await sdk.DeleteProject({ id: createProject.id });
  if (!deleteProject) throw new Error('Project was not deleted');
  expect(deleteProject.project_contacts).toEqual(updatedContacts);
});

it('joins project_contact.contact_id to contact and resolves the contact field', async () => {
  const { sdk } = await createClient();

  // Create a workspace for this test
  const { createWorkspace } = await sdk.UtilCreateWorkspace({
    accessType: WorkspaceAccessType.SameDomain,
    name: 'Join Test Workspace',
  });
  if (!createWorkspace) throw new Error('Workspace was not created');
  const workspaceId = createWorkspace.id;

  // 1. Create a business contact
  const businessInput = {
    workspaceId,
    name: 'Join Test Business',
    notes: 'Business for join test',
    phone: '111-222-3333',
    address: '789 Join St',
    taxId: 'JOIN-123',
    website: 'https://jointest.com',
  };
  const { createBusinessContact } = await sdk.CreateBusinessContact({
    input: businessInput,
  });
  expect(createBusinessContact).toBeDefined();
  const contactId = createBusinessContact!.id;

  // 2. Create a project with a project_contact referencing the business contact
  const projectInput = {
    workspaceId,
    name: 'Join Test Project',
    project_code: 'JOIN-001',
    description: 'Project for join test',
    deleted: false,
    project_contacts: [
      {
        contact_id: contactId,
        relation_to_project: ProjectContactRelationEnum.ProjectManagerGc,
      },
    ],
  };
  const { createProject } = await sdk.CreateProject({ input: projectInput });
  expect(createProject).toBeDefined();
  const projectId = createProject?.id;

  const { getProjectById } = await sdk.GetProjectWithContact({
    id: projectId || '',
  });
  expect(getProjectById).toBeDefined();
  expect(getProjectById?.project_contacts).toBeDefined();
  expect(getProjectById?.project_contacts?.length).toBe(1);
  const pc = getProjectById?.project_contacts?.[0];
  expect(pc?.contact_id).toBe(contactId);
  expect(pc?.contact).toBeDefined();
  expect(pc?.contact?.id).toBe(contactId);
  expect(pc?.contact?.name).toBe(businessInput.name);
  expect(pc?.contact?.contactType).toBe('BUSINESS');
});

it('returns null when getting a non-existent project by id', async () => {
  const { sdk } = await createClient();
  const { getProjectById } = await sdk.GetProjectById({ id: 'nonexistent-id' });
  expect(getProjectById).toBeNull();
});

it('returns null when getting a project by a random UUID that does not exist', async () => {
  const { sdk } = await createClient();
  // Use a random UUID unlikely to exist in the DB
  const randomId = '123e4567-e89b-12d3-a456-426614174000';
  const { getProjectById } = await sdk.GetProjectById({ id: randomId });
  expect(getProjectById).toBeNull();
});

it('throws an error when updating a non-existent project', async () => {
  const { sdk } = await createClient();
  const updateInput = {
    workspaceId: 'test-workspace',
    name: 'Should Not Exist',
    project_code: 'NOPE',
    description: 'This should not update anything',
    deleted: false,
  };
  await expect(
    sdk.UpdateProject({ id: 'nonexistent-id', input: updateInput }),
  ).rejects.toThrow(/User does not have permission to update this project/);
});

it('throws an error when deleting a non-existent project', async () => {
  const { sdk } = await createClient();
  await expect(sdk.DeleteProject({ id: 'nonexistent-id' })).rejects.toThrow(
    /User does not have permission to delete this project/,
  );
});

it('throws an error when creating a project with missing required fields', async () => {
  const { sdk } = await createClient();
  // Missing name and project_code
  const badInput = {
    description: 'Missing required fields',
    deleted: false,
  };
  await expect(sdk.CreateProject({ input: badInput as any })).rejects.toThrow();
});

it('does not allow a user to update a project without proper workspace permissions', async () => {
  // User A creates a project in workspace A
  const { sdk: sdkA } = await createClient({
    companyId: 'company-x',
    userId: 'user-a',
    userName: 'Alice',
  });

  // Create a workspace for user A
  const { createWorkspace: workspaceA } = await sdkA.UtilCreateWorkspace({
    accessType: WorkspaceAccessType.SameDomain,
    name: 'User A Workspace',
  });
  if (!workspaceA) throw new Error('Workspace A was not created');
  const workspaceIdA = workspaceA.id;

  const input = {
    workspaceId: workspaceIdA,
    name: 'Workspace Test Project',
    project_code: 'WORKSPACE-001',
    description: 'Project for workspace isolation test',
    deleted: false,
  };
  const { createProject } = await sdkA.CreateProject({ input });
  if (!createProject) throw new Error('Project was not created');

  // User B creates their own workspace (different workspace from User A)
  const { sdk: sdkB } = await createClient({
    companyId: 'company-x', // Same company, but different workspace
    userId: 'user-b',
    userName: 'Bob',
  });

  const { createWorkspace: workspaceB } = await sdkB.UtilCreateWorkspace({
    accessType: WorkspaceAccessType.SameDomain,
    name: 'User B Workspace',
  });
  if (!workspaceB) throw new Error('Workspace B was not created');

  // User B tries to update User A's project (User B has no permissions on workspace A)
  const updateInput = {
    workspaceId: workspaceIdA,
    name: 'Hacked Name',
    project_code: 'HACKED',
    description: 'Should not be allowed',
    deleted: false,
  };
  await expect(
    sdkB.UpdateProject({ id: createProject.id, input: updateInput }),
  ).rejects.toThrow(/User does not have permission to update this project/);
});

it('does not allow a user to read a project without proper workspace permissions', async () => {
  // User A creates a project in workspace A
  const { sdk: sdkA } = await createClient({
    companyId: 'company-x',
    userId: 'user-a',
    userName: 'Alice',
  });

  // Create a workspace for user A
  const { createWorkspace: workspaceA } = await sdkA.UtilCreateWorkspace({
    accessType: WorkspaceAccessType.SameDomain,
    name: 'User A Read Test Workspace',
  });
  if (!workspaceA) throw new Error('Workspace A was not created');
  const workspaceIdA = workspaceA.id;

  const input = {
    workspaceId: workspaceIdA,
    name: 'Workspace Read Test Project',
    project_code: 'WORKSPACE-READ-001',
    description: 'Project for workspace read isolation test',
    deleted: false,
  };
  const { createProject } = await sdkA.CreateProject({ input });
  if (!createProject) throw new Error('Project was not created');

  // User B creates their own workspace (no permissions on workspace A)
  const { sdk: sdkB } = await createClient({
    companyId: 'company-x', // Same company, but different workspace
    userId: 'user-b',
    userName: 'Bob',
  });

  const { createWorkspace: workspaceB } = await sdkB.UtilCreateWorkspace({
    accessType: WorkspaceAccessType.SameDomain,
    name: 'User B Workspace',
  });
  if (!workspaceB) throw new Error('Workspace B was not created');

  // User B tries to read User A's project (User B has no permissions on workspace A)
  const { getProjectById } = await sdkB.GetProjectById({
    id: createProject.id,
  });
  expect(getProjectById).toBeNull();
});

it('returns empty associatedPriceBooks for a project with no price books', async () => {
  const { sdk } = await createClient();

  // Create workspace
  const { createWorkspace } = await sdk.UtilCreateWorkspace({
    accessType: WorkspaceAccessType.SameDomain,
    name: 'Price Books Test Workspace',
  });
  if (!createWorkspace) throw new Error('Workspace was not created');
  const workspaceId = createWorkspace.id;

  // Create project
  const projectInput = {
    workspaceId,
    name: 'Project Without Price Books',
    project_code: 'NOPB-001',
    description: 'Project with no price books',
    deleted: false,
  };
  const { createProject } = await sdk.CreateProject({ input: projectInput });
  if (!createProject) throw new Error('Project was not created');

  // Query project with associatedPriceBooks
  const { getProjectById } = await sdk.GetProjectWithAssociatedPriceBooks({
    id: createProject.id,
  });

  expect(getProjectById).toBeDefined();
  expect(getProjectById?.associatedPriceBooks).toBeDefined();
  expect(getProjectById?.associatedPriceBooks?.items).toEqual([]);
  expect(getProjectById?.associatedPriceBooks?.page).toBeDefined();
});

it('returns all associated price books for a project', async () => {
  const { sdk } = await createClient();

  // Create workspace
  const { createWorkspace } = await sdk.UtilCreateWorkspace({
    accessType: WorkspaceAccessType.SameDomain,
    name: 'Associated Price Books Workspace',
  });
  if (!createWorkspace) throw new Error('Workspace was not created');
  const workspaceId = createWorkspace.id;

  // Create project
  const projectInput = {
    workspaceId,
    name: 'Project With Price Books',
    project_code: 'WITHPB-001',
    description: 'Project with multiple price books',
    deleted: false,
  };
  const { createProject } = await sdk.CreateProject({ input: projectInput });
  if (!createProject) throw new Error('Project was not created');
  const projectId = createProject.id;

  // Create multiple price books associated with the project
  const priceBook1Input = {
    workspaceId,
    name: 'Price Book 1 for Project',
    notes: 'First price book',
    projectId,
  };
  const { createPriceBook: pb1 } = await sdk.CreatePriceBook({
    input: priceBook1Input,
  });
  expect(pb1).toBeDefined();

  const priceBook2Input = {
    workspaceId,
    name: 'Price Book 2 for Project',
    notes: 'Second price book',
    projectId,
  };
  const { createPriceBook: pb2 } = await sdk.CreatePriceBook({
    input: priceBook2Input,
  });
  expect(pb2).toBeDefined();

  const priceBook3Input = {
    workspaceId,
    name: 'Price Book 3 for Project',
    notes: 'Third price book',
    projectId,
  };
  const { createPriceBook: pb3 } = await sdk.CreatePriceBook({
    input: priceBook3Input,
  });
  expect(pb3).toBeDefined();

  // Query project with associatedPriceBooks
  const { getProjectById } = await sdk.GetProjectWithAssociatedPriceBooks({
    id: projectId,
  });

  expect(getProjectById).toBeDefined();
  expect(getProjectById?.associatedPriceBooks).toBeDefined();
  expect(getProjectById?.associatedPriceBooks?.items).toHaveLength(3);

  const priceBookIds = getProjectById?.associatedPriceBooks?.items.map(
    (pb) => pb?.id,
  );
  expect(priceBookIds).toContain(pb1?.id);
  expect(priceBookIds).toContain(pb2?.id);
  expect(priceBookIds).toContain(pb3?.id);

  // Verify each price book has the correct projectId
  getProjectById?.associatedPriceBooks?.items.forEach((pb) => {
    expect(pb?.projectId).toBe(projectId);
    expect(pb?.workspaceId).toBe(workspaceId);
  });
});

it('does not return price books from other projects', async () => {
  const { sdk } = await createClient();

  // Create workspace
  const { createWorkspace } = await sdk.UtilCreateWorkspace({
    accessType: WorkspaceAccessType.SameDomain,
    name: 'Isolation Test Workspace',
  });
  if (!createWorkspace) throw new Error('Workspace was not created');
  const workspaceId = createWorkspace.id;

  // Create two projects
  const project1Input = {
    workspaceId,
    name: 'Project 1',
    project_code: 'PROJ1-001',
    description: 'First project',
    deleted: false,
  };
  const { createProject: project1 } = await sdk.CreateProject({
    input: project1Input,
  });
  if (!project1) throw new Error('Project 1 was not created');

  const project2Input = {
    workspaceId,
    name: 'Project 2',
    project_code: 'PROJ2-001',
    description: 'Second project',
    deleted: false,
  };
  const { createProject: project2 } = await sdk.CreateProject({
    input: project2Input,
  });
  if (!project2) throw new Error('Project 2 was not created');

  // Create price book for project 1
  const pb1Input = {
    workspaceId,
    name: 'Price Book for Project 1',
    notes: 'Belongs to project 1',
    projectId: project1.id,
  };
  const { createPriceBook: pb1 } = await sdk.CreatePriceBook({
    input: pb1Input,
  });
  expect(pb1).toBeDefined();

  // Create price book for project 2
  const pb2Input = {
    workspaceId,
    name: 'Price Book for Project 2',
    notes: 'Belongs to project 2',
    projectId: project2.id,
  };
  const { createPriceBook: pb2 } = await sdk.CreatePriceBook({
    input: pb2Input,
  });
  expect(pb2).toBeDefined();

  // Query project 1 - should only see its own price book
  const { getProjectById: proj1Result } =
    await sdk.GetProjectWithAssociatedPriceBooks({
      id: project1.id,
    });

  expect(proj1Result?.associatedPriceBooks?.items).toHaveLength(1);
  expect(proj1Result?.associatedPriceBooks?.items[0]?.id).toBe(pb1?.id);
  expect(proj1Result?.associatedPriceBooks?.items[0]?.projectId).toBe(
    project1.id,
  );

  // Query project 2 - should only see its own price book
  const { getProjectById: proj2Result } =
    await sdk.GetProjectWithAssociatedPriceBooks({
      id: project2.id,
    });

  expect(proj2Result?.associatedPriceBooks?.items).toHaveLength(1);
  expect(proj2Result?.associatedPriceBooks?.items[0]?.id).toBe(pb2?.id);
  expect(proj2Result?.associatedPriceBooks?.items[0]?.projectId).toBe(
    project2.id,
  );
});

it('respects authorization when querying associatedPriceBooks', async () => {
  // User A creates a project with price books
  const { sdk: sdkA } = await createClient({
    companyId: 'company-authz',
    userId: 'user-a-authz',
    userName: 'Alice Authz',
  });

  const { createWorkspace: workspaceA } = await sdkA.UtilCreateWorkspace({
    accessType: WorkspaceAccessType.SameDomain,
    name: 'User A Authz Workspace',
  });
  if (!workspaceA) throw new Error('Workspace A was not created');
  const workspaceIdA = workspaceA.id;

  // Create project
  const projectInput = {
    workspaceId: workspaceIdA,
    name: 'Authz Test Project',
    project_code: 'AUTHZ-001',
    description: 'Project for authorization test',
    deleted: false,
  };
  const { createProject } = await sdkA.CreateProject({ input: projectInput });
  if (!createProject) throw new Error('Project was not created');

  // Create price book for the project
  const priceBookInput = {
    workspaceId: workspaceIdA,
    name: 'Authz Price Book',
    notes: 'Should not be visible to unauthorized users',
    projectId: createProject.id,
  };
  const { createPriceBook } = await sdkA.CreatePriceBook({
    input: priceBookInput,
  });
  expect(createPriceBook).toBeDefined();

  // User A can see the price books
  const { getProjectById: userAResult } =
    await sdkA.GetProjectWithAssociatedPriceBooks({
      id: createProject.id,
    });
  expect(userAResult?.associatedPriceBooks?.items).toHaveLength(1);
  expect(userAResult?.associatedPriceBooks?.items[0]?.id).toBe(
    createPriceBook?.id,
  );

  // User B (no access to workspace A) tries to query
  const { sdk: sdkB } = await createClient({
    companyId: 'company-authz',
    userId: 'user-b-authz',
    userName: 'Bob Authz',
  });

  // User B creates their own workspace
  const { createWorkspace: workspaceB } = await sdkB.UtilCreateWorkspace({
    accessType: WorkspaceAccessType.SameDomain,
    name: 'User B Authz Workspace',
  });
  if (!workspaceB) throw new Error('Workspace B was not created');

  // User B tries to query User A's project - should return null (no access)
  const { getProjectById: userBResult } =
    await sdkB.GetProjectWithAssociatedPriceBooks({
      id: createProject.id,
    });
  expect(userBResult).toBeNull();
});

/* GraphQL query for testing totalDescendantCount */
gql`
  query GetProjectWithDescendantCount($id: String!) {
    getProjectById(id: $id) {
      id
      name
      project_code
      parent_project
      totalDescendantCount
      sub_projects {
        id
        name
        totalDescendantCount
      }
    }
  }
`;

it('returns totalDescendantCount of 0 for a project with no subprojects', async () => {
  const { sdk } = await createClient();

  // Create workspace
  const { createWorkspace } = await sdk.UtilCreateWorkspace({
    accessType: WorkspaceAccessType.SameDomain,
    name: 'Descendant Count Test Workspace',
  });
  if (!createWorkspace) throw new Error('Workspace was not created');
  const workspaceId = createWorkspace.id;

  // Create a standalone project with no children
  const projectInput = {
    workspaceId,
    name: 'Standalone Project',
    project_code: 'STANDALONE-001',
    description: 'Project with no subprojects',
    deleted: false,
  };
  const { createProject } = await sdk.CreateProject({ input: projectInput });
  if (!createProject) throw new Error('Project was not created');

  // Query project with totalDescendantCount
  const { getProjectById } = await sdk.GetProjectWithDescendantCount({
    id: createProject.id,
  });

  expect(getProjectById).toBeDefined();
  expect(getProjectById?.totalDescendantCount).toBe(0);
});

it('returns correct totalDescendantCount for a project with direct children only', async () => {
  const { sdk } = await createClient();

  // Create workspace
  const { createWorkspace } = await sdk.UtilCreateWorkspace({
    accessType: WorkspaceAccessType.SameDomain,
    name: 'Direct Children Test Workspace',
  });
  if (!createWorkspace) throw new Error('Workspace was not created');
  const workspaceId = createWorkspace.id;

  // Create parent project
  const parentInput = {
    workspaceId,
    name: 'Parent Project',
    project_code: 'PARENT-001',
    description: 'Parent with direct children',
    deleted: false,
  };
  const { createProject: parent } = await sdk.CreateProject({
    input: parentInput,
  });
  if (!parent) throw new Error('Parent project was not created');

  // Create 3 child projects
  const child1Input = {
    workspaceId,
    name: 'Child Project 1',
    project_code: 'CHILD-001',
    description: 'First child',
    parent_project: parent.id,
    deleted: false,
  };
  const { createProject: child1 } = await sdk.CreateProject({
    input: child1Input,
  });
  expect(child1).toBeDefined();

  const child2Input = {
    workspaceId,
    name: 'Child Project 2',
    project_code: 'CHILD-002',
    description: 'Second child',
    parent_project: parent.id,
    deleted: false,
  };
  const { createProject: child2 } = await sdk.CreateProject({
    input: child2Input,
  });
  expect(child2).toBeDefined();

  const child3Input = {
    workspaceId,
    name: 'Child Project 3',
    project_code: 'CHILD-003',
    description: 'Third child',
    parent_project: parent.id,
    deleted: false,
  };
  const { createProject: child3 } = await sdk.CreateProject({
    input: child3Input,
  });
  expect(child3).toBeDefined();

  // Query parent project
  const { getProjectById } = await sdk.GetProjectWithDescendantCount({
    id: parent.id,
  });

  expect(getProjectById).toBeDefined();
  expect(getProjectById?.totalDescendantCount).toBe(3);
  expect(getProjectById?.sub_projects).toHaveLength(3);

  // Each child should have 0 descendants
  getProjectById?.sub_projects?.forEach((child) => {
    expect(child?.totalDescendantCount).toBe(0);
  });
});

it('returns correct totalDescendantCount for a multi-level project hierarchy', async () => {
  const { sdk } = await createClient();

  // Create workspace
  const { createWorkspace } = await sdk.UtilCreateWorkspace({
    accessType: WorkspaceAccessType.SameDomain,
    name: 'Multi-Level Test Workspace',
  });
  if (!createWorkspace) throw new Error('Workspace was not created');
  const workspaceId = createWorkspace.id;

  // Create hierarchy: Parent -> Child1, Child2 -> Grandchild1, Grandchild2, Grandchild3
  // Parent should have totalDescendantCount = 5 (2 children + 3 grandchildren)

  // Create parent project
  const parentInput = {
    workspaceId,
    name: 'Grandparent Project',
    project_code: 'GRANDPARENT-001',
    description: 'Top level project',
    deleted: false,
  };
  const { createProject: parent } = await sdk.CreateProject({
    input: parentInput,
  });
  if (!parent) throw new Error('Parent project was not created');

  // Create child 1
  const child1Input = {
    workspaceId,
    name: 'Parent Project 1',
    project_code: 'PARENT-001',
    description: 'First child with grandchildren',
    parent_project: parent.id,
    deleted: false,
  };
  const { createProject: child1 } = await sdk.CreateProject({
    input: child1Input,
  });
  if (!child1) throw new Error('Child 1 was not created');

  // Create child 2
  const child2Input = {
    workspaceId,
    name: 'Parent Project 2',
    project_code: 'PARENT-002',
    description: 'Second child with no grandchildren',
    parent_project: parent.id,
    deleted: false,
  };
  const { createProject: child2 } = await sdk.CreateProject({
    input: child2Input,
  });
  if (!child2) throw new Error('Child 2 was not created');

  // Create grandchildren under child1
  const grandchild1Input = {
    workspaceId,
    name: 'Grandchild Project 1',
    project_code: 'GRANDCHILD-001',
    description: 'First grandchild',
    parent_project: child1.id,
    deleted: false,
  };
  const { createProject: grandchild1 } = await sdk.CreateProject({
    input: grandchild1Input,
  });
  expect(grandchild1).toBeDefined();

  const grandchild2Input = {
    workspaceId,
    name: 'Grandchild Project 2',
    project_code: 'GRANDCHILD-002',
    description: 'Second grandchild',
    parent_project: child1.id,
    deleted: false,
  };
  const { createProject: grandchild2 } = await sdk.CreateProject({
    input: grandchild2Input,
  });
  expect(grandchild2).toBeDefined();

  const grandchild3Input = {
    workspaceId,
    name: 'Grandchild Project 3',
    project_code: 'GRANDCHILD-003',
    description: 'Third grandchild',
    parent_project: child1.id,
    deleted: false,
  };
  const { createProject: grandchild3 } = await sdk.CreateProject({
    input: grandchild3Input,
  });
  expect(grandchild3).toBeDefined();

  // Query parent - should see 5 total descendants
  const { getProjectById: parentResult } =
    await sdk.GetProjectWithDescendantCount({
      id: parent.id,
    });

  expect(parentResult).toBeDefined();
  expect(parentResult?.totalDescendantCount).toBe(5); // 2 children + 3 grandchildren

  // Query child1 - should see 3 descendants (its grandchildren)
  const { getProjectById: child1Result } =
    await sdk.GetProjectWithDescendantCount({
      id: child1.id,
    });

  expect(child1Result).toBeDefined();
  expect(child1Result?.totalDescendantCount).toBe(3);

  // Query child2 - should see 0 descendants
  const { getProjectById: child2Result } =
    await sdk.GetProjectWithDescendantCount({
      id: child2.id,
    });

  expect(child2Result).toBeDefined();
  expect(child2Result?.totalDescendantCount).toBe(0);

  // Query grandchildren - should all have 0 descendants
  const { getProjectById: grandchild1Result } =
    await sdk.GetProjectWithDescendantCount({
      id: grandchild1!.id,
    });
  expect(grandchild1Result?.totalDescendantCount).toBe(0);
});

it('returns correct totalDescendantCount for a deep hierarchy (4 levels)', async () => {
  const { sdk } = await createClient();

  // Create workspace
  const { createWorkspace } = await sdk.UtilCreateWorkspace({
    accessType: WorkspaceAccessType.SameDomain,
    name: 'Deep Hierarchy Test Workspace',
  });
  if (!createWorkspace) throw new Error('Workspace was not created');
  const workspaceId = createWorkspace.id;

  // Create 4-level hierarchy: L1 -> L2 -> L3 -> L4
  const l1Input = {
    workspaceId,
    name: 'Level 1 Project',
    project_code: 'L1-001',
    description: 'Top level',
    deleted: false,
  };
  const { createProject: l1 } = await sdk.CreateProject({ input: l1Input });
  if (!l1) throw new Error('L1 was not created');

  const l2Input = {
    workspaceId,
    name: 'Level 2 Project',
    project_code: 'L2-001',
    description: 'Second level',
    parent_project: l1.id,
    deleted: false,
  };
  const { createProject: l2 } = await sdk.CreateProject({ input: l2Input });
  if (!l2) throw new Error('L2 was not created');

  const l3Input = {
    workspaceId,
    name: 'Level 3 Project',
    project_code: 'L3-001',
    description: 'Third level',
    parent_project: l2.id,
    deleted: false,
  };
  const { createProject: l3 } = await sdk.CreateProject({ input: l3Input });
  if (!l3) throw new Error('L3 was not created');

  const l4Input = {
    workspaceId,
    name: 'Level 4 Project',
    project_code: 'L4-001',
    description: 'Fourth level',
    parent_project: l3.id,
    deleted: false,
  };
  const { createProject: l4 } = await sdk.CreateProject({ input: l4Input });
  if (!l4) throw new Error('L4 was not created');

  // Query each level and verify counts
  const { getProjectById: l1Result } = await sdk.GetProjectWithDescendantCount({
    id: l1.id,
  });
  expect(l1Result?.totalDescendantCount).toBe(3); // L2, L3, L4

  const { getProjectById: l2Result } = await sdk.GetProjectWithDescendantCount({
    id: l2.id,
  });
  expect(l2Result?.totalDescendantCount).toBe(2); // L3, L4

  const { getProjectById: l3Result } = await sdk.GetProjectWithDescendantCount({
    id: l3.id,
  });
  expect(l3Result?.totalDescendantCount).toBe(1); // L4

  const { getProjectById: l4Result } = await sdk.GetProjectWithDescendantCount({
    id: l4.id,
  });
  expect(l4Result?.totalDescendantCount).toBe(0); // No children
});

it('totalDescendantCount respects user permissions', async () => {
  // User A creates a project hierarchy
  const { sdk: sdkA } = await createClient({
    companyId: 'company-descendants',
    userId: 'user-a-descendants',
    userName: 'Alice Descendants',
  });

  const { createWorkspace: workspaceA } = await sdkA.UtilCreateWorkspace({
    accessType: WorkspaceAccessType.SameDomain,
    name: 'User A Descendants Workspace',
  });
  if (!workspaceA) throw new Error('Workspace A was not created');
  const workspaceIdA = workspaceA.id;

  // Create parent with children
  const parentInput = {
    workspaceId: workspaceIdA,
    name: 'Authz Parent Project',
    project_code: 'AUTHZ-PARENT-001',
    description: 'Parent for authz test',
    deleted: false,
  };
  const { createProject: parent } = await sdkA.CreateProject({
    input: parentInput,
  });
  if (!parent) throw new Error('Parent was not created');

  const childInput = {
    workspaceId: workspaceIdA,
    name: 'Authz Child Project',
    project_code: 'AUTHZ-CHILD-001',
    description: 'Child for authz test',
    parent_project: parent.id,
    deleted: false,
  };
  const { createProject: child } = await sdkA.CreateProject({
    input: childInput,
  });
  expect(child).toBeDefined();

  // User A can see the descendant count
  const { getProjectById: userAResult } =
    await sdkA.GetProjectWithDescendantCount({
      id: parent.id,
    });
  expect(userAResult?.totalDescendantCount).toBe(1);

  // User B (different company/workspace) tries to query
  const { sdk: sdkB } = await createClient({
    companyId: 'company-descendants',
    userId: 'user-b-descendants',
    userName: 'Bob Descendants',
  });

  const { createWorkspace: workspaceB } = await sdkB.UtilCreateWorkspace({
    accessType: WorkspaceAccessType.SameDomain,
    name: 'User B Descendants Workspace',
  });
  if (!workspaceB) throw new Error('Workspace B was not created');

  // User B tries to query User A's project - should return null (no access)
  const { getProjectById: userBResult } =
    await sdkB.GetProjectWithDescendantCount({
      id: parent.id,
    });
  expect(userBResult).toBeNull();
});

it('totalDescendantCount excludes soft-deleted subprojects', async () => {
  const { sdk } = await createClient();

  // Create workspace
  const { createWorkspace } = await sdk.UtilCreateWorkspace({
    accessType: WorkspaceAccessType.SameDomain,
    name: 'Soft Delete Test Workspace',
  });
  if (!createWorkspace) throw new Error('Workspace was not created');
  const workspaceId = createWorkspace.id;

  // Create parent project
  const parentInput = {
    workspaceId,
    name: 'Parent Project',
    project_code: 'PARENT-SOFT-001',
    description: 'Parent with deleted and non-deleted children',
    deleted: false,
  };
  const { createProject: parent } = await sdk.CreateProject({
    input: parentInput,
  });
  if (!parent) throw new Error('Parent project was not created');

  // Create 3 child projects
  const child1Input = {
    workspaceId,
    name: 'Active Child 1',
    project_code: 'CHILD-ACTIVE-001',
    description: 'Active child',
    parent_project: parent.id,
    deleted: false,
  };
  const { createProject: child1 } = await sdk.CreateProject({
    input: child1Input,
  });
  if (!child1) throw new Error('Child 1 was not created');

  const child2Input = {
    workspaceId,
    name: 'Active Child 2',
    project_code: 'CHILD-ACTIVE-002',
    description: 'Active child',
    parent_project: parent.id,
    deleted: false,
  };
  const { createProject: child2 } = await sdk.CreateProject({
    input: child2Input,
  });
  if (!child2) throw new Error('Child 2 was not created');

  const child3Input = {
    workspaceId,
    name: 'Deleted Child',
    project_code: 'CHILD-DELETED-001',
    description: 'This child will be deleted',
    parent_project: parent.id,
    deleted: false,
  };
  const { createProject: child3 } = await sdk.CreateProject({
    input: child3Input,
  });
  if (!child3) throw new Error('Child 3 was not created');

  // Create grandchildren under child2 (one active, one deleted)
  const grandchild1Input = {
    workspaceId,
    name: 'Active Grandchild',
    project_code: 'GRANDCHILD-ACTIVE-001',
    description: 'Active grandchild',
    parent_project: child2.id,
    deleted: false,
  };
  const { createProject: grandchild1 } = await sdk.CreateProject({
    input: grandchild1Input,
  });
  if (!grandchild1) throw new Error('Grandchild 1 was not created');

  const grandchild2Input = {
    workspaceId,
    name: 'Deleted Grandchild',
    project_code: 'GRANDCHILD-DELETED-001',
    description: 'This grandchild will be deleted',
    parent_project: child2.id,
    deleted: false,
  };
  const { createProject: grandchild2 } = await sdk.CreateProject({
    input: grandchild2Input,
  });
  if (!grandchild2) throw new Error('Grandchild 2 was not created');

  // Before deletion: parent should have 5 descendants (3 children + 2 grandchildren)
  const { getProjectById: beforeDelete } =
    await sdk.GetProjectWithDescendantCount({
      id: parent.id,
    });
  expect(beforeDelete?.totalDescendantCount).toBe(5);

  // Soft delete child3 and grandchild2
  await sdk.DeleteProject({ id: child3.id });
  await sdk.DeleteProject({ id: grandchild2.id });

  // After deletion: parent should have only 3 descendants (2 active children + 1 active grandchild)
  const { getProjectById: afterDelete } =
    await sdk.GetProjectWithDescendantCount({
      id: parent.id,
    });
  expect(afterDelete?.totalDescendantCount).toBe(3);

  // Child2 should have only 1 descendant (active grandchild, not the deleted one)
  const { getProjectById: child2Result } =
    await sdk.GetProjectWithDescendantCount({
      id: child2.id,
    });
  expect(child2Result?.totalDescendantCount).toBe(1);

  // Child1 should still have 0 descendants
  const { getProjectById: child1Result } =
    await sdk.GetProjectWithDescendantCount({
      id: child1.id,
    });
  expect(child1Result?.totalDescendantCount).toBe(0);
});
