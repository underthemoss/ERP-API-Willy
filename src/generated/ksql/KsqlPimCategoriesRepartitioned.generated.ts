/***
 * DO NOT MODIFY THIS FILE BY HAND
 * This file was generated from ksqlDB table schema
 * Source: PIM_CATEGORIES_REPARTITIONED
 */

export interface KsqlPimCategoriesRepartitioned {
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
  category_lvl1: string | null;
  category_lvl2: string | null;
  category_lvl3: string | null;
  category_lvl4: string | null;
  category_lvl5: string | null;
  category_lvl6: string | null;
  category_lvl7: string | null;
  category_lvl8: string | null;
  category_lvl9: string | null;
  category_lvl10: string | null;
  category_lvl11: string | null;
  category_lvl12: string | null;
}
