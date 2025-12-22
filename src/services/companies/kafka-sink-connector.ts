import type { KafkaJS } from '@confluentinc/kafka-javascript';
import { type EnvConfig } from '../../config';
import { type CompaniesModel } from './model';
import { SchemaRegistryClient } from '@confluentinc/schemaregistry';
import { getKafkaConsumerGroupId } from '../../lib/kafka-util';

export class CompaniesSinkConnector {
  private kafka: KafkaJS.Kafka;
  private model: CompaniesModel;
  private consumer_group_id: string;
  private envConfig: EnvConfig;

  private registry: SchemaRegistryClient;
  constructor(opts: {
    envConfig: EnvConfig;
    kafka: KafkaJS.Kafka;
    model: CompaniesModel;
  }) {
    this.kafka = opts.kafka;
    this.model = opts.model;
    this.envConfig = opts.envConfig;
    this.consumer_group_id = getKafkaConsumerGroupId(
      opts.envConfig.KAFKA_COMPANIES_CONSUMER_GROUP_ID,
    );
    this.registry = new SchemaRegistryClient({
      baseURLs: [opts.envConfig.KAFKA_SCHEMA_REG_API_URL],
      basicAuthCredentials: {
        credentialsSource: 'SASL_INHERIT',
        sasl: {
          username: opts.envConfig.KAFKA_SCHEMA_REG_API_KEY,
          password: opts.envConfig.KAFKA_SCHEMA_REG_API_SECRET,
        },
      },
    });
  }

  private async companiesConsumer() {
    const topic = 'fleet-source-connector-2.public.companies';
    const consumer = this.kafka.consumer({
      kafkaJS: {
        groupId: this.consumer_group_id,
        fromBeginning: true,
      },
    });
    await consumer.connect();
    await consumer.subscribe({
      topic,
    });

    await consumer.run({
      eachBatch: async ({ batch }) => {
        for (const message of batch.messages) {
          if (message.value) {
            const value = message?.value?.toString();

            if (!value) {
              // todo: tombstone - potentially delete record or soft delete
              // throw new Error('value is undefined');
            } else {
              const parsedMsg = JSON.parse(value.toString());
              await this.model.upsertCompany(parsedMsg.company_id, {
                ...parsedMsg,
              });
            }
          } else {
            // todo: its a tombstone, it should delete the record
          }
        }
      },
    });
  }

  async start() {
    if (this.envConfig.DISABLE_KAFKA) {
      console.warn('DISABLE_KAFKA is set. Skipping CompaniesSinkConnector.');
      return;
    }
    await this.companiesConsumer();
  }
}
