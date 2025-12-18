-- Migration: add-esdb-assets
-- Creates all tables and views for ESDB Assets materialized view
-- This consolidates all asset-related tables in dependency order

-- SOURCE TABLES (from Kafka connectors)

CREATE TABLE ESDB_PUBLIC_ASSET_TYPES (
    `asset_type_id` STRING PRIMARY KEY,
    `name` STRING
) WITH (
    KAFKA_TOPIC='fleet-source-connector-2.public.asset_types',
    KEY_FORMAT='JSON',
    VALUE_FORMAT='JSON',
    PARTITIONS=1
);

CREATE TABLE ESDB_PUBLIC_KEYPADS (
    `keypad_id` STRING PRIMARY KEY,
    `asset_id` STRING
) WITH (
    KAFKA_TOPIC='fleet-source-connector-2.public.keypads',
    KEY_FORMAT='JSON',
    VALUE_FORMAT='JSON',
    PARTITIONS=1
);

CREATE TABLE ESDB_PUBLIC_EQUIPMENT_MODELS (
    `equipment_model_id` STRING PRIMARY KEY,
    `name` STRING
) WITH (
    KAFKA_TOPIC='fleet-source-connector-2.public.equipment_models',
    KEY_FORMAT='JSON',
    VALUE_FORMAT='JSON',
    PARTITIONS=1
);

CREATE TABLE ESDB_PUBLIC_EQUIPMENT_MAKES (
    `equipment_make_id` STRING PRIMARY KEY,
    `name` STRING
) WITH (
    KAFKA_TOPIC='fleet-source-connector-2.public.equipment_makes',
    KEY_FORMAT='JSON',
    VALUE_FORMAT='JSON',
    PARTITIONS=1
);

CREATE TABLE ESDB_PUBLIC_COMPANIES (
    `company_id` STRING PRIMARY KEY,
    `name` STRING
) WITH (
    KAFKA_TOPIC='fleet-source-connector-2.public.companies',
    KEY_FORMAT='JSON',
    VALUE_FORMAT='JSON',
    PARTITIONS=1
);

CREATE TABLE ESDB_PUBLIC_EQUIPMENT_CLASSES (
    `equipment_class_id` STRING PRIMARY KEY,
    `name` STRING,
    `description` STRING
) WITH (
    KAFKA_TOPIC='fleet-source-connector-2.public.equipment_classes',
    KEY_FORMAT='JSON',
    VALUE_FORMAT='JSON',
    PARTITIONS=1
);

CREATE TABLE ESDB_PUBLIC_MARKETS (
    `market_id` STRING PRIMARY KEY,
    `name` STRING,
    `description` STRING,
    `company_id` STRING
) WITH (
    KAFKA_TOPIC='fleet-source-connector-2.public.markets',
    KEY_FORMAT='JSON',
    VALUE_FORMAT='JSON',
    PARTITIONS=1
);

CREATE TABLE ESDB_PUBLIC_ORGANIZATIONS (
    `organization_id` STRING PRIMARY KEY,
    `name` STRING,
    `company_id` STRING
) WITH (
    KAFKA_TOPIC='fleet-source-connector-2.public.organizations',
    KEY_FORMAT='JSON',
    VALUE_FORMAT='JSON',
    PARTITIONS=1
);

CREATE TABLE ESDB_PUBLIC_ORGANIZATION_ASSET_XREF (
    `organization_asset_xref_id` STRING PRIMARY KEY,
    `organization_id` STRING,
    `asset_id` STRING
) WITH (
    KAFKA_TOPIC='fleet-source-connector-2.public.organization_asset_xref',
    KEY_FORMAT='JSON',
    VALUE_FORMAT='JSON',
    PARTITIONS=1
);

CREATE TABLE ESDB_PUBLIC_TELEMATICS_SERVICE_PROVIDERS_ASSETS (
    `telematics_service_providers_asset_id` STRING PRIMARY KEY,
    `asset_id` STRING,
    `company_id` STRING
) WITH (
    KAFKA_TOPIC='fleet-source-connector-2.public.telematics_service_providers_assets',
    KEY_FORMAT='JSON',
    VALUE_FORMAT='JSON',
    PARTITIONS=1
);

