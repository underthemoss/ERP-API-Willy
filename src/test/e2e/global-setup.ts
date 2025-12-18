import {
  RedpandaContainer,
  StartedRedpandaContainer,
} from '@testcontainers/redpanda';
import { RedisContainer, StartedRedisContainer } from '@testcontainers/redis';
import {
  LocalstackContainer,
  StartedLocalStackContainer,
} from '@testcontainers/localstack';
import {
  GenericContainer,
  StartedTestContainer,
  Wait,
  Network,
  StartedNetwork,
} from 'testcontainers';
import { v1 } from '@authzed/authzed-node';
import fs from 'fs';
import path from 'path';
import chalk from 'chalk';
import { GlobalConfig } from './types';
import { getRedisClient } from '../../redis';
import { createClient, AuthzedClient } from '../../lib/authz/spiceDB-client';
import { writeSchema } from '../../lib/authz/test-utils/index';
import { spawn, ChildProcess } from 'child_process';
import net from 'net';
import { generateKeyPairSync } from 'crypto';

// @ts-ignore
import spiceDBMigrationsConfig from '../../../spicedb/migrate-spicedb-config.js';

const GLOBAL_CONFIG_PATH = path.join(__dirname, 'globalConfig.json');

// Service startup result types
interface MongoDBResult {
  mongoUri: string;
  instance: StartedTestContainer;
}

interface RedpandaResult {
  kafkaBootstrap: string;
  schemaRegistryUrl: string;
  instance: StartedRedpandaContainer;
  network: StartedNetwork;
}

interface RedisResult {
  redisHost: string;
  redisPort: number;
  instance: StartedRedisContainer;
  client: any;
}

interface SpiceDBResult {
  spicedbEndpoint: string;
  spicedbToken: string;
  instance: StartedTestContainer | null;
}

interface LocalStackResult {
  s3Endpoint: string;
  s3AccessKeyId: string;
  s3SecretAccessKey: string;
  s3Bucket: string;
  s3Region: string;
  instance: StartedLocalStackContainer;
}

interface KsqlDBResult {
  ksqldbEndpoint: string;
  instance: StartedTestContainer;
}

interface OpenSearchResult {
  opensearchEndpoint: string;
  instance: StartedTestContainer;
}

/**
 * Polls SpiceDB until it's ready by attempting to read the schema
 * @param client - The SpiceDB client
 * @param maxWaitTime - Maximum time to wait in milliseconds (default: 30000)
 * @param initialDelay - Initial delay between retries in milliseconds (default: 500)
 * @returns Promise that resolves when SpiceDB is ready
 */
async function waitForSpiceDBReady(
  client: AuthzedClient,
  maxWaitTime: number = 30000,
  initialDelay: number = 500,
): Promise<void> {
  const startTime = Date.now();
  let delay = initialDelay;
  let attempt = 0;

  while (Date.now() - startTime < maxWaitTime) {
    attempt++;
    try {
      // Try to read the schema to verify SpiceDB is ready and schema is applied
      await client.readSchema(v1.ReadSchemaRequest.create({}));
      console.log(
        chalk.green(
          `✅ SpiceDB is ready (verified after ${attempt} attempt${attempt > 1 ? 's' : ''})`,
        ),
      );
      return;
    } catch (error) {
      const elapsed = Date.now() - startTime;
      const remaining = maxWaitTime - elapsed;

      if (remaining <= 0) {
        throw new Error(
          `SpiceDB failed to become ready after ${maxWaitTime}ms. Last error: ${
            error instanceof Error ? error.message : String(error)
          }`,
        );
      }

      // Log progress every few attempts
      if (attempt % 3 === 0) {
        console.log(
          chalk.yellow(
            `⏳ Waiting for SpiceDB to be ready... (attempt ${attempt}, ${Math.round(remaining / 1000)}s remaining)`,
          ),
        );
      }

      // Wait with exponential backoff (cap at 2 seconds)
      await new Promise((resolve) => setTimeout(resolve, delay));
      delay = Math.min(delay * 1.5, 2000);
    }
  }

  throw new Error(
    `SpiceDB failed to become ready within ${maxWaitTime}ms timeout`,
  );
}

