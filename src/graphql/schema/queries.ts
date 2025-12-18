import { extendType, objectType, idArg, nonNull } from 'nexus';
import { PaginationInfo } from './common';
import { Transaction } from './erp-types';

export const ListTransactionResult = objectType({
  name: 'ListTransactionResult',
  definition(t) {
    t.nonNull.list.nonNull.field('items', { type: Transaction });
    t.nonNull.field('page', { type: PaginationInfo });
  },
});

export const Query = extendType({
  type: 'Query',
  definition(t) {
    t.nonNull.field('listTransactions', {
      type: ListTransactionResult,
      args: {
        workspaceId: nonNull(idArg()),
      },
      resolve: async (root, args, ctx) => {
        const { items, page } =
          await ctx.services.transactionService.listTransactions({
            workspaceId: args.workspaceId,
          });
        return {
          items,
          page,
        };
      },
    });

    t.nonNull.list.nonNull.field('listPriceNames', {
      type: 'String',
      args: {
        workspaceId: nonNull(idArg()),
        priceBookId: 'String',
        pimCategoryId: 'String',
      },
      resolve: async (root, args, ctx) => {
        return ctx.services.pricesService.listUniquePriceNames(
          {
            priceBookId: args.priceBookId ?? undefined,
            pimCategoryId: args.pimCategoryId ?? undefined,
            workspaceId: args.workspaceId,
          },
          ctx.user,
        );
      },
    });
  },
});
