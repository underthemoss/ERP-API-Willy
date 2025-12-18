/***
 * DO NOT MODIFY THIS FILE BY HAND
 * This file was generated using npm run avro-ts-codegen
 * Topic: public_data_catalog_assets
 * Schema version: 2
 */

export type AvroType = DataCatalogAssetSchema;

/**
 * Schema for representing an asset.
 */
export interface DataCatalogAssetSchema {
  /**
   * Id of the asset
   *
   * Default: null
   */
  asset_id: null | number;
  /**
   * Type Id of the asset
   *
   * Default: null
   */
  asset_type_id: null | number;
  /**
   * The custom name of the asset
   *
   * Default: null
   */
  custom_name: null | string;
  /**
   * The description of the asset
   *
   * Default: null
   */
  description: null | string;
  /**
   * The year of the asset
   *
   * Default: null
   */
  year: null | number;
  /**
   * The model name of the asset
   *
   * Default: null
   */
  model: null | string;
  /**
   * Id of the company
   *
   * Default: null
   */
  company_id: null | number;
  /**
   * The id of the tracker assigned to the asset
   *
   * Default: null
   */
  tracker_id: null | number;
  /**
   * The id of the asset settings
   *
   * Default: null
   */
  asset_settings_id: null | number;
  /**
   * The id of the photo of the asset
   *
   * Default: null
   */
  photo_id: null | number;
  /**
   * The id of the time fence of the asset
   *
   * Default: null
   */
  time_fence_id: null | number;
  /**
   * The id of the equipment make of the asset
   *
   * Default: null
   */
  equipment_make_id: null | number;
  /**
   * The deleted flag of the asset
   *
   * Default: null
   */
  deleted: null | boolean;
  /**
   * The creation date of the asset
   *
   * Default: null
   */
  date_created: null | string;
  /**
   * The updated date of the asset
   *
   * Default: null
   */
  date_updated: null | string;
  /**
   * The id of the market of the asset
   *
   * Default: null
   */
  market_id: null | number;
  /**
   * The id of the maintenance group of the asset
   *
   * Default: null
   */
  maintenance_group_id: null | number;
  /**
   * The id of the camera on the asset
   *
   * Default: null
   */
  camera_id: null | number;
  /**
   * The id of the service provider company of the asset
   *
   * Default: null
   */
  service_provider_company_id: null | number;
  /**
   * The hours assigned to the asset
   *
   * Default: null
   */
  hours: null | number;
  /**
   * The odometer of the asset
   *
   * Default: null
   */
  odometer: null | number;
  /**
   * The elog device id of the asset
   *
   * Default: null
   */
  elog_device_id: null | number;
  /**
   * The id of the analog to digital fuel level curve of the asset
   *
   * Default: null
   */
  analog_to_digital_fuel_level_curve_id: null | number;
  /**
   * The total idle seconds of the asset
   *
   * Default: null
   */
  total_idle_seconds: null | number;
  /**
   * The payout percentage of the asset
   *
   * Default: null
   */
  payout_percentage: null | number;
  /**
   * The total fuel usesr in liters for the asset
   *
   * Default: null
   */
  total_fuel_used_liters: null | number;
  /**
   * The total idle fuel user in liters for the asset
   *
   * Default: null
   */
  total_idle_fuel_used_liters: null | number;
  /**
   * The vin of the asset
   *
   * Default: null
   */
  vin: null | string;
  /**
   * The name of the driver on the asset
   *
   * Default: null
   */
  driver_name: null | string;
  /**
   * The name of the asset
   *
   * Default: null
   */
  name: null | string;
  /**
   * The serial number of the asset
   *
   * Default: null
   */
  serial_number: null | string;
  /**
   * The price per hour for the asset
   *
   * Default: null
   */
  price_per_hour: null | number;
  /**
   * The price per day for the asset
   *
   * Default: null
   */
  price_per_day: null | number;
  /**
   * The price per week for the asset
   *
   * Default: null
   */
  price_per_week: null | number;
  /**
   * The price per month for the asset
   *
   * Default: null
   */
  price_per_month: null | number;
  /**
   * The available for rent flag for the asset
   *
   * Default: null
   */
  available_for_rent: null | boolean;
  /**
   * The purchase price for the asset
   *
   * Default: null
   */
  purchase_price: null | number;
  /**
   * The weekly minimum flag for the asset
   *
   * Default: null
   */
  weekly_minimum: null | boolean;
  /**
   * The weight in lbs for the asset
   *
   * Default: null
   */
  weight_lbs: null | number;
  /**
   * The id of the category for the asset
   *
   * Default: null
   */
  category_id: null | number;
  /**
   * The id of the location of the asset
   *
   * Default: null
   */
  location_id: null | number;
  /**
   * The id of the equipment condition of the asset
   *
   * Default: null
   */
  equipment_condition_id: null | number;
  /**
   * The id of the equipment model of the asset
   *
   * Default: null
   */
  equipment_model_id: null | number;
  /**
   * The elogs certified flag for the asset
   *
   * Default: null
   */
  elogs_certified: null | boolean;
  /**
   * The id of the service branch of the asset
   *
   * Default: null
   */
  service_branch_id: null | number;
  /**
   * The id of the inventory branch of the asset
   *
   * Default: null
   */
  inventory_branch_id: null | number;
  /**
   * The id of the rental branch of the asset
   *
   * Default: null
   */
  rental_branch_id: null | number;
  /**
   * The placed in service date of the asset
   *
   * Default: null
   */
  placed_in_service: null | string;
  /**
   * The available to rapid rent flag of the asset
   *
   * Default: null
   */
  available_to_rapid_rent: null | boolean;
  /**
   * The id of the dot number of the asset
   *
   * Default: null
   */
  dot_number_id: null | number;
  /**
   * The id of the batery voltage type of the asset
   *
   * Default: null
   */
  battery_voltage_type_id: null | number;
  /**
   * The id of the equipment class of the asset
   *
   * Default: null
   */
  equipment_class_id: null | number;
  /**
   * The id of the pim product for the asset
   *
   * Default: null
   */
  pim_product_id: null | string;
  /**
   * License plate number assigned to the asset
   *
   * Default: null
   */
  license_plate_number: null | string;
  /**
   * Issuing state of the license plate
   *
   * Default: null
   */
  license_plate_state: null | string;
}