CREATE TABLE ESDB_PUBLIC_ASSETS (
    `asset_id` STRING PRIMARY KEY,
    `asset_type_id` STRING,
    `name` STRING,
    `description` STRING,
    `custom_name` STRING,
    `model` STRING,
    `year` STRING,
    `company_id` STRING,
    `tracker_id` STRING,
    `vin` STRING,
    `driver_name` STRING,
    `serial_number` STRING,
    `equipment_make_id` STRING,
    `equipment_model_id` STRING,
    `service_branch_id` STRING,
    `inventory_branch_id` STRING,
    `rental_branch_id` STRING,
    `equipment_class_id` STRING,
    `camera_id` STRING,
    `photo_id` STRING
) WITH (
    KAFKA_TOPIC='fleet-source-connector-2.public.assets',
    KEY_FORMAT='JSON',
    VALUE_FORMAT='JSON',
    PARTITIONS=1
);

CREATE TABLE ESDB_PUBLIC_TRACKERS (
    `tracker_id` STRING PRIMARY KEY,
    `device_serial` STRING,
    `company_id` STRING,
    `vendor_id` STRING,
    `created` STRING,
    `updated` STRING,
    `tracker_type_id` STRING
) WITH (
    KAFKA_TOPIC='fleet-source-connector-2.public.trackers',
    KEY_FORMAT='JSON',
    VALUE_FORMAT='JSON',
    PARTITIONS=1
);

CREATE TABLE ESDB_PUBLIC_PHOTOS (
    `photo_id` STRING PRIMARY KEY,
    `filename` STRING
) WITH (
    KAFKA_TOPIC='fleet-source-connector-2.public.photos',
    KEY_FORMAT='JSON',
    VALUE_FORMAT='JSON',
    PARTITIONS=1
);

-- LOOKUP TABLES

CREATE TABLE ESDB_BRANCH AS
SELECT
    m.`market_id` as `market_id`,
    STRUCT(
        `id` := m.`market_id`,
        `name` := m.`name`,
        `description` := m.`description`,
        `company_id` := c.`company_id`,
        `company_name` := c.`name`
    ) AS `branch`
FROM
    ESDB_PUBLIC_MARKETS m
    LEFT JOIN ESDB_PUBLIC_COMPANIES c ON COALESCE(m.`company_id`, ' ') = c.`company_id`;

CREATE TABLE ESDB_GROUPX AS
SELECT
    o.`organization_id` as `group_id`,
    STRUCT(
        `id` := o.`organization_id`,
        `name` := o.`name`,
        `company_id` := c.`company_id`,
        `company_name` := c.`name`
    ) AS `group`
FROM
    ESDB_PUBLIC_ORGANIZATIONS o
    LEFT JOIN ESDB_PUBLIC_COMPANIES c ON COALESCE(o.`company_id`, ' ') = c.`company_id`;

-- RELATIONSHIP TABLES - PART 1

CREATE TABLE ESDB_ASSET_TRACKER AS
SELECT
    a.`asset_id` as `asset_id`,
    STRUCT(
        `id` := a.`tracker_id`,
        `device_serial` := t.`device_serial`,
        `company_id` := t.`company_id`,
        `vendor_id` := t.`vendor_id`,
        `created` := t.`created`,
        `updated` := t.`updated`,
        `tracker_type_id` := t.`tracker_type_id`
    ) AS `tracker`
FROM
    ESDB_PUBLIC_ASSETS a
    LEFT JOIN ESDB_PUBLIC_TRACKERS t ON COALESCE(a.`tracker_id`, ' ') = t.`tracker_id`;

CREATE TABLE ESDB_ASSET_COMPANY AS
SELECT
    a.`asset_id` as `asset_id`,
    STRUCT(
        `id` := c.`company_id`,
        `name` := c.`name`
    ) AS `company`
FROM
    ESDB_PUBLIC_ASSETS a
    LEFT JOIN ESDB_PUBLIC_COMPANIES c ON COALESCE(a.`company_id`, ' ') = c.`company_id`;

