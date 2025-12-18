export type SubjectRelationsMapType<
  ResourceType,
  Relation,
  SubjectRelations extends string,
> = Record<SubjectRelations, { relation: Relation; subjectType: ResourceType }>;

export type SubjectPermissionsMapType<
  ResourceType,
  PermissionEnum,
  SubjectPermissionsEnum extends string,
> = Record<
  SubjectPermissionsEnum,
  { permission: PermissionEnum; subjectType: ResourceType }
>;

export enum NAMESPACES {
  TEST = 'test',
}
export enum RESOURCE_TYPES {
  USER = `${NAMESPACES.TEST}/user`,
  DOCUMENT = `${NAMESPACES.TEST}/document`,
  ORG = `${NAMESPACES.TEST}/org`,
}
export enum DOCUMENT_RELATIONS {
  OWNER = 'owner',
  READER = 'reader',
  WRITER = 'writer',
  ORG = 'org',
}

export enum DOCUMENT_PERMISSIONS {
  READ = 'read',
  WRITE = 'write',
}

export enum DOCUMENT_SUBJECT_RELATIONS {
  USER_OWNER = 'USER_OWNER',
  USER_READER = 'USER_READER',
  USER_WRITER = 'USER_WRITER',
  ORG_ORG = 'ORG_ORG',
}

export const SUBJECT_RELATIONS_MAP: SubjectRelationsMapType<
  RESOURCE_TYPES,
  DOCUMENT_RELATIONS,
  DOCUMENT_SUBJECT_RELATIONS
> = {
  USER_OWNER: {
    relation: DOCUMENT_RELATIONS.OWNER,
    subjectType: RESOURCE_TYPES.USER,
  },
  USER_READER: {
    relation: DOCUMENT_RELATIONS.READER,
    subjectType: RESOURCE_TYPES.USER,
  },
  USER_WRITER: {
    relation: DOCUMENT_RELATIONS.WRITER,
    subjectType: RESOURCE_TYPES.USER,
  },
  ORG_ORG: {
    relation: DOCUMENT_RELATIONS.ORG,
    subjectType: RESOURCE_TYPES.ORG,
  },
} as const;

export enum DOC_SUBJECT_PERMISSIONS {
  USER_READ = 'USER_READ',
  USER_WRITE = 'USER_WRITE',
}

export const DOC_SUBJECT_PERMISSIONS_MAP: SubjectPermissionsMapType<
  RESOURCE_TYPES,
  DOCUMENT_PERMISSIONS,
  DOC_SUBJECT_PERMISSIONS
> = {
  USER_READ: {
    permission: DOCUMENT_PERMISSIONS.READ,
    subjectType: RESOURCE_TYPES.USER,
  },
  USER_WRITE: {
    permission: DOCUMENT_PERMISSIONS.WRITE,
    subjectType: RESOURCE_TYPES.USER,
  },
};
