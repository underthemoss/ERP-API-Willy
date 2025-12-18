/***
 * DO NOT MODIFY THIS FILE BY HAND
 * This file was generated from ksqlDB table schema
 * Source: ESDB_ASSET_TRACKER
 */

export interface KsqlEsdbAssetTracker {
  asset_id: string;
  tracker: {
    id: string | null;
    device_serial: string | null;
    company_id: string | null;
    vendor_id: string | null;
    created: string | null;
    updated: string | null;
    tracker_type_id: string | null;
  } | null;
}
