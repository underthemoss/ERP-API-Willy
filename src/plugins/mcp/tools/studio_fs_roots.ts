import { z } from 'zod';
import { gql } from 'graphql-request';
import { createMcpTool } from './types';

gql`
  query McpStudioFsRoots($workspaceId: String!) {
    studioFsRoots(workspaceId: $workspaceId)
  }
`;

export const studioFsRootsTool = createMcpTool({
  name: 'studio_fs_roots',
  description: 'Lists allowed StudioFS root paths for a workspace.',
  inputSchema: {
    workspaceId: z.string().describe('Workspace ID'),
  },
  handler: async (sdk, args) => {
    try {
      const result = await sdk.McpStudioFsRoots({
        workspaceId: args.workspaceId,
      });

      return {
        content: [
          {
            type: 'text' as const,
            text: JSON.stringify(result.studioFsRoots ?? [], null, 2),
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text' as const,
            text: `Error listing StudioFS roots: ${error instanceof Error ? error.message : 'Unknown error'}`,
          },
        ],
        isError: true,
      };
    }
  },
});
