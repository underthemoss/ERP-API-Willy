/***
 * DO NOT MODIFY THIS FILE BY HAND
 * This file was generated from ksqlDB table schema
 * Source: ESDB_ORDER_WITH_COMPANY
 */

export interface KsqlEsdbOrderWithCompany {
  order_id: string;
  order_status_id: string | null;
  order_status_name: string | null;
  company_id: string | null;
  company_name: string | null;
  user_id: string | null;
  date_created: string | null;
  date_updated: string | null;
}
