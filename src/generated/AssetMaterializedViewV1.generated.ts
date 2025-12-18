/***
 * DO NOT MODIFY THIS FILE BY HAND
 * This file was generated using npm run avro-ts-codegen
 * Topic: _fleet-es-erp-asset-data-v1_ASSET_MATERIALIZED_VIEW
 * Schema version: 1
 */

/* eslint-disable @typescript-eslint/no-namespace */

export type AssetMaterializedViewV1 =
  IoConfluentKsqlAvro_schemas.AssetMaterializedViewV1;

export namespace IoConfluentKsqlAvro_schemas {
  export const KsqlDataSourceSchema_detailsSchema =
    '{"type":"record","name":"KsqlDataSourceSchema_details","fields":[{"name":"asset_id","type":["null","string"],"default":null},{"name":"name","type":["null","string"],"default":null},{"name":"description","type":["null","string"],"default":null},{"name":"custom_name","type":["null","string"],"default":null},{"name":"model","type":["null","string"],"default":null},{"name":"year","type":["null","string"],"default":null},{"name":"tracker_id","type":["null","string"],"default":null},{"name":"vin","type":["null","string"],"default":null},{"name":"serial_number","type":["null","string"],"default":null},{"name":"driver_name","type":["null","string"],"default":null},{"name":"camera_id","type":["null","string"],"default":null},{"name":"photo_id","type":["null","string"],"default":null}],"connect.name":"io.confluent.ksql.avro_schemas.KsqlDataSourceSchema_details"}';
  export const KsqlDataSourceSchema_detailsName =
    'io.confluent.ksql.avro_schemas.KsqlDataSourceSchema_details';
  export interface KsqlDataSourceSchema_details {
    /**
     * Default: null
     */
    asset_id: null | string;
    /**
     * Default: null
     */
    name: null | string;
    /**
     * Default: null
     */
    description: null | string;
    /**
     * Default: null
     */
    custom_name: null | string;
    /**
     * Default: null
     */
    model: null | string;
    /**
     * Default: null
     */
    year: null | string;
    /**
     * Default: null
     */
    tracker_id: null | string;
    /**
     * Default: null
     */
    vin: null | string;
    /**
     * Default: null
     */
    serial_number: null | string;
    /**
     * Default: null
     */
    driver_name: null | string;
    /**
     * Default: null
     */
    camera_id: null | string;
    /**
     * Default: null
     */
    photo_id: null | string;
  }
  export const KsqlDataSourceSchema_photoSchema =
    '{"type":"record","name":"KsqlDataSourceSchema_photo","fields":[{"name":"photo_id","type":["null","string"],"default":null},{"name":"filename","type":["null","string"],"default":null}],"connect.name":"io.confluent.ksql.avro_schemas.KsqlDataSourceSchema_photo"}';
  export const KsqlDataSourceSchema_photoName =
    'io.confluent.ksql.avro_schemas.KsqlDataSourceSchema_photo';
  export interface KsqlDataSourceSchema_photo {
    /**
     * Default: null
     */
    photo_id: null | string;
    /**
     * Default: null
     */
    filename: null | string;
  }
  export const KsqlDataSourceSchema_companySchema =
    '{"type":"record","name":"KsqlDataSourceSchema_company","fields":[{"name":"id","type":["null","string"],"default":null},{"name":"name","type":["null","string"],"default":null}],"connect.name":"io.confluent.ksql.avro_schemas.KsqlDataSourceSchema_company"}';
  export const KsqlDataSourceSchema_companyName =
    'io.confluent.ksql.avro_schemas.KsqlDataSourceSchema_company';
  export interface KsqlDataSourceSchema_company {
    /**
     * Default: null
     */
    id: null | string;
    /**
     * Default: null
     */
    name: null | string;
  }
  export const KsqlDataSourceSchema_typeSchema =
    '{"type":"record","name":"KsqlDataSourceSchema_type","fields":[{"name":"id","type":["null","string"],"default":null},{"name":"name","type":["null","string"],"default":null}],"connect.name":"io.confluent.ksql.avro_schemas.KsqlDataSourceSchema_type"}';
  export const KsqlDataSourceSchema_typeName =
    'io.confluent.ksql.avro_schemas.KsqlDataSourceSchema_type';
  export interface KsqlDataSourceSchema_type {
    /**
     * Default: null
     */
    id: null | string;
    /**
     * Default: null
     */
    name: null | string;
  }
  export const KsqlDataSourceSchema_makeSchema =
    '{"type":"record","name":"KsqlDataSourceSchema_make","fields":[{"name":"id","type":["null","string"],"default":null},{"name":"name","type":["null","string"],"default":null}],"connect.name":"io.confluent.ksql.avro_schemas.KsqlDataSourceSchema_make"}';
  export const KsqlDataSourceSchema_makeName =
    'io.confluent.ksql.avro_schemas.KsqlDataSourceSchema_make';
  export interface KsqlDataSourceSchema_make {
    /**
     * Default: null
     */
    id: null | string;
    /**
     * Default: null
     */
    name: null | string;
  }
  export const KsqlDataSourceSchema_modelSchema =
    '{"type":"record","name":"KsqlDataSourceSchema_model","fields":[{"name":"id","type":["null","string"],"default":null},{"name":"name","type":["null","string"],"default":null}],"connect.name":"io.confluent.ksql.avro_schemas.KsqlDataSourceSchema_model"}';
  export const KsqlDataSourceSchema_modelName =
    'io.confluent.ksql.avro_schemas.KsqlDataSourceSchema_model';
  export interface KsqlDataSourceSchema_model {
    /**
     * Default: null
     */
    id: null | string;
    /**
     * Default: null
     */
    name: null | string;
  }
  export const KsqlDataSourceSchema_classSchema =
    '{"type":"record","name":"KsqlDataSourceSchema_class","fields":[{"name":"id","type":["null","string"],"default":null},{"name":"name","type":["null","string"],"default":null},{"name":"description","type":["null","string"],"default":null}],"connect.name":"io.confluent.ksql.avro_schemas.KsqlDataSourceSchema_class"}';
  export const KsqlDataSourceSchema_className =
    'io.confluent.ksql.avro_schemas.KsqlDataSourceSchema_class';
  export interface KsqlDataSourceSchema_class {
    /**
     * Default: null
     */
    id: null | string;
    /**
     * Default: null
     */
    name: null | string;
    /**
     * Default: null
     */
    description: null | string;
  }
  export const KsqlDataSourceSchema_inventory_branchSchema =
    '{"type":"record","name":"KsqlDataSourceSchema_inventory_branch","fields":[{"name":"id","type":["null","string"],"default":null},{"name":"name","type":["null","string"],"default":null},{"name":"description","type":["null","string"],"default":null},{"name":"company_id","type":["null","string"],"default":null},{"name":"company_name","type":["null","string"],"default":null}],"connect.name":"io.confluent.ksql.avro_schemas.KsqlDataSourceSchema_inventory_branch"}';
  export const KsqlDataSourceSchema_inventory_branchName =
    'io.confluent.ksql.avro_schemas.KsqlDataSourceSchema_inventory_branch';
  export interface KsqlDataSourceSchema_inventory_branch {
    /**
     * Default: null
     */
    id: null | string;
    /**
     * Default: null
     */
    name: null | string;
    /**
     * Default: null
     */
    description: null | string;
    /**
     * Default: null
     */
    company_id: null | string;
    /**
     * Default: null
     */
    company_name: null | string;
  }
  export const KsqlDataSourceSchema_msp_branchSchema =
    '{"type":"record","name":"KsqlDataSourceSchema_msp_branch","fields":[{"name":"id","type":["null","string"],"default":null},{"name":"name","type":["null","string"],"default":null},{"name":"description","type":["null","string"],"default":null},{"name":"company_id","type":["null","string"],"default":null},{"name":"company_name","type":["null","string"],"default":null}],"connect.name":"io.confluent.ksql.avro_schemas.KsqlDataSourceSchema_msp_branch"}';
  export const KsqlDataSourceSchema_msp_branchName =
    'io.confluent.ksql.avro_schemas.KsqlDataSourceSchema_msp_branch';
  export interface KsqlDataSourceSchema_msp_branch {
    /**
     * Default: null
     */
    id: null | string;
    /**
     * Default: null
     */
    name: null | string;
    /**
     * Default: null
     */
    description: null | string;
    /**
     * Default: null
     */
    company_id: null | string;
    /**
     * Default: null
     */
    company_name: null | string;
  }
  export const KsqlDataSourceSchema_rsp_branchSchema =
    '{"type":"record","name":"KsqlDataSourceSchema_rsp_branch","fields":[{"name":"id","type":["null","string"],"default":null},{"name":"name","type":["null","string"],"default":null},{"name":"description","type":["null","string"],"default":null},{"name":"company_id","type":["null","string"],"default":null},{"name":"company_name","type":["null","string"],"default":null}],"connect.name":"io.confluent.ksql.avro_schemas.KsqlDataSourceSchema_rsp_branch"}';
  export const KsqlDataSourceSchema_rsp_branchName =
    'io.confluent.ksql.avro_schemas.KsqlDataSourceSchema_rsp_branch';
  export interface KsqlDataSourceSchema_rsp_branch {
    /**
     * Default: null
     */
    id: null | string;
    /**
     * Default: null
     */
    name: null | string;
    /**
     * Default: null
     */
    description: null | string;
    /**
     * Default: null
     */
    company_id: null | string;
    /**
     * Default: null
     */
    company_name: null | string;
  }
  export const KsqlDataSourceSchema_groupsSchema =
    '{"type":"record","name":"KsqlDataSourceSchema_groups","fields":[{"name":"id","type":["null","string"],"default":null},{"name":"name","type":["null","string"],"default":null},{"name":"company_id","type":["null","string"],"default":null},{"name":"company_name","type":["null","string"],"default":null}],"connect.name":"io.confluent.ksql.avro_schemas.KsqlDataSourceSchema_groups"}';
  export const KsqlDataSourceSchema_groupsName =
    'io.confluent.ksql.avro_schemas.KsqlDataSourceSchema_groups';
  export interface KsqlDataSourceSchema_groups {
    /**
     * Default: null
     */
    id: null | string;
    /**
     * Default: null
     */
    name: null | string;
    /**
     * Default: null
     */
    company_id: null | string;
    /**
     * Default: null
     */
    company_name: null | string;
  }
  export const KsqlDataSourceSchema_tsp_companiesSchema =
    '{"type":"record","name":"KsqlDataSourceSchema_tsp_companies","fields":[{"name":"company_id","type":["null","string"],"default":null},{"name":"company_name","type":["null","string"],"default":null}],"connect.name":"io.confluent.ksql.avro_schemas.KsqlDataSourceSchema_tsp_companies"}';
  export const KsqlDataSourceSchema_tsp_companiesName =
    'io.confluent.ksql.avro_schemas.KsqlDataSourceSchema_tsp_companies';
  export interface KsqlDataSourceSchema_tsp_companies {
    /**
     * Default: null
     */
    company_id: null | string;
    /**
     * Default: null
     */
    company_name: null | string;
  }
  export const KsqlDataSourceSchema_trackerSchema =
    '{"type":"record","name":"KsqlDataSourceSchema_tracker","fields":[{"name":"id","type":["null","string"],"default":null},{"name":"device_serial","type":["null","string"],"default":null},{"name":"company_id","type":["null","string"],"default":null},{"name":"vendor_id","type":["null","string"],"default":null},{"name":"created","type":["null","string"],"default":null},{"name":"updated","type":["null","string"],"default":null},{"name":"tracker_type_id","type":["null","string"],"default":null}],"connect.name":"io.confluent.ksql.avro_schemas.KsqlDataSourceSchema_tracker"}';
  export const KsqlDataSourceSchema_trackerName =
    'io.confluent.ksql.avro_schemas.KsqlDataSourceSchema_tracker';
  export interface KsqlDataSourceSchema_tracker {
    /**
     * Default: null
     */
    id: null | string;
    /**
     * Default: null
     */
    device_serial: null | string;
    /**
     * Default: null
     */
    company_id: null | string;
    /**
     * Default: null
     */
    vendor_id: null | string;
    /**
     * Default: null
     */
    created: null | string;
    /**
     * Default: null
     */
    updated: null | string;
    /**
     * Default: null
     */
    tracker_type_id: null | string;
  }
  export const KsqlDataSourceSchema_category_level_1Schema =
    '{"type":"record","name":"KsqlDataSourceSchema_category_level_1","fields":[{"name":"category_id","type":["null","string"],"default":null},{"name":"name","type":["null","string"],"default":null},{"name":"description","type":["null","string"],"default":null},{"name":"parent_category_id","type":["null","string"],"default":null}],"connect.name":"io.confluent.ksql.avro_schemas.KsqlDataSourceSchema_category_level_1"}';
  export const KsqlDataSourceSchema_category_level_1Name =
    'io.confluent.ksql.avro_schemas.KsqlDataSourceSchema_category_level_1';
  export interface KsqlDataSourceSchema_category_level_1 {
    /**
     * Default: null
     */
    category_id: null | string;
    /**
     * Default: null
     */
    name: null | string;
    /**
     * Default: null
     */
    description: null | string;
    /**
     * Default: null
     */
    parent_category_id: null | string;
  }
  export const KsqlDataSourceSchema_category_level_2Schema =
    '{"type":"record","name":"KsqlDataSourceSchema_category_level_2","fields":[{"name":"category_id","type":["null","string"],"default":null},{"name":"name","type":["null","string"],"default":null},{"name":"description","type":["null","string"],"default":null},{"name":"parent_category_id","type":["null","string"],"default":null}],"connect.name":"io.confluent.ksql.avro_schemas.KsqlDataSourceSchema_category_level_2"}';
  export const KsqlDataSourceSchema_category_level_2Name =
    'io.confluent.ksql.avro_schemas.KsqlDataSourceSchema_category_level_2';
  export interface KsqlDataSourceSchema_category_level_2 {
    /**
     * Default: null
     */
    category_id: null | string;
    /**
     * Default: null
     */
    name: null | string;
    /**
     * Default: null
     */
    description: null | string;
    /**
     * Default: null
     */
    parent_category_id: null | string;
  }
  export const KsqlDataSourceSchema_category_level_3Schema =
    '{"type":"record","name":"KsqlDataSourceSchema_category_level_3","fields":[{"name":"category_id","type":["null","string"],"default":null},{"name":"name","type":["null","string"],"default":null},{"name":"description","type":["null","string"],"default":null},{"name":"parent_category_id","type":["null","string"],"default":null}],"connect.name":"io.confluent.ksql.avro_schemas.KsqlDataSourceSchema_category_level_3"}';
  export const KsqlDataSourceSchema_category_level_3Name =
    'io.confluent.ksql.avro_schemas.KsqlDataSourceSchema_category_level_3';
  export interface KsqlDataSourceSchema_category_level_3 {
    /**
     * Default: null
     */
    category_id: null | string;
    /**
     * Default: null
     */
    name: null | string;
    /**
     * Default: null
     */
    description: null | string;
    /**
     * Default: null
     */
    parent_category_id: null | string;
  }
  export const KsqlDataSourceSchema_categorySchema =
    '{"type":"record","name":"KsqlDataSourceSchema_category","fields":[{"name":"level_1","type":["null",{"type":"record","name":"KsqlDataSourceSchema_category_level_1","fields":[{"name":"category_id","type":["null","string"],"default":null},{"name":"name","type":["null","string"],"default":null},{"name":"description","type":["null","string"],"default":null},{"name":"parent_category_id","type":["null","string"],"default":null}],"connect.name":"io.confluent.ksql.avro_schemas.KsqlDataSourceSchema_category_level_1"}],"default":null},{"name":"level_2","type":["null",{"type":"record","name":"KsqlDataSourceSchema_category_level_2","fields":[{"name":"category_id","type":["null","string"],"default":null},{"name":"name","type":["null","string"],"default":null},{"name":"description","type":["null","string"],"default":null},{"name":"parent_category_id","type":["null","string"],"default":null}],"connect.name":"io.confluent.ksql.avro_schemas.KsqlDataSourceSchema_category_level_2"}],"default":null},{"name":"level_3","type":["null",{"type":"record","name":"KsqlDataSourceSchema_category_level_3","fields":[{"name":"category_id","type":["null","string"],"default":null},{"name":"name","type":["null","string"],"default":null},{"name":"description","type":["null","string"],"default":null},{"name":"parent_category_id","type":["null","string"],"default":null}],"connect.name":"io.confluent.ksql.avro_schemas.KsqlDataSourceSchema_category_level_3"}],"default":null},{"name":"composite","type":["null","string"],"default":null},{"name":"category_id","type":["null","string"],"default":null}],"connect.name":"io.confluent.ksql.avro_schemas.KsqlDataSourceSchema_category"}';
  export const KsqlDataSourceSchema_categoryName =
    'io.confluent.ksql.avro_schemas.KsqlDataSourceSchema_category';
  export interface KsqlDataSourceSchema_category {
    /**
     * Default: null
     */
    level_1: null | IoConfluentKsqlAvro_schemas.KsqlDataSourceSchema_category_level_1;
    /**
     * Default: null
     */
    level_2: null | IoConfluentKsqlAvro_schemas.KsqlDataSourceSchema_category_level_2;
    /**
     * Default: null
     */
    level_3: null | IoConfluentKsqlAvro_schemas.KsqlDataSourceSchema_category_level_3;
    /**
     * Default: null
     */
    composite: null | string;
    /**
     * Default: null
     */
    category_id: null | string;
  }
  export const AssetMaterializedViewV1Schema =
    '{"type":"record","name":"AssetMaterializedViewV1","namespace":"io.confluent.ksql.avro_schemas","fields":[{"name":"details","type":["null",{"type":"record","name":"KsqlDataSourceSchema_details","fields":[{"name":"asset_id","type":["null","string"],"default":null},{"name":"name","type":["null","string"],"default":null},{"name":"description","type":["null","string"],"default":null},{"name":"custom_name","type":["null","string"],"default":null},{"name":"model","type":["null","string"],"default":null},{"name":"year","type":["null","string"],"default":null},{"name":"tracker_id","type":["null","string"],"default":null},{"name":"vin","type":["null","string"],"default":null},{"name":"serial_number","type":["null","string"],"default":null},{"name":"driver_name","type":["null","string"],"default":null},{"name":"camera_id","type":["null","string"],"default":null},{"name":"photo_id","type":["null","string"],"default":null}],"connect.name":"io.confluent.ksql.avro_schemas.KsqlDataSourceSchema_details"}],"default":null},{"name":"photo","type":["null",{"type":"record","name":"KsqlDataSourceSchema_photo","fields":[{"name":"photo_id","type":["null","string"],"default":null},{"name":"filename","type":["null","string"],"default":null}],"connect.name":"io.confluent.ksql.avro_schemas.KsqlDataSourceSchema_photo"}],"default":null},{"name":"company","type":["null",{"type":"record","name":"KsqlDataSourceSchema_company","fields":[{"name":"id","type":["null","string"],"default":null},{"name":"name","type":["null","string"],"default":null}],"connect.name":"io.confluent.ksql.avro_schemas.KsqlDataSourceSchema_company"}],"default":null},{"name":"type","type":["null",{"type":"record","name":"KsqlDataSourceSchema_type","fields":[{"name":"id","type":["null","string"],"default":null},{"name":"name","type":["null","string"],"default":null}],"connect.name":"io.confluent.ksql.avro_schemas.KsqlDataSourceSchema_type"}],"default":null},{"name":"make","type":["null",{"type":"record","name":"KsqlDataSourceSchema_make","fields":[{"name":"id","type":["null","string"],"default":null},{"name":"name","type":["null","string"],"default":null}],"connect.name":"io.confluent.ksql.avro_schemas.KsqlDataSourceSchema_make"}],"default":null},{"name":"model","type":["null",{"type":"record","name":"KsqlDataSourceSchema_model","fields":[{"name":"id","type":["null","string"],"default":null},{"name":"name","type":["null","string"],"default":null}],"connect.name":"io.confluent.ksql.avro_schemas.KsqlDataSourceSchema_model"}],"default":null},{"name":"class","type":["null",{"type":"record","name":"KsqlDataSourceSchema_class","fields":[{"name":"id","type":["null","string"],"default":null},{"name":"name","type":["null","string"],"default":null},{"name":"description","type":["null","string"],"default":null}],"connect.name":"io.confluent.ksql.avro_schemas.KsqlDataSourceSchema_class"}],"default":null},{"name":"inventory_branch","type":["null",{"type":"record","name":"KsqlDataSourceSchema_inventory_branch","fields":[{"name":"id","type":["null","string"],"default":null},{"name":"name","type":["null","string"],"default":null},{"name":"description","type":["null","string"],"default":null},{"name":"company_id","type":["null","string"],"default":null},{"name":"company_name","type":["null","string"],"default":null}],"connect.name":"io.confluent.ksql.avro_schemas.KsqlDataSourceSchema_inventory_branch"}],"default":null},{"name":"msp_branch","type":["null",{"type":"record","name":"KsqlDataSourceSchema_msp_branch","fields":[{"name":"id","type":["null","string"],"default":null},{"name":"name","type":["null","string"],"default":null},{"name":"description","type":["null","string"],"default":null},{"name":"company_id","type":["null","string"],"default":null},{"name":"company_name","type":["null","string"],"default":null}],"connect.name":"io.confluent.ksql.avro_schemas.KsqlDataSourceSchema_msp_branch"}],"default":null},{"name":"rsp_branch","type":["null",{"type":"record","name":"KsqlDataSourceSchema_rsp_branch","fields":[{"name":"id","type":["null","string"],"default":null},{"name":"name","type":["null","string"],"default":null},{"name":"description","type":["null","string"],"default":null},{"name":"company_id","type":["null","string"],"default":null},{"name":"company_name","type":["null","string"],"default":null}],"connect.name":"io.confluent.ksql.avro_schemas.KsqlDataSourceSchema_rsp_branch"}],"default":null},{"name":"groups","type":["null",{"type":"array","items":["null",{"type":"record","name":"KsqlDataSourceSchema_groups","fields":[{"name":"id","type":["null","string"],"default":null},{"name":"name","type":["null","string"],"default":null},{"name":"company_id","type":["null","string"],"default":null},{"name":"company_name","type":["null","string"],"default":null}],"connect.name":"io.confluent.ksql.avro_schemas.KsqlDataSourceSchema_groups"}]}],"default":null},{"name":"tsp_companies","type":["null",{"type":"array","items":["null",{"type":"record","name":"KsqlDataSourceSchema_tsp_companies","fields":[{"name":"company_id","type":["null","string"],"default":null},{"name":"company_name","type":["null","string"],"default":null}],"connect.name":"io.confluent.ksql.avro_schemas.KsqlDataSourceSchema_tsp_companies"}]}],"default":null},{"name":"tracker","type":["null",{"type":"record","name":"KsqlDataSourceSchema_tracker","fields":[{"name":"id","type":["null","string"],"default":null},{"name":"device_serial","type":["null","string"],"default":null},{"name":"company_id","type":["null","string"],"default":null},{"name":"vendor_id","type":["null","string"],"default":null},{"name":"created","type":["null","string"],"default":null},{"name":"updated","type":["null","string"],"default":null},{"name":"tracker_type_id","type":["null","string"],"default":null}],"connect.name":"io.confluent.ksql.avro_schemas.KsqlDataSourceSchema_tracker"}],"default":null},{"name":"keypad","type":["null",{"type":"array","items":["null","string"]}],"default":null},{"name":"category","type":["null",{"type":"record","name":"KsqlDataSourceSchema_category","fields":[{"name":"level_1","type":["null",{"type":"record","name":"KsqlDataSourceSchema_category_level_1","fields":[{"name":"category_id","type":["null","string"],"default":null},{"name":"name","type":["null","string"],"default":null},{"name":"description","type":["null","string"],"default":null},{"name":"parent_category_id","type":["null","string"],"default":null}],"connect.name":"io.confluent.ksql.avro_schemas.KsqlDataSourceSchema_category_level_1"}],"default":null},{"name":"level_2","type":["null",{"type":"record","name":"KsqlDataSourceSchema_category_level_2","fields":[{"name":"category_id","type":["null","string"],"default":null},{"name":"name","type":["null","string"],"default":null},{"name":"description","type":["null","string"],"default":null},{"name":"parent_category_id","type":["null","string"],"default":null}],"connect.name":"io.confluent.ksql.avro_schemas.KsqlDataSourceSchema_category_level_2"}],"default":null},{"name":"level_3","type":["null",{"type":"record","name":"KsqlDataSourceSchema_category_level_3","fields":[{"name":"category_id","type":["null","string"],"default":null},{"name":"name","type":["null","string"],"default":null},{"name":"description","type":["null","string"],"default":null},{"name":"parent_category_id","type":["null","string"],"default":null}],"connect.name":"io.confluent.ksql.avro_schemas.KsqlDataSourceSchema_category_level_3"}],"default":null},{"name":"composite","type":["null","string"],"default":null},{"name":"category_id","type":["null","string"],"default":null}],"connect.name":"io.confluent.ksql.avro_schemas.KsqlDataSourceSchema_category"}],"default":null}],"connect.name":"io.confluent.ksql.avro_schemas.KsqlDataSourceSchema"}';
  export const AssetMaterializedViewV1Name =
    'io.confluent.ksql.avro_schemas.AssetMaterializedViewV1';
  export interface AssetMaterializedViewV1 {
    /**
     * Default: null
     */
    details: null | IoConfluentKsqlAvro_schemas.KsqlDataSourceSchema_details;
    /**
     * Default: null
     */
    photo: null | IoConfluentKsqlAvro_schemas.KsqlDataSourceSchema_photo;
    /**
     * Default: null
     */
    company: null | IoConfluentKsqlAvro_schemas.KsqlDataSourceSchema_company;
    /**
     * Default: null
     */
    type: null | IoConfluentKsqlAvro_schemas.KsqlDataSourceSchema_type;
    /**
     * Default: null
     */
    make: null | IoConfluentKsqlAvro_schemas.KsqlDataSourceSchema_make;
    /**
     * Default: null
     */
    model: null | IoConfluentKsqlAvro_schemas.KsqlDataSourceSchema_model;
    /**
     * Default: null
     */
    class: null | IoConfluentKsqlAvro_schemas.KsqlDataSourceSchema_class;
    /**
     * Default: null
     */
    inventory_branch: null | IoConfluentKsqlAvro_schemas.KsqlDataSourceSchema_inventory_branch;
    /**
     * Default: null
     */
    msp_branch: null | IoConfluentKsqlAvro_schemas.KsqlDataSourceSchema_msp_branch;
    /**
     * Default: null
     */
    rsp_branch: null | IoConfluentKsqlAvro_schemas.KsqlDataSourceSchema_rsp_branch;
    /**
     * Default: null
     */
    groups:
      | null
      | (null | IoConfluentKsqlAvro_schemas.KsqlDataSourceSchema_groups)[];
    /**
     * Default: null
     */
    tsp_companies:
      | null
      | (null | IoConfluentKsqlAvro_schemas.KsqlDataSourceSchema_tsp_companies)[];
    /**
     * Default: null
     */
    tracker: null | IoConfluentKsqlAvro_schemas.KsqlDataSourceSchema_tracker;
    /**
     * Default: null
     */
    keypad: null | (null | string)[];
    /**
     * Default: null
     */
    category: null | IoConfluentKsqlAvro_schemas.KsqlDataSourceSchema_category;
  }
}
