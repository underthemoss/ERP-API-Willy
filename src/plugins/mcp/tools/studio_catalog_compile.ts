import { z } from 'zod';
import { gql } from 'graphql-request';
import { createMcpTool } from './types';

gql`
  mutation McpStudioCatalogCompile($input: StudioCatalogCompileInput!) {
    studioCatalogCompile(input: $input)
  }
`;

export const studioCatalogCompileTool = createMcpTool({
  name: 'studio_catalog_compile',
  description: 'Compiles catalog lists and writes outputs to .catalog.',
  inputSchema: {
    workspaceId: z.string().describe('Workspace ID'),
    catalogPath: z
      .string()
      .describe('Catalog folder path (e.g., /catalogs/demo)'),
  },
  handler: async (sdk, args) => {
    try {
      const result = await sdk.McpStudioCatalogCompile({
        input: { workspaceId: args.workspaceId, catalogPath: args.catalogPath },
      });

      return {
        content: [
          {
            type: 'text' as const,
            text: JSON.stringify(result.studioCatalogCompile ?? {}, null, 2),
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text' as const,
            text: `Error compiling catalog: ${error instanceof Error ? error.message : 'Unknown error'}`,
          },
        ],
        isError: true,
      };
    }
  },
});
