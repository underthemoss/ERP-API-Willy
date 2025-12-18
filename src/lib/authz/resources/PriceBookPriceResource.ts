import { Redis } from 'ioredis';
import { AuthzedClient } from '../spiceDB-client';
import {
  ERP_PRICEBOOK_PRICE_PERMISSIONS,
  ERP_PRICEBOOK_PRICE_RELATIONS,
  ERP_PRICEBOOK_PRICE_SUBJECT_PERMISSIONS,
  ERP_PRICEBOOK_PRICE_SUBJECT_PERMISSIONS_MAP,
  ERP_PRICEBOOK_PRICE_SUBJECT_RELATIONS,
  ERP_PRICEBOOK_PRICE_SUBJECT_RELATIONS_MAP,
  RESOURCE_TYPES,
} from '../spicedb-generated-types';
import { BaseResourceWithCaching } from '../../spicedb-base-resource/BaseResource';

type Price = {
  id: string;
  workspaceId: string;
  priceBookId?: string;
};

type PriceWithPriceBook = Price & { priceBookId: string };

export class PriceBookPriceResource extends BaseResourceWithCaching<
  ERP_PRICEBOOK_PRICE_RELATIONS,
  ERP_PRICEBOOK_PRICE_PERMISSIONS,
  RESOURCE_TYPES,
  ERP_PRICEBOOK_PRICE_SUBJECT_RELATIONS,
  ERP_PRICEBOOK_PRICE_SUBJECT_PERMISSIONS
> {
  constructor(client: AuthzedClient, redis: Redis) {
    super(
      client,
      redis,
      RESOURCE_TYPES.ERP_PRICEBOOK_PRICE,
      ERP_PRICEBOOK_PRICE_SUBJECT_RELATIONS_MAP,
      ERP_PRICEBOOK_PRICE_SUBJECT_PERMISSIONS_MAP,
    );
  }
  // Add PriceBookPrice specific methods here

  async writePriceBookPricesRelations(prices: Array<Price>) {
    const workspaceRelations = prices.map((price) => ({
      relation: ERP_PRICEBOOK_PRICE_SUBJECT_RELATIONS.WORKSPACE_WORKSPACE,
      resourceId: price.id,
      subjectId: price.workspaceId,
    }));

    const priceBookRelations = prices
      .filter((price): price is PriceWithPriceBook => !!price.priceBookId)
      .map((price) => ({
        relation: ERP_PRICEBOOK_PRICE_SUBJECT_RELATIONS.PRICEBOOK_PRICEBOOK,
        resourceId: price.id,
        subjectId: price.priceBookId,
      }));

    return this.writeRelations([...workspaceRelations, ...priceBookRelations]);
  }

  async writePriceBookPriceRelations(price: Price) {
    return this.writePriceBookPricesRelations([price]);
  }
}
