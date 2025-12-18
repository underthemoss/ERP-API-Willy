import { gql } from 'graphql-request';
import { createTestEnvironment } from './test-environment';
import { v4 } from 'uuid';

gql`
  mutation UpsertTestUser($id: String!, $input: UserUpsertInput!) {
    upsertUser(id: $id, input: $input) {
      id
      email
      firstName
      lastName
      companyId
    }
  }
`;

gql`
  mutation SyncCurrentUser {
    syncCurrentUser {
      id
      email
      firstName
      lastName
      companyId
    }
  }
`;

describe('User Upsert', () => {
  const { createClient, getMongoClient } = createTestEnvironment();

  it('should upsert a user directly', async () => {
    const { sdk } = await createClient();
    const userId = v4();

    const result = await sdk.UpsertTestUser({
      id: userId,
      input: {
        email: `${userId}@example.com`,
        firstName: 'Test',
        lastName: 'User',
        companyId: 'test-company',
      },
    });

    expect(result.upsertUser).toBeDefined();
    expect(result.upsertUser?.email).toBe(`${userId}@example.com`);
  });

  it('should automatically upsert user when creating workspace', async () => {
    const { user, utils } = await createClient({
      userId: 'workspace-test-user',
      userName: 'Workspace Test User',
      userEmail: 'workspace.test@example.com',
      companyId: 'workspace-test-company',
    });

    // Create workspace - this should also upsert the user
    const workspace = await utils.createWorkspace();
    expect(workspace).toBeDefined();
    expect(workspace.id).toBeDefined();

    // Verify the user was created in the database
    const mongoClient = getMongoClient();
    const db = mongoClient.db('es-erp');
    const usersCollection = db.collection<any>('users');

    const dbUser = await usersCollection.findOne({ _id: user.id });
    expect(dbUser).toBeDefined();
    expect(dbUser?.email).toBe('workspace.test@example.com');
    expect(dbUser?.company_id).toBe('workspace-test-company');
  });

  it('should handle user upsert gracefully if user already exists', async () => {
    const { utils } = await createClient({
      userId: 'existing-user',
      userName: 'Existing User',
      userEmail: 'existing@example.com',
      companyId: 'existing-company',
    });

    // Create workspace first time - should create user
    const workspace1 = await utils.createWorkspace();
    expect(workspace1).toBeDefined();

    // Create another workspace with same user - should not fail
    const workspace2 = await utils.createWorkspace();
    expect(workspace2).toBeDefined();
    expect(workspace2.id).not.toBe(workspace1.id);
  });
});
