import {
  type MongoClient,
  type Db,
  type Collection,
  ClientSession,
} from 'mongodb';
import {
  createInvoiceEventStore,
  InvoiceEventStore,
} from './invoiceEventStore';
import { generateId } from '../../lib/id-generator';

export type InvoiceStatus = 'DRAFT' | 'SENT' | 'PAID' | 'CANCELLED';

export type TaxType = 'PERCENTAGE' | 'FIXED_AMOUNT';

export type TaxLineItem = {
  id: string;
  description: string;
  type: TaxType;
  value: number; // For percentage: 0.085 = 8.5%, For fixed: amount in cents
  calculatedAmountInCents?: number; // The calculated tax amount
  order: number; // For applying taxes in sequence
};

export type InvoiceDoc = {
  _id: string;
  workspaceId: string;
  sellerId: string;
  buyerId: string;
  companyId: string;
  invoiceNumber: string;
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string;
  updatedBy?: string;
  subTotalInCents: number; // line item total not including taxes
  totalTaxesInCents: number; // Sum of all tax amounts
  finalSumInCents: number;
  status: InvoiceStatus;
  invoiceSentDate?: Date;
  invoicePaidDate?: Date;
  taxLineItems: TaxLineItem[]; // New flexible tax system
  lineItems?: {
    chargeId: string;
    description: string;
    totalInCents: number;
  }[];
};

export type Invoice = Omit<InvoiceDoc, '_id'> & { id: string };

export type CreateInvoiceInput = Omit<
  InvoiceDoc,
  '_id' | 'createdAt' | 'updatedAt' | 'createdBy' | 'updatedBy'
>;
export type UpdateInvoiceInput = Partial<
  Omit<InvoiceDoc, '_id' | 'companyId' | 'createdAt' | 'createdBy'>
>;

export type ListInvoicesFilter = Partial<
  Pick<InvoiceDoc, 'companyId' | 'status' | 'workspaceId'>
>;
export type ListInvoicesQuery = {
  filter: ListInvoicesFilter;
  page?: {
    size?: number;
    number?: number;
  };
};

export class InvoiceModel {
  private client: MongoClient;
  private dbName: string = 'es-erp';
  private collectionName: string = 'invoices';
  private db: Db;
  private collection: Collection<InvoiceDoc>;
  private eventStore: InvoiceEventStore;

  constructor(config: { mongoClient: MongoClient }) {
    this.client = config.mongoClient;
    this.db = this.client.db(this.dbName);
    this.collection = this.db.collection<InvoiceDoc>(this.collectionName);
    this.eventStore = createInvoiceEventStore({ mongoClient: this.client });
  }

  mapInvoice(doc: InvoiceDoc): Invoice {
    const { _id, ...fields } = doc;
    return { ...fields, id: _id };
  }

  async listInvoices({ filter, page }: ListInvoicesQuery): Promise<Invoice[]> {
    const limit = page?.size || 10;
    const skip = page?.number ? (page.number - 1) * limit : 0;
    const docs = await this.collection.find(filter, { limit, skip }).toArray();
    return docs.map((d) => this.mapInvoice(d));
  }

  async countInvoices(filter: ListInvoicesFilter): Promise<number> {
    return this.collection.countDocuments(filter);
  }

  async getInvoiceById(id: string, companyId: string): Promise<Invoice | null> {
    const doc = await this.collection.findOne({ _id: id, companyId });
    return doc ? this.mapInvoice(doc) : null;
  }

  async createInvoice(
    input: {
      workspaceId: string;
      companyId: string;
      buyerId: string;
      sellerId: string;
      invoiceNumber: string;
    },
    principalId: string,
  ): Promise<Invoice> {
    const id = generateId('INV', input.companyId);
    const { state } = await this.eventStore.applyEvent(
      id,
      {
        type: 'CREATE_INVOICE',
        workspaceId: input.workspaceId,
        companyId: input.companyId,
        buyerId: input.buyerId,
        sellerId: input.sellerId,
        invoiceNumber: input.invoiceNumber,
      },
      { principalId },
    );
    if (!state) throw new Error('Unexpected error');
    return this.mapInvoice(state);
  }

  async deleteInvoice(
    id: string,
    companyId: string,
    userId: string,
    session?: ClientSession,
  ): Promise<boolean> {
    // Ensure the invoice belongs to the company before deleting
    const invoice = await this.getInvoiceById(id, companyId);
    if (!invoice) {
      return false;
    }

    // Only allow deletion of invoices in DRAFT status
    if (invoice.status !== 'DRAFT') {
      return false;
    }

    const { state } = await this.eventStore.applyEvent(
      id,
      {
        type: 'DELETE_INVOICE',
      },
      { principalId: userId },
      session,
    );
    return state === null;
  }

