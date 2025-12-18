import { Redis } from 'ioredis';
import { AuthzedClient } from '../spiceDB-client';
import {
  ERP_WORKSPACE_PERMISSIONS,
  ERP_WORKSPACE_RELATIONS,
  ERP_WORKSPACE_SUBJECT_PERMISSIONS,
  ERP_WORKSPACE_SUBJECT_PERMISSIONS_MAP,
  ERP_WORKSPACE_SUBJECT_RELATIONS,
  ERP_WORKSPACE_SUBJECT_RELATIONS_MAP,
  RESOURCE_TYPES,
} from '../spicedb-generated-types';
import { BaseResourceWithCaching } from '../../spicedb-base-resource/BaseResource';

export class WorkspaceResource extends BaseResourceWithCaching<
  ERP_WORKSPACE_RELATIONS,
  ERP_WORKSPACE_PERMISSIONS,
  RESOURCE_TYPES,
  ERP_WORKSPACE_SUBJECT_RELATIONS,
  ERP_WORKSPACE_SUBJECT_PERMISSIONS
> {
  constructor(client: AuthzedClient, redis: Redis) {
    super(
      client,
      redis,
      RESOURCE_TYPES.ERP_WORKSPACE,
      ERP_WORKSPACE_SUBJECT_RELATIONS_MAP,
      ERP_WORKSPACE_SUBJECT_PERMISSIONS_MAP,
    );
  }
  // Add Workspace specific methods here
}
