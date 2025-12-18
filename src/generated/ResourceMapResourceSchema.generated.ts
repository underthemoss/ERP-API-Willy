/***
 * DO NOT MODIFY THIS FILE BY HAND
 * This file was generated using npm run avro-ts-codegen
 * Topic: resource-map.resource
 * Schema version: 1
 */

/* eslint-disable @typescript-eslint/no-namespace */

export type ResourceMapResourceSchema =
  ComEquipmentshareResource_mapResource.ResourceMapResourceSchema;

export namespace ComEquipmentshareResource_mapResource {
  export const TenantSchema =
    '{"type":"record","name":"Tenant","fields":[{"name":"id","type":"string"}]}';
  export const TenantName = 'com.equipmentshare.resource_map.resource.Tenant';
  export interface Tenant {
    id: string;
  }
  export const HierarchySchema =
    '{"type":"record","name":"Hierarchy","fields":[{"name":"id","type":"string"},{"name":"name","type":["null","string"],"default":null}]}';
  export const HierarchyName =
    'com.equipmentshare.resource_map.resource.Hierarchy';
  export interface Hierarchy {
    id: string;
    /**
     * Default: null
     */
    name: null | string;
  }
  export const ResourceDataSchema =
    '{"type":"record","name":"ResourceData","doc":"The data associated with the event","fields":[{"name":"tenant","type":{"type":"record","name":"Tenant","fields":[{"name":"id","type":"string"}]}},{"name":"hierarchy","type":{"type":"record","name":"Hierarchy","fields":[{"name":"id","type":"string"},{"name":"name","type":["null","string"],"default":null}]}},{"name":"id","type":"string","doc":"The unique identifier for the resource"},{"name":"parent_id","type":["null","string"],"default":null},{"name":"type","type":"string"},{"name":"value","type":"string"},{"name":"path","type":{"type":"array","items":"string"},"doc":"Full path of the resource based on its parent(s)"},{"name":"deletedAt","type":["null",{"type":"long","logicalType":"timestamp-millis"}],"default":null}]}';
  export const ResourceDataName =
    'com.equipmentshare.resource_map.resource.ResourceData';
  /**
   * The data associated with the event
   */
  export interface ResourceData {
    tenant: ComEquipmentshareResource_mapResource.Tenant;
    hierarchy: ComEquipmentshareResource_mapResource.Hierarchy;
    /**
     * The unique identifier for the resource
     */
    id: string;
    /**
     * Default: null
     */
    parent_id: null | string;
    type: string;
    value: string;
    /**
     * Full path of the resource based on its parent(s)
     */
    path: string[];
    /**
     * Default: null
     */
    deletedAt: null | number;
  }
  export const ResourceMapResourceSchemaSchema =
    '{"type":"record","name":"ResourceMapResourceSchema","namespace":"com.equipmentshare.resource_map.resource","fields":[{"name":"id","type":"string","doc":"The unique identifier for the CloudEvent"},{"name":"source","type":"string","doc":"A URI that identifies the context in which the event happened"},{"name":"specversion","type":"string","doc":"The version of the CloudEvents specification used by the event"},{"name":"type","type":"string","doc":"The type of the event that has happened"},{"name":"time","type":"string","doc":"A Timestamp when the event happened"},{"name":"data","type":["null",{"type":"record","name":"ResourceData","doc":"The data associated with the event","fields":[{"name":"tenant","type":{"type":"record","name":"Tenant","fields":[{"name":"id","type":"string"}]}},{"name":"hierarchy","type":{"type":"record","name":"Hierarchy","fields":[{"name":"id","type":"string"},{"name":"name","type":["null","string"],"default":null}]}},{"name":"id","type":"string","doc":"The unique identifier for the resource"},{"name":"parent_id","type":["null","string"],"default":null},{"name":"type","type":"string"},{"name":"value","type":"string"},{"name":"path","type":{"type":"array","items":"string"},"doc":"Full path of the resource based on its parent(s)"},{"name":"deletedAt","type":["null",{"type":"long","logicalType":"timestamp-millis"}],"default":null}]}],"default":null}]}';
  export const ResourceMapResourceSchemaName =
    'com.equipmentshare.resource_map.resource.ResourceMapResourceSchema';
  export interface ResourceMapResourceSchema {
    /**
     * The unique identifier for the CloudEvent
     */
    id: string;
    /**
     * A URI that identifies the context in which the event happened
     */
    source: string;
    /**
     * The version of the CloudEvents specification used by the event
     */
    specversion: string;
    /**
     * The type of the event that has happened
     */
    type: string;
    /**
     * A Timestamp when the event happened
     */
    time: string;
    /**
     * Default: null
     */
    data: null | ComEquipmentshareResource_mapResource.ResourceData;
  }
}
