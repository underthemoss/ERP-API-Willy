import {
  enumType,
  objectType,
  inputObjectType,
  extendType,
  arg,
  nonNull,
  idArg,
} from 'nexus';
import { PaginationInfo, PageInfoInput } from './common';
import {
  GLOBAL_ATTRIBUTE_KIND,
  GLOBAL_ATTRIBUTE_VALUE_TYPE,
  GLOBAL_ATTRIBUTE_DIMENSION,
  GLOBAL_ATTRIBUTE_STATUS,
  GLOBAL_ATTRIBUTE_AUDIT_STATUS,
  GLOBAL_ATTRIBUTE_APPLIES_TO,
  GLOBAL_ATTRIBUTE_USAGE_HINT,
  GLOBAL_ATTRIBUTE_RELATION_TYPE,
  GLOBAL_UNIT_STATUS,
} from '../../services/global_attributes';

export const GlobalAttributeKind = enumType({
  name: 'GlobalAttributeKind',
  members: Object.values(GLOBAL_ATTRIBUTE_KIND),
});

export const GlobalAttributeValueType = enumType({
  name: 'GlobalAttributeValueType',
  members: Object.values(GLOBAL_ATTRIBUTE_VALUE_TYPE),
});

export const GlobalAttributeDimension = enumType({
  name: 'GlobalAttributeDimension',
  members: Object.values(GLOBAL_ATTRIBUTE_DIMENSION),
});

export const GlobalAttributeStatus = enumType({
  name: 'GlobalAttributeStatus',
  members: Object.values(GLOBAL_ATTRIBUTE_STATUS),
});

export const GlobalAttributeAuditStatus = enumType({
  name: 'GlobalAttributeAuditStatus',
  members: Object.values(GLOBAL_ATTRIBUTE_AUDIT_STATUS),
});

export const GlobalAttributeAppliesTo = enumType({
  name: 'GlobalAttributeAppliesTo',
  members: Object.values(GLOBAL_ATTRIBUTE_APPLIES_TO),
});

export const GlobalAttributeUsageHint = enumType({
  name: 'GlobalAttributeUsageHint',
  members: Object.values(GLOBAL_ATTRIBUTE_USAGE_HINT),
});

export const GlobalAttributeRelationType = enumType({
  name: 'GlobalAttributeRelationType',
  members: Object.values(GLOBAL_ATTRIBUTE_RELATION_TYPE),
});

export const GlobalUnitStatus = enumType({
  name: 'GlobalUnitStatus',
  members: Object.values(GLOBAL_UNIT_STATUS),
});

export const GlobalAttributeType = objectType({
  name: 'GlobalAttributeType',
  sourceType: {
    module: require.resolve('../../services/global_attributes'),
    export: 'GlobalAttributeType',
  },
  definition(t) {
    t.nonNull.string('id');
    t.nonNull.string('name');
    t.nonNull.field('kind', { type: GlobalAttributeKind });
    t.nonNull.field('valueType', { type: GlobalAttributeValueType });
    t.field('dimension', { type: GlobalAttributeDimension });
    t.string('canonicalUnit');
    t.list.string('allowedUnits');
    t.string('canonicalValueSetId');
    t.list.string('synonyms');
    t.nonNull.field('status', { type: GlobalAttributeStatus });
    t.field('auditStatus', { type: GlobalAttributeAuditStatus });
    t.field('appliesTo', { type: GlobalAttributeAppliesTo });
    t.list.field('usageHints', { type: GlobalAttributeUsageHint });
    t.string('notes');
    t.field('validationRules', { type: 'JSONObject' });
    t.string('source');
    t.field('createdAt', { type: 'DateTime' });
    t.field('updatedAt', { type: 'DateTime' });
    t.string('createdBy');
    t.string('updatedBy');
  },
});

