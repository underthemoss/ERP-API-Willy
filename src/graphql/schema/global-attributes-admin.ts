import { extendType, arg, nonNull, idArg, stringArg } from 'nexus';
import {
  GlobalAttributeTypeListResult,
  GlobalAttributeValueListResult,
  GlobalUnitDefinitionListResult,
  ListGlobalAttributeTypesFilter,
  ListGlobalAttributeValuesFilter,
  ListGlobalUnitsFilter,
  CreateGlobalAttributeTypeInput,
  UpdateGlobalAttributeTypeInput,
  CreateGlobalAttributeValueInput,
  UpdateGlobalAttributeValueInput,
  CreateGlobalUnitDefinitionInput,
  UpdateGlobalUnitDefinitionInput,
  GlobalAttributeType,
  GlobalAttributeValue,
  GlobalUnitDefinition,
} from './global-attributes';
import { PageInfoInput } from './common';

export const GlobalAttributesAdminQueries = extendType({
  type: 'AdminQueryNamespace',
  definition(t) {
    t.field('listGlobalAttributeTypes', {
      type: GlobalAttributeTypeListResult,
      args: {
        filter: arg({ type: ListGlobalAttributeTypesFilter }),
        page: arg({ type: PageInfoInput }),
      },
      resolve: (_root, { filter, page }, ctx) =>
        ctx.services.globalAttributesService.listAttributeTypes({
          filter: filter ?? undefined,
          page: page ?? undefined,
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
          filter: filter ?? undefined,
          page: page ?? undefined,
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
          filter: filter ?? undefined,
          page: page ?? undefined,
        }),
    });

    t.field('getGlobalAttributeTypeById', {
      type: GlobalAttributeType,
      args: { id: nonNull(idArg()) },
      resolve: (_root, { id }, ctx) =>
        ctx.services.globalAttributesService.getAttributeTypeById(id),
    });

    t.field('getGlobalAttributeValueById', {
      type: GlobalAttributeValue,
      args: { id: nonNull(idArg()) },
      resolve: (_root, { id }, ctx) =>
        ctx.services.globalAttributesService.getAttributeValueById(id),
    });

    t.field('getGlobalUnitDefinitionByCode', {
      type: GlobalUnitDefinition,
      args: { code: nonNull(stringArg()) },
      resolve: (_root, { code }, ctx) =>
        ctx.services.globalAttributesService.getUnitDefinitionByCode(code),
    });
  },
});

export const GlobalAttributesAdminMutations = extendType({
  type: 'AdminMutationNamespace',
  definition(t) {
    t.field('createGlobalAttributeType', {
      type: GlobalAttributeType,
      args: {
        input: nonNull(arg({ type: CreateGlobalAttributeTypeInput })),
      },
      resolve: (_root, { input }, ctx) =>
        ctx.services.globalAttributesService.createAttributeType(
          input as any,
          ctx.user,
        ),
    });

    t.field('updateGlobalAttributeType', {
      type: GlobalAttributeType,
      args: {
        id: nonNull(idArg()),
        input: nonNull(arg({ type: UpdateGlobalAttributeTypeInput })),
      },
      resolve: (_root, { id, input }, ctx) =>
        ctx.services.globalAttributesService.updateAttributeType(
          id,
          input as any,
          ctx.user,
        ),
    });

    t.field('createGlobalAttributeValue', {
      type: GlobalAttributeValue,
      args: {
        input: nonNull(arg({ type: CreateGlobalAttributeValueInput })),
      },
      resolve: (_root, { input }, ctx) =>
        ctx.services.globalAttributesService.createAttributeValue(
          input as any,
          ctx.user,
        ),
    });

    t.field('updateGlobalAttributeValue', {
      type: GlobalAttributeValue,
      args: {
        id: nonNull(idArg()),
        input: nonNull(arg({ type: UpdateGlobalAttributeValueInput })),
      },
      resolve: (_root, { id, input }, ctx) =>
        ctx.services.globalAttributesService.updateAttributeValue(
          id,
          input as any,
          ctx.user,
        ),
    });

    t.field('createGlobalUnitDefinition', {
      type: GlobalUnitDefinition,
      args: {
        input: nonNull(arg({ type: CreateGlobalUnitDefinitionInput })),
      },
      resolve: (_root, { input }, ctx) =>
        ctx.services.globalAttributesService.createUnitDefinition(
          input as any,
          ctx.user,
        ),
    });

    t.field('updateGlobalUnitDefinition', {
      type: GlobalUnitDefinition,
      args: {
        code: nonNull(stringArg()),
        input: nonNull(arg({ type: UpdateGlobalUnitDefinitionInput })),
      },
      resolve: (_root, { code, input }, ctx) =>
        ctx.services.globalAttributesService.updateUnitDefinition(
          code,
          input as any,
          ctx.user,
        ),
    });
  },
});
