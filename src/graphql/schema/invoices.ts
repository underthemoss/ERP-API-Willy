import {
  objectType,
  inputObjectType,
  enumType,
  nonNull,
  arg,
  extendType,
} from 'nexus';
import { GraphQLContext } from '../context';

export const InvoiceStatus = enumType({
  name: 'InvoiceStatus',
  members: ['DRAFT', 'SENT', 'PAID', 'CANCELLED'],
});

export const TaxType = enumType({
  name: 'TaxType',
  members: ['PERCENTAGE', 'FIXED_AMOUNT'],
});

export const TaxLineItem = objectType({
  name: 'TaxLineItem',
  sourceType: {
    module: require.resolve('../../services/invoices/model'),
    export: 'TaxLineItem',
  },
  definition(t) {
    t.nonNull.id('id');
    t.nonNull.string('description');
    t.nonNull.field('type', { type: TaxType });
    t.nonNull.float('value');
    t.int('calculatedAmountInCents', {
      resolve: (taxLineItem) =>
        Math.round(taxLineItem.calculatedAmountInCents || 0),
    });
    t.nonNull.int('order');
  },
});

export const Invoice = objectType({
  name: 'Invoice',
  sourceType: {
    module: require.resolve('../../services/invoices/model'),
    export: 'Invoice',
  },
  definition(t) {
    t.nonNull.string('id');
    t.nonNull.string('workspaceId');
    t.nonNull.string('sellerId');
    t.nonNull.string('buyerId');
    t.nonNull.string('companyId');
    t.nonNull.string('invoiceNumber');
    t.nonNull.field('createdAt', { type: 'DateTime' });
    t.nonNull.field('updatedAt', { type: 'DateTime' });
    t.string('createdBy');
    t.string('updatedBy');
    t.nonNull.int('subTotalInCents');
    t.nonNull.int('taxesInCents', {
      resolve: (invoice) => Math.round(invoice.totalTaxesInCents || 0),
      deprecation: 'Use totalTaxesInCents',
    });
    t.nonNull.int('totalTaxesInCents', {
      resolve: (invoice) => Math.round(invoice.totalTaxesInCents || 0),
    });
    t.nonNull.int('finalSumInCents');
    t.nonNull.float('taxPercent', {
      deprecation: 'Use tax line items to see tax info',
      resolve: (invoice) => 0, // Always return 0 for deprecated field
    });
    t.nonNull.field('status', { type: InvoiceStatus });
    t.field('invoiceSentDate', { type: 'DateTime' });
    t.field('invoicePaidDate', { type: 'DateTime' });

    t.nonNull.list.nonNull.field('taxLineItems', {
      type: TaxLineItem,
      resolve: (invoice) => invoice.taxLineItems || [],
    });

    // Dataloader-resolved fields
    t.field('seller', {
      type: 'Contact',
      async resolve(invoice, _args, ctx) {
        if (!invoice.sellerId) return null;
        return ctx.dataloaders.contacts.getContactsById.load(invoice.sellerId);
      },
    });
    t.field('buyer', {
      type: 'Contact',
      async resolve(invoice, _args, ctx) {
        if (!invoice.buyerId) return null;
        return ctx.dataloaders.contacts.getContactsById.load(invoice.buyerId);
      },
    });
    t.field('createdByUser', {
      type: 'User',
      async resolve(invoice, _args, ctx) {
        if (!invoice.createdBy) return null;
        return ctx.dataloaders.users.getUsersById.load(invoice.createdBy);
      },
    });
    t.field('updatedByUser', {
      type: 'User',
      async resolve(invoice, _args, ctx) {
        if (!invoice.updatedBy) return null;
        return ctx.dataloaders.users.getUsersById.load(invoice.updatedBy);
      },
    });

    t.nonNull.list.nonNull.field('lineItems', {
      type: objectType({
        name: 'InvoiceLineItem',
        definition(t) {
          t.nonNull.id('chargeId');
          t.nonNull.string('description');
          t.nonNull.int('totalInCents');
          t.field('charge', {
            type: 'Charge',
            async resolve(lineItem, _args, ctx) {
              if (!lineItem.chargeId) return null;
              return ctx.dataloaders.charges.getChargesById.load(
                lineItem.chargeId,
              );
            },
          });
        },
      }),
      resolve(invoice) {
        return invoice.lineItems || [];
      },
    });
  },
});

