/***
 * DO NOT MODIFY THIS FILE BY HAND
 * This file was generated from ksqlDB table schema
 * Source: ESDB_RENTAL_MATERIALIZED_VIEW
 */

export interface KsqlEsdbRentalMaterializedView {
  rental_id: string;
  details: {
    rental_id: string | null;
    borrower_user_id: string | null;
    rental_status_id: string | null;
    date_created: string | null;
    start_date: string | null;
    end_date: string | null;
    amount_received: string | null;
    price: string | null;
    delivery_charge: string | null;
    return_charge: string | null;
    delivery_required: string | null;
    delivery_instructions: string | null;
    order_id: string | null;
    drop_off_delivery_id: string | null;
    return_delivery_id: string | null;
    price_per_day: string | null;
    price_per_week: string | null;
    price_per_month: string | null;
    start_date_estimated: string | null;
    end_date_estimated: string | null;
    job_description: string | null;
    equipment_class_id: string | null;
    price_per_hour: string | null;
    deleted: string | null;
    rental_protection_plan_id: string | null;
    taxable: string | null;
    asset_id: string | null;
    drop_off_delivery_required: string | null;
    return_delivery_required: string | null;
    lien_notice_sent: string | null;
    off_rent_date_requested: string | null;
    external_id: string | null;
    rental_type_id: string | null;
    part_type_id: string | null;
    quantity: string | null;
    purchase_price: string | null;
    rental_purchase_option_id: string | null;
    rate_type_id: string | null;
    has_re_rent: string | null;
    is_below_floor_rate: string | null;
    is_flat_monthly_rate: string | null;
    is_flexible_rate: string | null;
    inventory_product_id: string | null;
    inventory_product_name: string | null;
    inventory_product_name_historical: string | null;
    one_time_charge: string | null;
    rental_pricing_structure_id: string | null;
  } | null;
  asset: {
    asset_id: string | null;
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
  } | null;
  status: {
    id: string | null;
    name: string | null;
  } | null;
  order: {
    order_id: string | null;
    order_status_id: string | null;
    order_status_name: string | null;
    company_id: string | null;
    company_name: string | null;
    ordered_by_user_id: string | null;
    ordered_by_first_name: string | null;
    ordered_by_last_name: string | null;
    ordered_by_email: string | null;
    date_created: string | null;
    date_updated: string | null;
  } | null;
}
