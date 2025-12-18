/***
 * DO NOT MODIFY THIS FILE BY HAND
 * This file was generated using npm run avro-ts-codegen
 * Topic: pim_products
 * Schema version: 16
 */

/* eslint-disable @typescript-eslint/no-namespace */

export type PimProductSchema = ComEquipmentsharePimProduct.PimProductSchema;

export namespace ComEquipmentsharePimProduct {
  export const TenantSchema =
    '{"type":"record","name":"Tenant","doc":"The tenant associated with the product","fields":[{"name":"id","type":"string","doc":"The unique identifier for a tenant"}]}';
  export const TenantName = 'com.equipmentshare.pim.product.Tenant';
  /**
   * The tenant associated with the product
   */
  export interface Tenant {
    /**
     * The unique identifier for a tenant
     */
    id: string;
  }
  export const ProductCategorySchema =
    '{"type":"record","name":"ProductCategory","doc":"The category associated with the product","fields":[{"name":"id","type":"string","doc":"The unique identifier for a product category"},{"name":"category_platform_id","type":["null","string"],"doc":"The unique external identifier of the product category","default":null},{"name":"name","type":["null","string"],"doc":"The name of the product category","default":null},{"name":"path","type":["null","string"],"doc":"The path of the product category","default":null}]}';
  export const ProductCategoryName =
    'com.equipmentshare.pim.product.ProductCategory';
  /**
   * The category associated with the product
   */
  export interface ProductCategory {
    /**
     * The unique identifier for a product category
     */
    id: string;
    /**
     * The unique external identifier of the product category
     *
     * Default: null
     */
    category_platform_id: null | string;
    /**
     * The name of the product category
     *
     * Default: null
     */
    name: null | string;
    /**
     * The path of the product category
     *
     * Default: null
     */
    path: null | string;
  }
  export const ProductCoreAttributesSchema =
    '{"type":"record","name":"ProductCoreAttributes","doc":"The core attributes associated with the product","fields":[{"name":"name","type":["null","string"],"doc":"The name of the product","default":null},{"name":"make","type":["null","string"],"doc":"The make of the product","default":null},{"name":"make_platform_id","type":["null","string"],"doc":"The unique external identifier of the product make","default":null},{"name":"model","type":["null","string"],"doc":"The model of the product","default":null},{"name":"year","type":["null","string"],"doc":"The year of the product","default":null},{"name":"variant","type":["null","string"],"doc":"The variant of the product","default":null}]}';
  export const ProductCoreAttributesName =
    'com.equipmentshare.pim.product.ProductCoreAttributes';
  /**
   * The core attributes associated with the product
   */
  export interface ProductCoreAttributes {
    /**
     * The name of the product
     *
     * Default: null
     */
    name: null | string;
    /**
     * The make of the product
     *
     * Default: null
     */
    make: null | string;
    /**
     * The unique external identifier of the product make
     *
     * Default: null
     */
    make_platform_id: null | string;
    /**
     * The model of the product
     *
     * Default: null
     */
    model: null | string;
    /**
     * The year of the product
     *
     * Default: null
     */
    year: null | string;
    /**
     * The variant of the product
     *
     * Default: null
     */
    variant: null | string;
  }
  export const ProductSourceAttributesSchema =
    '{"type":"record","name":"ProductSourceAttributes","doc":"The source attributes associated with the product","fields":[{"name":"manufacturer_part_number","type":["null","string"],"doc":"The manufacturer part number of the product","default":null},{"name":"sku","type":["null","string"],"doc":"The SKU of the product","default":null},{"name":"source","type":["null","string"],"doc":"The source of the product","default":null},{"name":"upc","type":["null","string"],"doc":"The Universal Product Code of the product","default":null}]}';
  export const ProductSourceAttributesName =
    'com.equipmentshare.pim.product.ProductSourceAttributes';
  /**
   * The source attributes associated with the product
   */
  export interface ProductSourceAttributes {
    /**
     * The manufacturer part number of the product
     *
     * Default: null
     */
    manufacturer_part_number: null | string;
    /**
     * The SKU of the product
     *
     * Default: null
     */
    sku: null | string;
    /**
     * The source of the product
     *
     * Default: null
     */
    source: null | string;
    /**
     * The Universal Product Code of the product
     *
     * Default: null
     */
    upc: null | string;
  }
  export const UnitOfMeasureSchema =
    '{"type":"record","name":"UnitOfMeasure","doc":"The unit of measure associated with the attribute","fields":[{"name":"type","type":["null","string"],"doc":"The type of the unit of measure","default":null},{"name":"name","type":["null","string"],"doc":"The name of the unit of measure","default":null},{"name":"abbreviation","type":["null","string"],"doc":"The abbreviation of the unit of measure","default":null},{"name":"classification","type":["null","string"],"doc":"The classification of the unit of measure","default":null},{"name":"validator_regex","type":["null","string"],"doc":"The validator regex of the unit of measure","default":null},{"name":"validation_message","type":["null","string"],"doc":"The validation message for the unit of measure","default":null},{"name":"normalized_unit_name","type":["null","string"],"doc":"The name of the normalized metric unit of measure","default":null},{"name":"normalized_unit_abbreviation","type":["null","string"],"doc":"The abbreviation of the normalized metric unit of measure","default":null},{"name":"normalized_value","type":["null","string"],"doc":"The metric normalized value","default":null},{"name":"id","type":"string","doc":"The unique identifier for a unit of measure"}]}';
  export const UnitOfMeasureName =
    'com.equipmentshare.pim.product.UnitOfMeasure';
  /**
   * The unit of measure associated with the attribute
   */
  export interface UnitOfMeasure {
    /**
     * The type of the unit of measure
     *
     * Default: null
     */
    type: null | string;
    /**
     * The name of the unit of measure
     *
     * Default: null
     */
    name: null | string;
    /**
     * The abbreviation of the unit of measure
     *
     * Default: null
     */
    abbreviation: null | string;
    /**
     * The classification of the unit of measure
     *
     * Default: null
     */
    classification: null | string;
    /**
     * The validator regex of the unit of measure
     *
     * Default: null
     */
    validator_regex: null | string;
    /**
     * The validation message for the unit of measure
     *
     * Default: null
     */
    validation_message: null | string;
    /**
     * The name of the normalized metric unit of measure
     *
     * Default: null
     */
    normalized_unit_name: null | string;
    /**
     * The abbreviation of the normalized metric unit of measure
     *
     * Default: null
     */
    normalized_unit_abbreviation: null | string;
    /**
     * The metric normalized value
     *
     * Default: null
     */
    normalized_value: null | string;
    /**
     * The unique identifier for a unit of measure
     */
    id: string;
  }
  export const AttributeSchema =
    '{"type":"record","name":"Attribute","doc":"The attributes associated with the product","fields":[{"name":"name","type":["null","string"],"doc":"The name of the attribute","default":null},{"name":"value","type":["null","string"],"doc":"The value of the attribute","default":null},{"name":"description","type":["null","string"],"doc":"A description of the attribute","default":null},{"name":"unit_of_measure","type":["null",{"type":"record","name":"UnitOfMeasure","doc":"The unit of measure associated with the attribute","fields":[{"name":"type","type":["null","string"],"doc":"The type of the unit of measure","default":null},{"name":"name","type":["null","string"],"doc":"The name of the unit of measure","default":null},{"name":"abbreviation","type":["null","string"],"doc":"The abbreviation of the unit of measure","default":null},{"name":"classification","type":["null","string"],"doc":"The classification of the unit of measure","default":null},{"name":"validator_regex","type":["null","string"],"doc":"The validator regex of the unit of measure","default":null},{"name":"validation_message","type":["null","string"],"doc":"The validation message for the unit of measure","default":null},{"name":"normalized_unit_name","type":["null","string"],"doc":"The name of the normalized metric unit of measure","default":null},{"name":"normalized_unit_abbreviation","type":["null","string"],"doc":"The abbreviation of the normalized metric unit of measure","default":null},{"name":"normalized_value","type":["null","string"],"doc":"The metric normalized value","default":null},{"name":"id","type":"string","doc":"The unique identifier for a unit of measure"}]}],"default":null}]}';
  export const AttributeName = 'com.equipmentshare.pim.product.Attribute';
  /**
   * The attributes associated with the product
   */
  export interface Attribute {
    /**
     * The name of the attribute
     *
     * Default: null
     */
    name: null | string;
    /**
     * The value of the attribute
     *
     * Default: null
     */
    value: null | string;
    /**
     * A description of the attribute
     *
     * Default: null
     */
    description: null | string;
    /**
     * Default: null
     */
    unit_of_measure: null | ComEquipmentsharePimProduct.UnitOfMeasure;
  }
  export const ProductAttributeGroupSchema =
    '{"type":"record","name":"ProductAttributeGroup","doc":"The attribute groups associated with the product","fields":[{"name":"name","type":["null","string"],"doc":"The name of the attribute group","default":null},{"name":"attributes","type":["null",{"type":"array","items":[{"type":"record","name":"Attribute","doc":"The attributes associated with the product","fields":[{"name":"name","type":["null","string"],"doc":"The name of the attribute","default":null},{"name":"value","type":["null","string"],"doc":"The value of the attribute","default":null},{"name":"description","type":["null","string"],"doc":"A description of the attribute","default":null},{"name":"unit_of_measure","type":["null",{"type":"record","name":"UnitOfMeasure","doc":"The unit of measure associated with the attribute","fields":[{"name":"type","type":["null","string"],"doc":"The type of the unit of measure","default":null},{"name":"name","type":["null","string"],"doc":"The name of the unit of measure","default":null},{"name":"abbreviation","type":["null","string"],"doc":"The abbreviation of the unit of measure","default":null},{"name":"classification","type":["null","string"],"doc":"The classification of the unit of measure","default":null},{"name":"validator_regex","type":["null","string"],"doc":"The validator regex of the unit of measure","default":null},{"name":"validation_message","type":["null","string"],"doc":"The validation message for the unit of measure","default":null},{"name":"normalized_unit_name","type":["null","string"],"doc":"The name of the normalized metric unit of measure","default":null},{"name":"normalized_unit_abbreviation","type":["null","string"],"doc":"The abbreviation of the normalized metric unit of measure","default":null},{"name":"normalized_value","type":["null","string"],"doc":"The metric normalized value","default":null},{"name":"id","type":"string","doc":"The unique identifier for a unit of measure"}]}],"default":null}]}]}],"default":null}]}';
  export const ProductAttributeGroupName =
    'com.equipmentshare.pim.product.ProductAttributeGroup';
  /**
   * The attribute groups associated with the product
   */
  export interface ProductAttributeGroup {
    /**
     * The name of the attribute group
     *
     * Default: null
     */
    name: null | string;
    /**
     * Default: null
     */
    attributes: null | ComEquipmentsharePimProduct.Attribute[];
  }
  export const ProductCategoryCoreAttributeSchema =
    '{"type":"record","name":"ProductCategoryCoreAttribute","doc":"The core attributes associated with the product category","fields":[{"name":"name","type":["null","string"],"doc":"The name of the attribute","default":null},{"name":"value","type":["null","string"],"doc":"The value of the attribute","default":null},{"name":"description","type":["null","string"],"doc":"A description of the attribute","default":null},{"name":"unit_of_measure","type":["null","UnitOfMeasure"],"doc":"The unit of measure associated with the attribute","default":null}]}';
  export const ProductCategoryCoreAttributeName =
    'com.equipmentshare.pim.product.ProductCategoryCoreAttribute';
  /**
   * The core attributes associated with the product category
   */
  export interface ProductCategoryCoreAttribute {
    /**
     * The name of the attribute
     *
     * Default: null
     */
    name: null | string;
    /**
     * The value of the attribute
     *
     * Default: null
     */
    value: null | string;
    /**
     * A description of the attribute
     *
     * Default: null
     */
    description: null | string;
    /**
     * The unit of measure associated with the attribute
     *
     * Default: null
     */
    unit_of_measure: null | ComEquipmentsharePimProduct.UnitOfMeasure;
  }
  export const ProductShippingDimensionsAttributeSchema =
    '{"type":"record","name":"ProductShippingDimensionsAttribute","doc":"The shipping dimensions attributes associated with the product","fields":[{"name":"name","type":["null","string"],"doc":"The name of the attribute","default":null},{"name":"value","type":["null","string"],"doc":"The value of the attribute","default":null},{"name":"description","type":["null","string"],"doc":"A description of the attribute","default":null},{"name":"unit_of_measure","type":["null","UnitOfMeasure"],"doc":"The unit of measure associated with the attribute","default":null}]}';
  export const ProductShippingDimensionsAttributeName =
    'com.equipmentshare.pim.product.ProductShippingDimensionsAttribute';
  /**
   * The shipping dimensions attributes associated with the product
   */
  export interface ProductShippingDimensionsAttribute {
    /**
     * The name of the attribute
     *
     * Default: null
     */
    name: null | string;
    /**
     * The value of the attribute
     *
     * Default: null
     */
    value: null | string;
    /**
     * A description of the attribute
     *
     * Default: null
     */
    description: null | string;
    /**
     * The unit of measure associated with the attribute
     *
     * Default: null
     */
    unit_of_measure: null | ComEquipmentsharePimProduct.UnitOfMeasure;
  }
  export const ProductOptionChoiceSchema =
    '{"type":"record","name":"ProductOptionChoice","doc":"The choice associated with the product option","fields":[{"name":"name","type":["null","string"],"doc":"The name of the choice","default":null},{"name":"value","type":["null","string"],"doc":"The value of the choice","default":null},{"name":"attributes","type":["null",{"type":"array","items":["Attribute"]}],"default":null}]}';
  export const ProductOptionChoiceName =
    'com.equipmentshare.pim.product.ProductOptionChoice';
  /**
   * The choice associated with the product option
   */
  export interface ProductOptionChoice {
    /**
     * The name of the choice
     *
     * Default: null
     */
    name: null | string;
    /**
     * The value of the choice
     *
     * Default: null
     */
    value: null | string;
    /**
     * Default: null
     */
    attributes: null | ComEquipmentsharePimProduct.Attribute[];
  }
  export const ProductOptionSchema =
    '{"type":"record","name":"ProductOption","doc":"The options associated with the product option group","fields":[{"name":"name","type":["null","string"],"doc":"The name of the option","default":null},{"name":"value","type":["null","string"],"doc":"The value of the option","default":null},{"name":"is_choices","type":["null","boolean"],"doc":"Whether or not the option contains choices","default":null},{"name":"choices","type":["null",{"type":"array","items":{"type":"record","name":"ProductOptionChoice","doc":"The choice associated with the product option","fields":[{"name":"name","type":["null","string"],"doc":"The name of the choice","default":null},{"name":"value","type":["null","string"],"doc":"The value of the choice","default":null},{"name":"attributes","type":["null",{"type":"array","items":["Attribute"]}],"default":null}]}}]},{"name":"attributes","type":["null",{"type":"array","items":["Attribute"]}],"default":null}]}';
  export const ProductOptionName =
    'com.equipmentshare.pim.product.ProductOption';
  /**
   * The options associated with the product option group
   */
  export interface ProductOption {
    /**
     * The name of the option
     *
     * Default: null
     */
    name: null | string;
    /**
     * The value of the option
     *
     * Default: null
     */
    value: null | string;
    /**
     * Whether or not the option contains choices
     *
     * Default: null
     */
    is_choices: null | boolean;
    choices: null | ComEquipmentsharePimProduct.ProductOptionChoice[];
    /**
     * Default: null
     */
    attributes: null | ComEquipmentsharePimProduct.Attribute[];
  }
  export const ProductOptionGroupSchema =
    '{"type":"record","name":"ProductOptionGroup","doc":"The option group associated with the product","fields":[{"name":"name","type":["null","string"],"doc":"The name of the option group","default":null},{"name":"options","type":["null",{"type":"array","items":{"type":"record","name":"ProductOption","doc":"The options associated with the product option group","fields":[{"name":"name","type":["null","string"],"doc":"The name of the option","default":null},{"name":"value","type":["null","string"],"doc":"The value of the option","default":null},{"name":"is_choices","type":["null","boolean"],"doc":"Whether or not the option contains choices","default":null},{"name":"choices","type":["null",{"type":"array","items":{"type":"record","name":"ProductOptionChoice","doc":"The choice associated with the product option","fields":[{"name":"name","type":["null","string"],"doc":"The name of the choice","default":null},{"name":"value","type":["null","string"],"doc":"The value of the choice","default":null},{"name":"attributes","type":["null",{"type":"array","items":["Attribute"]}],"default":null}]}}]},{"name":"attributes","type":["null",{"type":"array","items":["Attribute"]}],"default":null}]}}],"default":null}]}';
  export const ProductOptionGroupName =
    'com.equipmentshare.pim.product.ProductOptionGroup';
  /**
   * The option group associated with the product
   */
  export interface ProductOptionGroup {
    /**
     * The name of the option group
     *
     * Default: null
     */
    name: null | string;
    /**
     * Default: null
     */
    options: null | ComEquipmentsharePimProduct.ProductOption[];
  }
  export const AssociationSchema =
    '{"type":"record","name":"Association","doc":"The individual associations related with the product","fields":[{"name":"platform_id","type":["null","string"],"doc":"The platform_id of an associated product","default":null},{"name":"type","type":["null","string"],"doc":"The type of association","default":null},{"name":"name","type":["null","string"],"doc":"The name of the product","default":null},{"name":"make","type":["null","string"],"doc":"The make of the product","default":null},{"name":"make_platform_id","type":["null","string"],"doc":"The unique external identifier of the product make","default":null},{"name":"model","type":["null","string"],"doc":"The product model","default":null},{"name":"variant","type":["null","string"],"doc":"The variant of the product","default":null},{"name":"manufacturer_part_number","type":["null","string"],"doc":"The manufacturer part number","default":null},{"name":"year","type":["null","string"],"doc":"The year of the product","default":null},{"name":"upc","type":["null","string"],"doc":"The unique product code","default":null}]}';
  export const AssociationName = 'com.equipmentshare.pim.product.Association';
  /**
   * The individual associations related with the product
   */
  export interface Association {
    /**
     * The platform_id of an associated product
     *
     * Default: null
     */
    platform_id: null | string;
    /**
     * The type of association
     *
     * Default: null
     */
    type: null | string;
    /**
     * The name of the product
     *
     * Default: null
     */
    name: null | string;
    /**
     * The make of the product
     *
     * Default: null
     */
    make: null | string;
    /**
     * The unique external identifier of the product make
     *
     * Default: null
     */
    make_platform_id: null | string;
    /**
     * The product model
     *
     * Default: null
     */
    model: null | string;
    /**
     * The variant of the product
     *
     * Default: null
     */
    variant: null | string;
    /**
     * The manufacturer part number
     *
     * Default: null
     */
    manufacturer_part_number: null | string;
    /**
     * The year of the product
     *
     * Default: null
     */
    year: null | string;
    /**
     * The unique product code
     *
     * Default: null
     */
    upc: null | string;
  }
  export const ProductDataSchema =
    '{"type":"record","name":"ProductData","doc":"The data associated with the event","fields":[{"name":"platform_id","type":["null","string"],"doc":"The unique external identifier","default":null},{"name":"tenant","type":["null",{"type":"record","name":"Tenant","doc":"The tenant associated with the product","fields":[{"name":"id","type":"string","doc":"The unique identifier for a tenant"}]}],"default":null},{"name":"product_category","type":["null",{"type":"record","name":"ProductCategory","doc":"The category associated with the product","fields":[{"name":"id","type":"string","doc":"The unique identifier for a product category"},{"name":"category_platform_id","type":["null","string"],"doc":"The unique external identifier of the product category","default":null},{"name":"name","type":["null","string"],"doc":"The name of the product category","default":null},{"name":"path","type":["null","string"],"doc":"The path of the product category","default":null}]}],"default":null},{"name":"product_core_attributes","type":["null",{"type":"record","name":"ProductCoreAttributes","doc":"The core attributes associated with the product","fields":[{"name":"name","type":["null","string"],"doc":"The name of the product","default":null},{"name":"make","type":["null","string"],"doc":"The make of the product","default":null},{"name":"make_platform_id","type":["null","string"],"doc":"The unique external identifier of the product make","default":null},{"name":"model","type":["null","string"],"doc":"The model of the product","default":null},{"name":"year","type":["null","string"],"doc":"The year of the product","default":null},{"name":"variant","type":["null","string"],"doc":"The variant of the product","default":null}]}],"default":null},{"name":"product_source_attributes","type":["null",{"type":"record","name":"ProductSourceAttributes","doc":"The source attributes associated with the product","fields":[{"name":"manufacturer_part_number","type":["null","string"],"doc":"The manufacturer part number of the product","default":null},{"name":"sku","type":["null","string"],"doc":"The SKU of the product","default":null},{"name":"source","type":["null","string"],"doc":"The source of the product","default":null},{"name":"upc","type":["null","string"],"doc":"The Universal Product Code of the product","default":null}]}],"default":null},{"name":"created_by","type":["null","string"],"doc":"The user who created the product","default":null},{"name":"createdAt","type":["null",{"type":"long","logicalType":"timestamp-millis"}],"doc":"The time the product was created","default":null},{"name":"updatedAt","type":["null",{"type":"long","logicalType":"timestamp-millis"}],"doc":"The time the product was last updated","default":null},{"name":"is_deleted","type":["null","boolean"],"doc":"Whether or not the product is deleted","default":null},{"name":"last_published_date","type":["null","string"],"doc":"The time the product was last published","default":null},{"name":"product_attribute_groups","type":["null",{"type":"array","items":{"type":"record","name":"ProductAttributeGroup","doc":"The attribute groups associated with the product","fields":[{"name":"name","type":["null","string"],"doc":"The name of the attribute group","default":null},{"name":"attributes","type":["null",{"type":"array","items":[{"type":"record","name":"Attribute","doc":"The attributes associated with the product","fields":[{"name":"name","type":["null","string"],"doc":"The name of the attribute","default":null},{"name":"value","type":["null","string"],"doc":"The value of the attribute","default":null},{"name":"description","type":["null","string"],"doc":"A description of the attribute","default":null},{"name":"unit_of_measure","type":["null",{"type":"record","name":"UnitOfMeasure","doc":"The unit of measure associated with the attribute","fields":[{"name":"type","type":["null","string"],"doc":"The type of the unit of measure","default":null},{"name":"name","type":["null","string"],"doc":"The name of the unit of measure","default":null},{"name":"abbreviation","type":["null","string"],"doc":"The abbreviation of the unit of measure","default":null},{"name":"classification","type":["null","string"],"doc":"The classification of the unit of measure","default":null},{"name":"validator_regex","type":["null","string"],"doc":"The validator regex of the unit of measure","default":null},{"name":"validation_message","type":["null","string"],"doc":"The validation message for the unit of measure","default":null},{"name":"normalized_unit_name","type":["null","string"],"doc":"The name of the normalized metric unit of measure","default":null},{"name":"normalized_unit_abbreviation","type":["null","string"],"doc":"The abbreviation of the normalized metric unit of measure","default":null},{"name":"normalized_value","type":["null","string"],"doc":"The metric normalized value","default":null},{"name":"id","type":"string","doc":"The unique identifier for a unit of measure"}]}],"default":null}]}]}],"default":null}]}}],"default":null},{"name":"product_category_core_attributes","type":["null",{"type":"array","items":{"type":"record","name":"ProductCategoryCoreAttribute","doc":"The core attributes associated with the product category","fields":[{"name":"name","type":["null","string"],"doc":"The name of the attribute","default":null},{"name":"value","type":["null","string"],"doc":"The value of the attribute","default":null},{"name":"description","type":["null","string"],"doc":"A description of the attribute","default":null},{"name":"unit_of_measure","type":["null","UnitOfMeasure"],"doc":"The unit of measure associated with the attribute","default":null}]}}],"default":null},{"name":"product_shipping_dimensions_attributes","type":["null",{"type":"array","items":{"type":"record","name":"ProductShippingDimensionsAttribute","doc":"The shipping dimensions attributes associated with the product","fields":[{"name":"name","type":["null","string"],"doc":"The name of the attribute","default":null},{"name":"value","type":["null","string"],"doc":"The value of the attribute","default":null},{"name":"description","type":["null","string"],"doc":"A description of the attribute","default":null},{"name":"unit_of_measure","type":["null","UnitOfMeasure"],"doc":"The unit of measure associated with the attribute","default":null}]}}],"default":null},{"name":"product_options","type":["null",{"type":"array","items":[{"type":"record","name":"ProductOptionGroup","doc":"The option group associated with the product","fields":[{"name":"name","type":["null","string"],"doc":"The name of the option group","default":null},{"name":"options","type":["null",{"type":"array","items":{"type":"record","name":"ProductOption","doc":"The options associated with the product option group","fields":[{"name":"name","type":["null","string"],"doc":"The name of the option","default":null},{"name":"value","type":["null","string"],"doc":"The value of the option","default":null},{"name":"is_choices","type":["null","boolean"],"doc":"Whether or not the option contains choices","default":null},{"name":"choices","type":["null",{"type":"array","items":{"type":"record","name":"ProductOptionChoice","doc":"The choice associated with the product option","fields":[{"name":"name","type":["null","string"],"doc":"The name of the choice","default":null},{"name":"value","type":["null","string"],"doc":"The value of the choice","default":null},{"name":"attributes","type":["null",{"type":"array","items":["Attribute"]}],"default":null}]}}]},{"name":"attributes","type":["null",{"type":"array","items":["Attribute"]}],"default":null}]}}],"default":null}]}]}],"doc":"The options associated with the product","default":null},{"name":"associations","type":["null",{"type":"array","items":[{"type":"record","name":"Association","doc":"The individual associations related with the product","fields":[{"name":"platform_id","type":["null","string"],"doc":"The platform_id of an associated product","default":null},{"name":"type","type":["null","string"],"doc":"The type of association","default":null},{"name":"name","type":["null","string"],"doc":"The name of the product","default":null},{"name":"make","type":["null","string"],"doc":"The make of the product","default":null},{"name":"make_platform_id","type":["null","string"],"doc":"The unique external identifier of the product make","default":null},{"name":"model","type":["null","string"],"doc":"The product model","default":null},{"name":"variant","type":["null","string"],"doc":"The variant of the product","default":null},{"name":"manufacturer_part_number","type":["null","string"],"doc":"The manufacturer part number","default":null},{"name":"year","type":["null","string"],"doc":"The year of the product","default":null},{"name":"upc","type":["null","string"],"doc":"The unique product code","default":null}]}]}],"doc":"Product to Product or Product to Open Product Association  associations ","default":null}]}';
  export const ProductDataName = 'com.equipmentshare.pim.product.ProductData';
  /**
   * The data associated with the event
   */
  export interface ProductData {
    /**
     * The unique external identifier
     *
     * Default: null
     */
    platform_id: null | string;
    /**
     * Default: null
     */
    tenant: null | ComEquipmentsharePimProduct.Tenant;
    /**
     * Default: null
     */
    product_category: null | ComEquipmentsharePimProduct.ProductCategory;
    /**
     * Default: null
     */
    product_core_attributes: null | ComEquipmentsharePimProduct.ProductCoreAttributes;
    /**
     * Default: null
     */
    product_source_attributes: null | ComEquipmentsharePimProduct.ProductSourceAttributes;
    /**
     * The user who created the product
     *
     * Default: null
     */
    created_by: null | string;
    /**
     * The time the product was created
     *
     * Default: null
     */
    createdAt: null | number;
    /**
     * The time the product was last updated
     *
     * Default: null
     */
    updatedAt: null | number;
    /**
     * Whether or not the product is deleted
     *
     * Default: null
     */
    is_deleted: null | boolean;
    /**
     * The time the product was last published
     *
     * Default: null
     */
    last_published_date: null | string;
    /**
     * Default: null
     */
    product_attribute_groups:
      | null
      | ComEquipmentsharePimProduct.ProductAttributeGroup[];
    /**
     * Default: null
     */
    product_category_core_attributes:
      | null
      | ComEquipmentsharePimProduct.ProductCategoryCoreAttribute[];
    /**
     * Default: null
     */
    product_shipping_dimensions_attributes:
      | null
      | ComEquipmentsharePimProduct.ProductShippingDimensionsAttribute[];
    /**
     * The options associated with the product
     *
     * Default: null
     */
    product_options: null | ComEquipmentsharePimProduct.ProductOptionGroup[];
    /**
     * Product to Product or Product to Open Product Association  associations
     *
     * Default: null
     */
    associations: null | ComEquipmentsharePimProduct.Association[];
  }
  export const PimProductSchemaSchema =
    '{"type":"record","name":"PimProductSchema","namespace":"com.equipmentshare.pim.product","fields":[{"name":"id","type":"string","doc":"The unique identifier for a product"},{"name":"source","type":"string","doc":"A URI that identifies the context in which the event happened"},{"name":"specversion","type":"string","doc":"The version of the CloudEvents specification used by the event"},{"name":"type","type":"string","doc":"The type of the event that has happened"},{"name":"time","type":"string","doc":"A Timestamp when the event happened"},{"name":"data","type":["null",{"type":"record","name":"ProductData","doc":"The data associated with the event","fields":[{"name":"platform_id","type":["null","string"],"doc":"The unique external identifier","default":null},{"name":"tenant","type":["null",{"type":"record","name":"Tenant","doc":"The tenant associated with the product","fields":[{"name":"id","type":"string","doc":"The unique identifier for a tenant"}]}],"default":null},{"name":"product_category","type":["null",{"type":"record","name":"ProductCategory","doc":"The category associated with the product","fields":[{"name":"id","type":"string","doc":"The unique identifier for a product category"},{"name":"category_platform_id","type":["null","string"],"doc":"The unique external identifier of the product category","default":null},{"name":"name","type":["null","string"],"doc":"The name of the product category","default":null},{"name":"path","type":["null","string"],"doc":"The path of the product category","default":null}]}],"default":null},{"name":"product_core_attributes","type":["null",{"type":"record","name":"ProductCoreAttributes","doc":"The core attributes associated with the product","fields":[{"name":"name","type":["null","string"],"doc":"The name of the product","default":null},{"name":"make","type":["null","string"],"doc":"The make of the product","default":null},{"name":"make_platform_id","type":["null","string"],"doc":"The unique external identifier of the product make","default":null},{"name":"model","type":["null","string"],"doc":"The model of the product","default":null},{"name":"year","type":["null","string"],"doc":"The year of the product","default":null},{"name":"variant","type":["null","string"],"doc":"The variant of the product","default":null}]}],"default":null},{"name":"product_source_attributes","type":["null",{"type":"record","name":"ProductSourceAttributes","doc":"The source attributes associated with the product","fields":[{"name":"manufacturer_part_number","type":["null","string"],"doc":"The manufacturer part number of the product","default":null},{"name":"sku","type":["null","string"],"doc":"The SKU of the product","default":null},{"name":"source","type":["null","string"],"doc":"The source of the product","default":null},{"name":"upc","type":["null","string"],"doc":"The Universal Product Code of the product","default":null}]}],"default":null},{"name":"created_by","type":["null","string"],"doc":"The user who created the product","default":null},{"name":"createdAt","type":["null",{"type":"long","logicalType":"timestamp-millis"}],"doc":"The time the product was created","default":null},{"name":"updatedAt","type":["null",{"type":"long","logicalType":"timestamp-millis"}],"doc":"The time the product was last updated","default":null},{"name":"is_deleted","type":["null","boolean"],"doc":"Whether or not the product is deleted","default":null},{"name":"last_published_date","type":["null","string"],"doc":"The time the product was last published","default":null},{"name":"product_attribute_groups","type":["null",{"type":"array","items":{"type":"record","name":"ProductAttributeGroup","doc":"The attribute groups associated with the product","fields":[{"name":"name","type":["null","string"],"doc":"The name of the attribute group","default":null},{"name":"attributes","type":["null",{"type":"array","items":[{"type":"record","name":"Attribute","doc":"The attributes associated with the product","fields":[{"name":"name","type":["null","string"],"doc":"The name of the attribute","default":null},{"name":"value","type":["null","string"],"doc":"The value of the attribute","default":null},{"name":"description","type":["null","string"],"doc":"A description of the attribute","default":null},{"name":"unit_of_measure","type":["null",{"type":"record","name":"UnitOfMeasure","doc":"The unit of measure associated with the attribute","fields":[{"name":"type","type":["null","string"],"doc":"The type of the unit of measure","default":null},{"name":"name","type":["null","string"],"doc":"The name of the unit of measure","default":null},{"name":"abbreviation","type":["null","string"],"doc":"The abbreviation of the unit of measure","default":null},{"name":"classification","type":["null","string"],"doc":"The classification of the unit of measure","default":null},{"name":"validator_regex","type":["null","string"],"doc":"The validator regex of the unit of measure","default":null},{"name":"validation_message","type":["null","string"],"doc":"The validation message for the unit of measure","default":null},{"name":"normalized_unit_name","type":["null","string"],"doc":"The name of the normalized metric unit of measure","default":null},{"name":"normalized_unit_abbreviation","type":["null","string"],"doc":"The abbreviation of the normalized metric unit of measure","default":null},{"name":"normalized_value","type":["null","string"],"doc":"The metric normalized value","default":null},{"name":"id","type":"string","doc":"The unique identifier for a unit of measure"}]}],"default":null}]}]}],"default":null}]}}],"default":null},{"name":"product_category_core_attributes","type":["null",{"type":"array","items":{"type":"record","name":"ProductCategoryCoreAttribute","doc":"The core attributes associated with the product category","fields":[{"name":"name","type":["null","string"],"doc":"The name of the attribute","default":null},{"name":"value","type":["null","string"],"doc":"The value of the attribute","default":null},{"name":"description","type":["null","string"],"doc":"A description of the attribute","default":null},{"name":"unit_of_measure","type":["null","UnitOfMeasure"],"doc":"The unit of measure associated with the attribute","default":null}]}}],"default":null},{"name":"product_shipping_dimensions_attributes","type":["null",{"type":"array","items":{"type":"record","name":"ProductShippingDimensionsAttribute","doc":"The shipping dimensions attributes associated with the product","fields":[{"name":"name","type":["null","string"],"doc":"The name of the attribute","default":null},{"name":"value","type":["null","string"],"doc":"The value of the attribute","default":null},{"name":"description","type":["null","string"],"doc":"A description of the attribute","default":null},{"name":"unit_of_measure","type":["null","UnitOfMeasure"],"doc":"The unit of measure associated with the attribute","default":null}]}}],"default":null},{"name":"product_options","type":["null",{"type":"array","items":[{"type":"record","name":"ProductOptionGroup","doc":"The option group associated with the product","fields":[{"name":"name","type":["null","string"],"doc":"The name of the option group","default":null},{"name":"options","type":["null",{"type":"array","items":{"type":"record","name":"ProductOption","doc":"The options associated with the product option group","fields":[{"name":"name","type":["null","string"],"doc":"The name of the option","default":null},{"name":"value","type":["null","string"],"doc":"The value of the option","default":null},{"name":"is_choices","type":["null","boolean"],"doc":"Whether or not the option contains choices","default":null},{"name":"choices","type":["null",{"type":"array","items":{"type":"record","name":"ProductOptionChoice","doc":"The choice associated with the product option","fields":[{"name":"name","type":["null","string"],"doc":"The name of the choice","default":null},{"name":"value","type":["null","string"],"doc":"The value of the choice","default":null},{"name":"attributes","type":["null",{"type":"array","items":["Attribute"]}],"default":null}]}}]},{"name":"attributes","type":["null",{"type":"array","items":["Attribute"]}],"default":null}]}}],"default":null}]}]}],"doc":"The options associated with the product","default":null},{"name":"associations","type":["null",{"type":"array","items":[{"type":"record","name":"Association","doc":"The individual associations related with the product","fields":[{"name":"platform_id","type":["null","string"],"doc":"The platform_id of an associated product","default":null},{"name":"type","type":["null","string"],"doc":"The type of association","default":null},{"name":"name","type":["null","string"],"doc":"The name of the product","default":null},{"name":"make","type":["null","string"],"doc":"The make of the product","default":null},{"name":"make_platform_id","type":["null","string"],"doc":"The unique external identifier of the product make","default":null},{"name":"model","type":["null","string"],"doc":"The product model","default":null},{"name":"variant","type":["null","string"],"doc":"The variant of the product","default":null},{"name":"manufacturer_part_number","type":["null","string"],"doc":"The manufacturer part number","default":null},{"name":"year","type":["null","string"],"doc":"The year of the product","default":null},{"name":"upc","type":["null","string"],"doc":"The unique product code","default":null}]}]}],"doc":"Product to Product or Product to Open Product Association  associations ","default":null}]}],"default":null}]}';
  export const PimProductSchemaName =
    'com.equipmentshare.pim.product.PimProductSchema';
  export interface PimProductSchema {
    /**
     * The unique identifier for a product
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
    data: null | ComEquipmentsharePimProduct.ProductData;
  }
}
