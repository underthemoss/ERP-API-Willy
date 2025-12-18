#!/usr/bin/env node

/**
 * Kafka Topic Seeding Script using ksqlDB REST API
 * 
 * This script seeds Kafka topics by inserting into ksqlDB tables.
 * ksqlDB automatically handles AVRO encoding and Schema Registry.
 * 
 * Run this AFTER ksqlDB migrations have completed.
 * 
 * Usage: node seed-kafka.js
 */

const fs = require('fs');
const path = require('path');
const KsqldbClient = require('ksqldb-client');

// Configuration
const KSQLDB_ENDPOINT = process.env.KSQLDB_ENDPOINT || 'http://localhost:8088';
const TOPICS_DIR = path.join(__dirname, 'topics');

// Topic to ksqlDB table mapping
const TOPIC_TO_TABLE = {
  // PIM topics
  'pim_categories': 'PIM_CATEGORIES_V1',
  'pim_products': 'PIM_PRODUCTS_V1',
  // Asset topics
  'esdb_public_companies': 'ESDB_PUBLIC_COMPANIES',
  'esdb_public_asset_types': 'ESDB_PUBLIC_ASSET_TYPES',
  'esdb_public_equipment_makes': 'ESDB_PUBLIC_EQUIPMENT_MAKES',
  'esdb_public_equipment_models': 'ESDB_PUBLIC_EQUIPMENT_MODELS',
  'esdb_public_equipment_classes': 'ESDB_PUBLIC_EQUIPMENT_CLASSES',
  'esdb_public_markets': 'ESDB_PUBLIC_MARKETS',
  'esdb_public_organizations': 'ESDB_PUBLIC_ORGANIZATIONS',
  'esdb_public_photos': 'ESDB_PUBLIC_PHOTOS',
  'esdb_public_trackers': 'ESDB_PUBLIC_TRACKERS',
  'esdb_public_assets': 'ESDB_PUBLIC_ASSETS',
  'esdb_public_keypads': 'ESDB_PUBLIC_KEYPADS',
  'esdb_public_telematics_service_providers_assets': 'ESDB_PUBLIC_TELEMATICS_SERVICE_PROVIDERS_ASSETS',
  'esdb_public_organization_asset_xref': 'ESDB_PUBLIC_ORGANIZATION_ASSET_XREF',
  // Rental topics
  'esdb_public_rental_statuses': 'ESDB_PUBLIC_RENTAL_STATUSES',
  'esdb_public_order_statuses': 'ESDB_PUBLIC_ORDER_STATUSES',
  'esdb_public_users': 'ESDB_PUBLIC_USERS',
  'esdb_public_orders': 'ESDB_PUBLIC_ORDERS',
  'esdb_public_rentals': 'ESDB_PUBLIC_RENTALS'
};

console.log('🌱 Starting Kafka topic seeding via ksqlDB REST API...');
console.log(`   ksqlDB Endpoint: ${KSQLDB_ENDPOINT}`);
console.log('');

/**
 * Escape all object keys with backticks (required by ksqlDB)
 */
function escapeKeysDeep(obj) {
  if (Array.isArray(obj)) {
    return obj.map(item => escapeKeysDeep(item));
  } else if (obj !== null && typeof obj === 'object') {
    return Object.entries(obj).reduce((acc, [key, value]) => {
      acc[`\`${key}\``] = escapeKeysDeep(value);
      return acc;
    }, {});
  }
  return obj;
}

/**
 * Parse ksqlDB endpoint URL into host and port
 */
function parseKsqlEndpoint(endpoint) {
  const url = new URL(endpoint);
  return {
    host: url.hostname,
    port: parseInt(url.port) || 8088,
  };
}

/**
 * Seed a topic by inserting records into its ksqlDB table
 */
