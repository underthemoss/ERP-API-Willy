import {
  GenericContainer,
  Network,
  Wait,
  StartedTestContainer,
  StartedNetwork,
} from 'testcontainers';
import chalk from 'chalk';
import fs from 'fs';
import path from 'path';
import { KsqlTestConfig } from './types';

const GLOBAL_CONFIG_PATH = path.join(__dirname, '..', 'globalConfig.json');

// ksqlDB image configuration
const ECR_IMAGE = 'confluentinc/cp-ksqldb-server:8.0.2';

// Container reuse is controlled by testcontainers' native TESTCONTAINERS_REUSE_ENABLE env var
// It's enabled by default, set to 'false' to disable
const REUSE_ENABLED = process.env.TESTCONTAINERS_REUSE_ENABLE !== 'false';

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
 * Start MongoDB container
 */
async function startMongoDB(dockerNetwork: StartedNetwork) {
  console.log(chalk.cyan('🍃 Starting MongoDB...'));

  const container = await new GenericContainer('mongo:7.0')
    .withReuse() // Enable container reuse
    .withNetwork(dockerNetwork)
    .withNetworkAliases('mongo')
    .withExposedPorts(27017)
    .withEnvironment({
      MONGO_INITDB_DATABASE: 'es-erp',
    })
    .withWaitStrategy(
      Wait.forLogMessage(/Waiting for connections/i).withStartupTimeout(60000),
    )
    .withStartupTimeout(60000)
    .start();

  const mongoUrl = `mongodb://${container.getHost()}:${container.getMappedPort(27017)}/es-erp`;

  console.log(chalk.green('✅ MongoDB started'));
  return { container, mongoUrl };
}

/**
 * Start Redpanda (Kafka) container
 */
async function startRedpanda(dockerNetwork: StartedNetwork) {
  console.log(chalk.cyan('🦜 Starting Redpanda (Kafka)...'));

  const container = await new GenericContainer('redpandadata/redpanda:v24.3.1')
    .withReuse() // Enable container reuse
    .withNetwork(dockerNetwork)
    .withNetworkAliases('redpanda')
    .withExposedPorts(9092, 8081, 8082)
    .withCommand([
      'redpanda',
      'start',
      '--smp=1', // Match codegen configuration
      '--memory=2G', // Match codegen configuration
      '--reserve-memory=0M',
      '--overprovisioned',
      '--node-id=0',
      '--check=false',
      '--kafka-addr=PLAINTEXT://0.0.0.0:9092',
      '--advertise-kafka-addr=PLAINTEXT://redpanda:9092',
      '--pandaproxy-addr=0.0.0.0:8082',
      '--advertise-pandaproxy-addr=redpanda:8082',
      '--schema-registry-addr=0.0.0.0:8081',
      '--rpc-addr=0.0.0.0:33145',
      '--advertise-rpc-addr=redpanda:33145',
    ])
    .withStartupTimeout(120000)
    .withWaitStrategy(
      Wait.forLogMessage(
        /starting Redpanda|Redpanda is ready|started Kafka API server/i,
      ).withStartupTimeout(120000),
    )
    .start();

  // Wait for Redpanda to fully initialize
  await new Promise((resolve) => setTimeout(resolve, 3000));

  // Verify Redpanda is responsive by creating CDC topic
  let topicCreated = false;
  let attempts = 0;
  const maxAttempts = 10;

  while (!topicCreated && attempts < maxAttempts) {
    attempts++;

    try {
      await container.exec([
        'rpk',
        'topic',
        'create',
        '_es-erp.private.cdc',
        '--partitions',
        '1',
        '--replicas',
        '1',
      ]);
      console.log(chalk.green('✅ Created CDC topic'));
      topicCreated = true;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);

      if (
        errorMessage.includes('container stopped') ||
        errorMessage.includes('container not running') ||
        errorMessage.includes('container paused')
      ) {
        console.error(chalk.red('❌ Redpanda container has stopped'));
        const logs = await getContainerLogs(container);
        console.error(
          'Container logs:',
          JSON.stringify(logs.slice(-2000), undefined, 2),
        );
        throw new Error(`Redpanda container stopped: ${errorMessage}`);
      }

      if (attempts >= maxAttempts) {
        console.error(chalk.red('❌ Failed to create CDC topic'));
        const logs = await getContainerLogs(container);
        console.error(
          'Container logs:',
          JSON.stringify(logs.slice(-2000), undefined, 2),
        );
        throw error;
      }

      console.log(
        chalk.yellow(
          `⏳ Waiting for Redpanda... (attempt ${attempts}/${maxAttempts})`,
        ),
      );
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }
  }

  const kafkaBootstrap = `${container.getHost()}:${container.getMappedPort(9092)}`;
  const schemaRegistryUrl = `http://${container.getHost()}:${container.getMappedPort(8081)}`;

  console.log(chalk.green('✅ Redpanda started'));
  return { container, kafkaBootstrap, schemaRegistryUrl };
}

