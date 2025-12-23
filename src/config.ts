import { Static, Type } from '@sinclair/typebox';
import envSchema from 'env-schema';
import { getOrCreateDevJWTKeys } from './lib/dev-jwt-keys';

// defaults should be what you want to use in production
const EnvSchema = Type.Object({
  PORT: Type.Number({ default: 5000 }),
  GRAPHIQL_ENABLED: Type.Boolean({ default: true }), // TODO introspection key
  GENERATE_NEXUS_ARTIFACTS: Type.Boolean({ default: false }),
  MONGO_CONNECTION_STRING: Type.Required(Type.String()),
  KSQLDB_ENDPOINT: Type.Required(Type.String()),
  LEVEL: Type.Union(
    [Type.Literal('prod'), Type.Literal('stage'), Type.Literal('dev')],
    {
      default: 'dev',
    },
  ),
  AUTH_COOKIE_NAME: Type.String({ default: 'es-erp-jwt' }),

  KAFKA_API_URL: Type.String(),
  KAFKA_API_KEY: Type.String(),
  KAFKA_API_SECRET: Type.String(),

  KAFKA_SCHEMA_REG_API_URL: Type.String(),
  KAFKA_SCHEMA_REG_API_KEY: Type.String(),
  KAFKA_SCHEMA_REG_API_SECRET: Type.String(),

  KAFKA_ASSETS_CONSUMER_GROUP_ID: Type.String({
    default: 'fleet-es-erp-assets-consumer-v3',
  }),
  KAFKA_COMPANIES_CONSUMER_GROUP_ID: Type.String({
    default: 'fleet-es-erp-companies-consumer-v3',
  }),
  KAFKA_USERS_CONSUMER_GROUP_ID: Type.String({
    default: 'fleet-es-erp-users-consumer-v4',
  }),
  KAFKA_PIM_PRODUCTS_CONSUMER_GROUP_ID: Type.String({
    default: 'fleet-es-erp-pim-products-consumer-v3',
  }),
  KAFKA_PIM_CATEGORIES_CONSUMER_GROUP_ID: Type.String({
    default: 'fleet-es-erp-pim-categories-consumer-v4',
  }),
  KAFKA_RM_RESOURCES_CONSUMER_GROUP_ID: Type.String({
    default: 'fleet-es-erp-rm-resources-consumer-v5',
  }),

  DISABLE_KAFKA: Type.Optional(Type.Boolean({ default: false })),

  OPENAI_API_KEY: Type.Optional(Type.String()),
  BRAVE_SEARCH_API_KEY: Type.Optional(Type.String()),
  MAPBOX_ACCESS_TOKEN: Type.Optional(Type.String()),
  MAPBOX_GEOCODING_ENDPOINT: Type.Optional(
    Type.String({
      default: 'https://api.mapbox.com/geocoding/v5/mapbox.places',
    }),
  ),

  FILE_SERVICE_KEY: Type.String(),
  FILE_SERVICE_SECRET: Type.String(),
  FILE_SERVICE_BUCKET: Type.String(),
  FILE_SERVICE_ENDPOINT: Type.Optional(Type.String()),
  FILE_SERVICE_REGION: Type.Optional(Type.String({ default: 'us-west-2' })),
  IN_TEST_MODE: Type.Optional(Type.Boolean({ default: false })),
  ERP_CLIENT_URL: Type.Required(Type.String()),

  // SpiceDB configuration
  SPICEDB_ENDPOINT: Type.String(),
  SPICEDB_TOKEN: Type.String(),
  REDIS_HOST: Type.String(),
  REDIS_PORT: Type.Number(),
  ENABLE_REDIS_AUTO_PIPELINING: Type.Optional(Type.Boolean({ default: true })),
  // Webhook configuration
  AUTH0_WEBHOOK_HMAC_SECRET: Type.String({
    default: 'test-secret-for-hmac-validation',
  }),

  // Auth0 Management API configuration
  AUTH0_MANAGEMENT_M2M_CLIENT_ID: Type.String({
    default: '',
  }),
  AUTH0_MANAGEMENT_M2M_CLIENT_SECRET: Type.String({
    default: '',
  }),
  AUTH0_MANAGEMENT_API_URL: Type.String({
    default: '',
  }),

  // Brandfetch API configuration
  BRANDFETCH_BRAND_API_KEY: Type.Optional(Type.String()),
  BRANDFETCH_BRAND_SEARCH_API_KEY: Type.Optional(Type.String()),

  // SendGrid configuration
  SENDGRID_API_KEY: Type.Optional(Type.String()),
  INVITE_ONLY: Type.Optional(Type.Boolean({ default: true })),
  INVITE_ONLY_BYPASS_EMAILS: Type.Optional(
    Type.Array(Type.String(), {
      default: [
        'brian.mullan@equipmentshare.com',
        'ady.young@equipmentshare.com',
        'will@equipmentshare.com',
        'paul.wright@equipmentshare.com',
        'alyson.yamada@equipmentshare.com',
        'jb.bell@equipmentshare.com',
      ],
    }),
  ),
  PIM_GLOBAL_TENANT_ID: Type.String({ default: '0' }),

  // OpenSearch / SearchKit configuration (VPC-based, no auth required)
  OPENSEARCH_ENDPOINT: Type.Required(Type.String()),

  // Global library database (attributes/tags/source-of-truth)
  GLOBAL_LIBRARY_DB_NAME: Type.Optional(
    Type.String({ default: 'es-erp-global' }),
  ),

  // JWT Self-Signing Keys (for PDF generation, service-to-service auth, etc.)
  // Optional in schema - will auto-load from keys/ directory in dev if not provided
  JWT_PRIVATE_KEY: Type.String({ default: '' }),
  JWT_PUBLIC_KEY: Type.String({ default: '' }),
  JWT_TOKEN_EXPIRY: Type.String({ default: '1h' }),
});

