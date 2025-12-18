import { z } from 'zod';
import { gql } from 'graphql-request';
import { createMcpTool } from './types';

gql`
  mutation McpDeletePrice($id: ID!) {
    deletePriceById(id: $id)
  }
`;

export const deletePriceTool = createMcpTool({
  name: 'delete_price',
  description:
    'Delete a price (rental or sale) by its ID. This action cannot be undone.',
  inputSchema: {
    id: z.string().describe('The price ID to delete'),
  },
  handler: async (sdk, args) => {
    try {
      const { id } = args;

      await sdk.McpDeletePrice({ id });

      return {
        content: [
          {
            type: 'text' as const,
            text: JSON.stringify(
              {
                success: true,
                deletedPriceId: id,
                message: `Price ${id} has been deleted`,
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
            text: `Error deleting price: ${error instanceof Error ? error.message : 'Unknown error'}`,
          },
        ],
        isError: true,
      };
    }
  },
});
