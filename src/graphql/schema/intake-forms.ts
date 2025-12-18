import {
  objectType,
  inputObjectType,
  mutationField,
  queryField,
  stringArg,
  booleanArg,
  arg,
  nonNull,
  enumType,
  list,
} from 'nexus';
import { GraphQLContext } from '../context';
import { IntakeFormDTO } from '../../services/intake-forms';
import { logger } from '../../lib/logger';
import { type UserDoc } from '../../services/users';

// IntakeFormSubmissionStatus Enum
export const IntakeFormSubmissionStatus = enumType({
  name: 'IntakeFormSubmissionStatus',
  members: ['DRAFT', 'SUBMITTED'],
});

// RequestType Enum
export const RequestType = enumType({
  name: 'RequestType',
  members: ['RENTAL', 'PURCHASE'],
});

// Note: DeliveryMethod enum is imported from sales-orders schema

// subset of Workspace fields for IntakeForm, to avoid leaking sensitive info
export const IntakeFormWorkspace = objectType({
  name: 'IntakeFormWorkspace',
  definition(t) {
    t.nonNull.id('id');
    t.nonNull.int('companyId');
    t.nonNull.string('name');
    t.string('bannerImageUrl');
    t.string('logoUrl');
  },
});

export const IntakeFormProject = objectType({
  name: 'IntakeFormProject',
  sourceType: {
    module: require.resolve('../../services/projects'),
    export: 'ProjectDoc',
  },
  definition(t) {
    t.nonNull.string('id', {
      resolve: (parent) => parent._id,
    });
    t.nonNull.string('name');
    t.nonNull.string('projectCode');
  },
});

// IntakeForm Type
export const IntakeForm = objectType({
  name: 'IntakeForm',
  sourceType: {
    module: require.resolve('../../services/intake-forms'),
    export: 'IntakeFormDTO',
  },
  definition(t) {
    t.nonNull.id('id');
    t.nonNull.id('workspaceId');
    t.field('workspace', {
      type: IntakeFormWorkspace,
      resolve: (form, arg, ctx) => {
        return ctx.services.workspaceService.getWorkspaceById(
          form.workspaceId,
          ctx.systemUser,
        );
      },
    });
    t.id('projectId');
    t.field('project', {
      type: IntakeFormProject,
      resolve: async (form, arg, ctx) => {
        if (!form.projectId) {
          return null;
        }

        return ctx.services.projectsService.getProjectById(
          form.projectId,
          ctx.systemUser,
        );
      },
    });
    t.id('pricebookId');
    t.field('pricebook', {
      type: 'PriceBook',
      resolve: async (form, arg, ctx) => {
        if (!form.pricebookId) {
          return null;
        }

        return ctx.services.pricesService.getPriceBookById(
          form.pricebookId,
          ctx.user,
        );
      },
    });
    t.nonNull.boolean('isPublic', {
      resolve: (form) => form.isPublic ?? false,
    });
    t.nonNull.list.nonNull.id('sharedWithUserIds', {
      resolve: (form) => form.sharedWithUserIds ?? [],
    });
    t.nonNull.list.field('sharedWithUsers', {
      type: 'User',
      resolve: async (form, arg, ctx) => {
        const userIds = form.sharedWithUserIds ?? [];
        if (userIds.length === 0) {
          return [];
        }

        return ctx.services.usersService.batchGetUsersById(userIds, ctx.user);
      },
    });
    t.nonNull.boolean('isActive', {
      resolve: (form) => form.isActive ?? true,
    });
    t.nonNull.boolean('isDeleted', {
      resolve: (form) => form.isDeleted ?? false,
    });
    t.nonNull.field('createdAt', { type: 'DateTime' });
    t.nonNull.string('createdBy');
    t.nonNull.field('updatedAt', { type: 'DateTime' });
    t.nonNull.string('updatedBy');
  },
});

