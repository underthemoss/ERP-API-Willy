import { type MongoClient } from 'mongodb';
import { AssetsModel, createAssetsModel, AssetUpsertInput } from './model';
import { UserAuthPayload } from '../../authentication';
import { AssetsSinkConnector } from './kafka-sink-connector';
import { EnvConfig } from '../../config';
import type { KafkaJS } from '@confluentinc/kafka-javascript';

export class AssetsService {
  private model: AssetsModel;
  constructor(config: { model: AssetsModel }) {
    this.model = config.model;
  }

  upsertAsset = async (
    id: number,
    input: AssetUpsertInput,
    user?: UserAuthPayload,
  ) => {
    // auth
    if (!user) {
      throw new Error('User not authenticated');
    }
    // validation
    // business logic
    return this.model.upsertAsset(id, {
      ...input,
    });
  };

  getAssets = async (
    query: { page?: { number?: number; size?: number } },
    user?: UserAuthPayload,
  ) => {
    if (!user) {
      throw new Error('User not authenticated');
    }
    const pageNumber = query.page?.number ?? 1;
    const pageSize = query.page?.size ?? 10;
    const filter = { company_id: Number(user.companyId) };
    const [items, totalItems] = await Promise.all([
      this.model.listAssets({
        filter,
        page: { number: pageNumber, size: pageSize },
      }),
      this.model.countAssets(filter),
    ]);
    return {
      items,
      page: {
        number: pageNumber,
        size: items.length,
        totalItems,
        totalPages: Math.ceil(totalItems / pageSize),
      },
    };
  };

  batchGetAssetsById = async (
    ids: readonly string[],
    user?: UserAuthPayload,
  ) => {
    if (!user) {
      return ids.map(() => null);
    }
    return this.model.batchGetAssetsById(ids, user.companyId);
  };
}

export const createAssetsService = async (config: {
  envConfig: EnvConfig;
  mongoClient: MongoClient;
  kafkaClient: KafkaJS.Kafka;
}) => {
  const model = createAssetsModel(config);
  const assetsService = new AssetsService({
    model,
  });
  const assetSinkConnector = new AssetsSinkConnector({
    envConfig: config.envConfig,
    kafka: config.kafkaClient,
    model,
  });
  await assetSinkConnector.start();

  return assetsService;
};
