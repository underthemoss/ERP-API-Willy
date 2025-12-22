import type { KafkaJS } from '@confluentinc/kafka-javascript';
import { type EnvConfig } from '../../config';
import { type PimCategoriesModel } from './model';
import {
  AvroDeserializer,
  SchemaRegistryClient,
  SerdeType,
} from '@confluentinc/schemaregistry';
import { getKafkaConsumerGroupId } from '../../lib/kafka-util';
import { PimCategorySchema } from '../../generated/PimCategorySchema.generated';

export class PimCategoriesSinkConnector {
  private kafka: KafkaJS.Kafka;
  private model: PimCategoriesModel;
  private consumer_group_id: string;
  private envConfig: EnvConfig;
  private registry: SchemaRegistryClient;
  constructor(opts: {
    envConfig: EnvConfig;
    kafka: KafkaJS.Kafka;
    model: PimCategoriesModel;
  }) {
    this.kafka = opts.kafka;
    this.model = opts.model;
    this.envConfig = opts.envConfig;
    this.consumer_group_id = getKafkaConsumerGroupId(
      opts.envConfig.KAFKA_PIM_CATEGORIES_CONSUMER_GROUP_ID,
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

  private async pimCategoriesConsumer() {
    const topic = 'pim_categories';
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
    const deser = new AvroDeserializer(this.registry, SerdeType.VALUE, {});
    await consumer.run({
      eachBatch: async ({ batch }) => {
        for (const message of batch.messages) {
          if (message.value && message.key) {
            const value = (await deser.deserialize(
              topic,
              message.value,
            )) as PimCategorySchema;

            await this.model.upsertPimCategory(message.key.toString(), {
              description: value.data?.description || '',
              has_products: value.data?.has_products || false,
              is_deleted: value.data?.is_deleted || false,
              name: value.data?.name || '',
              path: value.data?.path || '',
              platform_id: value.data?.platform_id || '',
              tenant_id: value.data?.tenant?.id || '',
            });
          } else if (message.key) {
            // Tombstone message: key exists but value is null/empty - delete the record
            await this.model.deletePimCategory(message.key.toString());
          }
        }
      },
    });
  }

  async start() {
    if (this.envConfig.DISABLE_KAFKA) {
      console.warn(
        'DISABLE_KAFKA is set. Skipping PimCategoriesSinkConnector.',
      );
      return;
    }
    await this.pimCategoriesConsumer();
  }
}
