import { Redis } from 'ioredis';
import { AuthzedClient } from '../spiceDB-client';
import {
  ERP_FILE_PERMISSIONS,
  ERP_FILE_RELATIONS,
  ERP_FILE_SUBJECT_PERMISSIONS,
  ERP_FILE_SUBJECT_PERMISSIONS_MAP,
  ERP_FILE_SUBJECT_RELATIONS,
  ERP_FILE_SUBJECT_RELATIONS_MAP,
  RESOURCE_TYPES,
} from '../spicedb-generated-types';
import { BaseResourceWithCaching } from '../../spicedb-base-resource/BaseResource';

export class FileResource extends BaseResourceWithCaching<
  ERP_FILE_RELATIONS,
  ERP_FILE_PERMISSIONS,
  RESOURCE_TYPES,
  ERP_FILE_SUBJECT_RELATIONS,
  ERP_FILE_SUBJECT_PERMISSIONS
> {
  constructor(client: AuthzedClient, redis: Redis) {
    super(
      client,
      redis,
      RESOURCE_TYPES.ERP_FILE,
      ERP_FILE_SUBJECT_RELATIONS_MAP,
      ERP_FILE_SUBJECT_PERMISSIONS_MAP,
    );
  }
}
