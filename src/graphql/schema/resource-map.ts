import {
  objectType,
  queryField,
  list,
  nonNull,
  enumType,
  arg,
  inputObjectType,
  mutationField,
} from 'nexus';
import {
  ResourceMapResourcesService,
  type CreateResourceMapTagInput as CreateResourceMapTagInputDoc,
  type UpdateResourceMapTagInput as UpdateResourceMapTagInputDoc,
  type ListResourceMapLocationTagsInput,
} from '../../services/resource_map';
import { GraphQLContext } from '../context';
import { normalizeResourceMapTagType } from '../../services/resource_map/tag-types';
import {
  RESOURCE_MAP_GEOFENCE_TYPE,
  RESOURCE_MAP_LOCATION_KIND,
  type ResourceMapLocation as ResourceMapLocationDoc,
} from '../../services/resource_map/location-types';

export const ResourceMapTagTypeEnum = enumType({
  name: 'ResourceMapTagType',
  members: ['LOCATION', 'BUSINESS_UNIT', 'ROLE'],
});

export const ResourceMapLocationTypeEnum = enumType({
  name: 'ResourceMapLocationType',
  members: Object.values(RESOURCE_MAP_LOCATION_KIND),
});

export const ResourceMapGeofenceTypeEnum = enumType({
  name: 'ResourceMapGeofenceType',
  members: Object.values(RESOURCE_MAP_GEOFENCE_TYPE),
});

export const ResourceMapLatLng = objectType({
  name: 'ResourceMapLatLng',
  definition(t) {
    t.nonNull.float('lat');
    t.nonNull.float('lng');
    t.float('accuracyMeters');
  },
});

export const ResourceMapAddress = objectType({
  name: 'ResourceMapAddress',
  definition(t) {
    t.string('line1');
    t.string('line2');
    t.string('city');
    t.string('state');
    t.string('postalCode');
    t.string('country');
    t.string('placeId');
  },
});

export const ResourceMapPlusCode = objectType({
  name: 'ResourceMapPlusCode',
  definition(t) {
    t.nonNull.string('code');
    t.string('localArea');
  },
});

export const ResourceMapGeofence = objectType({
  name: 'ResourceMapGeofence',
  definition(t) {
    t.nonNull.field('type', { type: ResourceMapGeofenceTypeEnum });
    t.field('center', { type: ResourceMapLatLng });
    t.float('radiusMeters');
    t.list.nonNull.field('polygon', { type: ResourceMapLatLng });
  },
});

export const ResourceMapLocation = objectType({
  name: 'ResourceMapLocation',
  definition(t) {
    t.nonNull.field('kind', { type: ResourceMapLocationTypeEnum });
    t.field('address', { type: ResourceMapAddress });
    t.field('latLng', { type: ResourceMapLatLng });
    t.field('plusCode', { type: ResourceMapPlusCode });
    t.field('geofence', { type: ResourceMapGeofence });
  },
});

export const ResourceMapLatLngInput = inputObjectType({
  name: 'ResourceMapLatLngInput',
  definition(t) {
    t.nonNull.float('lat');
    t.nonNull.float('lng');
    t.float('accuracyMeters');
  },
});

export const ResourceMapAddressInput = inputObjectType({
  name: 'ResourceMapAddressInput',
  definition(t) {
    t.string('line1');
    t.string('line2');
    t.string('city');
    t.string('state');
    t.string('postalCode');
    t.string('country');
    t.string('placeId');
  },
});

export const ResourceMapPlusCodeInput = inputObjectType({
  name: 'ResourceMapPlusCodeInput',
  definition(t) {
    t.nonNull.string('code');
    t.string('localArea');
  },
});

export const ResourceMapGeofenceInput = inputObjectType({
  name: 'ResourceMapGeofenceInput',
  definition(t) {
    t.nonNull.field('type', { type: ResourceMapGeofenceTypeEnum });
    t.field('center', { type: ResourceMapLatLngInput });
    t.float('radiusMeters');
    t.list.nonNull.field('polygon', { type: ResourceMapLatLngInput });
  },
});

