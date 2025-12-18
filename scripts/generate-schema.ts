import { buildNexusSchema } from '../src/graphql/schema';
import { EnvConfig } from '../src/config';

// Minimal config for schema generation (dummy values for unused fields)
const envConfig: EnvConfig = {
  PORT: 5000,
  GRAPHIQL_ENABLED: false,
  GENERATE_NEXUS_ARTIFACTS: true,
  MONGO_CONNECTION_STRING: 'mongodb://localhost:27017/dummy',
  LEVEL: 'stage',
  AUTH_COOKIE_NAME: 'dummy-cookie',

  KAFKA_API_URL: 'http://dummy',
  KAFKA_API_KEY: 'dummy',
  KAFKA_API_SECRET: 'dummy',

  KAFKA_SCHEMA_REG_API_URL: 'http://dummy',
  KAFKA_SCHEMA_REG_API_KEY: 'dummy',
  KAFKA_SCHEMA_REG_API_SECRET: 'dummy',

  KAFKA_ASSETS_CONSUMER_GROUP_ID: 'dummy',
  KAFKA_COMPANIES_CONSUMER_GROUP_ID: 'dummy',
  KAFKA_USERS_CONSUMER_GROUP_ID: 'dummy',
  KAFKA_PIM_PRODUCTS_CONSUMER_GROUP_ID: 'dummy',
  KAFKA_PIM_CATEGORIES_CONSUMER_GROUP_ID: 'dummy',
  KAFKA_RM_RESOURCES_CONSUMER_GROUP_ID: 'dummy',

  DISABLE_KAFKA: true,

  OPENAI_API_KEY: 'dummy',

  FILE_SERVICE_KEY: 'dummy',
  FILE_SERVICE_SECRET: 'dummy',
  FILE_SERVICE_BUCKET: 'dummy-bucket',
  ERP_CLIENT_URL: 'http://localhost:3000',

  REDIS_HOST: 'localhost',
  REDIS_PORT: 6379,
  ENABLE_REDIS_AUTO_PIPELINING: true,
  SPICEDB_ENDPOINT: 'localhost:50051',
  SPICEDB_TOKEN: 'somerandomkeyhere',
  AUTH0_WEBHOOK_HMAC_SECRET: 'dummy-secret',
  AUTH0_MANAGEMENT_M2M_CLIENT_ID: 'dummy-client-id',
  AUTH0_MANAGEMENT_M2M_CLIENT_SECRET: 'dummy-client-secret',
  AUTH0_MANAGEMENT_API_URL: 'https://dummy.auth0.com/api/v2/',
  PIM_GLOBAL_TENANT_ID: '0',
  KSQLDB_ENDPOINT: 'localhost:5050',
  OPENSEARCH_ENDPOINT: 'http://localhost:9200',
  JWT_PRIVATE_KEY: 'dummy-base64-private-key',
  JWT_PUBLIC_KEY: 'dummy-base64-public-key',
  JWT_TOKEN_EXPIRY: '1h',
};

// This will generate the schema and typegen files
buildNexusSchema({ envConfig });

console.log(
  'Nexus GraphQL schema generated at src/graphql/schema/generated/schema.graphql',
);