export const GlobalAttributeValue = objectType({
  name: 'GlobalAttributeValue',
  sourceType: {
    module: require.resolve('../../services/global_attributes'),
    export: 'GlobalAttributeValue',
  },
  definition(t) {
    t.nonNull.string('id');
    t.nonNull.string('attributeTypeId');
    t.nonNull.string('value');
    t.list.string('synonyms');
    t.field('codes', { type: 'JSONObject' });
    t.nonNull.field('status', { type: GlobalAttributeStatus });
    t.field('auditStatus', { type: GlobalAttributeAuditStatus });
    t.string('source');
    t.field('createdAt', { type: 'DateTime' });
    t.field('updatedAt', { type: 'DateTime' });
    t.string('createdBy');
    t.string('updatedBy');
  },
});

export const GlobalAttributeRelation = objectType({
  name: 'GlobalAttributeRelation',
  sourceType: {
    module: require.resolve('../../services/global_attributes'),
    export: 'GlobalAttributeRelation',
  },
  definition(t) {
    t.nonNull.string('id');
    t.nonNull.string('fromAttributeId');
    t.nonNull.string('toAttributeId');
    t.nonNull.field('relationType', { type: GlobalAttributeRelationType });
    t.float('confidence');
    t.string('source');
    t.field('createdAt', { type: 'DateTime' });
    t.field('updatedAt', { type: 'DateTime' });
    t.string('createdBy');
    t.string('updatedBy');
  },
});

export const GlobalUnitDefinition = objectType({
  name: 'GlobalUnitDefinition',
  sourceType: {
    module: require.resolve('../../services/global_attributes'),
    export: 'GlobalUnitDefinition',
  },
  definition(t) {
    t.nonNull.string('id');
    t.nonNull.string('code');
    t.string('name');
    t.field('dimension', { type: GlobalAttributeDimension });
    t.string('canonicalUnitCode');
    t.float('toCanonicalFactor');
    t.float('offset');
    t.nonNull.field('status', { type: GlobalUnitStatus });
    t.field('createdAt', { type: 'DateTime' });
    t.field('updatedAt', { type: 'DateTime' });
    t.string('createdBy');
    t.string('updatedBy');
  },
});

export const ListGlobalAttributeTypesFilter = inputObjectType({
  name: 'ListGlobalAttributeTypesFilter',
  definition(t) {
    t.field('kind', { type: GlobalAttributeKind });
    t.field('valueType', { type: GlobalAttributeValueType });
    t.field('dimension', { type: GlobalAttributeDimension });
    t.field('status', { type: GlobalAttributeStatus });
    t.field('appliesTo', { type: GlobalAttributeAppliesTo });
    t.field('usageHint', { type: GlobalAttributeUsageHint });
    t.string('searchTerm');
  },
});

export const ListGlobalAttributeValuesFilter = inputObjectType({
  name: 'ListGlobalAttributeValuesFilter',
  definition(t) {
    t.string('attributeTypeId');
    t.field('status', { type: GlobalAttributeStatus });
    t.string('searchTerm');
  },
});

export const ListGlobalAttributeRelationsFilter = inputObjectType({
  name: 'ListGlobalAttributeRelationsFilter',
  definition(t) {
    t.string('fromAttributeId');
    t.string('toAttributeId');
    t.field('relationType', { type: GlobalAttributeRelationType });
  },
});

export const ListGlobalUnitsFilter = inputObjectType({
  name: 'ListGlobalUnitsFilter',
  definition(t) {
    t.field('dimension', { type: GlobalAttributeDimension });
    t.field('status', { type: GlobalUnitStatus });
    t.string('searchTerm');
  },
});

export const CreateGlobalAttributeTypeInput = inputObjectType({
  name: 'CreateGlobalAttributeTypeInput',
  definition(t) {
    t.nonNull.string('name');
    t.nonNull.field('kind', { type: GlobalAttributeKind });
    t.nonNull.field('valueType', { type: GlobalAttributeValueType });
    t.field('dimension', { type: GlobalAttributeDimension });
    t.string('canonicalUnit');
    t.list.string('allowedUnits');
    t.string('canonicalValueSetId');
    t.list.string('synonyms');
    t.field('status', { type: GlobalAttributeStatus });
    t.field('auditStatus', { type: GlobalAttributeAuditStatus });
    t.field('appliesTo', { type: GlobalAttributeAppliesTo });
    t.list.field('usageHints', { type: GlobalAttributeUsageHint });
    t.string('notes');
    t.field('validationRules', { type: 'JSONObject' });
    t.string('source');
  },
});

