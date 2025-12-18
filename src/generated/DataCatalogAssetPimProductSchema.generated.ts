/***
 * DO NOT MODIFY THIS FILE BY HAND
 * This file was generated using npm run avro-ts-codegen
 * Topic: public_data_catalog_assets_pim_products
 * Schema version: 2
 */

export type AvroType = DataCatalogAssetPimProductSchema;

export interface Pim_product_record {
  /**
   * The pim product platform id
   *
   * Default: null
   */
  platform_id: null | string;
  /**
   * The pim product name
   *
   * Default: null
   */
  name: null | string;
  /**
   * The pim product model
   *
   * Default: null
   */
  model: null | string;
  /**
   * The pim product year
   *
   * Default: null
   */
  year: null | string;
  /**
   * The pim product variant
   *
   * Default: null
   */
  variant: null | string;
  /**
   * The pim product part number
   *
   * Default: null
   */
  part_number: null | string;
  /**
   * The pim product deleted flag
   *
   * Default: null
   */
  is_deleted: null | boolean;
}

export interface Pim_make_record {
  /**
   * The pim product make name
   *
   * Default: null
   */
  make: null | string;
  /**
   * The pim product make platform id
   *
   * Default: null
   */
  make_id: null | string;
}

export interface Pim_category_record {
  /**
   * The pim product category platform id
   *
   * Default: null
   */
  category_id: null | string;
  /**
   * The pim product category path
   *
   * Default: null
   */
  category_path: null | string;
  /**
   * The pim product category name
   *
   * Default: null
   */
  category_name: null | string;
}

/**
 * Schema for representing a pim product with asset relationship.
 */
export interface DataCatalogAssetPimProductSchema {
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
   * The pim product values
   *
   * Default: null
   */
  pim_product: null | Pim_product_record;
  /**
   * The pim product make values
   *
   * Default: null
   */
  pim_make: null | Pim_make_record;
  /**
   * The pim product category values
   *
   * Default: null
   */
  pim_category: null | Pim_category_record;
}
