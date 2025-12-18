import { z } from 'zod';
import { gql } from 'graphql-request';
import { createMcpTool } from './types';
import { PriceType } from '../generated/graphql';

gql`
  query McpListPrices($filter: ListPricesFilter!, $page: ListPricesPage!) {
    listPrices(filter: $filter, page: $page) {
      items {
        ... on RentalPrice {
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
        ... on SalePrice {
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
      page {
        totalItems
        totalPages
        number
      }
    }
  }
`;

export const listPricesTool = createMcpTool({
  name: 'list_prices',
  description:
    'List prices for a workspace. Filter by price book, category, price type (RENTAL or SALE), or name. Returns both rental prices (day/week/month rates) and sale prices (unit cost).',
  inputSchema: {
    workspaceId: z.string().describe('The workspace ID to list prices for'),
    priceBookId: z.string().optional().describe('Filter by price book ID'),
    pimCategoryId: z.string().optional().describe('Filter by PIM category ID'),
    priceType: z
      .enum(['RENTAL', 'SALE'])
      .optional()
      .describe('Filter by price type: RENTAL or SALE'),
    name: z.string().optional().describe('Filter by price name'),
  },
  handler: async (sdk, args) => {
    try {
      const { workspaceId, priceBookId, pimCategoryId, priceType, name } = args;

      const result = await sdk.McpListPrices({
        filter: {
          workspaceId,
          priceBookId,
          pimCategoryId,
          priceType: priceType as PriceType | undefined,
          name,
        },
        page: { number: 1, size: 1000 },
      });

      const prices = result.listPrices?.items || [];

      return {
        content: [
          {
            type: 'text' as const,
            text: JSON.stringify(
              {
                workspaceId,
                filters: { priceBookId, pimCategoryId, priceType, name },
                count: prices.length,
                prices,
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
            text: `Error listing prices: ${error instanceof Error ? error.message : 'Unknown error'}`,
          },
        ],
        isError: true,
      };
    }
  },
});
