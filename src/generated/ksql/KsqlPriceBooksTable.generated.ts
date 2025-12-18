/***
 * DO NOT MODIFY THIS FILE BY HAND
 * This file was generated from ksqlDB table schema
 * Source: PRICE_BOOKS_TABLE
 */

export interface KsqlPriceBooksTable {
  _id: string;
  workspaceId: string | null;
  parentPriceBookId: string | null;
  parentPriceBookPercentageFactor: string | null;
  name: string | null;
  notes: string | null;
  createdBy: string | null;
  createdAt: string | null;
  updatedAt: string | null;
  updatedBy: string | null;
  businessContactId: string | null;
  projectId: string | null;
  location: string | null;
  deleted: boolean | null;
}
