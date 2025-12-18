-- ksqlDB Queries
-- This file contains all CREATE statements in dependency order

-- Connectors

-- ES_ERP_ASSETS_MATERIALIZED_SINK_CONNECTOR (CONNECTOR)
CREATE SINK CONNECTOR ES_ERP_ASSETS_MATERIALIZED_SINK_CONNECTOR WITH (
  'collection' = 't3_assets_materialized',
  'connection.uri' = '${env:MONGO_CONNECTION_STRING}',
  'connector.class' = 'com.mongodb.kafka.connect.MongoSinkConnector',
  'database' = 'es-erp',
  'delete.on.null.values' = 'true',
  'document.id.strategy' = 'com.mongodb.kafka.connect.sink.processor.id.strategy.ProvidedInKeyStrategy',
  'document.id.strategy.overwrite.existing' = 'true',
  'errors.log.enable' = 'true',
  'errors.log.include.messages' = 'true',
  'key.converter' = 'org.apache.kafka.connect.json.JsonConverter',
  'key.converter.schemas.enable' = 'false',
  'name' = 'ES_ERP_ASSETS_MATERIALIZED_SINK_CONNECTOR',
  'tasks.max' = '1',
  'topics' = '_es-erp-ksqldb.ESDB_ASSET_MATERIALIZED_VIEW',
  'transforms' = 'wrapKey',
  'transforms.wrapKey.field' = '_id',
  'transforms.wrapKey.type' = 'org.apache.kafka.connect.transforms.HoistField$Key',
  'value.converter' = 'org.apache.kafka.connect.json.JsonConverter',
  'value.converter.schemas.enable' = 'false',
  'writemodel.strategy' = 'com.mongodb.kafka.connect.sink.writemodel.strategy.ReplaceOneDefaultStrategy'
);

-- ES_ERP_ASSETS_OPENSEARCH_SINK_CONNECTOR (CONNECTOR)
CREATE SINK CONNECTOR ES_ERP_ASSETS_OPENSEARCH_SINK_CONNECTOR WITH (
  'connector.class' = 'com.equipmentshare.kafka.connect.opensearch.OpenSearchSinkConnector',
  'key.converter' = 'org.apache.kafka.connect.json.JsonConverter',
  'key.converter.schemas.enable' = 'false',
  'name' = 'ES_ERP_ASSETS_OPENSEARCH_SINK_CONNECTOR',
  'opensearch.index.name' = 't3_assets',
  'opensearch.url' = '${env:OPENSEARCH_ENDPOINT}',
  'tasks.max' = '3',
  'topics' = '_es-erp-ksqldb.ESDB_ASSET_MATERIALIZED_VIEW',
  'value.converter' = 'org.apache.kafka.connect.json.JsonConverter',
  'value.converter.schemas.enable' = 'false'
);

-- ES_ERP_ORDERS_MATERIALIZED_SINK_CONNECTOR (CONNECTOR)
CREATE SINK CONNECTOR ES_ERP_ORDERS_MATERIALIZED_SINK_CONNECTOR WITH (
  'collection' = 't3_orders_materialized',
  'connection.uri' = '${env:MONGO_CONNECTION_STRING}',
  'connector.class' = 'com.mongodb.kafka.connect.MongoSinkConnector',
  'database' = 'es-erp',
  'delete.on.null.values' = 'true',
  'document.id.strategy' = 'com.mongodb.kafka.connect.sink.processor.id.strategy.ProvidedInKeyStrategy',
  'document.id.strategy.overwrite.existing' = 'true',
  'errors.log.enable' = 'true',
  'errors.log.include.messages' = 'true',
  'key.converter' = 'org.apache.kafka.connect.json.JsonConverter',
  'key.converter.schemas.enable' = 'false',
  'name' = 'ES_ERP_ORDERS_MATERIALIZED_SINK_CONNECTOR',
  'tasks.max' = '1',
  'topics' = '_es-erp-ksqldb.ESDB_ORDER_MATERIALIZED_VIEW',
  'transforms' = 'wrapKey',
  'transforms.wrapKey.field' = '_id',
  'transforms.wrapKey.type' = 'org.apache.kafka.connect.transforms.HoistField$Key',
  'value.converter' = 'org.apache.kafka.connect.json.JsonConverter',
  'value.converter.schemas.enable' = 'false',
  'writemodel.strategy' = 'com.mongodb.kafka.connect.sink.writemodel.strategy.ReplaceOneDefaultStrategy'
);

-- ES_ERP_ORDERS_OPENSEARCH_SINK_CONNECTOR (CONNECTOR)
CREATE SINK CONNECTOR ES_ERP_ORDERS_OPENSEARCH_SINK_CONNECTOR WITH (
  'connector.class' = 'com.equipmentshare.kafka.connect.opensearch.OpenSearchSinkConnector',
  'key.converter' = 'org.apache.kafka.connect.json.JsonConverter',
  'key.converter.schemas.enable' = 'false',
  'name' = 'ES_ERP_ORDERS_OPENSEARCH_SINK_CONNECTOR',
  'opensearch.index.name' = 't3_orders',
  'opensearch.url' = '${env:OPENSEARCH_ENDPOINT}',
  'tasks.max' = '1',
  'topics' = '_es-erp-ksqldb.ESDB_ORDER_MATERIALIZED_VIEW',
  'value.converter' = 'org.apache.kafka.connect.json.JsonConverter',
  'value.converter.schemas.enable' = 'false'
);

-- ES_ERP_PIM_CATEGORIES_OPENSEARCH_SINK_CONNECTOR_V1 (CONNECTOR)
CREATE SINK CONNECTOR ES_ERP_PIM_CATEGORIES_OPENSEARCH_SINK_CONNECTOR_V1 WITH (
  'connector.class' = 'com.equipmentshare.kafka.connect.opensearch.OpenSearchSinkConnector',
  'key.converter' = 'org.apache.kafka.connect.json.JsonConverter',
  'key.converter.schemas.enable' = 'false',
  'name' = 'ES_ERP_PIM_CATEGORIES_OPENSEARCH_SINK_CONNECTOR_V1',
  'opensearch.index.name' = 't3_pim_categories',
  'opensearch.url' = '${env:OPENSEARCH_ENDPOINT}',
  'tasks.max' = '4',
  'topics' = '_es-erp-ksqldb.PIM_CATEGORIES_MATERIALIZED_VIEW_V1',
  'value.converter' = 'org.apache.kafka.connect.json.JsonConverter',
  'value.converter.schemas.enable' = 'false'
);

-- ES_ERP_PIM_PRODUCTS_OPENSEARCH_SINK_CONNECTOR_V1 (CONNECTOR)
CREATE SINK CONNECTOR ES_ERP_PIM_PRODUCTS_OPENSEARCH_SINK_CONNECTOR_V1 WITH (
  'connector.class' = 'com.equipmentshare.kafka.connect.opensearch.OpenSearchSinkConnector',
  'key.converter' = 'org.apache.kafka.connect.json.JsonConverter',
  'key.converter.schemas.enable' = 'false',
  'name' = 'ES_ERP_PIM_PRODUCTS_OPENSEARCH_SINK_CONNECTOR_V1',
  'opensearch.index.name' = 't3_pim_products',
  'opensearch.url' = '${env:OPENSEARCH_ENDPOINT}',
  'tasks.max' = '4',
  'topics' = '_es-erp-ksqldb.PIM_PRODUCTS_MATERIALIZED_VIEW_V1',
  'value.converter' = 'org.apache.kafka.connect.json.JsonConverter',
  'value.converter.schemas.enable' = 'false'
);

-- ES_ERP_PRICE_BOOKS_SOURCE_CONNECTOR (CONNECTOR)
CREATE SOURCE CONNECTOR ES_ERP_PRICE_BOOKS_SOURCE_CONNECTOR WITH (
  'collection' = 'price_books',
  'connection.uri' = '${env:MONGO_CONNECTION_STRING}',
  'connector.class' = 'com.mongodb.kafka.connect.MongoSourceConnector',
  'database' = 'es-erp',
  'errors.log.enable' = 'true',
  'errors.log.include.messages' = 'true',
  'heartbeat.interval.ms' = '60000',
  'heartbeat.topic.name' = '_es-erp.private.mongo.__mongo_heartbeats',
  'key.converter' = 'org.apache.kafka.connect.storage.StringConverter',
  'key.converter.schemas.enable' = 'false',
  'name' = 'ES_ERP_PRICE_BOOKS_SOURCE_CONNECTOR',
  'output.format.key' = 'json',
  'output.format.value' = 'json',
  'output.json.formatter' = 'com.mongodb.kafka.connect.source.json.formatter.SimplifiedJson',
  'publish.full.document.only' = 'true',
  'publish.full.document.only.tombstone.on.delete' = 'true',
  'startup.mode' = 'copy_existing',
  'tasks.max' = '1',
  'topic.creation.default.cleanup.policy' = 'compact',
  'topic.creation.default.partitions' = '1',
  'topic.creation.default.replication.factor' = '${env:TOPIC_CREATION_DEFAULT_REPLICATION_FACTOR}',
  'topic.creation.enable' = 'true',
  'topic.prefix' = '_es-erp.private.mongo',
  'transforms' = 'extractId',
  'transforms.extractId.json.path' = '$._id',
  'transforms.extractId.type' = 'com.equipmentshare.kafka.connect.transforms.ExtractJsonPath$Key',
  'value.converter' = 'org.apache.kafka.connect.storage.StringConverter',
  'value.converter.schemas.enable' = 'false'
);

-- ES_ERP_PRICES_OPENSEARCH_SINK_CONNECTOR (CONNECTOR)
CREATE SINK CONNECTOR ES_ERP_PRICES_OPENSEARCH_SINK_CONNECTOR WITH (
  'connector.class' = 'com.equipmentshare.kafka.connect.opensearch.OpenSearchSinkConnector',
  'key.converter' = 'org.apache.kafka.connect.storage.StringConverter',
  'key.converter.schemas.enable' = 'false',
  'name' = 'ES_ERP_PRICES_OPENSEARCH_SINK_CONNECTOR',
  'opensearch.index.name' = 'es_erp_prices',
  'opensearch.url' = '${env:OPENSEARCH_ENDPOINT}',
  'tasks.max' = '4',
  'topics' = '_es-erp-ksqldb.PRICES_WITH_CATEGORY',
  'value.converter' = 'org.apache.kafka.connect.json.JsonConverter',
  'value.converter.schemas.enable' = 'false'
);

-- ES_ERP_PRICES_SOURCE_CONNECTOR (CONNECTOR)
CREATE SOURCE CONNECTOR ES_ERP_PRICES_SOURCE_CONNECTOR WITH (
  'collection' = 'prices',
  'connection.uri' = '${env:MONGO_CONNECTION_STRING}',
  'connector.class' = 'com.mongodb.kafka.connect.MongoSourceConnector',
  'database' = 'es-erp',
  'errors.log.enable' = 'true',
  'errors.log.include.messages' = 'true',
  'heartbeat.interval.ms' = '60000',
  'heartbeat.topic.name' = '_es-erp.private.mongo.__mongo_heartbeats',
  'key.converter' = 'org.apache.kafka.connect.storage.StringConverter',
  'key.converter.schemas.enable' = 'false',
  'name' = 'ES_ERP_PRICES_SOURCE_CONNECTOR',
  'output.format.key' = 'json',
  'output.format.value' = 'json',
  'output.json.formatter' = 'com.mongodb.kafka.connect.source.json.formatter.SimplifiedJson',
  'publish.full.document.only' = 'true',
  'publish.full.document.only.tombstone.on.delete' = 'true',
  'startup.mode' = 'copy_existing',
  'tasks.max' = '1',
  'topic.creation.default.cleanup.policy' = 'compact',
  'topic.creation.default.partitions' = '1',
  'topic.creation.default.replication.factor' = '${env:TOPIC_CREATION_DEFAULT_REPLICATION_FACTOR}',
  'topic.creation.enable' = 'true',
  'topic.prefix' = '_es-erp.private.mongo',
  'transforms' = 'extractId',
  'transforms.extractId.json.path' = '$._id',
  'transforms.extractId.type' = 'com.equipmentshare.kafka.connect.transforms.ExtractJsonPath$Key',
  'value.converter' = 'org.apache.kafka.connect.storage.StringConverter',
  'value.converter.schemas.enable' = 'false'
);

