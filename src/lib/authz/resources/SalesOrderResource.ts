import { v1 } from '@authzed/authzed-node';
import { Redis } from 'ioredis';
import { BaseResourceWithCaching } from '../../spicedb-base-resource/BaseResource';
import {
  ERP_SALES_ORDER_PERMISSIONS,
  ERP_SALES_ORDER_RELATIONS,
  ERP_SALES_ORDER_SUBJECT_PERMISSIONS,
  ERP_SALES_ORDER_SUBJECT_RELATIONS,
  ERP_SALES_ORDER_SUBJECT_RELATIONS_MAP,
  ERP_SALES_ORDER_SUBJECT_PERMISSIONS_MAP,
  RESOURCE_TYPES,
} from '../spicedb-generated-types';

type AuthzedClient = v1.ZedClientInterface['promises'];

export class SalesOrderResource extends BaseResourceWithCaching<
  ERP_SALES_ORDER_RELATIONS,
  ERP_SALES_ORDER_PERMISSIONS,
  RESOURCE_TYPES,
  ERP_SALES_ORDER_SUBJECT_RELATIONS,
  ERP_SALES_ORDER_SUBJECT_PERMISSIONS
> {
  constructor(client: AuthzedClient, redis: Redis) {
    super(
      client,
      redis,
      RESOURCE_TYPES.ERP_SALES_ORDER,
      ERP_SALES_ORDER_SUBJECT_RELATIONS_MAP,
      ERP_SALES_ORDER_SUBJECT_PERMISSIONS_MAP,
    );
  }
}
