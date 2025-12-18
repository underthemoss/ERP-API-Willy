/***
 * DO NOT MODIFY THIS FILE BY HAND
 * This file was generated from ksqlDB table schema
 * Source: PIM_PRODUCTS_V1
 */

export interface KsqlPimProductsV1 {
  id: string;
  source: string | null;
  specversion: string | null;
  type: string | null;
  time: string | null;
  data: {
    platform_id: string | null;
    tenant: {
      id: string | null;
    } | null;
    product_category: {
      id: string | null;
      category_platform_id: string | null;
      name: string | null;
      path: string | null;
    } | null;
    product_core_attributes: {
      name: string | null;
      make: string | null;
      make_platform_id: string | null;
      model: string | null;
      year: string | null;
      variant: string | null;
    } | null;
    product_source_attributes: {
      manufacturer_part_number: string | null;
      sku: string | null;
      source: string | null;
      upc: string | null;
    } | null;
    created_by: string | null;
    createdAt: number | null;
    updatedAt: number | null;
    is_deleted: boolean | null;
    last_published_date: string | null;
    product_attribute_groups:
      | {
          name: string | null;
          attributes:
            | {
                name: string | null;
                value: string | null;
                description: string | null;
                unit_of_measure: {
                  type: string | null;
                  name: string | null;
                  abbreviation: string | null;
                  classification: string | null;
                  validator_regex: string | null;
                  validation_message: string | null;
                  normalized_unit_name: string | null;
                  normalized_unit_abbreviation: string | null;
                  normalized_value: string | null;
                  id: string | null;
                } | null;
              }[]
            | null;
        }[]
      | null;
    product_category_core_attributes:
      | {
          name: string | null;
          value: string | null;
          description: string | null;
          unit_of_measure: {
            type: string | null;
            name: string | null;
            abbreviation: string | null;
            classification: string | null;
            validator_regex: string | null;
            validation_message: string | null;
            normalized_unit_name: string | null;
            normalized_unit_abbreviation: string | null;
            normalized_value: string | null;
            id: string | null;
          } | null;
        }[]
      | null;
    product_shipping_dimensions_attributes:
      | {
          name: string | null;
          value: string | null;
          description: string | null;
          unit_of_measure: {
            type: string | null;
            name: string | null;
            abbreviation: string | null;
            classification: string | null;
            validator_regex: string | null;
            validation_message: string | null;
            normalized_unit_name: string | null;
            normalized_unit_abbreviation: string | null;
            normalized_value: string | null;
            id: string | null;
          } | null;
        }[]
      | null;
    product_options:
      | {
          name: string | null;
          options:
            | {
                name: string | null;
                value: string | null;
                is_choices: boolean | null;
                choices:
                  | {
                      name: string | null;
                      value: string | null;
                      attributes:
                        | {
                            name: string | null;
                            value: string | null;
                            description: string | null;
                            unit_of_measure: {
                              type: string | null;
                              name: string | null;
                              abbreviation: string | null;
                              classification: string | null;
                              validator_regex: string | null;
                              validation_message: string | null;
                              normalized_unit_name: string | null;
                              normalized_unit_abbreviation: string | null;
                              normalized_value: string | null;
                              id: string | null;
                            } | null;
                          }[]
                        | null;
                    }[]
                  | null;
                attributes:
                  | {
                      name: string | null;
                      value: string | null;
                      description: string | null;
                      unit_of_measure: {
                        type: string | null;
                        name: string | null;
                        abbreviation: string | null;
                        classification: string | null;
                        validator_regex: string | null;
                        validation_message: string | null;
                        normalized_unit_name: string | null;
                        normalized_unit_abbreviation: string | null;
                        normalized_value: string | null;
                        id: string | null;
                      } | null;
                    }[]
                  | null;
              }[]
            | null;
        }[]
      | null;
    associations:
      | {
          platform_id: string | null;
          type: string | null;
          name: string | null;
          make: string | null;
          make_platform_id: string | null;
          model: string | null;
          variant: string | null;
          manufacturer_part_number: string | null;
          year: string | null;
          upc: string | null;
          sku: string | null;
        }[]
      | null;
  } | null;
}
