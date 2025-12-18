/***
 * DO NOT MODIFY THIS FILE BY HAND
 * This file was generated from ksqlDB table schema
 * Source: ESDB_ASSET_RSP_BRANCH
 */

export interface KsqlEsdbAssetRspBranch {
  asset_id: string;
  branch: {
    id: string | null;
    name: string | null;
    description: string | null;
    company_id: string | null;
    company_name: string | null;
  } | null;
}
