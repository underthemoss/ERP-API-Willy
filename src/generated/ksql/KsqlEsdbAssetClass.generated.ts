/***
 * DO NOT MODIFY THIS FILE BY HAND
 * This file was generated from ksqlDB table schema
 * Source: ESDB_ASSET_CLASS
 */

export interface KsqlEsdbAssetClass {
  asset_id: string;
  class: {
    id: string | null;
    name: string | null;
    description: string | null;
  } | null;
}
