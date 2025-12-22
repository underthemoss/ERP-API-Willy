import { type MongoClient } from 'mongodb';
import {
  ResourceMapResourcesModel,
  createResourceMapResourcesModel,
  ResourceMapResourceInput,
  ResourceMapResourceDoc,
} from './model';
import { UserAuthPayload } from '../../authentication';
import { generateId } from '../../lib/id-generator';
import { ResourceMapResourcesSinkConnector } from './kafka-sink-connector';
import { EnvConfig } from '../../config';
import type { KafkaJS } from '@confluentinc/kafka-javascript';
import {
  RESOURCE_MAP_TAG_TYPE,
  ResourceMapTagType,
  normalizeResourceMapTagType,
} from './tag-types';
import {
  RESOURCE_MAP_GEOFENCE_TYPE,
  RESOURCE_MAP_INTERIOR_SPACE_TYPE,
  RESOURCE_MAP_LOCATION_KIND,
  type ResourceMapGeofence,
  type ResourceMapInteriorMetadata,
  type ResourceMapLatLng,
  type ResourceMapLocation,
  type ResourceMapLocationGeometry,
  type ResourceMapPlusCode,
} from './location-types';
import { geocodeAddressWithMapbox } from './geocoding';

export type ResourceMapTagValidationResult = {
  entries: ResourceMapResourceDoc[];
  tagTypes: ResourceMapTagType[];
};

export type ResourceMapLocationBounds = {
  min_lat: number;
  min_lng: number;
  max_lat: number;
  max_lng: number;
};

export type ResourceMapLocationNear = {
  lat: number;
  lng: number;
  radius_meters: number;
};

export type ListResourceMapLocationTagsInput = {
  bounds?: ResourceMapLocationBounds;
  near?: ResourceMapLocationNear;
  hierarchy_id?: string | null;
};

export type CreateResourceMapTagInput = {
  value: string;
  type: ResourceMapTagType;
  parent_id?: string | null;
  hierarchy_id?: string | null;
  hierarchy_name?: string | null;
  location?: ResourceMapLocation | null;
};

export type UpdateResourceMapTagInput = {
  value?: string | null;
  parent_id?: string | null;
  hierarchy_id?: string | null;
  hierarchy_name?: string | null;
  location?: ResourceMapLocation | null;
};

export class ResourceMapResourcesService {
  private model: ResourceMapResourcesModel;
  private envConfig: EnvConfig;
  constructor(config: { model: ResourceMapResourcesModel; envConfig: EnvConfig }) {
    this.model = config.model;
    this.envConfig = config.envConfig;
  }

  upsertResource = async (
    id: string,
    input: ResourceMapResourceInput,
    user?: UserAuthPayload,
  ) => {
    // auth
    if (!user) {
      throw new Error('User not authenticated');
    }
    // validation
    // business logic
    return this.model.upsertResource(id, {
      ...input,
    });
  };

  batchGetResourceMapEntriesById = async (
    ids: readonly string[],
    user?: UserAuthPayload,
  ) => {
    if (!user) {
      throw new Error('User not authenticated');
    }
    const tenantId = user.companyId;
    if (!tenantId) {
      throw new Error('No es_company_id found on user token');
    }
    // Fetch all resources for these ids
    const docs = await Promise.all(ids.map((id) => this.model.findById(id)));
    // Enforce tenant check
    return docs.map((doc) => (doc && doc.tenant_id === tenantId ? doc : null));
  };

  getResourceMapEntries = async (user?: UserAuthPayload) => {
    if (!user) {
      throw new Error('User not authenticated');
    }
    const tenantId = user.companyId;
    if (!tenantId) {
      throw new Error('No es_company_id found on user token');
    }
    return this.model.findByTenantId(tenantId);
  };

  getResourceMapEntryById = async (id: string, user?: UserAuthPayload) => {
    if (!user) {
      throw new Error('User not authenticated');
    }
    const tenantId = user.companyId;
    if (!tenantId) {
      throw new Error('No es_company_id found on user token');
    }
    const resource = await this.model.findById(id);
    if (!resource) {
      return null;
    }
    if (resource.tenant_id !== tenantId) {
      throw new Error('Access denied: resource does not belong to your tenant');
    }
    return resource;
  };