-- ES_ERP_RENTALS_MATERIALIZED_SINK_CONNECTOR (CONNECTOR)
CREATE SINK CONNECTOR ES_ERP_RENTALS_MATERIALIZED_SINK_CONNECTOR WITH (
  'collection' = 't3_rentals_materialized',
  'connection.uri' = '${env:MONGO_CONNECTION_STRING}',
  'connector.class' = 'com.mongodb.kafka.connect.MongoSinkConnector',
  'database' = 'es-erp',
  'delete.on.null.values' = 'true',
  'document.id.strategy' = 'com.mongodb.kafka.connect.sink.processor.id.strategy.ProvidedInKeyStrategy',
  'document.id.strategy.overwrite.existing' = 'true',
  'errors.log.enable' = 'true',
  'errors.log.include.messages' = 'true',
  'key.converter' = 'org.apache.kafka.connect.json.JsonConverter',
  'key.converter.schemas.enable' = 'false',
  'name' = 'ES_ERP_RENTALS_MATERIALIZED_SINK_CONNECTOR',
  'tasks.max' = '1',
  'topics' = '_es-erp-ksqldb.ESDB_RENTAL_MATERIALIZED_VIEW',
  'transforms' = 'wrapKey',
  'transforms.wrapKey.field' = '_id',
  'transforms.wrapKey.type' = 'org.apache.kafka.connect.transforms.HoistField$Key',
  'value.converter' = 'org.apache.kafka.connect.json.JsonConverter',
  'value.converter.schemas.enable' = 'false',
  'writemodel.strategy' = 'com.mongodb.kafka.connect.sink.writemodel.strategy.ReplaceOneDefaultStrategy'
);

-- ES_ERP_RENTALS_OPENSEARCH_SINK_CONNECTOR (CONNECTOR)
CREATE SINK CONNECTOR ES_ERP_RENTALS_OPENSEARCH_SINK_CONNECTOR WITH (
  'connector.class' = 'com.equipmentshare.kafka.connect.opensearch.OpenSearchSinkConnector',
  'key.converter' = 'org.apache.kafka.connect.json.JsonConverter',
  'key.converter.schemas.enable' = 'false',
  'name' = 'ES_ERP_RENTALS_OPENSEARCH_SINK_CONNECTOR',
  'opensearch.index.name' = 't3_rentals',
  'opensearch.url' = '${env:OPENSEARCH_ENDPOINT}',
  'tasks.max' = '1',
  'topics' = '_es-erp-ksqldb.ESDB_RENTAL_MATERIALIZED_VIEW',
  'value.converter' = 'org.apache.kafka.connect.json.JsonConverter',
  'value.converter.schemas.enable' = 'false'
);

-- ES_ERP_SALES_ORDERS_SOURCE_CONNECTOR (CONNECTOR)
CREATE SOURCE CONNECTOR ES_ERP_SALES_ORDERS_SOURCE_CONNECTOR WITH (
  'collection' = 'sales_orders',
  'connection.uri' = '${env:MONGO_CONNECTION_STRING}',
  'connector.class' = 'com.mongodb.kafka.connect.MongoSourceConnector',
  'database' = 'es-erp',
  'errors.log.enable' = 'true',
  'errors.log.include.messages' = 'true',
  'heartbeat.interval.ms' = '60000',
  'heartbeat.topic.name' = '_es-erp.private.mongo.__mongo_heartbeats',
  'key.converter' = 'org.apache.kafka.connect.storage.StringConverter',
  'key.converter.schemas.enable' = 'false',
  'name' = 'ES_ERP_SALES_ORDERS_SOURCE_CONNECTOR',
  'output.format.key' = 'json',
  'output.format.value' = 'json',
  'output.json.formatter' = 'com.mongodb.kafka.connect.source.json.formatter.SimplifiedJson',
  'publish.full.document.only' = 'true',
  'publish.full.document.only.tombstone.on.delete' = 'true',
  'startup.mode' = 'copy_existing',
  'tasks.max' = '1',
  'topic.creation.default.cleanup.policy' = 'compact',
  'topic.creation.default.partitions' = '1',
  'topic.creation.default.replication.factor' = '${env:TOPIC_CREATION_DEFAULT_REPLICATION_FACTOR}',
  'topic.creation.enable' = 'true',
  'topic.prefix' = '_es-erp.private.mongo',
  'transforms' = 'extractId',
  'transforms.extractId.json.path' = '$._id',
  'transforms.extractId.type' = 'com.equipmentshare.kafka.connect.transforms.ExtractJsonPath$Key',
  'value.converter' = 'org.apache.kafka.connect.storage.StringConverter',
  'value.converter.schemas.enable' = 'false'
);

-- Streams and Tables

-- ESDB_PUBLIC_ASSETS (TABLE)
-- Dependencies: ESDB_ASSET_CLASS, ESDB_ASSET_COMPANY, ESDB_ASSET_INVENTORY_BRANCH, ESDB_ASSET_MAKE, ESDB_ASSET_MATERIALIZED_VIEW, ESDB_ASSET_MODEL, ESDB_ASSET_MSP_BRANCH, ESDB_ASSET_PHOTOS, ESDB_ASSET_RSP_BRANCH, ESDB_ASSET_TRACKER, ESDB_ASSET_TYPE
CREATE TABLE ESDB_PUBLIC_ASSETS (`asset_id` STRING PRIMARY KEY, `asset_type_id` STRING, `name` STRING, `description` STRING, `custom_name` STRING, `model` STRING, `year` STRING, `company_id` STRING, `tracker_id` STRING, `vin` STRING, `driver_name` STRING, `serial_number` STRING, `equipment_make_id` STRING, `equipment_model_id` STRING, `service_branch_id` STRING, `inventory_branch_id` STRING, `rental_branch_id` STRING, `equipment_class_id` STRING, `camera_id` STRING, `photo_id` STRING) WITH (CLEANUP_POLICY='compact', KAFKA_TOPIC='fleet-source-connector-2.public.assets', KEY_FORMAT='JSON', PARTITIONS=1, VALUE_FORMAT='JSON');

-- ESDB_PUBLIC_EQUIPMENT_CLASSES (TABLE)
-- Dependencies: ESDB_ASSET_CLASS
CREATE TABLE ESDB_PUBLIC_EQUIPMENT_CLASSES (`equipment_class_id` STRING PRIMARY KEY, `name` STRING, `description` STRING) WITH (CLEANUP_POLICY='compact', KAFKA_TOPIC='fleet-source-connector-2.public.equipment_classes', KEY_FORMAT='JSON', PARTITIONS=1, VALUE_FORMAT='JSON');

-- ESDB_ASSET_CLASS (TABLE)
-- Dependencies: ESDB_ASSET_MATERIALIZED_VIEW
CREATE TABLE ESDB_ASSET_CLASS WITH (CLEANUP_POLICY='compact', KAFKA_TOPIC='_es-erp-ksqldb.ESDB_ASSET_CLASS', PARTITIONS=1, REPLICAS=1, RETENTION_MS=604800000) AS SELECT
  A.`asset_id` `asset_id`,
  STRUCT(`id`:=C.`equipment_class_id`, `name`:=C.`name`, `description`:=C.`description`) `class`
FROM ESDB_PUBLIC_ASSETS A
LEFT OUTER JOIN ESDB_PUBLIC_EQUIPMENT_CLASSES C ON ((COALESCE(A.`equipment_class_id`, ' ') = C.`equipment_class_id`))
EMIT CHANGES;

-- ESDB_PUBLIC_COMPANIES (TABLE)
-- Dependencies: ESDB_ASSET_COMPANY, ESDB_ASSET_TSP_COMPANIES, ESDB_BRANCH, ESDB_GROUPX, ESDB_ORDER_WITH_COMPANY
CREATE TABLE ESDB_PUBLIC_COMPANIES (`company_id` STRING PRIMARY KEY, `name` STRING) WITH (CLEANUP_POLICY='compact', KAFKA_TOPIC='fleet-source-connector-2.public.companies', KEY_FORMAT='JSON', PARTITIONS=1, VALUE_FORMAT='JSON');

-- ESDB_ASSET_COMPANY (TABLE)
-- Dependencies: ESDB_ASSET_MATERIALIZED_VIEW
CREATE TABLE ESDB_ASSET_COMPANY WITH (CLEANUP_POLICY='compact', KAFKA_TOPIC='_es-erp-ksqldb.ESDB_ASSET_COMPANY', PARTITIONS=1, REPLICAS=1, RETENTION_MS=604800000) AS SELECT
  A.`asset_id` `asset_id`,
  STRUCT(`id`:=C.`company_id`, `name`:=C.`name`) `company`
FROM ESDB_PUBLIC_ASSETS A
LEFT OUTER JOIN ESDB_PUBLIC_COMPANIES C ON ((COALESCE(A.`company_id`, ' ') = C.`company_id`))
EMIT CHANGES;

-- ESDB_PUBLIC_ORGANIZATIONS (TABLE)
-- Dependencies: ESDB_GROUPX
CREATE TABLE ESDB_PUBLIC_ORGANIZATIONS (`organization_id` STRING PRIMARY KEY, `name` STRING, `company_id` STRING) WITH (CLEANUP_POLICY='compact', KAFKA_TOPIC='fleet-source-connector-2.public.organizations', KEY_FORMAT='JSON', PARTITIONS=1, VALUE_FORMAT='JSON');

-- ESDB_GROUPX (TABLE)
-- Dependencies: ESDB_ASSET_GROUPS
CREATE TABLE ESDB_GROUPX WITH (CLEANUP_POLICY='compact', KAFKA_TOPIC='_es-erp-ksqldb.ESDB_GROUPX', PARTITIONS=1, REPLICAS=1, RETENTION_MS=604800000) AS SELECT
  O.`organization_id` `group_id`,
  STRUCT(`id`:=O.`organization_id`, `name`:=O.`name`, `company_id`:=C.`company_id`, `company_name`:=C.`name`) `group`
FROM ESDB_PUBLIC_ORGANIZATIONS O
LEFT OUTER JOIN ESDB_PUBLIC_COMPANIES C ON ((COALESCE(O.`company_id`, ' ') = C.`company_id`))
EMIT CHANGES;

-- ESDB_PUBLIC_ORGANIZATION_ASSET_XREF (TABLE)
-- Dependencies: ESDB_ASSET_GROUPS
CREATE TABLE ESDB_PUBLIC_ORGANIZATION_ASSET_XREF (`organization_asset_xref_id` STRING PRIMARY KEY, `organization_id` STRING, `asset_id` STRING) WITH (CLEANUP_POLICY='compact', KAFKA_TOPIC='fleet-source-connector-2.public.organization_asset_xref', KEY_FORMAT='JSON', PARTITIONS=1, VALUE_FORMAT='JSON');

-- ESDB_ASSET_GROUPS (TABLE)
-- Dependencies: ESDB_ASSET_MATERIALIZED_VIEW
CREATE TABLE ESDB_ASSET_GROUPS WITH (CLEANUP_POLICY='compact', KAFKA_TOPIC='_es-erp-ksqldb.ESDB_ASSET_GROUPS', PARTITIONS=1, REPLICAS=1, RETENTION_MS=604800000) AS SELECT
  OAX.`asset_id` `asset_id`,
  COLLECT_LIST(G.`group`) `groups`
FROM ESDB_PUBLIC_ORGANIZATION_ASSET_XREF OAX
LEFT OUTER JOIN ESDB_GROUPX G ON ((COALESCE(OAX.`organization_id`, ' ') = G.`group_id`))
GROUP BY OAX.`asset_id`
EMIT CHANGES;

-- ESDB_PUBLIC_MARKETS (TABLE)
-- Dependencies: ESDB_BRANCH
CREATE TABLE ESDB_PUBLIC_MARKETS (`market_id` STRING PRIMARY KEY, `name` STRING, `description` STRING, `company_id` STRING) WITH (CLEANUP_POLICY='compact', KAFKA_TOPIC='fleet-source-connector-2.public.markets', KEY_FORMAT='JSON', PARTITIONS=1, VALUE_FORMAT='JSON');