export const UpdateGlobalAttributeTypeInput = inputObjectType({
  name: 'UpdateGlobalAttributeTypeInput',
  definition(t) {
    t.string('name');
    t.field('kind', { type: GlobalAttributeKind });
    t.field('valueType', { type: GlobalAttributeValueType });
    t.field('dimension', { type: GlobalAttributeDimension });
    t.string('canonicalUnit');
    t.list.string('allowedUnits');
    t.string('canonicalValueSetId');
    t.list.string('synonyms');
    t.field('status', { type: GlobalAttributeStatus });
    t.field('auditStatus', { type: GlobalAttributeAuditStatus });
    t.field('appliesTo', { type: GlobalAttributeAppliesTo });
    t.list.field('usageHints', { type: GlobalAttributeUsageHint });
    t.string('notes');
    t.field('validationRules', { type: 'JSONObject' });
    t.string('source');
  },
});

export const CreateGlobalAttributeValueInput = inputObjectType({
  name: 'CreateGlobalAttributeValueInput',
  definition(t) {
    t.nonNull.string('attributeTypeId');
    t.nonNull.string('value');
    t.list.string('synonyms');
    t.field('codes', { type: 'JSONObject' });
    t.field('status', { type: GlobalAttributeStatus });
    t.field('auditStatus', { type: GlobalAttributeAuditStatus });
    t.string('source');
  },
});

export const UpdateGlobalAttributeValueInput = inputObjectType({
  name: 'UpdateGlobalAttributeValueInput',
  definition(t) {
    t.string('value');
    t.list.string('synonyms');
    t.field('codes', { type: 'JSONObject' });
    t.field('status', { type: GlobalAttributeStatus });
    t.field('auditStatus', { type: GlobalAttributeAuditStatus });
    t.string('source');
  },
});

export const CreateGlobalAttributeRelationInput = inputObjectType({
  name: 'CreateGlobalAttributeRelationInput',
  definition(t) {
    t.nonNull.string('fromAttributeId');
    t.nonNull.string('toAttributeId');
    t.nonNull.field('relationType', { type: GlobalAttributeRelationType });
    t.float('confidence');
    t.string('source');
  },
});

export const CreateGlobalUnitDefinitionInput = inputObjectType({
  name: 'CreateGlobalUnitDefinitionInput',
  definition(t) {
    t.nonNull.string('code');
    t.string('name');
    t.field('dimension', { type: GlobalAttributeDimension });
    t.string('canonicalUnitCode');
    t.float('toCanonicalFactor');
    t.float('offset');
    t.field('status', { type: GlobalUnitStatus });
    t.string('source');
  },
});

export const UpdateGlobalUnitDefinitionInput = inputObjectType({
  name: 'UpdateGlobalUnitDefinitionInput',
  definition(t) {
    t.string('name');
    t.field('dimension', { type: GlobalAttributeDimension });
    t.string('canonicalUnitCode');
    t.float('toCanonicalFactor');
    t.float('offset');
    t.field('status', { type: GlobalUnitStatus });
    t.string('source');
  },
});

export const IngestGlobalAttributeStringInput = inputObjectType({
  name: 'IngestGlobalAttributeStringInput',
  definition(t) {
    t.nonNull.string('raw');
    t.string('attributeName');
    t.string('value');
    t.field('kind', { type: GlobalAttributeKind });
    t.field('valueType', { type: GlobalAttributeValueType });
    t.field('dimension', { type: GlobalAttributeDimension });
    t.string('unitCode');
    t.string('source');
  },
});

export const GlobalAttributeTypeListResult = objectType({
  name: 'GlobalAttributeTypeListResult',
  definition(t) {
    t.nonNull.list.nonNull.field('items', { type: GlobalAttributeType });
    t.nonNull.field('page', { type: PaginationInfo });
  },
});

export const GlobalAttributeValueListResult = objectType({
  name: 'GlobalAttributeValueListResult',
  definition(t) {
    t.nonNull.list.nonNull.field('items', { type: GlobalAttributeValue });
    t.nonNull.field('page', { type: PaginationInfo });
  },
});

