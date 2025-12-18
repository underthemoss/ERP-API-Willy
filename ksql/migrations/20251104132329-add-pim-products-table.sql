-- Migration: add-pim-products-table
-- Created: 2025-11-04T13:23:29.000Z
-- Test file: 20251104132329-add-pim-products-table.test.ts

-- Step 1: Create source table from pim_products topic (AVRO format)
CREATE TABLE IF NOT EXISTS PIM_PRODUCTS_V1 (
  `id` VARCHAR PRIMARY KEY,
  `source` VARCHAR,
  `specversion` VARCHAR,
  `type` VARCHAR,
  `time` VARCHAR,
  `data` STRUCT<
      `platform_id` VARCHAR,
      `tenant` STRUCT<
          `id` VARCHAR
      >,
      `product_category` STRUCT<
          `id` VARCHAR,
          `category_platform_id` VARCHAR,
          `name` VARCHAR,
          `path` VARCHAR
      >,
      `product_core_attributes` STRUCT<
          `name` VARCHAR,
          `make` VARCHAR,
          `make_platform_id` VARCHAR,
          `model` VARCHAR,
          `year` VARCHAR,
          `variant` VARCHAR
      >,
      `product_source_attributes` STRUCT<
          `manufacturer_part_number` VARCHAR,
          `sku` VARCHAR,
          `source` VARCHAR,
          `upc` VARCHAR
      >,
      `created_by` VARCHAR,
      `createdAt` BIGINT,
      `updatedAt` BIGINT,
      `is_deleted` BOOLEAN,
      `last_published_date` VARCHAR,
      `product_attribute_groups` ARRAY<STRUCT<
          `name` VARCHAR,
          `attributes` ARRAY<STRUCT<
              `name` VARCHAR,
              `value` VARCHAR,
              `description` VARCHAR,
              `unit_of_measure` STRUCT<
                  `type` VARCHAR,
                  `name` VARCHAR,
                  `abbreviation` VARCHAR,
                  `classification` VARCHAR,
                  `validator_regex` VARCHAR,
                  `validation_message` VARCHAR,
                  `normalized_unit_name` VARCHAR,
                  `normalized_unit_abbreviation` VARCHAR,
                  `normalized_value` VARCHAR,
                  `id` VARCHAR
              >
          >>
      >>,
      `product_category_core_attributes` ARRAY<STRUCT<
          `name` VARCHAR,
          `value` VARCHAR,
          `description` VARCHAR,
          `unit_of_measure` STRUCT<
              `type` VARCHAR,
              `name` VARCHAR,
              `abbreviation` VARCHAR,
              `classification` VARCHAR,
              `validator_regex` VARCHAR,
              `validation_message` VARCHAR,
              `normalized_unit_name` VARCHAR,
              `normalized_unit_abbreviation` VARCHAR,
              `normalized_value` VARCHAR,
              `id` VARCHAR
          >
      >>,
      `product_shipping_dimensions_attributes` ARRAY<STRUCT<
          `name` VARCHAR,
          `value` VARCHAR,
          `description` VARCHAR,
          `unit_of_measure` STRUCT<
              `type` VARCHAR,
              `name` VARCHAR,
              `abbreviation` VARCHAR,
              `classification` VARCHAR,
              `validator_regex` VARCHAR,
              `validation_message` VARCHAR,
              `normalized_unit_name` VARCHAR,
              `normalized_unit_abbreviation` VARCHAR,
              `normalized_value` VARCHAR,
              `id` VARCHAR
          >
      >>,
      `product_options` ARRAY<STRUCT<
          `name` VARCHAR,
          `options` ARRAY<STRUCT<
              `name` VARCHAR,
              `value` VARCHAR,
              `is_choices` BOOLEAN,
              `choices` ARRAY<STRUCT<
                  `name` VARCHAR,
                  `value` VARCHAR,
                  `attributes` ARRAY<STRUCT<
                      `name` VARCHAR,
                      `value` VARCHAR,
                      `description` VARCHAR,
                      `unit_of_measure` STRUCT<
                          `type` VARCHAR,
                          `name` VARCHAR,
                          `abbreviation` VARCHAR,
                          `classification` VARCHAR,
                          `validator_regex` VARCHAR,
                          `validation_message` VARCHAR,
                          `normalized_unit_name` VARCHAR,
                          `normalized_unit_abbreviation` VARCHAR,
                          `normalized_value` VARCHAR,
                          `id` VARCHAR
                      >
                  >>
              >>,
              `attributes` ARRAY<STRUCT<
                  `name` VARCHAR,
                  `value` VARCHAR,
                  `description` VARCHAR,
                  `unit_of_measure` STRUCT<
                      `type` VARCHAR,
                      `name` VARCHAR,
                      `abbreviation` VARCHAR,
                      `classification` VARCHAR,
                      `validator_regex` VARCHAR,
                      `validation_message` VARCHAR,
                      `normalized_unit_name` VARCHAR,
                      `normalized_unit_abbreviation` VARCHAR,
                      `normalized_value` VARCHAR,
                      `id` VARCHAR
                  >
              >>
          >>
      >>,
      `associations` ARRAY<STRUCT<
          `platform_id` VARCHAR,
          `type` VARCHAR,
          `name` VARCHAR,
          `make` VARCHAR,
          `make_platform_id` VARCHAR,
          `model` VARCHAR,
          `variant` VARCHAR,
          `manufacturer_part_number` VARCHAR,
          `year` VARCHAR,
          `upc` VARCHAR,
          `sku` VARCHAR
      >>
  >
) WITH (
  KAFKA_TOPIC  = 'pim_products',
  VALUE_FORMAT = 'AVRO',
  KEY_FORMAT   = 'KAFKA',
  PARTITIONS   = 4
);

-- Step 2: Create intermediate table with split category path and JSON format
CREATE TABLE IF NOT EXISTS PIM_PRODUCTS_WITH_SPLIT_CAT_PATH_V1 WITH (
  KEY_FORMAT   = 'JSON',
  VALUE_FORMAT = 'JSON'
) AS
SELECT 
  *,
  SPLIT(
    REGEXP_REPLACE(
      REGEXP_REPLACE(`data`->`product_category`->`path`, '^\|', ''), 
      '\|$', 
      ''
    ), 
    '|'
  ) AS `path_parts`
FROM PIM_PRODUCTS_V1;

-- Step 3: Create materialized view with hierarchical category levels
CREATE TABLE IF NOT EXISTS PIM_PRODUCTS_MATERIALIZED_VIEW_V1 AS
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
FROM PIM_PRODUCTS_WITH_SPLIT_CAT_PATH_V1;

-- Step 4: Create OpenSearch sink connector with 4 tasks
CREATE SINK CONNECTOR IF NOT EXISTS ES_ERP_PIM_PRODUCTS_OPENSEARCH_SINK_CONNECTOR_V1 WITH (
  'connector.class' = 'com.equipmentshare.kafka.connect.opensearch.OpenSearchSinkConnector',
  'tasks.max' = '4',
  'opensearch.url' = '${env:OPENSEARCH_ENDPOINT}',
  'opensearch.index.name' = 't3_pim_products',
  'topics' = '_es-erp-ksqldb.PIM_PRODUCTS_MATERIALIZED_VIEW_V1',
  'key.converter' = 'org.apache.kafka.connect.json.JsonConverter',
  'key.converter.schemas.enable' = 'false',
  'value.converter' = 'org.apache.kafka.connect.json.JsonConverter',
  'value.converter.schemas.enable' = 'false'
);
