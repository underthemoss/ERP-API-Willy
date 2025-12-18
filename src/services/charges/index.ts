import { ClientSession, type MongoClient } from 'mongodb';
import { type EnvConfig } from '../../config';
import {
  createChargeModel,
  type ChargeInput,
  type ChargeModel,
  type ListChargesQuery,
  type Charge,
} from './model';
import { ANON_USER_AUTH_PAYLOAD, UserAuthPayload } from '../../authentication';
import {
  AuthZ,
  ERP_WORKSPACE_SUBJECT_PERMISSIONS,
  ERP_CHARGE_SUBJECT_RELATIONS,
  ERP_CHARGE_SUBJECT_PERMISSIONS,
  ERP_INVOICE_SUBJECT_PERMISSIONS,
  ERP_FULFILMENT_SUBJECT_PERMISSIONS,
} from '../../lib/authz';

// re-export types
export type { Charge };

// exposes uses-cases
export class ChargeService {
  private model: ChargeModel;
  private authz: AuthZ;

  constructor(config: { model: ChargeModel; authz: AuthZ }) {
    this.model = config.model;
    this.authz = config.authz;
  }

  async getChargeById(
    chargeId: string,
    user: UserAuthPayload = ANON_USER_AUTH_PAYLOAD,
    session?: ClientSession,
  ) {
    const hasPermission = await this.authz.charge.hasPermission({
      resourceId: chargeId,
      permission: ERP_CHARGE_SUBJECT_PERMISSIONS.USER_READ,
      subjectId: user.id,
    });

    if (!hasPermission) {
      throw new Error('Unauthorized to read this charge');
    }

    return this.model.getChargeById(chargeId, session);
  }

  async getChargeByIds(
    chargeIds: readonly string[],
    user: UserAuthPayload = ANON_USER_AUTH_PAYLOAD,
    session?: ClientSession,
  ): Promise<(Charge | null | Error)[]> {
    const charges = await this.model.getChargesByIds(
      Array.from(chargeIds),
      session,
    );

    const permissions = await this.authz.charge.bulkHasPermissions(
      chargeIds.map((id) => ({
        resourceId: id,
        permission: ERP_CHARGE_SUBJECT_PERMISSIONS.USER_READ,
        subjectId: user.id,
      })),
    );

    // Create a map for O(1) lookup
    const chargeMap = new Map<string, Charge | Error>();
    charges.forEach((charge, index) => {
      if (charge) {
        if (permissions[index].hasPermission) {
          chargeMap.set(charge.id, charge);
        } else {
          chargeMap.set(
            charge.id,
            new Error('Unauthorized to read this charge'),
          );
        }
      }
    });

    // Return in the same order as requested
    return chargeIds.map((id) => chargeMap.get(id) || null);
  }

  async allocateChargeToInvoice(
    opts: { chargeId: string; invoiceId: string },
    user: UserAuthPayload = ANON_USER_AUTH_PAYLOAD,
    session?: ClientSession,
  ): Promise<boolean> {
    const hasPermission = await this.authz.invoice.hasPermission({
      resourceId: opts.invoiceId,
      permission: ERP_INVOICE_SUBJECT_PERMISSIONS.USER_UPDATE,
      subjectId: user.id,
    });

    if (!hasPermission) {
      throw new Error('Unauthorized to update this invoice');
    }

    return this.model.allocateChargeToInvoice(
      opts.chargeId,
      opts.invoiceId,
      session,
    );
  }

  async unallocateChargesFromInvoice(
    invoiceId: string,
    user: UserAuthPayload = ANON_USER_AUTH_PAYLOAD,
    session?: ClientSession,
  ): Promise<number> {
    const hasPermission = await this.authz.invoice.hasPermission({
      resourceId: invoiceId,
      permission: ERP_INVOICE_SUBJECT_PERMISSIONS.USER_UPDATE,
      subjectId: user.id,
    });

    if (!hasPermission) {
      throw new Error('Unauthorized to update this invoice');
    }

    return this.model.unallocateChargesFromInvoice(invoiceId, session);
  }