  getResourceMapEntriesByParentId = async (
    id: string,
    user?: UserAuthPayload,
  ) => {
    if (!user) {
      throw new Error('User not authenticated');
    }
    const tenantId = user.companyId;
    if (!tenantId) {
      throw new Error('No es_company_id found on user token');
    }
    return this.model.findByParentIdAndTenantId(id, tenantId);
  };

  getResourceMapEntriesByTagTypes = async (
    types: ResourceMapTagType[],
    user?: UserAuthPayload,
  ) => {
    if (!user) {
      throw new Error('User not authenticated');
    }
    const tenantId = user.companyId;
    if (!tenantId) {
      throw new Error('No es_company_id found on user token');
    }
    if (!types.length) {
      return [];
    }
    return this.model.findByTenantIdAndTypes(tenantId, types);
  };

  listResourceMapLocationTags = async (
    filter: ListResourceMapLocationTagsInput = {},
    user?: UserAuthPayload,
  ) => {
    if (!user) {
      throw new Error('User not authenticated');
    }
    const tenantId = user.companyId;
    if (!tenantId) {
      throw new Error('No es_company_id found on user token');
    }

    const { bounds, near, hierarchy_id } = filter;
    if (bounds && near) {
      throw new Error('Provide either bounds or near, not both');
    }

    const query: Record<string, unknown> = {
      type: RESOURCE_MAP_TAG_TYPE.LOCATION,
    };
    const hierarchyId = normalizeValue(hierarchy_id);
    if (hierarchyId) {
      query.hierarchy_id = hierarchyId;
    }

    if (bounds) {
      const polygon = buildBoundsPolygon(bounds);
      query.location_geo = { $geoWithin: { $geometry: polygon } };
    }
    if (near) {
      if (!isFiniteNumber(near.radius_meters) || near.radius_meters <= 0) {
        throw new Error('near.radius_meters must be greater than 0');
      }
      const point = buildPointFromLatLng(
        {
          lat: near.lat,
          lng: near.lng,
        },
        'near',
      );
      query.location_geo = {
        $near: {
          $geometry: point,
          $maxDistance: near.radius_meters,
        },
      };
    }

    return this.model.findByTenantIdAndFilter(tenantId, query);
  };

  createResourceMapTag = async (
    input: CreateResourceMapTagInput,
    user?: UserAuthPayload,
  ) => {
    if (!user) {
      throw new Error('User not authenticated');
    }
    const tenantId = user.companyId;
    if (!tenantId) {
      throw new Error('No es_company_id found on user token');
    }

    const value = normalizeValue(input.value);
    if (!value) {
      throw new Error('value is required');
    }

    const tagType = normalizeResourceMapTagType(input.type);
    if (!tagType) {
      throw new Error('Invalid resource map tag type');
    }

    const parentId = normalizeId(input.parent_id);
    const parent = parentId ? await this.model.findById(parentId) : null;
    if (parentId && !parent) {
      throw new Error('Parent resource map entry not found');
    }
    if (parent && parent.tenant_id !== tenantId) {
      throw new Error('Access denied: parent entry not in tenant');
    }
    if (parent) {
      const parentType = normalizeResourceMapTagType(parent.type);
      if (parentType !== tagType) {
        throw new Error('Parent tag type must match child tag type');
      }
    }

    const id = generateId('RM', tenantId);
    const resolvedLocation = await resolveLocationForTag({
      envConfig: this.envConfig,
      model: this.model,
      tagId: id,
      tagType,
      location: input.location,
      parent,
    });
    const locationGeo = buildLocationGeometry(resolvedLocation);
    const parentPath = parent
      ? normalizePath(parent.path, parent._id)
      : null;
    const path = parentPath ? [...parentPath, id] : [id];

    const hierarchy_id =
      parent?.hierarchy_id || normalizeValue(input.hierarchy_id) || id;
    const hierarchy_name =
      parent?.hierarchy_name || normalizeValue(input.hierarchy_name) || value;

    const resource: ResourceMapResourceDoc = {
      _id: id,
      resource_id: id,
      parent_id: parent?._id || '',
      hierarchy_id,
      hierarchy_name,
      path,
      tenant_id: tenantId,
      type: tagType,
      value,
      location: resolvedLocation || undefined,
      location_geo: locationGeo || undefined,
    };

    await this.model.createResource(resource);
    return resource;
  };

