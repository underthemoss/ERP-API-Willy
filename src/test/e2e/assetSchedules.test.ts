import { gql } from 'graphql-request';
import { createTestEnvironment } from './test-environment';
import { WorkspaceAccessType } from './generated/graphql';

gql`
  query ListAssetsForAssetSchedule($limit: Int) {
    listAssets(page: { size: $limit }) {
      items {
        id
        description
        company_id
      }
    }
  }
`;

gql`
  mutation CreateProjectForAssetSchedule($input: ProjectInput) {
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
  mutation CreateAssetScheduleForAssetSchedule($input: AssetScheduleInput) {
    createAssetSchedule(input: $input) {
      id
      asset_id
      project_id
      company_id
      start_date
      end_date
      created_at
      created_by
      updated_at
      updated_by
    }
  }
`;

const { createClient } = createTestEnvironment();

it('creates an asset schedule', async () => {
  const { sdk } = await createClient();

  // Create a workspace
  const { createWorkspace } = await sdk.UtilCreateWorkspace({
    accessType: WorkspaceAccessType.SameDomain,
    name: 'Asset Schedule Test Workspace',
  });
  if (!createWorkspace) throw new Error('Workspace was not created');

  // 2. Create a project
  const projectInput = {
    name: 'Asset Schedule Test Project',
    project_code: 'ASCH-001',
    description: 'Project for asset schedule test',
    deleted: false,
    workspaceId: createWorkspace.id,
  };
  const projectResult = await sdk.CreateProjectForAssetSchedule({
    input: projectInput,
  });
  const project = projectResult.createProject;
  if (!project || !project.id) {
    throw new Error('Project was not created for asset schedule test');
  }

  // 3. Create an asset schedule
  const now = new Date();
  const startDate = now.toISOString();
  const endDate = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString(); // +1 day

  const assetScheduleInput = {
    asset_id: '123',
    project_id: project.id,
    start_date: startDate,
    end_date: endDate,
  };

  const scheduleResult = await sdk.CreateAssetScheduleForAssetSchedule({
    input: assetScheduleInput,
  });
  const schedule = scheduleResult.createAssetSchedule;
  expect(schedule).toBeDefined();
  expect(schedule).toMatchObject({
    asset_id: '123',
    project_id: project.id,
    start_date: startDate,
    end_date: endDate,
  });
});