// IntakeFormLineItem Type
export const IntakeFormLineItem = objectType({
  name: 'IntakeFormLineItem',
  sourceType: {
    module: require.resolve('../../services/intake-forms'),
    export: 'IntakeFormSubmissionLineItemDTO',
  },
  definition(t) {
    t.nonNull.id('id');
    t.nonNull.field('startDate', { type: 'DateTime' });
    t.nonNull.string('description');
    t.nonNull.int('quantity');
    t.nonNull.int('durationInDays');
    t.nonNull.field('type', { type: 'RequestType' });

    // new fields
    t.nonNull.string('pimCategoryId');
    t.field('pimCategory', {
      type: 'PimCategory',
      resolve: (lineItem, _, ctx) => {
        return ctx.dataloaders.pimCategories.getPimCategoriesById.load(
          lineItem.pimCategoryId,
        );
      },
    });
    t.string('priceId');
    t.field('price', {
      type: 'Price',
      resolve: (lineItem, _, ctx) => {
        if (!lineItem.priceId) {
          return null;
        }

        return ctx.dataloaders.prices.getPriceById.load(lineItem.priceId);
      },
    });
    t.field('priceForecast', {
      type: 'LineItemPriceForecast',
      resolve: (lineItem, _, ctx) => {
        // Return null for PURCHASE type (forecast only applies to rentals)
        if (lineItem.type !== 'RENTAL') {
          return null;
        }

        // Return null if no priceId (custom price)
        if (!lineItem.priceId) {
          return null;
        }

        return ctx.dataloaders.prices.getPriceForecast.load({
          priceId: lineItem.priceId,
          durationInDays: lineItem.durationInDays,
        });
      },
    });
    t.string('customPriceName');
    t.nonNull.field('deliveryMethod', { type: 'DeliveryMethod' });
    t.string('deliveryLocation');
    t.string('deliveryNotes');

    // rental fields
    t.field('rentalStartDate', {
      type: 'DateTime',
      resolve: (lineItem) => lineItem.rentalStartDate || null,
    });
    t.field('rentalEndDate', {
      type: 'DateTime',
      resolve: (lineItem) => lineItem.rentalEndDate || null,
    });

    // tracking if this line item has been converted to a sales order
    t.string('salesOrderId');
    t.field('salesOrderLineItem', {
      type: 'SalesOrderLineItem',
      resolve: (lineItem, _, ctx) => {
        return ctx.dataloaders.salesOrders.getSalesOrderLineItemByIntakeFormSubmissionLineItemId.load(
          lineItem.id,
        );
      },
    });

    // pricing
    t.nonNull.int('subtotalInCents');

    t.string('fulfilmentId', {
      resolve: async (lineItem, args, ctx) => {
        const salesOrderLineItem =
          await ctx.dataloaders.salesOrders.getSalesOrderLineItemByIntakeFormSubmissionLineItemId.load(
            lineItem.id,
          );

        if (!salesOrderLineItem) {
          return null;
        }

        const fulfilment =
          await ctx.services.fulfilmentService.getFulfilmentBySalesOrderLineItemId(
            salesOrderLineItem._id,
            ctx.systemUser,
          );

        if (!fulfilment) {
          return null;
        }

        return fulfilment.id;
      },
    });
    t.list.nonNull.field('inventoryReservations', {
      type: 'InventoryReservation',
      resolve: async (lineItem, _, ctx) => {
        const salesOrderLineItem =
          await ctx.dataloaders.salesOrders.getSalesOrderLineItemByIntakeFormSubmissionLineItemId.load(
            lineItem.id,
          );

        if (!salesOrderLineItem) {
          return null;
        }

        // performing these actions as a system user

        const fulfilment =
          await ctx.services.fulfilmentService.getFulfilmentBySalesOrderLineItemId(
            salesOrderLineItem._id,
            ctx.systemUser,
          );

        if (!fulfilment) {
          return null;
        }

        return ctx.services.inventoryService.listInventoryReservations(
          {
            filter: {
              fulfilmentId: fulfilment.id,
            },
          },
          ctx.systemUser,
        );
      },
    });
  },
});

export const SubmissionSalesOrder = objectType({
  name: 'SubmissionSalesOrder',
  sourceType: {
    export: 'SalesOrderDoc',
    module: require.resolve('../../services/sales_orders'),
  },
  definition(t) {
    t.nonNull.string('id', { resolve: (parent) => parent._id });
    t.nonNull.field('status', {
      type: 'SalesOrderStatus',
      description: 'Status of the sales order',
    });
    t.string('workspace_id');
    t.string('purchase_order_number');
    t.nonNull.string('sales_order_number');
    t.nonNull.string('created_at');
    t.nonNull.string('updated_at');
    t.field('deleted_at', {
      type: 'DateTime',
    });
    t.string('project_id');
    t.field('project', {
      type: 'IntakeFormProject',
      resolve: (parent, _, ctx) => {
        if (!parent.project_id) return null;
        return ctx.dataloaders.projects.getProjectsById.load(parent.project_id);
      },
    });
  },
});

