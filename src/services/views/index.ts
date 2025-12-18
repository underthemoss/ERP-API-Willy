import { type MongoClient } from 'mongodb';
import { MongoViewModel } from '../../lib/mongo-view-model';
import { KsqlEsdbAssetMaterializedView } from '../../generated/ksql/KsqlEsdbAssetMaterializedView.generated';
import { KsqlEsdbOrderMaterializedView } from '../../generated/ksql/KsqlEsdbOrderMaterializedView.generated';
import { KsqlEsdbRentalMaterializedView } from '../../generated/ksql/KsqlEsdbRentalMaterializedView.generated';

/**
 * ViewService provides centralized access to MongoDB view models for KSQL-synced collections.
 *
 * This service manages read-only view models for materialized views that are populated
 * by KSQL via Kafka sink connectors. It provides type-safe access to these views throughout
 * the application.
 *
 * @example
 * ```typescript
 * // Query assets from the materialized view
 * const assets = await viewService.assetView.find(
 *   { 'company.id': '123' },
 *   { page: { size: 20, number: 1 } }
 * );
 *
 * // Query orders
 * const orders = await viewService.orderView.find(
 *   { 'details.company_id': '123' }
 * );
 * ```
 */
export class ViewService {
  public readonly assetView: MongoViewModel<KsqlEsdbAssetMaterializedView>;
  public readonly orderView: MongoViewModel<KsqlEsdbOrderMaterializedView>;
  public readonly rentalView: MongoViewModel<KsqlEsdbRentalMaterializedView>;

  constructor(config: {
    assetView: MongoViewModel<KsqlEsdbAssetMaterializedView>;
    orderView: MongoViewModel<KsqlEsdbOrderMaterializedView>;
    rentalView: MongoViewModel<KsqlEsdbRentalMaterializedView>;
  }) {
    this.assetView = config.assetView;
    this.orderView = config.orderView;
    this.rentalView = config.rentalView;
  }
}

/**
 * Factory function to create a ViewService instance
 *
 * This initializes all MongoDB view models with their respective collection names
 * and returns a ViewService that provides centralized access to these views.
 *
 * @param config - Configuration containing the MongoDB client
 * @returns A new ViewService instance with initialized view models
 *
 * @example
 * ```typescript
 * const viewService = createViewService({ mongoClient });
 * ```
 */
export const createViewService = (config: {
  mongoClient: MongoClient;
}): ViewService => {
  // Initialize view models with their respective MongoDB collections
  const assetView = new MongoViewModel<KsqlEsdbAssetMaterializedView>({
    mongoClient: config.mongoClient,
    collectionName: 't3_assets_materialized',
  });

  const orderView = new MongoViewModel<KsqlEsdbOrderMaterializedView>({
    mongoClient: config.mongoClient,
    collectionName: 't3_orders_materialized',
  });

  const rentalView = new MongoViewModel<KsqlEsdbRentalMaterializedView>({
    mongoClient: config.mongoClient,
    collectionName: 't3_rentals_materialized',
  });

  return new ViewService({
    assetView,
    orderView,
    rentalView,
  });
};