  updateResourceMapTag = async (
    id: string,
    input: UpdateResourceMapTagInput,
    user?: UserAuthPayload,
  ) => {
    if (!user) {
      throw new Error('User not authenticated');
    }
    const tenantId = user.companyId;
    if (!tenantId) {
      throw new Error('No es_company_id found on user token');
    }

    const existing = await this.model.findById(id);
    if (!existing) {
      throw new Error('Resource map entry not found');
    }
    if (existing.tenant_id !== tenantId) {
      throw new Error('Access denied: resource map entry not in tenant');
    }

    const tagType = normalizeResourceMapTagType(existing.type);
    if (!tagType) {
      throw new Error(`Unknown resource map tag type: ${existing.type}`);
    }

    const updates: Partial<ResourceMapResourceDoc> = {};

    if (input.value !== undefined) {
      const value = normalizeValue(input.value);
      if (!value) {
        throw new Error('value is required');
      }
      updates.value = value;
    }

    const normalizedParentId =
      input.parent_id !== undefined
        ? normalizeId(input.parent_id)
        : existing.parent_id;
    const parentChanged =
      input.parent_id !== undefined &&
      normalizedParentId !== existing.parent_id;
    let parent: ResourceMapResourceDoc | null = null;

    if (parentChanged && normalizedParentId) {
      if (normalizedParentId === existing._id) {
        throw new Error('Parent cannot be the resource itself');
      }
      parent = await this.model.findById(normalizedParentId);
      if (!parent) {
        throw new Error('Parent resource map entry not found');
      }
      if (parent.tenant_id !== tenantId) {
        throw new Error('Access denied: parent entry not in tenant');
      }
      const parentType = normalizeResourceMapTagType(parent.type);
      if (parentType !== tagType) {
        throw new Error('Parent tag type must match child tag type');
      }
      if (Array.isArray(parent.path) && parent.path.includes(existing._id)) {
        throw new Error('Parent cannot be a descendant of the resource');
      }
    }

    let nextHierarchyId = existing.hierarchy_id;
    let nextHierarchyName = existing.hierarchy_name;
    if (parentChanged) {
      if (parent) {
        nextHierarchyId = parent.hierarchy_id;
        nextHierarchyName = parent.hierarchy_name;
      } else {
        const hierarchyIdInput = normalizeValue(input.hierarchy_id);
        const hierarchyNameInput = normalizeValue(input.hierarchy_name);
        if (hierarchyIdInput) {
          nextHierarchyId = hierarchyIdInput;
        }
        if (hierarchyNameInput) {
          nextHierarchyName = hierarchyNameInput;
        }
      }
    } else if (!normalizedParentId) {
      if (input.hierarchy_id !== undefined) {
        const hierarchyIdInput = normalizeValue(input.hierarchy_id);
        if (hierarchyIdInput) {
          nextHierarchyId = hierarchyIdInput;
        }
      }
      if (input.hierarchy_name !== undefined) {
        const hierarchyNameInput = normalizeValue(input.hierarchy_name);
        if (hierarchyNameInput) {
          nextHierarchyName = hierarchyNameInput;
        }
      }
    }

    const hierarchyChanged =
      nextHierarchyId !== existing.hierarchy_id ||
      nextHierarchyName !== existing.hierarchy_name;

    if (parentChanged) {
      updates.parent_id = normalizedParentId;
    }
    if (hierarchyChanged) {
      updates.hierarchy_id = nextHierarchyId;
      updates.hierarchy_name = nextHierarchyName;
    }

    if ('location' in input) {
      if (input.location === null) {
        updates.location = null;
        updates.location_geo = null;
      } else {
        if (!input.location) {
          throw new Error('location is required');
        }
        const locationHasInterior = Object.prototype.hasOwnProperty.call(
          input.location,
          'interior',
        );
        const locationInput =
          !locationHasInterior && existing.location?.interior
            ? { ...input.location, interior: existing.location.interior }
            : input.location;
        const parentForLocation = parentChanged
          ? parent
          : normalizedParentId
            ? await this.model.findById(normalizedParentId)
            : null;
        const resolvedLocation = await resolveLocationForTag({
          envConfig: this.envConfig,
          model: this.model,
          tagId: existing._id,
          tagType,
          location: locationInput,
          parent: parentForLocation,
        });
        updates.location = resolvedLocation || undefined;
        updates.location_geo =
          buildLocationGeometry(resolvedLocation) || undefined;
      }
    }

    if (!Object.keys(updates).length && !parentChanged && !hierarchyChanged) {
      return existing;
    }

    if (parentChanged) {
      const currentPath = normalizePath(existing.path, existing._id);
      const parentPath = parent
        ? normalizePath(parent.path, parent._id)
        : null;
      const newRootPath = parentPath
        ? [...parentPath, existing._id]
        : [existing._id];

      const descendants = await this.model.findByTenantIdAndPathContains(
        tenantId,
        existing._id,
      );
      const bulkUpdates = descendants.map((doc) => {
        if (doc._id === existing._id) {
          return {
            id: doc._id,
            update: {
              ...updates,
              path: newRootPath,
              hierarchy_id: nextHierarchyId,
              hierarchy_name: nextHierarchyName,
            },
          };
        }
        const docPath = normalizePath(doc.path, doc._id);
        let suffix: string[] = [];
        if (
          docPath.length >= currentPath.length &&
          currentPath.every((value, idx) => docPath[idx] === value)
        ) {
          suffix = docPath.slice(currentPath.length);
        } else {
          const idx = docPath.indexOf(existing._id);
          suffix = idx >= 0 ? docPath.slice(idx + 1) : [];
        }
        const update: Partial<ResourceMapResourceDoc> = {
          path: [...newRootPath, ...suffix],
        };
        if (hierarchyChanged) {
          update.hierarchy_id = nextHierarchyId;
          update.hierarchy_name = nextHierarchyName;
        }
        return { id: doc._id, update };
      });
      await this.model.bulkUpdateResources(bulkUpdates);
      const updated = await this.model.findById(existing._id);
      if (!updated) {
        throw new Error('Resource map entry not found');
      }
      return updated;
    }

    const updated = await this.model.updateResource(existing._id, updates);
    if (!updated) {
      throw new Error('Resource map entry not found');
    }

    if (hierarchyChanged) {
      const descendants = await this.model.findByTenantIdAndPathContains(
        tenantId,
        existing._id,
      );
      const bulkUpdates = descendants
        .filter((doc) => doc._id !== existing._id)
        .map((doc) => ({
          id: doc._id,
          update: {
            hierarchy_id: nextHierarchyId,
            hierarchy_name: nextHierarchyName,
          },
        }));
      await this.model.bulkUpdateResources(bulkUpdates);
    }

    return updated;
  };

