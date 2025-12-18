import gql from 'graphql-tag';
import { createTestEnvironment } from './test-environment';

// --- GraphQL Operations for codegen ---
export const CREATE_WORKFLOW_CONFIGURATION = gql`
  mutation CreateWorkflowConfiguration(
    $input: CreateWorkflowConfigurationInput!
  ) {
    createWorkflowConfiguration(input: $input) {
      id
      name
      companyId
      columns {
        id
        name
      }
      createdBy
      updatedBy
      createdAt
      updatedAt
    }
  }
`;

export const LIST_WORKFLOW_CONFIGURATIONS = gql`
  query ListWorkflowConfigurations($page: ListWorkflowConfigurationsPage) {
    listWorkflowConfigurations(page: $page) {
      items {
        id
        name
        columns {
          id
          name
        }
      }
      page {
        number
        size
      }
    }
  }
`;

export const GET_WORKFLOW_CONFIGURATION_BY_ID = gql`
  query GetWorkflowConfigurationById($id: ID!) {
    getWorkflowConfigurationById(id: $id) {
      id
      name
      companyId
      columns {
        id
        name
      }
      createdBy
      updatedBy
      createdAt
      updatedAt
    }
  }
`;

export const UPDATE_WORKFLOW_CONFIGURATION = gql`
  mutation UpdateWorkflowConfiguration(
    $id: ID!
    $input: UpdateWorkflowConfigurationInput!
  ) {
    updateWorkflowConfiguration(id: $id, input: $input) {
      id
      name
      columns {
        id
        name
      }
    }
  }
`;

export const DELETE_WORKFLOW_CONFIGURATION_BY_ID = gql`
  mutation DeleteWorkflowConfigurationById($id: ID!) {
    deleteWorkflowConfigurationById(id: $id)
  }
`;
// --- End GraphQL Operations ---
const { createClient } = createTestEnvironment();
describe('WorkflowConfiguration GraphQL e2e', () => {
  it('creates a workflow configuration', async () => {
    const { sdk, user } = await createClient();
    const res = await sdk.CreateWorkflowConfiguration({
      input: {
        name: 'Test Workflow',
        columns: [
          { id: 'col-1', name: 'Column 1' },
          { id: 'col-2', name: 'Column 2' },
        ],
      },
    });

    expect(res.createWorkflowConfiguration).toBeDefined();
    const config = res.createWorkflowConfiguration!;
    expect(config.name).toBe('Test Workflow');
    expect(config.companyId).toBe(user.companyId);
    expect(config.columns).toHaveLength(2);
  });

  it('lists workflow configurations with pagination', async () => {
    const { sdk } = await createClient();
    // Create 10 workflow configurations
    const createdConfigs: any[] = [];
    for (let i = 0; i < 10; i++) {
      const res = await sdk.CreateWorkflowConfiguration({
        input: {
          name: `Test Workflow ${i}`,
          columns: [
            { id: `col-1-${i}`, name: 'Column 1' },
            { id: `col-2-${i}`, name: 'Column 2' },
          ],
        },
      });
      createdConfigs.push(res.createWorkflowConfiguration);
    }
    const res2 = await sdk.ListWorkflowConfigurations({
      page: { number: 1, size: 10 },
    });

    expect(res2.listWorkflowConfigurations).toBeDefined();
    const result = res2.listWorkflowConfigurations!;
    expect(Array.isArray(result.items)).toBe(true);
    expect(result.items.length).toBe(10);

    expect(result.page.size).toBe(10);
    // Check that at least one of the created configs is in the result
    const createdIds = createdConfigs.map((c) => c.id);
    const resultIds = result.items.map((i) => i.id);
    expect(resultIds.some((id) => createdIds.includes(id))).toBe(true);
  });

  it('gets workflow configuration by id', async () => {
    const { sdk } = await createClient();
    const res1 = await sdk.CreateWorkflowConfiguration({
      input: {
        name: 'Test Workflow',
        columns: [
          { id: 'col-1', name: 'Column 1' },
          { id: 'col-2', name: 'Column 2' },
        ],
      },
    });
    const createdId = res1.createWorkflowConfiguration?.id!;
    const res = await sdk.GetWorkflowConfigurationById({ id: createdId });

    expect(res.getWorkflowConfigurationById).toBeDefined();
    const config = res.getWorkflowConfigurationById!;
    expect(config.id).toBe(createdId);
    expect(config.name).toBe('Test Workflow');
    expect(config.columns).toHaveLength(2);
  });

  it('updates a workflow configuration', async () => {
    const { sdk } = await createClient();
    const res1 = await sdk.CreateWorkflowConfiguration({
      input: {
        name: 'Test Workflow',
        columns: [
          { id: 'col-1', name: 'Column 1' },
          { id: 'col-2', name: 'Column 2' },
        ],
      },
    });
    const createdId = res1.createWorkflowConfiguration?.id!;
    const res = await sdk.UpdateWorkflowConfiguration({
      id: createdId,
      input: {
        name: 'Updated Workflow',
        columns: [
          { id: 'col-1', name: 'Column 1' },
          { id: 'col-3', name: 'Column 3' },
        ],
      },
    });

    expect(res.updateWorkflowConfiguration).toBeDefined();
    const config = res.updateWorkflowConfiguration!;
    expect(config.name).toBe('Updated Workflow');
    expect(config.columns).toHaveLength(2);
    expect(config.columns[1].id).toBe('col-3');
  });

  it('deletes a workflow configuration', async () => {
    const { sdk } = await createClient();
    const res1 = await sdk.CreateWorkflowConfiguration({
      input: {
        name: 'Test Workflow',
        columns: [
          { id: 'col-1', name: 'Column 1' },
          { id: 'col-2', name: 'Column 2' },
        ],
      },
    });
    const createdId = res1.createWorkflowConfiguration?.id!;
    const res = await sdk.DeleteWorkflowConfigurationById({ id: createdId });

    expect(res.deleteWorkflowConfigurationById).toBe(true);
  });
});
