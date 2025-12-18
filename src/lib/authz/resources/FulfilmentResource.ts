import { v1 } from '@authzed/authzed-node';
import { Redis } from 'ioredis';
import { BaseResourceWithCaching } from '../../spicedb-base-resource/BaseResource';
import {
  ERP_FULFILMENT_PERMISSIONS,
  ERP_FULFILMENT_RELATIONS,
  ERP_FULFILMENT_SUBJECT_PERMISSIONS,
  ERP_FULFILMENT_SUBJECT_RELATIONS,
  ERP_FULFILMENT_SUBJECT_RELATIONS_MAP,
  ERP_FULFILMENT_SUBJECT_PERMISSIONS_MAP,
  RESOURCE_TYPES,
} from '../spicedb-generated-types';

type AuthzedClient = v1.ZedClientInterface['promises'];

export class FulfilmentResource extends BaseResourceWithCaching<
  ERP_FULFILMENT_RELATIONS,
  ERP_FULFILMENT_PERMISSIONS,
  RESOURCE_TYPES,
  ERP_FULFILMENT_SUBJECT_RELATIONS,
  ERP_FULFILMENT_SUBJECT_PERMISSIONS
> {
  constructor(client: AuthzedClient, redis: Redis) {
    super(
      client,
      redis,
      RESOURCE_TYPES.ERP_FULFILMENT,
      ERP_FULFILMENT_SUBJECT_RELATIONS_MAP,
      ERP_FULFILMENT_SUBJECT_PERMISSIONS_MAP,
    );
  }
}
