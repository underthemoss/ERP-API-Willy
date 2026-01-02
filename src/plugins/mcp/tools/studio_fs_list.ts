import { z } from 'zod';
import { gql } from 'graphql-request';
import { createMcpTool } from './types';

gql`
  query McpStudioFsList($input: StudioFsListInput!) {
    studioFsList(input: $input) {
      path
      name
      type
      mimeType
      sizeBytes
      etag
      updatedAt
    }
  }
`;

export const studioFsListTool = createMcpTool({
  name: 'studio_fs_list',
  description: 'Lists children of a workspace filesystem path.',
  inputSchema: {
    workspaceId: z.string().describe('Workspace ID'),
    path: z.string().describe('Path to list (e.g., /catalogs/demo)'),
  },
  handler: async (sdk, args) => {
    try {
      const result = await sdk.McpStudioFsList({
        input: { workspaceId: args.workspaceId, path: args.path },
      });

      return {
        content: [
          {
            type: 'text' as const,
            text: JSON.stringify(result.studioFsList || [], null, 2),
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text' as const,
            text: `Error listing studio FS: ${error instanceof Error ? error.message : 'Unknown error'}`,
          },
        ],
        isError: true,
      };
    }
  },
});