  deleteResourceMapTag = async (
    id: string,
    opts: { cascade?: boolean } = {},
    user?: UserAuthPayload,
  ) => {
    if (!user) {
      throw new Error('User not authenticated');
    }
    const tenantId = user.companyId;
    if (!tenantId) {
      throw new Error('No es_company_id found on user token');
    }

    const existing = await this.model.findById(id);
    if (!existing) {
      throw new Error('Resource map entry not found');
    }
    if (existing.tenant_id !== tenantId) {
      throw new Error('Access denied: resource map entry not in tenant');
    }

    const children = await this.model.findByParentIdAndTenantId(id, tenantId);
    if (children.length && !opts.cascade) {
      throw new Error('Resource map entry has children');
    }

    if (opts.cascade) {
      const descendants = await this.model.findByTenantIdAndPathContains(
        tenantId,
        id,
      );
      await this.model.deleteResourcesByIds(
        descendants.map((doc) => doc._id),
      );
    } else {
      await this.model.deleteResourceById(id);
    }

    return existing;
  };

  validateResourceMapIds = async (
    opts: {
      ids: string[];
      allowedTypes: ResourceMapTagType[];
      requiredTypes?: ResourceMapTagType[];
      user?: UserAuthPayload;
      allowEmpty?: boolean;
    },
  ): Promise<ResourceMapTagValidationResult> => {
    const { ids, allowedTypes, requiredTypes, user, allowEmpty } = opts;

    if (!user) {
      throw new Error('User not authenticated');
    }

    const tenantId = user.companyId;
    if (!tenantId) {
      throw new Error('No es_company_id found on user token');
    }

    const uniqueIds = Array.from(new Set(ids)).filter(Boolean);
    if (!uniqueIds.length) {
      if (allowEmpty) {
        return { entries: [], tagTypes: [] };
      }
      throw new Error('resourceMapIds is required');
    }

    const docs = await this.model.findByIds(uniqueIds);
    const docMap = new Map(docs.map((doc) => [doc._id, doc]));
    const missingIds = uniqueIds.filter((id) => !docMap.has(id));
    if (missingIds.length) {
      throw new Error(
        `Resource map entries not found: ${missingIds.join(', ')}`,
      );
    }

    const entries = uniqueIds
      .map((id) => docMap.get(id))
      .filter(Boolean) as ResourceMapResourceDoc[];
    const unauthorized = entries.filter((doc) => doc.tenant_id !== tenantId);
    if (unauthorized.length) {
      throw new Error('Access denied: resource map entries not in tenant');
    }

    const tagTypes = entries
      .map((doc) => normalizeResourceMapTagType(doc.type))
      .filter(Boolean) as ResourceMapTagType[];
    const invalidType = entries.find(
      (doc) => !normalizeResourceMapTagType(doc.type),
    );
    if (invalidType) {
      throw new Error(`Unknown resource map tag type: ${invalidType.type}`);
    }

    const disallowed = tagTypes.filter(
      (tagType) => !allowedTypes.includes(tagType),
    );
    if (disallowed.length) {
      throw new Error(
        `Disallowed resource map tag types: ${Array.from(
          new Set(disallowed),
        ).join(', ')}`,
      );
    }

    if (requiredTypes?.length) {
      const missingRequired = requiredTypes.filter(
        (requiredType) => !tagTypes.includes(requiredType),
      );
      if (missingRequired.length) {
        throw new Error(
          `Missing required resource map tag types: ${missingRequired.join(', ')}`,
        );
      }
    }

    return { entries, tagTypes };
  };
}

