/***
 * DO NOT MODIFY THIS FILE BY HAND
 * This file was generated from ksqlDB table schema
 * Source: ESDB_ASSET_GROUPS
 */

export interface KsqlEsdbAssetGroups {
  asset_id: string;
  groups:
    | {
        id: string | null;
        name: string | null;
        company_id: string | null;
        company_name: string | null;
      }[]
    | null;
}
