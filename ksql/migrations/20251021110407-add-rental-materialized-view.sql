-- Migration: add-rental-materialized-view
-- Created: 2025-10-21T11:04:07.000Z
-- Down migration: 20251021110407-add-rental-materialized-view.undo.sql
-- Test file: 20251021110407-add-rental-materialized-view.test.ts

-- SOURCE TABLES (from Kafka connectors)

CREATE TABLE ESDB_PUBLIC_RENTALS (
    `rental_id` STRING PRIMARY KEY,
    `borrower_user_id` STRING,
    `rental_status_id` STRING,
    `date_created` STRING,
    `start_date` STRING,
    `end_date` STRING,
    `amount_received` STRING,
    `price` STRING,
    `delivery_charge` STRING,
    `return_charge` STRING,
    `delivery_required` STRING,
    `delivery_instructions` STRING,
    `order_id` STRING,
    `drop_off_delivery_id` STRING,
    `return_delivery_id` STRING,
    `price_per_day` STRING,
    `price_per_week` STRING,
    `price_per_month` STRING,
    `start_date_estimated` STRING,
    `end_date_estimated` STRING,
    `job_description` STRING,
    `equipment_class_id` STRING,
    `price_per_hour` STRING,
    `deleted` STRING,
    `rental_protection_plan_id` STRING,
    `taxable` STRING,
    `asset_id` STRING,
    `drop_off_delivery_required` STRING,
    `return_delivery_required` STRING,
    `lien_notice_sent` STRING,
    `off_rent_date_requested` STRING,
    `external_id` STRING,
    `rental_type_id` STRING,
    `part_type_id` STRING,
    `quantity` STRING,
    `purchase_price` STRING,
    `rental_purchase_option_id` STRING,
    `rate_type_id` STRING,
    `has_re_rent` STRING,
    `is_below_floor_rate` STRING,
    `is_flat_monthly_rate` STRING,
    `is_flexible_rate` STRING,
    `inventory_product_id` STRING,
    `inventory_product_name` STRING,
    `inventory_product_name_historical` STRING,
    `one_time_charge` STRING,
    `rental_pricing_structure_id` STRING
) WITH (
    KAFKA_TOPIC='fleet-source-connector-2.public.rentals',
    KEY_FORMAT='JSON',
    VALUE_FORMAT='JSON',
    PARTITIONS=1
);

CREATE TABLE ESDB_PUBLIC_RENTAL_STATUSES (
    `rental_status_id` STRING PRIMARY KEY,
    `name` STRING
) WITH (
    KAFKA_TOPIC='fleet-source-connector-2.public.rental_statuses',
    KEY_FORMAT='JSON',
    VALUE_FORMAT='JSON',
    PARTITIONS=1
);

CREATE TABLE ESDB_PUBLIC_ORDERS (
    `order_id` STRING PRIMARY KEY,
    `order_status_id` STRING,
    `company_id` STRING,
    `user_id` STRING,
    `date_created` STRING,
    `date_updated` STRING
) WITH (
    KAFKA_TOPIC='fleet-source-connector-2.public.orders',
    KEY_FORMAT='JSON',
    VALUE_FORMAT='JSON',
    PARTITIONS=1
);

CREATE TABLE ESDB_PUBLIC_ORDER_STATUSES (
    `order_status_id` STRING PRIMARY KEY,
    `name` STRING
) WITH (
    KAFKA_TOPIC='fleet-source-connector-2.public.order_statuses',
    KEY_FORMAT='JSON',
    VALUE_FORMAT='JSON',
    PARTITIONS=1
);

CREATE TABLE ESDB_PUBLIC_USERS (
    `user_id` STRING PRIMARY KEY,
    `first_name` STRING,
    `last_name` STRING,
    `email_address` STRING,
    `username` STRING
) WITH (
    KAFKA_TOPIC='fleet-source-connector-2.public.users',
    KEY_FORMAT='JSON',
    VALUE_FORMAT='JSON',
    PARTITIONS=1
);

-- Note: ESDB_PUBLIC_COMPANIES is already created in the assets migration

