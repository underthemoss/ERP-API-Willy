import type { JWTPayload, UserAuthPayload } from '../../authentication';
import { GraphQLClient } from 'graphql-request';
import { getSdk } from './generated/graphql';
import { MongoClient, ServerApiVersion } from 'mongodb';
import fs from 'fs';
import path from 'path';
import { v4 } from 'uuid';
import { GlobalConfig } from './types';
import { createClient, AuthzedClient } from '../../lib/authz/spiceDB-client';
import { v1 } from '@authzed/authzed-node';
import { testUtils } from './test-utils';
import { createJWTService } from '../../services/jwt';
import { type EnvConfig } from '../../config';

/**
 * Mint a real, signed JWT token for testing using the JWT service
 */
export async function mintTestJwtToken(
  overrides: Partial<JWTPayload> = {},
  globalConfig?: GlobalConfig,
): Promise<string> {
  const userId = overrides.es_user_id || v4();
  const userEmail = overrides.es_user_email || `${userId}@example.com`;

  // Create the user auth payload for the JWT service
  const userAuthPayload: UserAuthPayload = {
    id: overrides.uid || userId,
    companyId: overrides.es_company_id || 'test-company-id',
    auth0Sub: overrides.sub || userId,
    email: overrides.email || userEmail,
    es_erp_roles: overrides.es_erp_roles,
  };

  // Load global config if not provided
  if (!globalConfig) {
    globalConfig = loadGlobalConfig();
  }

  // Create a minimal envConfig object with only JWT keys from global config
  const envConfig = {
    JWT_PRIVATE_KEY: globalConfig.jwtPrivateKey,
    JWT_PUBLIC_KEY: globalConfig.jwtPublicKey,
    JWT_TOKEN_EXPIRY: globalConfig.jwtTokenExpiry,
  } as EnvConfig;

  const jwtService = createJWTService(envConfig);
  const token = await jwtService.signToken(userAuthPayload);

  return token;
}

async function createTestClient(
  url: string,
  userOverrides: Partial<JWTPayload> = {},
) {
  // Default user info, can be overridden
  const userId = userOverrides.es_user_id || v4();
  const userJWTPayload = {
    es_user_name: 'GraphQL Test User',
    es_user_email: 'graphql-test@example.com',
    email: 'graphql-test@example.com',
    es_user_id: userId,
    es_company_id: 'test-company-id',
    // uid is now how users are keyed, not t3 user id
    uid: userId,
    ...userOverrides,
  };
  const token = await mintTestJwtToken({ ...userJWTPayload });
  const user: UserAuthPayload = {
    id: userJWTPayload.uid,
    companyId: userJWTPayload.es_company_id,
    auth0Sub: userJWTPayload.sub || userId,
    email: userJWTPayload.email,
  };

  const client = new GraphQLClient(`${url}/graphql`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const sdk = getSdk(client);

  // HTTP client for non-GraphQL endpoints
  const httpClient = {
    fetch: async (path: string, options?: RequestInit) => {
      return fetch(`${url}${path}`, {
        ...options,
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          ...options?.headers,
        },
      });
    },
  };

  return {
    sdk,
    user,
    client,
    httpClient,
    utils: testUtils(sdk, userJWTPayload),
  };
}

function createAnonTestClient(url: string) {
  const client = new GraphQLClient(`${url}/graphql`);

  const sdk = getSdk(client);

  // HTTP client for non-GraphQL endpoints (no auth header)
  const httpClient = {
    fetch: async (path: string, options?: RequestInit) => {
      return fetch(`${url}${path}`, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options?.headers,
        },
      });
    },
  };

  return { sdk, client, httpClient };
}

/**
 * Load global config that contains the server URL and other service endpoints
 */
function loadGlobalConfig(): GlobalConfig {
  const globalConfigPath = path.join(__dirname, 'globalConfig.json');
  if (!fs.existsSync(globalConfigPath)) {
    throw new Error(
      'Global config file not found. Make sure globalSetup ran successfully.',
    );
  }
  return JSON.parse(fs.readFileSync(globalConfigPath, 'utf-8'));
}

export const createTestEnvironment = () => {
  let globalConfig: GlobalConfig;
  let mongoClient: MongoClient;

  beforeAll(async () => {
    // Load global config to get server URL and other service endpoints
    globalConfig = loadGlobalConfig();

    // Connect to MongoDB for tests that need direct DB access
    mongoClient = new MongoClient(globalConfig.mongoUri, {
      serverApi: {
        version: ServerApiVersion.v1,
        strict: false,
        deprecationErrors: true,
      },
    });
    await mongoClient.connect();
  });

  afterAll(async () => {
    // Close MongoDB connection
    if (mongoClient) {
      await mongoClient.close();
    }
  });

  return {
    getMongoClient: () => mongoClient,
    getSpiceClient: (): AuthzedClient => {
      return createClient({
        apiToken: globalConfig.spicedbToken,
        endpoint: globalConfig.spicedbEndpoint,
        security: v1.ClientSecurity.INSECURE_LOCALHOST_ALLOWED,
      });
    },
    createClient: async (args?: {
      userId?: string;
      companyId?: string;
      userName?: string;
      userEmail?: string;
    }) => {
      const userId = args?.userId || v4();
      const userEmail = args?.userEmail || `${userId}@example.com`;
      return await createTestClient(globalConfig.serverUrl, {
        es_user_id: userId,
        es_company_id: args?.companyId || v4(),
        es_user_name: args?.userName || 'Alice',
        es_user_email: userEmail,
        email: userEmail,
      });
    },
    createAnonTestClient: () => createAnonTestClient(globalConfig.serverUrl),
    getApiUrl: () => globalConfig.serverUrl,
    mintTestJwtToken: (overrides?: Partial<JWTPayload>) =>
      mintTestJwtToken(overrides, globalConfig),
  };
};