export const ListInvoicesFilter = inputObjectType({
  name: 'ListInvoicesFilter',
  definition(t) {
    t.nonNull.string('workspaceId');
    t.string('companyId');
    t.field('status', { type: InvoiceStatus });
  },
});

export const ListInvoicesPage = inputObjectType({
  name: 'ListInvoicesPage',
  definition(t) {
    t.int('size');
    t.int('number');
  },
});

export const ListInvoicesQuery = inputObjectType({
  name: 'ListInvoicesQuery',
  definition(t) {
    t.nonNull.field('filter', { type: ListInvoicesFilter });
    t.field('page', { type: ListInvoicesPage });
  },
});

export const InvoicesResponse = objectType({
  name: 'InvoicesResponse',
  definition(t) {
    t.nonNull.list.nonNull.field('items', { type: Invoice });
  },
});

export const InvoicesQuery = extendType({
  type: 'Query',
  definition(t) {
    t.field('listInvoices', {
      type: nonNull(InvoicesResponse),
      args: {
        query: arg({ type: ListInvoicesQuery }),
      },
      async resolve(_root, { query }, ctx: GraphQLContext) {
        if (!ctx.user) {
          throw new Error('Unauthorized');
        }

        // If no query provided, throw error since filter is required
        if (!query || !query.filter) {
          throw new Error('Query with filter is required');
        }

        // Since filter is required and workspaceId is required in filter,
        // we can safely access these properties
        const filter = query.filter;
        const page = query.page ?? {};

        // Build safe filter with required workspaceId
        const safeFilter = {
          workspaceId: filter.workspaceId,
          companyId: filter.companyId ?? undefined,
          ...(filter.status ? { status: filter.status } : undefined),
        };
        const safePage = {
          size: page.size ?? undefined,
          number: page.number ?? undefined,
        };
        const items = await ctx.services.invoiceService.listInvoices(
          {
            filter: safeFilter,
            page: safePage,
          },
          ctx.user,
        );
        return { items };
      },
    });

    t.field('invoiceById', {
      type: Invoice,
      args: {
        id: nonNull('String'),
      },
      async resolve(_root, { id }, ctx: GraphQLContext) {
        if (!ctx.user) {
          throw new Error('Unauthorized');
        }
        return ctx.services.invoiceService.getInvoiceById(id, ctx.user);
      },
    });
  },
});

// --- Mutation for creating an invoice ---

export const CreateInvoiceInput = inputObjectType({
  name: 'CreateInvoiceInput',
  definition(t) {
    t.nonNull.string('workspaceId');
    t.nonNull.string('buyerId');
    t.nonNull.string('sellerId');
  },
});

export const MarkInvoiceAsSentInput = inputObjectType({
  name: 'MarkInvoiceAsSentInput',
  definition(t) {
    t.nonNull.string('invoiceId');
    t.nonNull.field('date', { type: 'DateTime' });
  },
});

export const MarkInvoiceAsPaidInput = inputObjectType({
  name: 'MarkInvoiceAsPaidInput',
  definition(t) {
    t.nonNull.string('invoiceId');
    t.nonNull.field('date', { type: 'DateTime' });
  },
});

export const CancelInvoiceInput = inputObjectType({
  name: 'CancelInvoiceInput',
  definition(t) {
    t.nonNull.string('invoiceId');
  },
});

export const AddInvoiceChargesInput = inputObjectType({
  name: 'AddInvoiceChargesInput',
  definition(t) {
    t.nonNull.id('invoiceId');
    t.nonNull.list.nonNull.id('chargeIds');
  },
});

// DEPRECATED: Use AddTaxLineItemInput instead
export const SetInvoiceTaxInput = inputObjectType({
  name: 'SetInvoiceTaxInput',
  definition(t) {
    t.nonNull.string('invoiceId');
    t.nonNull.float('taxPercent');
  },
});

