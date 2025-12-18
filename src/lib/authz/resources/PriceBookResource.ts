import { Redis } from 'ioredis';
import { AuthzedClient } from '../spiceDB-client';
import {
  ERP_PRICEBOOK_PERMISSIONS,
  ERP_PRICEBOOK_RELATIONS,
  ERP_PRICEBOOK_SUBJECT_PERMISSIONS,
  ERP_PRICEBOOK_SUBJECT_PERMISSIONS_MAP,
  ERP_PRICEBOOK_SUBJECT_RELATIONS,
  ERP_PRICEBOOK_SUBJECT_RELATIONS_MAP,
  RESOURCE_TYPES,
} from '../spicedb-generated-types';
import { BaseResourceWithCaching } from '../../spicedb-base-resource/BaseResource';

export class PriceBookResource extends BaseResourceWithCaching<
  ERP_PRICEBOOK_RELATIONS,
  ERP_PRICEBOOK_PERMISSIONS,
  RESOURCE_TYPES,
  ERP_PRICEBOOK_SUBJECT_RELATIONS,
  ERP_PRICEBOOK_SUBJECT_PERMISSIONS
> {
  constructor(client: AuthzedClient, redis: Redis) {
    super(
      client,
      redis,
      RESOURCE_TYPES.ERP_PRICEBOOK,
      ERP_PRICEBOOK_SUBJECT_RELATIONS_MAP,
      ERP_PRICEBOOK_SUBJECT_PERMISSIONS_MAP,
    );
  }
  // Add PriceBook specific methods here
}
