
CREATE SINK CONNECTOR IF NOT EXISTS ES_ERP_ASSETS_OPENSEARCH_SINK_CONNECTOR WITH (
  'connector.class' = 'com.equipmentshare.kafka.connect.opensearch.OpenSearchSinkConnector',
  'tasks.max' = '3',
  'opensearch.url' = '${env:OPENSEARCH_ENDPOINT}',
  'opensearch.index.name' = 't3_assets',
  'topics' = '_es-erp-ksqldb.ESDB_ASSET_MATERIALIZED_VIEW',
  'key.converter' = 'org.apache.kafka.connect.json.JsonConverter',
  'key.converter.schemas.enable' = 'false',
  'value.converter' = 'org.apache.kafka.connect.json.JsonConverter',
  'value.converter.schemas.enable' = 'false'
);
