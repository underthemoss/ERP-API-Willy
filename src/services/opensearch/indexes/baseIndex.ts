import { UserAuthPayload } from '../../../authentication';
import { SearchSettingsConfig, ElasticsearchQuery } from 'searchkit';
import Client from '@searchkit/api';
import { EnvConfig } from '../../../config';
import { AuthZ } from '../../../lib/authz';

export interface BaseIndexConfig {
  envConfig: EnvConfig;
  authZ: AuthZ;
}

export abstract class BaseIndex {
  abstract readonly indexName: string;
  protected readonly client: ReturnType<typeof Client>;
  protected readonly envConfig: EnvConfig;
  protected readonly authZ: AuthZ;

  constructor(config: BaseIndexConfig) {
    this.envConfig = config.envConfig;
    this.authZ = config.authZ;
    this.client = Client({
      connection: { host: config.envConfig.OPENSEARCH_ENDPOINT },
      search_settings: this.getSearchSettings(),
    });
  }

  abstract getSearchSettings(): SearchSettingsConfig;
  abstract getBaseFilters(user: UserAuthPayload): ElasticsearchQuery[];

  /**
   * Authorize the user to apply the given filters.
   * Override in subclasses to add specific authorization checks.
   * Throws OpenSearchServiceError if unauthorized.
   */
  async authorizeFilters(
    _user: UserAuthPayload,
    _filters: Record<string, unknown>,
  ): Promise<void> {
    // Default implementation: no authorization required
  }

  getClient(): ReturnType<typeof Client> {
    return this.client;
  }
}
