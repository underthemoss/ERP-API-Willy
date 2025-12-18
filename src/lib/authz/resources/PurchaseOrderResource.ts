import { v1 } from '@authzed/authzed-node';
import { Redis } from 'ioredis';
import { BaseResourceWithCaching } from '../../spicedb-base-resource/BaseResource';
import {
  ERP_PURCHASE_ORDER_PERMISSIONS,
  ERP_PURCHASE_ORDER_RELATIONS,
  ERP_PURCHASE_ORDER_SUBJECT_PERMISSIONS,
  ERP_PURCHASE_ORDER_SUBJECT_RELATIONS,
  ERP_PURCHASE_ORDER_SUBJECT_RELATIONS_MAP,
  ERP_PURCHASE_ORDER_SUBJECT_PERMISSIONS_MAP,
  RESOURCE_TYPES,
} from '../spicedb-generated-types';

type AuthzedClient = v1.ZedClientInterface['promises'];

export class PurchaseOrderResource extends BaseResourceWithCaching<
  ERP_PURCHASE_ORDER_RELATIONS,
  ERP_PURCHASE_ORDER_PERMISSIONS,
  RESOURCE_TYPES,
  ERP_PURCHASE_ORDER_SUBJECT_RELATIONS,
  ERP_PURCHASE_ORDER_SUBJECT_PERMISSIONS
> {
  constructor(client: AuthzedClient, redis: Redis) {
    super(
      client,
      redis,
      RESOURCE_TYPES.ERP_PURCHASE_ORDER,
      ERP_PURCHASE_ORDER_SUBJECT_RELATIONS_MAP,
      ERP_PURCHASE_ORDER_SUBJECT_PERMISSIONS_MAP,
    );
  }
}