  async markInvoiceAsSent(
    id: string,
    date: Date,
    companyId: string,
    userId: string,
  ): Promise<Invoice | null> {
    // Ensure the invoice belongs to the company before updating
    const invoice = await this.getInvoiceById(id, companyId);
    if (!invoice) {
      return null;
    }
    const { state } = await this.eventStore.applyEvent(
      id,
      {
        type: 'MARK_AS_SENT',
        date,
      },
      { principalId: userId },
    );
    return state ? this.mapInvoice(state) : null;
  }

  async markInvoiceAsPaid(
    id: string,
    date: Date,
    companyId: string,
    userId: string,
  ): Promise<Invoice | null> {
    // Ensure the invoice belongs to the company before updating
    const invoice = await this.getInvoiceById(id, companyId);
    if (!invoice) {
      return null;
    }
    const { state } = await this.eventStore.applyEvent(
      id,
      {
        type: 'MARK_AS_PAID',
        date,
      },
      { principalId: userId },
    );
    return state ? this.mapInvoice(state) : null;
  }

  async cancelInvoice(
    id: string,
    companyId: string,
    userId: string,
  ): Promise<Invoice | null> {
    // Ensure the invoice belongs to the company before updating
    const invoice = await this.getInvoiceById(id, companyId);
    if (!invoice) {
      return null;
    }
    const { state } = await this.eventStore.applyEvent(
      id,
      {
        type: 'CANCEL_INVOICE',
      },
      { principalId: userId },
    );
    return state ? this.mapInvoice(state) : null;
  }

  async addChargeToInvoice(
    id: string,
    companyId: string,
    charge: {
      chargeId: string;
      description: string;
      totalInCents: number;
    },
    userId: string,
    session?: ClientSession,
  ): Promise<Invoice | null> {
    // Ensure the invoice belongs to the company before updating
    const invoice = await this.getInvoiceById(id, companyId);
    if (!invoice) {
      return null;
    }
    const { state } = await this.eventStore.applyEvent(
      id,
      {
        type: 'ADD_CHARGE',
        chargeId: charge.chargeId,
        description: charge.description,
        totalInCents: charge.totalInCents,
      },
      { principalId: userId },
      session,
    );
    return state ? this.mapInvoice(state) : null;
  }

  async addTaxLineItem(
    id: string,
    companyId: string,
    taxLineItem: Omit<TaxLineItem, 'id' | 'calculatedAmountInCents'>,
    userId: string,
    session?: ClientSession,
  ): Promise<Invoice | null> {
    // Ensure the invoice belongs to the company before updating
    const invoice = await this.getInvoiceById(id, companyId);
    if (!invoice) {
      return null;
    }
    const taxId = generateId('TAX', companyId);
    const { state } = await this.eventStore.applyEvent(
      id,
      {
        type: 'ADD_TAX_LINE_ITEM',
        taxLineItem: {
          id: taxId,
          ...taxLineItem,
        },
      },
      { principalId: userId },
      session,
    );
    return state ? this.mapInvoice(state) : null;
  }

  async updateTaxLineItem(
    id: string,
    companyId: string,
    taxLineItemId: string,
    updates: Partial<Omit<TaxLineItem, 'id' | 'calculatedAmountInCents'>>,
    userId: string,
    session?: ClientSession,
  ): Promise<Invoice | null> {
    // Ensure the invoice belongs to the company before updating
    const invoice = await this.getInvoiceById(id, companyId);
    if (!invoice) {
      return null;
    }
    const { state } = await this.eventStore.applyEvent(
      id,
      {
        type: 'UPDATE_TAX_LINE_ITEM',
        taxLineItemId,
        updates,
      },
      { principalId: userId },
      session,
    );
    return state ? this.mapInvoice(state) : null;
  }

  async removeTaxLineItem(
    id: string,
    companyId: string,
    taxLineItemId: string,
    userId: string,
    session?: ClientSession,
  ): Promise<Invoice | null> {
    // Ensure the invoice belongs to the company before updating
    const invoice = await this.getInvoiceById(id, companyId);
    if (!invoice) {
      return null;
    }
    const { state } = await this.eventStore.applyEvent(
      id,
      {
        type: 'REMOVE_TAX_LINE_ITEM',
        taxLineItemId,
      },
      { principalId: userId },
      session,
    );
    return state ? this.mapInvoice(state) : null;
  }

  async clearTaxes(
    id: string,
    companyId: string,
    userId: string,
    session?: ClientSession,
  ): Promise<Invoice | null> {
    // Ensure the invoice belongs to the company before updating
    const invoice = await this.getInvoiceById(id, companyId);
    if (!invoice) {
      return null;
    }
    const { state } = await this.eventStore.applyEvent(
      id,
      {
        type: 'CLEAR_TAXES',
      },
      { principalId: userId },
      session,
    );
    return state ? this.mapInvoice(state) : null;
  }
}

export const createInvoiceModel = (config: { mongoClient: MongoClient }) => {
  return new InvoiceModel(config);
};
