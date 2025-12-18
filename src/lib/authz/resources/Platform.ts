import { Redis } from 'ioredis';
import { AuthzedClient } from '../spiceDB-client';
import {
  ERP_PLATFORM_PERMISSIONS,
  ERP_PLATFORM_RELATIONS,
  ERP_PLATFORM_SUBJECT_PERMISSIONS,
  ERP_PLATFORM_SUBJECT_PERMISSIONS_MAP,
  ERP_PLATFORM_SUBJECT_RELATIONS,
  ERP_PLATFORM_SUBJECT_RELATIONS_MAP,
  RESOURCE_TYPES,
} from '../spicedb-generated-types';
import { BaseResourceWithCaching } from '../../spicedb-base-resource/BaseResource';

export class PlatformResource extends BaseResourceWithCaching<
  ERP_PLATFORM_RELATIONS,
  ERP_PLATFORM_PERMISSIONS,
  RESOURCE_TYPES,
  ERP_PLATFORM_SUBJECT_RELATIONS,
  ERP_PLATFORM_SUBJECT_PERMISSIONS
> {
  constructor(client: AuthzedClient, redis: Redis) {
    super(
      client,
      redis,
      RESOURCE_TYPES.ERP_PLATFORM,
      ERP_PLATFORM_SUBJECT_RELATIONS_MAP,
      ERP_PLATFORM_SUBJECT_PERMISSIONS_MAP,
    );
  }
}