async function seedTopic(topicName) {
  const tableName = TOPIC_TO_TABLE[topicName];
  
  if (!tableName) {
    console.log(`⚠️  Skipping ${topicName} - no table mapping found`);
    return;
  }
  
  const dataFile = path.join(TOPICS_DIR, `${topicName}.jsonl`);
  
  if (!fs.existsSync(dataFile)) {
    console.log(`⚠️  Skipping ${topicName} - data file not found: ${dataFile}`);
    return;
  }
  
  // Read and parse JSONL file
  const fileContent = fs.readFileSync(dataFile, 'utf-8');
  const lines = fileContent.trim().split('\n').filter(line => line.trim());
  
  console.log(`📨 Inserting ${lines.length} records into ${tableName}...`);
  
  const { host, port } = parseKsqlEndpoint(KSQLDB_ENDPOINT);
  const client = new KsqldbClient({ host, port });
  
  let successCount = 0;
  let failCount = 0;
  
  try {
    await client.connect();
    
    for (const line of lines) {
      try {
        // Parse the line: { key: "string", value: {...} }
        const { key, value } = JSON.parse(line);
        
        // Escape all keys in the value object with backticks
        const escapedValue = escapeKeysDeep(value);
        
        // Insert into ksqlDB table - ksqlDB will extract the key automatically
        const { error } = await client.insertInto(tableName, escapedValue);
        
        if (error) {
          console.error(`   ❌ Failed to insert ${key}: ${error.message || error}`);
          failCount++;
        } else {
          successCount++;
        }
        
      } catch (error) {
        console.error(`   ❌ Failed to insert record: ${error.message}`);
        failCount++;
      }
    }
    
  } finally {
    await client.disconnect();
  }
  
  if (successCount > 0) {
    console.log(`✅ Successfully inserted ${successCount} records into ${tableName}`);
  }
  
  if (failCount > 0) {
    console.log(`❌ Failed to insert ${failCount} records into ${tableName}`);
  }
  
  console.log('');
}

/**
 * Main seeding function
 */
async function main() {
  try {
    console.log('Starting topic seeding...');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('');
    
    // Seed PIM topics
    console.log('📦 Seeding PIM topics...');
    await seedTopic('pim_categories');
    await seedTopic('pim_products');
    console.log('');
    
    // Seed Asset topics in dependency order
    console.log('🚜 Seeding Asset topics...');
    console.log('');
    
    // 1. Base reference data (no dependencies)
    console.log('1️⃣ Seeding base reference data...');
    await seedTopic('esdb_public_companies');
    await seedTopic('esdb_public_asset_types');
    await seedTopic('esdb_public_equipment_makes');
    await seedTopic('esdb_public_equipment_models');
    await seedTopic('esdb_public_equipment_classes');
    console.log('');
    
    // 2. Location and organization data (depends on companies)
    console.log('2️⃣ Seeding locations and organizations...');
    await seedTopic('esdb_public_markets');
    await seedTopic('esdb_public_organizations');
    console.log('');
    
    // 3. Asset metadata (no dependencies)
    console.log('3️⃣ Seeding asset metadata...');
    await seedTopic('esdb_public_photos');
    await seedTopic('esdb_public_trackers');
    console.log('');
    
    // 4. Main assets (depends on all above)
    console.log('4️⃣ Seeding assets...');
    await seedTopic('esdb_public_assets');
    console.log('');
    
    // 5. Asset relationships (depends on assets)
    console.log('5️⃣ Seeding asset relationships...');
    await seedTopic('esdb_public_keypads');
    await seedTopic('esdb_public_telematics_service_providers_assets');
    await seedTopic('esdb_public_organization_asset_xref');
    
    console.log('');
    
    // Seed Rental topics in dependency order
    console.log('📋 Seeding Rental topics...');
    console.log('');
    
    // 1. Rental lookup tables (no dependencies)
    console.log('1️⃣ Seeding rental lookup tables...');
    await seedTopic('esdb_public_rental_statuses');
    await seedTopic('esdb_public_order_statuses');
    await seedTopic('esdb_public_users');
    console.log('');
    
    // 2. Orders (depends on companies, users, order_statuses)
    console.log('2️⃣ Seeding orders...');
    await seedTopic('esdb_public_orders');
    console.log('');
    
    // 3. Rentals (depends on assets, orders, users, rental_statuses)
    console.log('3️⃣ Seeding rentals...');
    await seedTopic('esdb_public_rentals');
    
    console.log('');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🎉 Kafka seeding complete!');
    console.log('');
    console.log('To verify, query ksqlDB:');
    console.log(`  curl ${KSQLDB_ENDPOINT}/query -d '{"ksql":"SELECT * FROM PIM_CATEGORIES_V1 EMIT CHANGES LIMIT 1;"}'`);
    console.log(`  curl ${KSQLDB_ENDPOINT}/query -d '{"ksql":"SELECT * FROM ESDB_ASSET_MATERIALIZED_VIEW EMIT CHANGES LIMIT 1;"}'`);
    console.log(`  curl ${KSQLDB_ENDPOINT}/query -d '{"ksql":"SELECT * FROM ESDB_RENTAL_MATERIALIZED_VIEW EMIT CHANGES LIMIT 1;"}'`);
    
  } catch (error) {
    console.error('❌ Error during seeding:', error.message);
    process.exit(1);
  }
}

main();
