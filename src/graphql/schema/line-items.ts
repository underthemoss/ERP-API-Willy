import {
  arg,
  enumType,
  extendType,
  inputObjectType,
  nonNull,
  objectType,
  stringArg,
} from 'nexus';
import { PageInfoInput, PaginationInfo } from './common';
import type {
  LineItemConstraint as LineItemConstraintModel,
  LineItemConstraintAttributeOp,
  LineItemConstraintKind,
  LineItemConstraintStrength,
  LineItem as LineItemModel,
  LineItemInputValue as LineItemInputValueModel,
  LineItemPlaceKind,
  LineItemTargetSelector as LineItemTargetSelectorModel,
} from '../../services/line_items/model';
import type { PricingSpec } from '../../services/prices/prices-model';
import { catalogProductSchema } from '../../services/studio_fs/catalogSchemas';

export const LineItemTypeEnum = enumType({
  name: 'LineItemType',
  members: ['RENTAL', 'SALE', 'SERVICE', 'WORK', 'TRANSFER'],
});

export const LineItemDocumentTypeEnum = enumType({
  name: 'LineItemDocumentType',
  members: [
    'QUOTE_REVISION',
    'SALES_ORDER',
    'PURCHASE_ORDER',
    'WORK_ORDER',
    'INTAKE_SUBMISSION',
  ],
});

export const LineItemProductKindEnum = enumType({
  name: 'LineItemProductKind',
  members: [
    'CATALOG_PRODUCT',
    'MATERIAL_PRODUCT',
    'SERVICE_PRODUCT',
    'ASSEMBLY_PRODUCT',
    'PIM_CATEGORY',
    'PIM_PRODUCT',
  ],
});

export const LineItemConstraintStrengthEnum = enumType({
  name: 'LineItemConstraintStrength',
  members: ['REQUIRED', 'PREFERRED', 'EXCLUDED'],
});

export const LineItemConstraintKindEnum = enumType({
  name: 'LineItemConstraintKind',
  members: ['TAG', 'ATTRIBUTE', 'BRAND', 'SCHEDULE', 'LOCATION', 'OTHER'],
});

export const LineItemConstraintAttributeOpEnum = enumType({
  name: 'LineItemConstraintAttributeOp',
  members: ['EQ', 'NEQ', 'IN', 'NOT_IN', 'GT', 'GTE', 'LT', 'LTE'],
});

export const LineItemPlaceKindEnum = enumType({
  name: 'LineItemPlaceKind',
  members: ['JOBSITE', 'BRANCH', 'YARD', 'ADDRESS', 'GEOFENCE', 'OTHER'],
});

export const LineItemDeliveryMethodEnum = enumType({
  name: 'LineItemDeliveryMethod',
  members: ['PICKUP', 'DELIVERY'],
});

export const LineItemTargetSelectorKindEnum = enumType({
  name: 'LineItemTargetSelectorKind',
  members: ['tags', 'product', 'line_item'],
});

export const LogisticsServiceProductIdEnum = enumType({
  name: 'LogisticsServiceProductId',
  members: ['svc_delivery', 'svc_pickup'],
});

export const LineItemStateEnum = enumType({
  name: 'LineItemState',
  members: ['PROPOSED', 'PLANNED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'],
});

export const LineItemDocumentRef = objectType({
  name: 'LineItemDocumentRef',
  definition(t) {
    t.nonNull.field('type', { type: LineItemDocumentTypeEnum });
    t.nonNull.id('id');
    t.id('revisionId');
  },
});

export const LineItemDocumentRefInput = inputObjectType({
  name: 'LineItemDocumentRefInput',
  definition(t) {
    t.nonNull.field('type', { type: LineItemDocumentTypeEnum });
    t.nonNull.id('id');
    t.id('revisionId');
  },
});

export const LineItemProductRef = objectType({
  name: 'LineItemProductRef',
  definition(t) {
    t.nonNull.field('kind', { type: LineItemProductKindEnum });
    t.nonNull.id('productId');
  },
});

export const LineItemProductRefInput = inputObjectType({
  name: 'LineItemProductRefInput',
  definition(t) {
    t.nonNull.field('kind', { type: LineItemProductKindEnum });
    t.nonNull.id('productId');
  },
});

export const LineItemTimeWindow = objectType({
  name: 'LineItemTimeWindow',
  definition(t) {
    t.field('startAt', { type: 'DateTime' });
    t.field('endAt', { type: 'DateTime' });
  },
});

export const LineItemTimeWindowInput = inputObjectType({
  name: 'LineItemTimeWindowInput',
  definition(t) {
    t.field('startAt', { type: 'DateTime' });
    t.field('endAt', { type: 'DateTime' });
  },
});

export const LineItemPlaceRef = objectType({
  name: 'LineItemPlaceRef',
  definition(t) {
    t.nonNull.field('kind', { type: LineItemPlaceKindEnum });
    t.nonNull.id('id');
  },
});

export const LineItemPlaceRefInput = inputObjectType({
  name: 'LineItemPlaceRefInput',
  definition(t) {
    t.nonNull.field('kind', { type: LineItemPlaceKindEnum });
    t.nonNull.id('id');
  },
});

export const LineItemConstraintTag = objectType({
  name: 'LineItemConstraintTag',
  definition(t) {
    t.nonNull.list.nonNull.id('tagIds');
  },
});

export const LineItemConstraintTagInput = inputObjectType({
  name: 'LineItemConstraintTagInput',
  definition(t) {
    t.nonNull.list.nonNull.id('tagIds');
  },
});

export const LineItemConstraintAttribute = objectType({
  name: 'LineItemConstraintAttribute',
  definition(t) {
    t.nonNull.id('attributeTypeId');
    t.nonNull.field('op', { type: LineItemConstraintAttributeOpEnum });
    t.nonNull.field('value', { type: 'JSONObject' });
    t.string('unitCode');
    t.list.nonNull.string('contextTags');
  },
});

export const LineItemConstraintAttributeInput = inputObjectType({
  name: 'LineItemConstraintAttributeInput',
  definition(t) {
    t.nonNull.id('attributeTypeId');
    t.nonNull.field('op', { type: LineItemConstraintAttributeOpEnum });
    t.nonNull.field('value', { type: 'JSONObject' });
    t.string('unitCode');
    t.list.nonNull.string('contextTags');
  },
});

export const LineItemConstraintBrand = objectType({
  name: 'LineItemConstraintBrand',
  definition(t) {
    t.id('brandId');
    t.id('manufacturerId');
  },
});

export const LineItemConstraintBrandInput = inputObjectType({
  name: 'LineItemConstraintBrandInput',
  definition(t) {
    t.id('brandId');
    t.id('manufacturerId');
  },
});

export const LineItemConstraintSchedule = objectType({
  name: 'LineItemConstraintSchedule',
  definition(t) {
    t.field('startAt', { type: 'DateTime' });
    t.field('endAt', { type: 'DateTime' });
  },
});

export const LineItemConstraintScheduleInput = inputObjectType({
  name: 'LineItemConstraintScheduleInput',
  definition(t) {
    t.field('startAt', { type: 'DateTime' });
    t.field('endAt', { type: 'DateTime' });
  },
});

export const LineItemConstraintLocation = objectType({
  name: 'LineItemConstraintLocation',
  definition(t) {
    t.nonNull.field('placeRef', { type: LineItemPlaceRef });
  },
});

export const LineItemConstraintLocationInput = inputObjectType({
  name: 'LineItemConstraintLocationInput',
  definition(t) {
    t.nonNull.field('placeRef', { type: LineItemPlaceRefInput });
  },
});

export const LineItemConstraintOther = objectType({
  name: 'LineItemConstraintOther',
  definition(t) {
    t.nonNull.string('note');
  },
});

export const LineItemConstraintOtherInput = inputObjectType({
  name: 'LineItemConstraintOtherInput',
  definition(t) {
    t.nonNull.string('note');
  },
});

export const LineItemConstraintData = objectType({
  name: 'LineItemConstraintData',
  definition(t) {
    t.field('tag', { type: LineItemConstraintTag });
    t.field('attribute', { type: LineItemConstraintAttribute });
    t.field('brand', { type: LineItemConstraintBrand });
    t.field('schedule', { type: LineItemConstraintSchedule });
    t.field('location', { type: LineItemConstraintLocation });
    t.field('other', { type: LineItemConstraintOther });
  },
});

export const LineItemConstraintDataInput = inputObjectType({
  name: 'LineItemConstraintDataInput',
  definition(t) {
    t.field('tag', { type: LineItemConstraintTagInput });
    t.field('attribute', { type: LineItemConstraintAttributeInput });
    t.field('brand', { type: LineItemConstraintBrandInput });
    t.field('schedule', { type: LineItemConstraintScheduleInput });
    t.field('location', { type: LineItemConstraintLocationInput });
    t.field('other', { type: LineItemConstraintOtherInput });
  },
});

