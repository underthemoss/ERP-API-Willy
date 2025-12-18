import { z } from 'zod';
import { gql } from 'graphql-request';
import { createMcpTool } from './types';

gql`
  mutation McpCreateRentalPrice($input: CreateRentalPriceInput!) {
    createRentalPrice(input: $input) {
      id
      workspaceId
      name
      priceType
      pimCategoryId
      pimCategoryName
      pimCategoryPath
      pimProductId
      priceBookId
      pricePerDayInCents
      pricePerWeekInCents
      pricePerMonthInCents
      createdAt
      updatedAt
    }
  }
`;

export const createRentalPriceTool = createMcpTool({
  name: 'create_rental_price',
  description:
    'Create a rental price for a product category. Rental prices include day, week, and month rates in cents.',
  inputSchema: {
    workspaceId: z.string().describe('The workspace ID'),
    pimCategoryId: z.string().describe('The PIM category ID for this price'),
    pricePerDayInCents: z.number().describe('Daily rental price in cents'),
    pricePerWeekInCents: z.number().describe('Weekly rental price in cents'),
    pricePerMonthInCents: z.number().describe('Monthly rental price in cents'),
    name: z.string().optional().describe('Optional name for the price'),
    pimProductId: z
      .string()
      .optional()
      .describe('Optional PIM product ID for product-specific pricing'),
    priceBookId: z
      .string()
      .optional()
      .describe('Optional price book ID to add this price to'),
  },
  handler: async (sdk, args) => {
    try {
      const result = await sdk.McpCreateRentalPrice({
        input: {
          workspaceId: args.workspaceId,
          pimCategoryId: args.pimCategoryId,
          pricePerDayInCents: args.pricePerDayInCents,
          pricePerWeekInCents: args.pricePerWeekInCents,
          pricePerMonthInCents: args.pricePerMonthInCents,
          name: args.name,
          pimProductId: args.pimProductId,
          priceBookId: args.priceBookId,
        },
      });

      return {
        content: [
          {
            type: 'text' as const,
            text: JSON.stringify(
              {
                success: true,
                rentalPrice: result.createRentalPrice,
              },
              null,
              2,
            ),
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text' as const,
            text: `Error creating rental price: ${error instanceof Error ? error.message : 'Unknown error'}`,
          },
        ],
        isError: true,
      };
    }
  },
});
