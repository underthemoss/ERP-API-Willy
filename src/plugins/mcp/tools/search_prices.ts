import { z } from 'zod';
import { gql } from 'graphql-request';
import { createMcpTool } from './types';
import { PriceType } from '../generated/graphql';

gql`
  query McpSearchPrices($filter: ListPricesFilter!, $page: ListPricesPage!) {
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

export const searchPricesTool = createMcpTool({
  name: 'search_prices',
  description:
    'Search for prices by name within a workspace. Returns both rental prices (day/week/month rates) and sale prices (unit cost). Use this to find specific prices by name pattern.',
  inputSchema: {
    workspaceId: z.string().describe('The workspace ID to search prices in'),
    name: z.string().describe('Name pattern to search for (partial match)'),
    priceBookId: z.string().optional().describe('Filter by price book ID'),
    pimCategoryId: z.string().optional().describe('Filter by PIM category ID'),
    priceType: z
      .enum(['RENTAL', 'SALE'])
      .optional()
      .describe('Filter by price type: RENTAL or SALE'),
  },
  handler: async (sdk, args) => {
    try {
      const { workspaceId, name, priceBookId, pimCategoryId, priceType } = args;

      const result = await sdk.McpSearchPrices({
        filter: {
          workspaceId,
          name,
          priceBookId,
          pimCategoryId,
          priceType: priceType as PriceType | undefined,
        },
        page: { number: 1, size: 100 },
      });

      const prices = result.listPrices?.items || [];

      return {
        content: [
          {
            type: 'text' as const,
            text: JSON.stringify(
              {
                searchTerm: name,
                filters: { workspaceId, priceBookId, pimCategoryId, priceType },
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
            text: `Error searching prices: ${error instanceof Error ? error.message : 'Unknown error'}`,
          },
        ],
        isError: true,
      };
    }
  },
});