export const LineItemConstraint = objectType({
  name: 'LineItemConstraint',
  sourceType: {
    module: require.resolve('../../services/line_items/model'),
    export: 'LineItemConstraint',
  },
  definition(t) {
    t.nonNull.field('kind', { type: LineItemConstraintKindEnum });
    t.nonNull.field('strength', { type: LineItemConstraintStrengthEnum });
    t.field('data', {
      type: LineItemConstraintData,
      resolve(parent: any) {
        if (!parent?.data) return null;
        switch (parent.kind) {
          case 'TAG':
            return { tag: parent.data };
          case 'ATTRIBUTE':
            return { attribute: parent.data };
          case 'BRAND':
            return { brand: parent.data };
          case 'SCHEDULE':
            return { schedule: parent.data };
          case 'LOCATION':
            return { location: parent.data };
          case 'OTHER':
            return { other: parent.data };
          default:
            return null;
        }
      },
    });
  },
});

export const LineItemConstraintInput = inputObjectType({
  name: 'LineItemConstraintInput',
  definition(t) {
    t.nonNull.field('kind', { type: LineItemConstraintKindEnum });
    t.nonNull.field('strength', { type: LineItemConstraintStrengthEnum });
    t.nonNull.field('data', { type: LineItemConstraintDataInput });
  },
});

export const LineItemInputValue = objectType({
  name: 'LineItemInputValue',
  definition(t) {
    t.nonNull.string('attributeTypeId');
    t.nonNull.field('value', { type: 'JSONObject' });
    t.string('unitCode');
    t.list.nonNull.string('contextTags');
  },
});

export const LineItemInputValueInput = inputObjectType({
  name: 'LineItemInputValueInput',
  definition(t) {
    t.nonNull.string('attributeTypeId');
    t.nonNull.field('value', { type: 'JSONObject' });
    t.string('unitCode');
    t.list.nonNull.string('contextTags');
  },
});

export const LineItemPricingRef = objectType({
  name: 'LineItemPricingRef',
  definition(t) {
    t.id('priceId');
    t.id('priceBookId');
    t.field('priceType', { type: LineItemTypeEnum });
  },
});

export const LineItemPricingRefInput = inputObjectType({
  name: 'LineItemPricingRefInput',
  definition(t) {
    t.id('priceId');
    t.id('priceBookId');
    t.field('priceType', { type: LineItemTypeEnum });
  },
});

export const ServiceScopeTask = objectType({
  name: 'ServiceScopeTask',
  definition(t) {
    t.nonNull.string('id');
    t.string('sourceTemplateId');
    t.nonNull.string('title');
    t.nonNull.list.nonNull.string('activityTagIds');
    t.list.nonNull.string('contextTagIds');
    t.string('notes');
  },
});

export const ServiceScopeTaskInput = inputObjectType({
  name: 'ServiceScopeTaskInput',
  definition(t) {
    t.nonNull.string('id');
    t.string('sourceTemplateId');
    t.nonNull.string('title');
    t.nonNull.list.nonNull.string('activityTagIds');
    t.list.nonNull.string('contextTagIds');
    t.string('notes');
  },
});

export const LineItemDelivery = objectType({
  name: 'LineItemDelivery',
  definition(t) {
    t.field('method', { type: LineItemDeliveryMethodEnum });
    t.string('location');
    t.string('notes');
  },
});

export const LineItemDeliveryInput = inputObjectType({
  name: 'LineItemDeliveryInput',
  definition(t) {
    t.field('method', { type: LineItemDeliveryMethodEnum });
    t.string('location');
    t.string('notes');
  },
});

export const LineItemTargetSelector = objectType({
  name: 'LineItemTargetSelector',
  definition(t) {
    t.nonNull.field('kind', { type: LineItemTargetSelectorKindEnum });
    t.list.nonNull.string('tagIds');
    t.string('targetProductId');
    t.list.nonNull.string('targetLineItemIds');
  },
});

export const LineItemTargetSelectorInput = inputObjectType({
  name: 'LineItemTargetSelectorInput',
  definition(t) {
    t.nonNull.field('kind', { type: LineItemTargetSelectorKindEnum });
    t.list.nonNull.string('tagIds');
    t.string('targetProductId');
    t.list.nonNull.string('targetLineItemIds');
  },
});

export const ServiceRequirementMeasurement = objectType({
  name: 'ServiceRequirementMeasurement',
  definition(t) {
    t.nonNull.float('value');
    t.nonNull.string('unitCode');
  },
});

export const ServiceRequirementMissingTarget = objectType({
  name: 'ServiceRequirementMissingTarget',
  definition(t) {
    t.nonNull.string('targetLineItemId');
    t.nonNull.string('reason');
    t.nonNull.list.nonNull.string('missingAttributeKeys');
  },
});

export const ServiceRequirementEnvelope = objectType({
  name: 'ServiceRequirementEnvelope',
  definition(t) {
    t.nonNull.list.nonNull.string('targetLineItemIds');
    t.nonNull.int('targetLineItemCount');
    t.float('targetQuantity');
    t.field('totalWeight', { type: ServiceRequirementMeasurement });
    t.field('maxItemWeight', { type: ServiceRequirementMeasurement });
    t.field('maxLength', { type: ServiceRequirementMeasurement });
    t.field('maxWidth', { type: ServiceRequirementMeasurement });
    t.field('maxHeight', { type: ServiceRequirementMeasurement });
    t.nonNull.list.nonNull.field('missingTargets', {
      type: ServiceRequirementMissingTarget,
    });
    t.nonNull.list.nonNull.string('warnings');
  },
});

export const LineItem = objectType({
  name: 'LineItem',
  definition(t) {
    t.nonNull.id('id');
    t.nonNull.string('workspaceId');
    t.nonNull.field('documentRef', { type: LineItemDocumentRef });
    t.nonNull.field('type', { type: LineItemTypeEnum });
    t.nonNull.string('description');
    t.nonNull.string('quantity');
    t.string('unitCode');
    t.field('productRef', { type: LineItemProductRef });
    t.field('timeWindow', { type: LineItemTimeWindow });
    t.field('placeRef', { type: LineItemPlaceRef });
    t.list.field('constraints', { type: LineItemConstraint });
    t.list.field('inputs', { type: LineItemInputValue });
    t.field('pricingRef', { type: LineItemPricingRef });
    t.field('pricingSpecSnapshot', { type: 'PricingSpec' });
    t.int('rateInCentsSnapshot');
    t.int('subtotalInCents');
    t.string('customPriceName');
    t.list.field('scopeTasks', { type: ServiceScopeTask });
    t.field('delivery', { type: LineItemDelivery });
    t.int('deliveryChargeInCents');
    t.string('notes');
    t.list.field('targetSelectors', { type: LineItemTargetSelector });
    t.id('sourceLineItemId');
    t.nonNull.field('state', {
      type: LineItemStateEnum,
      async resolve(parent, _args, ctx) {
        if (!ctx.user) return 'PROPOSED';

        if (parent.documentRef.type === 'QUOTE_REVISION') {
          const revisionId =
            parent.documentRef.revisionId ?? parent.documentRef.id;
          const revision = await ctx.services.quotingService.getQuoteRevisionById(
            revisionId,
            ctx.user,
          );
          return revision ? 'PROPOSED' : 'PROPOSED';
        }

        if (parent.documentRef.type === 'SALES_ORDER') {
          const fulfilment =
            await ctx.services.fulfilmentService.getFulfilmentBySalesOrderLineItemId(
              parent.id,
              ctx.user,
            );
          return fulfilment ? 'IN_PROGRESS' : 'PLANNED';
        }

        return 'PLANNED';
      },
    });
    t.nonNull.field('createdAt', { type: 'DateTime' });
    t.nonNull.field('updatedAt', { type: 'DateTime' });
  },
});

export const LogisticsServiceAddOnSelectionInput = inputObjectType({
  name: 'LogisticsServiceAddOnSelectionInput',
  definition(t) {
    t.nonNull.boolean('enabled');
    t.string('priceId');
    t.id('serviceLineItemId');
  },
});

export const SyncMaterialLogisticsAddOnsInput = inputObjectType({
  name: 'SyncMaterialLogisticsAddOnsInput',
  definition(t) {
    t.nonNull.id('materialLineItemId');
    t.field('delivery', { type: LogisticsServiceAddOnSelectionInput });
    t.field('pickup', { type: LogisticsServiceAddOnSelectionInput });
  },
});

