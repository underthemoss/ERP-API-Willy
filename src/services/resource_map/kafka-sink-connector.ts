import type { KafkaJS } from '@confluentinc/kafka-javascript';
import { type EnvConfig } from '../../config';
import { type ResourceMapResourcesModel } from './model';
import {
  AvroDeserializer,
  SchemaRegistryClient,
  SerdeType,
} from '@confluentinc/schemaregistry';
import { getKafkaConsumerGroupId } from '../../lib/kafka-util';
import { ResourceMapResourceSchema } from '../../generated/ResourceMapResourceSchema.generated';

export class ResourceMapResourcesSinkConnector {
  private kafka: KafkaJS.Kafka;
  private model: ResourceMapResourcesModel;
  private consumer_group_id: string;
  private envConfig: EnvConfig;
  private registry: SchemaRegistryClient;
  constructor(opts: {
    envConfig: EnvConfig;
    kafka: KafkaJS.Kafka;
    model: ResourceMapResourcesModel;
  }) {
    this.kafka = opts.kafka;
    this.model = opts.model;
    this.envConfig = opts.envConfig;
    this.consumer_group_id = getKafkaConsumerGroupId(
      opts.envConfig.KAFKA_RM_RESOURCES_CONSUMER_GROUP_ID,
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

  private async rmResourcesConsumer() {
    const topic = 'resource-map.resource';
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
            )) as ResourceMapResourceSchema;

            if (value.type === 'DELETE') {
              await this.model.deleteResourceById(value.data?.id || '');
            } else {
              await this.model.upsertResource(value.data?.id || '', {
                resource_id: value.data?.id || '',
                parent_id: value.data?.parent_id || '',
                hierarchy_id: value.data?.hierarchy.id || '',
                hierarchy_name: value.data?.hierarchy.name || '',
                path: value.data?.path || [],
                tenant_id: value.data?.tenant.id || '',
                type: value.data?.type || '',
                value: value.data?.value || '',
              });
            }
          }
        }
      },
    });
  }

  async start() {
    if (this.envConfig.DISABLE_KAFKA) {
      console.warn(
        'DISABLE_KAFKA is set. Skipping ResourceMapResourcesSinkConnector.',
      );
      return;
    }
    await this.rmResourcesConsumer();
  }
}
