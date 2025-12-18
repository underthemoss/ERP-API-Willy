import { type MongoClient } from 'mongodb';
import {
  BrandfetchModel,
  createBrandfetchModel,
  BrandUpsertInput,
  BrandDoc,
} from './model';
import { UserAuthPayload } from '../../authentication';
import { EnvConfig } from '../../config';
import { logger } from '../../lib/logger';

interface BrandfetchApiResponse {
  id: string;
  claimed: boolean;
  name?: string;
  domain: string;
  description?: string;
  longDescription?: string;
  links?: Array<{
    name: string;
    url: string;
  }>;
  logos?: Array<{
    theme?: string;
    type?: string;
    formats?: Array<{
      src: string;
      background?: string;
      format?: string;
      height?: number;
      width?: number;
      size?: number;
    }>;
  }>;
  colors?: Array<{
    hex: string;
    type: string;
    brightness?: number;
  }>;
  fonts?: Array<{
    name: string;
    type: string;
    origin?: string;
    originId?: string;
    weights?: number[];
  }>;
  images?: Array<{
    url: string;
    type?: string;
    formats?: Array<{
      src: string;
      background?: string;
      format?: string;
      height?: number;
      width?: number;
      size?: number;
    }>;
  }>;
}

export class BrandfetchService {
  private model: BrandfetchModel;
  private apiKey?: string;
  private searchApiKey?: string;
  private apiBaseUrl = 'https://api.brandfetch.io/v2';
  // TODO: In production, this should be 30 days to comply with Brandfetch terms
  // Using a very large value for development to effectively disable expiry
  private readonly MAX_CACHE_DAYS = 365000; // ~1000 years for dev, should be 30 in production

  constructor(config: {
    model: BrandfetchModel;
    apiKey?: string;
    searchApiKey?: string;
  }) {
    this.model = config.model;
    this.apiKey = config.apiKey;
    this.searchApiKey = config.searchApiKey;
  }

  /**
   * Check if cached brand data is expired (older than 30 days)
   */
  private isCacheExpired(brand: BrandDoc): boolean {
    if (!brand.fetchedFromApiAt) {
      // If no fetchedFromApiAt date, consider it expired to be safe
      return true;
    }

    const now = new Date();
    const fetchedDate = new Date(brand.fetchedFromApiAt);
    const daysDiff =
      (now.getTime() - fetchedDate.getTime()) / (1000 * 60 * 60 * 24);

    return daysDiff > this.MAX_CACHE_DAYS;
  }

  /**
   * Get brand by ID - checks cache first, then API
   */
  getBrandById = async (
    brandId: string,
    user?: UserAuthPayload,
  ): Promise<BrandDoc | null> => {
    // Auth check
    if (!user) {
      throw new Error('User not authenticated');
    }

    // Check cache first
    const cachedBrand = await this.model.getBrandById(brandId);
    if (cachedBrand && !this.isCacheExpired(cachedBrand)) {
      logger.info({ brandId }, 'Brand found in cache and not expired');
      return cachedBrand;
    }

    if (cachedBrand && this.isCacheExpired(cachedBrand)) {
      logger.info(
        { brandId, fetchedFromApiAt: cachedBrand.fetchedFromApiAt },
        'Brand cache expired (>30 days)',
      );
    }

    // If not in cache and no API key, return null
    if (!this.apiKey) {
      logger.warn('Brandfetch API key not configured');
      return null;
    }

    // Fetch from API
    try {
      const brand = await this.fetchBrandFromApi(brandId);
      if (brand) {
        // Cache the result with fetchedFromApi flag
        await this.model.upsertBrand(brandId, brand, user.id, true);
        logger.info({ brandId }, 'Brand fetched from API and cached');

        // Return the cached version to ensure we have all metadata
        return await this.model.getBrandById(brandId);
      }
    } catch (error) {
      logger.error({ error, brandId }, 'Error fetching brand from API');
    }

    return null;
  };

  /**
   * Get brand by domain - checks cache first, then API
   */
  getBrandByDomain = async (
    domain: string,
    user?: UserAuthPayload,
  ): Promise<BrandDoc | null> => {
    // Auth check
    if (!user) {
      throw new Error('User not authenticated');
    }

    // Normalize domain (remove protocol, www, trailing slash)
    const normalizedDomain = this.normalizeDomain(domain);

    // Check cache first
    const cachedBrand = await this.model.getBrandByDomain(normalizedDomain);
    if (cachedBrand && !this.isCacheExpired(cachedBrand)) {
      logger.info(
        { domain: normalizedDomain },
        'Brand found in cache by domain and not expired',
      );
      return cachedBrand;
    }

    if (cachedBrand && this.isCacheExpired(cachedBrand)) {
      logger.info(
        {
          domain: normalizedDomain,
          fetchedFromApiAt: cachedBrand.fetchedFromApiAt,
        },
        'Brand cache expired (>30 days)',
      );
    }

    // If not in cache and no API key, return null
    if (!this.apiKey) {
      logger.warn('Brandfetch API key not configured');
      return null;
    }

    // Fetch from API by domain
    try {
      const response = await fetch(
        `${this.apiBaseUrl}/brands/${normalizedDomain}`,
        {
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            Accept: 'application/json',
          },
        },
      );

      if (!response.ok) {
        if (response.status === 404) {
          logger.info(
            { domain: normalizedDomain },
            'Brand not found in Brandfetch',
          );
          return null;
        }
        throw new Error(`Brandfetch API error: ${response.status}`);
      }

      const apiData: BrandfetchApiResponse = await response.json();
      const brand = this.mapApiResponseToBrand(apiData);

      // Cache the result with fetchedFromApi flag
      await this.model.upsertBrand(apiData.id, brand, user.id, true);
      logger.info(
        { domain: normalizedDomain, brandId: apiData.id },
        'Brand fetched from API by domain and cached',
      );

      // Return the cached version
      return await this.model.getBrandById(apiData.id);
    } catch (error) {
      logger.error(
        { error, domain: normalizedDomain },
        'Error fetching brand by domain from API',
      );
    }