// IntakeFormSubmission Type
export const IntakeFormSubmission = objectType({
  name: 'IntakeFormSubmission',
  sourceType: {
    module: require.resolve('../../services/intake-forms'),
    export: 'IntakeFormSubmissionDTO',
  },
  definition(t) {
    t.nonNull.id('id');
    t.string('userId');
    t.nonNull.id('formId');
    t.field('form', {
      type: 'IntakeForm',
      resolve: async (submission, _, ctx) => {
        return ctx.services.intakeFormService.getIntakeFormById(
          submission.formId,
          ctx.systemUser,
        );
      },
    });
    t.nonNull.id('workspaceId');
    t.string('buyerWorkspaceId');
    t.field('buyerWorkspace', {
      type: IntakeFormWorkspace,
      resolve: async (submission, _, ctx) => {
        if (!submission.buyerWorkspaceId) {
          return null;
        }
        return ctx.services.workspaceService.getWorkspaceById(
          submission.buyerWorkspaceId,
          ctx.systemUser,
        );
      },
    });
    t.string('name');
    t.string('email');
    t.nonNull.field('createdAt', { type: 'DateTime' });
    t.string('phone');
    t.string('companyName');
    t.string('purchaseOrderNumber');
    t.field('salesOrder', {
      type: SubmissionSalesOrder,
      resolve: (submission, _, ctx) => {
        return ctx.dataloaders.salesOrders.getSalesOrderByIntakeFormSubmissionId.load(
          submission.id,
        );
      },
    });
    t.string('purchaseOrderId');
    t.nonNull.field('status', { type: 'IntakeFormSubmissionStatus' });
    t.field('submittedAt', { type: 'DateTime' });

    // pricing
    t.nonNull.int('totalInCents');

    t.list.nonNull.field('lineItems', {
      type: 'IntakeFormLineItem',
      resolve: async (submission, _, ctx) => {
        // Use DataLoader to batch fetch line items and prevent N+1 queries
        return ctx.dataloaders.intakeForms.getLineItemsBySubmissionId.load(
          submission.id,
        );
      },
    });

    t.field('quote', {
      type: 'Quote',
      description: 'The quote generated from this intake form submission',
      resolve: (submission, _, ctx) => {
        return ctx.dataloaders.quotes.getQuoteByIntakeFormSubmissionId.load(
          submission.id,
        );
      },
    });
  },
});

// Page Info Type for pagination
export const IntakeFormPage = objectType({
  name: 'IntakeFormPage',
  definition(t) {
    t.nonNull.list.nonNull.field('items', { type: 'IntakeForm' });
    t.nonNull.field('page', {
      type: objectType({
        name: 'IntakeFormPageInfo',
        definition(t) {
          t.nonNull.int('number');
          t.nonNull.int('size');
          t.nonNull.int('totalItems');
          t.nonNull.int('totalPages');
        },
      }),
    });
  },
});

export const IntakeFormSubmissionPage = objectType({
  name: 'IntakeFormSubmissionPage',
  definition(t) {
    t.nonNull.list.nonNull.field('items', { type: 'IntakeFormSubmission' });
    t.nonNull.field('page', {
      type: objectType({
        name: 'IntakeFormSubmissionPageInfo',
        definition(t) {
          t.nonNull.int('number');
          t.nonNull.int('size');
          t.nonNull.int('totalItems');
          t.nonNull.int('totalPages');
        },
      }),
    });
  },
});

// Input Types
export const IntakeFormInput = inputObjectType({
  name: 'IntakeFormInput',
  definition(t) {
    t.nonNull.id('workspaceId');
    t.id('projectId');
    t.nonNull.boolean('isActive');
    t.id('pricebookId');
    t.boolean('isPublic');
    t.list.nonNull.string('sharedWithEmails');
  },
});

export const UpdateIntakeFormInput = inputObjectType({
  name: 'UpdateIntakeFormInput',
  definition(t) {
    t.id('projectId');
    t.id('pricebookId');
    t.boolean('isPublic');
    t.list.nonNull.string('sharedWithEmails');
    t.boolean('isActive');
  },
});

