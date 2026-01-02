import { z } from 'zod';
import { gql } from 'graphql-request';
import { createMcpTool } from './types';

gql`
  mutation McpUpdateRentalPrice($input: UpdateRentalPriceInput!) {
    updateRentalPrice(input: $input) {
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

gql`
  mutation McpUpdateSalePrice($input: UpdateSalePriceInput!) {
    updateSalePrice(input: $input) {
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

gql`
  query McpGetPriceById($id: ID!) {
    getPriceById(id: $id) {
      ... on RentalPrice {
        id
        priceType
      }
      ... on SalePrice {
        id
        priceType
      }
      ... on ServicePrice {
        id
        priceType
      }
    }
  }
`;

export const updatePriceTool = createMcpTool({
  name: 'update_price',
  description:
    'Update an existing price (rental or sale). First fetches the price to determine its type, then updates it accordingly. Provide only the fields you want to change.',
  inputSchema: {
    id: z.string().describe('The price ID to update'),
    name: z.string().optional().describe('New name for the price'),
    pimCategoryId: z.string().optional().describe('New PIM category ID'),
    pimProductId: z.string().optional().describe('New PIM product ID'),
    // Rental price fields
    pricePerDayInCents: z
      .number()
      .optional()
      .describe('New daily rate in cents (rental only)'),
    pricePerWeekInCents: z
      .number()
      .optional()
      .describe('New weekly rate in cents (rental only)'),
    pricePerMonthInCents: z
      .number()
      .optional()
      .describe('New monthly rate in cents (rental only)'),
    // Sale price fields
    unitCostInCents: z
      .number()
      .optional()
      .describe('New unit cost in cents (sale only)'),
  },
  handler: async (sdk, args) => {
    try {
      const { id, ...updates } = args;

      // First, get the price to determine its type
      const priceResult = await sdk.McpGetPriceById({ id });
      const price = priceResult.getPriceById;

      if (!price) {
        return {
          content: [
            {
              type: 'text' as const,
              text: `Error: Price with ID ${id} not found`,
            },
          ],
          isError: true,
        };
      }

      if (price.priceType === 'RENTAL') {
        const result = await sdk.McpUpdateRentalPrice({
          input: {
            id,
            name: updates.name,
            pimCategoryId: updates.pimCategoryId,
            pimProductId: updates.pimProductId,
            pricePerDayInCents: updates.pricePerDayInCents,
            pricePerWeekInCents: updates.pricePerWeekInCents,
            pricePerMonthInCents: updates.pricePerMonthInCents,
          },
        });

        return {
          content: [
            {
              type: 'text' as const,
              text: JSON.stringify(
                {
                  success: true,
                  priceType: 'RENTAL',
                  updatedPrice: result.updateRentalPrice,
                },
                null,
                2,
              ),
            },
          ],
        };
      } else {
        const result = await sdk.McpUpdateSalePrice({
          input: {
            id,
            name: updates.name,
            pimCategoryId: updates.pimCategoryId,
            pimProductId: updates.pimProductId,
            unitCostInCents: updates.unitCostInCents,
          },
        });

        return {
          content: [
            {
              type: 'text' as const,
              text: JSON.stringify(
                {
                  success: true,
                  priceType: 'SALE',
                  updatedPrice: result.updateSalePrice,
                },
                null,
                2,
              ),
            },
          ],
        };
      }
    } catch (error) {
      return {
        content: [
          {
            type: 'text' as const,
            text: `Error updating price: ${error instanceof Error ? error.message : 'Unknown error'}`,
          },
        ],
        isError: true,
      };
    }
  },
});