export const ResourceMapLocationInput = inputObjectType({
  name: 'ResourceMapLocationInput',
  definition(t) {
    t.nonNull.field('kind', { type: ResourceMapLocationTypeEnum });
    t.field('address', { type: ResourceMapAddressInput });
    t.field('latLng', { type: ResourceMapLatLngInput });
    t.field('plusCode', { type: ResourceMapPlusCodeInput });
    t.field('geofence', { type: ResourceMapGeofenceInput });
  },
});

export const ResourceMapBoundsInput = inputObjectType({
  name: 'ResourceMapBoundsInput',
  definition(t) {
    t.nonNull.float('minLat');
    t.nonNull.float('minLng');
    t.nonNull.float('maxLat');
    t.nonNull.float('maxLng');
  },
});

export const ResourceMapNearInput = inputObjectType({
  name: 'ResourceMapNearInput',
  definition(t) {
    t.nonNull.float('lat');
    t.nonNull.float('lng');
    t.nonNull.float('radiusMeters');
  },
});

export const ResourceMapLocationFilterInput = inputObjectType({
  name: 'ResourceMapLocationFilterInput',
  definition(t) {
    t.field('bounds', { type: ResourceMapBoundsInput });
    t.field('near', { type: ResourceMapNearInput });
    t.string('hierarchyId');
  },
});

export const CreateResourceMapTagInput = inputObjectType({
  name: 'CreateResourceMapTagInput',
  definition(t) {
    t.nonNull.string('value');
    t.nonNull.field('type', { type: ResourceMapTagTypeEnum });
    t.string('parentId');
    t.string('hierarchyId');
    t.string('hierarchyName');
    t.field('location', { type: ResourceMapLocationInput });
  },
});

export const UpdateResourceMapTagInput = inputObjectType({
  name: 'UpdateResourceMapTagInput',
  definition(t) {
    t.string('value');
    t.string('parentId');
    t.string('hierarchyId');
    t.string('hierarchyName');
    t.field('location', { type: ResourceMapLocationInput });
  },
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
    t.field('location', {
      type: ResourceMapLocation,
      resolve: (root) => {
        return mapLocationDocToGraphQL((root as any).location);
      },
    });
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
      return service.getResourceMapEntriesByTagTypes(args.types, ctx.user);
    },
  },
);

export const listResourceMapLocationTags = queryField(
  'listResourceMapLocationTags',
  {
    type: list('ResourceMapResource'),
    description:
      'List location tags with optional bounds/near filters for map views',
    args: {
      filter: arg({ type: ResourceMapLocationFilterInput }),
    },
    resolve: async (_root, args, ctx: GraphQLContext) => {
      const service: ResourceMapResourcesService =
        ctx.services.resourceMapResourcesService;
      const filter = args.filter
        ? mapLocationFilterInput(args.filter)
        : undefined;
      return service.listResourceMapLocationTags(filter, ctx.user);
    },
  },
);

export const createResourceMapTag = mutationField('createResourceMapTag', {
  type: 'ResourceMapResource',
  args: {
    input: nonNull(arg({ type: CreateResourceMapTagInput })),
  },
  resolve: async (_root, args, ctx: GraphQLContext) => {
    const service: ResourceMapResourcesService =
      ctx.services.resourceMapResourcesService;
    const input = mapCreateResourceMapTagInput(args.input);
    return service.createResourceMapTag(input, ctx.user);
  },
});

export const updateResourceMapTag = mutationField('updateResourceMapTag', {
  type: 'ResourceMapResource',
  args: {
    id: nonNull('ID'),
    input: nonNull(arg({ type: UpdateResourceMapTagInput })),
  },
  resolve: async (_root, args, ctx: GraphQLContext) => {
    const service: ResourceMapResourcesService =
      ctx.services.resourceMapResourcesService;
    const input = mapUpdateResourceMapTagInput(args.input);
    return service.updateResourceMapTag(args.id, input, ctx.user);
  },
});

export const deleteResourceMapTag = mutationField('deleteResourceMapTag', {
  type: 'ResourceMapResource',
  args: {
    id: nonNull('ID'),
    cascade: arg({ type: 'Boolean' }),
  },
  resolve: async (_root, args, ctx: GraphQLContext) => {
    const service: ResourceMapResourcesService =
      ctx.services.resourceMapResourcesService;
    return service.deleteResourceMapTag(
      args.id,
      { cascade: args.cascade || false },
      ctx.user,
    );
  },
});

