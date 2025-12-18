/***
 * DO NOT MODIFY THIS FILE BY HAND
 * This file was generated from ksqlDB table schema
 * Source: ESDB_ORDER_WITH_RENTALS
 */

export interface KsqlEsdbOrderWithRentals {
  order_id: string;
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
