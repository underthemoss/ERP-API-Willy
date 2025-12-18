-- Migration: add-prices-materialized-view
-- Created: 2025-11-05T17:28:30.000Z
-- Down migration: 20251105172830-add-prices-materialized-view.undo.sql
-- Test file: 20251105172830-add-prices-materialized-view.test.ts
--
-- Create materialized view for prices with joins to price books, PIM categories, and PIM products

-- Step 1: Create price books table from source connector topic
CREATE TABLE IF NOT EXISTS PRICE_BOOKS_TABLE (
  `_id` STRING PRIMARY KEY,
  `workspaceId` STRING,
  `parentPriceBookId` STRING,
  `parentPriceBookPercentageFactor` STRING,
  `name` STRING,
  `notes` STRING,
  `createdBy` STRING,
  `createdAt` STRING,
  `updatedAt` STRING,
  `updatedBy` STRING,
  `businessContactId` STRING,
  `projectId` STRING,
  `location` STRING,
  `deleted` BOOLEAN
) WITH (
  KAFKA_TOPIC = '_es-erp.private.mongo.es-erp.price_books',
  VALUE_FORMAT = 'JSON',
  KEY_FORMAT = 'KAFKA',
  PARTITIONS = 1
);

-- Step 2: Create prices table from source connector topic
CREATE TABLE IF NOT EXISTS PRICES_TABLE (
  `_id` STRING PRIMARY KEY,
  `workspaceId` STRING,
  `parentPriceId` STRING,
  `parentPriceIdPercentageFactor` STRING,
  `name` STRING,
  `createdBy` STRING,
  `createdAt` STRING,
  `updatedAt` STRING,
  `updatedBy` STRING,
  `pimCategoryId` STRING,
  `pimCategoryPath` STRING,
  `pimCategoryName` STRING,
  `pimProductId` STRING,
  `priceType` STRING,
  `priceBookId` STRING,
  `businessContactId` STRING,
  `projectId` STRING,
  `location` STRING,
  -- RENTAL price fields
  `pricePerDayInCents` BIGINT,
  `pricePerWeekInCents` BIGINT,
  `pricePerMonthInCents` BIGINT,
  -- SALE price fields
  `unitCostInCents` BIGINT,
  `discounts` STRING,
  `deleted` BOOLEAN
) WITH (
  KAFKA_TOPIC = '_es-erp.private.mongo.es-erp.prices',
  VALUE_FORMAT = 'JSON',
  KEY_FORMAT = 'KAFKA',
  PARTITIONS = 1
);

-- Step 3: Repartition PIM categories table to 1 partition for join compatibility
CREATE TABLE IF NOT EXISTS PIM_CATEGORIES_REPARTITIONED WITH (
  KAFKA_TOPIC = '_es-erp-ksqldb.PIM_CATEGORIES_REPARTITIONED',
  PARTITIONS = 1
) AS
  SELECT *
  FROM PIM_CATEGORIES_MATERIALIZED_VIEW_V1;

-- Step 4: Repartition PIM products table to 1 partition for join compatibility
CREATE TABLE IF NOT EXISTS PIM_PRODUCTS_REPARTITIONED WITH (
  KAFKA_TOPIC = '_es-erp-ksqldb.PIM_PRODUCTS_REPARTITIONED',
  PARTITIONS = 1
) AS
  SELECT *
  FROM PIM_PRODUCTS_MATERIALIZED_VIEW_V1;

-- Step 5: First join - Prices with Price Books
CREATE TABLE IF NOT EXISTS PRICES_WITH_PRICE_BOOK AS
  SELECT
    p.`_id` AS `_id`,
    p.`workspaceId` AS `workspaceId`,
    p.`parentPriceId` AS `parentPriceId`,
    p.`parentPriceIdPercentageFactor` AS `parentPriceIdPercentageFactor`,
    p.`name` AS `name`,
    p.`createdBy` AS `createdBy`,
    p.`createdAt` AS `createdAt`,
    p.`updatedAt` AS `updatedAt`,
    p.`updatedBy` AS `updatedBy`,
    p.`pimCategoryId` AS `pimCategoryId`,
    p.`pimCategoryPath` AS `pimCategoryPath`,
    p.`pimCategoryName` AS `pimCategoryName`,
    p.`pimProductId` AS `pimProductId`,
    p.`priceType` AS `priceType`,
    p.`priceBookId` AS `priceBookId`,
    p.`businessContactId` AS `businessContactId`,
    p.`projectId` AS `projectId`,
    p.`location` AS `location`,
    p.`pricePerDayInCents` AS `pricePerDayInCents`,
    p.`pricePerWeekInCents` AS `pricePerWeekInCents`,
    p.`pricePerMonthInCents` AS `pricePerMonthInCents`,
    p.`unitCostInCents` AS `unitCostInCents`,
    p.`discounts` AS `discounts`,
    -- Price book struct
    STRUCT(
      `id` := pb.`_id`,
      `workspace_id` := pb.`workspaceId`,
      `parent_price_book_id` := pb.`parentPriceBookId`,
      `parent_price_book_percentage_factor` := pb.`parentPriceBookPercentageFactor`,
      `name` := pb.`name`,
      `notes` := pb.`notes`,
      `created_by` := pb.`createdBy`,
      `created_at` := pb.`createdAt`,
      `updated_at` := pb.`updatedAt`,
      `updated_by` := pb.`updatedBy`,
      `business_contact_id` := pb.`businessContactId`,
      `project_id` := pb.`projectId`,
      `location` := pb.`location`
    ) AS `price_book`
  FROM PRICES_TABLE p
  LEFT JOIN PRICE_BOOKS_TABLE pb ON p.`priceBookId` = pb.`_id`
  WHERE p.`deleted` IS NULL OR p.`deleted` = false;

