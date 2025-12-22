import { type MongoClient } from 'mongodb';
import { T3UsersModel, createT3UsersModel, T3UserDoc } from './model';
import { T3UsersSinkConnector } from './kafka-sink-connector';
import { EnvConfig } from '../../config';
import type { KafkaJS } from '@confluentinc/kafka-javascript';

export { type T3UserDoc } from './model';

export class T3UsersService {
  private model: T3UsersModel;

  constructor(config: { model: T3UsersModel }) {
    this.model = config.model;
  }

  async getT3UserById(id: string): Promise<T3UserDoc | null> {
    return this.model.getT3UserById(id);
  }

  async getT3UsersByIds(ids: string[]): Promise<(T3UserDoc | null)[]> {
    return this.model.getT3UsersByIds(ids);
  }
}

export const createT3UsersService = async (config: {
  envConfig: EnvConfig;
  mongoClient: MongoClient;
  kafkaClient: KafkaJS.Kafka;
}) => {
  const model = createT3UsersModel(config);
  const t3UsersService = new T3UsersService({
    model,
  });

  const t3UsersSinkConnector = new T3UsersSinkConnector({
    envConfig: config.envConfig,
    kafka: config.kafkaClient,
    model,
  });

  await t3UsersSinkConnector.start();

  return t3UsersService;
};