-- ESDB_BRANCH (TABLE)
-- Dependencies: ESDB_ASSET_INVENTORY_BRANCH, ESDB_ASSET_MSP_BRANCH, ESDB_ASSET_RSP_BRANCH
CREATE TABLE ESDB_BRANCH WITH (CLEANUP_POLICY='compact', KAFKA_TOPIC='_es-erp-ksqldb.ESDB_BRANCH', PARTITIONS=1, REPLICAS=1, RETENTION_MS=604800000) AS SELECT
  M.`market_id` `market_id`,
  STRUCT(`id`:=M.`market_id`, `name`:=M.`name`, `description`:=M.`description`, `company_id`:=C.`company_id`, `company_name`:=C.`name`) `branch`
FROM ESDB_PUBLIC_MARKETS M
LEFT OUTER JOIN ESDB_PUBLIC_COMPANIES C ON ((COALESCE(M.`company_id`, ' ') = C.`company_id`))
EMIT CHANGES;

-- ESDB_ASSET_INVENTORY_BRANCH (TABLE)
-- Dependencies: ESDB_ASSET_MATERIALIZED_VIEW
CREATE TABLE ESDB_ASSET_INVENTORY_BRANCH WITH (CLEANUP_POLICY='compact', KAFKA_TOPIC='_es-erp-ksqldb.ESDB_ASSET_INVENTORY_BRANCH', PARTITIONS=1, REPLICAS=1, RETENTION_MS=604800000) AS SELECT
  A.`asset_id` `asset_id`,
  B.`branch` `branch`
FROM ESDB_PUBLIC_ASSETS A
LEFT OUTER JOIN ESDB_BRANCH B ON ((COALESCE(A.`inventory_branch_id`, ' ') = B.`market_id`))
EMIT CHANGES;

-- ESDB_PUBLIC_KEYPADS (TABLE)
-- Dependencies: ESDB_ASSET_KEYPADS_TABLE
CREATE TABLE ESDB_PUBLIC_KEYPADS (`keypad_id` STRING PRIMARY KEY, `asset_id` STRING) WITH (CLEANUP_POLICY='compact', KAFKA_TOPIC='fleet-source-connector-2.public.keypads', KEY_FORMAT='JSON', PARTITIONS=1, VALUE_FORMAT='JSON');

-- ESDB_ASSET_KEYPADS_TABLE (TABLE)
-- Dependencies: ESDB_ASSET_KEYPADS
CREATE TABLE ESDB_ASSET_KEYPADS_TABLE WITH (CLEANUP_POLICY='compact', KAFKA_TOPIC='_es-erp-ksqldb.ESDB_ASSET_KEYPADS_TABLE', PARTITIONS=1, REPLICAS=1, RETENTION_MS=604800000) AS SELECT *
FROM ESDB_PUBLIC_KEYPADS ESDB_PUBLIC_KEYPADS
EMIT CHANGES;

-- ESDB_ASSET_KEYPADS (TABLE)
-- Dependencies: ESDB_ASSET_MATERIALIZED_VIEW
CREATE TABLE ESDB_ASSET_KEYPADS WITH (CLEANUP_POLICY='compact', KAFKA_TOPIC='_es-erp-ksqldb.ESDB_ASSET_KEYPADS', PARTITIONS=1, REPLICAS=1, RETENTION_MS=604800000) AS SELECT
  ESDB_ASSET_KEYPADS_TABLE.`asset_id` `asset_id`,
  COLLECT_LIST(ESDB_ASSET_KEYPADS_TABLE.`keypad_id`) `data`
FROM ESDB_ASSET_KEYPADS_TABLE ESDB_ASSET_KEYPADS_TABLE
WHERE (ESDB_ASSET_KEYPADS_TABLE.`asset_id` IS NOT NULL)
GROUP BY ESDB_ASSET_KEYPADS_TABLE.`asset_id`
EMIT CHANGES;

-- ESDB_PUBLIC_EQUIPMENT_MAKES (TABLE)
-- Dependencies: ESDB_ASSET_MAKE
CREATE TABLE ESDB_PUBLIC_EQUIPMENT_MAKES (`equipment_make_id` STRING PRIMARY KEY, `name` STRING) WITH (CLEANUP_POLICY='compact', KAFKA_TOPIC='fleet-source-connector-2.public.equipment_makes', KEY_FORMAT='JSON', PARTITIONS=1, VALUE_FORMAT='JSON');

-- ESDB_ASSET_MAKE (TABLE)
-- Dependencies: ESDB_ASSET_MATERIALIZED_VIEW
CREATE TABLE ESDB_ASSET_MAKE WITH (CLEANUP_POLICY='compact', KAFKA_TOPIC='_es-erp-ksqldb.ESDB_ASSET_MAKE', PARTITIONS=1, REPLICAS=1, RETENTION_MS=604800000) AS SELECT
  A.`asset_id` `asset_id`,
  STRUCT(`id`:=M.`equipment_make_id`, `name`:=M.`name`) `make`
FROM ESDB_PUBLIC_ASSETS A
LEFT OUTER JOIN ESDB_PUBLIC_EQUIPMENT_MAKES M ON ((COALESCE(A.`equipment_make_id`, ' ') = M.`equipment_make_id`))
EMIT CHANGES;

-- ESDB_PUBLIC_EQUIPMENT_MODELS (TABLE)
-- Dependencies: ESDB_ASSET_MODEL
CREATE TABLE ESDB_PUBLIC_EQUIPMENT_MODELS (`equipment_model_id` STRING PRIMARY KEY, `name` STRING) WITH (CLEANUP_POLICY='compact', KAFKA_TOPIC='fleet-source-connector-2.public.equipment_models', KEY_FORMAT='JSON', PARTITIONS=1, VALUE_FORMAT='JSON');

-- ESDB_ASSET_MODEL (TABLE)
-- Dependencies: ESDB_ASSET_MATERIALIZED_VIEW
CREATE TABLE ESDB_ASSET_MODEL WITH (CLEANUP_POLICY='compact', KAFKA_TOPIC='_es-erp-ksqldb.ESDB_ASSET_MODEL', PARTITIONS=1, REPLICAS=1, RETENTION_MS=604800000) AS SELECT
  A.`asset_id` `asset_id`,
  STRUCT(`id`:=M.`equipment_model_id`, `name`:=M.`name`) `model`
FROM ESDB_PUBLIC_ASSETS A
LEFT OUTER JOIN ESDB_PUBLIC_EQUIPMENT_MODELS M ON ((COALESCE(A.`equipment_model_id`, ' ') = M.`equipment_model_id`))
EMIT CHANGES;

-- ESDB_ASSET_MSP_BRANCH (TABLE)
-- Dependencies: ESDB_ASSET_MATERIALIZED_VIEW
CREATE TABLE ESDB_ASSET_MSP_BRANCH WITH (CLEANUP_POLICY='compact', KAFKA_TOPIC='_es-erp-ksqldb.ESDB_ASSET_MSP_BRANCH', PARTITIONS=1, REPLICAS=1, RETENTION_MS=604800000) AS SELECT
  A.`asset_id` `asset_id`,
  B.`branch` `branch`
FROM ESDB_PUBLIC_ASSETS A
LEFT OUTER JOIN ESDB_BRANCH B ON ((COALESCE(A.`service_branch_id`, ' ') = B.`market_id`))
EMIT CHANGES;

-- ESDB_PUBLIC_PHOTOS (TABLE)
-- Dependencies: ESDB_ASSET_PHOTOS
CREATE TABLE ESDB_PUBLIC_PHOTOS (`photo_id` STRING PRIMARY KEY, `filename` STRING) WITH (CLEANUP_POLICY='compact', KAFKA_TOPIC='fleet-source-connector-2.public.photos', KEY_FORMAT='JSON', PARTITIONS=1, VALUE_FORMAT='JSON');

-- ESDB_ASSET_PHOTOS (TABLE)
-- Dependencies: ESDB_ASSET_MATERIALIZED_VIEW
CREATE TABLE ESDB_ASSET_PHOTOS WITH (CLEANUP_POLICY='compact', KAFKA_TOPIC='_es-erp-ksqldb.ESDB_ASSET_PHOTOS', PARTITIONS=1, REPLICAS=1, RETENTION_MS=604800000) AS SELECT
  ASSETS.`asset_id` `asset_id`,
  PHOTOS.`photo_id` `photo_id`,
  PHOTOS.`filename` `filename`
FROM ESDB_PUBLIC_ASSETS ASSETS
LEFT OUTER JOIN ESDB_PUBLIC_PHOTOS PHOTOS ON ((COALESCE(ASSETS.`photo_id`, ' ') = PHOTOS.`photo_id`))
EMIT CHANGES;

-- ESDB_ASSET_RSP_BRANCH (TABLE)
-- Dependencies: ESDB_ASSET_MATERIALIZED_VIEW
CREATE TABLE ESDB_ASSET_RSP_BRANCH WITH (CLEANUP_POLICY='compact', KAFKA_TOPIC='_es-erp-ksqldb.ESDB_ASSET_RSP_BRANCH', PARTITIONS=1, REPLICAS=1, RETENTION_MS=604800000) AS SELECT
  A.`asset_id` `asset_id`,
  B.`branch` `branch`
FROM ESDB_PUBLIC_ASSETS A
LEFT OUTER JOIN ESDB_BRANCH B ON ((COALESCE(A.`rental_branch_id`, ' ') = B.`market_id`))
EMIT CHANGES;

-- ESDB_PUBLIC_TRACKERS (TABLE)
-- Dependencies: ESDB_ASSET_TRACKER
CREATE TABLE ESDB_PUBLIC_TRACKERS (`tracker_id` STRING PRIMARY KEY, `device_serial` STRING, `company_id` STRING, `vendor_id` STRING, `created` STRING, `updated` STRING, `tracker_type_id` STRING) WITH (CLEANUP_POLICY='compact', KAFKA_TOPIC='fleet-source-connector-2.public.trackers', KEY_FORMAT='JSON', PARTITIONS=1, VALUE_FORMAT='JSON');

-- ESDB_ASSET_TRACKER (TABLE)
-- Dependencies: ESDB_ASSET_MATERIALIZED_VIEW
CREATE TABLE ESDB_ASSET_TRACKER WITH (CLEANUP_POLICY='compact', KAFKA_TOPIC='_es-erp-ksqldb.ESDB_ASSET_TRACKER', PARTITIONS=1, REPLICAS=1, RETENTION_MS=604800000) AS SELECT
  A.`asset_id` `asset_id`,
  STRUCT(`id`:=A.`tracker_id`, `device_serial`:=T.`device_serial`, `company_id`:=T.`company_id`, `vendor_id`:=T.`vendor_id`, `created`:=T.`created`, `updated`:=T.`updated`, `tracker_type_id`:=T.`tracker_type_id`) `tracker`
FROM ESDB_PUBLIC_ASSETS A
LEFT OUTER JOIN ESDB_PUBLIC_TRACKERS T ON ((COALESCE(A.`tracker_id`, ' ') = T.`tracker_id`))
EMIT CHANGES;

-- ESDB_PUBLIC_TELEMATICS_SERVICE_PROVIDERS_ASSETS (TABLE)
-- Dependencies: ESDB_ASSET_TSP_COMPANIES
CREATE TABLE ESDB_PUBLIC_TELEMATICS_SERVICE_PROVIDERS_ASSETS (`telematics_service_providers_asset_id` STRING PRIMARY KEY, `asset_id` STRING, `company_id` STRING) WITH (CLEANUP_POLICY='compact', KAFKA_TOPIC='fleet-source-connector-2.public.telematics_service_providers_assets', KEY_FORMAT='JSON', PARTITIONS=1, VALUE_FORMAT='JSON');

-- ESDB_ASSET_TSP_COMPANIES (TABLE)
-- Dependencies: ESDB_ASSET_MATERIALIZED_VIEW
CREATE TABLE ESDB_ASSET_TSP_COMPANIES WITH (CLEANUP_POLICY='compact', KAFKA_TOPIC='_es-erp-ksqldb.ESDB_ASSET_TSP_COMPANIES', PARTITIONS=1, REPLICAS=1, RETENTION_MS=604800000) AS SELECT
  TSP.`asset_id` `asset_id`,
  COLLECT_LIST(STRUCT(`company_id`:=C.`company_id`, `company_name`:=C.`name`)) `tsp_companies`
FROM ESDB_PUBLIC_TELEMATICS_SERVICE_PROVIDERS_ASSETS TSP
LEFT OUTER JOIN ESDB_PUBLIC_COMPANIES C ON ((COALESCE(TSP.`company_id`, ' ') = C.`company_id`))
GROUP BY TSP.`asset_id`
EMIT CHANGES;

