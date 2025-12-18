-- Migration: add-orders-and-rentals-sink-connectors
-- Created: 2025-10-22T12:45:35.000Z
-- Test file: 20251022124535-add-orders-and-rentals-sink-connectors.test.ts
-- 
-- Creates sink connectors to sync ksqlDB materialized views to MongoDB:
-- - ESDB_RENTAL_MATERIALIZED_VIEW → t3_rentals_materialized
-- - ESDB_ORDER_MATERIALIZED_VIEW → t3_orders_materialized

-- Rentals Sink Connector
CREATE SINK CONNECTOR IF NOT EXISTS ES_ERP_RENTALS_MATERIALIZED_SINK_CONNECTOR WITH (
  -- Connector
  'connector.class' = 'com.mongodb.kafka.connect.MongoSinkConnector',
  'tasks.max' = '1',
  
  -- MongoDB destination
  'connection.uri' = '${env:MONGO_CONNECTION_STRING}',
  'database' = 'es-erp',
  'collection' = 't3_rentals_materialized',
  
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
  'topics' = '_es-erp-ksqldb.ESDB_RENTAL_MATERIALIZED_VIEW',
  
  -- Error handling
  'errors.log.enable' = 'true',
  'errors.log.include.messages' = 'true'
);

-- Orders Sink Connector
CREATE SINK CONNECTOR IF NOT EXISTS ES_ERP_ORDERS_MATERIALIZED_SINK_CONNECTOR WITH (
  -- Connector
  'connector.class' = 'com.mongodb.kafka.connect.MongoSinkConnector',
  'tasks.max' = '1',
  
  -- MongoDB destination
  'connection.uri' = '${env:MONGO_CONNECTION_STRING}',
  'database' = 'es-erp',
  'collection' = 't3_orders_materialized',
  
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
  'topics' = '_es-erp-ksqldb.ESDB_ORDER_MATERIALIZED_VIEW',
  
  -- Error handling
  'errors.log.enable' = 'true',
  'errors.log.include.messages' = 'true'
);
