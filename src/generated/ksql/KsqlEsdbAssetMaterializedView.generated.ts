/***
 * DO NOT MODIFY THIS FILE BY HAND
 * This file was generated from ksqlDB table schema
 * Source: ESDB_ASSET_MATERIALIZED_VIEW
 */

export interface KsqlEsdbAssetMaterializedView {
  asset_id: string;
  details: {
    asset_id: string | null;
    name: string | null;
    description: string | null;
    custom_name: string | null;
    model: string | null;
    year: string | null;
    tracker_id: string | null;
    vin: string | null;
    serial_number: string | null;
    driver_name: string | null;
    camera_id: string | null;
    photo_id: string | null;
  } | null;
  photo: {
    photo_id: string | null;
    filename: string | null;
  } | null;
  company: {
    id: string | null;
    name: string | null;
  } | null;
  type: {
    id: string | null;
    name: string | null;
  } | null;
  make: {
    id: string | null;
    name: string | null;
  } | null;
  model: {
    id: string | null;
    name: string | null;
  } | null;
  class: {
    id: string | null;
    name: string | null;
    description: string | null;
  } | null;
  inventory_branch: {
    id: string | null;
    name: string | null;
    description: string | null;
    company_id: string | null;
    company_name: string | null;
  } | null;
  msp_branch: {
    id: string | null;
    name: string | null;
    description: string | null;
    company_id: string | null;
    company_name: string | null;
  } | null;
  rsp_branch: {
    id: string | null;
    name: string | null;
    description: string | null;
    company_id: string | null;
    company_name: string | null;
  } | null;
  groups:
    | {
        id: string | null;
        name: string | null;
        company_id: string | null;
        company_name: string | null;
      }[]
    | null;
  tsp_companies:
    | {
        company_id: string | null;
        company_name: string | null;
      }[]
    | null;
  tracker: {
    id: string | null;
    device_serial: string | null;
    company_id: string | null;
    vendor_id: string | null;
    created: string | null;
    updated: string | null;
    tracker_type_id: string | null;
  } | null;
  keypad: string[] | null;
}
