import { arg, inputObjectType, objectType, nonNull } from 'nexus';
import { Transaction, TransactionType } from './erp-types';

export const TransactionInput = inputObjectType({
  name: 'TransactionInput',
  definition(t) {
    t.nonNull.id('workspaceId');
    t.nonNull.field('type', { type: TransactionType });
    t.id('projectId');
  },
});

export const Mutation = objectType({
  name: 'Mutation',
  definition(t) {
    t.field('createTransaction', {
      type: Transaction,
      args: {
        input: arg({ type: nonNull(TransactionInput) }),
      },
      resolve: (root, { input }, ctx) => {
        const transaction = ctx.services.transactionService.createTransaction({
          ...input,
        });
        return transaction;
      },
    });
  },
});
