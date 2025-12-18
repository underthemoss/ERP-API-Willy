import { v1 } from '@authzed/authzed-node';
import { Redis } from 'ioredis';
import { BaseResourceWithCaching } from '../../spicedb-base-resource/BaseResource';
import {
  ERP_INVOICE_PERMISSIONS,
  ERP_INVOICE_RELATIONS,
  ERP_INVOICE_SUBJECT_PERMISSIONS,
  ERP_INVOICE_SUBJECT_RELATIONS,
  ERP_INVOICE_SUBJECT_RELATIONS_MAP,
  ERP_INVOICE_SUBJECT_PERMISSIONS_MAP,
  RESOURCE_TYPES,
} from '../spicedb-generated-types';

type AuthzedClient = v1.ZedClientInterface['promises'];

export class InvoiceResource extends BaseResourceWithCaching<
  ERP_INVOICE_RELATIONS,
  ERP_INVOICE_PERMISSIONS,
  RESOURCE_TYPES,
  ERP_INVOICE_SUBJECT_RELATIONS,
  ERP_INVOICE_SUBJECT_PERMISSIONS
> {
  constructor(client: AuthzedClient, redis: Redis) {
    super(
      client,
      redis,
      RESOURCE_TYPES.ERP_INVOICE,
      ERP_INVOICE_SUBJECT_RELATIONS_MAP,
      ERP_INVOICE_SUBJECT_PERMISSIONS_MAP,
    );
  }
}