-- ESDB_PUBLIC_ASSET_TYPES (TABLE)
-- Dependencies: ESDB_ASSET_TYPE
CREATE TABLE ESDB_PUBLIC_ASSET_TYPES (`asset_type_id` STRING PRIMARY KEY, `name` STRING) WITH (CLEANUP_POLICY='compact', KAFKA_TOPIC='fleet-source-connector-2.public.asset_types', KEY_FORMAT='JSON', PARTITIONS=1, VALUE_FORMAT='JSON');

-- ESDB_ASSET_TYPE (TABLE)
-- Dependencies: ESDB_ASSET_MATERIALIZED_VIEW
CREATE TABLE ESDB_ASSET_TYPE WITH (CLEANUP_POLICY='compact', KAFKA_TOPIC='_es-erp-ksqldb.ESDB_ASSET_TYPE', PARTITIONS=1, REPLICAS=1, RETENTION_MS=604800000) AS SELECT
  A.`asset_id` `asset_id`,
  STRUCT(`id`:=T.`asset_type_id`, `name`:=T.`name`) `type`
FROM ESDB_PUBLIC_ASSETS A
LEFT OUTER JOIN ESDB_PUBLIC_ASSET_TYPES T ON ((COALESCE(A.`asset_type_id`, ' ') = T.`asset_type_id`))
EMIT CHANGES;

-- ESDB_ASSET_MATERIALIZED_VIEW (TABLE)
-- Dependencies: ESDB_RENTAL_ASSET
CREATE TABLE ESDB_ASSET_MATERIALIZED_VIEW WITH (CLEANUP_POLICY='compact', KAFKA_TOPIC='_es-erp-ksqldb.ESDB_ASSET_MATERIALIZED_VIEW', PARTITIONS=1, REPLICAS=1, RETENTION_MS=604800000) AS SELECT
  A.`asset_id` `asset_id`,
  STRUCT(`asset_id`:=A.`asset_id`, `name`:=A.`name`, `description`:=A.`description`, `custom_name`:=A.`custom_name`, `model`:=A.`model`, `year`:=A.`year`, `tracker_id`:=A.`tracker_id`, `vin`:=A.`vin`, `serial_number`:=A.`serial_number`, `driver_name`:=A.`driver_name`, `camera_id`:=A.`camera_id`, `photo_id`:=A.`photo_id`) `details`,
  STRUCT(`photo_id`:=PHOTO.`photo_id`, `filename`:=PHOTO.`filename`) `photo`,
  COMPANY.`company` `company`,
  ASSET_TYPE.`type` `type`,
  MAKE.`make` `make`,
  MODEL.`model` `model`,
  CLASS.`class` `class`,
  INVENTORY_BRANCH.`branch` `inventory_branch`,
  MSP_BRANCH.`branch` `msp_branch`,
  RSP_BRANCH.`branch` `rsp_branch`,
  GROUPS.`groups` `groups`,
  TSP_COMPANIES.`tsp_companies` `tsp_companies`,
  TRACKER.`tracker` `tracker`,
  KEYPADS.`data` `keypad`
FROM ESDB_PUBLIC_ASSETS A
LEFT OUTER JOIN ESDB_ASSET_COMPANY COMPANY ON ((A.`asset_id` = COMPANY.`asset_id`))
LEFT OUTER JOIN ESDB_ASSET_TYPE ASSET_TYPE ON ((A.`asset_id` = ASSET_TYPE.`asset_id`))
LEFT OUTER JOIN ESDB_ASSET_MAKE MAKE ON ((A.`asset_id` = MAKE.`asset_id`))
LEFT OUTER JOIN ESDB_ASSET_MODEL MODEL ON ((A.`asset_id` = MODEL.`asset_id`))
LEFT OUTER JOIN ESDB_ASSET_CLASS CLASS ON ((A.`asset_id` = CLASS.`asset_id`))
LEFT OUTER JOIN ESDB_ASSET_INVENTORY_BRANCH INVENTORY_BRANCH ON ((A.`asset_id` = INVENTORY_BRANCH.`asset_id`))
LEFT OUTER JOIN ESDB_ASSET_MSP_BRANCH MSP_BRANCH ON ((A.`asset_id` = MSP_BRANCH.`asset_id`))
LEFT OUTER JOIN ESDB_ASSET_RSP_BRANCH RSP_BRANCH ON ((A.`asset_id` = RSP_BRANCH.`asset_id`))
LEFT OUTER JOIN ESDB_ASSET_GROUPS GROUPS ON ((A.`asset_id` = GROUPS.`asset_id`))
LEFT OUTER JOIN ESDB_ASSET_TSP_COMPANIES TSP_COMPANIES ON ((A.`asset_id` = TSP_COMPANIES.`asset_id`))
LEFT OUTER JOIN ESDB_ASSET_TRACKER TRACKER ON ((A.`asset_id` = TRACKER.`asset_id`))
LEFT OUTER JOIN ESDB_ASSET_KEYPADS KEYPADS ON ((A.`asset_id` = KEYPADS.`asset_id`))
LEFT OUTER JOIN ESDB_ASSET_PHOTOS PHOTO ON ((A.`asset_id` = PHOTO.`asset_id`))
EMIT CHANGES;

-- ESDB_PUBLIC_ORDERS (TABLE)
-- Dependencies: ESDB_ORDER_WITH_STATUS
CREATE TABLE ESDB_PUBLIC_ORDERS (`order_id` STRING PRIMARY KEY, `order_status_id` STRING, `company_id` STRING, `user_id` STRING, `date_created` STRING, `date_updated` STRING) WITH (CLEANUP_POLICY='compact', KAFKA_TOPIC='fleet-source-connector-2.public.orders', KEY_FORMAT='JSON', PARTITIONS=1, VALUE_FORMAT='JSON');

-- ESDB_PUBLIC_ORDER_STATUSES (TABLE)
-- Dependencies: ESDB_ORDER_WITH_STATUS
CREATE TABLE ESDB_PUBLIC_ORDER_STATUSES (`order_status_id` STRING PRIMARY KEY, `name` STRING) WITH (CLEANUP_POLICY='compact', KAFKA_TOPIC='fleet-source-connector-2.public.order_statuses', KEY_FORMAT='JSON', PARTITIONS=1, VALUE_FORMAT='JSON');

-- ESDB_ORDER_WITH_STATUS (TABLE)
-- Dependencies: ESDB_ORDER_WITH_COMPANY
CREATE TABLE ESDB_ORDER_WITH_STATUS WITH (CLEANUP_POLICY='compact', KAFKA_TOPIC='_es-erp-ksqldb.ESDB_ORDER_WITH_STATUS', PARTITIONS=1, REPLICAS=1, RETENTION_MS=604800000) AS SELECT
  O.`order_id` `order_id`,
  O.`order_status_id` `order_status_id`,
  OS.`name` `order_status_name`,
  O.`company_id` `company_id`,
  O.`user_id` `user_id`,
  O.`date_created` `date_created`,
  O.`date_updated` `date_updated`
FROM ESDB_PUBLIC_ORDERS O
LEFT OUTER JOIN ESDB_PUBLIC_ORDER_STATUSES OS ON ((COALESCE(O.`order_status_id`, ' ') = OS.`order_status_id`))
EMIT CHANGES;

-- ESDB_ORDER_WITH_COMPANY (TABLE)
-- Dependencies: ESDB_ORDER_ENRICHED
CREATE TABLE ESDB_ORDER_WITH_COMPANY WITH (CLEANUP_POLICY='compact', KAFKA_TOPIC='_es-erp-ksqldb.ESDB_ORDER_WITH_COMPANY', PARTITIONS=1, REPLICAS=1, RETENTION_MS=604800000) AS SELECT
  OWS.`order_id` `order_id`,
  OWS.`order_status_id` `order_status_id`,
  OWS.`order_status_name` `order_status_name`,
  OWS.`company_id` `company_id`,
  C.`name` `company_name`,
  OWS.`user_id` `user_id`,
  OWS.`date_created` `date_created`,
  OWS.`date_updated` `date_updated`
FROM ESDB_ORDER_WITH_STATUS OWS
LEFT OUTER JOIN ESDB_PUBLIC_COMPANIES C ON ((COALESCE(OWS.`company_id`, ' ') = C.`company_id`))
EMIT CHANGES;

-- ESDB_PUBLIC_USERS (TABLE)
-- Dependencies: ESDB_ORDER_ENRICHED
CREATE TABLE ESDB_PUBLIC_USERS (`user_id` STRING PRIMARY KEY, `first_name` STRING, `last_name` STRING, `email_address` STRING, `username` STRING) WITH (CLEANUP_POLICY='compact', KAFKA_TOPIC='fleet-source-connector-2.public.users', KEY_FORMAT='JSON', PARTITIONS=1, VALUE_FORMAT='JSON');

-- ESDB_ORDER_ENRICHED (TABLE)
-- Dependencies: ESDB_ORDER_MATERIALIZED_VIEW, ESDB_RENTAL_ORDER
CREATE TABLE ESDB_ORDER_ENRICHED WITH (CLEANUP_POLICY='compact', KAFKA_TOPIC='_es-erp-ksqldb.ESDB_ORDER_ENRICHED', PARTITIONS=1, REPLICAS=1, RETENTION_MS=604800000) AS SELECT
  OWC.`order_id` `order_id`,
  OWC.`order_status_id` `order_status_id`,
  OWC.`order_status_name` `order_status_name`,
  OWC.`company_id` `company_id`,
  OWC.`company_name` `company_name`,
  OWC.`user_id` `user_id`,
  U.`first_name` `user_first_name`,
  U.`last_name` `user_last_name`,
  U.`email_address` `user_email`,
  OWC.`date_created` `date_created`,
  OWC.`date_updated` `date_updated`
FROM ESDB_ORDER_WITH_COMPANY OWC
LEFT OUTER JOIN ESDB_PUBLIC_USERS U ON ((COALESCE(OWC.`user_id`, ' ') = U.`user_id`))
EMIT CHANGES;

-- ESDB_PUBLIC_RENTALS (TABLE)
-- Dependencies: ESDB_RENTAL_ASSET, ESDB_RENTAL_MATERIALIZED_VIEW, ESDB_RENTAL_ORDER, ESDB_RENTAL_STATUS
CREATE TABLE ESDB_PUBLIC_RENTALS (`rental_id` STRING PRIMARY KEY, `borrower_user_id` STRING, `rental_status_id` STRING, `date_created` STRING, `start_date` STRING, `end_date` STRING, `amount_received` STRING, `price` STRING, `delivery_charge` STRING, `return_charge` STRING, `delivery_required` STRING, `delivery_instructions` STRING, `order_id` STRING, `drop_off_delivery_id` STRING, `return_delivery_id` STRING, `price_per_day` STRING, `price_per_week` STRING, `price_per_month` STRING, `start_date_estimated` STRING, `end_date_estimated` STRING, `job_description` STRING, `equipment_class_id` STRING, `price_per_hour` STRING, `deleted` STRING, `rental_protection_plan_id` STRING, `taxable` STRING, `asset_id` STRING, `drop_off_delivery_required` STRING, `return_delivery_required` STRING, `lien_notice_sent` STRING, `off_rent_date_requested` STRING, `external_id` STRING, `rental_type_id` STRING, `part_type_id` STRING, `quantity` STRING, `purchase_price` STRING, `rental_purchase_option_id` STRING, `rate_type_id` STRING, `has_re_rent` STRING, `is_below_floor_rate` STRING, `is_flat_monthly_rate` STRING, `is_flexible_rate` STRING, `inventory_product_id` STRING, `inventory_product_name` STRING, `inventory_product_name_historical` STRING, `one_time_charge` STRING, `rental_pricing_structure_id` STRING) WITH (CLEANUP_POLICY='compact', KAFKA_TOPIC='fleet-source-connector-2.public.rentals', KEY_FORMAT='JSON', PARTITIONS=1, VALUE_FORMAT='JSON');

