#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const chalk = require('chalk');
const { MongoClient } = require('mongodb');

// =============================================================================
// Configuration
// =============================================================================

/**
 * Load migration configuration
 */
const loadConfig = () => {
  const configPath = path.join(__dirname, '..', 'config', 'migrate-config.js');
  if (!fs.existsSync(configPath)) {
    throw new Error(`Config file not found: ${configPath}`);
  }
  return require(configPath);
};

// =============================================================================
// MongoDB Connection Management
// =============================================================================

let mongoClient = null;

/**
 * Get MongoDB client connection
 */
const getMongoClient = async (config) => {
  if (!mongoClient) {
    mongoClient = new MongoClient(config.mongodb.url, config.mongodb.options);
    await mongoClient.connect();
  }
  return mongoClient;
};

/**
 * Close MongoDB connection
 */
const closeMongoConnection = async () => {
  if (mongoClient) {
    await mongoClient.close();
    mongoClient = null;
  }
};

/**
 * Get MongoDB database instance
 */
const getDb = async (config) => {
  const client = await getMongoClient(config);
  return client.db(config.mongodb.databaseName);
};

/**
 * Get the changelog collection
 */
const getChangelogCollection = async (config) => {
  const db = await getDb(config);
  return db.collection(config.changelogCollectionName);
};

// =============================================================================
// ksqlDB API Client
// =============================================================================

/**
 * Poll command status until completion or timeout
 */
const pollCommandStatus = async (ksqlUrl, commandId, options = {}) => {
  const { pollInterval = 500, pollTimeout = 300000 } = options;
  const startTime = Date.now();
  let pollCount = 0;
  
  console.log(chalk.dim(`    Polling status for command: ${commandId}`));
  
  while (Date.now() - startTime < pollTimeout) {
    pollCount++;
    const elapsed = Date.now() - startTime;
    
    try {
      const response = await fetch(`${ksqlUrl}/status/${commandId}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/vnd.ksql.v1+json' },
      });
      
      if (response.ok) {
        const status = await response.json();
        
        // Log the actual status response
        console.log(chalk.dim(`    Poll #${pollCount} (${elapsed}ms): status="${status.status}", message="${status.message || 'N/A'}"`));
        
        if (status.status === 'SUCCESS') {
          console.log(chalk.green(`    ✓ Command completed successfully after ${pollCount} polls (${elapsed}ms)`));
          return status;
        } else if (status.status === 'ERROR') {
          console.log(chalk.red(`    ✗ Command failed: ${status.message}`));
          throw new Error(`Command failed: ${status.message}`);
        }
        
        // Still running, wait and retry
        await new Promise(resolve => setTimeout(resolve, pollInterval));
      } else {
        console.log(chalk.dim(`    Poll #${pollCount} (${elapsed}ms): HTTP ${response.status} - Status endpoint not ready yet`));
        await new Promise(resolve => setTimeout(resolve, pollInterval));
      }
    } catch (error) {
      if (Date.now() - startTime >= pollTimeout) {
        throw new Error(`Polling timeout after ${pollTimeout}ms: ${error.message}`);
      }
      console.log(chalk.dim(`    Poll #${pollCount} (${elapsed}ms): Error - ${error.message}`));
      await new Promise(resolve => setTimeout(resolve, pollInterval));
    }
  }
  
  throw new Error(`Command status polling timeout after ${pollTimeout}ms`);
};

/**
 * Execute a ksqlDB DDL/DML statement
 */
