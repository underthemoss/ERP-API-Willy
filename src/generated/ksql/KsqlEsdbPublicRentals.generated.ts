/***
 * DO NOT MODIFY THIS FILE BY HAND
 * This file was generated from ksqlDB table schema
 * Source: ESDB_PUBLIC_RENTALS
 */

export interface KsqlEsdbPublicRentals {
  rental_id: string;
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
}
