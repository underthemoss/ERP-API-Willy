import { z } from 'zod';
import { gql } from 'graphql-request';
import { createMcpTool } from './types';

gql`
  mutation McpStudioCatalogValidate($input: StudioCatalogValidateInput!) {
    studioCatalogValidate(input: $input) {
      errors {
        message
        path
      }
      warnings {
        message
        path
      }
    }
  }
`;

export const studioCatalogValidateTool = createMcpTool({
  name: 'studio_catalog_validate',
  description: 'Validates and lints a catalog.jsonc manifest.',
  inputSchema: {
    workspaceId: z.string().describe('Workspace ID'),
    catalogPath: z
      .string()
      .describe('Catalog folder path (e.g., /catalogs/demo)'),
  },
  handler: async (sdk, args) => {
    try {
      const result = await sdk.McpStudioCatalogValidate({
        input: { workspaceId: args.workspaceId, catalogPath: args.catalogPath },
      });

      return {
        content: [
          {
            type: 'text' as const,
            text: JSON.stringify(result.studioCatalogValidate, null, 2),
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text' as const,
            text: `Error validating catalog: ${error instanceof Error ? error.message : 'Unknown error'}`,
          },
        ],
        isError: true,
      };
    }
  },
});
