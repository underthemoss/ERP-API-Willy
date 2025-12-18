#!/usr/bin/env node

const { GenericContainer, Network, Wait } = require('testcontainers');
const chalk = require('chalk');

// =============================================================================
// Configuration
// =============================================================================

const ECR_IMAGE = 'confluentinc/cp-ksqldb-server:8.0.2';

// Store container references for cleanup
let network = null;
let redpandaContainer = null;
let mongoContainer = null;
let kafkaConnectContainer = null;
let ksqldbContainer = null;
let isShuttingDown = false;

// =============================================================================
// Cleanup Handler
// =============================================================================

/**
 * Gracefully stop all containers and clean up resources
 */
async function cleanup() {
  if (isShuttingDown) {
    return;
  }
  isShuttingDown = true;

  console.log(chalk.cyan('\n🧹 Shutting down containers...'));

  try {
    if (ksqldbContainer) {
      console.log(chalk.cyan('📊 Stopping ksqlDB...'));
      await ksqldbContainer.stop();
      console.log(chalk.green('✅ ksqlDB stopped'));
    }
  } catch (error) {
    console.warn(chalk.yellow('⚠️  Failed to stop ksqlDB:'), error.message);
  }

  try {
    if (kafkaConnectContainer) {
      console.log(chalk.cyan('🔌 Stopping Kafka Connect...'));
      await kafkaConnectContainer.stop();
      console.log(chalk.green('✅ Kafka Connect stopped'));
    }
  } catch (error) {
    console.warn(chalk.yellow('⚠️  Failed to stop Kafka Connect:'), error.message);
  }

  try {
    if (mongoContainer) {
      console.log(chalk.cyan('🍃 Stopping MongoDB...'));
      await mongoContainer.stop();
      console.log(chalk.green('✅ MongoDB stopped'));
    }
  } catch (error) {
    console.warn(chalk.yellow('⚠️  Failed to stop MongoDB:'), error.message);
  }

  try {
    if (redpandaContainer) {
      console.log(chalk.cyan('🦜 Stopping Redpanda...'));
      await redpandaContainer.stop();
      console.log(chalk.green('✅ Redpanda stopped'));
    }
  } catch (error) {
    console.warn(chalk.yellow('⚠️  Failed to stop Redpanda:'), error.message);
  }

  try {
    if (network) {
      console.log(chalk.cyan('🌐 Stopping Docker network...'));
      await network.stop();
      console.log(chalk.green('✅ Docker network stopped'));
    }
  } catch (error) {
    console.warn(chalk.yellow('⚠️  Failed to stop network:'), error.message);
  }

  console.log(chalk.green('✅ Cleanup complete\n'));
  process.exit(0);
}

// Register cleanup handlers
process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);
process.on('exit', () => {
  if (!isShuttingDown) {
    console.log(chalk.yellow('\n⚠️  Unexpected exit, containers may still be running'));
  }
});

// =============================================================================
// Container Management
// =============================================================================

/**
 * Get container logs for debugging
 */
async function getContainerLogs(container) {
  try {
    const logs = await container.logs();
    return logs.toString();
  } catch (error) {
    return `Failed to get logs: ${error}`;
  }
}

/**
 * Start Redpanda (Kafka) container
 */