const isFiniteNumber = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value);

const normalizeValue = (value?: string | null) => {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return trimmed ? trimmed : undefined;
};

const normalizeId = (value?: string | null) => normalizeValue(value) || '';

const normalizePath = (path: string[] | null | undefined, fallbackId: string) => {
  if (Array.isArray(path) && path.length) {
    return path;
  }
  return [fallbackId];
};

const validateLatLng = (
  latLng: ResourceMapLatLng,
  label: string,
): ResourceMapLatLng => {
  if (!latLng) {
    throw new Error(`${label} is required`);
  }
  if (!isFiniteNumber(latLng.lat) || latLng.lat < -90 || latLng.lat > 90) {
    throw new Error(`${label}.lat must be between -90 and 90`);
  }
  if (!isFiniteNumber(latLng.lng) || latLng.lng < -180 || latLng.lng > 180) {
    throw new Error(`${label}.lng must be between -180 and 180`);
  }
  if (
    latLng.accuracy_meters !== undefined &&
    !isFiniteNumber(latLng.accuracy_meters)
  ) {
    throw new Error(`${label}.accuracy_meters must be a number`);
  }
  return {
    lat: latLng.lat,
    lng: latLng.lng,
    accuracy_meters: latLng.accuracy_meters,
  };
};

const buildPointFromLatLng = (
  latLng: ResourceMapLatLng,
  label = 'lat_lng',
): ResourceMapLocationGeometry => {
  const validated = validateLatLng(latLng, label);
  return {
    type: 'Point',
    coordinates: [validated.lng, validated.lat],
  };
};

