import { BaseResourceWithCaching } from '../../spicedb-base-resource/BaseResource';
import {
  createErpContactResource,
  ERP_CONTACT_RELATIONS,
  ERP_CONTACT_PERMISSIONS,
  RESOURCE_TYPES,
  ERP_CONTACT_SUBJECT_RELATIONS,
  ERP_CONTACT_SUBJECT_PERMISSIONS,
} from '../spicedb-generated-types';
import { v1 } from '@authzed/authzed-node';
import { Redis } from 'ioredis';

type AuthzedClient = v1.ZedClientInterface['promises'];

export class ContactResource extends BaseResourceWithCaching<
  ERP_CONTACT_RELATIONS,
  ERP_CONTACT_PERMISSIONS,
  RESOURCE_TYPES,
  ERP_CONTACT_SUBJECT_RELATIONS,
  ERP_CONTACT_SUBJECT_PERMISSIONS
> {
  constructor(client: AuthzedClient, redis: Redis) {
    const baseResource = createErpContactResource(client, redis);
    super(
      baseResource['client'],
      baseResource['redis'],
      baseResource['resourceType'],
      baseResource['subjectRelationsMap'],
      baseResource['subjectPermissionsMap'],
    );
  }
}