async function startRedpanda(dockerNetwork) {
  console.log(chalk.cyan('🦜 Starting Redpanda (Kafka)...'));

  const container = await new GenericContainer('redpandadata/redpanda:v24.3.1')
    .withNetwork(dockerNetwork)
    .withNetworkAliases('redpanda')
    .withExposedPorts(9092, 8081, 8082)
    .withCommand([
      'redpanda',
      'start',
      '--smp=1',
      '--memory=2G',
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
    .withStartupTimeout(120000) // 2 minutes timeout
    .withWaitStrategy(
      Wait.forLogMessage(
        /starting Redpanda|Redpanda is ready|started Kafka API server/i,
      ).withStartupTimeout(120000),
    )
    .start();

  // Wait for Redpanda to fully initialize
  await new Promise((resolve) => setTimeout(resolve, 3000));

  // Verify Redpanda is responsive by creating a test topic
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
      console.log(chalk.green('✅ Created CDC topic: _es-erp.private.cdc'));
      topicCreated = true;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);

      // Check if container has stopped
      if (
        errorMessage.includes('container stopped') ||
        errorMessage.includes('container not running') ||
        errorMessage.includes('container paused')
      ) {
        console.error(
          chalk.red('❌ Redpanda container has stopped or crashed'),
        );
        const logs = await getContainerLogs(container);
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
        const logs = await getContainerLogs(container);
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

  const kafkaBootstrap = `${container.getHost()}:${container.getMappedPort(9092)}`;
  const schemaRegistryUrl = `http://${container.getHost()}:${container.getMappedPort(8081)}`;

  console.log(chalk.green('✅ Redpanda started'));
  console.log(chalk.dim('   Kafka Bootstrap:'), chalk.magenta(kafkaBootstrap));
  console.log(
    chalk.dim('   Schema Registry:'),
    chalk.magenta(schemaRegistryUrl),
  );

  return {
    container,
    kafkaBootstrap,
    schemaRegistryUrl,
  };
}

/**
 * Start MongoDB container with replica set
 */
async function startMongoDB(dockerNetwork) {
  console.log(chalk.cyan('🍃 Starting MongoDB...'));

  const container = await new GenericContainer('mongo:7')
    .withNetwork(dockerNetwork)
    .withNetworkAliases('mongo')
    .withExposedPorts(27017)
    .withCommand(['--replSet', 'rs0', '--bind_ip_all'])
    .withWaitStrategy(
      Wait.forLogMessage(/Waiting for connections/i).withStartupTimeout(60000),
    )
    .withStartupTimeout(60000)
    .start();

  const mongoHost = container.getHost();
  const mongoPort = container.getMappedPort(27017);
  const mongoConnectionString = `mongodb://${mongoHost}:${mongoPort}/es-erp?replicaSet=rs0&directConnection=true`;

  // Initialize replica set
  const { MongoClient } = require('mongodb');
  const client = new MongoClient(mongoConnectionString);

  try {
    await client.connect();
    const admin = client.db().admin();

    // Initialize the replica set using mongo:27017 (Docker network hostname)
    // This allows other containers to connect via the replica set
    await admin.command({
      replSetInitiate: {
        _id: 'rs0',
        members: [{ _id: 0, host: 'mongo:27017' }],
      },
    });

    console.log(chalk.cyan('⏳ Waiting for replica set to be ready...'));

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
  console.log(chalk.dim('   Connection:'), chalk.magenta(mongoConnectionString));

  return {
    container,
    mongoConnectionString,
  };
}

/**
 * Start Kafka Connect container
 */
async function startKafkaConnect(dockerNetwork, mongoConnectionString) {
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
      CONNECT_KEY_CONVERTER: 'org.apache.kafka.connect.storage.StringConverter',
      CONNECT_VALUE_CONVERTER: 'org.apache.kafka.connect.json.JsonConverter',
      CONNECT_VALUE_CONVERTER_SCHEMAS_ENABLE: 'false',
      CONNECT_PLUGIN_PATH: '/usr/share/java,/usr/share/confluent-hub-components',
      // Config providers for environment variable substitution
      CONNECT_CONFIG_PROVIDERS: 'env',
      CONNECT_CONFIG_PROVIDERS_ENV_CLASS: 'org.apache.kafka.common.config.provider.EnvVarConfigProvider',
      // Connector environment variables
      MONGO_CONNECTION_STRING: mongoConnectionString,
      TOPIC_CREATION_DEFAULT_REPLICATION_FACTOR: '1',
      KAFKA_HEAP_OPTS: '-Xms512m -Xmx1024m',
    })
    .withWaitStrategy(
      Wait.forHttp('/', 8083)
        .forStatusCode(200)
        .withStartupTimeout(160_000),
    )
    .withStartupTimeout(160_000)
    .start();
  } catch (error) {
    if (error.message?.includes('pull') || error.message?.includes('manifest') || error.message?.includes('unauthorized')) {
      console.error(chalk.red('\n❌ Failed to pull Kafka Connect image from ECR'));
      console.error(chalk.yellow('\n⚠️  ECR Authentication Required:'));
      console.error(chalk.dim('   1. Get AWS credentials from "dev helper" for "legacy-power-user"'));
      console.error(chalk.dim('   2. Run the following command to authenticate Docker with ECR:\n'));
      console.error(chalk.cyan('      aws ecr get-login-password --region us-west-2 | docker login --username AWS --password-stdin 696398453447.dkr.ecr.us-west-2.amazonaws.com\n'));
    }
    throw error;
  }

  const connectEndpoint = `http://${container.getHost()}:${container.getMappedPort(8083)}`;

  console.log(chalk.green('✅ Kafka Connect started'));
  console.log(chalk.dim('   Endpoint:'), chalk.magenta(connectEndpoint));

  return {
    container,
    connectEndpoint,
  };
}

/**
 * Start ksqlDB container
 */
async function startKsqlDB(dockerNetwork) {
  console.log(chalk.cyan('📊 Starting ksqlDB...'));
  console.log(chalk.dim(`   Using image: ${ECR_IMAGE}`));

  const container = await new GenericContainer(ECR_IMAGE)
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
      // Streams settings (optimized for fast testing)
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
      Wait.forHttp('/info', 8088)
        .forStatusCode(200)
        .withStartupTimeout(60_000),
    )
    .withStartupTimeout(60_000)
    .start();

  const ksqldbEndpoint = `http://${container.getHost()}:${container.getMappedPort(8088)}`;

  console.log(chalk.green('✅ ksqlDB started'));
  console.log(chalk.dim('   Endpoint:'), chalk.magenta(ksqldbEndpoint));

  return {
    container,
    ksqldbEndpoint,
  };
}

