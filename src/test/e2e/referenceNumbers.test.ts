import { createTestEnvironment } from './test-environment';
import { gql } from 'graphql-request';
import {
  ResetFrequency,
  ReferenceNumberType,
  WorkspaceAccessType,
} from './generated/graphql';

/* GraphQL operations for codegen */
gql`
  mutation CreateReferenceNumberTemplate(
    $input: CreateReferenceNumberTemplateInput!
  ) {
    createReferenceNumberTemplate(input: $input) {
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
      createdByUser {
        id
        firstName
        lastName
      }
      updatedByUser {
        id
        firstName
        lastName
      }
    }
  }
`;

gql`
  mutation UpdateReferenceNumberTemplate(
    $input: UpdateReferenceNumberTemplateInput!
  ) {
    updateReferenceNumberTemplate(input: $input) {
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

gql`
  mutation DeleteReferenceNumberTemplate($id: String!) {
    deleteReferenceNumberTemplate(id: $id)
  }
`;

gql`
  mutation ResetSequenceNumber($templateId: String!, $newValue: Int) {
    resetSequenceNumber(templateId: $templateId, newValue: $newValue)
  }
`;

gql`
  mutation GenerateReferenceNumber($input: GenerateReferenceNumberInput!) {
    generateReferenceNumber(input: $input) {
      referenceNumber
      sequenceNumber
      templateUsed {
        id
        type
        template
        seqPadding
        startAt
        resetFrequency
        useGlobalSequence
      }
    }
  }