export const IntakeFormLineItemInput = inputObjectType({
  name: 'IntakeFormLineItemInput',
  definition(t) {
    t.id('id');
    t.nonNull.field('startDate', { type: 'DateTime' });
    t.nonNull.string('description');
    t.nonNull.int('quantity');
    t.nonNull.int('durationInDays');
    t.nonNull.field('type', { type: 'RequestType' });

    // new fields
    t.nonNull.string('pimCategoryId');
    t.string('priceId');
    t.string('customPriceName');
    t.nonNull.field('deliveryMethod', { type: 'DeliveryMethod' });
    t.string('deliveryLocation');
    t.string('deliveryNotes');

    // rental fields
    t.field('rentalStartDate', { type: 'DateTime' });
    t.field('rentalEndDate', { type: 'DateTime' });

    // tracking fields (for updates)
    t.string('salesOrderId');
    t.string('salesOrderLineItemId');
  },
});

export const IntakeFormSubmissionInput = inputObjectType({
  name: 'IntakeFormSubmissionInput',
  definition(t) {
    t.string('userId');
    t.nonNull.id('formId');
    t.nonNull.id('workspaceId');
    t.string('buyerWorkspaceId');
    t.string('name');
    t.string('email');
    t.string('phone');
    t.string('companyName');
    t.string('purchaseOrderNumber');
    // Line items are now managed separately through their own CRUD operations
  },
});

export const UpdateIntakeFormSubmissionInput = inputObjectType({
  name: 'UpdateIntakeFormSubmissionInput',
  definition(t) {
    t.string('userId');
    t.string('buyerWorkspaceId');
    t.string('name');
    t.string('email');
    t.string('phone');
    t.string('companyName');
    t.string('purchaseOrderNumber');
    t.string('salesOrderId');
    t.string('purchaseOrderId');
    // Line items are now managed separately through their own CRUD operations
  },
});

// Queries
export const getIntakeFormById = queryField('getIntakeFormById', {
  type: 'IntakeForm',
  args: {
    id: nonNull(stringArg()),
  },
  description: 'Get a single intake form by ID',
  async resolve(_, { id }, ctx) {
    return ctx.services.intakeFormService.getIntakeFormById(id, ctx.user);
  },
});

export const getIntakeFormSubmissionById = queryField(
  'getIntakeFormSubmissionById',
  {
    type: 'IntakeFormSubmission',
    args: {
      id: nonNull(stringArg()),
    },
    description: 'Get a single intake form submission by ID',
    async resolve(_, { id }, ctx) {
      return ctx.services.intakeFormService.getIntakeFormSubmissionById(
        id,
        ctx.user,
      );
    },
  },
);

export const getIntakeFormSubmissionLineItem = queryField(
  'getIntakeFormSubmissionLineItem',
  {
    type: 'IntakeFormLineItem',
    args: {
      id: nonNull(stringArg()),
    },
    description: 'Get a single intake form submission line item by ID',
    async resolve(_, { id }, ctx) {
      return ctx.services.intakeFormService.getLineItemById(id, ctx.user);
    },
  },
);

export const listIntakeFormSubmissionLineItems = queryField(
  'listIntakeFormSubmissionLineItems',
  {
    type: nonNull(list(nonNull('IntakeFormLineItem'))),
    args: {
      submissionId: nonNull(stringArg()),
    },
    description: 'List all line items for an intake form submission',
    async resolve(_, { submissionId }, ctx) {
      return ctx.services.intakeFormService.getLineItemsBySubmissionId(
        submissionId,
        ctx.user,
      );
    },
  },
);

export const listIntakeForms = queryField('listIntakeForms', {
  type: 'IntakeFormPage',
  args: {
    workspaceId: nonNull(stringArg()),
    page: arg({ type: 'Int' }),
    limit: arg({ type: 'Int' }),
  },
  description: 'List all intake forms for a workspace with pagination',
  async resolve(_, { workspaceId, page, limit }, ctx) {
    return ctx.services.intakeFormService.listIntakeForms(
      {
        pagination: { page: page || undefined, limit: limit || undefined },
        query: {
          workspaceId,
        },
      },
      ctx.user,
    );
  },
});

export const listIntakeFormsForUser = queryField('listIntakeFormsForUser', {
  type: 'IntakeFormPage',
  args: {
    page: arg({ type: 'Int' }),
    limit: arg({ type: 'Int' }),
  },
  description:
    'List all intake forms that a user has access to with pagination',
  async resolve(_, { page, limit }, ctx) {
    return ctx.services.intakeFormService.listIntakeFormsForUser(
      {
        pagination: { page: page || undefined, limit: limit || undefined },
      },
      ctx.user,
    );
  },
});

