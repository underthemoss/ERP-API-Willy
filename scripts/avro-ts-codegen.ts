import { SchemaRegistryClient } from '@confluentinc/schemaregistry';
import { toTypeScript } from '@ovotech/avro-ts';
import { promises as fs } from 'fs';
import { format } from 'prettier';
import { getEnvConfig } from '../src/config';

const topics = [
  {
    type: 'value',
    typeName: 'PimProductSchema',
    topic: 'pim_products',
  },
  {
    type: 'value',
    typeName: 'PimCategorySchema',
    topic: 'pim_categories',
  },
  {
    type: 'value',
    typeName: 'DataCatalogAssetPimProductSchema',
    topic: 'public_data_catalog_assets_pim_products',
  },
  {
    type: 'value',
    typeName: 'DataCatalogAssetResourceMapSchema',
    topic: 'public_data_catalog_assets_resources',
  },
  {
    type: 'value',
    typeName: 'DataCatalogAssetSchema',
    topic: 'public_data_catalog_assets',
  },
  {
    type: 'value',
    typeName: 'ResourceMapResourceSchema',
    topic: 'resource-map.resource',
  },
  {
    type: 'key',
    typeName: 'ResourceMapResourceKeySchema',
    topic: 'resource-map.resource',
  },
  {
    type: 'value',
    typeName: 'AssetMaterializedViewV1',
    topic: '_fleet-es-erp-asset-data-v1_ASSET_MATERIALIZED_VIEW',
  },
] satisfies { topic: string; typeName: string; type: 'key' | 'value' }[];

const main = async () => {
  const env = getEnvConfig();
  const registry = new SchemaRegistryClient({
    baseURLs: [env.KAFKA_SCHEMA_REG_API_URL],
    basicAuthCredentials: {
      credentialsSource: 'SASL_INHERIT',
      sasl: {
        username: env.KAFKA_SCHEMA_REG_API_KEY,
        password: env.KAFKA_SCHEMA_REG_API_SECRET,
      },
    },
  });

  for (const { topic, typeName, type } of topics) {
    const { schema, version } = await registry.getLatestSchemaMetadata(
      `${topic}-${type}`,
    );
    const parsedSchema = JSON.parse(schema);

    // overriding the schema name to our local name, i couldn't find a better way to rename this.
    parsedSchema.name = typeName;

    const output = toTypeScript(parsedSchema, {
      headers: [
        `/***
          * DO NOT MODIFY THIS FILE BY HAND
          * This file was generated using npm run avro-ts-codegen
          * Topic: ${topic}
          * Schema version: ${version}
          */`,
      ],
      withTypescriptEnums: true,
    });
    const formatedoutput = await format(output, {
      parser: 'typescript',
      singleQuote: true,
    });
    await fs.writeFile(
      `./src/generated/${typeName}.generated.ts`,
      formatedoutput,
    );

    console.log('✅', type, topic);
  }
};

main();
