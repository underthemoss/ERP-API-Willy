import { objectType, queryField, list, nonNull, enumType, arg } from 'nexus';
import { ResourceMapResourcesService } from '../../services/resource_map';
import { GraphQLContext } from '../context';
import { normalizeResourceMapTagType } from '../../services/resource_map/tag-types';

export const ResourceMapTagTypeEnum = enumType({
  name: 'ResourceMapTagType',
  members: ['LOCATION', 'BUSINESS_UNIT', 'ROLE'],
});

export const ResourceMapResource = objectType({
  name: 'ResourceMapResource',
  definition(t) {
    t.nonNull.string('id', { resolve: (root) => (root as any)._id });
    t.nonNull.string('resource_id');
    t.string('parent_id');
    t.string('hierarchy_id');
    t.string('hierarchy_name');
    t.list.nonNull.string('path');
    t.nonNull.string('tenant_id');
    t.string('type');
    t.field('tagType', {
      type: ResourceMapTagTypeEnum,
      resolve: (root) => {
        return normalizeResourceMapTagType((root as any).type);
      },
    });
    t.string('value');
    t.field('parent', {
      type: 'ResourceMapResource',
      resolve: async (root, _args, ctx: GraphQLContext) => {
        const parentId = (root as any).parent_id;
        if (!parentId) {
          return null;
        }
        const service: ResourceMapResourcesService =
          ctx.services.resourceMapResourcesService;
        // Optionally, you may want to pass ctx.user for tenant scoping
        return service.getResourceMapEntryById(parentId, ctx.user);
      },
    });

    t.list.field('children', {
      type: 'ResourceMapResource',
      resolve: async (root, _args, ctx: GraphQLContext) => {
        const id = (root as any)._id || (root as any).id;
        if (!id) {
          return [];
        }
        const service: ResourceMapResourcesService =
          ctx.services.resourceMapResourcesService;
        return service.getResourceMapEntriesByParentId(id, ctx.user);
      },
    });
  },
});

export const getResourceMapEntries = queryField('listResourceMapEntries', {
  type: list('ResourceMapResource'),
  description:
    'Get all resource map entries filtered by tenant_id (from the calling user company id)',
  resolve: async (_root, _args, ctx: GraphQLContext) => {
    const service: ResourceMapResourcesService =
      ctx.services.resourceMapResourcesService;
    return service.getResourceMapEntries(ctx.user);
  },
});

export const getResourceMapEntry = queryField('getResourceMapEntry', {
  type: 'ResourceMapResource',
  description: 'Get a single resource map entry by id, with tenant check',
  args: {
    id: nonNull('String'),
  },
  resolve: async (_root, args, ctx: GraphQLContext) => {
    if (!args.id) {
      throw new Error('id is required');
    }
    const service: ResourceMapResourcesService =
      ctx.services.resourceMapResourcesService;
    return service.getResourceMapEntryById(args.id, ctx.user);
  },
});

export const listResourceMapEntitiesByParentId = queryField(
  'listResourceMapEntriesByParentId',
  {
    type: list('ResourceMapResource'),
    description:
      'List resource map entities by parent_id (with tenant scoping)',
    args: {
      parent_id: nonNull('String'),
    },
    resolve: async (_root, args, ctx: GraphQLContext) => {
      const service: ResourceMapResourcesService =
        ctx.services.resourceMapResourcesService;
      return service.getResourceMapEntriesByParentId(args.parent_id, ctx.user);
    },
  },
);

export const listResourceMapEntriesByTagType = queryField(
  'listResourceMapEntriesByTagType',
  {
    type: list('ResourceMapResource'),
    description: 'List resource map entries filtered by tag type',
    args: {
      types: nonNull(arg({ type: nonNull(list(nonNull(ResourceMapTagTypeEnum))) })),
    },
    resolve: async (_root, args, ctx: GraphQLContext) => {
      const service: ResourceMapResourcesService =
        ctx.services.resourceMapResourcesService;
      const entries = await service.getResourceMapEntries(ctx.user);
      const typeSet = new Set(args.types);
      return entries.filter((entry) => {
        const tagType = normalizeResourceMapTagType(entry.type);
        return tagType && typeSet.has(tagType);
      });
    },
  },
);