/**
 * Start MongoDB container with replica set
 */
async function startMongoDB(): Promise<MongoDBResult> {
  console.log(chalk.cyan('💿 Starting MongoDB...'));

  const mongoContainer = await new GenericContainer('mongo:8')
    .withExposedPorts(27017)
    .withCommand(['--replSet', 'rs0', '--bind_ip_all'])
    .withWaitStrategy(Wait.forLogMessage('Waiting for connections'))
    .start();

  const mongoHost = mongoContainer.getHost();
  const mongoPort = mongoContainer.getMappedPort(27017);
  const mongoUri = `mongodb://${mongoHost}:${mongoPort}/?replicaSet=rs0&directConnection=true`;

  // Initialize replica set
  const { MongoClient } = await import('mongodb');
  const client = new MongoClient(mongoUri);

  try {
    await client.connect();
    const admin = client.db().admin();

    // Initialize the replica set using localhost:27017 (internal to container)
    await admin.command({
      replSetInitiate: {
        _id: 'rs0',
        members: [{ _id: 0, host: 'localhost:27017' }],
      },
    });

    // Wait for replica set to be ready
    let isReady = false;
    let attempts = 0;
    const maxAttempts = 30;

    while (!isReady && attempts < maxAttempts) {
      try {
        const status = await admin.command({ replSetGetStatus: 1 });
        isReady = status.members?.[0]?.stateStr === 'PRIMARY';
        if (!isReady) {
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }
      } catch (error) {
        // Replica set not ready yet
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
      attempts++;
    }

    if (!isReady) {
      throw new Error('MongoDB replica set failed to become ready');
    }
  } finally {
    await client.close();
  }

  console.log(chalk.green('✅ MongoDB started'));
  return { mongoUri, instance: mongoContainer };
}

/**
 * Run database migrations
 */
async function runMigrations(mongoUri: string): Promise<void> {
  console.log(chalk.cyan('📦 Running database migrations...'));

  // Suppress migration script console output
  const originalLog = console.log;
  const originalInfo = console.info;
  const originalWarn = console.warn;

  try {
    const { MongoClient } = await import('mongodb');
    const { up, config } = await import('migrate-mongo');

    const mongoClient = new MongoClient(mongoUri);
    await mongoClient.connect();

    // Load and set the migration config
    config.set({
      mongodb: {
        url: mongoUri,
        databaseName: 'es-erp',
        options: {},
      },
      migrationsDir: path.join(__dirname, '../../mongo/migrations'),
      changelogCollectionName: 'changelog',
      migrationFileExtension: '.js',
      useFileHash: false,
      moduleSystem: 'commonjs',
    } as any);

    // Suppress console output from migration scripts unless in debug mode
    if (!process.env.DEBUG_E2E_TESTS) {
      console.log = () => {};
      console.info = () => {};
      console.warn = () => {};
    }

    const migrated = await up(mongoClient.db(), mongoClient);

    // Restore console
    console.log = originalLog;
    console.info = originalInfo;
    console.warn = originalWarn;

    await mongoClient.close();

    if (process.env.DEBUG_E2E_TESTS) {
      console.log(chalk.green('✅ Migrations complete:'), migrated);
    } else {
      console.log(
        chalk.green('✅ Migrations complete') +
          chalk.dim(` (${migrated.length} applied)`),
      );
    }
  } catch (error) {
    // Restore console on error
    console.log = originalLog;
    console.info = originalInfo;
    console.warn = originalWarn;

    console.error(chalk.red('❌ Migration failed:'), error);
    throw error;
  }
}

async function runSpiceDBMigrations(opts: {
  mongoUri: string;
  spicedbEndpoint: string;
  spicedbToken: string;
  redisHost: string;
  redisPort: number;
}): Promise<void> {
  console.log(chalk.cyan('📦 Running SpiceDB migrations...'));

  try {
    const { MongoClient } = await import('mongodb');
    const { up, config } = await import('migrate-mongo');

    const mongoClient = new MongoClient(opts.mongoUri);
    await mongoClient.connect();

    // Load and set the migration config
    config.set({
      ...spiceDBMigrationsConfig,
      mongodb: {
        ...spiceDBMigrationsConfig.mongodb,
        url: opts.mongoUri,
      },
    });

    process.env.REDIS_HOST = opts.redisHost;
    process.env.REDIS_PORT = opts.redisPort.toString();
    process.env.SPICEDB_ENDPOINT = opts.spicedbEndpoint;
    process.env.SPICEDB_TOKEN = opts.spicedbToken;

    const migrated = await up(mongoClient.db(), mongoClient);

    await mongoClient.close();

    if (process.env.DEBUG_E2E_TESTS) {
      console.log(chalk.green('✅ SpiceDB Migrations complete:'), migrated);
    } else {
      console.log(
        chalk.green('✅ SpiceDB Migrations complete') +
          chalk.dim(` (${migrated.length} applied)`),
      );
    }
  } catch (error) {
    console.error(chalk.red('❌ SpiceDB Migration failed:'), error);
    throw error;
  }
}

/**
 * Get container logs for debugging
 */
async function getContainerLogs(
  container: StartedTestContainer,
): Promise<string> {
  try {
    const logs = await container.logs();
    return logs.toString();
  } catch (error) {
    return `Failed to get logs: ${error}`;
  }
}

/**
 * Start Redpanda (Kafka) container and create necessary topics
 */
async function startRedpanda(): Promise<RedpandaResult> {
  console.log(chalk.cyan('🦜 Starting Redpanda (Kafka)...'));

  // Create a network for inter-container communication
  const network = await new Network().start();

  // Use a specific version for consistency and add custom wait strategy
  const redpanda = await new RedpandaContainer('redpandadata/redpanda:v24.3.1')
    .withNetwork(network)
    .withNetworkAliases('redpanda')
    .withStartupTimeout(120000) // 2 minutes timeout
    .withWaitStrategy(
      Wait.forLogMessage(
        /starting Redpanda|Redpanda is ready|started Kafka API server/i,
      ).withStartupTimeout(120000),
    )
    .start();

  const kafkaBootstrap = redpanda.getBootstrapServers();

  // Wait a bit for Redpanda to fully initialize
  await new Promise((resolve) => setTimeout(resolve, 3000));

  // Verify Redpanda is responsive by attempting to create a topic with retries
  let topicCreated = false;
  let attempts = 0;
  const maxAttempts = 10;

  while (!topicCreated && attempts < maxAttempts) {
    attempts++;

    try {
      await redpanda.exec([
        'rpk',
        'topic',
        'create',
        '_es-erp.private.cdc',
        '--partitions',
        '1',
        '--replicas',
        '1',
      ]);
      console.log(chalk.green('✅ Created CDC topic: _es-erp.private.cdc'));
      topicCreated = true;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);

      // Check if the error indicates the container has stopped
      if (
        errorMessage.includes('container stopped') ||
        errorMessage.includes('container not running') ||
        errorMessage.includes('container paused')
      ) {
        console.error(
          chalk.red('❌ Redpanda container has stopped or crashed'),
        );
        const logs = await getContainerLogs(redpanda);
        console.error('Container logs:');
        console.error(logs.slice(-2000));
        throw new Error(
          `Redpanda container stopped during topic creation: ${errorMessage}`,
        );
      }

      if (attempts >= maxAttempts) {
        console.error(
          chalk.red('❌ Failed to create CDC topic after multiple attempts'),
        );
        const logs = await getContainerLogs(redpanda);
        console.error('Container logs:');
        console.error(logs.slice(-2000));
        throw error;
      }

      console.log(
        chalk.yellow(
          `⏳ Waiting for Redpanda to be fully ready... (attempt ${attempts}/${maxAttempts})`,
        ),
      );
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }
  }

  const schemaRegistryPort = redpanda.getMappedPort(8081);
  const schemaRegistryUrl = `http://localhost:${schemaRegistryPort}`;

  console.log(chalk.green('✅ Redpanda started'));
  return { kafkaBootstrap, schemaRegistryUrl, instance: redpanda, network };
}