CREATE TABLE ESDB_ASSET_TYPE AS
SELECT
    a.`asset_id` as `asset_id`,
    STRUCT(
        `id` := t.`asset_type_id`,
        `name` := t.`name`
    ) AS `type`
FROM
    ESDB_PUBLIC_ASSETS a
    LEFT JOIN ESDB_PUBLIC_ASSET_TYPES t ON COALESCE(a.`asset_type_id`, ' ') = t.`asset_type_id`;

CREATE TABLE ESDB_ASSET_MAKE AS
SELECT
    a.`asset_id` as `asset_id`,
    STRUCT(
        `id` := m.`equipment_make_id`,
        `name` := m.`name`
    ) AS `make`
FROM
    ESDB_PUBLIC_ASSETS a
    LEFT JOIN ESDB_PUBLIC_EQUIPMENT_MAKES m ON COALESCE(a.`equipment_make_id`, ' ') = m.`equipment_make_id`;

CREATE TABLE ESDB_ASSET_MODEL AS
SELECT
    a.`asset_id` as `asset_id`,
    STRUCT(
        `id` := m.`equipment_model_id`,
        `name` := m.`name`
    ) AS `model`
FROM
    ESDB_PUBLIC_ASSETS a
    LEFT JOIN ESDB_PUBLIC_EQUIPMENT_MODELS m ON COALESCE(a.`equipment_model_id`, ' ') = m.`equipment_model_id`;

CREATE TABLE ESDB_ASSET_CLASS AS
SELECT
    a.`asset_id` as `asset_id`,
    STRUCT(
        `id` := c.`equipment_class_id`,
        `name` := c.`name`,
        `description` := c.`description`
    ) AS `class`
FROM
    ESDB_PUBLIC_ASSETS a
    LEFT JOIN ESDB_PUBLIC_EQUIPMENT_CLASSES c ON COALESCE(a.`equipment_class_id`, ' ') = c.`equipment_class_id`;

CREATE TABLE ESDB_ASSET_INVENTORY_BRANCH AS
SELECT
    a.`asset_id` as `asset_id`,
    b.`branch` as `branch`
FROM
    ESDB_PUBLIC_ASSETS a
    LEFT JOIN ESDB_BRANCH b ON COALESCE(a.`inventory_branch_id`, ' ') = b.`market_id`;

-- RELATIONSHIP TABLES - PART 2

CREATE TABLE ESDB_ASSET_MSP_BRANCH AS
SELECT
    a.`asset_id` as `asset_id`,
    b.`branch` as `branch`
FROM
    ESDB_PUBLIC_ASSETS a
    LEFT JOIN ESDB_BRANCH b ON COALESCE(a.`service_branch_id`, ' ') = b.`market_id`;

CREATE TABLE ESDB_ASSET_RSP_BRANCH AS
SELECT
    a.`asset_id` as `asset_id`,
    b.`branch` as `branch`
FROM
    ESDB_PUBLIC_ASSETS a
    LEFT JOIN ESDB_BRANCH b ON COALESCE(a.`rental_branch_id`, ' ') = b.`market_id`;

CREATE TABLE ESDB_ASSET_KEYPADS_TABLE AS
SELECT * FROM ESDB_PUBLIC_KEYPADS;

CREATE TABLE ESDB_ASSET_KEYPADS AS
SELECT
    `asset_id`,
    COLLECT_LIST(`keypad_id`) as `data`
FROM
    ESDB_ASSET_KEYPADS_TABLE
WHERE
    `asset_id` IS NOT NULL
GROUP BY
    `asset_id`;

CREATE TABLE ESDB_ASSET_GROUPS AS
SELECT
    oax.`asset_id` as `asset_id`,
    COLLECT_LIST(g.`group`) as `groups`
FROM
    ESDB_PUBLIC_ORGANIZATION_ASSET_XREF oax
    LEFT JOIN ESDB_GROUPX g ON COALESCE(oax.`organization_id`, ' ') = g.`group_id`
GROUP BY
    oax.`asset_id`;

