import { z } from 'zod';
import { gql } from 'graphql-request';
import { createMcpTool } from './types';

gql`
  query McpListPriceBooks(
    $filter: ListPriceBooksFilter!
    $page: ListPriceBooksPage!
  ) {
    listPriceBooks(filter: $filter, page: $page) {
      items {
        id
        workspaceId
        name
        notes
        location
        businessContactId
        projectId
        parentPriceBookId
        parentPriceBookPercentageFactor
        createdAt
        updatedAt
      }
      page {
        totalItems
        totalPages
        number
      }
    }
  }
`;

export const listPricebooksTool = createMcpTool({
  name: 'list_pricebooks',
  description:
    'List price books for a workspace. Price books contain pricing information for products and can be associated with specific business contacts, projects, or locations.',
  inputSchema: {
    workspaceId: z
      .string()
      .describe('The workspace ID to list price books for'),
  },
  handler: async (sdk, args) => {
    try {
      const { workspaceId } = args;

      const result = await sdk.McpListPriceBooks({
        filter: { workspaceId },
        page: { number: 1, size: 1000 },
      });

      const priceBooks = result.listPriceBooks?.items || [];

      return {
        content: [
          {
            type: 'text' as const,
            text: JSON.stringify(
              {
                workspaceId,
                count: priceBooks.length,
                priceBooks,
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
            text: `Error listing price books: ${error instanceof Error ? error.message : 'Unknown error'}`,
          },
        ],
        isError: true,
      };
    }
  },
});