/**
 * Start Redis container
 */
async function startRedis(): Promise<RedisResult> {
  console.log(chalk.cyan('🧊 Starting Redis...'));
  const redisContainer = await new RedisContainer('redis:7.2').start();
  const redisHost = redisContainer.getHost();
  const redisPort = redisContainer.getMappedPort(6379);
  const redis = getRedisClient({
    REDIS_HOST: redisHost,
    REDIS_PORT: redisPort,
    ENABLE_REDIS_AUTO_PIPELINING: true,
  });
  console.log(chalk.green('✅ Redis started'));
  return { redisHost, redisPort, instance: redisContainer, client: redis };
}

/**
 * Start LocalStack container with S3 service
 */
async function startLocalStack(): Promise<LocalStackResult> {
  console.log(chalk.cyan('☁️  Starting LocalStack (S3)...'));

  const localstackContainer = await new LocalstackContainer(
    'localstack/localstack:3.5.0',
  ).start();

  const s3Port = localstackContainer.getMappedPort(4566);
  const s3Endpoint = `http://localhost:${s3Port}`;
  const s3Region = 'us-west-2';
  const s3AccessKeyId = 'test';
  const s3SecretAccessKey = 'test';
  const s3Bucket = 'test-bucket';

  // Create the test bucket using AWS CLI inside the container
  try {
    await localstackContainer.exec([
      'awslocal',
      's3',
      'mb',
      `s3://${s3Bucket}`,
      '--region',
      s3Region,
    ]);
    console.log(chalk.green(`✅ Created S3 bucket: ${s3Bucket}`));
  } catch (error) {
    console.error(chalk.red('❌ Failed to create S3 bucket:'), error);
    throw error;
  }

  console.log(chalk.green('✅ LocalStack (S3) started'));
  return {
    s3Endpoint,
    s3AccessKeyId,
    s3SecretAccessKey,
    s3Bucket,
    s3Region,
    instance: localstackContainer,
  };
}

