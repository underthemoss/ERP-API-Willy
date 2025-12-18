import { type MongoClient } from 'mongodb';
import { ChargeService } from '../charges';
import {
  createInvoiceModel,
  InvoiceModel,
  Invoice,
  CreateInvoiceInput,
  UpdateInvoiceInput,
  ListInvoicesQuery,
  ListInvoicesFilter,
} from './model';
import { UserAuthPayload } from '../../authentication';
import { type AuthZ } from '../../lib/authz';
import {
  ERP_INVOICE_SUBJECT_RELATIONS,
  ERP_INVOICE_SUBJECT_PERMISSIONS,
  ERP_WORKSPACE_SUBJECT_PERMISSIONS,
} from '../../lib/authz/spicedb-generated-types';

// Re-export DTOs if needed
export type {
  Invoice,
  CreateInvoiceInput,
  UpdateInvoiceInput,
  ListInvoicesQuery,
  ListInvoicesFilter,
};

export class InvoiceService {
  private model: InvoiceModel;
  private chargeService: ChargeService;
  private client: MongoClient;
  private authZ: AuthZ;

  constructor(config: {
    model: InvoiceModel;
    chargeService: ChargeService;
    client: MongoClient;
    authZ: AuthZ;
  }) {
    this.model = config.model;
    this.chargeService = config.chargeService;
    this.client = config.client;
    this.authZ = config.authZ;
  }

  async listInvoices(query: ListInvoicesQuery, user: UserAuthPayload) {
    // Check if workspaceId is provided in the filter
    if (!query.filter?.workspaceId) {
      throw new Error('workspaceId is required to list invoices');
    }

    // Check permission for the specific workspace
    const canReadInvoices = await this.authZ.workspace.hasPermission({
      permission: ERP_WORKSPACE_SUBJECT_PERMISSIONS.USER_CAN_READ_INVOICES,
      resourceId: query.filter.workspaceId,
      subjectId: user.id,
    });

    if (!canReadInvoices) {
      // User doesn't have permission, return empty result
      return [];
    }

    return this.model.listInvoices({
      ...query,
      filter: { ...query.filter, companyId: user.companyId },
    });
  }

  async countInvoices(filter: ListInvoicesFilter, user: UserAuthPayload) {
    return this.model.countInvoices({
      ...filter,
      companyId: user.companyId,
    });
  }

  async getInvoiceById(id: string, user: UserAuthPayload) {
    const invoice = await this.model.getInvoiceById(id, user.companyId);
    if (!invoice) {
      return null;
    }

    // Check if user has permission to read this invoice
    const canReadInvoice = await this.authZ.invoice.hasPermission({
      permission: ERP_INVOICE_SUBJECT_PERMISSIONS.USER_READ,
      resourceId: id,
      subjectId: user.id,
    });

    if (!canReadInvoice) {
      return null; // Return null as if invoice doesn't exist to avoid information leakage
    }

    return invoice;
  }

  async createInvoice(
    input: {
      workspaceId: string;
      buyerId: string;
      sellerId: string;
      invoiceNumber?: string;
    },
    user: UserAuthPayload,
  ) {
    // Check if user has permission to manage invoices in the workspace
    const canManageInvoices = await this.authZ.workspace.hasPermission({
      permission: ERP_WORKSPACE_SUBJECT_PERMISSIONS.USER_CAN_MANAGE_INVOICES,
      resourceId: input.workspaceId,
      subjectId: user.id,
    });

    if (!canManageInvoices) {
      throw new Error(
        'You do not have permission to create invoices in this workspace',
      );
    }

    const created = await this.model.createInvoice(
      {
        workspaceId: input.workspaceId,
        buyerId: input.buyerId,
        sellerId: input.sellerId,
        companyId: user.companyId,
        invoiceNumber: input.invoiceNumber || '', // This will be set by the GraphQL resolver
      },
      user?.id,
    );

    // Create SpiceDB relationship between invoice and workspace
    if (created) {
      try {
        await this.authZ.invoice.writeRelation({
          resourceId: created.id,
          subjectId: input.workspaceId,
          relation: ERP_INVOICE_SUBJECT_RELATIONS.WORKSPACE_WORKSPACE,
        });
      } catch (error) {
        console.error(
          'Failed to create SpiceDB relationship for invoice:',
          error,
        );
        // Don't fail the creation, but log the error
      }
    }

    return created;
  }

