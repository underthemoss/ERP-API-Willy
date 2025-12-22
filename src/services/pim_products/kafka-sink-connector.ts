import type { KafkaJS } from '@confluentinc/kafka-javascript';
import { type EnvConfig } from '../../config';
import { type PimProductsModel } from './model';
import {
  AvroDeserializer,
  SchemaRegistryClient,
  SerdeType,
} from '@confluentinc/schemaregistry';
import { getKafkaConsumerGroupId } from '../../lib/kafka-util';
import { PimProductSchema } from '../../generated/PimProductSchema.generated';

export class PimProductsSinkConnector {
  private kafka: KafkaJS.Kafka;
  private model: PimProductsModel;
  private consumer_group_id: string;
  private envConfig: EnvConfig;
  private registry: SchemaRegistryClient;
  constructor(opts: {
    envConfig: EnvConfig;
    kafka: KafkaJS.Kafka;
    model: PimProductsModel;
  }) {
    this.kafka = opts.kafka;
    this.model = opts.model;
    this.envConfig = opts.envConfig;
    this.consumer_group_id = getKafkaConsumerGroupId(
      opts.envConfig.KAFKA_PIM_PRODUCTS_CONSUMER_GROUP_ID,
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

  private async pimProductConsumer() {
    const topic = 'pim_products';
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
            )) as PimProductSchema;

            await this.model.upsertPimProduct(message.key.toString(), {
              pim_product_id: value.data?.platform_id || '',
              is_deleted: value.data?.is_deleted || false,
              tenant_id: value.data?.tenant?.id || '',
              make: value.data?.product_core_attributes?.make || '',
              model: value.data?.product_core_attributes?.model || '',
              name: value.data?.product_core_attributes?.name || '',
              year: value.data?.product_core_attributes?.year || '',
              manufacturer_part_number:
                value.data?.product_source_attributes
                  ?.manufacturer_part_number || '',
              sku: value.data?.product_source_attributes?.sku || '',
              upc: value.data?.product_source_attributes?.upc || '',
              pim_category_id: value.data?.product_category?.id || '',
              pim_category_platform_id:
                value.data?.product_category?.category_platform_id || '',
              pim_category_path: value.data?.product_category?.path || '',
            });
          } else {
            // todo: its a tombstone, it should delete the record
          }
        }
      },
    });
  }

  async start() {
    if (this.envConfig.DISABLE_KAFKA) {
      console.warn('DISABLE_KAFKA is set. Skipping PimProductsSinkConnector.');
      return;
    }
    await this.pimProductConsumer();
  }
}