// New tax line item inputs
export const AddTaxLineItemInput = inputObjectType({
  name: 'AddTaxLineItemInput',
  definition(t) {
    t.nonNull.id('invoiceId');
    t.nonNull.string('description');
    t.nonNull.field('type', { type: TaxType });
    t.nonNull.float('value');
    t.int('order');
  },
});

export const UpdateTaxLineItemInput = inputObjectType({
  name: 'UpdateTaxLineItemInput',
  definition(t) {
    t.nonNull.id('invoiceId');
    t.nonNull.id('taxLineItemId');
    t.string('description');
    t.field('type', { type: TaxType });
    t.float('value');
    t.int('order');
  },
});

export const RemoveTaxLineItemInput = inputObjectType({
  name: 'RemoveTaxLineItemInput',
  definition(t) {
    t.nonNull.id('invoiceId');
    t.nonNull.id('taxLineItemId');
  },
});

export const InvoicesMutation = extendType({
  type: 'Mutation',
  definition(t) {
    t.field('createInvoice', {
      type: nonNull(Invoice),
      args: {
        input: nonNull(arg({ type: 'CreateInvoiceInput' })),
      },
      async resolve(_root, { input }, ctx: GraphQLContext) {
        if (!ctx.user) {
          throw new Error('Unauthorized');
        }

        const { workspaceId, buyerId, sellerId } = input;

        const referenceNumber =
          await ctx.services.referenceNumberService.generateReferenceNumberForEntity(
            {
              entityType: 'INVOICE',
              workspaceId,
              contactId: buyerId,
            },
            ctx.user,
          );

        const created = await ctx.services.invoiceService.createInvoice(
          { workspaceId, buyerId, sellerId, invoiceNumber: referenceNumber },
          ctx.user,
        );

        return created;
      },
    });

    t.field('markInvoiceAsSent', {
      type: nonNull(Invoice),
      args: {
        input: nonNull(arg({ type: 'MarkInvoiceAsSentInput' })),
      },
      async resolve(_root, { input }, ctx: GraphQLContext) {
        if (!ctx.user) {
          throw new Error('Unauthorized');
        }
        const updated = await ctx.services.invoiceService.markInvoiceAsSent(
          input.invoiceId,
          input.date,
          ctx.user,
        );
        if (!updated) {
          throw new Error('Invoice not found or not authorized');
        }
        return updated;
      },
    });

    t.field('deleteInvoice', {
      type: nonNull('Boolean'),
      args: {
        id: nonNull('String'),
      },
      async resolve(_root, { id }, ctx: GraphQLContext) {
        if (!ctx.user) {
          throw new Error('Unauthorized');
        }
        return ctx.services.invoiceService.deleteInvoice(id, ctx.user);
      },
    });

    t.field('markInvoiceAsPaid', {
      type: nonNull(Invoice),
      args: {
        input: nonNull(arg({ type: 'MarkInvoiceAsPaidInput' })),
      },
      async resolve(_root, { input }, ctx: GraphQLContext) {
        if (!ctx.user) {
          throw new Error('Unauthorized');
        }
        const updated = await ctx.services.invoiceService.markInvoiceAsPaid(
          input.invoiceId,
          input.date,
          ctx.user,
        );
        if (!updated) {
          throw new Error('Invoice not found or not authorized');
        }
        return updated;
      },
    });

    t.field('cancelInvoice', {
      type: nonNull(Invoice),
      args: {
        input: nonNull(arg({ type: 'CancelInvoiceInput' })),
      },
      async resolve(_root, { input }, ctx: GraphQLContext) {
        if (!ctx.user) {
          throw new Error('Unauthorized');
        }
        const updated = await ctx.services.invoiceService.cancelInvoice(
          input.invoiceId,
          ctx.user,
        );
        if (!updated) {
          throw new Error('Invoice not found or not authorized');
        }
        return updated;
      },
    });

    t.field('addInvoiceCharges', {
      type: nonNull(Invoice),
      args: {
        input: nonNull(arg({ type: 'AddInvoiceChargesInput' })),
      },
      async resolve(_root, { input }, ctx: GraphQLContext) {
        if (!ctx.user) {
          throw new Error('Unauthorized');
        }
        const updatedInvoice =
          await ctx.services.invoiceService.addChargesToInvoice(
            input.invoiceId,
            input.chargeIds,
            ctx.user,
          );
        if (!updatedInvoice) {
          throw new Error('Invoice not found or not authorized');
        }
        return updatedInvoice;
      },
    });

    // DEPRECATED: Use addTaxLineItem instead
    t.field('setInvoiceTax', {
      type: nonNull(Invoice),
      description:
        'DEPRECATED: Use addTaxLineItem instead for more flexible tax management',
      deprecation:
        'Use addTaxLineItem instead for more flexible tax management',
      args: {
        input: nonNull(arg({ type: 'SetInvoiceTaxInput' })),
      },
      async resolve(_root, { input }, ctx: GraphQLContext) {
        throw new Error('Deprecated, use addTaxLineItem');
      },
    });

    // New tax line item mutations
    t.field('addTaxLineItem', {
      type: nonNull(Invoice),
      args: {
        input: nonNull(arg({ type: 'AddTaxLineItemInput' })),
      },
      async resolve(_root, { input }, ctx: GraphQLContext) {
        if (!ctx.user) {
          throw new Error('Unauthorized');
        }
        const updatedInvoice = await ctx.services.invoiceService.addTaxLineItem(
          input.invoiceId,
          {
            description: input.description,
            type: input.type,
            value: input.value,
            order: input.order || undefined,
          },
          ctx.user,
        );
        if (!updatedInvoice) {
          throw new Error('Invoice not found or not authorized');
        }
        return updatedInvoice;
      },
    });

    t.field('updateTaxLineItem', {
      type: nonNull(Invoice),
      args: {
        input: nonNull(arg({ type: 'UpdateTaxLineItemInput' })),
      },
      async resolve(_root, { input }, ctx: GraphQLContext) {
        if (!ctx.user) {
          throw new Error('Unauthorized');
        }
        const updates: any = {};
        if (input.description !== null && input.description !== undefined) {
          updates.description = input.description;
        }
        if (input.type !== null && input.type !== undefined) {
          updates.type = input.type;
        }
        if (input.value !== null && input.value !== undefined) {
          updates.value = input.value;
        }
        if (input.order !== null && input.order !== undefined) {
          updates.order = input.order;
        }

        const updatedInvoice =
          await ctx.services.invoiceService.updateTaxLineItem(
            input.invoiceId,
            input.taxLineItemId,
            updates,
            ctx.user,
          );
        if (!updatedInvoice) {
          throw new Error('Invoice not found or not authorized');
        }
        return updatedInvoice;
      },
    });

    t.field('removeTaxLineItem', {
      type: nonNull(Invoice),
      args: {
        input: nonNull(arg({ type: 'RemoveTaxLineItemInput' })),
      },
      async resolve(_root, { input }, ctx: GraphQLContext) {
        if (!ctx.user) {
          throw new Error('Unauthorized');
        }
        const updatedInvoice =
          await ctx.services.invoiceService.removeTaxLineItem(
            input.invoiceId,
            input.taxLineItemId,
            ctx.user,
          );
        if (!updatedInvoice) {
          throw new Error('Invoice not found or not authorized');
        }
        return updatedInvoice;
      },
    });

    t.field('clearInvoiceTaxes', {
      type: nonNull(Invoice),
      args: {
        invoiceId: nonNull('ID'),
      },
      async resolve(_root, { invoiceId }, ctx: GraphQLContext) {
        if (!ctx.user) {
          throw new Error('Unauthorized');
        }
        const updatedInvoice =
          await ctx.services.invoiceService.clearInvoiceTaxes(
            invoiceId,
            ctx.user,
          );
        if (!updatedInvoice) {
          throw new Error('Invoice not found or not authorized');
        }
        return updatedInvoice;
      },
    });
  },
});
