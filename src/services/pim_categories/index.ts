import { type MongoClient } from 'mongodb';
import {
  PimCategoriesModel,
  createPimCategoriesModel,
  PimCategoryUpsertInput,
  ListPimCategoriesQuery as ModelListPimCategoriesQuery,
} from './model';
import { UserAuthPayload } from '../../authentication';
import { PimCategoriesSinkConnector } from './kafka-sink-connector';
import { EnvConfig } from '../../config';
import type { KafkaJS } from '@confluentinc/kafka-javascript';

// DTOs
export type { PimCategoryDoc as PimCategory } from './model';

type ListPimCategoriesQuery = Omit<ModelListPimCategoriesQuery, 'filter'> & {
  filter: Omit<ModelListPimCategoriesQuery['filter'], 'tenant_id'>;
};

export class PimCategoriesService {
  private model: PimCategoriesModel;
  private envConfig: EnvConfig;

  constructor(config: { model: PimCategoriesModel; envConfig: EnvConfig }) {
    this.model = config.model;
    this.envConfig = config.envConfig;
  }

  async upsertPimCategory(
    id: string,
    input: Omit<PimCategoryUpsertInput, 'tenant_id'>,
    user?: UserAuthPayload,
  ) {
    await this.model.upsertPimCategory(id, {
      ...input,
      tenant_id: this.envConfig.PIM_GLOBAL_TENANT_ID,
    });

    return this.model.getPimCategoryById(id);
  }

  async listPimCategories(
    query: ListPimCategoriesQuery,
    user?: UserAuthPayload,
  ) {
    const { filter: inputFilter, page } = query;
    const filter = {
      ...inputFilter,
      tenant_id: this.envConfig.PIM_GLOBAL_TENANT_ID,
    };

    const [items, count] = await Promise.all([
      this.model.listPimCategories({ filter, page }),
      this.model.countPimCategories(filter),
    ]);

    return {
      items,
      page: {
        number: 1,
        size: items.length,
        totalItems: count,
        totalPages: Math.ceil(count / items.length) || 0,
      },
    };
  }

  async countPimCategories(
    query: ListPimCategoriesQuery,
    user?: UserAuthPayload,
  ) {
    return this.model.countPimCategories({
      ...query.filter,
      tenant_id: this.envConfig.PIM_GLOBAL_TENANT_ID,
    });
  }

  async getPimCategoryById(id: string, user?: UserAuthPayload) {
    return this.model.getPimCategoryById(id);
  }

  /**
   * Batch fetches PIM categories by their IDs, returning results in the same order as input.
   * If a category is not found, null is returned in its place.
   */
  async batchGetPimCategoriesById(ids: readonly string[]) {
    return this.model.batchGetPimCategoriesById(ids);
  }

  /**
   * Batch fetches PIM categories by their IDs and returns a Map for efficient lookup.
   * Only returns categories that exist and the user has access to.
   */
  async batchGetPimCategoriesByIdsAsMap(
    ids: string[],
    user?: UserAuthPayload,
  ): Promise<Map<string, { name: string; path: string }>> {
    const categories = await this.model.batchGetPimCategoriesById(ids);
    const categoryMap = new Map<string, { name: string; path: string }>();

    categories.forEach((category, index) => {
      if (category) {
        categoryMap.set(ids[index], {
          name: category.name,
          path: category.path,
        });
      }
    });

    return categoryMap;
  }
}

export const createPimCategoriesService = async (config: {
  envConfig: EnvConfig;
  mongoClient: MongoClient;
  kafkaClient: KafkaJS.Kafka;
}) => {
  const model = createPimCategoriesModel(config);
  const pimCategoriesService = new PimCategoriesService({
    model,
    envConfig: config.envConfig,
  });
  const pimCategoriesSinkConnector = new PimCategoriesSinkConnector({
    envConfig: config.envConfig,
    kafka: config.kafkaClient,
    model,
  });
  await pimCategoriesSinkConnector.start();
  return pimCategoriesService;
};
