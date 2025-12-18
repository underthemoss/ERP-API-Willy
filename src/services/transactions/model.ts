import { type MongoClient, type Db, type Collection } from 'mongodb';
import { v4 } from 'uuid';

enum TransactionType {
  SERVICE = 'SERVICE',
  RENTAL = 'RENTAL',
  SALE = 'SALE',
}

type BaseGeneratedFields = '_id' | 'createdAt' | 'documentType' | 'updatedAt';

interface BaseTransactionDoc<T = TransactionType> {
  _id: string;
  type: T;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  projectId: string;
  documentType: 'TRANSACTION';
  comments: {
    id: string;
  }[];
  notes: string;
  workspaceId: string;
}

interface RentalTransactionDoc
  extends BaseTransactionDoc<TransactionType.RENTAL> {
  startDate: Date;
  endDate: Date;
  pimId: string;
  assetId: string;
  pricePerDayInCents: number;
  pricePerWeekInCents: number;
  pricePerMonthInCents: number;
  pickUpLocation: string;
  dropOffLocation: string;
}

interface SaleTransactionDoc extends BaseTransactionDoc<TransactionType.SALE> {
  quantity: number;
  product: string;
  priceInCents: number;
}

interface ServiceTransactionDoc
  extends BaseTransactionDoc<TransactionType.SERVICE> {
  assignee: string;
  location: string;
  costInCents: number;
  tasks: {
    details: string;
    completed: boolean;
  }[];
}

type TransactionDoc =
  | RentalTransactionDoc
  | SaleTransactionDoc
  | ServiceTransactionDoc;

// DTO's
type BaseTransaction = Omit<BaseTransactionDoc, '_id'> & {
  id: string;
};
type RentalTransaction = Omit<RentalTransactionDoc, '_id'> & {
  id: string;
};
type SaleTransaction = Omit<SaleTransactionDoc, '_id'> & {
  id: string;
};
type ServiceTransaction = Omit<ServiceTransactionDoc, '_id'> & {
  id: string;
};

// union type for all transactions
type Transaction = RentalTransaction | SaleTransaction | ServiceTransaction;

// input types
type RentalTransactionInput = Omit<RentalTransactionDoc, BaseGeneratedFields>;
type SaleTransactionInput = Omit<SaleTransactionDoc, BaseGeneratedFields>;
type ServiceTransactionInput = Omit<ServiceTransactionDoc, BaseGeneratedFields>;
// union of inputs
type TransactionInput =
  | RentalTransactionInput
  | SaleTransactionInput
  | ServiceTransactionInput;

export class TransactionModel {
  private client: MongoClient;
  private dbName: string = 'es-erp';
  private collectionName: string = 'transactions';
  private db: Db;
  private collection: Collection<TransactionDoc>;

  constructor(config: { mongoClient: MongoClient }) {
    this.client = config.mongoClient;
    this.db = this.client.db(this.dbName);
    this.collection = this.db.collection<TransactionDoc>(this.collectionName);
  }

  mapTransaction(transaction: TransactionDoc): Transaction {
    const { _id, ...fields } = transaction;
    return {
      ...fields,
      id: transaction._id,
    };
  }

  async createTransaction(input: TransactionInput): Promise<Transaction> {
    const now = new Date();
    const r = await this.collection.insertOne({
      _id: v4(),
      documentType: 'TRANSACTION',
      createdAt: now,
      updatedAt: now,
      ...input,
    });

    const transaction = await this.collection.findOne({
      _id: r.insertedId,
    });

    if (!transaction) {
      throw new Error('Transaction not found');
    }

    return this.mapTransaction(transaction);
  }

  async listTransactions(
    query: Pick<BaseTransactionDoc, 'workspaceId'>,
  ): Promise<BaseTransaction[]> {
    return (await this.collection.find(query).toArray()).map(
      this.mapTransaction,
    );
  }

  async countTransactions(query: Pick<BaseTransactionDoc, 'workspaceId'>) {
    return this.collection.countDocuments(query);
  }
}

export const createTransactionModel = (config: {
  mongoClient: MongoClient;
}) => {
  const transactionModel = new TransactionModel(config);
  return transactionModel;
};