export type EnvConfig = Static<typeof EnvSchema>;

export const getEnvConfig = () => {
  // Pre-process environment variables to handle JSON arrays
  const processedEnv = { ...process.env };

  // Parse INVITE_ONLY_BYPASS_EMAILS if it's a JSON string
  if (typeof processedEnv.INVITE_ONLY_BYPASS_EMAILS === 'string') {
    const emailsStr = processedEnv.INVITE_ONLY_BYPASS_EMAILS;
    try {
      const parsed = JSON.parse(emailsStr);
      if (Array.isArray(parsed)) {
        processedEnv.INVITE_ONLY_BYPASS_EMAILS = parsed as any;
      }
    } catch (e) {
      // If parsing fails, try to split by comma as fallback
      if (emailsStr.includes(',')) {
        processedEnv.INVITE_ONLY_BYPASS_EMAILS = emailsStr
          .split(',')
          .map((email) => email.trim()) as any;
      }
    }
  }

  const env = envSchema<EnvConfig>({
    schema: EnvSchema,
    data: processedEnv,
  });

  // Auto-generate JWT keys if not provided via env vars
  let jwtPrivateKey = env.JWT_PRIVATE_KEY;
  let jwtPublicKey = env.JWT_PUBLIC_KEY;

  if (!jwtPrivateKey || !jwtPublicKey) {
    // In stage/production, JWT keys must be explicitly provided
    if (env.LEVEL === 'stage' || env.LEVEL === 'prod') {
      throw new Error(
        `JWT_PRIVATE_KEY and JWT_PUBLIC_KEY must be provided in ${env.LEVEL} environment`,
      );
    }

    // Load or generate JWT keys for dev/test environments
    const keys = getOrCreateDevJWTKeys();
    jwtPrivateKey = keys.privateKey;
    jwtPublicKey = keys.publicKey;
  }

  return {
    ...env,
    JWT_PRIVATE_KEY: jwtPrivateKey,
    JWT_PUBLIC_KEY: jwtPublicKey,
  };
};
