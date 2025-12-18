-- Migration: add-order-materialized-view
-- Created: 2025-10-21T15:27:37.000Z
-- Down migration: 20251021152737-add-order-materialized-view.undo.sql
-- Test file: 20251021152737-add-order-materialized-view.test.ts

-- Aggregate rentals by order_id
-- This groups all rentals for each order into an array
CREATE TABLE ESDB_ORDER_WITH_RENTALS AS
SELECT
    `order`->`order_id` AS `order_id`,
    COLLECT_LIST(
        STRUCT(
            `details` := `details`,
            `asset` := `asset`,
            `status` := `status`
        )
    ) AS `rentals`
FROM ESDB_RENTAL_MATERIALIZED_VIEW
GROUP BY `order`->`order_id`;

-- Final materialized view: Orders with their rentals array
-- Each order includes:
-- - Order details (status, company, user info, dates)
-- - Rentals array (each rental includes details, asset, and status)
-- Note: AS_VALUE handles NULL from LEFT JOIN, returning empty array when no rentals exist
CREATE TABLE ESDB_ORDER_MATERIALIZED_VIEW AS
SELECT
    o.`order_id` AS `order_id`,
    STRUCT(
        `order_id` := o.`order_id`,
        `order_status_id` := o.`order_status_id`,
        `order_status_name` := o.`order_status_name`,
        `company_id` := o.`company_id`,
        `company_name` := o.`company_name`,
        `user_id` := o.`user_id`,
        `user_first_name` := o.`user_first_name`,
        `user_last_name` := o.`user_last_name`,
        `user_email` := o.`user_email`,
        `date_created` := o.`date_created`,
        `date_updated` := o.`date_updated`
    ) AS `details`,
    AS_VALUE(r.`rentals`) AS `rentals`
FROM ESDB_ORDER_ENRICHED o
LEFT JOIN ESDB_ORDER_WITH_RENTALS r
    ON o.`order_id` = r.`order_id`;