// =============================================================================
// Migration Runner & State Management
// =============================================================================

const fs = require('fs');
const path = require('path');

/**
 * Get list of migration files from migrations directory
 */
function getMigrationFiles() {
  const migrationsDir = path.join(__dirname, '..', 'migrations');
  const files = fs.readdirSync(migrationsDir);
  
  // Get only .sql files (not .undo.sql files)
  const migrationFiles = files
    .filter(f => f.endsWith('.sql') && !f.endsWith('.undo.sql'))
    .sort(); // Sort by timestamp in filename
  
  return migrationFiles;
}

/**
 * Capture current ksqlDB state using post-migrate.js
 */
async function captureState(ksqldbEndpoint, connectEndpoint) {
  process.env.KSQLDB_ENDPOINT = ksqldbEndpoint;
  process.env.KAFKA_CONNECT_URL = connectEndpoint;
  
  // Run post-migrate to capture state
  const { main } = require('./post-migrate.js');
  await main();
  
  // Read the captured state
  const stateFile = path.join(__dirname, '..', 'state.json');
  const state = JSON.parse(fs.readFileSync(stateFile, 'utf8'));
  
  return state;
}

/**
 * Apply all migrations and capture state
 */
async function runMigrations(ksqldbEndpoint, connectEndpoint) {
  console.log(chalk.bold.cyan('\n🧪 Running Migration Reversibility Test'));
  console.log(chalk.gray('─'.repeat(80)));
  
  const migrationFiles = getMigrationFiles();
  console.log(chalk.dim(`Found ${migrationFiles.length} migration(s) to test\n`));
  
  // Capture initial state (no migrations applied)
  console.log(chalk.cyan('📸 Capturing initial state (no migrations)...'));
  await captureState(ksqldbEndpoint, connectEndpoint);
  
  // Apply all migrations at once
  try {
    process.env.KSQLDB_ENDPOINT = ksqldbEndpoint;
    const { main } = require('./migrate.js');
    
    // Override process.argv to simulate 'up' command (applies all pending)
    const originalArgv = process.argv;
    process.argv = ['node', 'migrate.js', 'up'];
    
    try {
      await main();
    } finally {
      process.argv = originalArgv;
    }
    
    // Capture final state
    await captureState(ksqldbEndpoint, connectEndpoint);
    
    console.log(chalk.green('\n✓ All migrations applied successfully.\n'));
    return true;
  } catch (error) {
    console.error(chalk.red('\n❌ Failed to apply migrations:'), error.message);
    return false;
  }
}

// =============================================================================
// Main Entry Point
// =============================================================================

async function main() {
  const startTime = Date.now();

  console.log(chalk.bold.cyan('\n🚀 ksqlDB Migration Test Environment'));
  console.log(chalk.gray('─'.repeat(80)));
  console.log(
    chalk.dim('Starting ephemeral containers for migration testing...\n'),
  );

  try {
    // Create Docker network
    console.log(chalk.cyan('🌐 Creating Docker network...'));
    network = await new Network().start();
    console.log(chalk.green('✅ Docker network created'));

    // Start Redpanda
    const redpandaResult = await startRedpanda(network);
    redpandaContainer = redpandaResult.container;

    // Start MongoDB
    const mongoResult = await startMongoDB(network);
    mongoContainer = mongoResult.container;
    
    // Set MongoDB connection string for migration script
    process.env.MONGO_CONNECTION_STRING = mongoResult.mongoConnectionString;

    // Start Kafka Connect (needs internal mongo connection string)
    const internalMongoConnectionString = 'mongodb://mongo:27017/es-erp?replicaSet=rs0';
    console.log(chalk.dim(`   Setting MONGO_CONNECTION_STRING: ${internalMongoConnectionString}`));
    const connectResult = await startKafkaConnect(network, internalMongoConnectionString);
    kafkaConnectContainer = connectResult.container;

    // Start ksqlDB
    const ksqldbResult = await startKsqlDB(network);
    ksqldbContainer = ksqldbResult.container;

    const setupTime = Math.round((Date.now() - startTime) / 1000);
    console.log(
      chalk.green(`\n✅ All services started in ${setupTime}s`),
    );

    // Run migrations
    const testPassed = await runMigrations(ksqldbResult.ksqldbEndpoint, connectResult.connectEndpoint);

    // Cleanup and exit
    await cleanup();
    process.exit(testPassed ? 0 : 1);
  } catch (error) {
    console.error(chalk.red('\n❌ Error:'), error.message);
    if (error.stack) {
      console.error(chalk.dim(error.stack));
    }
    await cleanup();
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}
