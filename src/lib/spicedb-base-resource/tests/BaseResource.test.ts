import { v1 } from '@authzed/authzed-node';
import { v4 } from 'uuid';
// @ts-ignore
import { getTestEnvConfig } from '../../../test/e2e/test-utils';
import { getRedisClient, closeRedis } from '../../../redis';
import { AuthzedClient, createClient } from '../../authz/spiceDB-client';
import { writeSchema } from './';

import {
  RESOURCE_TYPES,
  TEST_DOCUMENT_RELATIONS,
  TEST_DOCUMENT_SUBJECT_RELATIONS,
  TEST_DOCUMENT_SUBJECT_PERMISSIONS,
  TEST_ORG_SUBJECT_RELATIONS,
  createTestDocumentResource,
  createTestOrgResource,
} from './generated';

describe('BaseResourceWithCaching', () => {
  let documentResource: ReturnType<typeof createTestDocumentResource>;
  let orgResource: ReturnType<typeof createTestOrgResource>;

  const writeAllRelationsForUser = async (opts: {
    documentId: string;
    userId: string;
  }) => {
    return documentResource.writeRelations(
      Object.values(TEST_DOCUMENT_SUBJECT_RELATIONS).map((relation) => ({
        resourceId: opts.documentId,
        subjectId: opts.userId,
        relation,
        operation: v1.RelationshipUpdate_Operation.CREATE,
      })),
    );
  };
  beforeAll(async () => {
    const env = getTestEnvConfig();

    const spiceDBClient: AuthzedClient = createClient({
      apiToken: env.SPICEDB_TOKEN,
      endpoint: env.SPICEDB_ENDPOINT,
      security: v1.ClientSecurity.INSECURE_LOCALHOST_ALLOWED,
    });

    const redis = getRedisClient({
      REDIS_HOST: env.REDIS_HOST,
      REDIS_PORT: env.REDIS_PORT,
      ENABLE_REDIS_AUTO_PIPELINING: true,
    });

    await writeSchema(spiceDBClient);
    // sleep for 5 seconds to allow schema to propagate
    await new Promise((resolve) => setTimeout(resolve, 5000));

    documentResource = createTestDocumentResource(spiceDBClient, redis);
    orgResource = createTestOrgResource(spiceDBClient, redis);
  });

  afterAll(async () => {
    await closeRedis();
  });

  describe('writeRelation', () => {
    it('should be able to read after writing and get the correct result', async () => {
      const userId = v4();
      const documentId = v4();

      const hasRelationPre = await documentResource.hasRelation({
        resourceId: documentId,
        subjectId: userId,
        relation: TEST_DOCUMENT_SUBJECT_RELATIONS.USER_OWNER,
      });

      expect(hasRelationPre).toBe(false);

      await documentResource.writeRelation({
        operation: v1.RelationshipUpdate_Operation.CREATE,
        resourceId: documentId,
        subjectId: userId,
        relation: TEST_DOCUMENT_SUBJECT_RELATIONS.USER_OWNER,
      });

      const hasRelationPost = await documentResource.hasRelation({
        resourceId: documentId,
        subjectId: userId,
        relation: TEST_DOCUMENT_SUBJECT_RELATIONS.USER_OWNER,
      });

      expect(hasRelationPost).toBe(true);

      const canRead = await documentResource.hasPermission({
        resourceId: documentId,
        subjectId: userId,
        permission: TEST_DOCUMENT_SUBJECT_PERMISSIONS.USER_READ,
      });

      const canWrite = await documentResource.hasPermission({
        resourceId: documentId,
        subjectId: userId,
        permission: TEST_DOCUMENT_SUBJECT_PERMISSIONS.USER_WRITE,
      });

      expect(canRead).toBe(true);
      expect(canWrite).toBe(true);
    });

    it('should handle multiple writes one after the other', async () => {
      const userId = v4();
      const documentId = v4();

      const hasRelationPre = await documentResource.hasRelation({
        resourceId: documentId,
        subjectId: userId,
        relation: TEST_DOCUMENT_SUBJECT_RELATIONS.USER_OWNER,
      });

      expect(hasRelationPre).toBe(false);

      await documentResource.writeRelation({
        operation: v1.RelationshipUpdate_Operation.CREATE,
        resourceId: documentId,
        subjectId: userId,
        relation: TEST_DOCUMENT_SUBJECT_RELATIONS.USER_OWNER,
      });

      await documentResource.deleteRelationships({
        resourceId: documentId,
        relation: TEST_DOCUMENT_SUBJECT_RELATIONS.USER_OWNER,
        subjectId: userId,
      });

      const hasRelationPost = await documentResource.hasRelation({
        resourceId: documentId,
        subjectId: userId,
        relation: TEST_DOCUMENT_SUBJECT_RELATIONS.USER_OWNER,
      });

      expect(hasRelationPost).toBe(false);

      const canRead = await documentResource.hasPermission({
        resourceId: documentId,
        subjectId: userId,
        permission: TEST_DOCUMENT_SUBJECT_PERMISSIONS.USER_READ,
      });

      const canWrite = await documentResource.hasPermission({
        resourceId: documentId,
        subjectId: userId,
        permission: TEST_DOCUMENT_SUBJECT_PERMISSIONS.USER_WRITE,
      });

      expect(canRead).toBe(false);
      expect(canWrite).toBe(false);
    });
  });

  describe('writeRelations', () => {
    it('should be able to read after writing and get the correct result', async () => {
      const userId = v4();
      const documentId1 = v4();
      const documentId2 = v4();

      const hasDoc1RelationPre = await documentResource.hasRelation({
        resourceId: documentId1,
        subjectId: userId,
        relation: TEST_DOCUMENT_SUBJECT_RELATIONS.USER_OWNER,
      });
      const hasDoc2RelationPre = await documentResource.hasRelation({
        resourceId: documentId2,
        subjectId: userId,
        relation: TEST_DOCUMENT_SUBJECT_RELATIONS.USER_OWNER,
      });

      expect(hasDoc1RelationPre).toBe(false);
      expect(hasDoc2RelationPre).toBe(false);

      await documentResource.writeRelations(
        [documentId1, documentId2].map((docId) => ({
          operation: v1.RelationshipUpdate_Operation.CREATE,
          resourceId: docId,
          subjectId: userId,
          relation: TEST_DOCUMENT_SUBJECT_RELATIONS.USER_OWNER,
        })),
      );

      const hasDoc1RelationPost = await documentResource.hasRelation({
        resourceId: documentId1,
        subjectId: userId,
        relation: TEST_DOCUMENT_SUBJECT_RELATIONS.USER_OWNER,
      });
      const hasDoc2RelationPost = await documentResource.hasRelation({
        resourceId: documentId2,
        subjectId: userId,
        relation: TEST_DOCUMENT_SUBJECT_RELATIONS.USER_OWNER,
      });

      expect(hasDoc1RelationPost).toBe(true);
      expect(hasDoc2RelationPost).toBe(true);
    });
  });

  describe('listRelations', () => {
    it('should throw if the resourceId is not a valid id', async () => {
      const listCall = () =>
        documentResource.listRelations({
          resourceId: 'not a valid id',
          subjectType: RESOURCE_TYPES.TEST_DOCUMENT,
        });

      await expect(listCall()).rejects.toThrow(/INVALID_ARGUMENT/);
    });

    it('should accept just resourceId and subjectType', async () => {
      const user1Id = v4();
      const user2Id = v4();
      const userIds = [user1Id, user2Id];
      const documentId = v4();

      const resultsPre = await documentResource.listRelations({
        resourceId: documentId,
        subjectType: RESOURCE_TYPES.TEST_USER,
      });

      expect(resultsPre.length).toBe(0);

      await documentResource.writeRelations(
        userIds.map((userId) => ({
          operation: v1.RelationshipUpdate_Operation.CREATE,
          resourceId: documentId,
          subjectId: userId,
          relation: TEST_DOCUMENT_SUBJECT_RELATIONS.USER_OWNER,
        })),
      );

      const resultsPost = await documentResource.listRelations({
        resourceId: documentId,
        subjectType: RESOURCE_TYPES.TEST_USER,
      });

      expect(resultsPost.length).toBe(userIds.length);
    });

    it('should accept resourceId, subjectType, subjectId', async () => {
      const user1Id = v4();
      const user2Id = v4();
      const userIds = [user1Id, user2Id];
      const documentId = v4();

      const resultsPre = await documentResource.listRelations({
        resourceId: documentId,
        subjectType: RESOURCE_TYPES.TEST_USER,
      });

      expect(resultsPre.length).toBe(0);

      await documentResource.writeRelations(
        userIds.map((userId) => ({
          operation: v1.RelationshipUpdate_Operation.CREATE,
          resourceId: documentId,
          subjectId: userId,
          relation: TEST_DOCUMENT_SUBJECT_RELATIONS.USER_OWNER,
        })),
      );

      const resultsPost = await documentResource.listRelations({
        resourceId: documentId,
        subjectType: RESOURCE_TYPES.TEST_USER,
        subjectId: user1Id,
      });

      expect(resultsPost.length).toBe(1);
    });

    it('should accept resourceId, subjectType, relation', async () => {
      const user1Id = v4();
      const user2Id = v4();
      const userAndRelations = [
        {
          userId: user1Id,
          relation: TEST_DOCUMENT_SUBJECT_RELATIONS.USER_OWNER,
        },
        {
          userId: user2Id,
          relation: TEST_DOCUMENT_SUBJECT_RELATIONS.USER_READER,
        },
      ];
      const documentId = v4();

      const resultsPre = await documentResource.listRelations({
        resourceId: documentId,
        subjectType: RESOURCE_TYPES.TEST_USER,
      });

      expect(resultsPre.length).toBe(0);

      await documentResource.writeRelations(
        userAndRelations.map(({ userId, relation }) => ({
          operation: v1.RelationshipUpdate_Operation.CREATE,
          resourceId: documentId,
          subjectId: userId,
          relation,
        })),
      );

      const orgRelations = await documentResource.listRelations({
        resourceId: documentId,
        subjectType: RESOURCE_TYPES.TEST_ORG,
        relation: TEST_DOCUMENT_RELATIONS.ORG,
      });

      const ownerRelations = await documentResource.listRelations({
        resourceId: documentId,
        subjectType: RESOURCE_TYPES.TEST_USER,
        relation: TEST_DOCUMENT_RELATIONS.OWNER,
      });

      const readerRelations = await documentResource.listRelations({
        resourceId: documentId,
        subjectType: RESOURCE_TYPES.TEST_USER,
        relation: TEST_DOCUMENT_RELATIONS.READER,
      });

      const writerRelations = await documentResource.listRelations({
        resourceId: documentId,
        subjectType: RESOURCE_TYPES.TEST_USER,
        relation: TEST_DOCUMENT_RELATIONS.WRITER,
      });

      expect(orgRelations.length).toBe(0);
      expect(ownerRelations.length).toBe(1);
      expect(readerRelations.length).toBe(1);
      expect(writerRelations.length).toBe(0);
    });

    it('should accept resourceId, subjectType, subjectId and relation', async () => {
      const user1Id = v4();
      const user2Id = v4();
      const userAndRelations = [
        {
          userId: user1Id,
          relation: TEST_DOCUMENT_SUBJECT_RELATIONS.USER_OWNER,
        },
        {
          userId: user2Id,
          relation: TEST_DOCUMENT_SUBJECT_RELATIONS.USER_READER,
        },
      ];
      const documentId = v4();

      const resultsPre = await documentResource.listRelations({
        resourceId: documentId,
        subjectType: RESOURCE_TYPES.TEST_USER,
      });

      expect(resultsPre.length).toBe(0);

      await documentResource.writeRelations(
        userAndRelations.map(({ userId, relation }) => ({
          operation: v1.RelationshipUpdate_Operation.CREATE,
          resourceId: documentId,
          subjectId: userId,
          relation,
        })),
      );

      const ownerRelations = await documentResource.listRelations({
        resourceId: documentId,
        subjectType: RESOURCE_TYPES.TEST_USER,
        relation: TEST_DOCUMENT_RELATIONS.OWNER,
        subjectId: user1Id,
      });

      const readerRelations = await documentResource.listRelations({
        resourceId: documentId,
        subjectType: RESOURCE_TYPES.TEST_USER,
        relation: TEST_DOCUMENT_RELATIONS.READER,
        subjectId: user2Id,
      });

      expect(ownerRelations.length).toBe(1);
      expect(readerRelations.length).toBe(1);
    });
  });

  describe('hasRelation', () => {
    it('should correctly assert has relations', async () => {
      const userId = v4();
      const documentId = v4();

      const hasRelationsResultsPre = await Promise.all(
        Object.values(TEST_DOCUMENT_SUBJECT_RELATIONS).map((relation) =>
          documentResource.hasRelation({
            resourceId: documentId,
            subjectId: userId,
            relation,
          }),
        ),
      );

      expect(hasRelationsResultsPre.every((result) => result === false)).toBe(
        true,
      );

      await documentResource.writeRelations(
        Object.values(TEST_DOCUMENT_SUBJECT_RELATIONS).map((relation) => ({
          resourceId: documentId,
          subjectId: userId,
          relation,
          operation: v1.RelationshipUpdate_Operation.CREATE,
        })),
      );

      const hasRelationsResultsPost = await Promise.all(
        Object.values(TEST_DOCUMENT_SUBJECT_RELATIONS).map((relation) =>
          documentResource.hasRelation({
            resourceId: documentId,
            subjectId: userId,
            relation,
          }),
        ),
      );

      expect(hasRelationsResultsPost.every((result) => result === true)).toBe(
        true,
      );
    });
  });

  describe('bulkHasRelations', () => {
    it('should correctly assert has relations', async () => {
      const userId = v4();
      const documentId = v4();

      const hasRelationChecks = Object.values(
        TEST_DOCUMENT_SUBJECT_RELATIONS,
      ).map((relation) => {
        return {
          resourceId: documentId,
          relation,
          subjectId: userId,
        };
      });

      const hasRelationsResultsPre =
        await documentResource.bulkHasRelations(hasRelationChecks);

      expect(
        hasRelationsResultsPre.every(
          (result) => result.hasPermission === false,
        ),
      ).toBe(true);

      await documentResource.writeRelations(
        Object.values(TEST_DOCUMENT_SUBJECT_RELATIONS).map((relation) => ({
          resourceId: documentId,
          subjectId: userId,
          relation,
          operation: v1.RelationshipUpdate_Operation.CREATE,
        })),
      );

      const hasRelationsResultsPost =
        await documentResource.bulkHasRelations(hasRelationChecks);

      expect(
        hasRelationsResultsPost.every(
          (result) => result.hasPermission === true,
        ),
      ).toBe(true);
    });
  });

  describe('hasPermission', () => {
    it('should correctly assert hasPermission', async () => {
      const userId = v4();
      const documentId = v4();

      const hasPermissionsResultsPre = await Promise.all(
        Object.values(TEST_DOCUMENT_SUBJECT_PERMISSIONS).map((permission) =>
          documentResource.hasPermission({
            resourceId: documentId,
            subjectId: userId,
            permission,
          }),
        ),
      );

      expect(hasPermissionsResultsPre.every((result) => result === false)).toBe(
        true,
      );

      await writeAllRelationsForUser({ documentId, userId });

      const hasPermissionsResultsPost = await Promise.all(
        Object.values(TEST_DOCUMENT_SUBJECT_PERMISSIONS).map((permission) =>
          documentResource.hasPermission({
            resourceId: documentId,
            subjectId: userId,
            permission,
          }),
        ),
      );

      expect(hasPermissionsResultsPost.every((result) => result === true)).toBe(
        true,
      );
    });

    it('should use the subjectId token when looking up the hierarchy', async () => {
      const documentId = v4();
      const existingMemberId = v4();
      const newMemberId = v4();
      const orgId = v4();

      await orgResource.writeRelation({
        resourceId: orgId,
        subjectId: existingMemberId,
        relation: TEST_ORG_SUBJECT_RELATIONS.USER_MEMBER,
      });

      await documentResource.writeRelation({
        resourceId: documentId,
        subjectId: orgId,
        relation: TEST_DOCUMENT_SUBJECT_RELATIONS.ORG_ORG,
      });

      const existingMemberCanRead = await documentResource.hasPermission({
        resourceId: documentId,
        subjectId: existingMemberId,
        permission: TEST_DOCUMENT_SUBJECT_PERMISSIONS.USER_READ,
      });

      expect(existingMemberCanRead).toBe(true);

      // add a new user
      await orgResource.writeRelation({
        resourceId: orgId,
        subjectId: newMemberId,
        relation: TEST_ORG_SUBJECT_RELATIONS.USER_MEMBER,
      });

      // check if they can view the document which will check if they are
      // a member of the org, in doing so it will use the subjectId token
      // aka the newMemberId's token in this case which would have been updated
      // after we added them to the org in the previous writeRelation
      const newMemberCanRead = await documentResource.hasPermission({
        resourceId: documentId,
        subjectId: newMemberId,
        permission: TEST_DOCUMENT_SUBJECT_PERMISSIONS.USER_READ,
      });

      expect(newMemberCanRead).toBe(true);
    });
  });

  describe('bulkHasPermissions', () => {
    it('should correctly assert each permission requested when checking for a single resource vs multiple subjects', async () => {
      const documentId = v4();
      const userOneId = v4();
      const userTwoId = v4();
      const userThreeId = v4();
      const users = [userOneId, userTwoId, userThreeId];

      const hasPermissionChecks = Object.values(
        TEST_DOCUMENT_SUBJECT_PERMISSIONS,
      )
        .map((permission) => {
          return users.map((subjectId) => {
            return {
              resourceId: documentId,
              permission,
              subjectId,
            };
          });
        })
        .flat();

      const hasPermissionsResultsPre =
        await documentResource.bulkHasPermissions(hasPermissionChecks);

      expect(
        hasPermissionsResultsPre.every(
          (result) => result.hasPermission === false,
        ),
      ).toBe(true);

      await writeAllRelationsForUser({ documentId, userId: userOneId });
      await writeAllRelationsForUser({ documentId, userId: userTwoId });
      await writeAllRelationsForUser({ documentId, userId: userThreeId });

      const hasPermissionsResultsPost =
        await documentResource.bulkHasPermissions(hasPermissionChecks);
      expect(
        hasPermissionsResultsPost.every(
          (result) => result.hasPermission === true,
        ),
      ).toBe(true);
    });

    it('should correctly assert each permission requested when checking for a single subject vs multiple resources', async () => {
      const documentOneId = v4();
      const documentTwoId = v4();
      const documentThreeId = v4();
      const documents = [documentOneId, documentTwoId, documentThreeId];
      const userId = v4();

      const hasPermissionChecks = Object.values(
        TEST_DOCUMENT_SUBJECT_PERMISSIONS,
      )
        .map((permission) => {
          return documents.map((resourceId) => {
            return {
              resourceId,
              permission,
              subjectId: userId,
            };
          });
        })
        .flat();

      const hasPermissionsResultsPre =
        await documentResource.bulkHasPermissions(hasPermissionChecks);

      expect(
        hasPermissionsResultsPre.every(
          (result) => result.hasPermission === false,
        ),
      ).toBe(true);

      await writeAllRelationsForUser({ documentId: documentOneId, userId });
      await writeAllRelationsForUser({ documentId: documentTwoId, userId });
      await writeAllRelationsForUser({ documentId: documentThreeId, userId });

      const hasPermissionsResultsPost =
        await documentResource.bulkHasPermissions(hasPermissionChecks);
      expect(
        hasPermissionsResultsPost.every(
          (result) => result.hasPermission === true,
        ),
      ).toBe(true);
    });

    it('should use the subjectId token when looking up the hierarchy', async () => {
      const documentId = v4();
      const existingMemberId = v4();
      const newMemberId = v4();
      const orgId = v4();

      await orgResource.writeRelation({
        resourceId: orgId,
        subjectId: existingMemberId,
        relation: TEST_ORG_SUBJECT_RELATIONS.USER_MEMBER,
      });

      await documentResource.writeRelation({
        resourceId: documentId,
        subjectId: orgId,
        relation: TEST_DOCUMENT_SUBJECT_RELATIONS.ORG_ORG,
      });

      const permissionChecksPre = await documentResource.bulkHasPermissions([
        {
          resourceId: documentId,
          permission: TEST_DOCUMENT_SUBJECT_PERMISSIONS.USER_READ,
          subjectId: existingMemberId,
        },
        {
          resourceId: documentId,
          permission: TEST_DOCUMENT_SUBJECT_PERMISSIONS.USER_READ,
          subjectId: newMemberId,
        },
      ]);

      expect(permissionChecksPre.length).toBe(2);
      expect(
        permissionChecksPre.find(
          (result) => result.subjectId === existingMemberId,
        )?.hasPermission,
      ).toBe(true);
      expect(
        permissionChecksPre.find((result) => result.subjectId === newMemberId)
          ?.hasPermission,
      ).toBe(false);

      // add the new user
      await orgResource.writeRelation({
        resourceId: orgId,
        subjectId: newMemberId,
        relation: TEST_ORG_SUBJECT_RELATIONS.USER_MEMBER,
      });

      // // check if they can view the document which will check if they are
      // // a member of the org, in doing so it will use the subjectId token
      // // aka the newMemberId's token in this case which would have been updated
      // // after we added them to the org in the previous writeRelation
      const permissionChecksPost = await documentResource.bulkHasPermissions([
        {
          resourceId: documentId,
          permission: TEST_DOCUMENT_SUBJECT_PERMISSIONS.USER_READ,
          subjectId: existingMemberId,
        },
        {
          resourceId: documentId,
          permission: TEST_DOCUMENT_SUBJECT_PERMISSIONS.USER_READ,
          subjectId: newMemberId,
        },
      ]);

      expect(permissionChecksPre.length).toBe(2);
      expect(
        permissionChecksPost.every((result) => result.hasPermission === true),
      ).toBe(true);
    });
  });

  describe('deleteRelationships', () => {
    it('should accept only resourceId, deleting all of its relationships', async () => {
      const userId = v4();
      const documentId = v4();

      await writeAllRelationsForUser({ documentId, userId });

      const hasRelationsResultsPre = await Promise.all(
        Object.values(TEST_DOCUMENT_SUBJECT_RELATIONS).map((relation) =>
          documentResource.hasRelation({
            resourceId: documentId,
            subjectId: userId,
            relation,
          }),
        ),
      );

      expect(hasRelationsResultsPre.every((result) => result === true)).toBe(
        true,
      );

      await documentResource.deleteRelationships({
        resourceId: documentId,
      });

      const hasRelationsResultsPost = await Promise.all(
        Object.values(TEST_DOCUMENT_SUBJECT_RELATIONS).map((relation) =>
          documentResource.hasRelation({
            resourceId: documentId,
            subjectId: userId,
            relation,
          }),
        ),
      );

      expect(hasRelationsResultsPost.every((result) => result === false)).toBe(
        true,
      );
    });

    it('should accept resourceId, subjectId and subjectType', async () => {
      const userId = v4();
      const documentId = v4();

      await writeAllRelationsForUser({ documentId, userId });

      const hasRelationsResultsPre = await Promise.all(
        Object.values(TEST_DOCUMENT_SUBJECT_RELATIONS).map((relation) =>
          documentResource.hasRelation({
            resourceId: documentId,
            subjectId: userId,
            relation,
          }),
        ),
      );

      expect(hasRelationsResultsPre.every((result) => result === true)).toBe(
        true,
      );

      await documentResource.deleteRelationships({
        resourceId: documentId,
        subjectId: userId,
        subjectType: RESOURCE_TYPES.TEST_USER,
      });

      const hasRelationsResultsPost = await Promise.all(
        Object.values([
          TEST_DOCUMENT_SUBJECT_RELATIONS.USER_OWNER,
          TEST_DOCUMENT_SUBJECT_RELATIONS.USER_READER,
          TEST_DOCUMENT_SUBJECT_RELATIONS.USER_WRITER,
        ]).map((relation) =>
          documentResource.hasRelation({
            resourceId: documentId,
            subjectId: userId,
            relation,
          }),
        ),
      );

      expect(hasRelationsResultsPost.every((result) => result === false)).toBe(
        true,
      );
    });

    it('should accept resourceId, subjectId and relation', async () => {
      const userId = v4();
      const documentId = v4();

      await writeAllRelationsForUser({ documentId, userId });

      const hasRelationsResultsPre = await Promise.all(
        Object.values(TEST_DOCUMENT_SUBJECT_RELATIONS).map((relation) =>
          documentResource.hasRelation({
            resourceId: documentId,
            subjectId: userId,
            relation,
          }),
        ),
      );

      expect(hasRelationsResultsPre.every((result) => result === true)).toBe(
        true,
      );

      await documentResource.deleteRelationships({
        resourceId: documentId,
        subjectId: userId,
        relation: TEST_DOCUMENT_SUBJECT_RELATIONS.USER_OWNER,
      });

      const actualOwnerRelation = await documentResource.hasRelation({
        resourceId: documentId,
        subjectId: userId,
        relation: TEST_DOCUMENT_SUBJECT_RELATIONS.USER_OWNER,
      });

      expect(actualOwnerRelation).toBe(false);
    });

    it('should accept resourceId, subjectType, subjectRelation', async () => {
      const userId = v4();
      const documentId = v4();

      await writeAllRelationsForUser({ documentId, userId });

      const hasRelationsResultsPre = await Promise.all(
        Object.values(TEST_DOCUMENT_SUBJECT_RELATIONS).map((relation) =>
          documentResource.hasRelation({
            resourceId: documentId,
            subjectId: userId,
            relation,
          }),
        ),
      );

      expect(hasRelationsResultsPre.every((result) => result === true)).toBe(
        true,
      );

      const orgRelationsPre = await documentResource.listRelations({
        resourceId: documentId,
        subjectType: RESOURCE_TYPES.TEST_ORG,
      });

      expect(orgRelationsPre.length).toBe(1);

      await documentResource.deleteRelationships({
        resourceId: documentId,
        subjectType: RESOURCE_TYPES.TEST_USER,
      });

      const userRelations = await documentResource.listRelations({
        resourceId: documentId,
        subjectType: RESOURCE_TYPES.TEST_USER,
      });

      expect(userRelations.length).toBe(0);

      const orgRelationsPost = await documentResource.listRelations({
        resourceId: documentId,
        subjectType: RESOURCE_TYPES.TEST_ORG,
      });

      expect(orgRelationsPost.length).toBe(1);
    });
  });

  describe('deleteManyRelationships', () => {
    it('should accept a list of deletions', async () => {
      const userId = v4();
      const documentId1 = v4();
      const documentId2 = v4();

      await writeAllRelationsForUser({ documentId: documentId1, userId });
      await writeAllRelationsForUser({ documentId: documentId2, userId });

      const hasDoc1RelationsResultsPre = await Promise.all(
        Object.values(TEST_DOCUMENT_SUBJECT_RELATIONS).map((relation) =>
          documentResource.hasRelation({
            resourceId: documentId1,
            subjectId: userId,
            relation,
          }),
        ),
      );

      const hasDoc2RelationsResultsPre = await Promise.all(
        Object.values(TEST_DOCUMENT_SUBJECT_RELATIONS).map((relation) =>
          documentResource.hasRelation({
            resourceId: documentId2,
            subjectId: userId,
            relation,
          }),
        ),
      );

      expect(
        hasDoc1RelationsResultsPre.every((result) => result === true),
      ).toBe(true);
      expect(
        hasDoc2RelationsResultsPre.every((result) => result === true),
      ).toBe(true);

      await documentResource.deleteManyRelationships([
        {
          resourceId: documentId1,
        },
        {
          resourceId: documentId2,
        },
      ]);

      const hasDoc1RelationsResultsPost = await Promise.all(
        Object.values(TEST_DOCUMENT_SUBJECT_RELATIONS).map((relation) =>
          documentResource.hasRelation({
            resourceId: documentId1,
            subjectId: userId,
            relation,
          }),
        ),
      );

      const hasDoc2RelationsResultsPost = await Promise.all(
        Object.values(TEST_DOCUMENT_SUBJECT_RELATIONS).map((relation) =>
          documentResource.hasRelation({
            resourceId: documentId2,
            subjectId: userId,
            relation,
          }),
        ),
      );

      expect(
        hasDoc1RelationsResultsPost.every((result) => result === false),
      ).toBe(true);
      expect(
        hasDoc2RelationsResultsPost.every((result) => result === false),
      ).toBe(true);
    });
  });
});