  async deleteInvoice(id: string, user: UserAuthPayload) {
    // First check if user has permission to manage this invoice
    const canManageInvoice = await this.authZ.invoice.hasPermission({
      permission: ERP_INVOICE_SUBJECT_PERMISSIONS.USER_UPDATE,
      resourceId: id,
      subjectId: user.id,
    });

    if (!canManageInvoice) {
      return false; // User doesn't have permission
    }

    // Use a transaction to ensure atomicity
    const session = this.client.startSession();
    try {
      let result = false;
      await session.withTransaction(async () => {
        // First check if we can delete (invoice exists and is in DRAFT status)
        const invoice = await this.model.getInvoiceById(id, user.companyId);
        if (!invoice || invoice.status !== 'DRAFT') {
          result = false;
          return;
        }

        // Unallocate all charges associated with this invoice
        await this.chargeService.unallocateChargesFromInvoice(
          id,
          user,
          session,
        );

        // Delete the invoice
        result = await this.model.deleteInvoice(
          id,
          user.companyId,
          user?.id,
          session,
        );

        // Clean up SpiceDB relationships
        if (result) {
          try {
            await this.authZ.invoice.deleteRelationships({
              resourceId: id,
            });
          } catch (error) {
            console.error(
              'Failed to delete SpiceDB relationships for invoice:',
              error,
            );
            // Don't fail the deletion, but log the error
          }
        }
      });
      return result;
    } finally {
      await session.endSession();
    }
  }

  async markInvoiceAsSent(id: string, date: Date, user: UserAuthPayload) {
    // Check if user has permission to manage this invoice
    const canManageInvoice = await this.authZ.invoice.hasPermission({
      permission: ERP_INVOICE_SUBJECT_PERMISSIONS.USER_UPDATE,
      resourceId: id,
      subjectId: user.id,
    });

    if (!canManageInvoice) {
      throw new Error('You do not have permission to update this invoice');
    }

    return this.model.markInvoiceAsSent(id, date, user.companyId, user?.id);
  }

  async markInvoiceAsPaid(id: string, date: Date, user: UserAuthPayload) {
    // Check if user has permission to manage this invoice
    const canManageInvoice = await this.authZ.invoice.hasPermission({
      permission: ERP_INVOICE_SUBJECT_PERMISSIONS.USER_UPDATE,
      resourceId: id,
      subjectId: user.id,
    });

    if (!canManageInvoice) {
      throw new Error('You do not have permission to update this invoice');
    }

    return this.model.markInvoiceAsPaid(id, date, user.companyId, user?.id);
  }

  async cancelInvoice(id: string, user: UserAuthPayload) {
    // Check if user has permission to manage this invoice
    const canManageInvoice = await this.authZ.invoice.hasPermission({
      permission: ERP_INVOICE_SUBJECT_PERMISSIONS.USER_UPDATE,
      resourceId: id,
      subjectId: user.id,
    });

    if (!canManageInvoice) {
      throw new Error('You do not have permission to update this invoice');
    }

    return this.model.cancelInvoice(id, user.companyId, user?.id);
  }

  async addTaxLineItem(
    invoiceId: string,
    taxLineItem: {
      description: string;
      type: 'PERCENTAGE' | 'FIXED_AMOUNT';
      value: number;
      order?: number;
    },
    user: UserAuthPayload,
  ) {
    // Check if user has permission to manage this invoice
    const canManageInvoice = await this.authZ.invoice.hasPermission({
      permission: ERP_INVOICE_SUBJECT_PERMISSIONS.USER_UPDATE,
      resourceId: invoiceId,
      subjectId: user.id,
    });

    if (!canManageInvoice) {
      throw new Error('You do not have permission to update this invoice');
    }

    // Validate percentage tax values
    if (
      taxLineItem.type === 'PERCENTAGE' &&
      (taxLineItem.value < 0 || taxLineItem.value > 1)
    ) {
      throw new Error('Tax percentage must be between 0 and 1');
    }

    return this.model.addTaxLineItem(
      invoiceId,
      user.companyId,
      {
        ...taxLineItem,
        order: taxLineItem.order ?? 1,
      },
      user?.id,
    );
  }

