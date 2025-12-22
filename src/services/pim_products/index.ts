import { type MongoClient } from 'mongodb';
import {
  PimProductsModel,
  createPimProductsModel,
  PimProductUpsertInput,
  ListPimProductsQuery as ModelListPimProductsQuery,
} from './model';
import { UserAuthPayload } from '../../authentication';
import { PimProductsSinkConnector } from './kafka-sink-connector';
import { EnvConfig } from '../../config';
import type { KafkaJS } from '@confluentinc/kafka-javascript';
import { OpenSearchService } from '../opensearch';

// DTOs
export type { PimProductDoc as PimProduct } from './model';

type ListPimProductsQuery = Omit<ModelListPimProductsQuery, 'filter'> & {
  filter: Omit<ModelListPimProductsQuery['filter'], 'tenant_id'> & {
    searchTerm?: string;
  };
};

export class PimProductsService {
  private model: PimProductsModel;
  private envConfig: EnvConfig;
  private openSearchService: OpenSearchService;

  constructor(config: {
    model: PimProductsModel;
    envConfig: EnvConfig;
    openSearchService: OpenSearchService;
  }) {
    this.model = config.model;
    this.envConfig = config.envConfig;
    this.openSearchService = config.openSearchService;
  }

  async upsertPimProduct(
    id: string,
    input: Omit<PimProductUpsertInput, 'tenant_id'>,
    user?: UserAuthPayload,
  ) {
    return this.model.upsertPimProduct(id, {
      ...input,
      tenant_id: this.envConfig.PIM_GLOBAL_TENANT_ID,
    });
  }

  async listPimProducts(query: ListPimProductsQuery, user?: UserAuthPayload) {
    const filter = {
      ...query.filter,
      tenant_id: this.envConfig.PIM_GLOBAL_TENANT_ID,
    };

    if (filter.searchTerm) {
      const matchedIds = await this.openSearchService.searchIds(
        't3_pim_products',
        {
          query: filter.searchTerm,
          filters: {
            'data.tenant.id': this.envConfig.PIM_GLOBAL_TENANT_ID,
            'data.is_deleted': false,
          },
        },
      );

      if (matchedIds.length === 0) {
        return {
          items: [],
          page: {
            number: 1,
            size: 0,
            totalItems: 0,
            totalPages: 0,
          },
        };
      }

      filter.ids = matchedIds;
    }

    const [items, count] = await Promise.all([
      this.model.listPimProducts({ filter, page: query.page }),
      this.model.countPimProducts(filter),
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

  async countPimProducts(
    inputFilter: ListPimProductsQuery['filter'],
    user?: UserAuthPayload,
  ) {
    return this.model.countPimProducts({
      ...inputFilter,
      tenant_id: this.envConfig.PIM_GLOBAL_TENANT_ID,
    });
  }

  async getPimProductById(id: string, user?: UserAuthPayload) {
    return this.model.getPimProductById(id);
  }

  async batchGetPimProductsById(ids: readonly string[]) {
    return this.model.batchGetPimProductsById(ids);
  }
}

export const createPimProductsService = async (config: {
  envConfig: EnvConfig;
  mongoClient: MongoClient;
  kafkaClient: KafkaJS.Kafka;
  openSearchService: OpenSearchService;
}) => {
  const model = createPimProductsModel(config);
  const pimProductsService = new PimProductsService({
    model,
    envConfig: config.envConfig,
    openSearchService: config.openSearchService,
  });
  const pimProductsSinkConnector = new PimProductsSinkConnector({
    envConfig: config.envConfig,
    kafka: config.kafkaClient,
    model,
  });
  await pimProductsSinkConnector.start();
  return pimProductsService;
};