export const SyncMaterialLogisticsAddOnsResult = objectType({
  name: 'SyncMaterialLogisticsAddOnsResult',
  definition(t) {
    t.nonNull.id('materialLineItemId');
    t.field('deliveryLineItem', { type: LineItem });
    t.field('pickupLineItem', { type: LineItem });
    t.nonNull.list.nonNull.field('serviceAddOns', { type: LineItem });
    t.nonNull.list.nonNull.string('warnings');
  },
});

export const ListLogisticsServiceGroupsFilter = inputObjectType({
  name: 'ListLogisticsServiceGroupsFilter',
  definition(t) {
    t.nonNull.id('workspaceId');
    t.nonNull.field('documentRef', { type: LineItemDocumentRefInput });
    t.field('productId', { type: LogisticsServiceProductIdEnum });
  },
});

export const LineItemInput = inputObjectType({
  name: 'LineItemInput',
  definition(t) {
    t.nonNull.string('workspaceId');
    t.nonNull.field('documentRef', { type: LineItemDocumentRefInput });
    t.nonNull.field('type', { type: LineItemTypeEnum });
    t.nonNull.string('description');
    t.nonNull.string('quantity');
    t.string('unitCode');
    t.field('productRef', { type: LineItemProductRefInput });
    t.field('timeWindow', { type: LineItemTimeWindowInput });
    t.field('placeRef', { type: LineItemPlaceRefInput });
    t.list.field('constraints', { type: LineItemConstraintInput });
    t.list.field('inputs', { type: LineItemInputValueInput });
    t.field('pricingRef', { type: LineItemPricingRefInput });
    t.field('pricingSpecSnapshot', { type: 'PricingSpecInput' });
    t.int('rateInCentsSnapshot');
    t.int('subtotalInCents');
    t.string('customPriceName');
    t.list.field('scopeTasks', { type: ServiceScopeTaskInput });
    t.field('delivery', { type: LineItemDeliveryInput });
    t.int('deliveryChargeInCents');
    t.string('notes');
    t.list.field('targetSelectors', { type: LineItemTargetSelectorInput });
    t.id('sourceLineItemId');
  },
});

export const UpdateLineItemInput = inputObjectType({
  name: 'UpdateLineItemInput',
  definition(t) {
    t.string('description');
    t.string('quantity');
    t.string('unitCode');
    t.field('productRef', { type: LineItemProductRefInput });
    t.field('timeWindow', { type: LineItemTimeWindowInput });
    t.field('placeRef', { type: LineItemPlaceRefInput });
    t.list.field('constraints', { type: LineItemConstraintInput });
    t.list.field('inputs', { type: LineItemInputValueInput });
    t.field('pricingRef', { type: LineItemPricingRefInput });
    t.field('pricingSpecSnapshot', { type: 'PricingSpecInput' });
    t.int('rateInCentsSnapshot');
    t.int('subtotalInCents');
    t.string('customPriceName');
    t.list.field('scopeTasks', { type: ServiceScopeTaskInput });
    t.field('delivery', { type: LineItemDeliveryInput });
    t.int('deliveryChargeInCents');
    t.string('notes');
    t.list.field('targetSelectors', { type: LineItemTargetSelectorInput });
    t.id('sourceLineItemId');
  },
});

export const ListLineItemsFilter = inputObjectType({
  name: 'ListLineItemsFilter',
  definition(t) {
    t.nonNull.string('workspaceId');
    t.field('documentType', { type: LineItemDocumentTypeEnum });
    t.string('documentId');
    t.string('revisionId');
    t.field('type', { type: LineItemTypeEnum });
  },
});

export const ListLineItemsResult = objectType({
  name: 'ListLineItemsResult',
  definition(t) {
    t.nonNull.list.nonNull.field('items', { type: LineItem });
    t.nonNull.field('page', { type: PaginationInfo });
  },
});

type LineItemConstraintInputShape = {
  kind: LineItemConstraintKind;
  strength: LineItemConstraintStrength;
  data?: {
    tag?: { tagIds?: string[] | null } | null;
    attribute?: {
      attributeTypeId?: string | null;
      op?: LineItemConstraintAttributeOp | null;
      value?: unknown;
      unitCode?: string | null;
      contextTags?: string[] | null;
    } | null;
    brand?: { brandId?: string | null; manufacturerId?: string | null } | null;
    schedule?: { startAt?: Date | null; endAt?: Date | null } | null;
    location?: {
      placeRef?: { kind?: LineItemPlaceKind | null; id?: string | null } | null;
    } | null;
    other?: { note?: string | null } | null;
  } | null;
};

type LineItemInputValueInputShape = {
  attributeTypeId?: string | null;
  value?: unknown;
  unitCode?: string | null;
  contextTags?: string[] | null;
};

type PricingSpecInputShape = {
  kind?: 'UNIT' | 'TIME' | 'RENTAL_RATE_TABLE';
  unitCode?: string | null;
  rateInCents?: number | null;
  pricePerDayInCents?: number | null;
  pricePerWeekInCents?: number | null;
  pricePerMonthInCents?: number | null;
};

const normalizePricingSpecSnapshotInput = (
  input?: PricingSpecInputShape | null,
): PricingSpec | undefined => {
  if (!input) return undefined;
  if (!input.kind) {
    throw new Error('pricingSpecSnapshot.kind is required');
  }

  if (input.kind === 'UNIT' || input.kind === 'TIME') {
    if (!input.unitCode) {
      throw new Error(
        `pricingSpecSnapshot.unitCode is required for ${input.kind}`,
      );
    }
    if (input.rateInCents === null || input.rateInCents === undefined) {
      throw new Error(
        `pricingSpecSnapshot.rateInCents is required for ${input.kind}`,
      );
    }
    return {
      kind: input.kind,
      unitCode: input.unitCode,
      rateInCents: input.rateInCents,
    };
  }

  if (input.kind === 'RENTAL_RATE_TABLE') {
    if (
      input.pricePerDayInCents === null ||
      input.pricePerDayInCents === undefined ||
      input.pricePerWeekInCents === null ||
      input.pricePerWeekInCents === undefined ||
      input.pricePerMonthInCents === null ||
      input.pricePerMonthInCents === undefined
    ) {
      throw new Error(
        'pricingSpecSnapshot pricePerDayInCents/pricePerWeekInCents/pricePerMonthInCents are required for RENTAL_RATE_TABLE',
      );
    }
    return {
      kind: input.kind,
      pricePerDayInCents: input.pricePerDayInCents,
      pricePerWeekInCents: input.pricePerWeekInCents,
      pricePerMonthInCents: input.pricePerMonthInCents,
    };
  }

  throw new Error(`Unsupported pricingSpecSnapshot.kind: ${input.kind}`);
};

type LineItemTargetSelectorInputShape = {
  kind: 'tags' | 'product' | 'line_item';
  tagIds?: string[] | null;
  targetProductId?: string | null;
  targetLineItemIds?: string[] | null;
};

type ServiceScopeTaskInputShape = {
  id: string;
  sourceTemplateId?: string | null;
  title: string;
  activityTagIds: string[];
  contextTagIds?: string[] | null;
  notes?: string | null;
};

const normalizeLineItemTargetSelectorInput = (
  input: LineItemTargetSelectorInputShape,
): LineItemTargetSelectorModel => {
  switch (input.kind) {
    case 'tags': {
      if (!Array.isArray(input.tagIds) || input.tagIds.length === 0) {
        throw new Error('targetSelector kind=tags requires tagIds');
      }
      return { kind: 'tags', tagIds: input.tagIds };
    }
    case 'product': {
      if (!input.targetProductId) {
        throw new Error('targetSelector kind=product requires targetProductId');
      }
      return { kind: 'product', targetProductId: input.targetProductId };
    }
    case 'line_item': {
      if (
        !Array.isArray(input.targetLineItemIds) ||
        input.targetLineItemIds.length === 0
      ) {
        throw new Error(
          'targetSelector kind=line_item requires targetLineItemIds',
        );
      }
      return { kind: 'line_item', targetLineItemIds: input.targetLineItemIds };
    }
    default:
      throw new Error(`Unsupported targetSelector kind: ${input.kind}`);
  }
};

const mapTargetSelectorInputs = (
  selectors: Array<LineItemTargetSelectorInputShape | null> | null | undefined,
): LineItemTargetSelectorModel[] | null | undefined => {
  if (selectors === undefined) return undefined;
  if (selectors === null) return null;
  return selectors
    .filter((selector): selector is LineItemTargetSelectorInputShape => selector !== null)
    .map((selector) => normalizeLineItemTargetSelectorInput(selector));
};