-- ESDB_RENTAL_ASSET (TABLE)
-- Dependencies: ESDB_RENTAL_MATERIALIZED_VIEW
CREATE TABLE ESDB_RENTAL_ASSET WITH (CLEANUP_POLICY='compact', KAFKA_TOPIC='_es-erp-ksqldb.ESDB_RENTAL_ASSET', PARTITIONS=1, REPLICAS=1, RETENTION_MS=604800000) AS SELECT
  R.`rental_id` `rental_id`,
  STRUCT(`asset_id`:=A.`asset_id`, `details`:=A.`details`, `photo`:=A.`photo`, `company`:=A.`company`, `type`:=A.`type`, `make`:=A.`make`, `model`:=A.`model`, `class`:=A.`class`, `inventory_branch`:=A.`inventory_branch`, `msp_branch`:=A.`msp_branch`, `rsp_branch`:=A.`rsp_branch`, `groups`:=A.`groups`, `tsp_companies`:=A.`tsp_companies`, `tracker`:=A.`tracker`, `keypad`:=A.`keypad`) `asset`
FROM ESDB_PUBLIC_RENTALS R
LEFT OUTER JOIN ESDB_ASSET_MATERIALIZED_VIEW A ON ((COALESCE(R.`asset_id`, ' ') = A.`asset_id`))
EMIT CHANGES;

-- ESDB_RENTAL_ORDER (TABLE)
-- Dependencies: ESDB_RENTAL_MATERIALIZED_VIEW
CREATE TABLE ESDB_RENTAL_ORDER WITH (CLEANUP_POLICY='compact', KAFKA_TOPIC='_es-erp-ksqldb.ESDB_RENTAL_ORDER', PARTITIONS=1, REPLICAS=1, RETENTION_MS=604800000) AS SELECT
  R.`rental_id` `rental_id`,
  STRUCT(`order_id`:=OE.`order_id`, `order_status_id`:=OE.`order_status_id`, `order_status_name`:=OE.`order_status_name`, `company_id`:=OE.`company_id`, `company_name`:=OE.`company_name`, `ordered_by_user_id`:=OE.`user_id`, `ordered_by_first_name`:=OE.`user_first_name`, `ordered_by_last_name`:=OE.`user_last_name`, `ordered_by_email`:=OE.`user_email`, `date_created`:=OE.`date_created`, `date_updated`:=OE.`date_updated`) `order`
FROM ESDB_PUBLIC_RENTALS R
LEFT OUTER JOIN ESDB_ORDER_ENRICHED OE ON ((COALESCE(R.`order_id`, ' ') = OE.`order_id`))
EMIT CHANGES;

-- ESDB_PUBLIC_RENTAL_STATUSES (TABLE)
-- Dependencies: ESDB_RENTAL_STATUS
CREATE TABLE ESDB_PUBLIC_RENTAL_STATUSES (`rental_status_id` STRING PRIMARY KEY, `name` STRING) WITH (CLEANUP_POLICY='compact', KAFKA_TOPIC='fleet-source-connector-2.public.rental_statuses', KEY_FORMAT='JSON', PARTITIONS=1, VALUE_FORMAT='JSON');

-- ESDB_RENTAL_STATUS (TABLE)
-- Dependencies: ESDB_RENTAL_MATERIALIZED_VIEW
CREATE TABLE ESDB_RENTAL_STATUS WITH (CLEANUP_POLICY='compact', KAFKA_TOPIC='_es-erp-ksqldb.ESDB_RENTAL_STATUS', PARTITIONS=1, REPLICAS=1, RETENTION_MS=604800000) AS SELECT
  R.`rental_id` `rental_id`,
  STRUCT(`id`:=S.`rental_status_id`, `name`:=S.`name`) `status`
FROM ESDB_PUBLIC_RENTALS R
LEFT OUTER JOIN ESDB_PUBLIC_RENTAL_STATUSES S ON ((COALESCE(R.`rental_status_id`, ' ') = S.`rental_status_id`))
EMIT CHANGES;

-- ESDB_RENTAL_MATERIALIZED_VIEW (TABLE)
-- Dependencies: ESDB_ORDER_WITH_RENTALS
CREATE TABLE ESDB_RENTAL_MATERIALIZED_VIEW WITH (CLEANUP_POLICY='compact', KAFKA_TOPIC='_es-erp-ksqldb.ESDB_RENTAL_MATERIALIZED_VIEW', PARTITIONS=1, REPLICAS=1, RETENTION_MS=604800000) AS SELECT
  R.`rental_id` `rental_id`,
  STRUCT(`rental_id`:=R.`rental_id`, `borrower_user_id`:=R.`borrower_user_id`, `rental_status_id`:=R.`rental_status_id`, `date_created`:=R.`date_created`, `start_date`:=R.`start_date`, `end_date`:=R.`end_date`, `amount_received`:=R.`amount_received`, `price`:=R.`price`, `delivery_charge`:=R.`delivery_charge`, `return_charge`:=R.`return_charge`, `delivery_required`:=R.`delivery_required`, `delivery_instructions`:=R.`delivery_instructions`, `order_id`:=R.`order_id`, `drop_off_delivery_id`:=R.`drop_off_delivery_id`, `return_delivery_id`:=R.`return_delivery_id`, `price_per_day`:=R.`price_per_day`, `price_per_week`:=R.`price_per_week`, `price_per_month`:=R.`price_per_month`, `start_date_estimated`:=R.`start_date_estimated`, `end_date_estimated`:=R.`end_date_estimated`, `job_description`:=R.`job_description`, `equipment_class_id`:=R.`equipment_class_id`, `price_per_hour`:=R.`price_per_hour`, `deleted`:=R.`deleted`, `rental_protection_plan_id`:=R.`rental_protection_plan_id`, `taxable`:=R.`taxable`, `asset_id`:=R.`asset_id`, `drop_off_delivery_required`:=R.`drop_off_delivery_required`, `return_delivery_required`:=R.`return_delivery_required`, `lien_notice_sent`:=R.`lien_notice_sent`, `off_rent_date_requested`:=R.`off_rent_date_requested`, `external_id`:=R.`external_id`, `rental_type_id`:=R.`rental_type_id`, `part_type_id`:=R.`part_type_id`, `quantity`:=R.`quantity`, `purchase_price`:=R.`purchase_price`, `rental_purchase_option_id`:=R.`rental_purchase_option_id`, `rate_type_id`:=R.`rate_type_id`, `has_re_rent`:=R.`has_re_rent`, `is_below_floor_rate`:=R.`is_below_floor_rate`, `is_flat_monthly_rate`:=R.`is_flat_monthly_rate`, `is_flexible_rate`:=R.`is_flexible_rate`, `inventory_product_id`:=R.`inventory_product_id`, `inventory_product_name`:=R.`inventory_product_name`, `inventory_product_name_historical`:=R.`inventory_product_name_historical`, `one_time_charge`:=R.`one_time_charge`, `rental_pricing_structure_id`:=R.`rental_pricing_structure_id`) `details`,
  ASSET.`asset` `asset`,
  STATUS.`status` `status`,
  ORDERS.`order` `order`
FROM ESDB_PUBLIC_RENTALS R
LEFT OUTER JOIN ESDB_RENTAL_ASSET ASSET ON ((R.`rental_id` = ASSET.`rental_id`))
LEFT OUTER JOIN ESDB_RENTAL_STATUS STATUS ON ((R.`rental_id` = STATUS.`rental_id`))
LEFT OUTER JOIN ESDB_RENTAL_ORDER ORDERS ON ((R.`rental_id` = ORDERS.`rental_id`))
WHERE (R.`deleted` = 'false')
EMIT CHANGES;

-- ESDB_ORDER_WITH_RENTALS (TABLE)
-- Dependencies: ESDB_ORDER_MATERIALIZED_VIEW
CREATE TABLE ESDB_ORDER_WITH_RENTALS WITH (CLEANUP_POLICY='compact', KAFKA_TOPIC='_es-erp-ksqldb.ESDB_ORDER_WITH_RENTALS', PARTITIONS=1, REPLICAS=1, RETENTION_MS=604800000) AS SELECT
  ESDB_RENTAL_MATERIALIZED_VIEW.`order`->`order_id` `order_id`,
  COLLECT_LIST(STRUCT(`rental_id`:=ESDB_RENTAL_MATERIALIZED_VIEW.`details`->`rental_id`, `borrower_user_id`:=ESDB_RENTAL_MATERIALIZED_VIEW.`details`->`borrower_user_id`, `rental_status_id`:=ESDB_RENTAL_MATERIALIZED_VIEW.`details`->`rental_status_id`, `start_date`:=ESDB_RENTAL_MATERIALIZED_VIEW.`details`->`start_date`, `end_date`:=ESDB_RENTAL_MATERIALIZED_VIEW.`details`->`end_date`, `price`:=ESDB_RENTAL_MATERIALIZED_VIEW.`details`->`price`, `order_id`:=ESDB_RENTAL_MATERIALIZED_VIEW.`details`->`order_id`, `asset_id`:=ESDB_RENTAL_MATERIALIZED_VIEW.`asset`->`asset_id`, `asset_name`:=ESDB_RENTAL_MATERIALIZED_VIEW.`asset`->`details`->`name`, `asset_description`:=ESDB_RENTAL_MATERIALIZED_VIEW.`asset`->`details`->`description`, `asset_company_id`:=ESDB_RENTAL_MATERIALIZED_VIEW.`asset`->`company`->`id`, `asset_company_name`:=ESDB_RENTAL_MATERIALIZED_VIEW.`asset`->`company`->`name`, `status_id`:=ESDB_RENTAL_MATERIALIZED_VIEW.`status`->`id`, `status_name`:=ESDB_RENTAL_MATERIALIZED_VIEW.`status`->`name`)) `rentals`
FROM ESDB_RENTAL_MATERIALIZED_VIEW ESDB_RENTAL_MATERIALIZED_VIEW
GROUP BY ESDB_RENTAL_MATERIALIZED_VIEW.`order`->`order_id`
EMIT CHANGES;

-- ESDB_ORDER_MATERIALIZED_VIEW (TABLE)
CREATE TABLE ESDB_ORDER_MATERIALIZED_VIEW WITH (CLEANUP_POLICY='compact', KAFKA_TOPIC='_es-erp-ksqldb.ESDB_ORDER_MATERIALIZED_VIEW', PARTITIONS=1, REPLICAS=1, RETENTION_MS=604800000) AS SELECT
  O.`order_id` `order_id`,
  STRUCT(`order_id`:=O.`order_id`, `order_status_id`:=O.`order_status_id`, `order_status_name`:=O.`order_status_name`, `company_id`:=O.`company_id`, `company_name`:=O.`company_name`, `user_id`:=O.`user_id`, `user_first_name`:=O.`user_first_name`, `user_last_name`:=O.`user_last_name`, `user_email`:=O.`user_email`, `date_created`:=O.`date_created`, `date_updated`:=O.`date_updated`) `details`,
  AS_VALUE(R.`rentals`) `rentals`
FROM ESDB_ORDER_ENRICHED O
LEFT OUTER JOIN ESDB_ORDER_WITH_RENTALS R ON ((O.`order_id` = R.`order_id`))
EMIT CHANGES;

-- PIM_CATEGORIES_V1 (TABLE)
-- Dependencies: PIM_CATEGORIES_WITH_SPLIT_PATH_V1
CREATE TABLE IF NOT EXISTS PIM_CATEGORIES_V1 (`id` STRING PRIMARY KEY, `source` STRING, `specversion` STRING, `type` STRING, `time` STRING, `data` STRUCT<`name` STRING, `path` STRING, `description` STRING, `has_products` BOOLEAN, `platform_id` STRING, `tenant` STRUCT<`id` STRING>, `created_by` STRING, `createdAt` BIGINT, `updatedAt` BIGINT, `is_deleted` BOOLEAN>) WITH (CLEANUP_POLICY='compact', KAFKA_TOPIC='pim_categories', KEY_FORMAT='KAFKA', PARTITIONS=4, VALUE_FORMAT='AVRO');

-- PIM_CATEGORIES_WITH_SPLIT_PATH_V1 (TABLE)
-- Dependencies: PIM_CATEGORIES_MATERIALIZED_VIEW_V1
CREATE TABLE IF NOT EXISTS PIM_CATEGORIES_WITH_SPLIT_PATH_V1 WITH (CLEANUP_POLICY='compact', KAFKA_TOPIC='_es-erp-ksqldb.PIM_CATEGORIES_WITH_SPLIT_PATH_V1', KEY_FORMAT='JSON', PARTITIONS=4, REPLICAS=1, RETENTION_MS=604800000, VALUE_FORMAT='JSON') AS SELECT
  *,
  SPLIT(REGEXP_REPLACE(REGEXP_REPLACE(PIM_CATEGORIES_V1.`data`->`path`, '^\|', ''), '\|$', ''), '|') `path_parts`
