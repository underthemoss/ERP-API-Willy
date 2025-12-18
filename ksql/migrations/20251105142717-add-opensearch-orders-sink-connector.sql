CREATE SINK CONNECTOR IF NOT EXISTS ES_ERP_ORDERS_OPENSEARCH_SINK_CONNECTOR WITH (
  'connector.class' = 'com.equipmentshare.kafka.connect.opensearch.OpenSearchSinkConnector',
  'tasks.max' = '1',
  'opensearch.url' = '${env:OPENSEARCH_ENDPOINT}',
  'opensearch.index.name' = 't3_orders',
  'topics' = '_es-erp-ksqldb.ESDB_ORDER_MATERIALIZED_VIEW',
  'key.converter' = 'org.apache.kafka.connect.json.JsonConverter',
  'key.converter.schemas.enable' = 'false',
  'value.converter' = 'org.apache.kafka.connect.json.JsonConverter',
  'value.converter.schemas.enable' = 'false'
);

CREATE SINK CONNECTOR IF NOT EXISTS ES_ERP_RENTALS_OPENSEARCH_SINK_CONNECTOR WITH (
  'connector.class' = 'com.equipmentshare.kafka.connect.opensearch.OpenSearchSinkConnector',
  'tasks.max' = '1',
  'opensearch.url' = '${env:OPENSEARCH_ENDPOINT}',
  'opensearch.index.name' = 't3_rentals',
  'topics' = '_es-erp-ksqldb.ESDB_RENTAL_MATERIALIZED_VIEW',
  'key.converter' = 'org.apache.kafka.connect.json.JsonConverter',
  'key.converter.schemas.enable' = 'false',
  'value.converter' = 'org.apache.kafka.connect.json.JsonConverter',
  'value.converter.schemas.enable' = 'false'
);
