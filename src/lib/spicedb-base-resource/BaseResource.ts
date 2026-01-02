import { performance } from 'perf_hooks';
import { v1 } from '@authzed/authzed-node';
import { logger, Logger } from '../logger';
import { Redis } from 'ioredis';
import { AuthzedClient } from '../authz/spiceDB-client';

const LOGGING_CODE = 'authz/baseResource';
// This corresponds directly to the `datastore-revision-quantization-interval` flag value, which defaults to 5s
const QUANT_INTERVAL_SEC = 5;
const ZEDTOKEN_CACHE_TTL_SEC = QUANT_INTERVAL_SEC * 2;
const REDIS_VALUE_DELIMITER = '__';

export enum Consistency {
  minimizeLatency,
  fullyConsistent,
  atLeastAsFresh,
}

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

export type WriteRelationOpts<SubjectRelation extends string> = {
  subjectId: string;
  resourceId: string;
  operation?: v1.RelationshipUpdate_Operation;
  relation: SubjectRelation;
};

export type HasRelationOpts<SubjectRelation extends string> = {
  subjectId: string;
  resourceId: string;
  relation: SubjectRelation;
};

export type BulkHasRelationOpts<SubjectRelation extends string> = {
  subjectId: string;
  resourceId: string;
  relation: SubjectRelation;
};

export type HasPermissionOpts<SubjectPermission extends string> = {
  subjectId: string;
  resourceId: string;
  permission: SubjectPermission;
};

export type BulkHasPermissionOpts<SubjectPermission extends string> = {
  resourceId: string;
  permission: SubjectPermission;
  subjectId: string;
};

export type DeleteRelationsOpts<
  ResourceType extends string,
  SubjectRelation extends string,
> = {
  resourceId?: string;
  relation?: SubjectRelation;
  subjectId?: string;
  subjectType?: ResourceType;
};

type ZedTokenRedisKey = `ts_zedToken_${string}`;
type ParsedRedisValue = { zedToken: v1.ZedToken; timestamp: number };

export class BaseResourceWithCaching<
  Relation extends string,
  Permission extends string,
  ResourceType extends string,
  SubjectRelations extends string,
  SubjectPermissions extends string,
