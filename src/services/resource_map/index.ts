import { type MongoClient } from 'mongodb';
import {
  ResourceMapResourcesModel,
  createResourceMapResourcesModel,
  ResourceMapResourceInput,
  ResourceMapResourceDoc,
} from './model';
import { UserAuthPayload } from '../../authentication';
import { ResourceMapResourcesSinkConnector } from './kafka-sink-connector';
import { EnvConfig } from '../../config';
import { KafkaJS } from '@confluentinc/kafka-javascript';
import {
  ResourceMapTagType,
  normalizeResourceMapTagType,
} from './tag-types';

export type ResourceMapTagValidationResult = {
  entries: ResourceMapResourceDoc[];
  tagTypes: ResourceMapTagType[];
};

export class ResourceMapResourcesService {
  private model: ResourceMapResourcesModel;
  constructor(config: { model: ResourceMapResourcesModel }) {
    this.model = config.model;
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

export const createResourceMapResourcesService = async (config: {
  envConfig: EnvConfig;
  mongoClient: MongoClient;
  kafkaClient: KafkaJS.Kafka;
}) => {
  const model = createResourceMapResourcesModel(config);
  const rmResourcesService = new ResourceMapResourcesService({
    model,
  });
  const rmResourcesSinkConnector = new ResourceMapResourcesSinkConnector({
    envConfig: config.envConfig,
    kafka: config.kafkaClient,
    model,
  });
  await rmResourcesSinkConnector.start();
  return rmResourcesService;
};
