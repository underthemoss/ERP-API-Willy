/***
 * DO NOT MODIFY THIS FILE BY HAND
 * This file was generated from ksqlDB table schema
 * Source: ESDB_ORDER_MATERIALIZED_VIEW
 */

export interface KsqlEsdbOrderMaterializedView {
  order_id: string;
  details: {
    order_id: string | null;
    order_status_id: string | null;
    order_status_name: string | null;
    company_id: string | null;
    company_name: string | null;
    user_id: string | null;
    user_first_name: string | null;
    user_last_name: string | null;
    user_email: string | null;
    date_created: string | null;
    date_updated: string | null;
  } | null;
  rentals:
    | {
        rental_id: string | null;
        borrower_user_id: string | null;
        rental_status_id: string | null;
        start_date: string | null;
        end_date: string | null;
        price: string | null;
        order_id: string | null;
        asset_id: string | null;
        asset_name: string | null;
        asset_description: string | null;
        asset_company_id: string | null;
        asset_company_name: string | null;
        status_id: string | null;
        status_name: string | null;
      }[]
    | null;
}
