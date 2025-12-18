// Auto-generated from SpiceDB schema. Do not edit by hand.

import { Redis } from 'ioredis';
import { v1 } from '@authzed/authzed-node';
import {
  BaseResourceWithCaching,
  SubjectRelationsMapType,
  SubjectPermissionsMapType,
} from '../BaseResource';
type AuthzedClient = v1.ZedClientInterface['promises'];

export enum NAMESPACES {
  TEST = 'test',
}
export enum RESOURCE_TYPES {
  TEST_DOCUMENT = `${NAMESPACES.TEST}/document`,
  TEST_ORG = `${NAMESPACES.TEST}/org`,
  TEST_USER = `${NAMESPACES.TEST}/user`,
}

export enum TEST_DOCUMENT_RELATIONS {
  ORG = 'org',
  OWNER = 'owner',
  READER = 'reader',
  WRITER = 'writer',
}

export enum TEST_DOCUMENT_PERMISSIONS {
  READ = 'read',
  WRITE = 'write',
}

export enum TEST_DOCUMENT_SUBJECT_RELATIONS {
  ORG_ORG = 'ORG_ORG',
  USER_OWNER = 'USER_OWNER',
  USER_READER = 'USER_READER',
  USER_WRITER = 'USER_WRITER',
}

export const TEST_DOCUMENT_SUBJECT_RELATIONS_MAP: SubjectRelationsMapType<
  RESOURCE_TYPES,
  TEST_DOCUMENT_RELATIONS,
  TEST_DOCUMENT_SUBJECT_RELATIONS
> = {
  ORG_ORG: {
    relation: TEST_DOCUMENT_RELATIONS.ORG,
    subjectType: RESOURCE_TYPES.TEST_ORG,
  },
  USER_OWNER: {
    relation: TEST_DOCUMENT_RELATIONS.OWNER,
    subjectType: RESOURCE_TYPES.TEST_USER,
  },
  USER_READER: {
    relation: TEST_DOCUMENT_RELATIONS.READER,
    subjectType: RESOURCE_TYPES.TEST_USER,
  },
  USER_WRITER: {
    relation: TEST_DOCUMENT_RELATIONS.WRITER,
    subjectType: RESOURCE_TYPES.TEST_USER,
  },
} as const;

export enum TEST_DOCUMENT_SUBJECT_PERMISSIONS {
  USER_READ = 'USER_READ',
  USER_WRITE = 'USER_WRITE',
}

export const TEST_DOCUMENT_SUBJECT_PERMISSIONS_MAP: SubjectPermissionsMapType<
  RESOURCE_TYPES,
  TEST_DOCUMENT_PERMISSIONS,
  TEST_DOCUMENT_SUBJECT_PERMISSIONS
> = {
  USER_READ: {
    permission: TEST_DOCUMENT_PERMISSIONS.READ,
    subjectType: RESOURCE_TYPES.TEST_USER,
  },
  USER_WRITE: {
    permission: TEST_DOCUMENT_PERMISSIONS.WRITE,
    subjectType: RESOURCE_TYPES.TEST_USER,
  },
};

export const createTestDocumentResource = (
  client: AuthzedClient,
  redis: Redis,
) =>
  new BaseResourceWithCaching<
    TEST_DOCUMENT_RELATIONS,
    TEST_DOCUMENT_PERMISSIONS,
    RESOURCE_TYPES,
    TEST_DOCUMENT_SUBJECT_RELATIONS,
    TEST_DOCUMENT_SUBJECT_PERMISSIONS
  >(
    client,
    redis,
    RESOURCE_TYPES.TEST_DOCUMENT,
    TEST_DOCUMENT_SUBJECT_RELATIONS_MAP,
    TEST_DOCUMENT_SUBJECT_PERMISSIONS_MAP,
  );

export enum TEST_ORG_RELATIONS {
  OWNER = 'owner',
  ADMIN = 'admin',
  MEMBER = 'member',
}

export enum TEST_ORG_PERMISSIONS {
  READ = 'read',
  WRITE = 'write',
  BILLING_ACCESS = 'billing_access',
}

export enum TEST_ORG_SUBJECT_RELATIONS {
  USER_OWNER = 'USER_OWNER',
  USER_ADMIN = 'USER_ADMIN',
  USER_MEMBER = 'USER_MEMBER',
}

export const TEST_ORG_SUBJECT_RELATIONS_MAP: SubjectRelationsMapType<
  RESOURCE_TYPES,
  TEST_ORG_RELATIONS,
  TEST_ORG_SUBJECT_RELATIONS
> = {
  USER_OWNER: {
    relation: TEST_ORG_RELATIONS.OWNER,
    subjectType: RESOURCE_TYPES.TEST_USER,
  },
  USER_ADMIN: {
    relation: TEST_ORG_RELATIONS.ADMIN,
    subjectType: RESOURCE_TYPES.TEST_USER,
  },
  USER_MEMBER: {
    relation: TEST_ORG_RELATIONS.MEMBER,
    subjectType: RESOURCE_TYPES.TEST_USER,
  },
} as const;

export enum TEST_ORG_SUBJECT_PERMISSIONS {
  USER_READ = 'USER_READ',
  USER_WRITE = 'USER_WRITE',
  USER_BILLING_ACCESS = 'USER_BILLING_ACCESS',
}

export const TEST_ORG_SUBJECT_PERMISSIONS_MAP: SubjectPermissionsMapType<
  RESOURCE_TYPES,
  TEST_ORG_PERMISSIONS,
  TEST_ORG_SUBJECT_PERMISSIONS
> = {
  USER_READ: {
    permission: TEST_ORG_PERMISSIONS.READ,
    subjectType: RESOURCE_TYPES.TEST_USER,
  },
  USER_WRITE: {
    permission: TEST_ORG_PERMISSIONS.WRITE,
    subjectType: RESOURCE_TYPES.TEST_USER,
  },
  USER_BILLING_ACCESS: {
    permission: TEST_ORG_PERMISSIONS.BILLING_ACCESS,
    subjectType: RESOURCE_TYPES.TEST_USER,
  },
};

export const createTestOrgResource = (client: AuthzedClient, redis: Redis) =>
  new BaseResourceWithCaching<
    TEST_ORG_RELATIONS,
    TEST_ORG_PERMISSIONS,
    RESOURCE_TYPES,
    TEST_ORG_SUBJECT_RELATIONS,
    TEST_ORG_SUBJECT_PERMISSIONS
  >(
    client,
    redis,
    RESOURCE_TYPES.TEST_ORG,
    TEST_ORG_SUBJECT_RELATIONS_MAP,
    TEST_ORG_SUBJECT_PERMISSIONS_MAP,
  );

export enum TEST_USER_RELATIONS {}

export enum TEST_USER_PERMISSIONS {}

export enum TEST_USER_SUBJECT_RELATIONS {}

export enum TEST_USER_SUBJECT_PERMISSIONS {}

// No factory for TEST_USER (no relations or permissions).