FROM PIM_CATEGORIES_V1 PIM_CATEGORIES_V1
EMIT CHANGES;

-- PIM_CATEGORIES_MATERIALIZED_VIEW_V1 (TABLE)
-- Dependencies: PIM_CATEGORIES_REPARTITIONED
CREATE TABLE IF NOT EXISTS PIM_CATEGORIES_MATERIALIZED_VIEW_V1 WITH (CLEANUP_POLICY='compact', KAFKA_TOPIC='_es-erp-ksqldb.PIM_CATEGORIES_MATERIALIZED_VIEW_V1', PARTITIONS=4, REPLICAS=1, RETENTION_MS=604800000) AS SELECT
  PIM_CATEGORIES_WITH_SPLIT_PATH_V1.`id` `id`,
  PIM_CATEGORIES_WITH_SPLIT_PATH_V1.`source` `source`,
  PIM_CATEGORIES_WITH_SPLIT_PATH_V1.`specversion` `specversion`,
  PIM_CATEGORIES_WITH_SPLIT_PATH_V1.`type` `type`,
  PIM_CATEGORIES_WITH_SPLIT_PATH_V1.`time` `time`,
  PIM_CATEGORIES_WITH_SPLIT_PATH_V1.`data` `data`,
  PIM_CATEGORIES_WITH_SPLIT_PATH_V1.`path_parts`[1] `category_lvl1`,
  (CASE WHEN (PIM_CATEGORIES_WITH_SPLIT_PATH_V1.`path_parts`[2] IS NOT NULL) THEN CONCAT_WS('|', PIM_CATEGORIES_WITH_SPLIT_PATH_V1.`path_parts`[1], PIM_CATEGORIES_WITH_SPLIT_PATH_V1.`path_parts`[2]) ELSE null END) `category_lvl2`,
  (CASE WHEN (PIM_CATEGORIES_WITH_SPLIT_PATH_V1.`path_parts`[3] IS NOT NULL) THEN CONCAT_WS('|', PIM_CATEGORIES_WITH_SPLIT_PATH_V1.`path_parts`[1], PIM_CATEGORIES_WITH_SPLIT_PATH_V1.`path_parts`[2], PIM_CATEGORIES_WITH_SPLIT_PATH_V1.`path_parts`[3]) ELSE null END) `category_lvl3`,
  (CASE WHEN (PIM_CATEGORIES_WITH_SPLIT_PATH_V1.`path_parts`[4] IS NOT NULL) THEN CONCAT_WS('|', PIM_CATEGORIES_WITH_SPLIT_PATH_V1.`path_parts`[1], PIM_CATEGORIES_WITH_SPLIT_PATH_V1.`path_parts`[2], PIM_CATEGORIES_WITH_SPLIT_PATH_V1.`path_parts`[3], PIM_CATEGORIES_WITH_SPLIT_PATH_V1.`path_parts`[4]) ELSE null END) `category_lvl4`,
  (CASE WHEN (PIM_CATEGORIES_WITH_SPLIT_PATH_V1.`path_parts`[5] IS NOT NULL) THEN CONCAT_WS('|', PIM_CATEGORIES_WITH_SPLIT_PATH_V1.`path_parts`[1], PIM_CATEGORIES_WITH_SPLIT_PATH_V1.`path_parts`[2], PIM_CATEGORIES_WITH_SPLIT_PATH_V1.`path_parts`[3], PIM_CATEGORIES_WITH_SPLIT_PATH_V1.`path_parts`[4], PIM_CATEGORIES_WITH_SPLIT_PATH_V1.`path_parts`[5]) ELSE null END) `category_lvl5`,
  (CASE WHEN (PIM_CATEGORIES_WITH_SPLIT_PATH_V1.`path_parts`[6] IS NOT NULL) THEN CONCAT_WS('|', PIM_CATEGORIES_WITH_SPLIT_PATH_V1.`path_parts`[1], PIM_CATEGORIES_WITH_SPLIT_PATH_V1.`path_parts`[2], PIM_CATEGORIES_WITH_SPLIT_PATH_V1.`path_parts`[3], PIM_CATEGORIES_WITH_SPLIT_PATH_V1.`path_parts`[4], PIM_CATEGORIES_WITH_SPLIT_PATH_V1.`path_parts`[5], PIM_CATEGORIES_WITH_SPLIT_PATH_V1.`path_parts`[6]) ELSE null END) `category_lvl6`,
  (CASE WHEN (PIM_CATEGORIES_WITH_SPLIT_PATH_V1.`path_parts`[7] IS NOT NULL) THEN CONCAT_WS('|', PIM_CATEGORIES_WITH_SPLIT_PATH_V1.`path_parts`[1], PIM_CATEGORIES_WITH_SPLIT_PATH_V1.`path_parts`[2], PIM_CATEGORIES_WITH_SPLIT_PATH_V1.`path_parts`[3], PIM_CATEGORIES_WITH_SPLIT_PATH_V1.`path_parts`[4], PIM_CATEGORIES_WITH_SPLIT_PATH_V1.`path_parts`[5], PIM_CATEGORIES_WITH_SPLIT_PATH_V1.`path_parts`[6], PIM_CATEGORIES_WITH_SPLIT_PATH_V1.`path_parts`[7]) ELSE null END) `category_lvl7`,
  (CASE WHEN (PIM_CATEGORIES_WITH_SPLIT_PATH_V1.`path_parts`[8] IS NOT NULL) THEN CONCAT_WS('|', PIM_CATEGORIES_WITH_SPLIT_PATH_V1.`path_parts`[1], PIM_CATEGORIES_WITH_SPLIT_PATH_V1.`path_parts`[2], PIM_CATEGORIES_WITH_SPLIT_PATH_V1.`path_parts`[3], PIM_CATEGORIES_WITH_SPLIT_PATH_V1.`path_parts`[4], PIM_CATEGORIES_WITH_SPLIT_PATH_V1.`path_parts`[5], PIM_CATEGORIES_WITH_SPLIT_PATH_V1.`path_parts`[6], PIM_CATEGORIES_WITH_SPLIT_PATH_V1.`path_parts`[7], PIM_CATEGORIES_WITH_SPLIT_PATH_V1.`path_parts`[8]) ELSE null END) `category_lvl8`,
  (CASE WHEN (PIM_CATEGORIES_WITH_SPLIT_PATH_V1.`path_parts`[9] IS NOT NULL) THEN CONCAT_WS('|', PIM_CATEGORIES_WITH_SPLIT_PATH_V1.`path_parts`[1], PIM_CATEGORIES_WITH_SPLIT_PATH_V1.`path_parts`[2], PIM_CATEGORIES_WITH_SPLIT_PATH_V1.`path_parts`[3], PIM_CATEGORIES_WITH_SPLIT_PATH_V1.`path_parts`[4], PIM_CATEGORIES_WITH_SPLIT_PATH_V1.`path_parts`[5], PIM_CATEGORIES_WITH_SPLIT_PATH_V1.`path_parts`[6], PIM_CATEGORIES_WITH_SPLIT_PATH_V1.`path_parts`[7], PIM_CATEGORIES_WITH_SPLIT_PATH_V1.`path_parts`[8], PIM_CATEGORIES_WITH_SPLIT_PATH_V1.`path_parts`[9]) ELSE null END) `category_lvl9`,
  (CASE WHEN (PIM_CATEGORIES_WITH_SPLIT_PATH_V1.`path_parts`[10] IS NOT NULL) THEN CONCAT_WS('|', PIM_CATEGORIES_WITH_SPLIT_PATH_V1.`path_parts`[1], PIM_CATEGORIES_WITH_SPLIT_PATH_V1.`path_parts`[2], PIM_CATEGORIES_WITH_SPLIT_PATH_V1.`path_parts`[3], PIM_CATEGORIES_WITH_SPLIT_PATH_V1.`path_parts`[4], PIM_CATEGORIES_WITH_SPLIT_PATH_V1.`path_parts`[5], PIM_CATEGORIES_WITH_SPLIT_PATH_V1.`path_parts`[6], PIM_CATEGORIES_WITH_SPLIT_PATH_V1.`path_parts`[7], PIM_CATEGORIES_WITH_SPLIT_PATH_V1.`path_parts`[8], PIM_CATEGORIES_WITH_SPLIT_PATH_V1.`path_parts`[9], PIM_CATEGORIES_WITH_SPLIT_PATH_V1.`path_parts`[10]) ELSE null END) `category_lvl10`,
  (CASE WHEN (PIM_CATEGORIES_WITH_SPLIT_PATH_V1.`path_parts`[11] IS NOT NULL) THEN CONCAT_WS('|', PIM_CATEGORIES_WITH_SPLIT_PATH_V1.`path_parts`[1], PIM_CATEGORIES_WITH_SPLIT_PATH_V1.`path_parts`[2], PIM_CATEGORIES_WITH_SPLIT_PATH_V1.`path_parts`[3], PIM_CATEGORIES_WITH_SPLIT_PATH_V1.`path_parts`[4], PIM_CATEGORIES_WITH_SPLIT_PATH_V1.`path_parts`[5], PIM_CATEGORIES_WITH_SPLIT_PATH_V1.`path_parts`[6], PIM_CATEGORIES_WITH_SPLIT_PATH_V1.`path_parts`[7], PIM_CATEGORIES_WITH_SPLIT_PATH_V1.`path_parts`[8], PIM_CATEGORIES_WITH_SPLIT_PATH_V1.`path_parts`[9], PIM_CATEGORIES_WITH_SPLIT_PATH_V1.`path_parts`[10], PIM_CATEGORIES_WITH_SPLIT_PATH_V1.`path_parts`[11]) ELSE null END) `category_lvl11`,
  (CASE WHEN (PIM_CATEGORIES_WITH_SPLIT_PATH_V1.`path_parts`[12] IS NOT NULL) THEN CONCAT_WS('|', PIM_CATEGORIES_WITH_SPLIT_PATH_V1.`path_parts`[1], PIM_CATEGORIES_WITH_SPLIT_PATH_V1.`path_parts`[2], PIM_CATEGORIES_WITH_SPLIT_PATH_V1.`path_parts`[3], PIM_CATEGORIES_WITH_SPLIT_PATH_V1.`path_parts`[4], PIM_CATEGORIES_WITH_SPLIT_PATH_V1.`path_parts`[5], PIM_CATEGORIES_WITH_SPLIT_PATH_V1.`path_parts`[6], PIM_CATEGORIES_WITH_SPLIT_PATH_V1.`path_parts`[7], PIM_CATEGORIES_WITH_SPLIT_PATH_V1.`path_parts`[8], PIM_CATEGORIES_WITH_SPLIT_PATH_V1.`path_parts`[9], PIM_CATEGORIES_WITH_SPLIT_PATH_V1.`path_parts`[10], PIM_CATEGORIES_WITH_SPLIT_PATH_V1.`path_parts`[11], PIM_CATEGORIES_WITH_SPLIT_PATH_V1.`path_parts`[12]) ELSE null END) `category_lvl12`
FROM PIM_CATEGORIES_WITH_SPLIT_PATH_V1 PIM_CATEGORIES_WITH_SPLIT_PATH_V1
EMIT CHANGES;

-- PIM_CATEGORIES_REPARTITIONED (TABLE)
-- Dependencies: PRICES_WITH_CATEGORY
CREATE TABLE IF NOT EXISTS PIM_CATEGORIES_REPARTITIONED WITH (CLEANUP_POLICY='compact', KAFKA_TOPIC='_es-erp-ksqldb.PIM_CATEGORIES_REPARTITIONED', PARTITIONS=1, REPLICAS=1, RETENTION_MS=604800000) AS SELECT *
FROM PIM_CATEGORIES_MATERIALIZED_VIEW_V1 PIM_CATEGORIES_MATERIALIZED_VIEW_V1
EMIT CHANGES;

