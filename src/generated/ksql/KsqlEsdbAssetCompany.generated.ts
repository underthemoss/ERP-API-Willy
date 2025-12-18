/***
 * DO NOT MODIFY THIS FILE BY HAND
 * This file was generated from ksqlDB table schema
 * Source: ESDB_ASSET_COMPANY
 */

export interface KsqlEsdbAssetCompany {
  asset_id: string;
  company: {
    id: string | null;
    name: string | null;
  } | null;
}