/**
 * Start Kafka Connect container
 */
async function startKafkaConnect(
  dockerNetwork: StartedNetwork,
  mongoConnectionString: string,
) {
  // Use v11 (multi-arch) in CI, latest-arm64 for local ARM Macs
  const isCI = process.env.CI === 'true';
  const KAFKA_CONNECT_IMAGE = isCI
    ? '696398453447.dkr.ecr.us-west-2.amazonaws.com/es-erp-connect:v11'
    : '696398453447.dkr.ecr.us-west-2.amazonaws.com/es-erp-connect:latest-arm64';

  console.log(chalk.cyan('🔌 Starting Kafka Connect...'));
  console.log(chalk.dim(`   Using image: ${KAFKA_CONNECT_IMAGE}`));
  console.log(chalk.dim(`   Environment: ${isCI ? 'CI' : 'Local'}`));

  let container;
  try {
    container = await new GenericContainer(KAFKA_CONNECT_IMAGE)
      .withReuse() // Enable container reuse
      .withNetwork(dockerNetwork)
      .withNetworkAliases('kafka-connect')
      .withExposedPorts(8083)
      .withEnvironment({
        CONNECT_BOOTSTRAP_SERVERS: 'redpanda:9092',
        CONNECT_REST_PORT: '8083',
        CONNECT_REST_ADVERTISED_HOST_NAME: 'kafka-connect',
        CONNECT_GROUP_ID: 'es-erp-connect-test',
        CONNECT_CONFIG_STORAGE_TOPIC: '_connect-configs',
        CONNECT_OFFSET_STORAGE_TOPIC: '_connect-offsets',
        CONNECT_STATUS_STORAGE_TOPIC: '_connect-status',
        CONNECT_CONFIG_STORAGE_REPLICATION_FACTOR: '1',
        CONNECT_OFFSET_STORAGE_REPLICATION_FACTOR: '1',
        CONNECT_STATUS_STORAGE_REPLICATION_FACTOR: '1',
        CONNECT_KEY_CONVERTER:
          'org.apache.kafka.connect.storage.StringConverter',
        CONNECT_VALUE_CONVERTER: 'org.apache.kafka.connect.json.JsonConverter',
        CONNECT_VALUE_CONVERTER_SCHEMAS_ENABLE: 'false',
        CONNECT_PLUGIN_PATH:
          '/usr/share/java,/usr/share/confluent-hub-components',
        // Config providers for environment variable substitution
        CONNECT_CONFIG_PROVIDERS: 'env',
        CONNECT_CONFIG_PROVIDERS_ENV_CLASS:
          'org.apache.kafka.common.config.provider.EnvVarConfigProvider',
        // Connector environment variables
        MONGO_CONNECTION_STRING: mongoConnectionString,
        TOPIC_CREATION_DEFAULT_REPLICATION_FACTOR: '1',
        KAFKA_HEAP_OPTS: '-Xms512m -Xmx1024m',
      })
      .withWaitStrategy(
        Wait.forHttp('/', 8083).forStatusCode(200).withStartupTimeout(160_000),
      )
      .withStartupTimeout(160_000)
      .start();
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    if (
      errorMessage.includes('pull') ||
      errorMessage.includes('manifest') ||
      errorMessage.includes('unauthorized')
    ) {
      console.error(
        chalk.red('\n❌ Failed to pull Kafka Connect image from ECR'),
      );
      console.error(chalk.yellow('\n⚠️  ECR Authentication Required:'));
      console.error(
        chalk.dim(
          '   1. Get AWS credentials from "dev helper" for "legacy-power-user"',
        ),
      );
      console.error(
        chalk.dim(
          '   2. Run the following command to authenticate Docker with ECR:\n',
        ),
      );
      console.error(
        chalk.cyan(
          '      aws ecr get-login-password --region us-west-2 | docker login --username AWS --password-stdin 696398453447.dkr.ecr.us-west-2.amazonaws.com\n',
        ),
      );
    }
    throw error;
  }

  const connectEndpoint = `http://${container.getHost()}:${container.getMappedPort(8083)}`;

  console.log(chalk.green('✅ Kafka Connect started'));
  console.log(chalk.dim('   Endpoint:'), chalk.magenta(connectEndpoint));
  return { container, connectEndpoint };
}