const executeKsqlStatement = async (ksqlUrl, statement, options = {}) => {
  const {
    offsetReset = 'earliest',
    commandSequenceNumber = null,
    waitForCompletion = true,
    pollInterval = 500,
    pollTimeout = 300000,
  } = options;
  
  try {
    const requestBody = {
      ksql: statement,
      streamsProperties: {
        'auto.offset.reset': offsetReset,
      },
    };
    
    if (commandSequenceNumber !== null) {
      requestBody.commandSequenceNumber = commandSequenceNumber;
      console.log(chalk.dim(`    Using commandSequenceNumber: ${commandSequenceNumber}`));
    }
    
    const response = await fetch(`${ksqlUrl}/ksql`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/vnd.ksql.v1+json' },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    
    const result = {
      commandSequenceNumber: data[0]?.commandSequenceNumber ?? null,
      commandId: data[0]?.commandId ?? null,
      commandStatus: data[0]?.commandStatus ?? null,
    };
    
    if (result.commandSequenceNumber !== null) {
      console.log(chalk.dim(`    Received commandSequenceNumber: ${result.commandSequenceNumber}`));
    }
    
    if (waitForCompletion && result.commandId) {
      await pollCommandStatus(ksqlUrl, result.commandId, { pollInterval, pollTimeout });
    }
    
    return result;
  } catch (error) {
    if (
      error.cause?.code === 'ECONNREFUSED' ||
      error.message.includes('fetch failed')
    ) {
      throw new Error(
        `Cannot connect to ksqlDB at ${ksqlUrl}\n` +
          `  Possible causes:\n` +
          `  1. ksqlDB service is not running (run: docker compose up -d ksqldb-server)\n` +
          `  2. ksqlDB service failed to start (check: docker compose logs ksqldb-server)\n` +
          `  3. Wrong KSQLDB_ENDPOINT configured (current: ${ksqlUrl})\n` +
          `\n` +
          `  Original error: ${error.message}`,
      );
    }
    throw error;
  }
};

// =============================================================================
// Migration State Management
// =============================================================================

/**
 * Get list of applied migrations from MongoDB
 */
const getAppliedMigrations = async (config) => {
  try {
    const collection = await getChangelogCollection(config);
    const migrations = await collection
      .find({})
      .sort({ appliedAt: 1 })
      .toArray();

    return migrations.map((doc) => ({
      fileName: doc.fileName,
      appliedAt: doc.appliedAt.toISOString(),
    }));
  } catch (error) {
    console.warn(
      chalk.yellow('Warning:'),
      'Could not query MongoDB changelog:',
      error.message,
    );
    return [];
  }
};

/**
 * Record a migration as applied in MongoDB
 */
const recordMigration = async (config, fileName) => {
  const collection = await getChangelogCollection(config);
  await collection.insertOne({
    fileName,
    appliedAt: new Date(),
  });
};

// =============================================================================
// File System Operations
// =============================================================================

/**
 * Get all migration files from the migrations directory
 */
const getMigrationFiles = (migrationsDir, fileExtension) => {
  if (!fs.existsSync(migrationsDir)) {
    fs.mkdirSync(migrationsDir, { recursive: true });
  }

  return fs
    .readdirSync(migrationsDir)
    .filter((file) => file.endsWith(fileExtension))
    .sort();
};

/**
 * Parse and execute SQL statements from a migration file
 * Supports special -- WAIT <milliseconds> comments for explicit delays
 */
const executeMigrationFile = async (ksqlUrl, filePath, config) => {
  const sqlContent = fs.readFileSync(filePath, 'utf8');
  
  const lines = sqlContent.split('\n');
  const items = [];
  
  let currentStatement = [];
  
  for (const line of lines) {
    const trimmed = line.trim();
    
    // Check for WAIT comment: -- WAIT <milliseconds>
    const waitMatch = trimmed.match(/^--\s*WAIT\s+(\d+)/i);
    if (waitMatch) {
      if (currentStatement.length > 0) {
        const sql = currentStatement.join('\n').trim();
        if (sql.length > 0) {
          items.push({ type: 'sql', content: sql });
        }
        currentStatement = [];
      }
      
      const ms = parseInt(waitMatch[1], 10);
      items.push({ type: 'wait', ms });
      continue;
    }
    
    // Skip empty lines and regular comments
    if (trimmed.length === 0 || trimmed.startsWith('--')) {
      continue;
    }
    
    currentStatement.push(line);
  }
  
  if (currentStatement.length > 0) {
    const sql = currentStatement.join('\n').trim();
    if (sql.length > 0) {
      items.push({ type: 'sql', content: sql });
    }
  }
  
  // Split SQL blocks by semicolon
  const statements = [];
  for (const item of items) {
    if (item.type === 'wait') {
      statements.push(item);
    } else {
      const sqlStatements = item.content
        .split(';')
        .map((stmt) => stmt.trim())
        .filter((stmt) => stmt.length > 0)
        .map((stmt) => ({ type: 'sql', content: stmt }));
      statements.push(...sqlStatements);
    }
  }

  const sqlCount = statements.filter(s => s.type === 'sql').length;
  const waitCount = statements.filter(s => s.type === 'wait').length;
  console.log(chalk.dim(`  Executing ${sqlCount} statement(s)${waitCount > 0 ? ` with ${waitCount} wait(s)` : ''}...`));
  
  let currentSequenceNumber = null;
  let sqlStatementNum = 0;
  
  try {
    for (let i = 0; i < statements.length; i++) {
      const item = statements[i];
      
      if (item.type === 'wait') {
        console.log(chalk.yellow(`  ⏱  Waiting ${item.ms}ms...`));
        await new Promise(resolve => setTimeout(resolve, item.ms));
        console.log(chalk.dim(`  ✓ Wait complete`));
      } else {
        sqlStatementNum++;
        const statement = item.content + ';';
        console.log(chalk.dim(`  Statement ${sqlStatementNum}/${sqlCount}`));
        
        const result = await executeKsqlStatement(ksqlUrl, statement, {
          commandSequenceNumber: currentSequenceNumber,
          waitForCompletion: config.ksqldb.waitForCompletion ?? true,
          pollInterval: config.ksqldb.pollInterval ?? 500,
          pollTimeout: config.ksqldb.pollTimeout ?? 300000,
        });
        
        if (result.commandSequenceNumber !== null) {
          currentSequenceNumber = result.commandSequenceNumber;
        }
      }
    }
  } catch (error) {
    throw new Error(`Failed to execute statement: ${error.message}`);
  }
};

/**
 * Parse SQL file to extract table and stream names
 */
const parseTablesFromSql = (sqlContent) => {
  const tables = [];
  const streams = [];

  const tableRegex = /CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?(\w+)/gi;
  let match;
  while ((match = tableRegex.exec(sqlContent)) !== null) {
    tables.push(match[1]);
  }

  const streamRegex = /CREATE\s+STREAM\s+(?:IF\s+NOT\s+EXISTS\s+)?(\w+)/gi;
  while ((match = streamRegex.exec(sqlContent)) !== null) {
    streams.push(match[1]);
  }

  return { tables, streams };
};

/**
 * Generate test file content for a migration
 */
const generateTestFileContent = (fileName, migrationName, objects) => {
  const { tables, streams } = objects;
  const allObjects = [...tables, ...streams];

  let testContent = `import { table, retry } from './utils/test-helpers.generated';

describe('Migration: ${migrationName}', () => {
`;

  if (allObjects.length > 0) {
    allObjects.forEach((objectName) => {
      testContent += `
  describe('${objectName}', () => {
    it('should support data operations', async () => {
      // TODO: Add tests for INSERT/GET operations
      // Example with type safety:
      // const testData = { /* your data matching ${objectName} schema */ };
      // await table('${objectName}').insert(testData);
      // await retry(async () => {
      //   const result = await table('${objectName}').get('some-id');
      //   expect(result).toBeDefined();
      // });
    });
  });
`;
    });
  } else {
    testContent += `
  it('should apply migration successfully', async () => {
    // TODO: Add tests to verify migration effects
    // Use table() function from test-helpers.generated for type-safe operations
  });
`;
  }

  testContent += `});
`;

  return testContent;
};

/**
 * Create a new migration file with a timestamp prefix
 */
const createMigrationFile = (migrationsDir, fileExtension, migrationName) => {
  const timestamp = new Date()
    .toISOString()
    .replace(/[-:T]/g, '')
    .split('.')[0];

  const fileName = `${timestamp}-${migrationName}${fileExtension}`;
  const filePath = path.join(migrationsDir, fileName);

  const testFileName = fileName.replace(/\.sql$/, '.test.ts');
  const testsDir = path.join(path.dirname(migrationsDir), 'tests');
  if (!fs.existsSync(testsDir)) {
    fs.mkdirSync(testsDir, { recursive: true });
  }
  const testFilePath = path.join(testsDir, testFileName);

  const migrationTemplate = `-- Migration: ${migrationName}
-- Created: ${new Date().toISOString()}
-- Test file: ${testFileName}
-- 
-- Add your ksqlDB statements below:
-- Each statement should end with a semicolon
-- 
-- Note: Migrations are forward-only. There are no rollback files.
-- Plan your schema changes carefully.

`;

  fs.writeFileSync(filePath, migrationTemplate);

  // Parse SQL to detect tables/streams
  const objects = parseTablesFromSql(migrationTemplate);

  // Generate test file
  const testContent = generateTestFileContent(fileName, migrationName, objects);
  fs.writeFileSync(testFilePath, testContent);

  console.log(chalk.green('✓'), 'Created migration files:');
  console.log('  ', chalk.cyan(fileName));
  console.log('  ', chalk.cyan(testFileName));

  return fileName;
};

// =============================================================================
// CLI Commands
// =============================================================================

/**
 * Show migration status (applied vs pending)
 */
const showStatus = async (config) => {
  console.log(chalk.bold('\nMigration Status:'));
  console.log(chalk.gray('─'.repeat(80)));

  const appliedMigrations = await getAppliedMigrations(config);
  const migrationFiles = getMigrationFiles(
    config.migrationsDir,
    config.migrationFileExtension,
  );

  if (migrationFiles.length === 0) {
    console.log(chalk.dim('No migration files found.'));
    return;
  }

  const appliedSet = new Set(appliedMigrations.map((m) => m.fileName));

  console.log(chalk.cyan('Total migrations:'), migrationFiles.length);
  console.log(chalk.green('Applied:'), appliedMigrations.length);
  console.log(
    chalk.yellow('Pending:'),
    migrationFiles.length - appliedMigrations.length,
  );
  console.log('');

  migrationFiles.forEach((file) => {
    const isApplied = appliedSet.has(file);
    if (isApplied) {
      const appliedAt = appliedMigrations.find(
        (m) => m.fileName === file,
      )?.appliedAt;
      console.log(
        chalk.green('✓ APPLIED '),
        chalk.white(file),
        chalk.dim(`(${appliedAt})`),
      );
    } else {
      console.log(chalk.yellow('○ PENDING '), chalk.white(file));
    }
  });

  console.log('');
};

/**
 * Run pending migrations
 */
const runMigrationsInternal = async (config, options = {}) => {
  console.log(chalk.bold('\nRunning ksqlDB migrations...'));
  console.log(chalk.gray('─'.repeat(80)));

  const appliedMigrations = await getAppliedMigrations(config);
  const migrationFiles = getMigrationFiles(
    config.migrationsDir,
    config.migrationFileExtension,
  );

  const appliedSet = new Set(appliedMigrations.map((m) => m.fileName));
  let pendingMigrations = migrationFiles.filter(
    (file) => !appliedSet.has(file),
  );

  // Support --to flag to target a specific migration
  const { steps, to } = options;
  if (to) {
    const targetIndex = migrationFiles.indexOf(to);
    if (targetIndex === -1) {
      throw new Error(`Target migration not found: ${to}`);
    }

    const lastAppliedIndex =
      appliedMigrations.length > 0
        ? migrationFiles.indexOf(
            appliedMigrations[appliedMigrations.length - 1].fileName,
          )
        : -1;

    if (targetIndex <= lastAppliedIndex) {
      console.log(
        chalk.green('✓ Already at or past target migration:'),
        chalk.white(to),
      );
      return;
    } else {
      // Filter pending migrations up to and including target
      pendingMigrations = migrationFiles.slice(
        lastAppliedIndex + 1,
        targetIndex + 1,
      );
      console.log(chalk.cyan(`Migrating to target: ${to}`));
    }
  } else if (steps && steps > 0) {
    pendingMigrations = pendingMigrations.slice(0, steps);
  }

  if (pendingMigrations.length === 0) {
    console.log(chalk.green('✓ No pending migrations.'));
    
    if (appliedMigrations.length > 0) {
      console.log('');
      console.log(chalk.bold('Applied migrations:'));
      appliedMigrations.forEach((m) => {
        console.log(
          chalk.green('  ✓'),
          chalk.white(m.fileName),
          chalk.dim(`(${m.appliedAt})`),
        );
      });
    } else {
      console.log(chalk.dim('  No migrations have been applied yet.'));
    }
    console.log('');
    return;
  }

  console.log(
    chalk.cyan(`Found ${pendingMigrations.length} pending migration(s):`),
  );
  pendingMigrations.forEach((file) =>
    console.log(chalk.dim('  -'), chalk.white(file)),
  );
  console.log('');

  for (const fileName of pendingMigrations) {
    console.log(chalk.blue('Applying:'), chalk.cyan(fileName));
    const filePath = path.join(config.migrationsDir, fileName);

    try {
      await executeMigrationFile(config.ksqldb.url, filePath, config);
      await recordMigration(config, fileName);
      console.log(
        chalk.green('✓ Successfully applied:'),
        chalk.white(fileName),
      );
    } catch (error) {
      console.error(
        chalk.red('✗ Failed to apply'),
        chalk.white(fileName) + ':',
        error.message,
      );
      throw error;
    }
  }

  console.log('');
  console.log(chalk.green.bold('✓ All migrations applied successfully.'));
  console.log('');
};

/**
 * Create a new migration file
 */
const createMigration = (config, migrationName) => {
  createMigrationFile(
    config.migrationsDir,
    config.migrationFileExtension,
    migrationName,
  );
};

// =============================================================================
// CLI Entry Point
// =============================================================================

/**
 * Parse command line arguments
 */
const parseArgs = (args) => {
  const options = {};
  const positional = [];

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg.startsWith('--')) {
      if (arg.includes('=')) {
        const [key, value] = arg.slice(2).split('=');
        options[key] = value;
      } else {
        const key = arg.slice(2);
        if (i + 1 < args.length && !args[i + 1].startsWith('--')) {
          options[key] = args[i + 1];
          i++;
        } else {
          options[key] = true;
        }
      }
    } else {
      positional.push(arg);
    }
  }

  return { options, positional };
};