-- Step 6: Second join - Add PIM Category
CREATE TABLE IF NOT EXISTS PRICES_WITH_CATEGORY AS
  SELECT
    pwpb.`_id` AS `_id`,
    pwpb.`workspaceId` AS `workspaceId`,
    pwpb.`parentPriceId` AS `parentPriceId`,
    pwpb.`parentPriceIdPercentageFactor` AS `parentPriceIdPercentageFactor`,
    pwpb.`name` AS `name`,
    pwpb.`createdBy` AS `createdBy`,
    pwpb.`createdAt` AS `createdAt`,
    pwpb.`updatedAt` AS `updatedAt`,
    pwpb.`updatedBy` AS `updatedBy`,
    pwpb.`pimCategoryId` AS `pimCategoryId`,
    pwpb.`pimCategoryPath` AS `pimCategoryPath`,
    pwpb.`pimCategoryName` AS `pimCategoryName`,
    pwpb.`pimProductId` AS `pimProductId`,
    pwpb.`priceType` AS `priceType`,
    pwpb.`priceBookId` AS `priceBookId`,
    pwpb.`businessContactId` AS `businessContactId`,
    pwpb.`projectId` AS `projectId`,
    pwpb.`location` AS `location`,
    pwpb.`pricePerDayInCents` AS `pricePerDayInCents`,
    pwpb.`pricePerWeekInCents` AS `pricePerWeekInCents`,
    pwpb.`pricePerMonthInCents` AS `pricePerMonthInCents`,
    pwpb.`unitCostInCents` AS `unitCostInCents`,
    pwpb.`discounts` AS `discounts`,
    pwpb.`price_book` AS `price_book`,
    -- PIM category struct
    STRUCT(
      `id` := cat.`id`,
      `source` := cat.`source`,
      `specversion` := cat.`specversion`,
      `type` := cat.`type`,
      `time` := cat.`time`,
      `data` := cat.`data`,
      `category_lvl1` := cat.`category_lvl1`,
      `category_lvl2` := cat.`category_lvl2`,
      `category_lvl3` := cat.`category_lvl3`,
      `category_lvl4` := cat.`category_lvl4`,
      `category_lvl5` := cat.`category_lvl5`,
      `category_lvl6` := cat.`category_lvl6`,
      `category_lvl7` := cat.`category_lvl7`,
      `category_lvl8` := cat.`category_lvl8`,
      `category_lvl9` := cat.`category_lvl9`,
      `category_lvl10` := cat.`category_lvl10`,
      `category_lvl11` := cat.`category_lvl11`,
      `category_lvl12` := cat.`category_lvl12`
    ) AS `pim_category`
  FROM PRICES_WITH_PRICE_BOOK pwpb
  LEFT JOIN PIM_CATEGORIES_REPARTITIONED cat ON pwpb.`pimCategoryId` = cat.`id`;

-- Step 8: Create OpenSearch sink connector for prices materialized view
CREATE SINK CONNECTOR IF NOT EXISTS ES_ERP_PRICES_OPENSEARCH_SINK_CONNECTOR WITH (
  'connector.class' = 'com.equipmentshare.kafka.connect.opensearch.OpenSearchSinkConnector',
  'tasks.max' = '4',
  'opensearch.url' = '${env:OPENSEARCH_ENDPOINT}',
  'opensearch.index.name' = 'es_erp_prices',
  'topics' = '_es-erp-ksqldb.PRICES_WITH_CATEGORY',
  'key.converter' = 'org.apache.kafka.connect.storage.StringConverter',
  'key.converter.schemas.enable' = 'false',
  'value.converter' = 'org.apache.kafka.connect.json.JsonConverter',
  'value.converter.schemas.enable' = 'false'
);
