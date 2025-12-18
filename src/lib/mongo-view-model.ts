import {
  type MongoClient,
  type Db,
  type Collection,
  type Filter,
  type WithId,
} from 'mongodb';

/**
 * Configuration options for MongoViewModel
 */
export interface MongoViewModelConfig {
  mongoClient: MongoClient;
  collectionName: string;
  dbName?: string;
}

/**
 * Pagination options for queries
 */
export interface PaginationOptions {
  size?: number;
  number?: number;
}

/**
 * Query options with pagination
 */
export interface QueryOptions {
  page?: PaginationOptions;
}

/**
 * Generic MongoDB View Model for read-only KSQL-synced collections
 *
 * This class provides a type-safe, read-only interface for querying MongoDB collections
 * that are populated by KSQL materialized views via Kafka sink connectors.
 *
 * @example
 * ```typescript
 * import { MongoViewModel } from './lib/mongo-view-model';
 * import { KsqlEsdbAssetMaterializedView } from './generated/ksql/KsqlEsdbAssetMaterializedView.generated';
 *
 * // Create a view model instance
 * const assetViewModel = new MongoViewModel<KsqlEsdbAssetMaterializedView>({
 *   mongoClient,
 *   collectionName: 'asset_materialized_views',
 * });
 *
 * // Query with filters
 * const assets = await assetViewModel.find(
 *   { 'company.id': '123' },
 *   { page: { size: 20, number: 1 } }
 * );
 *
 * // Get a single document
 * const asset = await assetViewModel.findOne({ asset_id: 'abc123' });
 *
 * // Count documents
 * const total = await assetViewModel.count({ 'company.id': '123' });
 *
 * // Batch get by IDs
 * const assets = await assetViewModel.batchGetByIds(
 *   ['id1', 'id2', 'id3'],
 *   '_id' // ID field name
 * );
 * ```
 *
 * @template TDoc - The document type for the MongoDB collection
 */
export class MongoViewModel<TDoc extends Record<string, any>> {
  private client: MongoClient;
  private dbName: string;
  private collectionName: string;
  private db: Db;
  private collection: Collection<TDoc>;

  constructor(config: MongoViewModelConfig) {
    this.client = config.mongoClient;
    this.dbName = config.dbName || 'es-erp';
    this.collectionName = config.collectionName;
    this.db = this.client.db(this.dbName);
    this.collection = this.db.collection<TDoc>(this.collectionName);
  }

  /**
   * Find documents matching a filter with optional pagination
   *
   * @param filter - MongoDB filter criteria
   * @param options - Query options including pagination
   * @returns Array of documents matching the filter
   *
   * @example
   * ```typescript
   * const results = await viewModel.find(
   *   { 'company.id': '123', deleted: false },
   *   { page: { size: 50, number: 2 } }
   * );
   * ```
   */
  async find(
    filter: Filter<TDoc> = {},
    options?: QueryOptions,
  ): Promise<WithId<TDoc>[]> {
    const limit = options?.page?.size ?? 10;
    const skip = options?.page?.number ? (options.page.number - 1) * limit : 0;

    return this.collection.find(filter, { limit, skip }).toArray();
  }

  /**
   * Find a single document matching the filter
   *
   * @param filter - MongoDB filter criteria
   * @returns The first document matching the filter, or null if not found
   *
   * @example
   * ```typescript
   * const asset = await viewModel.findOne({ asset_id: 'abc123' });
   * ```
   */
  async findOne(filter: Filter<TDoc>): Promise<WithId<TDoc> | null> {
    return this.collection.findOne(filter);
  }

  /**
   * Count documents matching a filter
   *
   * @param filter - MongoDB filter criteria
   * @returns The count of documents matching the filter
   *
   * @example
   * ```typescript
   * const total = await viewModel.count({ 'company.id': '123' });
   * ```
   */
  async count(filter: Filter<TDoc> = {}): Promise<number> {
    return this.collection.countDocuments(filter);
  }

  /**
   * Batch get documents by IDs
   *
   * This method efficiently retrieves multiple documents by their IDs in a single query,
   * returning results in the same order as the input IDs. Returns null for IDs not found.
   *
   * @param ids - Array of ID values to retrieve
   * @param idField - The field name to use as the ID (defaults to '_id')
   * @param filter - Optional additional filter criteria
   * @returns Array of documents (or null) in the same order as input IDs
   *
   * @example
   * ```typescript
   * // Using _id field
   * const docs = await viewModel.batchGetByIds(['id1', 'id2', 'id3']);
   *
   * // Using custom ID field
   * const assets = await viewModel.batchGetByIds(
   *   ['asset1', 'asset2'],
   *   'asset_id',
   *   { deleted: false }
   * );
   * ```
   */
  async batchGetByIds<K extends keyof WithId<TDoc>>(
    ids: readonly (string | number)[],
    idField: K = '_id' as K,
    filter?: Filter<TDoc>,
  ): Promise<(WithId<TDoc> | null)[]> {
    if (ids.length === 0) {
      return [];
    }

    // Remove duplicates while preserving order
    const uniqueIds = Array.from(new Set(ids));

    // Build query
    const query: Filter<TDoc> = {
      [idField]: { $in: uniqueIds },
      ...filter,
    } as Filter<TDoc>;

    // Fetch documents
    const docs = await this.collection.find(query).toArray();

    // Create a map for O(1) lookup
    const docMap = new Map(docs.map((doc) => [String(doc[idField]), doc]));

    // Return in the same order as requested, with nulls for missing docs
    return ids.map((id) => docMap.get(String(id)) || null);
  }

  /**
   * Get the raw MongoDB collection for advanced operations
   *
   * Use this method when you need to perform operations not covered by the view model,
   * such as aggregations or custom queries.
   *
   * @returns The underlying MongoDB collection
   *
   * @example
   * ```typescript
   * const collection = viewModel.getCollection();
   * const aggregation = await collection.aggregate([
   *   { $match: { 'company.id': '123' } },
   *   { $group: { _id: '$type.id', count: { $sum: 1 } } }
   * ]).toArray();
   * ```
   */
  getCollection(): Collection<TDoc> {
    return this.collection;
  }

  /**
   * Get the database name
   *
   * @returns The database name
   */
  getDbName(): string {
    return this.dbName;
  }

  /**
   * Get the collection name
   *
   * @returns The collection name
   */
  getCollectionName(): string {
    return this.collectionName;
  }
}

/**
 * Factory function to create a MongoViewModel instance
 *
 * This follows the naming convention used in the codebase for creating model instances.
 *
 * @param config - Configuration for the view model
 * @returns A new MongoViewModel instance
 *
 * @example
 * ```typescript
 * const assetViewModel = createMongoViewModel<KsqlEsdbAssetMaterializedView>({
 *   mongoClient,
 *   collectionName: 'asset_materialized_views',
 * });
 * ```
 */
export const createMongoViewModel = <TDoc extends Record<string, any>>(
  config: MongoViewModelConfig,
): MongoViewModel<TDoc> => {
  return new MongoViewModel<TDoc>(config);
};