export const listIntakeFormSubmissions = queryField(
  'listIntakeFormSubmissions',
  {
    type: 'IntakeFormSubmissionPage',
    args: {
      workspaceId: nonNull(stringArg()),
      intakeFormId: stringArg(),
      excludeWithSalesOrder: booleanArg(),
      page: arg({ type: 'Int' }),
      limit: arg({ type: 'Int' }),
    },
    description:
      'List all intake form submissions for a workspace with pagination',
    async resolve(
      _,
      { workspaceId, intakeFormId, excludeWithSalesOrder, page, limit },
      ctx,
    ) {
      return ctx.services.intakeFormService.listIntakeFormSubmissions(
        {
          query: {
            workspaceId,
            intakeFormId: intakeFormId || undefined,
            excludeWithSalesOrder: excludeWithSalesOrder || undefined,
          },
          pagination: { page: page || undefined, limit: limit || undefined },
        },
        ctx.user,
      );
    },
  },
);

export const listIntakeFormSubmissionsAsBuyer = queryField(
  'listIntakeFormSubmissionsAsBuyer',
  {
    type: 'IntakeFormSubmissionPage',
    args: {
      buyerWorkspaceId: nonNull(stringArg()),
      intakeFormId: stringArg(),
      page: arg({ type: 'Int' }),
      limit: arg({ type: 'Int' }),
    },
    description:
      'List all intake form submissions for a buyer workspace with pagination',
    async resolve(_, { buyerWorkspaceId, intakeFormId, page, limit }, ctx) {
      return ctx.services.intakeFormService.listIntakeFormSubmissionsAsBuyer(
        {
          query: {
            buyerWorkspaceId,
            intakeFormId: intakeFormId || undefined,
          },
          pagination: { page: page || undefined, limit: limit || undefined },
        },
        ctx.user,
      );
    },
  },
);

export const getIntakeFormSubmissionBySalesOrderId = queryField(
  'getIntakeFormSubmissionBySalesOrderId',
  {
    type: 'IntakeFormSubmission',
    args: {
      salesOrderId: nonNull(stringArg()),
    },
    description: 'Get an intake form submission by sales order ID',
    async resolve(_, { salesOrderId }, ctx) {
      return ctx.services.intakeFormService.getIntakeFormSubmissionBySalesOrderId(
        salesOrderId,
        ctx.user,
      );
    },
  },
);

export const getIntakeFormSubmissionByPurchaseOrderId = queryField(
  'getIntakeFormSubmissionByPurchaseOrderId',
  {
    type: 'IntakeFormSubmission',
    args: {
      purchaseOrderId: nonNull(stringArg()),
    },
    description: 'Get an intake form submission by purchase order ID',
    async resolve(_, { purchaseOrderId }, ctx) {
      return ctx.services.intakeFormService.getIntakeFormSubmissionByPurchaseOrderId(
        purchaseOrderId,
        ctx.user,
      );
    },
  },
);

export const listMyOrphanedSubmissions = queryField(
  'listMyOrphanedSubmissions',
  {
    type: nonNull(list(nonNull('IntakeFormSubmission'))),
    description:
      'List intake form submissions created by the authenticated user that have no buyer workspace assigned.',
    async resolve(_, __, ctx) {
      return ctx.services.intakeFormService.listOrphanedSubmissions(ctx.user);
    },
  },
);

async function sendIntakeFormInvitationEmails(
  opts: {
    emails: string[];
    form: IntakeFormDTO;
  },
  ctx: GraphQLContext,
) {
  const { emails, form } = opts;
  try {
    const workspace = await ctx.services.workspaceService.getWorkspaceById(
      form.workspaceId,
      ctx.systemUser,
    );
    const project = form.projectId
      ? await ctx.services.projectsService.getProjectById(
          form.projectId,
          ctx.systemUser,
        )
      : null;

    const label = project ? `${project?.name}` : `${workspace?.name}`;
    const url = ctx.envConfig.ERP_CLIENT_URL;

    logger.info(
      { emails, form },
      'Attempting to send intake form invitation emails',
    );

    const emailPromises = emails.map((to: string) => {
      return ctx.services.emailService.sendTemplatedEmail({
        to,
        from: 'noreply@equipmentshare.com',
        subject: `You've been invited to submit equipment requests for ${label}`,
        title: `Rental Request Form`,
        content: `You can now submit your equipment requests online! This is a quick and easy way to get the equipment you need for your project.`,
        primaryCTA: {
          text: 'Create Request',
          url: `${url}/intake-form/${form.id}`,
        },
        bannerImgUrl: workspace?.bannerImageUrl,
        iconUrl: workspace?.logoUrl,
        workspaceId: form.workspaceId,
        user: ctx.user,
      });
    });

    await Promise.all(emailPromises);
  } catch (err) {
    logger.error(
      { err, emails, form },
      `Error sending intake form:${form.id} invitation emails`,
    );
  }
}

