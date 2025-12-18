import { gql } from 'graphql-request';
import path from 'path';
import fs from 'fs';
import { type EnvConfig } from '../../config';
import {
  getSdk,
  WorkspaceAccessType,
  WorkspaceUserRole,
} from './generated/graphql';
import { JWTPayload } from '../../authentication';
import invariant from 'tiny-invariant';
import { v4 } from 'uuid';

type GlobalConfig = {
  mongoUri: string;
  kafkaBootstrap: string;
  spicedbEndpoint: string;
  spicedbToken: string;
  redisHost: string;
  redisPort: number;
};

gql`
  mutation UtilCreatePimCategory($input: UpsertPimCategoryInput!) {
    upsertPimCategory(input: $input) {
      id
      name
      path
    }
  }

  mutation UtilCreateWorkspace(
    $accessType: WorkspaceAccessType!
    $name: String!
  ) {
    createWorkspace(accessType: $accessType, name: $name) {
      id
      name
    }
  }
`;

gql`
  mutation UtilInviteUserToWorkspace(
    $workspaceId: String!
    $email: String!
    $roles: [WorkspaceUserRole!]!
  ) {
    inviteUserToWorkspace(
      workspaceId: $workspaceId
      email: $email
      roles: $roles
    ) {
      userId
      roles
    }
  }
`;

export function getTestEnvConfig(
  envOverrides: Record<string, string> = {},
): EnvConfig {
  // Check if global instances are available
  const globalConfigPath = path.join(__dirname, 'globalConfig.json');
  if (!fs.existsSync(globalConfigPath)) {
    throw new Error('Global config file not found');
  }

  // Use global MongoDB and Kafka instances
  const globalConfig: GlobalConfig = JSON.parse(
    fs.readFileSync(globalConfigPath, 'utf-8'),
  );
  const mongoUri = globalConfig.mongoUri;
  const kafkaBootstrap = globalConfig.kafkaBootstrap;

  // Set environment variables for the test, with sensible defaults for e2e
  return {
    ...process.env,
    DISABLE_KAFKA: true,
    MONGO_CONNECTION_STRING: mongoUri,
    KAFKA_API_URL: kafkaBootstrap,
    KAFKA_API_KEY: '',
    KAFKA_API_SECRET: '',
    KAFKA_SCHEMA_REG_API_URL: '',
    KAFKA_SCHEMA_REG_API_KEY: '',
    KAFKA_SCHEMA_REG_API_SECRET: '',
    OPENAI_API_KEY: '',
    FILE_SERVICE_KEY: '',
    FILE_SERVICE_SECRET: '',
    FILE_SERVICE_BUCKET: '',
    IN_TEST_MODE: true,
    REDIS_HOST: globalConfig.redisHost,
    REDIS_PORT: globalConfig.redisPort,
    SPICEDB_ENDPOINT: globalConfig.spicedbEndpoint,
    SPICEDB_TOKEN: globalConfig.spicedbToken,
    ...envOverrides,
  } as EnvConfig;
}

export function testUtils(
  sdk: ReturnType<typeof getSdk>,
  userJWTPayload: Partial<JWTPayload>,
) {
  const syncCurrentUser = async () => {
    // Sync the current user to ensure it exists in the database
    // This replicates what the Auth0 post-login webhook does
    const { syncCurrentUser } = await sdk.SyncCurrentUser();
    return syncCurrentUser;
  };

  const createWorkspace = async () => {
    // First, sync the test user to ensure it exists in the database
    await syncCurrentUser();

    const { createWorkspace } = await sdk.UtilCreateWorkspace({
      name: `Test Workspace for ${userJWTPayload.uid}`,
      accessType: WorkspaceAccessType.InviteOnly,
    });

    if (!createWorkspace?.id) {
      throw new Error('Failed to create workspace');
    }

    return createWorkspace;
  };

  const createPriceBookAndPrices = async (workspaceId: string) => {
    const { upsertPimCategory } = await sdk.CreatePimCategoryForPrices({
      input: {
        id: 'update-price-cat-1',
        name: 'Update Price Category',
        path: '|UP|',
        platform_id: 'update-price-platform',
        description: 'update price cat',
        has_products: false,
      },
    });
    if (!upsertPimCategory) throw new Error('failed to create pim category');

    // Create a price book
    const { createPriceBook: priceBook } = await sdk.CreatePriceBookForPrices({
      input: { name: 'Test Price Book', workspaceId },
    });
    if (!priceBook) throw new Error('failed to create price book');
    const priceBookId = priceBook.id;

    // Create a rental price
    const { createRentalPrice: rentalPrice } =
      await sdk.CreateRentalPriceForPrices({
        input: {
          workspaceId,
          name: 'Original Rental Price',
          pimCategoryId: upsertPimCategory.id,
          priceBookId,
          pricePerDayInCents: 100,
          pricePerWeekInCents: 500,
          pricePerMonthInCents: 1500,
        },
      });

    invariant(rentalPrice, 'failed to create rental price');

    return {
      priceBook,
      rentalPrice,
    };
  };

  const inviteUserToWorkspace = async (
    workspaceId: string,
    email: string,
    roles?: WorkspaceUserRole[],
    userId?: string,
  ) => {
    // First ensure the user exists in the database
    const invitedUserId = userId || v4();
    await sdk.UpsertTestUser({
      id: invitedUserId,
      input: {
        firstName: 'Invited',
        lastName: 'User',
        email,
        companyId: userJWTPayload.es_company_id,
        auth0UserId: invitedUserId,
        esUserId: invitedUserId,
      },
    });

    // Then invite them to the workspace
    const { inviteUserToWorkspace } = await sdk.InviteUserToWorkspace({
      workspaceId,
      email,
      roles: roles || [WorkspaceUserRole.AllResourcesReader],
    });

    if (!inviteUserToWorkspace) {
      throw new Error('Failed to invite user to workspace');
    }

    return inviteUserToWorkspace;
  };

  return {
    syncCurrentUser,
    createWorkspace,
    createPriceBookAndPrices,
    inviteUserToWorkspace,
  };
}
