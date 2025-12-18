import { v1 } from '@authzed/authzed-node';
import { Redis } from 'ioredis';
import { BaseResourceWithCaching } from '../../spicedb-base-resource/BaseResource';
import {
  ERP_PROJECT_PERMISSIONS,
  ERP_PROJECT_RELATIONS,
  ERP_PROJECT_SUBJECT_PERMISSIONS,
  ERP_PROJECT_SUBJECT_RELATIONS,
  ERP_PROJECT_SUBJECT_RELATIONS_MAP,
  ERP_PROJECT_SUBJECT_PERMISSIONS_MAP,
  RESOURCE_TYPES,
} from '../spicedb-generated-types';

type AuthzedClient = v1.ZedClientInterface['promises'];

export class ProjectResource extends BaseResourceWithCaching<
  ERP_PROJECT_RELATIONS,
  ERP_PROJECT_PERMISSIONS,
  RESOURCE_TYPES,
  ERP_PROJECT_SUBJECT_RELATIONS,
  ERP_PROJECT_SUBJECT_PERMISSIONS
> {
  constructor(client: AuthzedClient, redis: Redis) {
    super(
      client,
      redis,
      RESOURCE_TYPES.ERP_PROJECT,
      ERP_PROJECT_SUBJECT_RELATIONS_MAP,
      ERP_PROJECT_SUBJECT_PERMISSIONS_MAP,
    );
  }
}