/**
 * Start ksqlDB container
 */
async function startKsqlDB(
  kafkaBootstrap: string,
  schemaRegistryUrl: string,
): Promise<KsqlDBResult> {
  console.log(chalk.cyan('📊 Starting ksqlDB...'));

  const imageName = 'confluentinc/cp-ksqldb-server:8.0.2';

  console.log(chalk.dim(`Using ksqlDB image: ${imageName}`));
  const port = await findFreePort();
  const ksqldbContainer = await new GenericContainer(imageName)
    .withNetworkMode('host')
    .withEnvironment({
      // Node/Express settings
      PORT: port.toString(),
      KSQL_LOG4J_ROOT_LOGLEVEL: 'warn',
      // ksqlDB server settings
      KSQL_LISTENERS: 'http://0.0.0.0:8088',
      KSQL_BOOTSTRAP_SERVERS: kafkaBootstrap,
      KSQL_KSQL_SCHEMA_REGISTRY_URL: schemaRegistryUrl,
      KSQL_KSQL_SERVER_COMMAND_RESPONSE_TIMEOUT_MS: '5000',
      // JVM memory settings
      KAFKA_HEAP_OPTS: '-Xms1024m -Xmx2048m',
      // Cluster settings (local single instance)
      KSQL_KSQL_SERVICE_ID: 'es-erp-ksqldb-local',
      KSQL_KSQL_STREAMS_NUM_STANDBY_REPLICAS: '0',
      KSQL_KSQL_HEARTBEAT_ENABLE: 'true',
      KSQL_KSQL_LAG_REPORTING_ENABLE: 'true',
      // Topic naming (matches production pattern)
      KSQL_KSQL_OUTPUT_TOPIC_NAME_PREFIX: '_es-erp-ksqldb.',
      KSQL_KSQL_LOGGING_PROCESSING_TOPIC_NAME:
        '_es-erp-ksqldb_ksql_processing_log',
      // Streams settings
      KSQL_KSQL_STREAMS_NUM_STREAM_THREADS: '2',
      KSQL_KSQL_STREAMS_STATE_DIR: '/tmp/kafka-streams/data',
      // Replication (local single broker)
      KSQL_KSQL_STREAMS_REPLICATION_FACTOR: '1',
      KSQL_KSQL_INTERNAL_TOPIC_REPLICAS: '1',
      KSQL_KSQL_LOGGING_PROCESSING_TOPIC_REPLICATION_FACTOR: '1',
      KSQL_KSQL_LOGGING_PROCESSING_STREAM_AUTO_CREATE: 'true',
      KSQL_KSQL_LOGGING_PROCESSING_TOPIC_AUTO_CREATE: 'true',
      // Security (local development - no auth)
      KSQL_KSQL_UDF_ENABLE_SECURITY_MANAGER: 'false',
      KSQL_CONFLUENT_SUPPORT_METRICS_ENABLE: 'false',
    })
    .withWaitStrategy(
      Wait.forLogMessage(/Launching ksqldb-server/i).withStartupTimeout(60_000),
    )
    .withStartupTimeout(60_000)
    .start();

  const ksqldbEndpoint = `http://localhost:8088`;

  console.log(chalk.green('✅ ksqlDB started'));
  return { ksqldbEndpoint, instance: ksqldbContainer };
}

