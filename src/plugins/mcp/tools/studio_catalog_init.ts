import { z } from 'zod';
import { gql } from 'graphql-request';
import { createMcpTool } from './types';

gql`
  mutation McpStudioCatalogInit($input: StudioCatalogInitInput!) {
    studioCatalogInit(input: $input) {
      catalogPath
    }
  }
`;

export const studioCatalogInitTool = createMcpTool({
  name: 'studio_catalog_init',
  description: 'Initializes a catalog folder structure in StudioFS.',
  inputSchema: {
    workspaceId: z.string().describe('Workspace ID'),
    slug: z.string().describe('Catalog slug (kebab/snake case)'),
    name: z.string().optional().describe('Optional catalog display name'),
  },
  handler: async (sdk, args) => {
    try {
      const result = await sdk.McpStudioCatalogInit({
        input: {
          workspaceId: args.workspaceId,
          slug: args.slug,
          name: args.name,
        },
      });

      return {
        content: [
          {
            type: 'text' as const,
            text: JSON.stringify(result.studioCatalogInit, null, 2),
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text' as const,
            text: `Error initializing catalog: ${error instanceof Error ? error.message : 'Unknown error'}`,
          },
        ],
        isError: true,
      };
    }
  },
});