export const GlobalAttributeRelationListResult = objectType({
  name: 'GlobalAttributeRelationListResult',
  definition(t) {
    t.nonNull.list.nonNull.field('items', { type: GlobalAttributeRelation });
    t.nonNull.field('page', { type: PaginationInfo });
  },
});

export const GlobalUnitDefinitionListResult = objectType({
  name: 'GlobalUnitDefinitionListResult',
  definition(t) {
    t.nonNull.list.nonNull.field('items', { type: GlobalUnitDefinition });
    t.nonNull.field('page', { type: PaginationInfo });
  },
});

export const GlobalAttributeIngestionResult = objectType({
  name: 'GlobalAttributeIngestionResult',
  definition(t) {
    t.nonNull.field('attributeType', { type: GlobalAttributeType });
    t.field('attributeValue', { type: GlobalAttributeValue });
    t.nonNull.field('parsed', { type: 'JSONObject' });
  },
});

export const GlobalAttributesQuery = extendType({
  type: 'Query',
  definition(t) {
    t.field('getGlobalAttributeTypeById', {
      type: GlobalAttributeType,
      args: {
        id: nonNull(idArg()),
      },
      resolve: (_, { id }, ctx) =>
        ctx.services.globalAttributesService.getAttributeTypeById(id),
    });

    t.field('listGlobalAttributeTypes', {
      type: GlobalAttributeTypeListResult,
      args: {
        filter: arg({ type: ListGlobalAttributeTypesFilter }),
        page: arg({ type: PageInfoInput }),
      },
      resolve: (_root, { filter, page }, ctx) =>
        ctx.services.globalAttributesService.listAttributeTypes({
          filter: filter
            ? (Object.fromEntries(
                Object.entries(filter).map(([key, value]) => [
                  key,
                  value === null ? undefined : value,
                ]),
              ) as any)
            : undefined,
          page: page
            ? (Object.fromEntries(
                Object.entries(page).map(([key, value]) => [
                  key,
                  value === null ? undefined : value,
                ]),
              ) as any)
            : undefined,
        }),
    });

    t.field('listGlobalAttributeValues', {
      type: GlobalAttributeValueListResult,
      args: {
        filter: arg({ type: ListGlobalAttributeValuesFilter }),
        page: arg({ type: PageInfoInput }),
      },
      resolve: (_root, { filter, page }, ctx) =>
        ctx.services.globalAttributesService.listAttributeValues({
          filter: filter
            ? (Object.fromEntries(
                Object.entries(filter).map(([key, value]) => [
                  key,
                  value === null ? undefined : value,
                ]),
              ) as any)
            : undefined,
          page: page
            ? (Object.fromEntries(
                Object.entries(page).map(([key, value]) => [
                  key,
                  value === null ? undefined : value,
                ]),
              ) as any)
            : undefined,
        }),
    });

    t.field('listGlobalAttributeRelations', {
      type: GlobalAttributeRelationListResult,
      args: {
        filter: arg({ type: ListGlobalAttributeRelationsFilter }),
        page: arg({ type: PageInfoInput }),
      },
      resolve: (_root, { filter, page }, ctx) =>
        ctx.services.globalAttributesService.listAttributeRelations({
          filter: filter
            ? (Object.fromEntries(
                Object.entries(filter).map(([key, value]) => [
                  key,
                  value === null ? undefined : value,
                ]),
              ) as any)
            : undefined,
          page: page
            ? (Object.fromEntries(
                Object.entries(page).map(([key, value]) => [
                  key,
                  value === null ? undefined : value,
                ]),
              ) as any)
            : undefined,
        }),
    });

    t.field('listGlobalUnitDefinitions', {
      type: GlobalUnitDefinitionListResult,
      args: {
        filter: arg({ type: ListGlobalUnitsFilter }),
        page: arg({ type: PageInfoInput }),
      },
      resolve: (_root, { filter, page }, ctx) =>
        ctx.services.globalAttributesService.listUnitDefinitions({
          filter: filter
            ? (Object.fromEntries(
                Object.entries(filter).map(([key, value]) => [
                  key,
                  value === null ? undefined : value,
                ]),
              ) as any)
            : undefined,
          page: page
            ? (Object.fromEntries(
                Object.entries(page).map(([key, value]) => [
                  key,
                  value === null ? undefined : value,
                ]),
              ) as any)
            : undefined,
        }),
    });
  },
});

