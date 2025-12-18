import { objectType, queryType, nonNull } from 'nexus';
import { GraphQLContext } from '../context';

export const ExampleTicket = objectType({
  name: 'ExampleTicket',
  definition(t) {
    t.nonNull.string('title');
    t.nonNull.string('description');
  },
});

export const TaxObligation = objectType({
  name: 'TaxObligation',
  definition(t) {
    t.nonNull.string('description');
    t.nonNull.field('type', {
      type: 'TaxType', // This is already defined in invoices.ts
    });
    t.nonNull.float('value');
    t.nonNull.int('order');
    t.nonNull.string('reason');
  },
});

export const TaxAnalysisResult = objectType({
  name: 'TaxAnalysisResult',
  definition(t) {
    t.nonNull.list.nonNull.field('taxes', { type: TaxObligation });
  },
});

export const LlmQuery = queryType({
  definition(t) {
    t.field('llm', {
      type: objectType({
        name: 'Llm',
        definition(t2) {
          t2.field('exampleTicket', {
            type: ExampleTicket,
            resolve: async (_root, _args, ctx: GraphQLContext) => {
              if (!ctx.user) return null;
              return ctx.services.llmService.getExampleTicket();
            },
          });

          t2.field('suggestTaxObligations', {
            type: TaxAnalysisResult,
            args: {
              invoiceDescription: nonNull('String'),
            },
            resolve: async (
              _root,
              { invoiceDescription },
              ctx: GraphQLContext,
            ) => {
              if (!ctx.user) return null;

              const result =
                await ctx.services.llmService.suggestTaxObligations(
                  invoiceDescription,
                );

              // No transformation needed - service already returns camelCase
              return result;
            },
          });
        },
      }),
      resolve: () => ({}),
    });
  },
});