const normalizeLineItemConstraintInput = (
  input: LineItemConstraintInputShape,
): LineItemConstraintModel => {
  if (!input?.data) {
    throw new Error('Line item constraint data is required');
  }
  switch (input.kind) {
    case 'TAG': {
      const tagIds = input.data.tag?.tagIds ?? null;
      if (!Array.isArray(tagIds) || tagIds.length === 0) {
        throw new Error('TAG constraint requires tagIds');
      }
      return {
        kind: 'TAG',
        strength: input.strength,
        data: { tagIds },
      };
    }
    case 'ATTRIBUTE': {
      const attribute = input.data.attribute ?? null;
      if (!attribute?.attributeTypeId || !attribute.op) {
        throw new Error('ATTRIBUTE constraint requires attributeTypeId and op');
      }
      const value = attribute.value;
      if (
        typeof value !== 'string' &&
        typeof value !== 'number' &&
        typeof value !== 'boolean'
      ) {
        throw new Error(
          'ATTRIBUTE constraint value must be string, number, or boolean',
        );
      }
      return {
        kind: 'ATTRIBUTE',
        strength: input.strength,
        data: {
          attributeTypeId: attribute.attributeTypeId,
          op: attribute.op,
          value,
          unitCode: attribute.unitCode ?? null,
          contextTags: attribute.contextTags ?? null,
        },
      };
    }
    case 'BRAND': {
      const brand = input.data.brand ?? null;
      if (!brand?.brandId && !brand?.manufacturerId) {
        throw new Error('BRAND constraint requires brandId or manufacturerId');
      }
      return {
        kind: 'BRAND',
        strength: input.strength,
        data: {
          brandId: brand.brandId ?? null,
          manufacturerId: brand.manufacturerId ?? null,
        },
      };
    }
    case 'SCHEDULE': {
      const schedule = input.data.schedule ?? null;
      if (!schedule?.startAt && !schedule?.endAt) {
        throw new Error('SCHEDULE constraint requires startAt or endAt');
      }
      return {
        kind: 'SCHEDULE',
        strength: input.strength,
        data: {
          startAt: schedule.startAt ?? null,
          endAt: schedule.endAt ?? null,
        },
      };
    }
    case 'LOCATION': {
      const location = input.data.location ?? null;
      if (!location?.placeRef?.kind || !location.placeRef.id) {
        throw new Error(
          'LOCATION constraint requires placeRef.kind and placeRef.id',
        );
      }
      return {
        kind: 'LOCATION',
        strength: input.strength,
        data: {
          placeRef: {
            kind: location.placeRef.kind,
            id: location.placeRef.id,
          },
        },
      };
    }
    case 'OTHER': {
      const other = input.data.other ?? null;
      if (!other?.note) {
        throw new Error('OTHER constraint requires note');
      }
      return {
        kind: 'OTHER',
        strength: input.strength,
        data: { note: other.note },
      };
    }
    default:
      throw new Error(`Unsupported constraint kind: ${input.kind}`);
  }
};

const normalizeLineItemInputValue = (input: LineItemInputValueInputShape) => {
  if (!input?.attributeTypeId) {
    throw new Error('Line item input requires attributeTypeId');
  }
  const value = input.value;
  if (
    typeof value !== 'string' &&
    typeof value !== 'number' &&
    typeof value !== 'boolean'
  ) {
    throw new Error('Line item input value must be string, number, or boolean');
  }

  const contextTags =
    input.contextTags && input.contextTags.length > 0
      ? input.contextTags
      : null;

  return {
    attributeTypeId: input.attributeTypeId,
    value,
    unitCode: input.unitCode ?? null,
    contextTags,
  };
};

const mapLineItemInputs = (
  inputs: Array<LineItemInputValueInputShape | null> | null | undefined,
): LineItemInputValueModel[] | null | undefined => {
  if (inputs === undefined) return undefined;
  if (inputs === null) return null;
  return inputs
    .filter((input): input is LineItemInputValueInputShape => input !== null)
    .map((input) => normalizeLineItemInputValue(input)) as LineItemInputValueModel[];
};

const mapScopeTaskInputs = (
  tasks: Array<ServiceScopeTaskInputShape | null> | null | undefined,
) => {
  if (tasks === undefined) return undefined;
  if (tasks === null) return null;
  return tasks
    .filter((task): task is ServiceScopeTaskInputShape => task !== null)
    .map((task) => ({
      id: task.id,
      sourceTemplateId: task.sourceTemplateId ?? null,
      title: task.title,
      activityTagIds: task.activityTagIds ?? [],
      contextTagIds: task.contextTagIds ?? null,
      notes: task.notes ?? null,
    }));
};

const mapConstraintInputs = (
  constraints: Array<LineItemConstraintInputShape | null> | null | undefined,
): LineItemConstraintModel[] | null | undefined => {
  if (constraints === undefined) return undefined;
  if (constraints === null) return null;
  return constraints
    .filter(
      (constraint): constraint is LineItemConstraintInputShape =>
        constraint !== null,
    )
    .map((constraint) => normalizeLineItemConstraintInput(constraint));
};

const normalizeLineItemQuantity = (value: string) => {
  const trimmed = value.trim();
  if (!trimmed) {
    throw new Error('Line item quantity is required');
  }
  const parsed = Number(trimmed);
  if (!Number.isFinite(parsed)) {
    throw new Error('Line item quantity must be a valid number');
  }
  if (parsed < 0) {
    throw new Error('Line item quantity must be non-negative');
  }
  return trimmed;
};

