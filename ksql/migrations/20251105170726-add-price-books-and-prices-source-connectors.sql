-- Migration: add-price-books-and-prices-source-connectors
-- Created: 2025-11-05T17:07:26.000Z
-- Down migration: 20251105170726-add-price-books-and-prices-source-connectors.undo.sql
-- Test file: 20251105170726-add-price-books-and-prices-source-connectors.test.ts
--
-- Create MongoDB source connectors for price_books and prices collections

-- Price Books Source Connector
CREATE SOURCE CONNECTOR IF NOT EXISTS ES_ERP_PRICE_BOOKS_SOURCE_CONNECTOR WITH (
  -- Connector
  'connector.class' = 'com.mongodb.kafka.connect.MongoSourceConnector',
  'tasks.max' = '1',
  
  -- MongoDB source
  'connection.uri' = '${env:MONGO_CONNECTION_STRING}',
  'database' = 'es-erp',
  'collection' = 'price_books',
  'startup.mode' = 'copy_existing',
  
  -- Output format (JSON, no schemas)
  'key.converter' = 'org.apache.kafka.connect.storage.StringConverter',
  'key.converter.schemas.enable' = 'false',
  'value.converter' = 'org.apache.kafka.connect.storage.StringConverter',
  'value.converter.schemas.enable' = 'false',
  'output.format.key' = 'json',
  'output.format.value' = 'json',
  'output.json.formatter' = 'com.mongodb.kafka.connect.source.json.formatter.SimplifiedJson',
  
  -- CDC behavior
  'publish.full.document.only' = 'true',
  'publish.full.document.only.tombstone.on.delete' = 'true',
  
  -- Transform: extract _id as message key
  'transforms' = 'extractId',
  'transforms.extractId.type' = 'com.equipmentshare.kafka.connect.transforms.ExtractJsonPath$Key',
  'transforms.extractId.json.path' = '$._id',
  
  -- Topic config
  'topic.prefix' = '_es-erp.private.mongo',
  'topic.creation.enable' = 'true',
  'topic.creation.default.replication.factor' = '${env:TOPIC_CREATION_DEFAULT_REPLICATION_FACTOR}',
  'topic.creation.default.partitions' = '1',
  'topic.creation.default.cleanup.policy' = 'compact',
  
  -- Heartbeat configuration
  'heartbeat.interval.ms' = '60000',
  'heartbeat.topic.name' = '_es-erp.private.mongo.__mongo_heartbeats',
  
  -- Error handling
  'errors.log.enable' = 'true',
  'errors.log.include.messages' = 'true'
);

-- Prices Source Connector
CREATE SOURCE CONNECTOR IF NOT EXISTS ES_ERP_PRICES_SOURCE_CONNECTOR WITH (
  -- Connector
  'connector.class' = 'com.mongodb.kafka.connect.MongoSourceConnector',
  'tasks.max' = '1',
  
  -- MongoDB source
  'connection.uri' = '${env:MONGO_CONNECTION_STRING}',
  'database' = 'es-erp',
  'collection' = 'prices',
  'startup.mode' = 'copy_existing',
  
  -- Output format (JSON, no schemas)
  'key.converter' = 'org.apache.kafka.connect.storage.StringConverter',
  'key.converter.schemas.enable' = 'false',
  'value.converter' = 'org.apache.kafka.connect.storage.StringConverter',
  'value.converter.schemas.enable' = 'false',
  'output.format.key' = 'json',
  'output.format.value' = 'json',
  'output.json.formatter' = 'com.mongodb.kafka.connect.source.json.formatter.SimplifiedJson',
  
  -- CDC behavior
  'publish.full.document.only' = 'true',
  'publish.full.document.only.tombstone.on.delete' = 'true',
  
  -- Transform: extract _id as message key
  'transforms' = 'extractId',
  'transforms.extractId.type' = 'com.equipmentshare.kafka.connect.transforms.ExtractJsonPath$Key',
  'transforms.extractId.json.path' = '$._id',
  
  -- Topic config
  'topic.prefix' = '_es-erp.private.mongo',
  'topic.creation.enable' = 'true',
  'topic.creation.default.replication.factor' = '${env:TOPIC_CREATION_DEFAULT_REPLICATION_FACTOR}',
  'topic.creation.default.partitions' = '1',
  'topic.creation.default.cleanup.policy' = 'compact',
  
  -- Heartbeat configuration
  'heartbeat.interval.ms' = '60000',
  'heartbeat.topic.name' = '_es-erp.private.mongo.__mongo_heartbeats',
  
  -- Error handling
  'errors.log.enable' = 'true',
  'errors.log.include.messages' = 'true'
);