// Mutations
export const createIntakeForm = mutationField('createIntakeForm', {
  type: 'IntakeForm',
  args: {
    input: nonNull(arg({ type: 'IntakeFormInput' })),
  },
  description: 'Create a new intake form',
  async resolve(_, { input }, ctx) {
    let invitedUserIds: Array<string> = [];
    if (input.sharedWithEmails?.length) {
      const users = await ctx.services.usersService.upsertUsersByEmail(
        input.sharedWithEmails,
      );
      invitedUserIds = users.map((u: any) => u._id);
    }

    const result = await ctx.services.intakeFormService.createIntakeForm(
      {
        ...input,
        projectId: input.projectId || undefined,
        pricebookId: input.pricebookId || undefined,
        isPublic: input.isPublic ?? false,
        sharedWithUserIds: invitedUserIds,
      },
      ctx.user,
    );

    logger.info(
      { form: result, sharedWithEmails: input.sharedWithEmails },
      'Intake form created',
    );

    if (input.sharedWithEmails?.length) {
      await sendIntakeFormInvitationEmails(
        {
          emails: input.sharedWithEmails,
          form: result,
        },
        ctx,
      );
    }

    return result;
  },
});

export const createIntakeFormSubmission = mutationField(
  'createIntakeFormSubmission',
  {
    type: 'IntakeFormSubmission',
    args: {
      input: nonNull(arg({ type: 'IntakeFormSubmissionInput' })),
    },
    description: 'Create a new intake form submission',
    async resolve(_, { input }, ctx) {
      // Note: Form submissions might be allowed without authentication
      // depending on business requirements (public forms)
      const now = new Date().toISOString();

      const submissionInput = {
        ...input,
        userId: input.userId || undefined,
        createdAt: now,
        name: input.name || undefined,
        email: input.email || undefined,
        phone: input.phone || undefined,
        companyName: input.companyName || undefined,
        purchaseOrderNumber: input.purchaseOrderNumber || undefined,
        buyerWorkspaceId: input.buyerWorkspaceId || undefined,
      };

      return ctx.services.intakeFormService.createIntakeFormSubmission(
        submissionInput,
        ctx.user,
      );
    },
  },
);

export const updateIntakeForm = mutationField('updateIntakeForm', {
  type: 'IntakeForm',
  args: {
    id: nonNull(stringArg()),
    input: nonNull(arg({ type: 'UpdateIntakeFormInput' })),
  },
  description: 'Update an existing intake form',
  async resolve(_, { id, input }, ctx) {
    // Handle email to user ID conversion if sharedWithEmails is provided
    let sharedWithUserIds: string[] | undefined;
    let sharedWithUsers: UserDoc[] = [];
    if (
      input.sharedWithEmails !== undefined &&
      input.sharedWithEmails !== null
    ) {
      if (input.sharedWithEmails.length > 0) {
        sharedWithUsers = await ctx.services.usersService.upsertUsersByEmail(
          input.sharedWithEmails,
        );
        sharedWithUserIds = sharedWithUsers.map((u: any) => u._id);
      } else {
        // Empty array means clear all shared users
        sharedWithUserIds = [];
      }
    }

    const previousForm = await ctx.services.intakeFormService.getIntakeFormById(
      id,
      ctx.user,
    );
    if (!previousForm) {
      throw new Error('Intake form not found');
    }

    const result = await ctx.services.intakeFormService.updateIntakeForm(
      id,
      {
        projectId:
          input.projectId !== undefined ? input.projectId || null : undefined,
        pricebookId:
          input.pricebookId !== undefined
            ? input.pricebookId || null
            : undefined,
        isPublic:
          input.isPublic !== undefined && input.isPublic !== null
            ? input.isPublic
            : undefined,
        sharedWithUserIds,
        isActive:
          input.isActive !== undefined && input.isActive !== null
            ? input.isActive
            : undefined,
      },
      ctx.user,
    );

    if (sharedWithUserIds && sharedWithUserIds.length > 0) {
      // find the diff between previousForm.sharedWithUserIds and sharedWithUserIds
      const newlyAddedUserEmails = sharedWithUserIds
        .filter((id) => !previousForm.sharedWithUserIds.includes(id))
        .map((id) => sharedWithUsers.find((user) => user._id === id)?.email)
        .filter((email): email is string => !!email);

      if (newlyAddedUserEmails.length) {
        await sendIntakeFormInvitationEmails(
          {
            emails: newlyAddedUserEmails,
            form: result,
          },
          ctx,
        );
      }
    }

    return result;
  },
});

