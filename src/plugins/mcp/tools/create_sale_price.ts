import { z } from 'zod';
import { gql } from 'graphql-request';
import { createMcpTool } from './types';

gql`
  mutation McpCreateSalePrice($input: CreateSalePriceInput!) {
    createSalePrice(input: $input) {
      id
      workspaceId
      name
      priceType
      pimCategoryId
      pimCategoryName
      pimCategoryPath
      pimProductId
      priceBookId
      unitCostInCents
      createdAt
      updatedAt
    }
  }
`;

export const createSalePriceTool = createMcpTool({
  name: 'create_sale_price',
  description:
    'Create a sale price for a product category. Sale prices have a unit cost in cents.',
  inputSchema: {
    workspaceId: z.string().describe('The workspace ID'),
    pimCategoryId: z.string().describe('The PIM category ID for this price'),
    unitCostInCents: z.number().describe('Unit sale price in cents'),
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
      const result = await sdk.McpCreateSalePrice({
        input: {
          workspaceId: args.workspaceId,
          pimCategoryId: args.pimCategoryId,
          unitCostInCents: args.unitCostInCents,
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
                salePrice: result.createSalePrice,
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
            text: `Error creating sale price: ${error instanceof Error ? error.message : 'Unknown error'}`,
          },
        ],
        isError: true,
      };
    }
  },
});
