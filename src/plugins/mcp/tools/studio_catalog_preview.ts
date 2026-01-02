import { z } from 'zod';
import { gql } from 'graphql-request';
import { createMcpTool } from './types';

gql`
  mutation McpStudioCatalogPreview($input: StudioCatalogCompileInput!) {
    studioCatalogPreview(input: $input)
  }
`;

export const studioCatalogPreviewTool = createMcpTool({
  name: 'studio_catalog_preview',
  description: 'Previews compiled catalog lists without writing outputs.',
  inputSchema: {
    workspaceId: z.string().describe('Workspace ID'),
    catalogPath: z
      .string()
      .describe('Catalog folder path (e.g., /catalogs/demo)'),
  },
  handler: async (sdk, args) => {
    try {
      const result = await sdk.McpStudioCatalogPreview({
        input: { workspaceId: args.workspaceId, catalogPath: args.catalogPath },
      });

      return {
        content: [
          {
            type: 'text' as const,
            text: JSON.stringify(result.studioCatalogPreview ?? {}, null, 2),
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text' as const,
            text: `Error previewing catalog: ${error instanceof Error ? error.message : 'Unknown error'}`,
          },
        ],
        isError: true,
      };
    }
  },
});