export const setIntakeFormActive = mutationField('setIntakeFormActive', {
  type: 'IntakeForm',
  args: {
    id: nonNull(stringArg()),
    isActive: nonNull(booleanArg()),
  },
  description: 'Set the active status of an intake form',
  async resolve(_, { id, isActive }, ctx) {
    return ctx.services.intakeFormService.setIntakeFormActive(
      id,
      isActive,
      ctx.user,
    );
  },
});

export const deleteIntakeForm = mutationField('deleteIntakeForm', {
  type: 'IntakeForm',
  args: {
    id: nonNull(stringArg()),
  },
  description: 'Soft delete an intake form',
  async resolve(_, { id }, ctx) {
    return ctx.services.intakeFormService.deleteIntakeForm(id, ctx.user);
  },
});

export const updateIntakeFormSubmission = mutationField(
  'updateIntakeFormSubmission',
  {
    type: 'IntakeFormSubmission',
    args: {
      id: nonNull(stringArg()),
      input: nonNull(arg({ type: 'UpdateIntakeFormSubmissionInput' })),
    },
    description: 'Update an existing intake form submission',
    async resolve(_, { id, input }, ctx) {
      const updateData: any = {};

      if (input.userId !== undefined) {
        updateData.userId = input.userId || undefined;
      }
      if (input.name !== undefined) {
        updateData.name = input.name || undefined;
      }
      if (input.email !== undefined) {
        updateData.email = input.email || undefined;
      }
      if (input.phone !== undefined) {
        updateData.phone = input.phone || undefined;
      }
      if (input.companyName !== undefined) {
        updateData.companyName = input.companyName || undefined;
      }
      if (input.purchaseOrderNumber !== undefined) {
        updateData.purchaseOrderNumber = input.purchaseOrderNumber || undefined;
      }
      if (input.salesOrderId !== undefined) {
        updateData.salesOrderId = input.salesOrderId || undefined;
      }
      if (input.purchaseOrderId !== undefined) {
        updateData.purchaseOrderId = input.purchaseOrderId || undefined;
      }
      if (input.buyerWorkspaceId !== undefined) {
        updateData.buyerWorkspaceId = input.buyerWorkspaceId || undefined;
      }
      // Line items are now managed separately through their own CRUD operations

      return ctx.services.intakeFormService.updateIntakeFormSubmission(
        id,
        updateData,
        ctx.user,
      );
    },
  },
);

// AdoptOrphanedSubmissionsResult Type
export const AdoptOrphanedSubmissionsResult = objectType({
  name: 'AdoptOrphanedSubmissionsResult',
  definition(t) {
    t.nonNull.int('adoptedCount', {
      description: 'Number of submissions that were adopted',
    });
    t.nonNull.list.nonNull.id('adoptedSubmissionIds', {
      description: 'List of adopted submission IDs',
    });
    t.nonNull.list.nonNull.field('adoptedSubmissions', {
      type: 'IntakeFormSubmission',
      description: 'The submissions that were adopted (with full details)',
    });
  },
});

export const adoptOrphanedSubmissions = mutationField(
  'adoptOrphanedSubmissions',
  {
    type: nonNull('AdoptOrphanedSubmissionsResult'),
    args: {
      workspaceId: nonNull(stringArg()),
      submissionIds: arg({ type: list(nonNull('ID')) }),
    },
    description:
      'Adopt orphaned intake form submissions (with null buyerWorkspaceId) to the specified workspace. ' +
      'Only submissions created by the authenticated user will be adopted. ' +
      'If submissionIds is provided with items, only those specific submissions will be adopted. ' +
      'If submissionIds is omitted or empty, all orphaned submissions will be adopted. Idempotent.',
    async resolve(_, { workspaceId, submissionIds }, ctx) {
      return ctx.services.intakeFormService.adoptOrphanedSubmissions(
        workspaceId,
        ctx.user,
        submissionIds ?? undefined,
      );
    },
  },
);