const main = async () => {
  const [command, ...rawArgs] = process.argv.slice(2);

  if (!command) {
    console.error(chalk.red('Error:'), 'No command specified');
    console.error('');
    console.error(chalk.bold('Usage:'), 'node scripts/migrate.js <command> [options]');
    console.error('');
    console.error(chalk.bold('Commands:'));
    console.error(
      '  ',
      chalk.cyan('create <name>  '),
      ' - Create new migration file',
    );
    console.error(
      '  ',
      chalk.cyan('status         '),
      ' - Show migration status',
    );
    console.error(
      '  ',
      chalk.cyan('up [options]   '),
      ' - Run pending migrations',
    );
    console.error('');
    console.error(chalk.bold('Options:'));
    console.error(
      '  ',
      chalk.cyan('--to=<filename>'),
      ' - Migrate up to specific migration',
    );
    console.error(
      '  ',
      chalk.cyan('--steps=N      '),
      ' - Apply N migrations',
    );
    process.exit(1);
  }

  const config = loadConfig();

  if (!config.ksqldb.url) {
    throw new Error('KSQLDB_ENDPOINT environment variable is not set');
  }

  try {
    switch (command) {
      case 'create': {
        const { positional } = parseArgs(rawArgs);
        const migrationName = positional[0];
        if (!migrationName) {
          console.error(chalk.red('Error:'), 'Migration name required');
          console.error(
            chalk.bold('Usage:'),
            'node scripts/migrate.js create',
            chalk.cyan('<name>'),
          );
          process.exit(1);
        }
        createMigration(config, migrationName);
        break;
      }

      case 'status':
        await showStatus(config);
        break;

      case 'up': {
        const { options } = parseArgs(rawArgs);
        const upOptions = {
          steps: options.steps ? parseInt(options.steps, 10) : undefined,
          to: options.to,
        };
        await runMigrationsInternal(config, upOptions);
        break;
      }

      default:
        console.error(
          chalk.red('Error:'),
          'Unknown command:',
          chalk.cyan(command),
        );
        process.exit(1);
    }
  } catch (error) {
    console.error(chalk.red('\n✗ Error:'), error.message);
    process.exit(1);
  } finally {
    await closeMongoConnection();
  }
};

// Run if called directly
if (require.main === module) {
  main().catch((error) => {
    console.error(chalk.red('\n✗ Fatal error:'), error.message);
    process.exit(1);
  });
}

module.exports = {
  main,
  runMigrations: async (options = {}) => {
    const config = loadConfig();
    await runMigrationsInternal(config, options);
    await closeMongoConnection();
  },
  loadConfig,
};