  createCharge = async (
    input: ChargeInput,
    user: UserAuthPayload = ANON_USER_AUTH_PAYLOAD,
    session?: ClientSession,
  ) => {
    if (!input.contactId) {
      throw new Error('Contact is required');
    }

    // Check if user can manage charges in this workspace
    const canManage = await this.authz.workspace.hasPermission({
      resourceId: input.workspaceId,
      permission: ERP_WORKSPACE_SUBJECT_PERMISSIONS.USER_CAN_MANAGE_CHARGES,
      subjectId: user.id,
    });

    if (!canManage) {
      throw new Error('Unauthorized to create charges in this workspace');
    }

    const charge = await this.model.createCharge(input, session);

    await this.authz.charge.writeRelation({
      resourceId: charge.id,
      subjectId: charge.workspaceId,
      relation: ERP_CHARGE_SUBJECT_RELATIONS.WORKSPACE_WORKSPACE,
    });

    return charge;
  };

  listCharges = async (
    query: ListChargesQuery,
    user: UserAuthPayload = ANON_USER_AUTH_PAYLOAD,
    session?: ClientSession,
  ) => {
    if (query.filter.workspaceId) {
      // Check if user can read charges in this workspace
      const canRead = await this.authz.workspace.hasPermission({
        resourceId: query.filter.workspaceId,
        permission: ERP_WORKSPACE_SUBJECT_PERMISSIONS.USER_CAN_READ_CHARGES,
        subjectId: user.id,
      });

      if (!canRead) {
        throw new Error('Unauthorized to read charges in this workspace');
      }
    }

    if (query.filter.invoiceId) {
      const canRead = await this.authz.invoice.hasPermission({
        resourceId: query.filter.invoiceId,
        permission: ERP_INVOICE_SUBJECT_PERMISSIONS.USER_READ,
        subjectId: user.id,
      });

      if (!canRead) {
        throw new Error('Unauthorized to read charges in this invoice');
      }
    }

    if (query.filter.fulfilmentId) {
      const canRead = await this.authz.fulfilment.hasPermission({
        resourceId: query.filter.fulfilmentId,
        permission: ERP_FULFILMENT_SUBJECT_PERMISSIONS.USER_READ,
        subjectId: user.id,
      });

      if (!canRead) {
        throw new Error('Unauthorized to read charges in this fulfilment');
      }
    }

    const [items, count] = await Promise.all([
      this.model.listCharges(query, session),
      this.model.countCharges(query.filter, session),
    ]);

    return {
      items,
      page: {
        number: 1,
        size: items.length,
        totalItems: count,
        totalPages: Math.ceil(count / items.length) || 0,
      },
    };
  };

  hasAnyChargesBeenInvoicedForFulfillment = async (
    fulfilmentId: string,
    user: UserAuthPayload = ANON_USER_AUTH_PAYLOAD,
    session?: ClientSession,
  ) => {
    const hasPermission = await this.authz.fulfilment.hasPermission({
      resourceId: fulfilmentId,
      permission: ERP_FULFILMENT_SUBJECT_PERMISSIONS.USER_READ,
      subjectId: user.id,
    });

    if (!hasPermission) {
      throw new Error('Unauthorized to read this fulfilment');
    }

    const charges = await this.model.listCharges(
      {
        filter: {
          fulfilmentId,
        },
        page: { size: 100, number: 1 },
      },
      session,
    );

    return charges.some((charge) => charge.invoiceId);
  };

  deleteAllChargesByFulfilmentId = async (
    fulfilmentId: string,
    user: UserAuthPayload = ANON_USER_AUTH_PAYLOAD,
    session?: ClientSession,
  ) => {
    const hasPermission = await this.authz.fulfilment.hasPermission({
      resourceId: fulfilmentId,
      permission: ERP_FULFILMENT_SUBJECT_PERMISSIONS.USER_UPDATE,
      subjectId: user.id,
    });

    if (!hasPermission) {
      throw new Error('Unauthorized to delete charges for this fulfilment');
    }

    return this.model.deleteAllChargesByFulfilmentId(fulfilmentId, session);
  };
}

export const createChargeService = async (config: {
  envConfig: EnvConfig;
  mongoClient: MongoClient;
  authz: AuthZ;
}) => {
  const model = createChargeModel(config);

  const chargeService = new ChargeService({
    model,
    authz: config.authz,
  });

  return chargeService;
};
