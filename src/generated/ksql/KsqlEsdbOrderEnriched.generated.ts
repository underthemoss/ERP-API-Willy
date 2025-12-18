/***
 * DO NOT MODIFY THIS FILE BY HAND
 * This file was generated from ksqlDB table schema
 * Source: ESDB_ORDER_ENRICHED
 */

export interface KsqlEsdbOrderEnriched {
  order_id: string;
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
}