  async updateTaxLineItem(
    invoiceId: string,
    taxLineItemId: string,
    updates: {
      description?: string;
      type?: 'PERCENTAGE' | 'FIXED_AMOUNT';
      value?: number;
      order?: number;
    },
    user: UserAuthPayload,
  ) {
    // Check if user has permission to manage this invoice
    const canManageInvoice = await this.authZ.invoice.hasPermission({
      permission: ERP_INVOICE_SUBJECT_PERMISSIONS.USER_UPDATE,
      resourceId: invoiceId,
      subjectId: user.id,
    });

    if (!canManageInvoice) {
      throw new Error('You do not have permission to update this invoice');
    }

    // If updating value, we need to check the current tax type or the updated type
    if (updates.value !== undefined) {
      // Get the current invoice to check the tax line item type
      const invoice = await this.model.getInvoiceById(
        invoiceId,
        user.companyId,
      );
      if (!invoice) {
        throw new Error('Invoice not found');
      }

      const taxLineItem = invoice.taxLineItems?.find(
        (item) => item.id === taxLineItemId,
      );
      if (!taxLineItem) {
        throw new Error('Tax line item not found');
      }

      // Determine the type (use updated type if provided, otherwise use current type)
      const taxType = updates.type || taxLineItem.type;

      // Validate percentage tax values
      if (
        taxType === 'PERCENTAGE' &&
        (updates.value < 0 || updates.value > 1)
      ) {
        throw new Error('Tax percentage must be between 0 and 1');
      }
    }

    return this.model.updateTaxLineItem(
      invoiceId,
      user.companyId,
      taxLineItemId,
      updates,
      user?.id,
    );
  }

  async removeTaxLineItem(
    invoiceId: string,
    taxLineItemId: string,
    user: UserAuthPayload,
  ) {
    // Check if user has permission to manage this invoice
    const canManageInvoice = await this.authZ.invoice.hasPermission({
      permission: ERP_INVOICE_SUBJECT_PERMISSIONS.USER_UPDATE,
      resourceId: invoiceId,
      subjectId: user.id,
    });

    if (!canManageInvoice) {
      throw new Error('You do not have permission to update this invoice');
    }

    return this.model.removeTaxLineItem(
      invoiceId,
      user.companyId,
      taxLineItemId,
      user?.id,
    );
  }

  async clearInvoiceTaxes(invoiceId: string, user: UserAuthPayload) {
    // Check if user has permission to manage this invoice
    const canManageInvoice = await this.authZ.invoice.hasPermission({
      permission: ERP_INVOICE_SUBJECT_PERMISSIONS.USER_UPDATE,
      resourceId: invoiceId,
      subjectId: user.id,
    });

    if (!canManageInvoice) {
      throw new Error('You do not have permission to update this invoice');
    }

    return this.model.clearTaxes(invoiceId, user.companyId, user?.id);
  }

  async addChargesToInvoice(
    invoiceId: string,
    chargeIds: string[],
    user: UserAuthPayload,
  ) {
    // Check if user has permission to manage this invoice
    const canManageInvoice = await this.authZ.invoice.hasPermission({
      permission: ERP_INVOICE_SUBJECT_PERMISSIONS.USER_UPDATE,
      resourceId: invoiceId,
      subjectId: user.id,
    });

    if (!canManageInvoice) {
      throw new Error('You do not have permission to update this invoice');
    }

    await this.client.withSession(async (session) => {
      await session.withTransaction(async () => {
        for (const chargeId of chargeIds) {
          const charge = await this.chargeService.getChargeById(
            chargeId,
            user,
            session,
          );
          if (!charge) {
            throw new Error(`Charge not found: ${chargeId}`);
          }
          if (charge.invoiceId) {
            throw new Error(`Charge is already allocated: ${chargeId}`);
          }
          await this.model.addChargeToInvoice(
            invoiceId,
            user.companyId,
            {
              chargeId: charge.id,
              description: charge.description,
              totalInCents: charge.amountInCents,
            },
            user?.id,
            session,
          );
          await this.chargeService.allocateChargeToInvoice(
            { chargeId, invoiceId },
            user,
            session,
          );
        }
      });
    });
    return this.getInvoiceById(invoiceId, user);
  }
}

export const createInvoiceService = (config: {
  mongoClient: MongoClient;
  chargeService: ChargeService;
  authZ: AuthZ;
}) => {
  const model = createInvoiceModel(config);
  return new InvoiceService({
    model,
    chargeService: config.chargeService,
    client: config.mongoClient,
    authZ: config.authZ,
  });
};
