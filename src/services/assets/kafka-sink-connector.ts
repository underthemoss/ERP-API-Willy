import type { KafkaJS } from '@confluentinc/kafka-javascript';
import { type EnvConfig } from '../../config';
import { type AssetsModel } from './model';
import { getKafkaConsumerGroupId } from '../../lib/kafka-util';
import {
  AvroDeserializer,
  SchemaRegistryClient,
  SerdeType,
} from '@confluentinc/schemaregistry';
import { DataCatalogAssetPimProductSchema } from '../../generated/DataCatalogAssetPimProductSchema.generated';
import { DataCatalogAssetResourceMapSchema } from '../../generated/DataCatalogAssetResourceMapSchema.generated';
import { AssetMaterializedViewV1 } from '../../generated/AssetMaterializedViewV1.generated';

export class AssetsSinkConnector {
  private kafka: KafkaJS.Kafka;
  private model: AssetsModel;
  private consumer_group_id: string;
  private envConfig: EnvConfig;

  private registry: SchemaRegistryClient;
  constructor(opts: {
    envConfig: EnvConfig;
    kafka: KafkaJS.Kafka;
    model: AssetsModel;
  }) {
    this.kafka = opts.kafka;
    this.model = opts.model;
    this.envConfig = opts.envConfig;
    this.consumer_group_id = getKafkaConsumerGroupId(
      opts.envConfig.KAFKA_ASSETS_CONSUMER_GROUP_ID,
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

  private async assetConsumer() {
    const topic = 'public_data_catalog_assets';
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
          if (message.value) {
            const value = await deser.deserialize(topic, message.value);

            await this.model.upsertAsset(value.asset_id, { ...value });
          } else {
            // todo: its a tombstone, it should delete the record
          }
        }
      },
    });
  }

  private async assetPimConsumer() {
    const topic = 'public_data_catalog_assets_pim_products';
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
          if (message.value) {
            const value = await deser.deserialize(topic, message.value);

            const { pim_category, pim_make, pim_product } =
              value as DataCatalogAssetPimProductSchema;

            await this.model.upsertAsset(value.asset_id, {
              pim_category,

              pim_make,

              pim_product,
            });
          } else {
            // todo: its a tombstone, it should delete the record
          }
        }
      },
    });
  }

  private async assetResourceMapConsumer() {
    const topic = 'public_data_catalog_assets_resources';
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
          if (message.value) {
            const value = (await deser.deserialize(
              topic,
              message.value,
            )) as DataCatalogAssetResourceMapSchema;

            const { resources } = value;

            await this.model.upsertAsset(value.asset_id || -1, { resources });
          } else {
            // todo: its a tombstone, it should delete the record
          }
        }
      },
    });
  }

  private async assetMaterializedViewConsumer() {
    const topic = '_fleet-es-erp-asset-data-v1_ASSET_MATERIALIZED_VIEW';
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
          if (message.value) {
            const value = (await deser.deserialize(
              topic,
              message.value,
            )) as AssetMaterializedViewV1;

            // Use asset_id from details, and flatten model to string if present
            const assetIdStr = value.details?.asset_id;
            const assetId =
              typeof assetIdStr === 'string' && !isNaN(Number(assetIdStr))
                ? Number(assetIdStr)
                : -1;

            await this.model.upsertAsset(assetId, {
              category: value.category,
              inventory_branch: value.inventory_branch,
              keypad: value.keypad,
              company: value.company,
              groups: value.groups,
              type: value.type,
              tsp_companies: value.tsp_companies,
              photo: value.photo,
              tracker: value.tracker,
              msp_branch: value.msp_branch,
              rsp_branch: value.rsp_branch,
              details: value.details,
              class: value.class,
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
      console.warn('DISABLE_KAFKA is set. Skipping AssetsSinkConnector.');
      return;
    }
    await this.assetConsumer();
    await this.assetPimConsumer();
    await this.assetResourceMapConsumer();
    await this.assetMaterializedViewConsumer();
  }
}