export const GlobalAttributesMutation = extendType({
  type: 'Mutation',
  definition(t) {
    t.field('createGlobalAttributeType', {
      type: GlobalAttributeType,
      args: {
        input: nonNull(arg({ type: CreateGlobalAttributeTypeInput })),
      },
      resolve: async (_root, { input }, ctx) => {
        if (!ctx.user) throw new Error('Unauthorized');
        return ctx.services.globalAttributesService.createAttributeType(
          input as any,
          ctx.user,
        );
      },
    });

    t.field('updateGlobalAttributeType', {
      type: GlobalAttributeType,
      args: {
        id: nonNull(idArg()),
        input: nonNull(arg({ type: UpdateGlobalAttributeTypeInput })),
      },
      resolve: async (_root, { id, input }, ctx) => {
        if (!ctx.user) throw new Error('Unauthorized');
        return ctx.services.globalAttributesService.updateAttributeType(
          id,
          input as any,
          ctx.user,
        );
      },
    });

    t.field('createGlobalAttributeValue', {
      type: GlobalAttributeValue,
      args: {
        input: nonNull(arg({ type: CreateGlobalAttributeValueInput })),
      },
      resolve: async (_root, { input }, ctx) => {
        if (!ctx.user) throw new Error('Unauthorized');
        return ctx.services.globalAttributesService.createAttributeValue(
          input as any,
          ctx.user,
        );
      },
    });

    t.field('updateGlobalAttributeValue', {
      type: GlobalAttributeValue,
      args: {
        id: nonNull(idArg()),
        input: nonNull(arg({ type: UpdateGlobalAttributeValueInput })),
      },
      resolve: async (_root, { id, input }, ctx) => {
        if (!ctx.user) throw new Error('Unauthorized');
        return ctx.services.globalAttributesService.updateAttributeValue(
          id,
          input as any,
          ctx.user,
        );
      },
    });

    t.field('createGlobalAttributeRelation', {
      type: GlobalAttributeRelation,
      args: {
        input: nonNull(arg({ type: CreateGlobalAttributeRelationInput })),
      },
      resolve: async (_root, { input }, ctx) => {
        if (!ctx.user) throw new Error('Unauthorized');
        return ctx.services.globalAttributesService.createAttributeRelation(
          input as any,
          ctx.user,
        );
      },
    });

    t.field('createGlobalUnitDefinition', {
      type: GlobalUnitDefinition,
      args: {
        input: nonNull(arg({ type: CreateGlobalUnitDefinitionInput })),
      },
      resolve: async (_root, { input }, ctx) => {
        if (!ctx.user) throw new Error('Unauthorized');
        return ctx.services.globalAttributesService.createUnitDefinition(
          input as any,
          ctx.user,
        );
      },
    });

    t.field('updateGlobalUnitDefinition', {
      type: GlobalUnitDefinition,
      args: {
        code: nonNull(arg({ type: 'String' })),
        input: nonNull(arg({ type: UpdateGlobalUnitDefinitionInput })),
      },
      resolve: async (_root, { code, input }, ctx) => {
        if (!ctx.user) throw new Error('Unauthorized');
        return ctx.services.globalAttributesService.updateUnitDefinition(
          code,
          input as any,
          ctx.user,
        );
      },
    });

    t.field('ingestGlobalAttributeString', {
      type: GlobalAttributeIngestionResult,
      args: {
        input: nonNull(arg({ type: IngestGlobalAttributeStringInput })),
      },
      resolve: async (_root, { input }, ctx) => {
        if (!ctx.user) throw new Error('Unauthorized');
        return ctx.services.globalAttributesService.ingestGlobalAttributeString(
          input as any,
          ctx.user,
        );
      },
    });
  },
});
