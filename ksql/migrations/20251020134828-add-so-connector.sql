-- Migration: add-so-connector
-- Created: 2025-10-20T13:48:28.753Z
-- Down migration: 20251020134828-add-so-connector.undo.sql
-- Test file: 20251020134828-add-so-connector.test.ts

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
  
  -- Error handling
  'errors.log.enable' = 'true',
  'errors.log.include.messages' = 'true'
);
