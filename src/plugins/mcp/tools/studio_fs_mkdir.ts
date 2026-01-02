import { z } from 'zod';
import { gql } from 'graphql-request';
import { createMcpTool } from './types';

gql`
  mutation McpStudioFsMkdir($input: StudioFsMkdirInput!) {
    studioFsMkdir(input: $input)
  }
`;

export const studioFsMkdirTool = createMcpTool({
  name: 'studio_fs_mkdir',
  description: 'Creates a folder path in the workspace filesystem.',
  inputSchema: {
    workspaceId: z.string().describe('Workspace ID'),
    path: z.string().describe('Folder path to create'),
  },
  handler: async (sdk, args) => {
    try {
      const result = await sdk.McpStudioFsMkdir({
        input: { workspaceId: args.workspaceId, path: args.path },
      });

      return {
        content: [
          {
            type: 'text' as const,
            text: JSON.stringify(result.studioFsMkdir, null, 2),
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text' as const,
            text: `Error creating StudioFS folder: ${error instanceof Error ? error.message : 'Unknown error'}`,
          },
        ],
        isError: true,
      };
    }
  },
});
