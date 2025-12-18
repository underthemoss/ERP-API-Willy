/***
 * DO NOT MODIFY THIS FILE BY HAND
 * This file was generated using npm run avro-ts-codegen
 * Topic: pim_categories
 * Schema version: 2
 */

/* eslint-disable @typescript-eslint/no-namespace */

export type PimCategorySchema = ComEquipmentsharePimCategory.PimCategorySchema;

export namespace ComEquipmentsharePimCategory {
  export const TenantSchema =
    '{"type":"record","name":"Tenant","doc":"The tenant associated with the category","fields":[{"name":"id","type":"string","doc":"The unique identifier for a tenant"}]}';
  export const TenantName = 'com.equipmentshare.pim.category.Tenant';
  /**
   * The tenant associated with the category
   */
  export interface Tenant {
    /**
     * The unique identifier for a tenant
     */
    id: string;
  }
  export const CategoryDataSchema =
    '{"type":"record","name":"CategoryData","doc":"The data associated with the event","fields":[{"name":"name","type":["null","string"],"doc":"The name of the category","default":null},{"name":"path","type":["null","string"],"doc":"The path of the category","default":null},{"name":"description","type":["null","string"],"doc":"A description for the category","default":null},{"name":"has_products","type":["null","boolean"],"doc":"Whether or not the category has products","default":null},{"name":"platform_id","type":["null","string"],"doc":"The unique external identifier","default":null},{"name":"tenant","type":["null",{"type":"record","name":"Tenant","doc":"The tenant associated with the category","fields":[{"name":"id","type":"string","doc":"The unique identifier for a tenant"}]}],"default":null},{"name":"created_by","type":["null","string"],"doc":"The user who created the category","default":null},{"name":"createdAt","type":["null",{"type":"long","logicalType":"timestamp-millis"}],"doc":"The time the category was created","default":null},{"name":"updatedAt","type":["null",{"type":"long","logicalType":"timestamp-millis"}],"doc":"The time the category was last updated","default":null},{"name":"is_deleted","type":["null","boolean"],"doc":"Whether or not the category is deleted","default":null}]}';
  export const CategoryDataName =
    'com.equipmentshare.pim.category.CategoryData';
  /**
   * The data associated with the event
   */
  export interface CategoryData {
    /**
     * The name of the category
     *
     * Default: null
     */
    name: null | string;
    /**
     * The path of the category
     *
     * Default: null
     */
    path: null | string;
    /**
     * A description for the category
     *
     * Default: null
     */
    description: null | string;
    /**
     * Whether or not the category has products
     *
     * Default: null
     */
    has_products: null | boolean;
    /**
     * The unique external identifier
     *
     * Default: null
     */
    platform_id: null | string;
    /**
     * Default: null
     */
    tenant: null | ComEquipmentsharePimCategory.Tenant;
    /**
     * The user who created the category
     *
     * Default: null
     */
    created_by: null | string;
    /**
     * The time the category was created
     *
     * Default: null
     */
    createdAt: null | number;
    /**
     * The time the category was last updated
     *
     * Default: null
     */
    updatedAt: null | number;
    /**
     * Whether or not the category is deleted
     *
     * Default: null
     */
    is_deleted: null | boolean;
  }
  export const PimCategorySchemaSchema =
    '{"type":"record","name":"PimCategorySchema","namespace":"com.equipmentshare.pim.category","fields":[{"name":"id","type":"string","doc":"The unique identifier for a category"},{"name":"source","type":"string","doc":"A URI that identifies the context in which the event happened"},{"name":"specversion","type":"string","doc":"The version of the CloudEvents specification used by the event"},{"name":"type","type":"string","doc":"The type of the event that has happened"},{"name":"time","type":"string","doc":"A Timestamp when the event happened"},{"name":"data","type":["null",{"type":"record","name":"CategoryData","doc":"The data associated with the event","fields":[{"name":"name","type":["null","string"],"doc":"The name of the category","default":null},{"name":"path","type":["null","string"],"doc":"The path of the category","default":null},{"name":"description","type":["null","string"],"doc":"A description for the category","default":null},{"name":"has_products","type":["null","boolean"],"doc":"Whether or not the category has products","default":null},{"name":"platform_id","type":["null","string"],"doc":"The unique external identifier","default":null},{"name":"tenant","type":["null",{"type":"record","name":"Tenant","doc":"The tenant associated with the category","fields":[{"name":"id","type":"string","doc":"The unique identifier for a tenant"}]}],"default":null},{"name":"created_by","type":["null","string"],"doc":"The user who created the category","default":null},{"name":"createdAt","type":["null",{"type":"long","logicalType":"timestamp-millis"}],"doc":"The time the category was created","default":null},{"name":"updatedAt","type":["null",{"type":"long","logicalType":"timestamp-millis"}],"doc":"The time the category was last updated","default":null},{"name":"is_deleted","type":["null","boolean"],"doc":"Whether or not the category is deleted","default":null}]}],"default":null}]}';
  export const PimCategorySchemaName =
    'com.equipmentshare.pim.category.PimCategorySchema';
  export interface PimCategorySchema {
    /**
     * The unique identifier for a category
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
    data: null | ComEquipmentsharePimCategory.CategoryData;
  }
}
