/***
 * DO NOT MODIFY THIS FILE BY HAND
 * This file was generated from ksqlDB table schema
 * Source: PIM_CATEGORIES_V1
 */

export interface KsqlPimCategoriesV1 {
  id: string;
  source: string | null;
  specversion: string | null;
  type: string | null;
  time: string | null;
  data: {
    name: string | null;
    path: string | null;
    description: string | null;
    has_products: boolean | null;
    platform_id: string | null;
    tenant: {
      id: string | null;
    } | null;
    created_by: string | null;
    createdAt: number | null;
    updatedAt: number | null;
    is_deleted: boolean | null;
  } | null;
}
