#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const stringify = require('json-stable-stringify');

// Load environment variables
require('dotenv').config({ path: './env/.env.local' });

/**
 * Execute a ksqlDB DDL/DML statement
 */
const executeKsqlStatement = async (ksqlUrl, statement, commandSequenceNumber = null) => {
  const requestBody = {
    ksql: statement,
    streamsProperties: {},
  };
  
  // Include commandSequenceNumber if provided
  if (commandSequenceNumber !== null) {
    requestBody.commandSequenceNumber = commandSequenceNumber;
  }
  
  const response = await fetch(`${ksqlUrl}/ksql`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/vnd.ksql.v1+json' },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${await response.text()}`);
  }

  const data = await response.json();
  
  // Extract and return commandSequenceNumber for chaining
  return {
    data,
    commandSequenceNumber: data[0]?.commandSequenceNumber ?? null,
  };
};

/**
 * Parse SHOW command response to extract list items
 */
const parseShowResponse = (response, key) => {
  if (!response || !response[0] || !response[0][key]) {
    return [];
  }
  return response[0][key];
};

/**
 * Describe a stream or table to get detailed schema
 */
const describeSource = async (ksqlUrl, sourceName, commandSequenceNumber = null) => {
  try {
    const { data } = await executeKsqlStatement(
      ksqlUrl,
      `DESCRIBE ${sourceName};`,
      commandSequenceNumber,
    );

    if (
      data &&
      data[0] &&
      data[0]['@type'] === 'sourceDescription'
    ) {
      return data[0].sourceDescription;
    }

    return null;
  } catch (error) {
    console.warn(`  Warning: Could not describe ${sourceName}:`, error.message);
    return null;
  }
};

/**
 * Get connector config from Kafka Connect REST API
 */
const getConnectorConfig = async (connectUrl, connectorName) => {
  try {
    const response = await fetch(`${connectUrl}/connectors/${connectorName}/config`);
    if (!response.ok) {
      console.warn(`  Warning: Could not get config for connector ${connectorName}`);
      return null;
    }
    return await response.json();
  } catch (error) {
    console.warn(`  Warning: Failed to fetch connector config for ${connectorName}:`, error.message);
    return null;
  }
};

/**
 * Reconstruct CREATE CONNECTOR statement from config
 */
const reconstructConnectorStatement = (connectorName, config) => {
  if (!config) return null;
  
  // Extract connector class to determine if it's SOURCE or SINK
  const connectorClass = config['connector.class'] || '';
  const connectorType = connectorClass.includes('Source') ? 'SOURCE' : 'SINK';
  
  // Build the CREATE CONNECTOR statement
  const lines = [`CREATE ${connectorType} CONNECTOR ${connectorName} WITH (`];
  
  // Sort config keys for determinism and convert to SQL format
  const sortedKeys = Object.keys(config).sort();
  const configLines = sortedKeys.map((key, index) => {
    const value = config[key];
    const isLast = index === sortedKeys.length - 1;
    return `  '${key}' = '${value}'${isLast ? '' : ','}`;
  });
  
  lines.push(...configLines);
  lines.push(');');
  
  return lines.join('\n');
};

/**
 * Add statement to connector object
 */
const addConnectorStatement = async (connectUrl, connector) => {
  if (!connector) return connector;

  // Get config from Kafka Connect REST API
  const config = await getConnectorConfig(connectUrl, connector.name);
  
  // Reconstruct CREATE CONNECTOR statement
  const statement = reconstructConnectorStatement(connector.name, config);
  
  // Return connector with statement, excluding state field
  const { state, ...connectorWithoutState } = connector;
  
  return {
    ...connectorWithoutState,
    statement,
  };
};

/**
 * Filter query objects to remove non-deterministic fields and sort arrays
 */
const filterQuery = (query) => {
  if (!query) return query;

  const { id, statusCount, state, ...deterministicFields } = query;
  
  // Sort arrays for deterministic output
  if (deterministicFields.sinks) {
    deterministicFields.sinks = [...deterministicFields.sinks].sort();
  }
  if (deterministicFields.sinkKafkaTopics) {
    deterministicFields.sinkKafkaTopics = [...deterministicFields.sinkKafkaTopics].sort();
  }
  
  return deterministicFields;
};