export const createIntakeFormSubmissionLineItem = mutationField(
  'createIntakeFormSubmissionLineItem',
  {
    type: 'IntakeFormLineItem',
    args: {
      submissionId: nonNull(stringArg()),
      input: nonNull(arg({ type: 'IntakeFormLineItemInput' })),
    },
    description: 'Create a new line item for an intake form submission',
    async resolve(_, { submissionId, input }, ctx) {
      return ctx.services.intakeFormService.createLineItem(
        submissionId,
        {
          startDate: new Date(input.startDate),
          description: input.description,
          quantity: input.quantity,
          durationInDays: input.durationInDays,
          type: input.type,
          pimCategoryId: input.pimCategoryId,
          deliveryMethod: input.deliveryMethod,
          priceId: input.priceId || undefined,
          customPriceName: input.customPriceName || undefined,
          deliveryLocation: input.deliveryLocation || undefined,
          deliveryNotes: input.deliveryNotes || undefined,
          rentalStartDate: input.rentalStartDate
            ? new Date(input.rentalStartDate)
            : undefined,
          rentalEndDate: input.rentalEndDate
            ? new Date(input.rentalEndDate)
            : undefined,
          salesOrderId: input.salesOrderId || undefined,
          salesOrderLineItemId: input.salesOrderLineItemId || undefined,
        },
        ctx.user,
      );
    },
  },
);

export const updateIntakeFormSubmissionLineItem = mutationField(
  'updateIntakeFormSubmissionLineItem',
  {
    type: 'IntakeFormLineItem',
    args: {
      id: nonNull(stringArg()),
      input: nonNull(arg({ type: 'IntakeFormLineItemInput' })),
    },
    description: 'Update an existing intake form submission line item',
    async resolve(_, { id, input }, ctx) {
      const updates: any = {};

      if (input.startDate !== undefined) {
        updates.startDate = new Date(input.startDate);
      }
      if (input.description !== undefined) {
        updates.description = input.description;
      }
      if (input.quantity !== undefined) {
        updates.quantity = input.quantity;
      }
      if (input.durationInDays !== undefined) {
        updates.durationInDays = input.durationInDays;
      }
      if (input.type !== undefined) {
        updates.type = input.type;
      }
      if (input.pimCategoryId !== undefined) {
        updates.pimCategoryId = input.pimCategoryId;
      }
      if (input.deliveryMethod !== undefined) {
        updates.deliveryMethod = input.deliveryMethod;
      }
      if (input.priceId !== undefined) {
        updates.priceId = input.priceId || undefined;
      }
      if (input.customPriceName !== undefined) {
        updates.customPriceName = input.customPriceName || undefined;
      }
      if (input.deliveryLocation !== undefined) {
        updates.deliveryLocation = input.deliveryLocation || undefined;
      }
      if (input.deliveryNotes !== undefined) {
        updates.deliveryNotes = input.deliveryNotes || undefined;
      }
      if (input.rentalStartDate !== undefined) {
        updates.rentalStartDate = input.rentalStartDate
          ? new Date(input.rentalStartDate)
          : undefined;
      }
      if (input.rentalEndDate !== undefined) {
        updates.rentalEndDate = input.rentalEndDate
          ? new Date(input.rentalEndDate)
          : undefined;
      }
      if (input.salesOrderId !== undefined) {
        updates.salesOrderId = input.salesOrderId || undefined;
      }
      if (input.salesOrderLineItemId !== undefined) {
        updates.salesOrderLineItemId = input.salesOrderLineItemId || undefined;
      }

      return ctx.services.intakeFormService.updateLineItem(
        id,
        updates,
        ctx.user,
      );
    },
  },
);

export const deleteIntakeFormSubmissionLineItem = mutationField(
  'deleteIntakeFormSubmissionLineItem',
  {
    type: 'Boolean',
    args: {
      id: nonNull(stringArg()),
    },
    description: 'Delete an intake form submission line item',
    async resolve(_, { id }, ctx) {
      return ctx.services.intakeFormService.deleteLineItem(id, ctx.user);
    },
  },
);

export const submitIntakeFormSubmission = mutationField(
  'submitIntakeFormSubmission',
  {
    type: 'IntakeFormSubmission',
    args: {
      id: nonNull(stringArg()),
    },
    description:
      'Submit an intake form submission (changes status from DRAFT to SUBMITTED)',
    async resolve(_, { id }, ctx) {
      return ctx.services.intakeFormService.submitIntakeFormSubmission(
        id,
        ctx.user,
      );
    },
  },
);