/**
 * Start ksqlDB container
 */
async function startKsqlDB(dockerNetwork: StartedNetwork) {
  console.log(chalk.cyan('📊 Starting ksqlDB...'));

  const container = await new GenericContainer(ECR_IMAGE)
    .withReuse() // Enable container reuse
    .withNetwork(dockerNetwork)
    .withNetworkAliases('ksqldb')
    .withExposedPorts(5050, 8088)
    .withEnvironment({
      // Node/Express settings
      PORT: '5050',
      KSQL_LOG4J_ROOT_LOGLEVEL: 'error',
      // ksqlDB server settings
      KSQL_LISTENERS: 'http://0.0.0.0:8088',
      // Use container name for network communication
      KSQL_BOOTSTRAP_SERVERS: 'redpanda:9092',
      KSQL_KSQL_SCHEMA_REGISTRY_URL: 'http://redpanda:8081',
      KSQL_KSQL_SERVER_COMMAND_RESPONSE_TIMEOUT_MS: '5000',
      // JVM memory settings
      KAFKA_HEAP_OPTS: '-Xms1024m -Xmx2048m',
      // Cluster settings (local single instance)
      KSQL_KSQL_SERVICE_ID: 'es-erp-ksqldb-test',
      KSQL_KSQL_STREAMS_NUM_STANDBY_REPLICAS: '0',
      KSQL_KSQL_HEARTBEAT_ENABLE: 'true',
      KSQL_KSQL_LAG_REPORTING_ENABLE: 'true',
      // Topic naming (matches production pattern)
      KSQL_KSQL_OUTPUT_TOPIC_NAME_PREFIX: '_es-erp-ksqldb.',
      KSQL_KSQL_LOGGING_PROCESSING_TOPIC_NAME:
        '_es-erp-ksqldb_ksql_processing_log',
      // Streams settings (optimized for fast testing - matches codegen)
      KSQL_KSQL_STREAMS_NUM_STREAM_THREADS: '1', // Reduced for faster startup
      KSQL_KSQL_STREAMS_STATE_DIR: '/tmp/kafka-streams/data',
      KSQL_KSQL_STREAMS_COMMIT_INTERVAL_MS: '100', // Fast commits (default 2000ms)
      KSQL_KSQL_STREAMS_CACHE_MAX_BYTES_BUFFERING: '10485760', // 10MB cache
      KSQL_KSQL_STREAMS_METADATA_MAX_AGE_MS: '500', // Faster metadata refresh
      // Kafka Connect integration
      KSQL_KSQL_CONNECT_URL: 'http://kafka-connect:8083',
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
      Wait.forHttp('/info', 8088).forStatusCode(200).withStartupTimeout(60_000),
    )
    .withStartupTimeout(60_000)
    .start();

  const ksqldbEndpoint = `http://${container.getHost()}:${container.getMappedPort(8088)}`;

  console.log(chalk.green('✅ ksqlDB started'));
  return { container, ksqldbEndpoint };
}

export default async function globalSetup() {
  console.log(chalk.bold.cyan('\n🚀 ksqlDB Test Suite - Global Setup'));
  console.log(chalk.gray('─'.repeat(80)));

  if (REUSE_ENABLED) {
    console.log(
      chalk.dim(
        '♻️  Container reuse enabled (TESTCONTAINERS_REUSE_ENABLE=true)',
      ),
    );
  }

  const startTime = Date.now();

  try {
    // Create Docker network (lightweight operation, takes milliseconds)
    // Reused containers maintain their network connections automatically
    console.log(chalk.cyan('🌐 Creating Docker network...'));
    const network = await new Network().start();
    console.log(chalk.green('✅ Docker network created'));

    // Start MongoDB (will reuse if exists)
    const mongoResult = await startMongoDB(network);

    // Start Redpanda (will reuse if exists)
    const redpandaResult = await startRedpanda(network);

    // Start Kafka Connect (will reuse if exists)
    // Use internal mongo connection string for Docker network
    const internalMongoConnectionString =
      'mongodb://mongo:27017/es-erp?directConnection=true';
    const connectResult = await startKafkaConnect(
      network,
      internalMongoConnectionString,
    );

    // Start ksqlDB (will reuse if exists)
    const ksqldbResult = await startKsqlDB(network);

    // Get Kafka REST API URL (Redpanda HTTP Proxy on port 8082)
    const kafkaRestUrl = `http://${redpandaResult.container.getHost()}:${redpandaResult.container.getMappedPort(8082)}`;

    process.env.KSQLDB_ENDPOINT = ksqldbResult.ksqldbEndpoint;
    process.env.KAFKA_API_URL = redpandaResult.kafkaBootstrap;
    process.env.KAFKA_HOST_API_URL = redpandaResult.kafkaBootstrap; // External broker address for tests running on host
    process.env.KAFKA_REST_URL = kafkaRestUrl;
    process.env.KAFKA_CONNECT_URL = connectResult.connectEndpoint;
    process.env.MONGO_CONNECTION_STRING = mongoResult.mongoUrl;
    const setupTime = Math.round((Date.now() - startTime) / 1000);
    console.log(chalk.green(`\n✅ Containers started in ${setupTime}s`));

    // Store config for tests
    const config: KsqlTestConfig = {
      ksqldbEndpoint: ksqldbResult.ksqldbEndpoint,
      kafkaBootstrap: redpandaResult.kafkaBootstrap,
      schemaRegistryUrl: redpandaResult.schemaRegistryUrl,
      kafkaRestUrl,
      connectEndpoint: connectResult.connectEndpoint,
    };

    fs.writeFileSync(GLOBAL_CONFIG_PATH, JSON.stringify(config, null, 2));

    // Store container references for teardown
    (global as any).__KSQL_NETWORK__ = network;
    (global as any).__KSQL_MONGODB__ = mongoResult.container;
    (global as any).__KSQL_REDPANDA__ = redpandaResult.container;
    (global as any).__KSQL_KAFKA_CONNECT__ = connectResult.container;
    (global as any).__KSQL_KSQLDB__ = ksqldbResult.container;
    (global as any).__REUSE_ENABLED__ = REUSE_ENABLED;

    // Run all migrations to latest state
    console.log(chalk.cyan('\n⬆️  Running migrations...'));
    const migratePath = path.join(
      __dirname,
      '..',
      '..',
      'scripts',
      'migrate.js',
    );
    const { execSync } = require('child_process');

    try {
      execSync(`node ${migratePath} up`, {
        cwd: path.join(__dirname, '..', '..'),
        env: process.env,
        stdio: 'inherit',
      });
      console.log(chalk.green('✅ Migrations complete'));
    } catch (error) {
      console.error(chalk.red('❌ Migration failed:'), error);
      throw error;
    }

    const totalTime = Math.round((Date.now() - startTime) / 1000);
    console.log(chalk.green(`\n✅ Setup complete in ${totalTime}s`));
    console.log(chalk.dim('ksqlDB:'), chalk.magenta(config.ksqldbEndpoint));
    console.log(chalk.dim('Kafka:'), chalk.magenta(config.kafkaBootstrap));
    if (REUSE_ENABLED) {
      console.log(chalk.dim('\n💡 Containers will be reused in next test run'));
      console.log(
        chalk.dim('   Set'),
        chalk.cyan('TESTCONTAINERS_REUSE_ENABLE=false'),
        chalk.dim('to disable'),
      );
    }
    console.log('');
  } catch (error) {
    console.error(chalk.red('\n❌ Setup failed:'), error);
    throw error;
  }
}
