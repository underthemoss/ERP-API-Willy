/***
 * DO NOT MODIFY THIS FILE BY HAND
 * This file was generated from ksqlDB table schema
 * Source: PRICES_TABLE
 */

export interface KsqlPricesTable {
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
  deleted: boolean | null;
}
