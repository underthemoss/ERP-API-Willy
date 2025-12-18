import { v1 } from '@authzed/authzed-node';
import { Redis } from 'ioredis';
import { BaseResourceWithCaching } from '../../spicedb-base-resource/BaseResource';
import {
  ERP_QUOTE_PERMISSIONS,
  ERP_QUOTE_RELATIONS,
  ERP_QUOTE_SUBJECT_PERMISSIONS,
  ERP_QUOTE_SUBJECT_RELATIONS,
  ERP_QUOTE_SUBJECT_RELATIONS_MAP,
  ERP_QUOTE_SUBJECT_PERMISSIONS_MAP,
  RESOURCE_TYPES,
} from '../spicedb-generated-types';

type AuthzedClient = v1.ZedClientInterface['promises'];

export class QuoteResource extends BaseResourceWithCaching<
  ERP_QUOTE_RELATIONS,
  ERP_QUOTE_PERMISSIONS,
  RESOURCE_TYPES,
  ERP_QUOTE_SUBJECT_RELATIONS,
  ERP_QUOTE_SUBJECT_PERMISSIONS
> {
  constructor(client: AuthzedClient, redis: Redis) {
    super(
      client,
      redis,
      RESOURCE_TYPES.ERP_QUOTE,
      ERP_QUOTE_SUBJECT_RELATIONS_MAP,
      ERP_QUOTE_SUBJECT_PERMISSIONS_MAP,
    );
  }
}
