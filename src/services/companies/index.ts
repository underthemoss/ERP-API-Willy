import { type MongoClient } from 'mongodb';
import {
  CompaniesModel,
  createCompanyModel,
  CompaniesUpsertInput,
  CompanyDoc,
} from './model';
import { UserAuthPayload } from '../../authentication';
import { CompaniesSinkConnector } from './kafka-sink-connector';
import { EnvConfig } from '../../config';
import { KafkaJS } from '@confluentinc/kafka-javascript';

export class CompaniesService {
  private model: CompaniesModel;
  constructor(config: { model: CompaniesModel }) {
    this.model = config.model;
  }

  upsertCompany = async (
    id: string,
    input: CompaniesUpsertInput,
    user?: UserAuthPayload,
  ) => {
    // auth
    if (!user) {
      throw new Error('User not authenticated');
    }
    // validation
    // business logic
    return this.model.upsertCompany(id, {
      ...input,
    });
  };

  batchGetCompaniesById = async (
    ids: string[],
    user?: UserAuthPayload,
  ): Promise<(CompanyDoc | null)[]> => {
    // auth
    if (!user) {
      throw new Error('User not authenticated');
    }
    // business logic, validation, etc. could go here
    return this.model.getCompaniesByIds(ids);
  };
}

export const createCompaniesService = async (config: {
  envConfig: EnvConfig;
  mongoClient: MongoClient;
  kafkaClient: KafkaJS.Kafka;
}) => {
  const model = createCompanyModel(config);
  const companyService = new CompaniesService({
    model,
  });
  const companiesSinkConnector = new CompaniesSinkConnector({
    envConfig: config.envConfig,
    kafka: config.kafkaClient,
    model,
  });
  await companiesSinkConnector.start();
  return companyService;
};

export type { CompanyDoc } from './model';