export const LineItemQuery = extendType({
  type: 'Query',
  definition(t) {
    t.field('getLineItemById', {
      type: LineItem,
      args: { id: nonNull(stringArg()) },
      resolve: (_root, { id }, ctx) =>
        ctx.services.lineItemsService.getLineItemById(id, ctx.user),
    });

    t.field('listLineItems', {
      type: ListLineItemsResult,
      args: {
        filter: nonNull(arg({ type: ListLineItemsFilter })),
        page: arg({ type: PageInfoInput }),
      },
      resolve: (_root, { filter, page }, ctx) =>
        ctx.services.lineItemsService.listLineItems(
          {
            filter: {
              workspaceId: filter.workspaceId,
              documentRef:
                filter.documentType || filter.documentId || filter.revisionId
                  ? {
                      ...(filter.documentType
                        ? { type: filter.documentType }
                        : {}),
                      ...(filter.documentId ? { id: filter.documentId } : {}),
                      ...(filter.revisionId
                        ? { revisionId: filter.revisionId }
                        : {}),
                    }
                  : undefined,
              type: filter.type ?? undefined,
            },
            page: page
              ? (Object.fromEntries(
                  Object.entries(page).map(([key, value]) => [
                    key,
                    value === null ? undefined : value,
                  ]),
                ) as any)
              : undefined,
          },
          ctx.user,
        ),
    });

    t.nonNull.list.nonNull.field('listLogisticsServiceGroups', {
      type: LineItem,
      args: { filter: nonNull(arg({ type: ListLogisticsServiceGroupsFilter })) },
      async resolve(_root, { filter }, ctx) {
        if (!ctx.user) {
          throw new Error('User not authenticated');
        }

        const documentRef = {
          type: filter.documentRef.type as any,
          id: filter.documentRef.id,
          revisionId: filter.documentRef.revisionId ?? null,
        };

        const docLineItems =
          (await ctx.services.lineItemsService.listLineItemsByDocumentRef(
            filter.workspaceId,
            documentRef,
            ctx.user,
          )) as LineItemModel[];

        const allowedProductIds = new Set(['svc_delivery', 'svc_pickup']);

        const logistics = docLineItems.filter((item) => {
          if (item.type !== 'SERVICE') return false;
          if (item.productRef?.kind !== 'SERVICE_PRODUCT') return false;
          if (!allowedProductIds.has(item.productRef.productId)) return false;
          if (filter.productId && item.productRef.productId !== filter.productId) {
            return false;
          }
          return true;
        });

        return logistics.sort((a, b) => {
          const aStart = a.timeWindow?.startAt?.getTime() ?? Number.POSITIVE_INFINITY;
          const bStart = b.timeWindow?.startAt?.getTime() ?? Number.POSITIVE_INFINITY;
          if (aStart !== bStart) return aStart - bStart;
          return a.createdAt.getTime() - b.createdAt.getTime();
        });
      },
    });

    t.nonNull.field('computeServiceRequirementEnvelope', {
      type: ServiceRequirementEnvelope,
      args: { serviceLineItemId: nonNull(stringArg()) },
      async resolve(_root, { serviceLineItemId }, ctx) {
        if (!ctx.user) {
          throw new Error('User not authenticated');
        }

        const serviceLineItem =
          (await ctx.services.lineItemsService.getLineItemById(
            serviceLineItemId,
            ctx.user,
          )) as LineItemModel | null;
        if (!serviceLineItem) {
          throw new Error('Line item not found');
        }
        if (serviceLineItem.type !== 'SERVICE') {
          throw new Error('Only SERVICE line items support requirement envelopes');
        }

        const docLineItems =
          (await ctx.services.lineItemsService.listLineItemsByDocumentRef(
            serviceLineItem.workspaceId,
            serviceLineItem.documentRef,
            ctx.user,
          )) as LineItemModel[];

        const canonicalById = new Map<string, LineItemModel>(
          docLineItems.map((item) => [item.id, item]),
        );

        const canonicalByQuoteRevisionId = new Map<string, string>();
        for (const item of docLineItems) {
          if (item.quoteRevisionLineItemId) {
            canonicalByQuoteRevisionId.set(item.quoteRevisionLineItemId, item.id);
          }
        }

        const requestedTargetIds = Array.from(
          new Set(
            (serviceLineItem.targetSelectors ?? [])
              .filter(
                (
                  selector,
                ): selector is Extract<
                  LineItemTargetSelectorModel,
                  { kind: 'line_item' }
                > => selector.kind === 'line_item',
              )
              .flatMap((selector) => selector.targetLineItemIds),
          ),
        );

        const resolvedTargetLineItemIds: string[] = [];
        const missingTargets: Array<{
          targetLineItemId: string;
          reason: string;
          missingAttributeKeys: string[];
        }> = [];
        const warnings: string[] = [];

        for (const rawId of requestedTargetIds) {
          const resolved =
            canonicalById.get(rawId) ??
            (canonicalByQuoteRevisionId.get(rawId)
              ? canonicalById.get(canonicalByQuoteRevisionId.get(rawId) as string)
              : null);

          if (!resolved) {
            missingTargets.push({
              targetLineItemId: rawId,
              reason: 'target_line_item_not_found_in_document',
              missingAttributeKeys: [],
            });
            continue;
          }

          resolvedTargetLineItemIds.push(resolved.id);
        }

        const unitCache = new Map<
          string,
          { canonicalUnitCode: string; toCanonicalFactor: number; offset: number } | null
        >();

        const getUnit = async (unitCode: string) => {
          const normalized = ctx.services.globalAttributesService.normalizeUnitCode(unitCode);
          if (!normalized) return null;
          if (unitCache.has(normalized)) return unitCache.get(normalized) ?? null;
          const unit = await ctx.services.globalAttributesService.findUnitDefinitionByCodeOrAlias(
            normalized,
          );
          const resolved = unit
            ? {
                canonicalUnitCode: unit.canonicalUnitCode ?? unit.code,
                toCanonicalFactor: unit.toCanonicalFactor ?? 1,
                offset: unit.offset ?? 0,
              }
            : null;
          unitCache.set(normalized, resolved);
          return resolved;
        };

        const convertUnit = async (opts: {
          value: number;
          fromUnitCode: string;
          toUnitCode: string;
        }) => {
          const fromNormalized = ctx.services.globalAttributesService.normalizeUnitCode(
            opts.fromUnitCode,
          );
          const toNormalized = ctx.services.globalAttributesService.normalizeUnitCode(
            opts.toUnitCode,
          );
          if (fromNormalized && toNormalized && fromNormalized === toNormalized) {
            return opts.value;
          }

          const from = await getUnit(opts.fromUnitCode);
          const to = await getUnit(opts.toUnitCode);
          if (!from || !to) return null;
          if (from.canonicalUnitCode !== to.canonicalUnitCode) return null;
          const canonicalValue = (opts.value + from.offset) * from.toCanonicalFactor;
          const converted = canonicalValue / to.toCanonicalFactor - to.offset;
          return converted;
        };

        const pickNumericAttribute = (params: {
          attributes: unknown;
          key: string;
          preferredContexts: string[];
        }) => {
          const attributes = Array.isArray(params.attributes) ? params.attributes : [];
          const candidates = attributes
            .map((attribute) => {
              if (!attribute || typeof attribute !== 'object') return null;
              const record = attribute as any;
              const key =
                typeof record.key === 'string' ? record.key.trim().toLowerCase() : '';
              if (key !== params.key) return null;
              if (typeof record.value !== 'number' || !Number.isFinite(record.value)) {
                return null;
              }
              const unit = typeof record.unit === 'string' ? record.unit.trim() : '';
              if (!unit) return null;
              const contextTags = Array.isArray(record.contextTags)
                ? record.contextTags
                    .filter((tag: unknown) => typeof tag === 'string')
                    .map((tag: string) => tag.trim().toLowerCase())
                    .filter(Boolean)
                : [];
              return {
                value: record.value as number,
                unit,
                contextTags,
              };
            })
            .filter((value): value is { value: number; unit: string; contextTags: string[] } => value !== null);

          if (candidates.length === 0) return null;
          const scored = candidates
            .map((candidate) => {
              const ctxSet = new Set(candidate.contextTags);
              const score = params.preferredContexts.reduce((acc, token, index) => {
                if (!ctxSet.has(token)) return acc;
                return acc + (params.preferredContexts.length - index);
              }, 0);
              return { candidate, score };
            })
            .sort((left, right) => right.score - left.score);
          return scored[0]?.candidate ?? null;
        };

        let totalWeightLb = 0;
        let maxItemWeightLb = 0;
        let maxLengthIn = 0;
        let maxWidthIn = 0;
        let maxHeightIn = 0;
        let targetQuantity = 0;

        for (const targetId of resolvedTargetLineItemIds) {
          const target = canonicalById.get(targetId);
          if (!target) continue;

          const quantity = Number.parseFloat(target.quantity);
          const normalizedQty = Number.isFinite(quantity) ? quantity : 1;
          targetQuantity += normalizedQty;

          const productId = target.productRef?.productId ?? null;
          if (!productId) {
            missingTargets.push({
              targetLineItemId: targetId,
              reason: 'target_missing_product_ref',
              missingAttributeKeys: ['weight', 'length', 'width', 'height'],
            });
            continue;
          }

          const productPath = `/catalogs/default/products/${productId}.jsonc`;
          let parsedProduct: any = null;
          try {
            const read = await ctx.services.studioFsService.read(
              { workspaceId: serviceLineItem.workspaceId, path: productPath },
              ctx.user,
            );
            const raw = JSON.parse(read.content);
            const validated = catalogProductSchema.safeParse(raw);
            parsedProduct = validated.success ? validated.data : null;
            if (!validated.success) {
              warnings.push(`Failed to validate catalog product "${productId}"`);
            }
          } catch (error) {
            parsedProduct = null;
          }

          if (!parsedProduct) {
            missingTargets.push({
              targetLineItemId: targetId,
              reason: 'target_catalog_product_not_found_or_invalid',
              missingAttributeKeys: ['weight', 'length', 'width', 'height'],
            });
            continue;
          }

          const attributes = parsedProduct.attributes ?? [];
          const missingKeys: string[] = [];

          const weight = pickNumericAttribute({
            attributes,
            key: 'weight',
            preferredContexts: ['shipping', 'gross', 'operating'],
          });
          if (!weight) {
            missingKeys.push('weight');
          }

          const length = pickNumericAttribute({
            attributes,
            key: 'length',
            preferredContexts: ['overall'],
          });
          if (!length) {
            missingKeys.push('length');
          }

          const width = pickNumericAttribute({
            attributes,
            key: 'width',
            preferredContexts: ['overall'],
          });
          if (!width) {
            missingKeys.push('width');
          }

          const height = pickNumericAttribute({
            attributes,
            key: 'height',
            preferredContexts: ['overall'],
          });
          if (!height) {
            missingKeys.push('height');
          }

          if (missingKeys.length > 0) {
            missingTargets.push({
              targetLineItemId: targetId,
              reason: 'target_catalog_product_missing_required_attributes',
              missingAttributeKeys: missingKeys,
            });
          }

          if (weight) {
            const converted = await convertUnit({
              value: weight.value,
              fromUnitCode: weight.unit,
              toUnitCode: 'LB',
            });
            if (converted === null) {
              warnings.push(
                `Unable to convert weight for "${productId}" from "${weight.unit}" to "LB"`,
              );
            } else {
              totalWeightLb += converted * normalizedQty;
              maxItemWeightLb = Math.max(maxItemWeightLb, converted);
            }
          }

          if (length) {
            const converted = await convertUnit({
              value: length.value,
              fromUnitCode: length.unit,
              toUnitCode: 'IN',
            });
            if (converted === null) {
              warnings.push(
                `Unable to convert length for "${productId}" from "${length.unit}" to "IN"`,
              );
            } else {
              maxLengthIn = Math.max(maxLengthIn, converted);
            }
          }

          if (width) {
            const converted = await convertUnit({
              value: width.value,
              fromUnitCode: width.unit,
              toUnitCode: 'IN',
            });
            if (converted === null) {
              warnings.push(
                `Unable to convert width for "${productId}" from "${width.unit}" to "IN"`,
              );
            } else {
              maxWidthIn = Math.max(maxWidthIn, converted);
            }
          }

          if (height) {
            const converted = await convertUnit({
              value: height.value,
              fromUnitCode: height.unit,
              toUnitCode: 'IN',
            });
            if (converted === null) {
              warnings.push(
                `Unable to convert height for "${productId}" from "${height.unit}" to "IN"`,
              );
            } else {
              maxHeightIn = Math.max(maxHeightIn, converted);
            }
          }
        }

        return {
          targetLineItemIds: resolvedTargetLineItemIds,
          targetLineItemCount: resolvedTargetLineItemIds.length,
          targetQuantity,
          totalWeight:
            totalWeightLb > 0
              ? { value: totalWeightLb, unitCode: 'LB' }
              : null,
          maxItemWeight:
            maxItemWeightLb > 0
              ? { value: maxItemWeightLb, unitCode: 'LB' }
              : null,
          maxLength: maxLengthIn > 0 ? { value: maxLengthIn, unitCode: 'IN' } : null,
          maxWidth: maxWidthIn > 0 ? { value: maxWidthIn, unitCode: 'IN' } : null,
          maxHeight:
            maxHeightIn > 0 ? { value: maxHeightIn, unitCode: 'IN' } : null,
          missingTargets,
          warnings,
        };
      },
    });
  },
});

