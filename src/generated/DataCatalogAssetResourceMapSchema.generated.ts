/***
 * DO NOT MODIFY THIS FILE BY HAND
 * This file was generated using npm run avro-ts-codegen
 * Topic: public_data_catalog_assets_resources
 * Schema version: 2
 */

export type AvroType = DataCatalogAssetResourceMapSchema;

export interface Resources_record {
  /**
   * The id of the resource
   *
   * Default: null
   */
  resource_id: null | string;
  /**
   * The path to the resource
   *
   * Default: null
   */
  path: null | string;
  /**
   * The value of the resource
   *
   * Default: null
   */
  value: null | string;
  /**
   * The hierarchy id of the resource
   *
   * Default: null
   */
  hierarchy_id: null | string;
  /**
   * The hierarchy name of the resource
   *
   * Default: null
   */
  hierarchy_name: null | string;
}

/**
 * Schema for representing a resource manager resource with asset relationship.
 */
export interface DataCatalogAssetResourceMapSchema {
  /**
   * Id of the asset
   *
   * Default: null
   */
  asset_id: null | number;
  /**
   * Id of the company
   *
   * Default: null
   */
  company_id: null | number;
  /**
   * The resources connected to the asset
   *
   * Default: null
   */
  resources: null | Resources_record[];
}
