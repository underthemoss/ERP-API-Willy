import { Client } from '@opensearch-project/opensearch';
import { EnvConfig } from '../../config';
import { logger } from '../../lib/logger';
import { UserAuthPayload } from '../../authentication';
import { AuthZ } from '../../lib/authz';

// Import index classes
import { BaseIndex } from './indexes/baseIndex';
import { AssetsIndex } from './indexes/assetsIndex';
import { PimProductsIndex } from './indexes/pimProductsIndex';
import { PimCategoriesIndex } from './indexes/pimCategoriesIndex';
import { OrdersIndex } from './indexes/ordersIndex';
import { RentalsIndex } from './indexes/rentalsIndex';
import { PricesIndex } from './indexes/pricesIndex';

export interface OpenSearchOptions {
  query?: string;
  filters?: Record<string, unknown>;
  size?: number;
}

export interface OpenSearchResult<T = unknown> {
  hits: T[];
  total: number;
}

export class OpenSearchServiceError extends Error {
  constructor(
    message: string,
    public statusCode: number,
  ) {
    super(message);
    this.name = 'OpenSearchServiceError';
  }
}

export class OpenSearchService {
  private openSearchClient: Client;
  private envConfig: EnvConfig;
  private indexes: Map<string, BaseIndex>;
  private authZ: AuthZ;

  constructor(config: { envConfig: EnvConfig; authZ: AuthZ }) {
    this.envConfig = config.envConfig;
    this.authZ = config.authZ;

    // Create OpenSearch client internally
    this.openSearchClient = new Client({
      node: config.envConfig.OPENSEARCH_ENDPOINT,
    });

    // Create all Searchkit index instances
    const indexConfig = { envConfig: config.envConfig, authZ: config.authZ };
    this.indexes = new Map<string, BaseIndex>([
      ['t3_assets', new AssetsIndex(indexConfig)],
      ['t3_pim_products', new PimProductsIndex(indexConfig)],
      ['t3_pim_categories', new PimCategoriesIndex(indexConfig)],
      ['t3_orders', new OrdersIndex(indexConfig)],
      ['t3_rentals', new RentalsIndex(indexConfig)],
      ['es_erp_prices', new PricesIndex(indexConfig)],
    ]);
  }

  // ─────────────────────────────────────────────────────────────
  // Service-layer API (raw OpenSearch queries)
  // ─────────────────────────────────────────────────────────────

  /**
   * Search and return matching document IDs only
   * Use when you'll fetch full documents from MongoDB
   */
  async searchIds(
    indexName: string,
    options: OpenSearchOptions,
  ): Promise<string[]> {
    const index = this.indexes.get(indexName);
    const body = this.buildQuery(index, options);

    logger.info({ indexName, body }, 'OpenSearch searchIds query');

    const response = await this.openSearchClient.search({
      index: indexName,
      body: {
        ...body,
        _source: false,
      },
    });

    logger.info({ response, indexName }, 'OpenSearch searchIds response');

    return response.body.hits.hits.map((hit: { _id: string }) => hit._id);
  }

  /**
   * Search and return full documents from OpenSearch
   */
  async search<T = unknown>(
    indexName: string,
    options: OpenSearchOptions,
  ): Promise<OpenSearchResult<T>> {
    const index = this.indexes.get(indexName);
    const body = this.buildQuery(index, options);

    logger.info({ indexName, body }, 'OpenSearch search query');

    const response = await this.openSearchClient.search({
      index: indexName,
      body,
    });

    const hits = response.body.hits.hits as Array<{ _source: T }>;
    const total = response.body.hits.total;
    const totalCount = typeof total === 'number' ? total : (total?.value ?? 0);

    return {
      hits: hits.map((hit) => hit._source as T),
      total: totalCount,
    };
  }

  // ─────────────────────────────────────────────────────────────
  // InstantSearch/Searchkit API (for HTTP plugin)
  // ─────────────────────────────────────────────────────────────

  /**
   * Handle InstantSearch request body via Searchkit
   * Used by the Fastify HTTP plugin
   */
  async handleInstantSearchRequest(
    indexName: string,
    body: unknown,
    user: UserAuthPayload,
  ) {
    const index = this.getIndex(indexName);
    if (!index) {
      throw new OpenSearchServiceError(`Invalid index: ${indexName}`, 400);
    }

    // Extract and authorize filters from the request body
    const filters = this.extractFiltersFromBody(body);
    await index.authorizeFilters(user, filters);

    return index.getClient().handleRequest(body, {
      getBaseFilters: () => index.getBaseFilters(user),
      hooks: {
        beforeSearch: async (requests) => {
          logger.info(
            { requests, indexName },
            'handleInstantSearchRequest: OpenSearch request bodies',
          );
          return requests;
        },
        afterSearch: async (requests, responses) => {
          logger.info(
            { requests, responses, indexName },
            'handleInstantSearchRequest: OpenSearch responses',
          );
          return responses;
        },
      },
    });
  }