-- PIM_PRODUCTS_V1 (TABLE)
-- Dependencies: PIM_PRODUCTS_WITH_SPLIT_CAT_PATH_V1
CREATE TABLE IF NOT EXISTS PIM_PRODUCTS_V1 (`id` STRING PRIMARY KEY, `source` STRING, `specversion` STRING, `type` STRING, `time` STRING, `data` STRUCT<`platform_id` STRING, `tenant` STRUCT<`id` STRING>, `product_category` STRUCT<`id` STRING, `category_platform_id` STRING, `name` STRING, `path` STRING>, `product_core_attributes` STRUCT<`name` STRING, `make` STRING, `make_platform_id` STRING, `model` STRING, `year` STRING, `variant` STRING>, `product_source_attributes` STRUCT<`manufacturer_part_number` STRING, `sku` STRING, `source` STRING, `upc` STRING>, `created_by` STRING, `createdAt` BIGINT, `updatedAt` BIGINT, `is_deleted` BOOLEAN, `last_published_date` STRING, `product_attribute_groups` ARRAY<STRUCT<`name` STRING, `attributes` ARRAY<STRUCT<`name` STRING, `value` STRING, `description` STRING, `unit_of_measure` STRUCT<`type` STRING, `name` STRING, `abbreviation` STRING, `classification` STRING, `validator_regex` STRING, `validation_message` STRING, `normalized_unit_name` STRING, `normalized_unit_abbreviation` STRING, `normalized_value` STRING, `id` STRING>>>>>, `product_category_core_attributes` ARRAY<STRUCT<`name` STRING, `value` STRING, `description` STRING, `unit_of_measure` STRUCT<`type` STRING, `name` STRING, `abbreviation` STRING, `classification` STRING, `validator_regex` STRING, `validation_message` STRING, `normalized_unit_name` STRING, `normalized_unit_abbreviation` STRING, `normalized_value` STRING, `id` STRING>>>, `product_shipping_dimensions_attributes` ARRAY<STRUCT<`name` STRING, `value` STRING, `description` STRING, `unit_of_measure` STRUCT<`type` STRING, `name` STRING, `abbreviation` STRING, `classification` STRING, `validator_regex` STRING, `validation_message` STRING, `normalized_unit_name` STRING, `normalized_unit_abbreviation` STRING, `normalized_value` STRING, `id` STRING>>>, `product_options` ARRAY<STRUCT<`name` STRING, `options` ARRAY<STRUCT<`name` STRING, `value` STRING, `is_choices` BOOLEAN, `choices` ARRAY<STRUCT<`name` STRING, `value` STRING, `attributes` ARRAY<STRUCT<`name` STRING, `value` STRING, `description` STRING, `unit_of_measure` STRUCT<`type` STRING, `name` STRING, `abbreviation` STRING, `classification` STRING, `validator_regex` STRING, `validation_message` STRING, `normalized_unit_name` STRING, `normalized_unit_abbreviation` STRING, `normalized_value` STRING, `id` STRING>>>>>, `attributes` ARRAY<STRUCT<`name` STRING, `value` STRING, `description` STRING, `unit_of_measure` STRUCT<`type` STRING, `name` STRING, `abbreviation` STRING, `classification` STRING, `validator_regex` STRING, `validation_message` STRING, `normalized_unit_name` STRING, `normalized_unit_abbreviation` STRING, `normalized_value` STRING, `id` STRING>>>>>>>, `associations` ARRAY<STRUCT<`platform_id` STRING, `type` STRING, `name` STRING, `make` STRING, `make_platform_id` STRING, `model` STRING, `variant` STRING, `manufacturer_part_number` STRING, `year` STRING, `upc` STRING, `sku` STRING>>>) WITH (CLEANUP_POLICY='compact', KAFKA_TOPIC='pim_products', KEY_FORMAT='KAFKA', PARTITIONS=4, VALUE_FORMAT='AVRO');

-- PIM_PRODUCTS_WITH_SPLIT_CAT_PATH_V1 (TABLE)
-- Dependencies: PIM_PRODUCTS_MATERIALIZED_VIEW_V1
CREATE TABLE IF NOT EXISTS PIM_PRODUCTS_WITH_SPLIT_CAT_PATH_V1 WITH (CLEANUP_POLICY='compact', KAFKA_TOPIC='_es-erp-ksqldb.PIM_PRODUCTS_WITH_SPLIT_CAT_PATH_V1', KEY_FORMAT='JSON', PARTITIONS=4, REPLICAS=1, RETENTION_MS=604800000, VALUE_FORMAT='JSON') AS SELECT
  *,
  SPLIT(REGEXP_REPLACE(REGEXP_REPLACE(PIM_PRODUCTS_V1.`data`->`product_category`->`path`, '^\|', ''), '\|$', ''), '|') `path_parts`
FROM PIM_PRODUCTS_V1 PIM_PRODUCTS_V1
EMIT CHANGES;

-- PIM_PRODUCTS_MATERIALIZED_VIEW_V1 (TABLE)
-- Dependencies: PIM_PRODUCTS_REPARTITIONED
CREATE TABLE IF NOT EXISTS PIM_PRODUCTS_MATERIALIZED_VIEW_V1 WITH (CLEANUP_POLICY='compact', KAFKA_TOPIC='_es-erp-ksqldb.PIM_PRODUCTS_MATERIALIZED_VIEW_V1', PARTITIONS=4, REPLICAS=1, RETENTION_MS=604800000) AS SELECT
  PIM_PRODUCTS_WITH_SPLIT_CAT_PATH_V1.`id` `id`,
  PIM_PRODUCTS_WITH_SPLIT_CAT_PATH_V1.`source` `source`,
  PIM_PRODUCTS_WITH_SPLIT_CAT_PATH_V1.`specversion` `specversion`,
  PIM_PRODUCTS_WITH_SPLIT_CAT_PATH_V1.`type` `type`,
  PIM_PRODUCTS_WITH_SPLIT_CAT_PATH_V1.`time` `time`,
  PIM_PRODUCTS_WITH_SPLIT_CAT_PATH_V1.`data` `data`,
  PIM_PRODUCTS_WITH_SPLIT_CAT_PATH_V1.`path_parts`[1] `category_lvl1`,
  (CASE WHEN (PIM_PRODUCTS_WITH_SPLIT_CAT_PATH_V1.`path_parts`[2] IS NOT NULL) THEN CONCAT_WS('|', PIM_PRODUCTS_WITH_SPLIT_CAT_PATH_V1.`path_parts`[1], PIM_PRODUCTS_WITH_SPLIT_CAT_PATH_V1.`path_parts`[2]) ELSE null END) `category_lvl2`,
  (CASE WHEN (PIM_PRODUCTS_WITH_SPLIT_CAT_PATH_V1.`path_parts`[3] IS NOT NULL) THEN CONCAT_WS('|', PIM_PRODUCTS_WITH_SPLIT_CAT_PATH_V1.`path_parts`[1], PIM_PRODUCTS_WITH_SPLIT_CAT_PATH_V1.`path_parts`[2], PIM_PRODUCTS_WITH_SPLIT_CAT_PATH_V1.`path_parts`[3]) ELSE null END) `category_lvl3`,
  (CASE WHEN (PIM_PRODUCTS_WITH_SPLIT_CAT_PATH_V1.`path_parts`[4] IS NOT NULL) THEN CONCAT_WS('|', PIM_PRODUCTS_WITH_SPLIT_CAT_PATH_V1.`path_parts`[1], PIM_PRODUCTS_WITH_SPLIT_CAT_PATH_V1.`path_parts`[2], PIM_PRODUCTS_WITH_SPLIT_CAT_PATH_V1.`path_parts`[3], PIM_PRODUCTS_WITH_SPLIT_CAT_PATH_V1.`path_parts`[4]) ELSE null END) `category_lvl4`,
  (CASE WHEN (PIM_PRODUCTS_WITH_SPLIT_CAT_PATH_V1.`path_parts`[5] IS NOT NULL) THEN CONCAT_WS('|', PIM_PRODUCTS_WITH_SPLIT_CAT_PATH_V1.`path_parts`[1], PIM_PRODUCTS_WITH_SPLIT_CAT_PATH_V1.`path_parts`[2], PIM_PRODUCTS_WITH_SPLIT_CAT_PATH_V1.`path_parts`[3], PIM_PRODUCTS_WITH_SPLIT_CAT_PATH_V1.`path_parts`[4], PIM_PRODUCTS_WITH_SPLIT_CAT_PATH_V1.`path_parts`[5]) ELSE null END) `category_lvl5`,
  (CASE WHEN (PIM_PRODUCTS_WITH_SPLIT_CAT_PATH_V1.`path_parts`[6] IS NOT NULL) THEN CONCAT_WS('|', PIM_PRODUCTS_WITH_SPLIT_CAT_PATH_V1.`path_parts`[1], PIM_PRODUCTS_WITH_SPLIT_CAT_PATH_V1.`path_parts`[2], PIM_PRODUCTS_WITH_SPLIT_CAT_PATH_V1.`path_parts`[3], PIM_PRODUCTS_WITH_SPLIT_CAT_PATH_V1.`path_parts`[4], PIM_PRODUCTS_WITH_SPLIT_CAT_PATH_V1.`path_parts`[5], PIM_PRODUCTS_WITH_SPLIT_CAT_PATH_V1.`path_parts`[6]) ELSE null END) `category_lvl6`,
  (CASE WHEN (PIM_PRODUCTS_WITH_SPLIT_CAT_PATH_V1.`path_parts`[7] IS NOT NULL) THEN CONCAT_WS('|', PIM_PRODUCTS_WITH_SPLIT_CAT_PATH_V1.`path_parts`[1], PIM_PRODUCTS_WITH_SPLIT_CAT_PATH_V1.`path_parts`[2], PIM_PRODUCTS_WITH_SPLIT_CAT_PATH_V1.`path_parts`[3], PIM_PRODUCTS_WITH_SPLIT_CAT_PATH_V1.`path_parts`[4], PIM_PRODUCTS_WITH_SPLIT_CAT_PATH_V1.`path_parts`[5], PIM_PRODUCTS_WITH_SPLIT_CAT_PATH_V1.`path_parts`[6], PIM_PRODUCTS_WITH_SPLIT_CAT_PATH_V1.`path_parts`[7]) ELSE null END) `category_lvl7`,
  (CASE WHEN (PIM_PRODUCTS_WITH_SPLIT_CAT_PATH_V1.`path_parts`[8] IS NOT NULL) THEN CONCAT_WS('|', PIM_PRODUCTS_WITH_SPLIT_CAT_PATH_V1.`path_parts`[1], PIM_PRODUCTS_WITH_SPLIT_CAT_PATH_V1.`path_parts`[2], PIM_PRODUCTS_WITH_SPLIT_CAT_PATH_V1.`path_parts`[3], PIM_PRODUCTS_WITH_SPLIT_CAT_PATH_V1.`path_parts`[4], PIM_PRODUCTS_WITH_SPLIT_CAT_PATH_V1.`path_parts`[5], PIM_PRODUCTS_WITH_SPLIT_CAT_PATH_V1.`path_parts`[6], PIM_PRODUCTS_WITH_SPLIT_CAT_PATH_V1.`path_parts`[7], PIM_PRODUCTS_WITH_SPLIT_CAT_PATH_V1.`path_parts`[8]) ELSE null END) `category_lvl8`,
  (CASE WHEN (PIM_PRODUCTS_WITH_SPLIT_CAT_PATH_V1.`path_parts`[9] IS NOT NULL) THEN CONCAT_WS('|', PIM_PRODUCTS_WITH_SPLIT_CAT_PATH_V1.`path_parts`[1], PIM_PRODUCTS_WITH_SPLIT_CAT_PATH_V1.`path_parts`[2], PIM_PRODUCTS_WITH_SPLIT_CAT_PATH_V1.`path_parts`[3], PIM_PRODUCTS_WITH_SPLIT_CAT_PATH_V1.`path_parts`[4], PIM_PRODUCTS_WITH_SPLIT_CAT_PATH_V1.`path_parts`[5], PIM_PRODUCTS_WITH_SPLIT_CAT_PATH_V1.`path_parts`[6], PIM_PRODUCTS_WITH_SPLIT_CAT_PATH_V1.`path_parts`[7], PIM_PRODUCTS_WITH_SPLIT_CAT_PATH_V1.`path_parts`[8], PIM_PRODUCTS_WITH_SPLIT_CAT_PATH_V1.`path_parts`[9]) ELSE null END) `category_lvl9`,
  (CASE WHEN (PIM_PRODUCTS_WITH_SPLIT_CAT_PATH_V1.`path_parts`[10] IS NOT NULL) THEN CONCAT_WS('|', PIM_PRODUCTS_WITH_SPLIT_CAT_PATH_V1.`path_parts`[1], PIM_PRODUCTS_WITH_SPLIT_CAT_PATH_V1.`path_parts`[2], PIM_PRODUCTS_WITH_SPLIT_CAT_PATH_V1.`path_parts`[3], PIM_PRODUCTS_WITH_SPLIT_CAT_PATH_V1.`path_parts`[4], PIM_PRODUCTS_WITH_SPLIT_CAT_PATH_V1.`path_parts`[5], PIM_PRODUCTS_WITH_SPLIT_CAT_PATH_V1.`path_parts`[6], PIM_PRODUCTS_WITH_SPLIT_CAT_PATH_V1.`path_parts`[7], PIM_PRODUCTS_WITH_SPLIT_CAT_PATH_V1.`path_parts`[8], PIM_PRODUCTS_WITH_SPLIT_CAT_PATH_V1.`path_parts`[9], PIM_PRODUCTS_WITH_SPLIT_CAT_PATH_V1.`path_parts`[10]) ELSE null END) `category_lvl10`,
  (CASE WHEN (PIM_PRODUCTS_WITH_SPLIT_CAT_PATH_V1.`path_parts`[11] IS NOT NULL) THEN CONCAT_WS('|', PIM_PRODUCTS_WITH_SPLIT_CAT_PATH_V1.`path_parts`[1], PIM_PRODUCTS_WITH_SPLIT_CAT_PATH_V1.`path_parts`[2], PIM_PRODUCTS_WITH_SPLIT_CAT_PATH_V1.`path_parts`[3], PIM_PRODUCTS_WITH_SPLIT_CAT_PATH_V1.`path_parts`[4], PIM_PRODUCTS_WITH_SPLIT_CAT_PATH_V1.`path_parts`[5], PIM_PRODUCTS_WITH_SPLIT_CAT_PATH_V1.`path_parts`[6], PIM_PRODUCTS_WITH_SPLIT_CAT_PATH_V1.`path_parts`[7], PIM_PRODUCTS_WITH_SPLIT_CAT_PATH_V1.`path_parts`[8], PIM_PRODUCTS_WITH_SPLIT_CAT_PATH_V1.`path_parts`[9], PIM_PRODUCTS_WITH_SPLIT_CAT_PATH_V1.`path_parts`[10], PIM_PRODUCTS_WITH_SPLIT_CAT_PATH_V1.`path_parts`[11]) ELSE null END) `category_lvl11`,
  (CASE WHEN (PIM_PRODUCTS_WITH_SPLIT_CAT_PATH_V1.`path_parts`[12] IS NOT NULL) THEN CONCAT_WS('|', PIM_PRODUCTS_WITH_SPLIT_CAT_PATH_V1.`path_parts`[1], PIM_PRODUCTS_WITH_SPLIT_CAT_PATH_V1.`path_parts`[2], PIM_PRODUCTS_WITH_SPLIT_CAT_PATH_V1.`path_parts`[3], PIM_PRODUCTS_WITH_SPLIT_CAT_PATH_V1.`path_parts`[4], PIM_PRODUCTS_WITH_SPLIT_CAT_PATH_V1.`path_parts`[5], PIM_PRODUCTS_WITH_SPLIT_CAT_PATH_V1.`path_parts`[6], PIM_PRODUCTS_WITH_SPLIT_CAT_PATH_V1.`path_parts`[7], PIM_PRODUCTS_WITH_SPLIT_CAT_PATH_V1.`path_parts`[8], PIM_PRODUCTS_WITH_SPLIT_CAT_PATH_V1.`path_parts`[9], PIM_PRODUCTS_WITH_SPLIT_CAT_PATH_V1.`path_parts`[10], PIM_PRODUCTS_WITH_SPLIT_CAT_PATH_V1.`path_parts`[11], PIM_PRODUCTS_WITH_SPLIT_CAT_PATH_V1.`path_parts`[12]) ELSE null END) `category_lvl12`