    return null;
  };

  /**
   * Search for brands
   */
  searchBrands = async (
    query: string,
    user?: UserAuthPayload,
  ): Promise<
    Array<{ brandId: string; name: string; domain: string; icon?: string }>
  > => {
    // Auth check
    if (!user) {
      throw new Error('User not authenticated');
    }

    if (!this.searchApiKey) {
      logger.warn('Brandfetch Search API key not configured');
      return [];
    }

    try {
      const response = await fetch(
        `${this.apiBaseUrl}/search/${encodeURIComponent(query)}`,
        {
          headers: {
            Authorization: `Bearer ${this.searchApiKey}`,
            Accept: 'application/json',
          },
        },
      );

      if (!response.ok) {
        throw new Error(`Brandfetch Search API error: ${response.status}`);
      }

      const results = await response.json();

      return results.map((result: any) => ({
        brandId: result.brandId,
        name: result.name,
        domain: result.domain,
        icon: result.icon,
      }));
    } catch (error) {
      logger.error({ error, query }, 'Error searching brands');
      return [];
    }
  };

  /**
   * Batch get brands by IDs
   */
  batchGetBrandsByIds = async (
    brandIds: string[],
    user?: UserAuthPayload,
  ): Promise<(BrandDoc | null)[]> => {
    // Auth check
    if (!user) {
      throw new Error('User not authenticated');
    }

    // Get cached brands
    const cachedBrands = await this.model.batchGetBrandsByIds(brandIds);

    // Find missing brands
    const results: (BrandDoc | null)[] = [];
    const missingIndices: number[] = [];

    brandIds.forEach((id, index) => {
      const cached = cachedBrands[index];
      if (cached && !this.isCacheExpired(cached)) {
        results[index] = cached;
      } else {
        results[index] = null;
        missingIndices.push(index);
        if (cached && this.isCacheExpired(cached)) {
          logger.info(
            { brandId: id, fetchedFromApiAt: cached.fetchedFromApiAt },
            'Brand cache expired in batch',
          );
        }
      }
    });

    // If API key is available, try to fetch missing brands
    if (this.apiKey && missingIndices.length > 0) {
      await Promise.all(
        missingIndices.map(async (index) => {
          const brandId = brandIds[index];
          try {
            const brand = await this.fetchBrandFromApi(brandId);
            if (brand) {
              await this.model.upsertBrand(brandId, brand, user.id, true);
              results[index] = await this.model.getBrandById(brandId);
            }
          } catch (error) {
            logger.error({ error, brandId }, 'Error fetching brand in batch');
          }
        }),
      );
    }

    return results;
  };

  /**
   * Force refresh a brand from the API
   */
  refreshBrand = async (
    brandId: string,
    user?: UserAuthPayload,
  ): Promise<BrandDoc | null> => {
    // Auth check
    if (!user) {
      throw new Error('User not authenticated');
    }

    if (!this.apiKey) {
      throw new Error('Brandfetch API key not configured');
    }

    try {
      const brand = await this.fetchBrandFromApi(brandId);
      if (brand) {
        await this.model.upsertBrand(brandId, brand, user.id, true);
        return await this.model.getBrandById(brandId);
      }
    } catch (error) {
      logger.error({ error, brandId }, 'Error refreshing brand from API');
      throw error;
    }

    return null;
  };

  /**
   * Private helper to fetch brand from API
   */
  private async fetchBrandFromApi(
    brandId: string,
  ): Promise<BrandUpsertInput | null> {
    const response = await fetch(`${this.apiBaseUrl}/brands/${brandId}`, {
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        Accept: 'application/json',
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      throw new Error(`Brandfetch API error: ${response.status}`);
    }

    const apiData: BrandfetchApiResponse = await response.json();
    return this.mapApiResponseToBrand(apiData);
  }

  /**
   * Map API response to our brand model
   * Store the complete raw response without any filtering or reshaping
   */
  private mapApiResponseToBrand(
    apiData: BrandfetchApiResponse,
  ): BrandUpsertInput {
    // Store the complete raw API response as-is
    // This preserves all data from Brandfetch, including any fields we haven't strongly typed yet
    return {
      // Store the complete raw response for full data preservation
      rawApiResponse: apiData,

      // Also spread all fields at the top level for easy access
      // This includes all fields from the API response without any filtering
      ...apiData,
    };
  }

  /**
   * Normalize domain for consistency
   */
  private normalizeDomain(domain: string): string {
    // Remove protocol
    let normalized = domain.replace(/^https?:\/\//, '');
    // Remove www
    normalized = normalized.replace(/^www\./, '');
    // Remove trailing slash
    normalized = normalized.replace(/\/$/, '');
    // Remove path
    normalized = normalized.split('/')[0];
    // Remove port
    normalized = normalized.split(':')[0];

    return normalized.toLowerCase();
  }
}

export const createBrandfetchService = async (config: {
  envConfig: EnvConfig;
  mongoClient: MongoClient;
}) => {
  const model = createBrandfetchModel({ mongoClient: config.mongoClient });

  const brandfetchService = new BrandfetchService({
    model,
    apiKey: config.envConfig.BRANDFETCH_BRAND_API_KEY,
    searchApiKey: config.envConfig.BRANDFETCH_BRAND_SEARCH_API_KEY,
  });

  return brandfetchService;
};

export type { BrandDoc } from './model';