  /**
   * Extract filters from an InstantSearch request body
   */
  private extractFiltersFromBody(body: unknown): Record<string, unknown> {
    const filters: Record<string, unknown> = {};

    if (!body || !Array.isArray(body)) {
      return filters;
    }

    for (const request of body) {
      if (request && typeof request === 'object' && 'params' in request) {
        const params = request.params as Record<string, unknown>;

        // Extract facetFilters (format: ["field:value", ...] or [["field:value"]])
        if (params.facetFilters) {
          this.parseFacetFilters(params.facetFilters, filters);
        }

        // Extract numericFilters (format: ["field>=value", ...])
        if (params.numericFilters) {
          this.parseNumericFilters(params.numericFilters, filters);
        }

        // Extract filters string (Algolia filter syntax)
        if (typeof params.filters === 'string' && params.filters) {
          this.parseFilterString(params.filters, filters);
        }
      }
    }

    return filters;
  }

  private parseFacetFilters(
    facetFilters: unknown,
    filters: Record<string, unknown>,
  ): void {
    const parseFacetItem = (item: unknown): void => {
      if (typeof item === 'string') {
        const [key, value] = item.split(':');
        if (key && value !== undefined) {
          if (filters[key] === undefined) {
            filters[key] = value;
          } else if (Array.isArray(filters[key])) {
            (filters[key] as unknown[]).push(value);
          } else {
            filters[key] = [filters[key], value];
          }
        }
      } else if (Array.isArray(item)) {
        for (const subItem of item) {
          parseFacetItem(subItem);
        }
      }
    };

    if (Array.isArray(facetFilters)) {
      for (const item of facetFilters) {
        parseFacetItem(item);
      }
    }
  }

  private parseNumericFilters(
    numericFilters: unknown,
    filters: Record<string, unknown>,
  ): void {
    if (!Array.isArray(numericFilters)) return;

    for (const filter of numericFilters) {
      if (typeof filter === 'string') {
        // Match patterns like "field>=value", "field=value", etc.
        const match = filter.match(/^([^<>=!]+)([<>=!]+)(.+)$/);
        if (match) {
          const [, key, , value] = match;
          filters[key.trim()] = value.trim();
        }
      }
    }
  }

  private parseFilterString(
    filterString: string,
    filters: Record<string, unknown>,
  ): void {
    // Basic parsing for "field:value" patterns in filter strings
    const matches = filterString.matchAll(/(\w+):["']?([^"'\s]+)["']?/g);
    for (const match of matches) {
      const [, key, value] = match;
      if (key && value) {
        filters[key] = value;
      }
    }
  }

  /**
   * Get index by name (exact match or prefix match for replicas)
   */
  getIndex(indexName: string): BaseIndex | undefined {
    // Try exact match first
    let index = this.indexes.get(indexName);

    // Try prefix match for replica/sort indices
    if (!index) {
      for (const [key, idx] of this.indexes) {
        if (indexName.startsWith(key)) {
          index = idx;
          break;
        }
      }
    }

    return index;
  }

  /**
   * Get base filters for an index (useful for external authorization checks)
   */
  getBaseFilters(indexName: string, user: UserAuthPayload) {
    const index = this.getIndex(indexName);
    return index?.getBaseFilters(user) ?? [];
  }

  // ─────────────────────────────────────────────────────────────
  // Private helpers
  // ─────────────────────────────────────────────────────────────

  private buildQuery(
    index: BaseIndex | undefined,
    options: OpenSearchOptions,
  ): Record<string, unknown> {
    const must: unknown[] = [];
    const filter: unknown[] = [];

    // Text search with weighted fields from index config
    if (options.query) {
      const searchSettings = index?.getSearchSettings();
      const searchAttributes = searchSettings?.search_attributes;

      if (searchAttributes && searchAttributes.length > 0) {
        must.push({
          multi_match: {
            query: options.query,
            type: 'best_fields',
            fuzziness: searchSettings?.fuzziness ?? 'AUTO',
            fields: searchAttributes.map((attr) =>
              typeof attr === 'string'
                ? attr
                : `${attr.field}^${attr.weight ?? 1}`,
            ),
          },
        });
      } else {
        must.push({
          multi_match: {
            query: options.query,
            type: 'best_fields',
            fuzziness: 'AUTO',
          },
        });
      }
    }

    // Filters
    if (options.filters) {
      for (const [key, value] of Object.entries(options.filters)) {
        if (value !== undefined) {
          filter.push({ term: { [key]: value } });
        }
      }
    }

    return {
      size: options.size ?? 500,
      query: {
        bool: {
          ...(must.length > 0 && { must }),
          ...(filter.length > 0 && { filter }),
        },
      },
    };
  }

  /**
   * Close connections (for graceful shutdown)
   */
  async close(): Promise<void> {
    await this.openSearchClient.close();
  }
}

export const createOpenSearchService = (config: {
  envConfig: EnvConfig;
  authZ: AuthZ;
}): OpenSearchService => {
  return new OpenSearchService(config);
};

// Re-export types that might be needed
export { BaseIndex } from './indexes/baseIndex';