FROM PIM_PRODUCTS_WITH_SPLIT_CAT_PATH_V1 PIM_PRODUCTS_WITH_SPLIT_CAT_PATH_V1
EMIT CHANGES;

-- PIM_PRODUCTS_REPARTITIONED (TABLE)
CREATE TABLE IF NOT EXISTS PIM_PRODUCTS_REPARTITIONED WITH (CLEANUP_POLICY='compact', KAFKA_TOPIC='_es-erp-ksqldb.PIM_PRODUCTS_REPARTITIONED', PARTITIONS=1, REPLICAS=1, RETENTION_MS=604800000) AS SELECT *
FROM PIM_PRODUCTS_MATERIALIZED_VIEW_V1 PIM_PRODUCTS_MATERIALIZED_VIEW_V1
EMIT CHANGES;

-- PRICES_TABLE (TABLE)
-- Dependencies: PRICES_WITH_PRICE_BOOK
CREATE TABLE IF NOT EXISTS PRICES_TABLE (`_id` STRING PRIMARY KEY, `workspaceId` STRING, `parentPriceId` STRING, `parentPriceIdPercentageFactor` STRING, `name` STRING, `createdBy` STRING, `createdAt` STRING, `updatedAt` STRING, `updatedBy` STRING, `pimCategoryId` STRING, `pimCategoryPath` STRING, `pimCategoryName` STRING, `pimProductId` STRING, `priceType` STRING, `priceBookId` STRING, `businessContactId` STRING, `projectId` STRING, `location` STRING, `pricePerDayInCents` BIGINT, `pricePerWeekInCents` BIGINT, `pricePerMonthInCents` BIGINT, `unitCostInCents` BIGINT, `discounts` STRING, `deleted` BOOLEAN) WITH (CLEANUP_POLICY='compact', KAFKA_TOPIC='_es-erp.private.mongo.es-erp.prices', KEY_FORMAT='KAFKA', PARTITIONS=1, VALUE_FORMAT='JSON');

-- PRICE_BOOKS_TABLE (TABLE)
-- Dependencies: PRICES_WITH_PRICE_BOOK
CREATE TABLE IF NOT EXISTS PRICE_BOOKS_TABLE (`_id` STRING PRIMARY KEY, `workspaceId` STRING, `parentPriceBookId` STRING, `parentPriceBookPercentageFactor` STRING, `name` STRING, `notes` STRING, `createdBy` STRING, `createdAt` STRING, `updatedAt` STRING, `updatedBy` STRING, `businessContactId` STRING, `projectId` STRING, `location` STRING, `deleted` BOOLEAN) WITH (CLEANUP_POLICY='compact', KAFKA_TOPIC='_es-erp.private.mongo.es-erp.price_books', KEY_FORMAT='KAFKA', PARTITIONS=1, VALUE_FORMAT='JSON');

-- PRICES_WITH_PRICE_BOOK (TABLE)
-- Dependencies: PRICES_WITH_CATEGORY
CREATE TABLE IF NOT EXISTS PRICES_WITH_PRICE_BOOK WITH (CLEANUP_POLICY='compact', KAFKA_TOPIC='_es-erp-ksqldb.PRICES_WITH_PRICE_BOOK', PARTITIONS=1, REPLICAS=1, RETENTION_MS=604800000) AS SELECT
  P.`_id` `_id`,
  P.`workspaceId` `workspaceId`,
  P.`parentPriceId` `parentPriceId`,
  P.`parentPriceIdPercentageFactor` `parentPriceIdPercentageFactor`,
  P.`name` `name`,
  P.`createdBy` `createdBy`,
  P.`createdAt` `createdAt`,
  P.`updatedAt` `updatedAt`,
  P.`updatedBy` `updatedBy`,
  P.`pimCategoryId` `pimCategoryId`,
  P.`pimCategoryPath` `pimCategoryPath`,
  P.`pimCategoryName` `pimCategoryName`,
  P.`pimProductId` `pimProductId`,
  P.`priceType` `priceType`,
  P.`priceBookId` `priceBookId`,
  P.`businessContactId` `businessContactId`,
  P.`projectId` `projectId`,
  P.`location` `location`,
  P.`pricePerDayInCents` `pricePerDayInCents`,
  P.`pricePerWeekInCents` `pricePerWeekInCents`,
  P.`pricePerMonthInCents` `pricePerMonthInCents`,
  P.`unitCostInCents` `unitCostInCents`,
  P.`discounts` `discounts`,
  STRUCT(`id`:=PB.`_id`, `workspace_id`:=PB.`workspaceId`, `parent_price_book_id`:=PB.`parentPriceBookId`, `parent_price_book_percentage_factor`:=PB.`parentPriceBookPercentageFactor`, `name`:=PB.`name`, `notes`:=PB.`notes`, `created_by`:=PB.`createdBy`, `created_at`:=PB.`createdAt`, `updated_at`:=PB.`updatedAt`, `updated_by`:=PB.`updatedBy`, `business_contact_id`:=PB.`businessContactId`, `project_id`:=PB.`projectId`, `location`:=PB.`location`) `price_book`
FROM PRICES_TABLE P
LEFT OUTER JOIN PRICE_BOOKS_TABLE PB ON ((P.`priceBookId` = PB.`_id`))
WHERE ((P.`deleted` IS NULL) OR (P.`deleted` = false))
EMIT CHANGES;

-- PRICES_WITH_CATEGORY (TABLE)
CREATE TABLE IF NOT EXISTS PRICES_WITH_CATEGORY WITH (CLEANUP_POLICY='compact', KAFKA_TOPIC='_es-erp-ksqldb.PRICES_WITH_CATEGORY', PARTITIONS=1, REPLICAS=1, RETENTION_MS=604800000) AS SELECT
  PWPB.`_id` `_id`,
  PWPB.`workspaceId` `workspaceId`,
  PWPB.`parentPriceId` `parentPriceId`,
  PWPB.`parentPriceIdPercentageFactor` `parentPriceIdPercentageFactor`,
  PWPB.`name` `name`,
  PWPB.`createdBy` `createdBy`,
  PWPB.`createdAt` `createdAt`,
  PWPB.`updatedAt` `updatedAt`,
  PWPB.`updatedBy` `updatedBy`,
  PWPB.`pimCategoryId` `pimCategoryId`,
  PWPB.`pimCategoryPath` `pimCategoryPath`,
  PWPB.`pimCategoryName` `pimCategoryName`,
  PWPB.`pimProductId` `pimProductId`,
  PWPB.`priceType` `priceType`,
  PWPB.`priceBookId` `priceBookId`,
  PWPB.`businessContactId` `businessContactId`,
  PWPB.`projectId` `projectId`,
  PWPB.`location` `location`,
  PWPB.`pricePerDayInCents` `pricePerDayInCents`,
  PWPB.`pricePerWeekInCents` `pricePerWeekInCents`,
  PWPB.`pricePerMonthInCents` `pricePerMonthInCents`,
  PWPB.`unitCostInCents` `unitCostInCents`,
  PWPB.`discounts` `discounts`,
  PWPB.`price_book` `price_book`,
  STRUCT(`id`:=CAT.`id`, `source`:=CAT.`source`, `specversion`:=CAT.`specversion`, `type`:=CAT.`type`, `time`:=CAT.`time`, `data`:=CAT.`data`, `category_lvl1`:=CAT.`category_lvl1`, `category_lvl2`:=CAT.`category_lvl2`, `category_lvl3`:=CAT.`category_lvl3`, `category_lvl4`:=CAT.`category_lvl4`, `category_lvl5`:=CAT.`category_lvl5`, `category_lvl6`:=CAT.`category_lvl6`, `category_lvl7`:=CAT.`category_lvl7`, `category_lvl8`:=CAT.`category_lvl8`, `category_lvl9`:=CAT.`category_lvl9`, `category_lvl10`:=CAT.`category_lvl10`, `category_lvl11`:=CAT.`category_lvl11`, `category_lvl12`:=CAT.`category_lvl12`) `pim_category`
FROM PRICES_WITH_PRICE_BOOK PWPB
LEFT OUTER JOIN PIM_CATEGORIES_REPARTITIONED CAT ON ((PWPB.`pimCategoryId` = CAT.`id`))
EMIT CHANGES;