export const LineItemMutation = extendType({
  type: 'Mutation',
  definition(t) {
    t.nonNull.field('createLineItem', {
      type: LineItem,
      args: { input: nonNull(arg({ type: LineItemInput })) },
      resolve: async (_root, { input }, ctx) => {
        if (!ctx.user) {
          throw new Error('User not authenticated');
        }

        const documentRef = {
          type: input.documentRef.type as any,
          id: input.documentRef.id,
          revisionId: input.documentRef.revisionId ?? null,
        };

        // Guard against orphaned line items by ensuring the parent document exists
        // (and that the workspaceId matches where applicable).
        if (documentRef.type === 'PURCHASE_ORDER') {
          const [purchaseOrder] =
            await ctx.services.purchaseOrdersService.batchGetPurchaseOrdersById(
              [documentRef.id],
              ctx.user,
            );
          if (!purchaseOrder) {
            throw new Error('Purchase order not found or access denied');
          }
          if (purchaseOrder.workspace_id !== input.workspaceId) {
            throw new Error(
              'workspaceId does not match purchase order workspace_id',
            );
          }
        }

        if (documentRef.type === 'SALES_ORDER') {
          const [salesOrder] =
            await ctx.services.salesOrdersService.batchGetSalesOrdersById(
              [documentRef.id],
              ctx.user,
            );
          if (!salesOrder) {
            throw new Error('Sales order not found or access denied');
          }
          if (salesOrder.workspace_id !== input.workspaceId) {
            throw new Error('workspaceId does not match sales order workspace_id');
          }
        }

        if (documentRef.type === 'QUOTE_REVISION') {
          if (!documentRef.revisionId) {
            throw new Error(
              'documentRef.revisionId is required for QUOTE_REVISION line items',
            );
          }
          const revision = await ctx.services.quotingService.getQuoteRevisionById(
            documentRef.revisionId,
            ctx.user,
          );
          if (!revision) {
            throw new Error('Quote revision not found or access denied');
          }
          if (revision.quoteId !== documentRef.id) {
            throw new Error('Quote revision does not belong to quote');
          }
          const quote = await ctx.services.quotingService.getQuoteById(
            documentRef.id,
            ctx.user,
          );
          if (!quote) {
            throw new Error('Quote not found or access denied');
          }
          if (quote.sellerWorkspaceId !== input.workspaceId) {
            throw new Error(
              'workspaceId must match quote.sellerWorkspaceId for QUOTE_REVISION line items',
            );
          }
        }

        return ctx.services.lineItemsService.createLineItem(
          {
            workspaceId: input.workspaceId,
            documentRef,
            type: input.type as any,
            description: input.description,
            quantity: normalizeLineItemQuantity(input.quantity),
            unitCode: input.unitCode ?? null,
            productRef: input.productRef
              ? {
                  kind: input.productRef.kind as any,
                  productId: input.productRef.productId,
                }
              : null,
            timeWindow: input.timeWindow
              ? {
                  startAt: input.timeWindow.startAt ?? null,
                  endAt: input.timeWindow.endAt ?? null,
                }
              : null,
            placeRef: input.placeRef
              ? { kind: input.placeRef.kind as any, id: input.placeRef.id }
              : null,
            constraints: mapConstraintInputs(input.constraints) ?? null,
            inputs: mapLineItemInputs(input.inputs) ?? null,
            pricingRef: input.pricingRef ?? null,
            pricingSpecSnapshot:
              input.pricingSpecSnapshot === undefined ||
              input.pricingSpecSnapshot === null
                ? null
                : (normalizePricingSpecSnapshotInput(
                    input.pricingSpecSnapshot as PricingSpecInputShape,
                  ) ?? null),
	            rateInCentsSnapshot: input.rateInCentsSnapshot ?? null,
	            subtotalInCents: input.subtotalInCents ?? null,
	            customPriceName: input.customPriceName ?? null,
	            scopeTasks:
	              mapScopeTaskInputs(
	                input.scopeTasks as
	                  | Array<ServiceScopeTaskInputShape | null>
	                  | null
	                  | undefined,
	              ) ?? null,
	            delivery: input.delivery ?? null,
	            deliveryChargeInCents: input.deliveryChargeInCents ?? null,
	            notes: input.notes ?? null,
            targetSelectors:
              mapTargetSelectorInputs(
                input.targetSelectors as Array<LineItemTargetSelectorInputShape | null> | null | undefined,
              ) ?? null,
            sourceLineItemId: input.sourceLineItemId ?? null,
          },
          ctx.user,
        );
      },
    });

    t.nonNull.field('syncMaterialLogisticsAddOns', {
      type: SyncMaterialLogisticsAddOnsResult,
      args: { input: nonNull(arg({ type: SyncMaterialLogisticsAddOnsInput })) },
      async resolve(_root, { input }, ctx) {
        if (!ctx.user) {
          throw new Error('User not authenticated');
        }

        const materialLineItem =
          (await ctx.services.lineItemsService.getLineItemById(
            input.materialLineItemId,
            ctx.user,
          )) as LineItemModel | null;
        if (!materialLineItem) {
          throw new Error('Line item not found');
        }
        if (materialLineItem.type === 'SERVICE') {
          throw new Error('Only material (RENTAL/SALE) line items can have logistics add-ons');
        }

        const documentLineItems =
          (await ctx.services.lineItemsService.listLineItemsByDocumentRef(
            materialLineItem.workspaceId,
            materialLineItem.documentRef,
            ctx.user,
          )) as LineItemModel[];

        const listTargetLineItemIds = (candidate: LineItemModel): string[] => {
          const selectors = Array.isArray(candidate.targetSelectors)
            ? candidate.targetSelectors
            : [];
          return Array.from(
            new Set(
              selectors
                .filter(
                  (
                    selector,
                  ): selector is Extract<
                    NonNullable<LineItemModel['targetSelectors']>[number],
                    { kind: 'line_item' }
                  > => selector?.kind === 'line_item',
                )
                .flatMap((selector) =>
                  Array.isArray(selector.targetLineItemIds)
                    ? selector.targetLineItemIds
                    : [],
                )
                .filter((id): id is string => typeof id === 'string' && Boolean(id.trim())),
            ),
          );
        };

        const upsertTargetLineItemIds = (
          selectors: LineItemModel['targetSelectors'] | null | undefined,
          nextTargetIds: string[],
        ) => {
          const base = Array.isArray(selectors) ? selectors : [];
          const others = base.filter((selector) => selector?.kind !== 'line_item');
          if (nextTargetIds.length === 0) {
            return others.length > 0 ? others : null;
          }
          return [
            ...others,
            {
              kind: 'line_item' as const,
              targetLineItemIds: Array.from(new Set(nextTargetIds)),
            },
          ];
        };

        const isLogisticsServiceLineItem = (
          candidate: LineItemModel,
          productId: 'svc_delivery' | 'svc_pickup',
        ) =>
          candidate.type === 'SERVICE' &&
          candidate.productRef?.kind === 'SERVICE_PRODUCT' &&
          candidate.productRef.productId === productId;

        const listLogisticsServiceLineItems = (
          productId: 'svc_delivery' | 'svc_pickup',
        ) =>
          documentLineItems.filter((candidate) =>
            isLogisticsServiceLineItem(candidate, productId),
          );

        const listLogisticsLinesTargetingMaterial = (
          productId: 'svc_delivery' | 'svc_pickup',
        ) =>
          listLogisticsServiceLineItems(productId).filter((candidate) =>
            listTargetLineItemIds(candidate).includes(materialLineItem.id),
          );

        const deriveDefaultTimeWindow = (productId: 'svc_delivery' | 'svc_pickup') => {
          const base = materialLineItem.timeWindow ?? null;
          if (!base) return null;
          if (productId === 'svc_delivery') {
            return base.startAt ? { startAt: base.startAt, endAt: null } : null;
          }
          return base.endAt ? { startAt: base.endAt, endAt: null } : null;
        };

        const readServiceProductTaskTemplates = async (
          catalogPath: string,
          productId: 'svc_delivery' | 'svc_pickup',
        ) => {
          const productPath = `${catalogPath}/products/${productId}.jsonc`;
          const read = await ctx.services.studioFsService.read(
            { workspaceId: materialLineItem.workspaceId, path: productPath },
            ctx.user,
          );
          const raw = JSON.parse(read.content);
          const parsed = catalogProductSchema.safeParse(raw);
          if (!parsed.success) {
            throw new Error(`Invalid catalog product "${productId}"`);
          }
          const templates = parsed.data.taskTemplates ?? [];
          return templates.map((template) => ({
            id: template.id,
            sourceTemplateId: template.id,
            title: template.title,
            activityTagIds: template.activityTagIds ?? [],
            contextTagIds: template.contextTagIds ?? null,
            notes: template.notes ?? null,
          }));
        };

	        const resolveServicePrice = async (priceId: string) => {
	          const price = await ctx.services.pricesService.getPriceById(priceId, ctx.user);
	          if (!price) {
	            throw new Error(`Price not found: ${priceId}`);
	          }
	          if (price.priceType !== 'SERVICE') {
	            throw new Error(`Expected SERVICE price, got ${price.priceType}`);
	          }
	          if (!price.pricingSpec) {
	            throw new Error('Service price is missing pricingSpec');
	          }
	          const specKind = (price.pricingSpec as any).kind;
	          if (specKind !== 'UNIT' && specKind !== 'TIME') {
	            throw new Error(
	              `Unsupported pricingSpec kind for service price: ${specKind}`,
	            );
	          }
	          if (!price.pricingSpec.unitCode) {
	            throw new Error('Service price pricingSpec is missing unitCode');
	          }
	          return price;
	        };

        const warnings: string[] = [];
        let catalogPath: string | null = null;

        const ensureCatalogPath = async (): Promise<string> => {
          if (catalogPath) return catalogPath;
          const ensured =
            await ctx.services.studioFsService.ensureLogisticsServiceProducts(
              { workspaceId: materialLineItem.workspaceId },
              ctx.user,
            );
          catalogPath = ensured.catalogPath;
          return ensured.catalogPath;
        };

        const syncAddOn = async (params: {
          selection?: {
            enabled: boolean;
            priceId?: string | null;
            serviceLineItemId?: string | null;
          } | null;
          productId: 'svc_delivery' | 'svc_pickup';
        }) => {
          if (!params.selection) return null;

          const targetId = materialLineItem.id;
          const candidatesTargetingMaterial = listLogisticsLinesTargetingMaterial(
            params.productId,
          );

          const detachFromCandidate = async (candidate: LineItemModel) => {
            const currentTargets = listTargetLineItemIds(candidate);
            const nextTargets = currentTargets.filter((id) => id !== targetId);
            if (nextTargets.length === 0) {
              await ctx.services.lineItemsService.softDeleteLineItem(candidate.id, ctx.user);
              return;
            }
            await ctx.services.lineItemsService.updateLineItem(
              candidate.id,
              {
                targetSelectors: upsertTargetLineItemIds(
                  candidate.targetSelectors ?? null,
                  nextTargets,
                ),
              } as any,
              ctx.user,
            );
          };

          if (!params.selection.enabled) {
            await Promise.all(
              candidatesTargetingMaterial.map(async (candidate) =>
                detachFromCandidate(candidate),
              ),
            );
            return null;
          }

          const priceId = params.selection.priceId?.trim() || null;
          const resolvedPrice = priceId ? await resolveServicePrice(priceId) : null;

          const applyPricing = (existing: LineItemModel | null, quantityValue: string) => {
            const quantityNumber = Number(quantityValue);
            const normalizedQuantity = Number.isFinite(quantityNumber)
              ? quantityNumber
              : 1;

            if (!resolvedPrice) {
              const spec = (existing?.pricingSpecSnapshot as any) ?? null;
              const specUnitCode =
                spec && (spec.kind === 'UNIT' || spec.kind === 'TIME')
                  ? spec.unitCode
                  : null;
              return {
                pricingRef: existing?.pricingRef ?? null,
                pricingSpecSnapshot: existing?.pricingSpecSnapshot ?? null,
                unitCode: existing?.unitCode ?? specUnitCode ?? null,
                rateInCentsSnapshot: existing?.rateInCentsSnapshot ?? null,
                subtotalInCents: existing?.subtotalInCents ?? null,
              };
            }

            const rate = resolvedPrice.pricingSpec?.rateInCents ?? null;
            const subtotalInCents =
              rate !== null ? Math.round(rate * normalizedQuantity) : null;

	            return {
	              pricingRef: {
	                priceId: resolvedPrice.id,
	                priceBookId: resolvedPrice.priceBookId ?? null,
	                priceType: 'SERVICE' as const,
	              },
              pricingSpecSnapshot: resolvedPrice.pricingSpec as any,
              unitCode: resolvedPrice.pricingSpec?.unitCode ?? null,
              rateInCentsSnapshot: rate,
              subtotalInCents,
            };
          };

          const ensuredCatalogPath = await ensureCatalogPath();
          const defaultScopeTasks = await readServiceProductTaskTemplates(
            ensuredCatalogPath,
            params.productId,
          );

          const attachServiceLineItemId = params.selection.serviceLineItemId?.trim() || null;

	          if (attachServiceLineItemId) {
	            const attachCandidate =
	              documentLineItems.find((candidate) => candidate.id === attachServiceLineItemId) ??
	              null;
            if (!attachCandidate) {
              throw new Error('serviceLineItemId not found in the same document');
            }
            if (!isLogisticsServiceLineItem(attachCandidate, params.productId)) {
              throw new Error('serviceLineItemId is not a matching logistics service line item');
            }

            await Promise.all(
              candidatesTargetingMaterial
                .filter((candidate) => candidate.id !== attachCandidate.id)
                .map(async (candidate) => detachFromCandidate(candidate)),
            );

	            const currentTargets = listTargetLineItemIds(attachCandidate);
	            const nextTargets = Array.from(new Set([...currentTargets, targetId]));

	            const quantityValue = attachCandidate.quantity ?? '1';
	            const existingSharedPriceId = attachCandidate.pricingRef?.priceId ?? null;
	            const shouldApplyRequestedPrice =
	              Boolean(resolvedPrice) &&
	              (!existingSharedPriceId || existingSharedPriceId === resolvedPrice?.id);

	            if (resolvedPrice && existingSharedPriceId && existingSharedPriceId !== resolvedPrice.id) {
	              warnings.push(
	                `Ignored priceId "${resolvedPrice.id}" when attaching to shared ${params.productId} line item "${attachCandidate.id}" because it is already priced with "${existingSharedPriceId}". Edit the service line item directly to change pricing.`,
	              );
	            }

	            const updates: Partial<LineItemModel> = {
	              targetSelectors: upsertTargetLineItemIds(
	                attachCandidate.targetSelectors ?? null,
	                nextTargets,
	              ) as any,
	              ...(attachCandidate.scopeTasks && attachCandidate.scopeTasks.length > 0
	                ? {}
	                : { scopeTasks: defaultScopeTasks as any }),
	              ...(shouldApplyRequestedPrice
	                ? (applyPricing(attachCandidate, quantityValue) as any)
	                : {}),
	            };

	            const updated =
	              (await ctx.services.lineItemsService.updateLineItem(
	                attachCandidate.id,
	                updates as any,
	                ctx.user,
	              )) as LineItemModel | null;

	            const expectedStartAt =
	              params.productId === 'svc_delivery'
	                ? materialLineItem.timeWindow?.startAt ?? null
	                : materialLineItem.timeWindow?.endAt ?? null;
	            const sharedStartAt =
	              (updated ?? attachCandidate).timeWindow?.startAt ?? null;

	            if (materialLineItem.placeRef && attachCandidate.placeRef) {
	              if (
	                materialLineItem.placeRef.kind !== attachCandidate.placeRef.kind ||
	                materialLineItem.placeRef.id !== attachCandidate.placeRef.id
	              ) {
	                warnings.push(
	                  `Attached to shared ${params.productId} line item with a different placeRef`,
	                );
	              }
	            }

	            if (expectedStartAt && sharedStartAt) {
	              if (expectedStartAt.getTime() !== sharedStartAt.getTime()) {
	                warnings.push(
	                  `Attached to shared ${params.productId} line item with a different timeWindow.startAt`,
	                );
	              }
	            }

	            return updated ?? attachCandidate;
	          }

          const dedicatedCandidate =
            candidatesTargetingMaterial.find(
              (candidate) => listTargetLineItemIds(candidate).length === 1,
            ) ?? null;

          await Promise.all(
            candidatesTargetingMaterial
              .filter((candidate) => candidate.id !== dedicatedCandidate?.id)
              .map(async (candidate) => detachFromCandidate(candidate)),
          );

          const defaultTimeWindow = deriveDefaultTimeWindow(params.productId);

          const existing = dedicatedCandidate;
          const quantityValue = existing?.quantity ?? '1';
          const pricing = applyPricing(existing, quantityValue);

          const updates = {
            type: 'SERVICE' as const,
            description:
              existing?.description?.trim() ||
              `${params.productId === 'svc_delivery' ? 'Delivery' : 'Pickup'} for ${materialLineItem.description}`,
            quantity: quantityValue,
            unitCode: pricing.unitCode,
            productRef: { kind: 'SERVICE_PRODUCT' as const, productId: params.productId },
            timeWindow: existing?.timeWindow ?? defaultTimeWindow,
            placeRef: existing?.placeRef ?? materialLineItem.placeRef ?? null,
            constraints: existing?.constraints ?? null,
            inputs: existing?.inputs ?? null,
            pricingRef: pricing.pricingRef,
            pricingSpecSnapshot: pricing.pricingSpecSnapshot,
            rateInCentsSnapshot: pricing.rateInCentsSnapshot,
            subtotalInCents: pricing.subtotalInCents,
            delivery: existing?.delivery ?? null,
            deliveryChargeInCents: existing?.deliveryChargeInCents ?? null,
            customPriceName: existing?.customPriceName ?? null,
            notes: existing?.notes ?? null,
            targetSelectors: upsertTargetLineItemIds(
              existing?.targetSelectors ?? null,
              [targetId],
            ),
            sourceLineItemId: existing?.sourceLineItemId ?? materialLineItem.id,
            scopeTasks:
              existing?.scopeTasks && existing.scopeTasks.length > 0
                ? existing.scopeTasks
                : (defaultScopeTasks as any),
          };

          if (existing) {
            const updated =
              (await ctx.services.lineItemsService.updateLineItem(
                existing.id,
                updates as any,
                ctx.user,
              )) as LineItemModel | null;
            return updated ?? null;
          }

          const created =
            (await ctx.services.lineItemsService.createLineItem(
              {
                workspaceId: materialLineItem.workspaceId,
                documentRef: materialLineItem.documentRef,
                ...(updates as any),
              } as any,
              ctx.user,
            )) as LineItemModel;
          return created;
        };

        const deliveryLineItem = await syncAddOn({
          selection: input.delivery
            ? {
                enabled: input.delivery.enabled,
                priceId: input.delivery.priceId ?? null,
                serviceLineItemId: input.delivery.serviceLineItemId ?? null,
              }
            : null,
          productId: 'svc_delivery',
        });
        const pickupLineItem = await syncAddOn({
          selection: input.pickup
            ? {
                enabled: input.pickup.enabled,
                priceId: input.pickup.priceId ?? null,
                serviceLineItemId: input.pickup.serviceLineItemId ?? null,
              }
            : null,
          productId: 'svc_pickup',
        });

        const refreshedLineItems =
          (await ctx.services.lineItemsService.listLineItemsByDocumentRef(
            materialLineItem.workspaceId,
            materialLineItem.documentRef,
            ctx.user,
          )) as LineItemModel[];

        const serviceAddOns = refreshedLineItems.filter((candidate) => {
          if (
            candidate.type !== 'SERVICE' ||
            candidate.productRef?.kind !== 'SERVICE_PRODUCT'
          ) {
            return false;
          }
          const productId = candidate.productRef.productId;
          if (productId !== 'svc_delivery' && productId !== 'svc_pickup') {
            return false;
          }
          return listTargetLineItemIds(candidate).includes(materialLineItem.id);
        });

        if (materialLineItem.type === 'RENTAL' && input.delivery?.enabled && !materialLineItem.timeWindow?.startAt) {
          warnings.push('Delivery add-on enabled but material line item has no startAt timeWindow');
        }
        if (materialLineItem.type === 'RENTAL' && input.pickup?.enabled && !materialLineItem.timeWindow?.endAt) {
          warnings.push('Pickup add-on enabled but material line item has no endAt timeWindow');
        }

        return {
          materialLineItemId: materialLineItem.id,
          deliveryLineItem: deliveryLineItem ?? null,
          pickupLineItem: pickupLineItem ?? null,
          serviceAddOns,
          warnings,
        };
      },
    });

    t.nonNull.field('updateLineItem', {
      type: LineItem,
      args: {
        id: nonNull(stringArg()),
        input: nonNull(arg({ type: UpdateLineItemInput })),
      },
      resolve: async (_root, { id, input }, ctx) => {
        const updated = await ctx.services.lineItemsService.updateLineItem(
          id,
          {
            description: input.description ?? undefined,
            quantity:
              input.quantity === undefined
                ? undefined
                : normalizeLineItemQuantity(input.quantity ?? ''),
            unitCode: input.unitCode ?? undefined,
            productRef:
              input.productRef === undefined
                ? undefined
                : input.productRef === null
                  ? null
                  : {
                      kind: input.productRef.kind as any,
                      productId: input.productRef.productId,
                    },
            timeWindow: input.timeWindow
              ? {
                  startAt: input.timeWindow.startAt ?? null,
                  endAt: input.timeWindow.endAt ?? null,
                }
              : undefined,
            placeRef:
              input.placeRef === undefined
                ? undefined
                : input.placeRef
                  ? { kind: input.placeRef.kind as any, id: input.placeRef.id }
                  : null,
            constraints: mapConstraintInputs(input.constraints),
            inputs: mapLineItemInputs(input.inputs),
            pricingRef: input.pricingRef === undefined ? undefined : input.pricingRef,
            pricingSpecSnapshot:
              input.pricingSpecSnapshot === undefined
                ? undefined
                : input.pricingSpecSnapshot === null
                  ? null
                  : normalizePricingSpecSnapshotInput(
                      input.pricingSpecSnapshot as PricingSpecInputShape,
                    ),
            rateInCentsSnapshot: input.rateInCentsSnapshot ?? undefined,
            subtotalInCents: input.subtotalInCents ?? undefined,
            customPriceName:
              input.customPriceName === undefined ? undefined : input.customPriceName,
            scopeTasks:
              input.scopeTasks === undefined
                ? undefined
                : mapScopeTaskInputs(
                    input.scopeTasks as
                      | Array<ServiceScopeTaskInputShape | null>
                      | null
                      | undefined,
                  ),
            delivery: input.delivery ?? undefined,
            deliveryChargeInCents: input.deliveryChargeInCents ?? undefined,
            notes: input.notes ?? undefined,
            targetSelectors: mapTargetSelectorInputs(
              input.targetSelectors as
                | Array<LineItemTargetSelectorInputShape | null>
                | null
                | undefined,
            ),
            sourceLineItemId: input.sourceLineItemId ?? undefined,
          },
          ctx.user,
        );
        if (!updated) {
          throw new Error('Line item not found');
        }
        return updated;
      },
    });

    t.nonNull.field('deleteLineItem', {
      type: LineItem,
      args: { id: nonNull(stringArg()) },
      resolve: async (_root, { id }, ctx) => {
        const deleted = await ctx.services.lineItemsService.softDeleteLineItem(
          id,
          ctx.user,
        );
        if (!deleted) {
          throw new Error('Line item not found');
        }
        return deleted;
      },
    });
  },
});
