import { type MongoClient } from 'mongodb';
import { createTransactionModel, type TransactionModel } from './model';

export class TransactionService {
  private model: TransactionModel;
  constructor(config: { model: TransactionModel }) {
    this.model = config.model;
  }

  createTransaction = async (input: any) => {
    // auth
    // validation
    // business logic
    return this.model.createTransaction(input);
  };

  listTransactions = async (query: { workspaceId: string }) => {
    // auth
    // validation
    // business logic
    const [items, count] = await Promise.all([
      this.model.listTransactions(query),
      this.model.countTransactions(query),
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
}

export const createTransactionService = (config: {
  mongoClient: MongoClient;
}) => {
  const model = createTransactionModel(config);
  const transactionService = new TransactionService({
    model,
  });
  return transactionService;
};