const validateGeofence = (geofence: ResourceMapGeofence): ResourceMapGeofence => {
  if (!geofence) {
    throw new Error('geofence is required');
  }
  if (!Object.values(RESOURCE_MAP_GEOFENCE_TYPE).includes(geofence.type)) {
    throw new Error('Invalid geofence type');
  }
  if (geofence.type === RESOURCE_MAP_GEOFENCE_TYPE.CIRCLE) {
    if (!geofence.center) {
      throw new Error('geofence.center is required for CIRCLE');
    }
    const center = validateLatLng(geofence.center, 'geofence.center');
    if (
      !isFiniteNumber(geofence.radius_meters) ||
      geofence.radius_meters <= 0
    ) {
      throw new Error('geofence.radius_meters must be greater than 0');
    }
    return {
      type: geofence.type,
      center,
      radius_meters: geofence.radius_meters,
    };
  }
  if (geofence.type === RESOURCE_MAP_GEOFENCE_TYPE.POLYGON) {
    const points = geofence.polygon || [];
    if (points.length < 3) {
      throw new Error('geofence.polygon must have at least 3 points');
    }
    const polygon = points.map((point, idx) =>
      validateLatLng(point, `geofence.polygon[${idx}]`),
    );
    return {
      type: geofence.type,
      polygon,
    };
  }
  throw new Error('Invalid geofence type');
};

const validateLocation = (location: ResourceMapLocation): ResourceMapLocation => {
  if (!location?.kind) {
    throw new Error('location.kind is required');
  }
  if (!Object.values(RESOURCE_MAP_LOCATION_KIND).includes(location.kind)) {
    throw new Error('Invalid location kind');
  }
  if (location.kind === RESOURCE_MAP_LOCATION_KIND.LAT_LNG) {
    if (!location.lat_lng) {
      throw new Error('location.lat_lng is required');
    }
    return {
      kind: location.kind,
      lat_lng: validateLatLng(location.lat_lng, 'location.lat_lng'),
    };
  }
  if (location.kind === RESOURCE_MAP_LOCATION_KIND.ADDRESS) {
    const addressInput = location.address || {};
    const address = {
      line1: normalizeValue(addressInput.line1),
      line2: normalizeValue(addressInput.line2),
      city: normalizeValue(addressInput.city),
      state: normalizeValue(addressInput.state),
      postal_code: normalizeValue(addressInput.postal_code),
      country: normalizeValue(addressInput.country),
      place_id: normalizeValue(addressInput.place_id),
    };
    const hasAddress = Object.values(address).some(Boolean);
    if (!hasAddress) {
      throw new Error('location.address must include at least one field');
    }
    const latLng = location.lat_lng
      ? validateLatLng(location.lat_lng, 'location.lat_lng')
      : undefined;
    return {
      kind: location.kind,
      address,
      ...(latLng ? { lat_lng: latLng } : {}),
    };
  }
  if (location.kind === RESOURCE_MAP_LOCATION_KIND.PLUS_CODE) {
    const code = normalizeValue(location.plus_code?.code);
    if (!code) {
      throw new Error('location.plus_code.code is required');
    }
    const plus_code = {
      code,
      local_area: normalizeValue(location.plus_code?.local_area),
    };
    const latLng = location.lat_lng
      ? validateLatLng(location.lat_lng, 'location.lat_lng')
      : undefined;
    return {
      kind: location.kind,
      plus_code,
      ...(latLng ? { lat_lng: latLng } : {}),
    };
  }
  if (location.kind === RESOURCE_MAP_LOCATION_KIND.GEOFENCE) {
    const geofence = validateGeofence(
      location.geofence as ResourceMapGeofence,
    );
    return {
      kind: location.kind,
      geofence,
    };
  }
  throw new Error('Invalid location kind');
};

