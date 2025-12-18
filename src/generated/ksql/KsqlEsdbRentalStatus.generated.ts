/***
 * DO NOT MODIFY THIS FILE BY HAND
 * This file was generated from ksqlDB table schema
 * Source: ESDB_RENTAL_STATUS
 */

export interface KsqlEsdbRentalStatus {
  rental_id: string;
  status: {
    id: string | null;
    name: string | null;
  } | null;
}