/**
 * Start SpiceDB container (optional - tests can still run without it)
 */
async function startSpiceDB(): Promise<SpiceDBResult> {
  const spicedbToken = 'somerandomkeyhere';

  try {
    console.log(chalk.cyan('🔐 Starting SpiceDB (optional)...'));
    const spicedbContainer = await new GenericContainer(
      'authzed/spicedb:latest',
    )
      .withExposedPorts(50051)
      .withCommand([
        'serve',
        '--grpc-preshared-key',
        spicedbToken,
        '--datastore-engine',
        'memory',
      ])
      .withWaitStrategy(Wait.forLogMessage('grpc server started serving'))
      .start();

    const spicedbPort = spicedbContainer.getMappedPort(50051);
    const spicedbEndpoint = `localhost:${spicedbPort}`;

    // Wait for SpiceDB to be ready
    await new Promise((resolve) => setTimeout(resolve, 2000));

    const client = createClient({
      apiToken: spicedbToken,
      endpoint: spicedbEndpoint,
      security: v1.ClientSecurity.INSECURE_PLAINTEXT_CREDENTIALS,
    });

    await writeSchema(client);
    console.log(
      chalk.cyan('📝 SpiceDB schema written, verifying readiness...'),
    );

    // Poll until SpiceDB is ready and schema is accessible
    await waitForSpiceDBReady(client);

    return { spicedbEndpoint, spicedbToken, instance: spicedbContainer };
  } catch (error) {
    console.log(
      chalk.yellow(
        '⚠️  SpiceDB could not be started (tests will use fallback)',
      ),
    );
    console.log('   ', error instanceof Error ? error.message : String(error));
    return { spicedbEndpoint: '', spicedbToken: '', instance: null };
  }
}

/**
 * Find a free port in the range 4000-4500
 */
async function findFreePort(): Promise<number> {
  const min = 4000;
  const max = 4500;
  while (true) {
    const port = Math.floor(Math.random() * (max - min + 1)) + min;
    const isFree = await new Promise((resolve) => {
      const tester = net.createServer();
      tester.once('error', () => {
        tester.close(() => resolve(false));
      });
      tester.once('listening', function () {
        tester.close(() => resolve(true));
      });
      tester.listen(port, '127.0.0.1');
    });
    if (isFree) return port;
  }
}

/**
 * Start OpenSearch container
 */
async function startOpenSearch(): Promise<OpenSearchResult> {
  console.log(chalk.cyan('🔍 Starting OpenSearch...'));

  const opensearchContainer = await new GenericContainer(
    'opensearchproject/opensearch:2',
  )
    .withExposedPorts(9200)
    .withEnvironment({
      'discovery.type': 'single-node',
      DISABLE_SECURITY_PLUGIN: 'true',
    })
    .withStartupTimeout(120000)
    .start();

  const host = opensearchContainer.getHost();
  const port = opensearchContainer.getMappedPort(9200);
  const opensearchEndpoint = `http://${host}:${port}`;

  // Wait for cluster to be ready
  await waitForOpenSearchReady(opensearchEndpoint);

  // Create required indexes for tests
  await createOpenSearchIndexes(opensearchEndpoint);

  console.log(
    chalk.green('✅ OpenSearch started at') +
      ' ' +
      chalk.magenta(opensearchEndpoint),
  );
  return { opensearchEndpoint, instance: opensearchContainer };
}

