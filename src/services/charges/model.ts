import {
  type MongoClient,
  type Db,
  type Collection,
  ClientSession,
} from 'mongodb';
import { generateId } from '../../lib/id-generator';

type GeneratedFields = '_id' | 'createdAt';

interface ChargeDoc {
  _id: string;
  workspaceId: string;
  amountInCents: number;
  description: string;
  chargeType: 'SALE' | 'RENTAL' | 'SERVICE';
  contactId: string;
  projectId?: string;
  salesOrderId?: string;
  purchaseOrderNumber?: string;
  salesOrderLineItemId?: string;
  fulfilmentId?: string;
  invoiceId?: string;
  priceId?: string;
  createdAt: Date;
  billingPeriodStart?: Date;
  billingPeriodEnd?: Date;
}

// DTO's
export type Charge = Omit<ChargeDoc, '_id'> & {
  id: string;
};

// input types
export type ChargeInput = Omit<ChargeDoc, GeneratedFields>;

// query type:
export type ChargeFilters = Partial<
  Pick<
    ChargeDoc,
    | 'workspaceId'
    | 'contactId'
    | 'projectId'
    | 'salesOrderId'
    | 'purchaseOrderNumber'
    | 'fulfilmentId'
    | 'invoiceId'
    | 'chargeType'
  >
>;

export type ListChargesQuery = {
  filter: ChargeFilters;
  page?: {
    size?: number;
    number?: number;
  };
};

export class ChargeModel {
  private client: MongoClient;
  private dbName: string = 'es-erp';
  private collectionName: string = 'charges';
  private db: Db;
  private collection: Collection<ChargeDoc>;
  public readonly ID_PREFIX = 'CHARGE';

  constructor(config: { mongoClient: MongoClient }) {
    this.client = config.mongoClient;
    this.db = this.client.db(this.dbName);
    this.collection = this.db.collection<ChargeDoc>(this.collectionName);
  }

  generateChargeId(tenantId: string): string {
    return generateId(this.ID_PREFIX, tenantId);
  }

  mapCharge(charge: ChargeDoc): Charge {
    const { _id, ...fields } = charge;
    return {
      ...fields,
      id: charge._id,
    };
  }

  async createCharge(
    input: ChargeInput,
    session?: ClientSession,
  ): Promise<Charge> {
    const r = await this.collection.insertOne(
      {
        _id: this.generateChargeId(input.workspaceId),
        ...input,
        createdAt: new Date(),
      },
      { session },
    );

    const charge = await this.collection.findOne(
      { _id: r.insertedId },
      { session },
    );

    if (!charge) {
      throw new Error('charge not found');
    }

    return this.mapCharge(charge);
  }

  async listCharges(
    query: ListChargesQuery,
    session?: ClientSession,
  ): Promise<Charge[]> {
    const limit = query.page?.size || 10;
    const skip = query.page?.number ? (query.page.number - 1) * limit : 0;

    return (
      await this.collection
        .find(query.filter, { limit, skip, session })
        .toArray()
    ).map(this.mapCharge);
  }

  async countCharges(query: ChargeFilters, session?: ClientSession) {
    return this.collection.countDocuments(query, { session });
  }

  async getChargeById(
    chargeId: string,
    session?: ClientSession,
  ): Promise<Charge | null> {
    const charge = await this.collection.findOne(
      { _id: chargeId },
      { session },
    );
    return charge ? this.mapCharge(charge) : null;
  }

  async getChargesByIds(
    chargeIds: string[],
    session?: ClientSession,
  ): Promise<Charge[]> {
    const charges = await this.collection
      .find({ _id: { $in: chargeIds } }, { session })
      .toArray();
    return charges.map(this.mapCharge);
  }

  async allocateChargeToInvoice(
    chargeId: string,
    invoiceId: string,
    session?: ClientSession,
  ): Promise<boolean> {
    const result = await this.collection.updateOne(
      { _id: chargeId },
      { $set: { invoiceId } },
      { session },
    );
    return result.modifiedCount > 0;
  }

  async unallocateChargesFromInvoice(
    invoiceId: string,
    session?: ClientSession,
  ): Promise<number> {
    const result = await this.collection.updateMany(
      { invoiceId },
      { $unset: { invoiceId: '' } },
      { session },
    );
    return result.modifiedCount;
  }

  async deleteAllChargesByFulfilmentId(
    fulfilmentId: string,
    session?: ClientSession,
  ): Promise<void> {
    await this.collection.deleteMany(
      {
        fulfilmentId,
      },
      { session },
    );
  }
}

export const createChargeModel = (config: { mongoClient: MongoClient }) => {
  const chargeModel = new ChargeModel(config);
  return chargeModel;
};