const resolveLocationForTag = async (opts: {
  envConfig: EnvConfig;
  model: ResourceMapResourcesModel;
  tagId: string;
  tagType: ResourceMapTagType;
  location?: ResourceMapLocation | null;
  parent?: ResourceMapResourceDoc | null;
}) => {
  const { envConfig, model, tagId, tagType, location, parent } = opts;
  if (!location) return null;
  if (tagType !== RESOURCE_MAP_TAG_TYPE.LOCATION) {
    throw new Error('Location metadata is only allowed for LOCATION tags');
  }

  const locationWithPlusCode = await inheritPlusCode({
    location,
    parent,
    model,
  });
  const validated = validateLocation(locationWithPlusCode);
  const geocoded = await maybeGeocodeLocation(envConfig, validated);
  const interior = normalizeInteriorMetadata(locationWithPlusCode.interior, tagId);

  return applyInteriorMetadata(geocoded, interior);
};

const inheritPlusCode = async (opts: {
  location: ResourceMapLocation;
  parent?: ResourceMapResourceDoc | null;
  model: ResourceMapResourcesModel;
}) => {
  const { location, parent, model } = opts;
  if (location.kind !== RESOURCE_MAP_LOCATION_KIND.PLUS_CODE) {
    return location;
  }

  const normalized = normalizePlusCode(location.plus_code);
  if (normalized?.code) {
    return { ...location, plus_code: normalized };
  }

  const inherited = await findNearestPlusCodeAncestor(parent, model);
  if (!inherited) {
    throw new Error('location.plus_code.code is required');
  }

  return {
    ...location,
    plus_code: inherited,
  };
};

const findNearestPlusCodeAncestor = async (
  parent: ResourceMapResourceDoc | null | undefined,
  model: ResourceMapResourcesModel,
): Promise<ResourceMapPlusCode | null> => {
  let current = parent ?? null;
  const visited = new Set<string>();

  while (current && current._id && !visited.has(current._id)) {
    visited.add(current._id);
    const normalized = normalizePlusCode(current.location?.plus_code);
    if (normalized?.code) {
      return normalized;
    }
    const parentId = normalizeId(current.parent_id);
    if (!parentId) {
      break;
    }
    current = await model.findById(parentId);
  }

  return null;
};

const normalizePlusCode = (plusCode?: ResourceMapPlusCode | null) => {
  if (!plusCode) return undefined;
  const code = normalizeValue(plusCode.code);
  if (!code) return undefined;
  const localArea = normalizeValue(plusCode.local_area);
  return {
    code,
    ...(localArea ? { local_area: localArea } : {}),
  };
};

const normalizeInteriorMetadata = (
  interior?: ResourceMapInteriorMetadata | null,
  tagId?: string,
): ResourceMapInteriorMetadata | undefined => {
  const next: ResourceMapInteriorMetadata = {};

  if (interior) {
    const floor = normalizeValue(interior.floor);
    if (floor) next.floor = floor;

    if (interior.space_type) {
      if (
        !Object.values(RESOURCE_MAP_INTERIOR_SPACE_TYPE).includes(
          interior.space_type,
        )
      ) {
        throw new Error('Invalid interior space type');
      }
      next.space_type = interior.space_type;
    }

    const code = normalizeValue(interior.code);
    if (code) next.code = code;

    const qrPayload = normalizeValue(interior.qr_payload);
    if (qrPayload) next.qr_payload = qrPayload;
  }

  if (tagId) {
    next.qr_payload = tagId;
  }

  return Object.keys(next).length ? next : undefined;
};

const applyInteriorMetadata = (
  location: ResourceMapLocation | null,
  interior?: ResourceMapInteriorMetadata,
) => {
  if (!location) return null;
  if (!interior) return location;
  return {
    ...location,
    interior,
  };
};

