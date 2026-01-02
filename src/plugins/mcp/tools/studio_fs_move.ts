import { z } from 'zod';
import { gql } from 'graphql-request';
import { createMcpTool } from './types';

gql`
  mutation McpStudioFsMove($input: StudioFsMoveInput!) {
    studioFsMove(input: $input)
  }
`;

export const studioFsMoveTool = createMcpTool({
  name: 'studio_fs_move',
  description: 'Moves or renames a file or folder in the workspace filesystem.',
  inputSchema: {
    workspaceId: z.string().describe('Workspace ID'),
    from: z.string().describe('Existing path to move'),
    to: z.string().describe('Destination path'),
  },
  handler: async (sdk, args) => {
    try {
      const result = await sdk.McpStudioFsMove({
        input: { workspaceId: args.workspaceId, from: args.from, to: args.to },
      });

      return {
        content: [
          {
            type: 'text' as const,
            text: JSON.stringify(result.studioFsMove, null, 2),
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text' as const,
            text: `Error moving StudioFS path: ${error instanceof Error ? error.message : 'Unknown error'}`,
          },
        ],
        isError: true,
      };
    }
  },
});
