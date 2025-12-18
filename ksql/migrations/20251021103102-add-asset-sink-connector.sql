-- Migration: add-asset-sink-connector
-- Created: 2025-10-21T10:31:02.099Z
-- Down migration: 20251021103102-add-asset-sink-connector.undo.sql
-- Test file: 20251021103102-add-asset-sink-connector.test.ts

CREATE SINK CONNECTOR ES_ERP_ASSETS_MATERIALIZED_SINK_CONNECTOR WITH (
  -- Connector
  'connector.class' = 'com.mongodb.kafka.connect.MongoSinkConnector',
  'tasks.max' = '1',
  
  -- MongoDB destination
  'connection.uri' = '${env:MONGO_CONNECTION_STRING}',
  'database' = 'es-erp',
  'collection' = 't3_assets_materialized',
  
  -- Input format (JSON, no schemas)
  'key.converter' = 'org.apache.kafka.connect.json.JsonConverter',
  'key.converter.schemas.enable' = 'false',
  'value.converter' = 'org.apache.kafka.connect.json.JsonConverter',
  'value.converter.schemas.enable' = 'false',
  
  -- SMT: Convert string key to JSON structure with _id field
  -- Transforms key "120347" into {"_id": "120347"}
  'transforms' = 'wrapKey',
  'transforms.wrapKey.type' = 'org.apache.kafka.connect.transforms.HoistField$Key',
  'transforms.wrapKey.field' = '_id',
  
  -- Document ID strategy: extract _id from transformed key
  'document.id.strategy' = 'com.mongodb.kafka.connect.sink.processor.id.strategy.ProvidedInKeyStrategy',
  'document.id.strategy.overwrite.existing' = 'true',
  
  -- Write strategy: replace existing documents (upsert behavior)
  'writemodel.strategy' = 'com.mongodb.kafka.connect.sink.writemodel.strategy.ReplaceOneDefaultStrategy',
  
  -- Handle deletes: delete document when receiving tombstone (null value)
  'delete.on.null.values' = 'true',
  
  -- Topic configuration
  'topics' = '_es-erp-ksqldb.ESDB_ASSET_MATERIALIZED_VIEW',
  
  -- Error handling
  'errors.log.enable' = 'true',
  'errors.log.include.messages' = 'true'
);