const maybeGeocodeLocation = async (
  envConfig: EnvConfig,
  location?: ResourceMapLocation | null,
) => {
  if (!location) return null;
  if (location.kind !== RESOURCE_MAP_LOCATION_KIND.ADDRESS) {
    return location;
  }
  if (location.lat_lng) {
    return location;
  }
  if (!envConfig.MAPBOX_ACCESS_TOKEN) {
    return location;
  }

  const latLng = await geocodeAddressWithMapbox(location.address, envConfig);
  if (!latLng) {
    throw new Error(
      'Unable to geocode address. Provide lat/lng or a valid address.',
    );
  }

  return {
    ...location,
    lat_lng: latLng,
  };
};

const buildLocationGeometry = (
  location?: ResourceMapLocation | null,
): ResourceMapLocationGeometry | null => {
  if (!location) return null;
  if (location.kind === RESOURCE_MAP_LOCATION_KIND.LAT_LNG && location.lat_lng) {
    return buildPointFromLatLng(location.lat_lng);
  }
  if (
    (location.kind === RESOURCE_MAP_LOCATION_KIND.ADDRESS ||
      location.kind === RESOURCE_MAP_LOCATION_KIND.PLUS_CODE) &&
    location.lat_lng
  ) {
    return buildPointFromLatLng(location.lat_lng);
  }
  if (location.kind === RESOURCE_MAP_LOCATION_KIND.GEOFENCE) {
    const geofence = location.geofence;
    if (!geofence) return null;
    if (
      geofence.type === RESOURCE_MAP_GEOFENCE_TYPE.CIRCLE &&
      geofence.center
    ) {
      return buildPointFromLatLng(geofence.center);
    }
    if (
      geofence.type === RESOURCE_MAP_GEOFENCE_TYPE.POLYGON &&
      geofence.polygon?.length
    ) {
      const coordinates = geofence.polygon.map(
        (point) => [point.lng, point.lat] as [number, number],
      );
      const first = coordinates[0];
      const last = coordinates[coordinates.length - 1];
      if (first[0] !== last[0] || first[1] !== last[1]) {
        coordinates.push(first);
      }
      return {
        type: 'Polygon',
        coordinates: [coordinates],
      };
    }
  }
  return null;
};

const buildBoundsPolygon = (
  bounds: ResourceMapLocationBounds,
): ResourceMapLocationGeometry => {
  const minLat = bounds.min_lat;
  const maxLat = bounds.max_lat;
  const minLng = bounds.min_lng;
  const maxLng = bounds.max_lng;

  if (
    !isFiniteNumber(minLat) ||
    !isFiniteNumber(maxLat) ||
    !isFiniteNumber(minLng) ||
    !isFiniteNumber(maxLng)
  ) {
    throw new Error('Bounds must include finite coordinates');
  }
  if (minLat > maxLat) {
    throw new Error('bounds.min_lat must be <= bounds.max_lat');
  }
  if (minLng > maxLng) {
    throw new Error('bounds.min_lng must be <= bounds.max_lng');
  }
  if (minLat < -90 || maxLat > 90) {
    throw new Error('bounds latitude must be between -90 and 90');
  }
  if (minLng < -180 || maxLng > 180) {
    throw new Error('bounds longitude must be between -180 and 180');
  }

  const coordinates: [number, number][] = [
    [minLng, minLat],
    [maxLng, minLat],
    [maxLng, maxLat],
    [minLng, maxLat],
    [minLng, minLat],
  ];

  return {
    type: 'Polygon',
    coordinates: [coordinates],
  };
};

export const createResourceMapResourcesService = async (config: {
  envConfig: EnvConfig;
  mongoClient: MongoClient;
  kafkaClient: KafkaJS.Kafka;
}) => {
  const model = createResourceMapResourcesModel(config);
  const rmResourcesService = new ResourceMapResourcesService({
    model,
    envConfig: config.envConfig,
  });
  const rmResourcesSinkConnector = new ResourceMapResourcesSinkConnector({
    envConfig: config.envConfig,
    kafka: config.kafkaClient,
    model,
  });
  await rmResourcesSinkConnector.start();
  return rmResourcesService;
};
