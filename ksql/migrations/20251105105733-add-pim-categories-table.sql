-- Migration: add-pim-categories-table
-- Created: 2025-11-05T10:57:33.000Z
-- Test file: 20251105105733-add-pim-categories-table.test.ts

-- Step 1: Create source table from pim_categories topic (AVRO format)
CREATE TABLE IF NOT EXISTS PIM_CATEGORIES_V1 (
  `id` VARCHAR PRIMARY KEY,
  `source` VARCHAR,
  `specversion` VARCHAR,
  `type` VARCHAR,
  `time` VARCHAR,
  `data` STRUCT<
      `name` VARCHAR,
      `path` VARCHAR,
      `description` VARCHAR,
      `has_products` BOOLEAN,
      `platform_id` VARCHAR,
      `tenant` STRUCT<
          `id` VARCHAR
      >,
      `created_by` VARCHAR,
      `createdAt` BIGINT,
      `updatedAt` BIGINT,
      `is_deleted` BOOLEAN
  >
) WITH (
  KAFKA_TOPIC  = 'pim_categories',
  VALUE_FORMAT = 'AVRO',
  KEY_FORMAT   = 'KAFKA',
  PARTITIONS   = 4
);

-- Step 2: Create intermediate table with split category path and JSON format
CREATE TABLE IF NOT EXISTS PIM_CATEGORIES_WITH_SPLIT_PATH_V1 WITH (
  KEY_FORMAT   = 'JSON',
  VALUE_FORMAT = 'JSON'
) AS
SELECT 
  *,
  SPLIT(
    REGEXP_REPLACE(
      REGEXP_REPLACE(`data`->`path`, '^\|', ''), 
      '\|$', 
      ''
    ), 
    '|'
  ) AS `path_parts`
FROM PIM_CATEGORIES_V1;

-- Step 3: Create materialized view with hierarchical category levels
CREATE TABLE IF NOT EXISTS PIM_CATEGORIES_MATERIALIZED_VIEW_V1 AS
SELECT 
  `id`,
  `source`,
  `specversion`,
  `type`,
  `time`,
  `data`,
  `path_parts`[1] AS `category_lvl1`,
  CASE WHEN `path_parts`[2] IS NOT NULL THEN CONCAT_WS('|', `path_parts`[1], `path_parts`[2]) ELSE NULL END AS `category_lvl2`,
  CASE WHEN `path_parts`[3] IS NOT NULL THEN CONCAT_WS('|', `path_parts`[1], `path_parts`[2], `path_parts`[3]) ELSE NULL END AS `category_lvl3`,
  CASE WHEN `path_parts`[4] IS NOT NULL THEN CONCAT_WS('|', `path_parts`[1], `path_parts`[2], `path_parts`[3], `path_parts`[4]) ELSE NULL END AS `category_lvl4`,
  CASE WHEN `path_parts`[5] IS NOT NULL THEN CONCAT_WS('|', `path_parts`[1], `path_parts`[2], `path_parts`[3], `path_parts`[4], `path_parts`[5]) ELSE NULL END AS `category_lvl5`,
  CASE WHEN `path_parts`[6] IS NOT NULL THEN CONCAT_WS('|', `path_parts`[1], `path_parts`[2], `path_parts`[3], `path_parts`[4], `path_parts`[5], `path_parts`[6]) ELSE NULL END AS `category_lvl6`,
  CASE WHEN `path_parts`[7] IS NOT NULL THEN CONCAT_WS('|', `path_parts`[1], `path_parts`[2], `path_parts`[3], `path_parts`[4], `path_parts`[5], `path_parts`[6], `path_parts`[7]) ELSE NULL END AS `category_lvl7`,
  CASE WHEN `path_parts`[8] IS NOT NULL THEN CONCAT_WS('|', `path_parts`[1], `path_parts`[2], `path_parts`[3], `path_parts`[4], `path_parts`[5], `path_parts`[6], `path_parts`[7], `path_parts`[8]) ELSE NULL END AS `category_lvl8`,
  CASE WHEN `path_parts`[9] IS NOT NULL THEN CONCAT_WS('|', `path_parts`[1], `path_parts`[2], `path_parts`[3], `path_parts`[4], `path_parts`[5], `path_parts`[6], `path_parts`[7], `path_parts`[8], `path_parts`[9]) ELSE NULL END AS `category_lvl9`,
  CASE WHEN `path_parts`[10] IS NOT NULL THEN CONCAT_WS('|', `path_parts`[1], `path_parts`[2], `path_parts`[3], `path_parts`[4], `path_parts`[5], `path_parts`[6], `path_parts`[7], `path_parts`[8], `path_parts`[9], `path_parts`[10]) ELSE NULL END AS `category_lvl10`,
  CASE WHEN `path_parts`[11] IS NOT NULL THEN CONCAT_WS('|', `path_parts`[1], `path_parts`[2], `path_parts`[3], `path_parts`[4], `path_parts`[5], `path_parts`[6], `path_parts`[7], `path_parts`[8], `path_parts`[9], `path_parts`[10], `path_parts`[11]) ELSE NULL END AS `category_lvl11`,
  CASE WHEN `path_parts`[12] IS NOT NULL THEN CONCAT_WS('|', `path_parts`[1], `path_parts`[2], `path_parts`[3], `path_parts`[4], `path_parts`[5], `path_parts`[6], `path_parts`[7], `path_parts`[8], `path_parts`[9], `path_parts`[10], `path_parts`[11], `path_parts`[12]) ELSE NULL END AS `category_lvl12`
FROM PIM_CATEGORIES_WITH_SPLIT_PATH_V1;

-- Step 4: Create OpenSearch sink connector with 4 tasks
CREATE SINK CONNECTOR IF NOT EXISTS ES_ERP_PIM_CATEGORIES_OPENSEARCH_SINK_CONNECTOR_V1 WITH (
  'connector.class' = 'com.equipmentshare.kafka.connect.opensearch.OpenSearchSinkConnector',
  'tasks.max' = '4',
  'opensearch.url' = '${env:OPENSEARCH_ENDPOINT}',
  'opensearch.index.name' = 't3_pim_categories',
  'topics' = '_es-erp-ksqldb.PIM_CATEGORIES_MATERIALIZED_VIEW_V1',
  'key.converter' = 'org.apache.kafka.connect.json.JsonConverter',
  'key.converter.schemas.enable' = 'false',
  'value.converter' = 'org.apache.kafka.connect.json.JsonConverter',
  'value.converter.schemas.enable' = 'false'
);
