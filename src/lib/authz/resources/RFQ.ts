import { v1 } from '@authzed/authzed-node';
import { Redis } from 'ioredis';
import { BaseResourceWithCaching } from '../../spicedb-base-resource/BaseResource';
import {
  ERP_RFQ_PERMISSIONS,
  ERP_RFQ_RELATIONS,
  ERP_RFQ_SUBJECT_PERMISSIONS,
  ERP_RFQ_SUBJECT_RELATIONS,
  ERP_RFQ_SUBJECT_RELATIONS_MAP,
  ERP_RFQ_SUBJECT_PERMISSIONS_MAP,
  RESOURCE_TYPES,
} from '../spicedb-generated-types';

type AuthzedClient = v1.ZedClientInterface['promises'];

export class RFQResource extends BaseResourceWithCaching<
  ERP_RFQ_RELATIONS,
  ERP_RFQ_PERMISSIONS,
  RESOURCE_TYPES,
  ERP_RFQ_SUBJECT_RELATIONS,
  ERP_RFQ_SUBJECT_PERMISSIONS
> {
  constructor(client: AuthzedClient, redis: Redis) {
    super(
      client,
      redis,
      RESOURCE_TYPES.ERP_RFQ,
      ERP_RFQ_SUBJECT_RELATIONS_MAP,
      ERP_RFQ_SUBJECT_PERMISSIONS_MAP,
    );
  }
}
