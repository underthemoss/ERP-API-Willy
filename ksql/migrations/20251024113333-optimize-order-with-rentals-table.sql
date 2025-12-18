-- Migration: Optimize ESDB_ORDER_WITH_RENTALS to reduce message size
-- 
-- Problem: The current table collects full ESDB_RENTAL_MATERIALIZED_VIEW records
-- which include 40+ rental fields and complete nested asset structures (groups,
-- tsp_companies, tracker, branches, etc.). This causes aggregated messages to
-- exceed the 1MB Kafka message size limit.
--
-- Solution: Flatten and include only the fields actually used by the GraphQL API:
-- - 7 rental detail fields (instead of 40+)
-- - 5 asset fields (instead of 15+ nested fields)
-- - 2 status fields
-- - Remove: asset groups, tsp_companies, tracker, keypad, all branches
--
-- Size impact: ~50KB per rental -> ~500 bytes per rental (100x reduction)

-- Step 1: Drop dependent table first (ESDB_ORDER_MATERIALIZED_VIEW depends on ESDB_ORDER_WITH_RENTALS)
DROP TABLE IF EXISTS ESDB_ORDER_MATERIALIZED_VIEW DELETE TOPIC;

-- Step 2: Drop the existing oversized table
DROP TABLE IF EXISTS ESDB_ORDER_WITH_RENTALS DELETE TOPIC;

-- Step 3: Recreate ESDB_ORDER_WITH_RENTALS with optimized structure

CREATE TABLE ESDB_ORDER_WITH_RENTALS AS SELECT
  ESDB_RENTAL_MATERIALIZED_VIEW.`order`->`order_id` `order_id`,
  COLLECT_LIST(
    STRUCT(
      -- Rental details (only fields used by GraphQL API)
      `rental_id` := ESDB_RENTAL_MATERIALIZED_VIEW.`details`->`rental_id`,
      `borrower_user_id` := ESDB_RENTAL_MATERIALIZED_VIEW.`details`->`borrower_user_id`,
      `rental_status_id` := ESDB_RENTAL_MATERIALIZED_VIEW.`details`->`rental_status_id`,
      `start_date` := ESDB_RENTAL_MATERIALIZED_VIEW.`details`->`start_date`,
      `end_date` := ESDB_RENTAL_MATERIALIZED_VIEW.`details`->`end_date`,
      `price` := ESDB_RENTAL_MATERIALIZED_VIEW.`details`->`price`,
      `order_id` := ESDB_RENTAL_MATERIALIZED_VIEW.`details`->`order_id`,
      
      -- Asset (minimal - only fields used by GraphQL API)
      `asset_id` := ESDB_RENTAL_MATERIALIZED_VIEW.`asset`->`asset_id`,
      `asset_name` := ESDB_RENTAL_MATERIALIZED_VIEW.`asset`->`details`->`name`,
      `asset_description` := ESDB_RENTAL_MATERIALIZED_VIEW.`asset`->`details`->`description`,
      `asset_company_id` := ESDB_RENTAL_MATERIALIZED_VIEW.`asset`->`company`->`id`,
      `asset_company_name` := ESDB_RENTAL_MATERIALIZED_VIEW.`asset`->`company`->`name`,
      
      -- Status
      `status_id` := ESDB_RENTAL_MATERIALIZED_VIEW.`status`->`id`,
      `status_name` := ESDB_RENTAL_MATERIALIZED_VIEW.`status`->`name`
    )
  ) `rentals`
FROM ESDB_RENTAL_MATERIALIZED_VIEW ESDB_RENTAL_MATERIALIZED_VIEW
GROUP BY ESDB_RENTAL_MATERIALIZED_VIEW.`order`->`order_id`
EMIT CHANGES;

-- Step 4: Recreate ESDB_ORDER_MATERIALIZED_VIEW (dependent table)
CREATE TABLE ESDB_ORDER_MATERIALIZED_VIEW AS SELECT
  O.`order_id` `order_id`,
  STRUCT(
    `order_id`:=O.`order_id`,
    `order_status_id`:=O.`order_status_id`,
    `order_status_name`:=O.`order_status_name`,
    `company_id`:=O.`company_id`,
    `company_name`:=O.`company_name`,
    `user_id`:=O.`user_id`,
    `user_first_name`:=O.`user_first_name`,
    `user_last_name`:=O.`user_last_name`,
    `user_email`:=O.`user_email`,
    `date_created`:=O.`date_created`,
    `date_updated`:=O.`date_updated`
  ) `details`,
  AS_VALUE(R.`rentals`) `rentals`
FROM ESDB_ORDER_ENRICHED O
LEFT OUTER JOIN ESDB_ORDER_WITH_RENTALS R ON ((O.`order_id` = R.`order_id`))
EMIT CHANGES;
