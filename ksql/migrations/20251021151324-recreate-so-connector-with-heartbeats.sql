-- Migration: recreate-so-connector-with-heartbeats
-- Created: 2025-10-21T15:13:24.000Z
-- Down migration: 20251021151324-recreate-so-connector-with-heartbeats.undo.sql
-- Test file: 20251021151324-recreate-so-connector-with-heartbeats.test.ts
-- 
-- Recreate the sales order source connector with heartbeat monitoring enabled

-- Drop the existing connector
DROP CONNECTOR ES_ERP_SALES_ORDERS_SOURCE_CONNECTOR;

-- Recreate with heartbeat support
CREATE SOURCE CONNECTOR ES_ERP_SALES_ORDERS_SOURCE_CONNECTOR WITH (
  -- Connector
  'connector.class' = 'com.mongodb.kafka.connect.MongoSourceConnector',
  'tasks.max' = '1',
  
  -- MongoDB source
  'connection.uri' = '${env:MONGO_CONNECTION_STRING}',
  'database' = 'es-erp',
  'collection' = 'sales_orders',
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