/**
 * Wait for OpenSearch to be ready by polling the cluster health endpoint
 */
async function waitForOpenSearchReady(
  endpoint: string,
  maxRetries: number = 30,
): Promise<void> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await fetch(`${endpoint}/_cluster/health`);
      if (response.ok) {
        return;
      }
    } catch {
      // Container not ready yet
    }
    await new Promise((resolve) => setTimeout(resolve, 2000));
  }
  throw new Error('OpenSearch failed to become ready');
}

/**
 * Create required OpenSearch indexes for tests
 */
async function createOpenSearchIndexes(endpoint: string): Promise<void> {
  // List of indexes that tests may need
  const indexes = [
    'es_erp_prices',
    't3_assets',
    't3_pim_products',
    't3_pim_categories',
    't3_orders',
    't3_rentals',
  ];

  for (const indexName of indexes) {
    try {
      const response = await fetch(`${endpoint}/${indexName}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          settings: {
            number_of_shards: 1,
            number_of_replicas: 0,
          },
        }),
      });

      if (response.ok) {
        console.log(chalk.green(`  ✅ Created index: ${indexName}`));
      } else {
        const error = await response.text();
        console.warn(
          chalk.yellow(`  ⚠️  Failed to create index ${indexName}: ${error}`),
        );
      }
    } catch (e) {
      console.warn(
        chalk.yellow(`  ⚠️  Error creating index ${indexName}: ${e}`),
      );
    }
  }
}

/**
 * Start the server process
 */
async function startServer(
  mongoUri: string,
  kafkaBootstrap: string,
  redisHost: string,
  redisPort: number,
  spicedbEndpoint: string,
  spicedbToken: string,
  s3Config: {
    endpoint: string;
    accessKeyId: string;
    secretAccessKey: string;
    bucket: string;
    region: string;
  },
  ksqlUrl: string,
  opensearchEndpoint: string,
  jwtPrivateKey: string,
  jwtPublicKey: string,
  jwtTokenExpiry: string,
): Promise<{ url: string; process: ChildProcess }> {
  console.log(chalk.cyan('🚀 Starting server process...'));

  // Find a free port between 4000 and 4500
  const freePort = await findFreePort();

  // Set environment variables for the test, with sensible defaults for e2e
  const env = {
    ...process.env,
    DISABLE_KAFKA: 'true',
    LEVEL: 'dev', // Run CDC mode for search indexing
    PORT: String(freePort),
    MONGO_CONNECTION_STRING: mongoUri,
    KAFKA_API_URL: kafkaBootstrap,
    KAFKA_API_KEY: '',
    KAFKA_API_SECRET: '',
    KAFKA_SCHEMA_REG_API_URL: '',
    KAFKA_SCHEMA_REG_API_KEY: '',
    KAFKA_SCHEMA_REG_API_SECRET: '',
    OPENAI_API_KEY: '',
    FILE_SERVICE_KEY: s3Config.accessKeyId,
    FILE_SERVICE_SECRET: s3Config.secretAccessKey,
    FILE_SERVICE_BUCKET: s3Config.bucket,
    FILE_SERVICE_ENDPOINT: s3Config.endpoint,
    FILE_SERVICE_REGION: s3Config.region,
    IN_TEST_MODE: 'true',
    ERP_CLIENT_URL: 'http://localhost:3000',
    REDIS_HOST: redisHost,
    REDIS_PORT: String(redisPort),
    SPICEDB_ENDPOINT: spicedbEndpoint,
    SPICEDB_TOKEN: spicedbToken,
    AUTH0_WEBHOOK_HMAC_SECRET: 'test-secret-for-hmac-validation',
    SENDGRID_API_KEY: 'SG.test-sendgrid-api-key', // Dummy key for tests
    INVITE_ONLY: 'true',
    INVITE_ONLY_BYPASS_EMAILS: JSON.stringify(['bypass.test@example.com']),
    KSQLDB_ENDPOINT: ksqlUrl,
    OPENSEARCH_ENDPOINT: opensearchEndpoint,
    // Provide JWT keys to the server
    JWT_PRIVATE_KEY: jwtPrivateKey,
    JWT_PUBLIC_KEY: jwtPublicKey,
    JWT_TOKEN_EXPIRY: jwtTokenExpiry,
  };

  // Start the service as a child process with nyc for coverage
  const serverProcess = spawn(
    'npx',
    [
      'nyc',
      `--cwd=${process.cwd()}`,
      '--all',
      '--reporter=cobertura',
      '--silent',
      'ts-node',
      'src/index.ts',
    ],
    {
      env,
      stdio: 'pipe',
      detached: true,
    },
  );

  if (process.env.DEBUG_E2E_TESTS) {
    serverProcess.on('exit', (code, signal) => {
      console.log(`Server exited with code ${code} and signal ${signal}`);
    });

    serverProcess.stdout?.on('data', (data) => {
      console.log(data.toString());
    });
    serverProcess.on('error', (err) => {
      console.error('Server process error:', err);
    });

    serverProcess.stderr?.on('data', (data) => {
      console.error(data.toString());
    });
  }

  const url = `http://localhost:${freePort}`;

  // Wait for the server to be ready (poll /health)
  const waitOn = (await import('wait-on')).default;
  await waitOn({
    resources: [`${url}/health`],
    timeout: 60000,
    interval: 500,
    validateStatus: (status: number) => status === 200,
  });

  console.log(chalk.green('✅ Server started at') + ' ' + chalk.magenta(url));

  return { url, process: serverProcess };
}

export default async function globalSetup() {
  console.log(chalk.cyan('\n🚀 Starting global test setup...'));

  const startTime = Date.now();

  // Start Redpanda first (sequentially) to avoid resource contention
  console.log(chalk.cyan('📦 Starting Redpanda first...'));
  const redpandaResult = await startRedpanda();
  const redpandaTime = Date.now() - startTime;
  console.log(
    chalk.green('✅ Redpanda ready in') +
      ' ' +
      chalk.magenta(`${Math.round(redpandaTime / 1000)}s`),
  );

  // Start remaining services in parallel
  console.log(chalk.cyan('📦 Starting remaining services in parallel...'));
  const [
    mongoResult,
    redisResult,
    spicedbResult,
    localstackResult,
    opensearchResult,
  ] = await Promise.all([
    startMongoDB(),
    startRedis(),
    startSpiceDB(),
    startLocalStack(),
    startOpenSearch(),
  ]);

  // Start ksqlDB after other services, using host network to connect to Redpanda
  const ksqldbResult = await startKsqlDB(
    redpandaResult.kafkaBootstrap,
    redpandaResult.schemaRegistryUrl,
  );

  const setupTime = Date.now() - startTime;
  console.log(
    chalk.green('⚡ All services started in') +
      ' ' +
      chalk.magenta(`${Math.round(setupTime / 1000)}s`),
  );

  // Run migrations after MongoDB is ready
  await runMigrations(mongoResult.mongoUri);
  await runSpiceDBMigrations({
    mongoUri: mongoResult.mongoUri,
    spicedbEndpoint: spicedbResult.spicedbEndpoint,
    spicedbToken: spicedbResult.spicedbToken,
    redisHost: redisResult.redisHost,
    redisPort: redisResult.redisPort,
  });

  // Generate RSA keypair for JWT signing (used by both server and tests)
  const { publicKey, privateKey } = generateKeyPairSync('rsa', {
    modulusLength: 2048,
    publicKeyEncoding: {
      type: 'spki',
      format: 'pem',
    },
    privateKeyEncoding: {
      type: 'pkcs8',
      format: 'pem',
    },
  });

  const jwtPrivateKey = Buffer.from(privateKey).toString('base64');
  const jwtPublicKey = Buffer.from(publicKey).toString('base64');
  const jwtTokenExpiry = '24h';

  console.log(chalk.cyan('🔑 Generated JWT RSA keypair for tests'));

  // Start the server with the generated JWT keys
  const serverResult = await startServer(
    mongoResult.mongoUri,
    redpandaResult.kafkaBootstrap,
    redisResult.redisHost,
    redisResult.redisPort,
    spicedbResult.spicedbEndpoint,
    spicedbResult.spicedbToken,
    {
      endpoint: localstackResult.s3Endpoint,
      accessKeyId: localstackResult.s3AccessKeyId,
      secretAccessKey: localstackResult.s3SecretAccessKey,
      bucket: localstackResult.s3Bucket,
      region: localstackResult.s3Region,
    },
    ksqldbResult.ksqldbEndpoint,
    opensearchResult.opensearchEndpoint,
    jwtPrivateKey,
    jwtPublicKey,
    jwtTokenExpiry,
  );

  // Store the configuration for tests to use (with the same JWT keys)
  const config: GlobalConfig = {
    mongoUri: mongoResult.mongoUri,
    kafkaBootstrap: redpandaResult.kafkaBootstrap,
    spicedbEndpoint: spicedbResult.spicedbEndpoint,
    spicedbToken: spicedbResult.spicedbToken,
    redisHost: redisResult.redisHost,
    redisPort: redisResult.redisPort,
    serverUrl: serverResult.url,
    s3Endpoint: localstackResult.s3Endpoint,
    s3AccessKeyId: localstackResult.s3AccessKeyId,
    s3SecretAccessKey: localstackResult.s3SecretAccessKey,
    s3Bucket: localstackResult.s3Bucket,
    s3Region: localstackResult.s3Region,
    ksqldbEndpoint: '', // Empty since we're skipping it
    jwtPrivateKey,
    jwtPublicKey,
    jwtTokenExpiry,
  };

  // Write config to file so tests can access it
  fs.writeFileSync(GLOBAL_CONFIG_PATH, JSON.stringify(config, null, 2));

  // Store references globally for teardown
  (global as any).__MONGOD__ = mongoResult.instance;
  (global as any).__REDPANDA__ = redpandaResult.instance;
  if (spicedbResult.instance) {
    (global as any).__SPICEDB__ = spicedbResult.instance;
  }
  (global as any).__KSQLDB__ = ksqldbResult.instance;
  (global as any).__LOCALSTACK__ = localstackResult.instance;
  (global as any).__OPENSEARCH__ = opensearchResult.instance;
  (global as any).__REDIS__ = redisResult.client;
  (global as any).__SERVER_PROCESS__ = serverResult.process;

  const totalSetupTime = Date.now() - startTime;
  console.log(
    chalk.green('✅ Global test setup complete in') +
      ' ' +
      chalk.magenta(`${Math.round(totalSetupTime / 1000)}s\n`),
  );
  console.log(chalk.dim('MongoDB URI:') + ' ' + chalk.magenta(config.mongoUri));
  console.log(
    chalk.dim('Kafka Bootstrap:') + ' ' + chalk.magenta(config.kafkaBootstrap),
  );
  if (config.spicedbEndpoint) {
    console.log(
      chalk.dim('SpiceDB Endpoint:') +
        ' ' +
        chalk.magenta(config.spicedbEndpoint),
    );
  }
  console.log(
    chalk.dim('Redis:') +
      ' ' +
      chalk.magenta(`${config.redisHost}:${config.redisPort}`),
  );
  console.log(
    chalk.dim('LocalStack S3:') +
      ' ' +
      chalk.magenta(`${config.s3Endpoint} (bucket: ${config.s3Bucket})`),
  );
  console.log(
    chalk.dim('ksqlDB Endpoint:') + ' ' + chalk.magenta(config.ksqldbEndpoint),
  );
  console.log(
    chalk.dim('Server URL:') + ' ' + chalk.magenta(config.serverUrl) + '\n',
  );
}
