/***
 * DO NOT MODIFY THIS FILE BY HAND
 * This file was generated using npm run avro-ts-codegen
 * Topic: resource-map.resource
 * Schema version: 1
 */

/* eslint-disable @typescript-eslint/no-namespace */

export type ResourceMapResourceKeySchema =
  ComEquipmentshareResource_mapResource.ResourceMapResourceKeySchema;

export namespace ComEquipmentshareResource_mapResource {
  export const ResourceMapResourceKeySchemaSchema =
    '{"type":"record","name":"ResourceMapResourceKeySchema","namespace":"com.equipmentshare.resource_map.resource","fields":[{"name":"id","type":"string","doc":"The unique identifier for the resource"}]}';
  export const ResourceMapResourceKeySchemaName =
    'com.equipmentshare.resource_map.resource.ResourceMapResourceKeySchema';
  export interface ResourceMapResourceKeySchema {
    /**
     * The unique identifier for the resource
     */
    id: string;
  }
}