/**
 * Filter description to remove non-deterministic fields and sort arrays
 */
const filterDescription = (description) => {
  if (!description) return description;

  const filtered = {
    name: description.name,
    type: description.type,
    fields: description.fields,
    keyFormat: description.keyFormat,
    valueFormat: description.valueFormat,
    topic: description.topic,
    partitions: description.partitions,
    replication: description.replication,
    statement: description.statement,
    windowType: description.windowType,
    extended: description.extended,
  };

  // Filter readQueries and writeQueries to remove non-deterministic fields
  if (description.readQueries && description.readQueries.length > 0) {
    filtered.readQueries = description.readQueries.map(filterQuery);
  }

  if (description.writeQueries && description.writeQueries.length > 0) {
    filtered.writeQueries = description.writeQueries.map(filterQuery);
  }

  // Sort sourceConstraints for deterministic output
  if (description.sourceConstraints) {
    filtered.sourceConstraints = [...description.sourceConstraints].sort();
  }

  return filtered;
};

/**
 * Introspect the current state of ksqlDB
 * Returns only deterministic schema information
 */
const introspectKsqlState = async (ksqlUrl, connectUrl) => {
  // Execute SHOW commands with sequence number chaining
  let currentSequenceNumber = null;
  
  const streamsResult = await executeKsqlStatement(ksqlUrl, 'SHOW STREAMS;', currentSequenceNumber);
  currentSequenceNumber = streamsResult.commandSequenceNumber;
  
  const tablesResult = await executeKsqlStatement(ksqlUrl, 'SHOW TABLES;', currentSequenceNumber);
  currentSequenceNumber = tablesResult.commandSequenceNumber;
  
  const connectorsResult = await executeKsqlStatement(ksqlUrl, 'SHOW CONNECTORS;', currentSequenceNumber);
  currentSequenceNumber = connectorsResult.commandSequenceNumber;

  // Parse responses
  const streams = parseShowResponse(streamsResult.data, 'streams');
  const tables = parseShowResponse(tablesResult.data, 'tables');
  const connectors = parseShowResponse(connectorsResult.data, 'connectors');

  // Get detailed descriptions for each stream and table
  const descriptions = {};

  for (const stream of streams) {
    // Skip system streams like KSQL_PROCESSING_LOG
    if (stream.name === 'KSQL_PROCESSING_LOG') continue;
    
    const description = await describeSource(ksqlUrl, stream.name, currentSequenceNumber);
    if (description) {
      descriptions[stream.name] = filterDescription(description);
    }
  }

  for (const table of tables) {
    const description = await describeSource(ksqlUrl, table.name, currentSequenceNumber);
    if (description) {
      descriptions[table.name] = filterDescription(description);
    }
  }

  // Add statements to connectors (without adding to descriptions)
  const connectorsWithStatements = await Promise.all(
    connectors.map(connector => addConnectorStatement(connectUrl, connector))
  );

  // Return only deterministic schema information with sorted arrays
  // Filter out system streams from the lists
  return {
    connectors: connectorsWithStatements.sort((a, b) => a.name.localeCompare(b.name)),
    streams: streams
      .filter(s => s.name !== 'KSQL_PROCESSING_LOG')
      .sort((a, b) => a.name.localeCompare(b.name)),
    tables: tables.sort((a, b) => a.name.localeCompare(b.name)),
    descriptions,
  };
};

/**
 * Topological sort to order sources by dependencies
 * Returns array of source names in dependency order (sources with no deps first)
 * 
 * Note: sourceConstraints lists sources that READ FROM this one (reverse deps),
 * so we need to build a reverse dependency map first.
 */