> {
  protected readonly client: AuthzedClient;
  protected readonly resourceType: ResourceType;
  protected readonly redis: Redis;
  protected readonly logger: Logger;
  protected readonly subjectRelationsMap: SubjectRelationsMapType<
    ResourceType,
    Relation,
    SubjectRelations
  >;
  protected readonly subjectPermissionsMap: SubjectPermissionsMapType<
    ResourceType,
    Permission,
    SubjectPermissions
  >;

  constructor(
    client: AuthzedClient,
    redis: Redis,
    resourceType: ResourceType,
    subjectRelationsMap: SubjectRelationsMapType<
      ResourceType,
      Relation,
      SubjectRelations
    >,
    subjectPermissionsMap: SubjectPermissionsMapType<
      ResourceType,
      Permission,
      SubjectPermissions
    >,
  ) {
    this.client = client;
    this.redis = redis;
    this.resourceType = resourceType;
    this.logger = logger.child({
      resourceType: this.resourceType,
      code: LOGGING_CODE,
    });
    this.subjectRelationsMap = subjectRelationsMap;
    this.subjectPermissionsMap = subjectPermissionsMap;
  }

  private getRedisKeyForResource(resourceId: string): ZedTokenRedisKey {
    return `ts_zedToken_${this.resourceType}_${resourceId}`;
  }

  private getRedisKeyForSubject(opts: {
    subjectId: string;
    subjectType: ResourceType;
  }): ZedTokenRedisKey {
    return `ts_zedToken_${opts.subjectType}_${opts.subjectId}`;
  }

  private async getCachedZedTokens(
    redisKeys: ZedTokenRedisKey[],
  ): Promise<ParsedRedisValue[] | undefined> {
    const values = await this.redis.mget(redisKeys);

    if (values.length < 1) {
      return undefined;
    }

    const parsedValues = values.map((value, idx) => {
      if (!value) {
        return undefined;
      }
      const [timestamp, token] = value.split(REDIS_VALUE_DELIMITER);

      return {
        timestamp: parseInt(timestamp),
        zedToken: v1.ZedToken.create({
          token,
        }),
      };
    });
    return parsedValues.filter((v) => v !== undefined) as ParsedRedisValue[];
  }

  private async getMostRecentCachedZedToken(opts: {
    resourceIds: string[];
    subjects: {
      subjectId: string;
      subjectType: ResourceType;
    }[];
  }) {
    const { resourceIds, subjects } = opts;
    const redisValues: ParsedRedisValue[] = [];

    if (
      (!resourceIds || resourceIds.length < 0) &&
      (!subjects || subjects.length < 0)
    ) {
      throw new Error('Expected either a resourceId or a subjectId, got none');
    }

    const keys = [
      ...(resourceIds?.map((resourceId) =>
        this.getRedisKeyForResource(resourceId),
      ) || []),
      ...(subjects?.map(({ subjectId, subjectType }) =>
        this.getRedisKeyForSubject({ subjectId, subjectType }),
      ) || []),
    ];

    const uniqueKeys = Array.from(new Set(keys));

    const tokens = await this.getCachedZedTokens(uniqueKeys);
    if (tokens) {
      redisValues.push(...tokens);
    }

    return this.pickMostRecentToken(redisValues);
  }

  private pickMostRecentToken(
    cachedValues: ParsedRedisValue[],
  ): v1.ZedToken | undefined {
    if (cachedValues.length === 0) {
      return undefined;
    }

    let mostRecent = cachedValues[0];
    for (const item of cachedValues) {
      if (item.timestamp > mostRecent.timestamp) {
        mostRecent = item;
      }
    }

    return mostRecent.zedToken;
  }

  protected async cacheZedToken(opts: {
    redisKey: ZedTokenRedisKey | ZedTokenRedisKey[];
    token?: string;
    timestamp: number;
  }) {
    const { redisKey, token, timestamp } = opts;
    if (!token) {
      return;
    }

    const value = `${timestamp}${REDIS_VALUE_DELIMITER}${token}`;

    try {
      if (redisKey instanceof Array) {
        await Promise.all(
          redisKey.map((key) =>
            this.redis.set(key, value, 'EX', ZEDTOKEN_CACHE_TTL_SEC),
          ),
        );
      } else {
        await this.redis.set(redisKey, value, 'EX', ZEDTOKEN_CACHE_TTL_SEC);
      }
    } catch (err) {
      this.logger.error({ err, redisKey, value }, 'Failed to cache zedToken');
    }
  }

  protected getConsistency(consistency: Consistency, token?: v1.ZedToken) {
    switch (consistency) {
      case Consistency.fullyConsistent:
        return v1.Consistency.create({
          requirement: {
            oneofKind: 'fullyConsistent',
            fullyConsistent: true,
          },
        });
      case Consistency.atLeastAsFresh:
        if (!token) {
          throw new Error(
            'Expected a token to be provided with atLeastAsFresh',
          );
        }

        return v1.Consistency.create({
          requirement: {
            oneofKind: 'atLeastAsFresh',
            atLeastAsFresh: token,
          },
        });
      case Consistency.minimizeLatency:
        return v1.Consistency.create({
          requirement: {
            oneofKind: 'minimizeLatency',
            minimizeLatency: true,
          },
        });
    }
  }

  protected getObjectReference(resourceId: string) {
    return v1.ObjectReference.create({
      objectType: this.resourceType,
      objectId: resourceId,
    });
  }

  private async writeRelationsBatch(
    relations: WriteRelationOpts<SubjectRelations>[],
  ): Promise<v1.WriteRelationshipsResponse> {
    const updates = relations.map((opts) => {
      const { subjectType, relation } = this.subjectRelationsMap[opts.relation];
      return v1.RelationshipUpdate.create({
        relationship: v1.Relationship.create({
          resource: this.getObjectReference(opts.resourceId),
          relation,
          subject: v1.SubjectReference.create({
            object: v1.ObjectReference.create({
              objectId: opts.subjectId,
              objectType: subjectType,
            }),
          }),
        }),
        operation: opts.operation || v1.RelationshipUpdate_Operation.TOUCH,
      });
    });

    const response = await this.client.writeRelationships(
      v1.WriteRelationshipsRequest.create({
        updates,
      }),
    );

    const resourceRedisKeys = relations.map((opts) =>
      this.getRedisKeyForResource(opts.resourceId),
    );
    const subjectRedisKeys = updates.map(({ relationship }) =>
      this.getRedisKeyForSubject({
        subjectId: relationship?.subject?.object?.objectId as string,
        subjectType: relationship?.subject?.object?.objectType as ResourceType,
      }),
    );

    const redisTS = Date.now();
    await this.cacheZedToken({
      redisKey: resourceRedisKeys,
      token: response.writtenAt?.token,
      timestamp: redisTS,
    });
    await this.cacheZedToken({
      redisKey: subjectRedisKeys,
      token: response.writtenAt?.token,
      timestamp: redisTS,
    });

    return response;
  }

  async writeRelations(relations: WriteRelationOpts<SubjectRelations>[]) {
    const startTime = performance.now();
    const CHUNK_SIZE = 1000;

    // Process in chunks
    const chunks: WriteRelationOpts<SubjectRelations>[][] = [];
    for (let i = 0; i < relations.length; i += CHUNK_SIZE) {
      chunks.push(relations.slice(i, i + CHUNK_SIZE));
    }

    let lastResponse: v1.WriteRelationshipsResponse | undefined;

    for (let i = 0; i < chunks.length; i++) {
      const chunkStartTime = performance.now();
      lastResponse = await this.writeRelationsBatch(chunks[i]);

      if (chunks.length > 1) {
        this.logger.info(
          {
            chunkIndex: i + 1,
            totalChunks: chunks.length,
            chunkSize: chunks[i].length,
            chunkTimeTaken: performance.now() - chunkStartTime,
          },
          'writeRelations - chunk processed',
        );
      }
    }

    this.logger.info(
      {
        relationsCount: relations.length,
        chunksProcessed: chunks.length,
        timeTaken: performance.now() - startTime,
      },
      'writeRelations',
    );

    return lastResponse!;
  }

  async writeRelation(opts: WriteRelationOpts<SubjectRelations>) {
    return this.writeRelations([opts]);
  }

  async hasRelation(opts: HasRelationOpts<SubjectRelations>) {
    const { relation, subjectType } = this.subjectRelationsMap[opts.relation];
    return this.hasPermissionOrRelation({
      resourceId: opts.resourceId,
      subjectId: opts.subjectId,
      relation,
      subjectType,
    });
  }

  async hasRelationOrThrow(opts: HasRelationOpts<SubjectRelations>) {
    const { relation, subjectType } = this.subjectRelationsMap[opts.relation];
    const hasRelation = await this.hasPermissionOrRelation({
      resourceId: opts.resourceId,
      subjectId: opts.subjectId,
      relation,
      subjectType,
    });

    if (!hasRelation) {
      throw new Error(
        `Subject ${subjectType}:${opts.subjectId} does not have relation to resource ${this.resourceType}:${opts.resourceId}`,
      );
    }

    return hasRelation;
  }

  async bulkHasRelations(opts: HasRelationOpts<SubjectRelations>[]) {
    return this.bulkHasPermissionOrRelation(
      opts.map((opt) => {
        const { relation, subjectType } =
          this.subjectRelationsMap[opt.relation];

        return {
          resourceId: opt.resourceId,
          subjectId: opt.subjectId,
          relation,
          subjectType,
        };
      }),
    );
  }

  async hasPermission(opts: HasPermissionOpts<SubjectPermissions>) {
    const { permission, subjectType } =
      this.subjectPermissionsMap[opts.permission];
    return this.hasPermissionOrRelation({
      resourceId: opts.resourceId,
      relation: permission,
      subjectId: opts.subjectId,
      subjectType,
    });
  }

  async hasPermissionOrThrow(opts: HasPermissionOpts<SubjectPermissions>) {
    const { permission, subjectType } =
      this.subjectPermissionsMap[opts.permission];
    const hasPermission = await this.hasPermissionOrRelation({
      resourceId: opts.resourceId,
      relation: permission,
      subjectId: opts.subjectId,
      subjectType,
    });

    if (!hasPermission) {
      throw new Error(
        `Subject ${subjectType}:${opts.subjectId} does not have permission:${permission} on resource ${this.resourceType}:${opts.resourceId}`,
      );
    }

    return hasPermission;
  }

  async bulkHasPermissions(opts: BulkHasPermissionOpts<SubjectPermissions>[]) {
    return this.bulkHasPermissionOrRelation(
      opts.map((opt) => {
        const { permission, subjectType } =
          this.subjectPermissionsMap[opt.permission];

        return {
          resourceId: opt.resourceId,
          subjectId: opt.subjectId,
          relation: permission,
          subjectType,
        };
      }),
    );
  }

  private async hasPermissionOrRelation(opts: {
    resourceId: string;
    relation: Relation | Permission;
    subjectId: string;
    subjectType: ResourceType;
  }) {
    const { resourceId, relation, subjectId, subjectType } = opts;

    // The SYSTEM user is an internal-only actor used by backend workflows (e.g. quote acceptance
    // projecting orders/line-items across workspaces). It must not be blocked by workspace-scoped
    // permission checks that are intended for human users.
    if (subjectType === 'erp/user' && subjectId === 'SYSTEM') {
      return true;
    }

    const resource = this.getObjectReference(resourceId);
    const startTime = performance.now();

    const doPermissionCheck = (
      consistency?: Consistency,
      zedToken?: v1.ZedToken,
    ) => {
      return this.client.checkPermission(
        v1.CheckPermissionRequest.create({
          resource,
          permission: relation,
          subject: v1.SubjectReference.create({
            object: v1.ObjectReference.create({
              objectId: subjectId,
              objectType: subjectType,
            }),
          }),
          consistency: this.getConsistency(
            consistency || Consistency.minimizeLatency,
            zedToken,
          ),
        }),
      );
    };

    // hedge that the vast majority of the time there wont be a zedToken
    // therefore we don't wan't to do the requests in a waterfall fashion
    // instead we're going to do both in parallel, and only if we get a zedToken
    // will we recall spiceDB with the atLeastAsFresh as our consistency level
    const [permissionResult, zedTokenResult] = await Promise.allSettled([
      doPermissionCheck(),
      this.getMostRecentCachedZedToken({
        resourceIds: [resourceId],
        subjects: [
          {
            subjectId,
            subjectType,
          },
        ],
      }),
    ]);

    const zedToken =
      zedTokenResult.status === 'fulfilled' ? zedTokenResult.value : undefined;

    if (!zedToken) {
      if (permissionResult.status === 'rejected') {
        throw permissionResult.reason;
      }

      this.logger.info(
        {
          ...opts,
          consistency: 'minimizeLatency',
          timeTaken: performance.now() - startTime,
        },
        'hasPermissionOrRelation',
      );

      return (
        permissionResult.value.permissionship ===
        v1.CheckPermissionResponse_Permissionship.HAS_PERMISSION
      );
    }

    // we got a zedToken, we need need to preform the check again now with the zedToken
    const res = await doPermissionCheck(Consistency.atLeastAsFresh, zedToken);

    this.logger.info(
      {
        ...opts,
        consistency: 'atLeastAsFresh',
        timeTaken: performance.now() - startTime,
      },
      'hasPermissionOrRelation',
    );
    return (
      res?.permissionship ===
      v1.CheckPermissionResponse_Permissionship.HAS_PERMISSION
    );
  }

  private mapBulkCheckToResult(result: v1.BulkCheckPermissionResponse) {
    return result.pairs.map((pair) => {
      return {
        subjectId: pair.request?.subject?.object?.objectId,
        resourceId: pair.request?.resource?.objectId,
        error:
          pair.response.oneofKind === 'error' ? pair.response.error : undefined,
        hasPermission:
          pair.response.oneofKind === 'item' &&
          pair.response.item.permissionship ===
            v1.CheckPermissionResponse_Permissionship.HAS_PERMISSION,
      };
    });
  }

  private async bulkHasPermissionOrRelation(
    opts: {
      resourceId: string;
      relation: Relation | Permission;
      subjectId: string;
      subjectType: ResourceType;
    }[],
  ) {
    // Fast-path for internal SYSTEM user checks.
    if (
      opts.length > 0 &&
      opts.every(
        (opt) => opt.subjectType === 'erp/user' && opt.subjectId === 'SYSTEM',
      )
    ) {
      return opts.map((opt) => ({
        subjectId: opt.subjectId,
        resourceId: opt.resourceId,
        error: undefined,
        hasPermission: true,
      }));
    }

    const startTime = performance.now();
    const doPermissionCheck = (
      consistency?: Consistency,
      zedToken?: v1.ZedToken,
    ) => {
      const items = opts.map(
        ({ relation, resourceId, subjectId, subjectType }) => {
          return {
            resource: this.getObjectReference(resourceId),
            permission: relation,
            subject: v1.SubjectReference.create({
              object: v1.ObjectReference.create({
                objectId: subjectId,
                objectType: subjectType,
              }),
            }),
          };
        },
      );

      return this.client.bulkCheckPermission(
        v1.BulkCheckPermissionRequest.create({
          items,
          consistency: this.getConsistency(
            consistency || Consistency.minimizeLatency,
            zedToken,
          ),
        }),
      );
    };

    // hedge that the vast majority of the time there wont be a zedToken
    // therefore we don't wan't to do the requests in a waterfall fashion
    // instead we're going to do both in parallel, and only if we get a zedToken
    // will we recall spiceDB with the atLeastAsFresh as our consistency level
    const [permissionResult, zedTokenResult] = await Promise.allSettled([
      doPermissionCheck(),
      this.getMostRecentCachedZedToken({
        resourceIds: opts.map(({ resourceId }) => resourceId),
        subjects: opts.map(({ subjectId, subjectType }) => ({
          subjectId,
          subjectType,
        })),
      }),
    ]);

    const zedToken =
      zedTokenResult.status === 'fulfilled' ? zedTokenResult.value : undefined;

    if (!zedToken) {
      if (permissionResult.status === 'rejected') {
        throw permissionResult.reason;
      }

      this.logger.info(
        {
          ...opts,
          consistency: 'minimizeLatency',
          timeTaken: performance.now() - startTime,
        },
        'bulkHasPermissionOrRelation',
      );

      return this.mapBulkCheckToResult(permissionResult.value);
    }

    // we got a zedToken, we need need to preform the check again now with the zedToken
    const res = await doPermissionCheck(Consistency.atLeastAsFresh, zedToken);

    this.logger.info(
      {
        ...opts,
        consistency: 'atLeastAsFresh',
        timeTaken: performance.now() - startTime,
      },
      'bulkHasPermissionOrRelation',
    );
    return this.mapBulkCheckToResult(res);
  }

  async deleteRelationships(
    opts: DeleteRelationsOpts<ResourceType, SubjectRelations>,
  ) {
    const startTime = performance.now();
    const { resourceId } = opts;

    let optionalRelation;
    let optionalSubjectFilter:
      | (v1.SubjectFilter & { optionalSubjectId?: string })
      | undefined;

    if (opts.subjectType) {
      // @ts-ignore
      optionalSubjectFilter = {
        subjectType: opts.subjectType,
      };
    }

    if (opts.subjectId) {
      // @ts-ignore
      optionalSubjectFilter = {
        ...optionalSubjectFilter,
        optionalSubjectId: opts.subjectId,
      };
    }

    if (opts.relation) {
      const { relation, subjectType } = this.subjectRelationsMap[opts.relation];
      optionalRelation = relation;
      optionalSubjectFilter = {
        subjectType,
        // @ts-ignore
        optionalSubjectId: opts.subjectId,
      };
    }

    let lastResp: v1.DeleteRelationshipsResponse | undefined;
    do {
      lastResp = await this.client.deleteRelationships(
        v1.DeleteRelationshipsRequest.create({
          optionalAllowPartialDeletions: true,
          optionalLimit: 1000,
          relationshipFilter: {
            resourceType: this.resourceType,
            optionalResourceId: resourceId,
            optionalRelation,
            optionalSubjectFilter,
          },
        }),
      );
    } while (
      lastResp?.deletionProgress ===
      v1.DeleteRelationshipsResponse_DeletionProgress.PARTIAL
    );

    const redisTS = Date.now();

    if (resourceId) {
      await this.cacheZedToken({
        redisKey: this.getRedisKeyForResource(resourceId),
        token: lastResp.deletedAt?.token,
        timestamp: redisTS,
      });
    }

    if (optionalSubjectFilter) {
      await this.cacheZedToken({
        redisKey: this.getRedisKeyForSubject({
          subjectId: optionalSubjectFilter.optionalSubjectId,
          subjectType: optionalSubjectFilter.subjectType as ResourceType,
        }),
        token: lastResp.deletedAt?.token,
        timestamp: redisTS,
      });
    }

    this.logger.info(
      {
        ...opts,
        timeTaken: performance.now() - startTime,
      },
      'deleteRelationships',
    );

    return lastResp;
  }

  async deleteManyRelationships(
    optsArr: DeleteRelationsOpts<ResourceType, SubjectRelations>[],
  ) {
    const startTime = performance.now();
    let lastResp: v1.DeleteRelationshipsResponse | undefined;
    for (const opts of optsArr) {
      lastResp = await this.deleteRelationships(opts);
    }

    this.logger.info(
      {
        optsArr,
        timeTaken: performance.now() - startTime,
      },
      'deleteManyRelationships',
    );

    return lastResp;
  }

  async listRelations(opts: {
    relation?: Relation;
    resourceId: string;
    subjectType: ResourceType;
    subjectId?: string;
  }) {
    const { resourceId, relation, subjectType, subjectId } = opts;

    const startTime = performance.now();
    const zedToken = await this.getMostRecentCachedZedToken({
      resourceIds: [resourceId],
      subjects: subjectId ? [{ subjectId, subjectType }] : [],
    });

    const consistency = zedToken
      ? Consistency.atLeastAsFresh
      : Consistency.minimizeLatency;

    const pageSize = 200;
    const results: v1.ReadRelationshipsResponse[] = [];
    let cursor: v1.Cursor | undefined;
    do {
      const users = await this.client.readRelationships(
        v1.ReadRelationshipsRequest.create({
          relationshipFilter: v1.RelationshipFilter.create({
            resourceType: this.resourceType,
            optionalResourceId: resourceId,
            optionalRelation: relation,
            optionalSubjectFilter: {
              subjectType,
              optionalSubjectId: subjectId,
            },
          }),
          optionalCursor: cursor,
          optionalLimit: pageSize,
          consistency: this.getConsistency(consistency, zedToken),
        }),
      );
      if (users.length < pageSize) {
        cursor = undefined;
      } else {
        cursor = users[users.length - 1].afterResultCursor;
      }

      results.push(...users);
    } while (cursor !== undefined);

    this.logger.info(
      {
        ...opts,
        count: results.length,
        timeTaken: performance.now() - startTime,
      },
      'listRelations',
    );

    return results;
  }

  async listResources(opts: {
    permission?: Permission;
    resourceType: ResourceType;
    subjectType?: ResourceType;
    subjectId?: string | string[];
  }): Promise<
    (v1.LookupResourcesResponse & {
      subjectId: string;
    })[]
  > {
    const startTime = performance.now();

    // Note: This would be preferred as a transaction,
    // but we'll only be able to handle that from the next
    // version of SpiceDB - for now just handle it as a promise
    if (Array.isArray(opts.subjectId)) {
      const results: (v1.LookupResourcesResponse & {
        subjectId: string;
      })[] = [];
      for (const subjectId of opts.subjectId) {
        results.push(
          ...(await this.listResources({
            permission: opts.permission,
            subjectId,
            resourceType: opts.resourceType,
            subjectType: opts.subjectType,
          })),
        );
      }

      return results;
    }

    if (!opts.subjectId || !opts.subjectType) {
      throw new Error('Expected either a valid subjects');
    }

    const zedToken = await this.getMostRecentCachedZedToken({
      resourceIds: [],
      subjects: [
        {
          subjectId: opts.subjectId,
          subjectType: opts.subjectType,
        },
      ],
    });

    const consistency = zedToken
      ? Consistency.atLeastAsFresh
      : Consistency.minimizeLatency;

    const pageSize = 200;
    const result: (v1.LookupResourcesResponse & { subjectId: string })[] = [];
    let cursor: v1.Cursor | undefined;
    do {
      const resources = await this.client.lookupResources(
        v1.LookupResourcesRequest.create({
          resourceObjectType: opts.resourceType,
          permission: opts.permission,
          optionalCursor: cursor,
          optionalLimit: pageSize,
          subject: v1.SubjectReference.create({
            object: v1.ObjectReference.create({
              objectId: opts.subjectId,
              objectType: opts.subjectType,
            }),
          }),
          consistency: this.getConsistency(consistency, zedToken),
        }),
        undefined,
        undefined,
      );

      if (resources.length < pageSize) {
        cursor = undefined;
      } else {
        cursor = resources[resources.length - 1].afterResultCursor;
      }

      result.push(
        ...resources.map((resource) => ({
          ...resource,
          subjectId: opts.subjectId as string,
        })),
      );
    } while (cursor !== undefined);

    this.logger.info(
      {
        ...opts,
        count: result.length,
        timeTaken: performance.now() - startTime,
      },
      'listResources',
    );

    return result;
  }
}
