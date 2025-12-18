/***
 * DO NOT MODIFY THIS FILE BY HAND
 * This file was generated from ksqlDB table schema
 * Source: PRICES_WITH_CATEGORY
 */

export interface KsqlPricesWithCategory {
  _id: string;
  workspaceId: string | null;
  parentPriceId: string | null;
  parentPriceIdPercentageFactor: string | null;
  name: string | null;
  createdBy: string | null;
  createdAt: string | null;
  updatedAt: string | null;
  updatedBy: string | null;
  pimCategoryId: string | null;
  pimCategoryPath: string | null;
  pimCategoryName: string | null;
  pimProductId: string | null;
  priceType: string | null;
  priceBookId: string | null;
  businessContactId: string | null;
  projectId: string | null;
  location: string | null;
  pricePerDayInCents: number | null;
  pricePerWeekInCents: number | null;
  pricePerMonthInCents: number | null;
  unitCostInCents: number | null;
  discounts: string | null;
  price_book: {
    id: string | null;
    workspace_id: string | null;
    parent_price_book_id: string | null;
    parent_price_book_percentage_factor: string | null;
    name: string | null;
    notes: string | null;
    created_by: string | null;
    created_at: string | null;
    updated_at: string | null;
    updated_by: string | null;
    business_contact_id: string | null;
    project_id: string | null;
    location: string | null;
  } | null;
  pim_category: {
    id: string | null;
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
  } | null;
}