-- RELATIONSHIP TABLES (rekeyed by rental_id)

CREATE TABLE ESDB_RENTAL_ASSET AS
SELECT
    r.`rental_id` as `rental_id`,
    STRUCT(
        `asset_id` := a.`asset_id`,
        `details` := a.`details`,
        `photo` := a.`photo`,
        `company` := a.`company`,
        `type` := a.`type`,
        `make` := a.`make`,
        `model` := a.`model`,
        `class` := a.`class`,
        `inventory_branch` := a.`inventory_branch`,
        `msp_branch` := a.`msp_branch`,
        `rsp_branch` := a.`rsp_branch`,
        `groups` := a.`groups`,
        `tsp_companies` := a.`tsp_companies`,
        `tracker` := a.`tracker`,
        `keypad` := a.`keypad`
    ) AS `asset`
FROM
    ESDB_PUBLIC_RENTALS r
    LEFT JOIN ESDB_ASSET_MATERIALIZED_VIEW a 
    ON COALESCE(r.`asset_id`, ' ') = a.`asset_id`;

CREATE TABLE ESDB_RENTAL_STATUS AS
SELECT
    r.`rental_id` as `rental_id`,
    STRUCT(
        `id` := s.`rental_status_id`,
        `name` := s.`name`
    ) AS `status`
FROM
    ESDB_PUBLIC_RENTALS r
    LEFT JOIN ESDB_PUBLIC_RENTAL_STATUSES s 
    ON COALESCE(r.`rental_status_id`, ' ') = s.`rental_status_id`;