const mapLocationDocToGraphQL = (
  location?: ResourceMapLocationDoc | null,
) => {
  if (!location) return null;
  return {
    kind: location.kind,
    address: location.address
      ? {
          line1: location.address.line1,
          line2: location.address.line2,
          city: location.address.city,
          state: location.address.state,
          postalCode: location.address.postal_code,
          country: location.address.country,
          placeId: location.address.place_id,
        }
      : undefined,
    latLng: location.lat_lng
      ? {
          lat: location.lat_lng.lat,
          lng: location.lat_lng.lng,
          accuracyMeters: location.lat_lng.accuracy_meters,
        }
      : undefined,
    plusCode: location.plus_code
      ? {
          code: location.plus_code.code,
          localArea: location.plus_code.local_area,
        }
      : undefined,
    geofence: location.geofence
      ? {
          type: location.geofence.type,
          center: location.geofence.center
            ? {
                lat: location.geofence.center.lat,
                lng: location.geofence.center.lng,
                accuracyMeters: location.geofence.center.accuracy_meters,
              }
            : undefined,
          radiusMeters: location.geofence.radius_meters,
          polygon: location.geofence.polygon?.map((point) => ({
            lat: point.lat,
            lng: point.lng,
            accuracyMeters: point.accuracy_meters,
          })),
        }
      : undefined,
  };
};

const mapLocationInputToDoc = (
  input: any,
): ResourceMapLocationDoc | null => {
  if (!input) return null;
  return {
    kind: input.kind,
    address: input.address
      ? {
          line1: input.address.line1,
          line2: input.address.line2,
          city: input.address.city,
          state: input.address.state,
          postal_code: input.address.postalCode,
          country: input.address.country,
          place_id: input.address.placeId,
        }
      : undefined,
    lat_lng: input.latLng
      ? {
          lat: input.latLng.lat,
          lng: input.latLng.lng,
          accuracy_meters: input.latLng.accuracyMeters,
        }
      : undefined,
    plus_code: input.plusCode
      ? {
          code: input.plusCode.code,
          local_area: input.plusCode.localArea,
        }
      : undefined,
    geofence: input.geofence
      ? {
          type: input.geofence.type,
          center: input.geofence.center
            ? {
                lat: input.geofence.center.lat,
                lng: input.geofence.center.lng,
                accuracy_meters: input.geofence.center.accuracyMeters,
              }
            : undefined,
          radius_meters: input.geofence.radiusMeters,
          polygon: input.geofence.polygon?.map((point: any) => ({
            lat: point.lat,
            lng: point.lng,
            accuracy_meters: point.accuracyMeters,
          })),
        }
      : undefined,
  };
};

const mapCreateResourceMapTagInput = (
  input: any,
): CreateResourceMapTagInputDoc => {
  return {
    value: input.value,
    type: input.type,
    parent_id: input.parentId ?? undefined,
    hierarchy_id: input.hierarchyId ?? undefined,
    hierarchy_name: input.hierarchyName ?? undefined,
    location: mapLocationInputToDoc(input.location),
  };
};

const mapUpdateResourceMapTagInput = (
  input: any,
): UpdateResourceMapTagInputDoc => {
  const mapped: UpdateResourceMapTagInputDoc = {};
  if ('value' in input) mapped.value = input.value;
  if ('parentId' in input) mapped.parent_id = input.parentId;
  if ('hierarchyId' in input) mapped.hierarchy_id = input.hierarchyId;
  if ('hierarchyName' in input) mapped.hierarchy_name = input.hierarchyName;
  if ('location' in input) mapped.location = mapLocationInputToDoc(input.location);
  return mapped;
};

const mapLocationFilterInput = (input: any): ListResourceMapLocationTagsInput => {
  const mapped: ListResourceMapLocationTagsInput = {};
  if (input.bounds) {
    mapped.bounds = {
      min_lat: input.bounds.minLat,
      min_lng: input.bounds.minLng,
      max_lat: input.bounds.maxLat,
      max_lng: input.bounds.maxLng,
    };
  }
  if (input.near) {
    mapped.near = {
      lat: input.near.lat,
      lng: input.near.lng,
      radius_meters: input.near.radiusMeters,
    };
  }
  if ('hierarchyId' in input) {
    mapped.hierarchy_id = input.hierarchyId;
  }
  return mapped;
};
