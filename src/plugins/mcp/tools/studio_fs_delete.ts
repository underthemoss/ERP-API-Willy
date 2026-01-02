import { z } from 'zod';
import { gql } from 'graphql-request';
import { createMcpTool } from './types';

gql`
  mutation McpStudioFsDelete($input: StudioFsDeleteInput!) {
    studioFsDelete(input: $input)
  }
`;

export const studioFsDeleteTool = createMcpTool({
  name: 'studio_fs_delete',
  description: 'Soft deletes a file or folder from the workspace filesystem.',
  inputSchema: {
    workspaceId: z.string().describe('Workspace ID'),
    path: z.string().describe('Path to delete'),
  },
  handler: async (sdk, args) => {
    try {
      const result = await sdk.McpStudioFsDelete({
        input: { workspaceId: args.workspaceId, path: args.path },
      });

      return {
        content: [
          {
            type: 'text' as const,
            text: JSON.stringify({ deleted: result.studioFsDelete }, null, 2),
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text' as const,
            text: `Error deleting StudioFS path: ${error instanceof Error ? error.message : 'Unknown error'}`,
          },
        ],
        isError: true,
      };
    }
  },
});