-- Build up order enrichment step-by-step (ksqlDB doesn't support n-way table joins)
CREATE TABLE ESDB_ORDER_WITH_STATUS AS
SELECT
    o.`order_id` as `order_id`,
    o.`order_status_id` as `order_status_id`,
    os.`name` as `order_status_name`,
    o.`company_id` as `company_id`,
    o.`user_id` as `user_id`,
    o.`date_created` as `date_created`,
    o.`date_updated` as `date_updated`
FROM
    ESDB_PUBLIC_ORDERS o
    LEFT JOIN ESDB_PUBLIC_ORDER_STATUSES os 
    ON COALESCE(o.`order_status_id`, ' ') = os.`order_status_id`;

CREATE TABLE ESDB_ORDER_WITH_COMPANY AS
SELECT
    ows.`order_id` as `order_id`,
    ows.`order_status_id` as `order_status_id`,
    ows.`order_status_name` as `order_status_name`,
    ows.`company_id` as `company_id`,
    c.`name` as `company_name`,
    ows.`user_id` as `user_id`,
    ows.`date_created` as `date_created`,
    ows.`date_updated` as `date_updated`
FROM
    ESDB_ORDER_WITH_STATUS ows
    LEFT JOIN ESDB_PUBLIC_COMPANIES c 
    ON COALESCE(ows.`company_id`, ' ') = c.`company_id`;

CREATE TABLE ESDB_ORDER_ENRICHED AS
SELECT
    owc.`order_id` as `order_id`,
    owc.`order_status_id` as `order_status_id`,
    owc.`order_status_name` as `order_status_name`,
    owc.`company_id` as `company_id`,
    owc.`company_name` as `company_name`,
    owc.`user_id` as `user_id`,
    u.`first_name` as `user_first_name`,
    u.`last_name` as `user_last_name`,
    u.`email_address` as `user_email`,
    owc.`date_created` as `date_created`,
    owc.`date_updated` as `date_updated`
FROM
    ESDB_ORDER_WITH_COMPANY owc
    LEFT JOIN ESDB_PUBLIC_USERS u 
    ON COALESCE(owc.`user_id`, ' ') = u.`user_id`;

CREATE TABLE ESDB_RENTAL_ORDER AS
SELECT
    r.`rental_id` as `rental_id`,
    STRUCT(
        `order_id` := oe.`order_id`,
        `order_status_id` := oe.`order_status_id`,
        `order_status_name` := oe.`order_status_name`,
        `company_id` := oe.`company_id`,
        `company_name` := oe.`company_name`,
        `ordered_by_user_id` := oe.`user_id`,
        `ordered_by_first_name` := oe.`user_first_name`,
        `ordered_by_last_name` := oe.`user_last_name`,
        `ordered_by_email` := oe.`user_email`,
        `date_created` := oe.`date_created`,
        `date_updated` := oe.`date_updated`
    ) AS `order`
FROM
    ESDB_PUBLIC_RENTALS r
    LEFT JOIN ESDB_ORDER_ENRICHED oe 
    ON COALESCE(r.`order_id`, ' ') = oe.`order_id`;

-- FINAL MATERIALIZED VIEW

CREATE TABLE ESDB_RENTAL_MATERIALIZED_VIEW AS
SELECT
    r.`rental_id` as `rental_id`,
    STRUCT(
        `rental_id` := r.`rental_id`,
        `borrower_user_id` := r.`borrower_user_id`,
        `rental_status_id` := r.`rental_status_id`,
        `date_created` := r.`date_created`,
        `start_date` := r.`start_date`,
        `end_date` := r.`end_date`,
        `amount_received` := r.`amount_received`,
        `price` := r.`price`,
        `delivery_charge` := r.`delivery_charge`,
        `return_charge` := r.`return_charge`,
        `delivery_required` := r.`delivery_required`,
        `delivery_instructions` := r.`delivery_instructions`,
        `order_id` := r.`order_id`,
        `drop_off_delivery_id` := r.`drop_off_delivery_id`,
        `return_delivery_id` := r.`return_delivery_id`,
        `price_per_day` := r.`price_per_day`,
        `price_per_week` := r.`price_per_week`,
        `price_per_month` := r.`price_per_month`,
        `start_date_estimated` := r.`start_date_estimated`,
        `end_date_estimated` := r.`end_date_estimated`,
        `job_description` := r.`job_description`,
        `equipment_class_id` := r.`equipment_class_id`,
        `price_per_hour` := r.`price_per_hour`,
        `deleted` := r.`deleted`,
        `rental_protection_plan_id` := r.`rental_protection_plan_id`,
        `taxable` := r.`taxable`,
        `asset_id` := r.`asset_id`,
        `drop_off_delivery_required` := r.`drop_off_delivery_required`,
        `return_delivery_required` := r.`return_delivery_required`,
        `lien_notice_sent` := r.`lien_notice_sent`,
        `off_rent_date_requested` := r.`off_rent_date_requested`,
        `external_id` := r.`external_id`,
        `rental_type_id` := r.`rental_type_id`,
        `part_type_id` := r.`part_type_id`,
        `quantity` := r.`quantity`,
        `purchase_price` := r.`purchase_price`,
        `rental_purchase_option_id` := r.`rental_purchase_option_id`,
        `rate_type_id` := r.`rate_type_id`,
        `has_re_rent` := r.`has_re_rent`,
        `is_below_floor_rate` := r.`is_below_floor_rate`,
        `is_flat_monthly_rate` := r.`is_flat_monthly_rate`,
        `is_flexible_rate` := r.`is_flexible_rate`,
        `inventory_product_id` := r.`inventory_product_id`,
        `inventory_product_name` := r.`inventory_product_name`,
        `inventory_product_name_historical` := r.`inventory_product_name_historical`,
        `one_time_charge` := r.`one_time_charge`,
        `rental_pricing_structure_id` := r.`rental_pricing_structure_id`
    ) AS `details`,
    asset.`asset` as `asset`,
    status.`status` as `status`,
    orders.`order` as `order`
FROM
    ESDB_PUBLIC_RENTALS r
    LEFT JOIN ESDB_RENTAL_ASSET asset ON r.`rental_id` = asset.`rental_id`
    LEFT JOIN ESDB_RENTAL_STATUS status ON r.`rental_id` = status.`rental_id`
    LEFT JOIN ESDB_RENTAL_ORDER orders ON r.`rental_id` = orders.`rental_id`
WHERE
    r.`deleted` = 'false';