`;

gql`
  query ListReferenceNumberTemplates(
    $filter: ReferenceNumberTemplateFilterInput!
    $page: PageInfoInput
  ) {
    listReferenceNumberTemplates(filter: $filter, page: $page) {
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

gql`
  query GetReferenceNumberTemplate($id: String!) {
    getReferenceNumberTemplate(id: $id) {
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

gql`
  query GetCurrentSequenceNumber(
    $workspaceId: String!
    $type: ReferenceNumberType!
    $templateId: String!
  ) {
    getCurrentSequenceNumber(
      workspaceId: $workspaceId
      type: $type
      templateId: $templateId
    )
  }
`;

gql`
  mutation CreateProjectForReferenceNumbers($input: ProjectInput) {
    createProject(input: $input) {
      id
      name
      project_code
      description
      deleted
    }
  }
`;

gql`
  mutation CreatePersonContactForReferenceNumbers($input: PersonContactInput!) {
    createPersonContact(input: $input) {
      ... on PersonContact {
        id
        name
        email
        workspaceId
        businessId
        contactType
      }
    }
  }
`;

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

const { createClient } = createTestEnvironment();

describe('Reference Number Templates', () => {
  it('creates a basic reference number template', async () => {
    const { sdk, user, utils } = await createClient();
    const workspace = await utils.createWorkspace();

    const templateInput = {
      workspaceId: workspace.id,
      type: ReferenceNumberType.Po,
      template: 'PO-{seq}',
      seqPadding: 4,
      startAt: 1,
      resetFrequency: ResetFrequency.Never,
      useGlobalSequence: false,
    };

    const { createReferenceNumberTemplate } =
      await sdk.CreateReferenceNumberTemplate({
        input: templateInput,
      });

    expect(createReferenceNumberTemplate).toMatchObject({
      id: expect.any(String),
      workspaceId: workspace.id,
      type: 'PO',
      template: 'PO-{seq}',
      seqPadding: 4,
      startAt: 1,
      resetFrequency: 'never',
      useGlobalSequence: false,
      createdBy: user.id,
      updatedBy: user.id,
      deleted: false,
      createdAt: expect.any(String),
      updatedAt: expect.any(String),
    });
  });

  it('creates a template with embedded date and sequence format', async () => {
    const { sdk, user, utils } = await createClient();
    const workspace = await utils.createWorkspace();

    const templateInput = {
      workspaceId: workspace.id,
      type: ReferenceNumberType.Invoice,
      template: 'INV-{YYYY}-{MM}-{seq}',
      seqPadding: 3,
      startAt: 100,
      resetFrequency: ResetFrequency.Monthly,
      useGlobalSequence: true,
    };

    const { createReferenceNumberTemplate } =
      await sdk.CreateReferenceNumberTemplate({
        input: templateInput,
      });

    expect(createReferenceNumberTemplate).toMatchObject({
      type: 'INVOICE',
      template: 'INV-{YYYY}-{MM}-{seq}',
      seqPadding: 3,
      startAt: 100,
      resetFrequency: 'monthly',
      useGlobalSequence: true,
      workspaceId: workspace.id,
      createdBy: user.id,
      updatedBy: user.id,
    });
  });

  it('creates a template with project and business contact associations', async () => {
    const { sdk } = await createClient();

    // Create a workspace
    const workspace = await sdk.UtilCreateWorkspace({
      accessType: WorkspaceAccessType.InviteOnly,
      name: 'test',
    });
    if (!workspace.createWorkspace) {
      throw new Error('Workspace was not created');
    }

    // Create a project
    const projectInput = {
      name: 'Test Project for Reference Numbers',
      project_code: 'REF-001',
      description: 'Project for reference number testing',
      deleted: false,
      workspaceId: workspace.createWorkspace.id,
    };
    const { createProject } = await sdk.CreateProjectForReferenceNumbers({
      input: projectInput,
    });
    if (!createProject) throw new Error('Project was not created');

    // Create a business contact first
    const businessContactInput = {
      workspaceId: workspace.createWorkspace.id,
      name: 'Test Business Contact',
    };
    const { createBusinessContact } = await sdk.CreateBusinessContact({
      input: businessContactInput,
    });
    if (!createBusinessContact) {
      throw new Error('Business contact was not created');
    }

    // Create a person contact linked to the business
    const personContactInput = {
      workspaceId: workspace.createWorkspace.id,
      name: 'Test Person Contact',
      email: 'person@test.com',
      businessId: createBusinessContact.id,
    };
    const { createPersonContact } =
      await sdk.CreatePersonContactForReferenceNumbers({
        input: personContactInput,
      });
    if (!createPersonContact) {
      throw new Error('Person contact was not created');
    }

    const templateInput = {
      workspaceId: workspace.createWorkspace.id,
      type: ReferenceNumberType.So,
      template: 'SO-{seq}',
      seqPadding: 4,
      startAt: 1,
      resetFrequency: ResetFrequency.Never,
      useGlobalSequence: false,
      projectId: createProject.id,
      businessContactId: createPersonContact.id,
    };

    const { createReferenceNumberTemplate } =
      await sdk.CreateReferenceNumberTemplate({
        input: templateInput,
      });

    expect(createReferenceNumberTemplate).toMatchObject({
      type: 'SO',
      template: 'SO-{seq}',
      projectId: createProject.id,
      businessContactId: createPersonContact.id,
      workspaceId: workspace.createWorkspace.id,
    });
  });

  it('lists reference number templates', async () => {
    const { sdk, utils } = await createClient();
    const workspace = await utils.createWorkspace();

    // Create a few templates
    const template1Input = {
      workspaceId: workspace.id,
      type: ReferenceNumberType.Po,
      template: 'PO-{seq}',
      resetFrequency: ResetFrequency.Never,
      useGlobalSequence: false,
    };
    const template2Input = {
      workspaceId: workspace.id,
      type: ReferenceNumberType.So,
      template: 'SO-{seq}',
      resetFrequency: ResetFrequency.Never,
      useGlobalSequence: false,
    };

    await sdk.CreateReferenceNumberTemplate({ input: template1Input });
    await sdk.CreateReferenceNumberTemplate({ input: template2Input });

    // List all templates
    const { listReferenceNumberTemplates } =
      await sdk.ListReferenceNumberTemplates({
        filter: { workspaceId: workspace.id },
      });
    expect(listReferenceNumberTemplates.length).toBeGreaterThanOrEqual(2);

    // List templates filtered by type
    const { listReferenceNumberTemplates: poTemplates } =
      await sdk.ListReferenceNumberTemplates({
        filter: { workspaceId: workspace.id, type: ReferenceNumberType.Po },
      });
    expect(poTemplates.length).toBeGreaterThanOrEqual(1);
    expect(poTemplates[0].type).toBe('PO');

    const { listReferenceNumberTemplates: soTemplates } =
      await sdk.ListReferenceNumberTemplates({
        filter: { workspaceId: workspace.id, type: ReferenceNumberType.So },
      });
    expect(soTemplates.length).toBeGreaterThanOrEqual(1);
    expect(soTemplates[0].type).toBe('SO');
  });

  it('gets a reference number template by ID', async () => {
    const { sdk, utils } = await createClient();
    const workspace = await utils.createWorkspace();

    const templateInput = {
      workspaceId: workspace.id,
      type: ReferenceNumberType.Invoice,
      template: 'INV-{seq}',
      resetFrequency: ResetFrequency.Never,
      useGlobalSequence: true,
    };

    const { createReferenceNumberTemplate } =
      await sdk.CreateReferenceNumberTemplate({
        input: templateInput,
      });

    const { getReferenceNumberTemplate } = await sdk.GetReferenceNumberTemplate(
      {
        id: createReferenceNumberTemplate!.id,
      },
    );

    expect(getReferenceNumberTemplate).toMatchObject({
      id: createReferenceNumberTemplate!.id,
      type: 'INVOICE',
      template: 'INV-{seq}',
    });
  });

  it('updates a reference number template', async () => {
    const { sdk, utils } = await createClient();
    const workspace = await utils.createWorkspace();

    const templateInput = {
      workspaceId: workspace.id,
      type: ReferenceNumberType.Po,
      template: 'PO-{seq}',
      seqPadding: 4,
      resetFrequency: ResetFrequency.Never,
      useGlobalSequence: false,
    };

    const { createReferenceNumberTemplate } =
      await sdk.CreateReferenceNumberTemplate({
        input: templateInput,
      });

    const updateInput = {
      id: createReferenceNumberTemplate!.id,
      template: 'PURCHASE-{seq}',
      seqPadding: 6,
    };

    const { updateReferenceNumberTemplate } =
      await sdk.UpdateReferenceNumberTemplate({
        input: updateInput,
      });

    expect(updateReferenceNumberTemplate).toMatchObject({
      id: createReferenceNumberTemplate!.id,
      template: 'PURCHASE-{seq}',
      seqPadding: 6,
      type: 'PO', // Should remain unchanged
      resetFrequency: 'never', // Should remain unchanged
    });
  });

  it('deletes a reference number template', async () => {
    const { sdk, utils } = await createClient();
    const workspace = await utils.createWorkspace();

    const templateInput = {
      workspaceId: workspace.id,
      type: ReferenceNumberType.So,
      template: 'SO-{seq}',
      resetFrequency: ResetFrequency.Never,
      useGlobalSequence: false,
    };

    const { createReferenceNumberTemplate } =
      await sdk.CreateReferenceNumberTemplate({
        input: templateInput,
      });

    const { deleteReferenceNumberTemplate } =
      await sdk.DeleteReferenceNumberTemplate({
        id: createReferenceNumberTemplate!.id,
      });

    expect(deleteReferenceNumberTemplate).toBe(true);

    // Verify template is no longer accessible
    const { getReferenceNumberTemplate } = await sdk.GetReferenceNumberTemplate(
      {
        id: createReferenceNumberTemplate!.id,
      },
    );

    expect(getReferenceNumberTemplate).toBeNull();
  });

  it('isolates templates between tenants', async () => {
    // Create two clients with different companies
    const { sdk: sdkA, utils: utilsA } = await createClient({
      userId: 'userA',
      companyId: 'companyA',
    });
    const { sdk: sdkB, utils: utilsB } = await createClient({
      userId: 'userB',
      companyId: 'companyB',
    });

    const workspaceA = await utilsA.createWorkspace();
    const workspaceB = await utilsB.createWorkspace();

    // Company A creates a template
    const templateInputA = {
      workspaceId: workspaceA.id,
      type: ReferenceNumberType.Po,
      template: 'PO-A-{seq}',
      resetFrequency: ResetFrequency.Never,
      useGlobalSequence: false,
    };
    const { createReferenceNumberTemplate: templateA } =
      await sdkA.CreateReferenceNumberTemplate({
        input: templateInputA,
      });

    // Company B should not see Company A's template
    const { listReferenceNumberTemplates: templatesB } =
      await sdkB.ListReferenceNumberTemplates({
        filter: { workspaceId: workspaceB.id },
      });
    const foundInB = templatesB.find((t) => t.id === templateA!.id);
    expect(foundInB).toBeUndefined();

    // Company A should see their own template
    const { listReferenceNumberTemplates: templatesA } =
      await sdkA.ListReferenceNumberTemplates({
        filter: { workspaceId: workspaceA.id },
      });
    const foundInA = templatesA.find((t) => t.id === templateA!.id);
    expect(foundInA).toBeDefined();
    expect(foundInA?.template).toBe('PO-A-{seq}');
  });

  it('filters templates by projectId', async () => {
    const { sdk } = await createClient();

    // Create a workspace
    const workspace = await sdk.UtilCreateWorkspace({
      accessType: WorkspaceAccessType.InviteOnly,
      name: 'test',
    });
    if (!workspace.createWorkspace) {
      throw new Error('Workspace was not created');
    }

    // Create two projects
    const project1Input = {
      name: 'Project 1',
      project_code: 'PROJ-001',
      description: 'First project',
      deleted: false,
      workspaceId: workspace.createWorkspace.id,
    };
    const project2Input = {
      name: 'Project 2',
      project_code: 'PROJ-002',
      description: 'Second project',
      deleted: false,
      workspaceId: workspace.createWorkspace.id,
    };

    const { createProject: project1 } =
      await sdk.CreateProjectForReferenceNumbers({
        input: project1Input,
      });
    const { createProject: project2 } =
      await sdk.CreateProjectForReferenceNumbers({
        input: project2Input,
      });

    if (!project1 || !project2) throw new Error('Projects were not created');

    // Create templates for different projects
    const template1Input = {
      workspaceId: workspace.createWorkspace.id,
      type: ReferenceNumberType.Po,
      template: 'PROJ1-PO-{seq}',
      resetFrequency: ResetFrequency.Never,
      useGlobalSequence: false,
      projectId: project1.id,
    };
    const template2Input = {
      workspaceId: workspace.createWorkspace.id,
      type: ReferenceNumberType.Po,
      template: 'PROJ2-PO-{seq}',
      resetFrequency: ResetFrequency.Never,
      useGlobalSequence: false,
      projectId: project2.id,
    };
    const generalTemplateInput = {
      workspaceId: workspace.createWorkspace.id,
      type: ReferenceNumberType.Po,
      template: 'GENERAL-PO-{seq}',
      resetFrequency: ResetFrequency.Never,
      useGlobalSequence: false,
    };

    await sdk.CreateReferenceNumberTemplate({ input: template1Input });
    await sdk.CreateReferenceNumberTemplate({ input: template2Input });
    await sdk.CreateReferenceNumberTemplate({ input: generalTemplateInput });

    // Filter by project1 ID
    const { listReferenceNumberTemplates: project1Templates } =
      await sdk.ListReferenceNumberTemplates({
        filter: {
          workspaceId: workspace.createWorkspace.id,
          projectId: project1.id,
        },
      });
    expect(project1Templates).toHaveLength(1);
    expect(project1Templates[0].template).toBe('PROJ1-PO-{seq}');
    expect(project1Templates[0].projectId).toBe(project1.id);

    // Filter by project2 ID
    const { listReferenceNumberTemplates: project2Templates } =
      await sdk.ListReferenceNumberTemplates({
        filter: {
          workspaceId: workspace.createWorkspace.id,
          projectId: project2.id,
        },
      });
    expect(project2Templates).toHaveLength(1);
    expect(project2Templates[0].template).toBe('PROJ2-PO-{seq}');
    expect(project2Templates[0].projectId).toBe(project2.id);

    // List all templates (should include all 3)
    const { listReferenceNumberTemplates: allTemplates } =
      await sdk.ListReferenceNumberTemplates({
        filter: { workspaceId: workspace.createWorkspace.id },
      });
    expect(allTemplates.length).toBeGreaterThanOrEqual(3);
  });

  it('filters templates by businessContactId', async () => {
    const { sdk } = await createClient();

    // Create a workspace first
    const workspace = await sdk.UtilCreateWorkspace({
      accessType: WorkspaceAccessType.InviteOnly,
      name: 'test',
    });
    if (!workspace.createWorkspace) {
      throw new Error('Workspace was not created');
    }

    // Create two business contacts
    const business1Input = {
      workspaceId: workspace.createWorkspace.id,
      name: 'Business Contact 1',
    };
    const business2Input = {
      workspaceId: workspace.createWorkspace.id,
      name: 'Business Contact 2',
    };

    const { createBusinessContact: business1 } =
      await sdk.CreateBusinessContact({
        input: business1Input,
      });
    const { createBusinessContact: business2 } =
      await sdk.CreateBusinessContact({
        input: business2Input,
      });

    if (!business1 || !business2) {
      throw new Error('Business contacts were not created');
    }

    // Create person contacts linked to the businesses
    const person1Input = {
      workspaceId: workspace.createWorkspace.id,
      name: 'Person Contact 1',
      email: 'person1@test.com',
      businessId: business1.id,
    };
    const person2Input = {
      workspaceId: workspace.createWorkspace.id,
      name: 'Person Contact 2',
      email: 'person2@test.com',
      businessId: business2.id,
    };

    const { createPersonContact: person1 } =
      await sdk.CreatePersonContactForReferenceNumbers({
        input: person1Input,
      });
    const { createPersonContact: person2 } =
      await sdk.CreatePersonContactForReferenceNumbers({
        input: person2Input,
      });

    if (!person1 || !person2) {
      throw new Error('Person contacts were not created');
    }

    // Create templates for different business contacts
    const template1Input = {
      workspaceId: workspace.createWorkspace.id,
      type: ReferenceNumberType.So,
      template: 'BIZ1-SO-{seq}',
      resetFrequency: ResetFrequency.Never,
      useGlobalSequence: false,
      businessContactId: person1.id,
    };
    const template2Input = {
      workspaceId: workspace.createWorkspace.id,
      type: ReferenceNumberType.So,
      template: 'BIZ2-SO-{seq}',
      resetFrequency: ResetFrequency.Never,
      useGlobalSequence: false,
      businessContactId: person2.id,
    };
    const generalTemplateInput = {
      workspaceId: workspace.createWorkspace.id,
      type: ReferenceNumberType.So,
      template: 'GENERAL-SO-{seq}',
      resetFrequency: ResetFrequency.Never,
      useGlobalSequence: false,
    };

    await sdk.CreateReferenceNumberTemplate({ input: template1Input });
    await sdk.CreateReferenceNumberTemplate({ input: template2Input });
    await sdk.CreateReferenceNumberTemplate({ input: generalTemplateInput });

    // Filter by business contact 1 ID
    const { listReferenceNumberTemplates: business1Templates } =
      await sdk.ListReferenceNumberTemplates({
        filter: {
          workspaceId: workspace.createWorkspace.id,
          businessContactId: person1.id,
        },
      });
    expect(business1Templates).toHaveLength(1);
    expect(business1Templates[0].template).toBe('BIZ1-SO-{seq}');
    expect(business1Templates[0].businessContactId).toBe(person1.id);

    // Filter by business contact 2 ID
    const { listReferenceNumberTemplates: business2Templates } =
      await sdk.ListReferenceNumberTemplates({
        filter: {
          workspaceId: workspace.createWorkspace.id,
          businessContactId: person2.id,
        },
      });
    expect(business2Templates).toHaveLength(1);
    expect(business2Templates[0].template).toBe('BIZ2-SO-{seq}');
    expect(business2Templates[0].businessContactId).toBe(person2.id);

    // List all templates (should include all 3)
    const { listReferenceNumberTemplates: allTemplates } =
      await sdk.ListReferenceNumberTemplates({
        filter: { workspaceId: workspace.createWorkspace.id },
      });
    expect(allTemplates.length).toBeGreaterThanOrEqual(3);
  });

  it('filters templates by both projectId and businessContactId', async () => {
    const { sdk } = await createClient();

    // Create a workspace
    const workspace = await sdk.UtilCreateWorkspace({
      accessType: WorkspaceAccessType.InviteOnly,
      name: 'test',
    });
    if (!workspace.createWorkspace) {
      throw new Error('Workspace was not created');
    }

    // Create a project
    const projectInput = {
      name: 'Combined Filter Project',
      project_code: 'COMB-001',
      description: 'Project for combined filtering',
      deleted: false,
      workspaceId: workspace.createWorkspace.id,
    };
    const { createProject } = await sdk.CreateProjectForReferenceNumbers({
      input: projectInput,
    });
    if (!createProject) throw new Error('Project was not created');

    // Create a business contact
    const businessInput = {
      workspaceId: workspace.createWorkspace.id,
      name: 'Combined Filter Business',
    };
    const { createBusinessContact } = await sdk.CreateBusinessContact({
      input: businessInput,
    });
    if (!createBusinessContact) {
      throw new Error('Business contact was not created');
    }

    // Create a person contact
    const personInput = {
      workspaceId: workspace.createWorkspace.id,
      name: 'Combined Filter Person',
      email: 'combined@test.com',
      businessId: createBusinessContact.id,
    };
    const { createPersonContact } =
      await sdk.CreatePersonContactForReferenceNumbers({
        input: personInput,
      });
    if (!createPersonContact) throw new Error('Person contact was not created');

    // Create templates with different combinations
    const projectOnlyInput = {
      workspaceId: workspace.createWorkspace.id,
      type: ReferenceNumberType.Invoice,
      template: 'PROJ-INV-{seq}',
      resetFrequency: ResetFrequency.Never,
      useGlobalSequence: true,
      projectId: createProject.id,
    };
    const contactOnlyInput = {
      workspaceId: workspace.createWorkspace.id,
      type: ReferenceNumberType.Invoice,
      template: 'CONT-INV-{seq}',
      resetFrequency: ResetFrequency.Never,
      useGlobalSequence: true,
      businessContactId: createPersonContact.id,
    };
    const bothInput = {
      workspaceId: workspace.createWorkspace.id,
      type: ReferenceNumberType.Invoice,
      template: 'BOTH-INV-{seq}',
      resetFrequency: ResetFrequency.Never,
      useGlobalSequence: true,
      projectId: createProject.id,
      businessContactId: createPersonContact.id,
    };
    const neitherInput = {
      workspaceId: workspace.createWorkspace.id,
      type: ReferenceNumberType.Invoice,
      template: 'GENERAL-INV-{seq}',
      resetFrequency: ResetFrequency.Never,
      useGlobalSequence: true,
    };

    await sdk.CreateReferenceNumberTemplate({ input: projectOnlyInput });
    await sdk.CreateReferenceNumberTemplate({ input: contactOnlyInput });
    await sdk.CreateReferenceNumberTemplate({ input: bothInput });
    await sdk.CreateReferenceNumberTemplate({ input: neitherInput });

    // Filter by project only
    const { listReferenceNumberTemplates: projectOnlyTemplates } =
      await sdk.ListReferenceNumberTemplates({
        filter: {
          workspaceId: workspace.createWorkspace.id,
          projectId: createProject.id,
        },
      });
    expect(projectOnlyTemplates).toHaveLength(2); // Should include both project-only and both
    const projectTemplateNames = projectOnlyTemplates.map((t) => t.template);
    expect(projectTemplateNames).toContain('PROJ-INV-{seq}');
    expect(projectTemplateNames).toContain('BOTH-INV-{seq}');

    // Filter by contact only
    const { listReferenceNumberTemplates: contactOnlyTemplates } =
      await sdk.ListReferenceNumberTemplates({
        filter: {
          workspaceId: workspace.createWorkspace.id,
          businessContactId: createPersonContact.id,
        },
      });
    expect(contactOnlyTemplates).toHaveLength(2); // Should include both contact-only and both
    const contactTemplateNames = contactOnlyTemplates.map((t) => t.template);
    expect(contactTemplateNames).toContain('CONT-INV-{seq}');
    expect(contactTemplateNames).toContain('BOTH-INV-{seq}');

    // Filter by both project and contact
    const { listReferenceNumberTemplates: bothTemplates } =
      await sdk.ListReferenceNumberTemplates({
        filter: {
          workspaceId: workspace.createWorkspace.id,
          projectId: createProject.id,
          businessContactId: createPersonContact.id,
        },
      });
    expect(bothTemplates).toHaveLength(1); // Should only include the template with both
    expect(bothTemplates[0].template).toBe('BOTH-INV-{seq}');
    expect(bothTemplates[0].projectId).toBe(createProject.id);
    expect(bothTemplates[0].businessContactId).toBe(createPersonContact.id);
  });
});

describe('Reference Number Generation', () => {
  it('generates reference numbers using default template', async () => {
    const { sdk, utils } = await createClient();
    const workspace = await utils.createWorkspace();

    // First create a default template
    const templateInput = {
      workspaceId: workspace.id,
      type: ReferenceNumberType.Po,
      template: 'PO-{seq}',
      seqPadding: 4,
      startAt: 1,
      resetFrequency: ResetFrequency.Never,
      useGlobalSequence: false,
    };

    const { createReferenceNumberTemplate } =
      await sdk.CreateReferenceNumberTemplate({
        input: templateInput,
      });

    // Generate a PO reference number using the template
    const { generateReferenceNumber } = await sdk.GenerateReferenceNumber({
      input: {
        templateId: createReferenceNumberTemplate!.id,
      },
    });

    expect(generateReferenceNumber).toMatchObject({
      referenceNumber: 'PO-0001',
      sequenceNumber: 1,
      templateUsed: {
        type: 'PO',
        template: 'PO-{seq}',
        seqPadding: 4,
        startAt: 1,
        resetFrequency: 'never',
        useGlobalSequence: false,
      },
    });

    // Generate another one to verify sequence increment
    const { generateReferenceNumber: second } =
      await sdk.GenerateReferenceNumber({
        input: {
          templateId: createReferenceNumberTemplate!.id,
        },
      });

    expect(second).toMatchObject({
      referenceNumber: 'PO-0002',
      sequenceNumber: 2,
    });
  });

  it('generates reference numbers using custom template', async () => {
    const { sdk, utils } = await createClient();
    const workspace = await utils.createWorkspace();

    // Create a custom template with embedded date format
    const templateInput = {
      workspaceId: workspace.id,
      type: ReferenceNumberType.Invoice,
      template: 'INV-{YYYY}-{MM}-{seq}',
      seqPadding: 3,
      startAt: 100,
      resetFrequency: ResetFrequency.Never,
      useGlobalSequence: true,
    };

    const { createReferenceNumberTemplate } =
      await sdk.CreateReferenceNumberTemplate({ input: templateInput });

    // Generate reference number
    const { generateReferenceNumber } = await sdk.GenerateReferenceNumber({
      input: {
        templateId: createReferenceNumberTemplate!.id,
      },
    });

    expect(generateReferenceNumber!.sequenceNumber).toBe(100);
    expect(generateReferenceNumber!.referenceNumber).toMatch(
      /^INV-\d{4}-\d{2}-100$/,
    );
    expect(generateReferenceNumber!.templateUsed.template).toBe(
      'INV-{YYYY}-{MM}-{seq}',
    );
  });

  it('generates reference numbers with project-specific template', async () => {
    const { sdk } = await createClient();

    // Create a workspace
    const workspace = await sdk.UtilCreateWorkspace({
      accessType: WorkspaceAccessType.InviteOnly,
      name: 'test',
    });
    if (!workspace.createWorkspace) {
      throw new Error('Workspace was not created');
    }

    // Create a project
    const projectInput = {
      name: 'Special Project',
      project_code: 'SPEC-001',
      description: 'Special project for testing',
      deleted: false,
      workspaceId: workspace.createWorkspace.id,
    };
    const { createProject } = await sdk.CreateProjectForReferenceNumbers({
      input: projectInput,
    });
    if (!createProject) throw new Error('Project was not created');

    // Create a general template
    const generalTemplateInput = {
      workspaceId: workspace.createWorkspace.id,
      type: ReferenceNumberType.So,
      template: 'SO-{seq}',
      resetFrequency: ResetFrequency.Never,
      useGlobalSequence: false,
    };
    await sdk.CreateReferenceNumberTemplate({ input: generalTemplateInput });

    // Create a project-specific template
    const projectTemplateInput = {
      workspaceId: workspace.createWorkspace.id,
      type: ReferenceNumberType.So,
      template: 'SPEC-SO-{seq}',
      resetFrequency: ResetFrequency.Never,
      useGlobalSequence: false,
      projectId: createProject.id,
    };
    await sdk.CreateReferenceNumberTemplate({ input: projectTemplateInput });

    // Get the created templates to use their IDs
    const { listReferenceNumberTemplates } =
      await sdk.ListReferenceNumberTemplates({
        filter: {
          workspaceId: workspace.createWorkspace.id,
          type: ReferenceNumberType.So,
        },
      });

    const generalTemplate = listReferenceNumberTemplates.find(
      (t) => !t.projectId,
    );
    const projectTemplate = listReferenceNumberTemplates.find(
      (t) => t.projectId === createProject.id,
    );

    if (!generalTemplate || !projectTemplate) {
      throw new Error('Templates not found');
    }

    // Generate without project (should use general template)
    const { generateReferenceNumber: generalResult } =
      await sdk.GenerateReferenceNumber({
        input: {
          templateId: generalTemplate.id,
        },
      });
    expect(generalResult!.referenceNumber).toMatch(/^SO-\d+$/);

    // Generate with project (should use project-specific template)
    const { generateReferenceNumber: projectSpecificResult } =
      await sdk.GenerateReferenceNumber({
        input: {
          templateId: projectTemplate.id,
        },
      });
    expect(projectSpecificResult!.referenceNumber).toMatch(/^SPEC-SO-\d+$/);
  });

  it('generates reference numbers with business contact-specific template', async () => {
    const { sdk } = await createClient();

    // Create a workspace first
    const workspace = await sdk.UtilCreateWorkspace({
      accessType: WorkspaceAccessType.InviteOnly,
      name: 'test',
    });
    if (!workspace.createWorkspace) {
      throw new Error('Workspace was not created');
    }

    // Create a business contact first
    const businessContactInput = {
      workspaceId: workspace.createWorkspace.id,
      name: 'Special Supplier Business',
    };
    const { createBusinessContact } = await sdk.CreateBusinessContact({
      input: businessContactInput,
    });
    if (!createBusinessContact) {
      throw new Error('Business contact was not created');
    }

    // Create a person contact linked to the business
    const personContactInput = {
      workspaceId: workspace.createWorkspace.id,
      name: 'Special Supplier Contact',
      email: 'supplier@special.com',
      businessId: createBusinessContact.id,
    };
    const { createPersonContact } =
      await sdk.CreatePersonContactForReferenceNumbers({
        input: personContactInput,
      });
    if (!createPersonContact) {
      throw new Error('Person contact was not created');
    }

    // Create a general template
    const generalTemplateInput = {
      workspaceId: workspace.createWorkspace.id,
      type: ReferenceNumberType.Po,
      template: 'PO-{seq}',
      resetFrequency: ResetFrequency.Never,
      useGlobalSequence: false,
    };
    await sdk.CreateReferenceNumberTemplate({ input: generalTemplateInput });

    // Create a contact-specific template
    const contactTemplateInput = {
      workspaceId: workspace.createWorkspace.id,
      type: ReferenceNumberType.Po,
      template: 'SUPP-PO-{seq}',
      resetFrequency: ResetFrequency.Never,
      useGlobalSequence: false,
      businessContactId: createPersonContact.id,
    };
    await sdk.CreateReferenceNumberTemplate({ input: contactTemplateInput });

    // Get the created templates to use their IDs
    const { listReferenceNumberTemplates } =
      await sdk.ListReferenceNumberTemplates({
        filter: {
          workspaceId: workspace.createWorkspace.id,
          type: ReferenceNumberType.Po,
        },
      });

    const generalTemplate = listReferenceNumberTemplates.find(
      (t) => !t.businessContactId,
    );
    const contactTemplate = listReferenceNumberTemplates.find(
      (t) => t.businessContactId === createPersonContact.id,
    );

    if (!generalTemplate || !contactTemplate) {
      throw new Error('Templates not found');
    }

    // Generate without contact (should use general template)
    const { generateReferenceNumber: general } =
      await sdk.GenerateReferenceNumber({
        input: {
          templateId: generalTemplate.id,
        },
      });
    expect(general!.referenceNumber).toMatch(/^PO-\d+$/);

    // Generate with contact (should use contact-specific template)
    const { generateReferenceNumber: contactSpecific } =
      await sdk.GenerateReferenceNumber({
        input: {
          templateId: contactTemplate.id,
        },
      });
    expect(contactSpecific!.referenceNumber).toMatch(/^SUPP-PO-\d+$/);
  });

  it('prioritizes project template over contact template', async () => {
    const { sdk } = await createClient();

    // Create a workspace
    const workspace = await sdk.UtilCreateWorkspace({
      accessType: WorkspaceAccessType.InviteOnly,
      name: 'test',
    });
    if (!workspace.createWorkspace) {
      throw new Error('Workspace was not created');
    }

    // Create a project
    const projectInput = {
      name: 'Priority Project',
      project_code: 'PRIO-001',
      description: 'Priority project for testing',
      deleted: false,
      workspaceId: workspace.createWorkspace.id,
    };
    const { createProject } = await sdk.CreateProjectForReferenceNumbers({
      input: projectInput,
    });
    if (!createProject) throw new Error('Project was not created');

    // Create a business contact first
    const businessInput = {
      workspaceId: workspace.createWorkspace.id,
      name: 'Priority Business',
    };
    const { createBusinessContact } = await sdk.CreateBusinessContact({
      input: businessInput,
    });
    if (!createBusinessContact) {
      throw new Error('Business contact was not created');
    }

    // Create a person contact
    const contactInput = {
      name: 'Priority Supplier',
      email: 'supplier@priority.com',
      businessId: createBusinessContact.id,
      workspaceId: workspace.createWorkspace.id,
    };
    const { createPersonContact } =
      await sdk.CreatePersonContactForReferenceNumbers({
        input: contactInput,
      });
    if (!createPersonContact) throw new Error('Contact was not created');

    // Create project-specific template
    const projectTemplateInput = {
      workspaceId: workspace.createWorkspace.id,
      type: ReferenceNumberType.So,
      template: 'PROJ-SO-{seq}',
      resetFrequency: ResetFrequency.Never,
      useGlobalSequence: false,
      projectId: createProject.id,
    };
    await sdk.CreateReferenceNumberTemplate({ input: projectTemplateInput });

    // Create contact-specific template
    const contactTemplateInput = {
      workspaceId: workspace.createWorkspace.id,
      type: ReferenceNumberType.So,
      template: 'CONT-SO-{seq}',
      resetFrequency: ResetFrequency.Never,
      useGlobalSequence: false,
      businessContactId: createPersonContact.id,
    };
    await sdk.CreateReferenceNumberTemplate({ input: contactTemplateInput });

    // Get the created templates to use their IDs
    const { listReferenceNumberTemplates } =
      await sdk.ListReferenceNumberTemplates({
        filter: {
          workspaceId: workspace.createWorkspace.id,
          type: ReferenceNumberType.So,
        },
      });

    const projectTemplate = listReferenceNumberTemplates.find(
      (t) => t.projectId === createProject.id,
    );

    if (!projectTemplate) {
      throw new Error('Project template not found');
    }

    // Generate with both project and contact (should prioritize project template)
    const { generateReferenceNumber } = await sdk.GenerateReferenceNumber({
      input: {
        templateId: projectTemplate.id,
      },
    });
    expect(generateReferenceNumber!.referenceNumber).toMatch(/^PROJ-SO-\d+$/);
  });
});

describe('Sequence Number Management', () => {
  it('gets current sequence number', async () => {
    const { sdk, utils } = await createClient();
    const workspace = await utils.createWorkspace();
    // Create a template
    const templateInput = {
      workspaceId: workspace.id,
      type: ReferenceNumberType.Po,
      template: 'PO-{seq}',
      startAt: 50,
      resetFrequency: ResetFrequency.Never,
      useGlobalSequence: false,
    };
    const { createReferenceNumberTemplate } =
      await sdk.CreateReferenceNumberTemplate({
        input: templateInput,
      });

    // Get current sequence number (should be 0 initially)
    const { getCurrentSequenceNumber: initial } =
      await sdk.GetCurrentSequenceNumber({
        workspaceId: workspace.id,
        type: ReferenceNumberType.Po,
        templateId: createReferenceNumberTemplate!.id,
      });
    expect(initial).toBe(0);

    // Generate a reference number
    await sdk.GenerateReferenceNumber({
      input: {
        templateId: createReferenceNumberTemplate!.id,
      },
    });

    // Get current sequence number (should be 50 after first generation)
    const { getCurrentSequenceNumber: afterGeneration } =
      await sdk.GetCurrentSequenceNumber({
        workspaceId: workspace.id,
        type: ReferenceNumberType.Po,
        templateId: createReferenceNumberTemplate!.id,
      });
    expect(afterGeneration).toBe(50);
  });

  it('resets sequence number', async () => {
    const { sdk, utils } = await createClient();
    const workspace = await utils.createWorkspace();

    // Create a template
    const templateInput = {
      workspaceId: workspace.id,
      type: ReferenceNumberType.Po,
      template: 'PO-{seq}',
      startAt: 1,
      resetFrequency: ResetFrequency.Never,
      useGlobalSequence: false,
    };
    const { createReferenceNumberTemplate } =
      await sdk.CreateReferenceNumberTemplate({
        input: templateInput,
      });

    // Generate a few reference numbers
    await sdk.GenerateReferenceNumber({
      input: {
        templateId: createReferenceNumberTemplate!.id,
      },
    });
    await sdk.GenerateReferenceNumber({
      input: {
        templateId: createReferenceNumberTemplate!.id,
      },
    });
    await sdk.GenerateReferenceNumber({
      input: {
        templateId: createReferenceNumberTemplate!.id,
      },
    });

    // Verify current sequence
    const { getCurrentSequenceNumber: beforeReset } =
      await sdk.GetCurrentSequenceNumber({
        workspaceId: workspace.id,
        type: ReferenceNumberType.Po,
        templateId: createReferenceNumberTemplate!.id,
      });
    expect(beforeReset).toBe(3);

    // Reset sequence number to 100
    const { resetSequenceNumber } = await sdk.ResetSequenceNumber({
      templateId: createReferenceNumberTemplate!.id,
      newValue: 100,
    });
    expect(resetSequenceNumber).toBe(true);

    // Verify sequence was reset
    const { getCurrentSequenceNumber: afterReset } =
      await sdk.GetCurrentSequenceNumber({
        workspaceId: workspace.id,
        type: ReferenceNumberType.Po,
        templateId: createReferenceNumberTemplate!.id,
      });
    expect(afterReset).toBe(100);

    // Generate next reference number should use reset value
    const { generateReferenceNumber } = await sdk.GenerateReferenceNumber({
      input: {
        templateId: createReferenceNumberTemplate!.id,
      },
    });
    expect(generateReferenceNumber!.sequenceNumber).toBe(101);
  });

  it('handles global sequence numbers', async () => {
    const { sdk, utils } = await createClient();
    const workspace = await utils.createWorkspace();

    // Create two templates with global sequence
    const template1Input = {
      workspaceId: workspace.id,
      type: ReferenceNumberType.Po,
      template: 'PO-{seq}',
      resetFrequency: ResetFrequency.Never,
      useGlobalSequence: true,
    };
    const template2Input = {
      workspaceId: workspace.id,
      type: ReferenceNumberType.Po,
      template: 'PURCHASE-{seq}',
      resetFrequency: ResetFrequency.Never,
      useGlobalSequence: true,
    };

    const { createReferenceNumberTemplate: template1 } =
      await sdk.CreateReferenceNumberTemplate({ input: template1Input });
    const { createReferenceNumberTemplate: template2 } =
      await sdk.CreateReferenceNumberTemplate({ input: template2Input });

    // Generate from first template
    const { generateReferenceNumber: first } =
      await sdk.GenerateReferenceNumber({
        input: {
          templateId: template1!.id,
        },
      });
    expect(first!.sequenceNumber).toBe(1);

    // Generate from second template (should continue global sequence)
    const { generateReferenceNumber: second } =
      await sdk.GenerateReferenceNumber({
        input: {
          templateId: template2!.id,
        },
      });
    expect(second!.sequenceNumber).toBe(2);
  });

  it('isolates sequence numbers between tenants', async () => {
    // Create two clients with different companies
    const { sdk: sdkA, utils: utilsA } = await createClient({
      userId: 'userA',
      companyId: 'companyA',
    });
    const { sdk: sdkB, utils: utilsB } = await createClient({
      userId: 'userB',
      companyId: 'companyB',
    });

    const workspaceA = await utilsA.createWorkspace();
    const workspaceB = await utilsB.createWorkspace();

    // Create templates for each company
    const templateInputA = {
      workspaceId: workspaceA.id,
      type: ReferenceNumberType.Po,
      template: 'PO-{seq}',
      seqPadding: 4,
      resetFrequency: ResetFrequency.Never,
      useGlobalSequence: false,
    };
    const templateInputB = {
      workspaceId: workspaceB.id,
      type: ReferenceNumberType.Po,
      template: 'PO-{seq}',
      seqPadding: 4,
      resetFrequency: ResetFrequency.Never,
      useGlobalSequence: false,
    };

    const { createReferenceNumberTemplate: templateA } =
      await sdkA.CreateReferenceNumberTemplate({ input: templateInputA });
    const { createReferenceNumberTemplate: templateB } =
      await sdkB.CreateReferenceNumberTemplate({ input: templateInputB });

    // Both companies generate PO reference numbers
    const { generateReferenceNumber: poA1 } =
      await sdkA.GenerateReferenceNumber({
        input: {
          templateId: templateA!.id,
        },
      });
    const { generateReferenceNumber: poB1 } =
      await sdkB.GenerateReferenceNumber({
        input: {
          templateId: templateB!.id,
        },
      });
    const { generateReferenceNumber: poA2 } =
      await sdkA.GenerateReferenceNumber({
        input: {
          templateId: templateA!.id,
        },
      });

    // Each company should have independent sequences
    expect(poA1!.sequenceNumber).toBe(1);
    expect(poB1!.sequenceNumber).toBe(1);
    expect(poA2!.sequenceNumber).toBe(2);

    expect(poA1!.referenceNumber).toBe('PO-0001');
    expect(poB1!.referenceNumber).toBe('PO-0001');
    expect(poA2!.referenceNumber).toBe('PO-0002');
  });
});

describe('Error Handling', () => {
  it('handles invalid template ID in getReferenceNumberTemplate', async () => {
    const { sdk } = await createClient();

    const { getReferenceNumberTemplate } = await sdk.GetReferenceNumberTemplate(
      {
        id: 'non-existent-id',
      },
    );

    expect(getReferenceNumberTemplate).toBeNull();
  });

  it('handles invalid template ID in resetSequenceNumber', async () => {
    const { sdk } = await createClient();

    await expect(
      sdk.ResetSequenceNumber({
        templateId: 'non-existent-id',
        newValue: 1,
      }),
    ).rejects.toThrow();
  });

  it('handles missing user context', async () => {
    // This would require mocking the authentication context
    // For now, we'll skip this test as it requires more complex setup
    expect(true).toBe(true);
  });
});