CREATE TABLE ESDB_ASSET_TSP_COMPANIES AS
SELECT
    tsp.`asset_id` as `asset_id`,
    COLLECT_LIST(
        STRUCT(
            `company_id` := c.`company_id`,
            `company_name` := c.`name`
        )
    ) as `tsp_companies`
FROM
    ESDB_PUBLIC_TELEMATICS_SERVICE_PROVIDERS_ASSETS tsp
    LEFT JOIN ESDB_PUBLIC_COMPANIES c ON COALESCE(tsp.`company_id`, ' ') = c.`company_id`
GROUP BY
    tsp.`asset_id`;

CREATE TABLE ESDB_ASSET_PHOTOS AS
SELECT
    assets.`asset_id` as `asset_id`,
    photos.`photo_id` as `photo_id`,
    photos.`filename` as `filename`
FROM
    ESDB_PUBLIC_ASSETS assets
    LEFT JOIN ESDB_PUBLIC_PHOTOS photos ON COALESCE(assets.`photo_id`, ' ') = photos.`photo_id`;

-- FINAL MATERIALIZED VIEW

CREATE TABLE ESDB_ASSET_MATERIALIZED_VIEW AS
SELECT
    a.`asset_id` as `asset_id`,
    STRUCT(
        `asset_id` := a.`asset_id`,
        `name` := a.`name`,
        `description` := a.`description`,
        `custom_name` := a.`custom_name`,
        `model` := a.`model`,
        `year` := a.`year`,
        `tracker_id` := a.`tracker_id`,
        `vin` := a.`vin`,
        `serial_number` := a.`serial_number`,
        `driver_name` := a.`driver_name`,
        `camera_id` := a.`camera_id`,
        `photo_id` := a.`photo_id`
    ) AS `details`,
    STRUCT(
        `photo_id` := photo.`photo_id`,
        `filename` := photo.`filename`
    ) as `photo`,
    company.`company` as `company`,
    asset_type.`type` as `type`,
    make.`make` as `make`,
    model.`model` as `model`,
    class.`class` as `class`,
    inventory_branch.`branch` as `inventory_branch`,
    msp_branch.`branch` as `msp_branch`,
    rsp_branch.`branch` as `rsp_branch`,
    groups.`groups` as `groups`,
    tsp_companies.`tsp_companies` as `tsp_companies`,
    tracker.`tracker` as `tracker`,
    keypads.`data` as `keypad`
FROM
    ESDB_PUBLIC_ASSETS a
    LEFT JOIN ESDB_ASSET_COMPANY company ON a.`asset_id` = company.`asset_id`
    LEFT JOIN ESDB_ASSET_TYPE asset_type ON a.`asset_id` = asset_type.`asset_id`
    LEFT JOIN ESDB_ASSET_MAKE make ON a.`asset_id` = make.`asset_id`
    LEFT JOIN ESDB_ASSET_MODEL model ON a.`asset_id` = model.`asset_id`
    LEFT JOIN ESDB_ASSET_CLASS class ON a.`asset_id` = class.`asset_id`
    LEFT JOIN ESDB_ASSET_INVENTORY_BRANCH inventory_branch ON a.`asset_id` = inventory_branch.`asset_id`
    LEFT JOIN ESDB_ASSET_MSP_BRANCH msp_branch ON a.`asset_id` = msp_branch.`asset_id`
    LEFT JOIN ESDB_ASSET_RSP_BRANCH rsp_branch ON a.`asset_id` = rsp_branch.`asset_id`
    LEFT JOIN ESDB_ASSET_GROUPS groups ON a.`asset_id` = groups.`asset_id`
    LEFT JOIN ESDB_ASSET_TSP_COMPANIES tsp_companies ON a.`asset_id` = tsp_companies.`asset_id`
    LEFT JOIN ESDB_ASSET_TRACKER tracker ON a.`asset_id` = tracker.`asset_id`
    LEFT JOIN ESDB_ASSET_KEYPADS keypads ON a.`asset_id` = keypads.`asset_id`
    LEFT JOIN ESDB_ASSET_PHOTOS photo ON a.`asset_id` = photo.`asset_id`;