const topologicalSort = (descriptions) => {
  // Build reverse dependency map: source -> list of sources it depends on
  const dependencies = {};
  const allSources = Object.keys(descriptions);
  
  // Initialize all sources with empty dependency lists
  for (const name of allSources) {
    dependencies[name] = [];
  }
  
  // Build the dependency graph
  // If A.sourceConstraints contains B, then B depends on A
  for (const name of allSources) {
    const desc = descriptions[name];
    if (desc && desc.sourceConstraints) {
      for (const dependent of desc.sourceConstraints) {
        if (dependencies[dependent]) {
          dependencies[dependent].push(name);
        }
      }
    }
  }
  
  // Topological sort using DFS
  const sorted = [];
  const visited = new Set();
  const visiting = new Set();

  const visit = (name) => {
    if (visited.has(name)) return;
    if (visiting.has(name)) {
      // Circular dependency - shouldn't happen in valid ksqlDB schemas
      console.warn(`Warning: Circular dependency detected involving ${name}`);
      return;
    }

    visiting.add(name);

    // Visit dependencies first (sorted for determinism)
    const deps = dependencies[name] || [];
    const sortedDeps = [...deps].sort();
    for (const dep of sortedDeps) {
      visit(dep);
    }

    visiting.delete(name);
    visited.add(name);
    sorted.push(name);
  };

  // Visit all sources in alphabetical order for determinism
  const sortedSources = [...allSources].sort();
  for (const name of sortedSources) {
    visit(name);
  }

  return sorted;
};

/**
 * Generate SQL queries file from state
 */
const generateQueriesSQL = (state) => {
  const lines = [];
  
  // Header
  lines.push('-- ksqlDB Queries');
  lines.push('-- This file contains all CREATE statements in dependency order');
  lines.push('');
  
  // Add connectors first (they produce topics consumed by streams/tables)
  if (state.connectors && state.connectors.length > 0) {
    lines.push('-- Connectors');
    lines.push('');
    
    for (const connector of state.connectors) {
      if (connector.statement) {
        lines.push(`-- ${connector.name} (CONNECTOR)`);
        lines.push(connector.statement);
        lines.push('');
      }
    }
  }
  
  // Topologically sort streams/tables by dependencies
  const sortedNames = topologicalSort(state.descriptions);
  
  // Filter to only include streams and tables (not connectors)
  const streamsAndTables = sortedNames.filter(name => {
    const desc = state.descriptions[name];
    return desc && desc.statement && desc.type;
  });
  
  if (streamsAndTables.length > 0) {
    lines.push('-- Streams and Tables');
    lines.push('');
    
    for (const name of streamsAndTables) {
      const desc = state.descriptions[name];
      
      // Add comment with metadata
      lines.push(`-- ${name} (${desc.type})`);
      if (desc.sourceConstraints && desc.sourceConstraints.length > 0) {
        lines.push(`-- Dependencies: ${desc.sourceConstraints.join(', ')}`);
      }
      lines.push(desc.statement);
      lines.push('');
    }
  }
  
  return lines.join('\n');
};

/**
 * Post-migration script that introspects ksqlDB and saves/logs state
 */
const main = async () => {
  const ksqlUrl = process.env.KSQLDB_ENDPOINT;
  const connectUrl = process.env.KAFKA_CONNECT_URL || 'http://localhost:8083';
  const stateFile = path.join(__dirname, '..', 'state.json');

  if (!ksqlUrl) {
    console.error('Error: KSQLDB_ENDPOINT environment variable is not set');
    process.exit(1);
  }

  try {
    console.log('Capturing ksqlDB state...');
    console.log(`  ksqlDB: ${ksqlUrl}`);
    console.log(`  Kafka Connect: ${connectUrl}`);

    // Introspect ksqlDB state
    const state = await introspectKsqlState(ksqlUrl, connectUrl);

    // Save state to file with stable stringification for deterministic output
    fs.writeFileSync(stateFile, stringify(state, { space: 2 }));
    console.log(`  ✓ State saved to ${stateFile}`);

    // Generate SQL queries file
    const queriesFile = path.join(__dirname, '..', 'queries.sql');
    const queriesSQL = generateQueriesSQL(state);
    fs.writeFileSync(queriesFile, queriesSQL);
    console.log(`  ✓ Queries saved to ${queriesFile}`);

    console.log('\n✓ Post-migration complete');
    console.log('  To generate TypeScript types, run: npm run ksql:generate-test-utils\n');
  } catch (error) {
    console.error('Error in post-migration:', error.message);
    process.exit(1);
  }
};

if (require.main === module) {
  main();
}

module.exports = { main };
