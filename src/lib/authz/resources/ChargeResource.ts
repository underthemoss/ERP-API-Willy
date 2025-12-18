import { BaseResourceWithCaching } from '../../spicedb-base-resource/BaseResource';
import {
  createErpChargeResource,
  ERP_CHARGE_RELATIONS,
  ERP_CHARGE_PERMISSIONS,
  RESOURCE_TYPES,
  ERP_CHARGE_SUBJECT_RELATIONS,
  ERP_CHARGE_SUBJECT_PERMISSIONS,
} from '../spicedb-generated-types';
import { v1 } from '@authzed/authzed-node';
import { Redis } from 'ioredis';

type AuthzedClient = v1.ZedClientInterface['promises'];

export class ChargeResource extends BaseResourceWithCaching<
  ERP_CHARGE_RELATIONS,
  ERP_CHARGE_PERMISSIONS,
  RESOURCE_TYPES,
  ERP_CHARGE_SUBJECT_RELATIONS,
  ERP_CHARGE_SUBJECT_PERMISSIONS
> {
  constructor(client: AuthzedClient, redis: Redis) {
    const baseResource = createErpChargeResource(client, redis);
    super(
      baseResource['client'],
      baseResource['redis'],
      baseResource['resourceType'],
      baseResource['subjectRelationsMap'],
      baseResource['subjectPermissionsMap'],
    );
  }
}
