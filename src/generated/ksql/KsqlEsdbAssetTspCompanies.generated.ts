/***
 * DO NOT MODIFY THIS FILE BY HAND
 * This file was generated from ksqlDB table schema
 * Source: ESDB_ASSET_TSP_COMPANIES
 */

export interface KsqlEsdbAssetTspCompanies {
  asset_id: string;
  tsp_companies:
    | {
        company_id: string | null;
        company_name: string | null;
      }[]
    | null;
}
