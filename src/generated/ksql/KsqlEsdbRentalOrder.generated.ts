/***
 * DO NOT MODIFY THIS FILE BY HAND
 * This file was generated from ksqlDB table schema
 * Source: ESDB_RENTAL_ORDER
 */

export interface KsqlEsdbRentalOrder {
  rental_id: string;
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
