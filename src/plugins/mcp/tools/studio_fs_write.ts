import { z } from 'zod';
import { gql } from 'graphql-request';
import { createMcpTool } from './types';

gql`
  mutation McpStudioFsWrite($input: StudioFsWriteInput!) {
    studioFsWrite(input: $input) {
      etag
    }
  }
`;

export const studioFsWriteTool = createMcpTool({
  name: 'studio_fs_write',
  description: 'Writes a text file to the workspace filesystem.',
  inputSchema: {
    workspaceId: z.string().describe('Workspace ID'),
    path: z.string().describe('File path to write'),
    content: z.string().describe('File contents (string)'),
    mimeType: z
      .string()
      .optional()
      .describe('Optional MIME type (e.g., application/json)'),
    expectedEtag: z
      .string()
      .optional()
      .describe('Required for updates; omit for create'),
  },
  handler: async (sdk, args) => {
    try {
      const result = await sdk.McpStudioFsWrite({
        input: {
          workspaceId: args.workspaceId,
          path: args.path,
          content: args.content,
          mimeType: args.mimeType,
          expectedEtag: args.expectedEtag,
        },
      });

      return {
        content: [
          {
            type: 'text' as const,
            text: JSON.stringify(result.studioFsWrite, null, 2),
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text' as const,
            text: `Error writing studio FS: ${error instanceof Error ? error.message : 'Unknown error'}`,
          },
        ],
        isError: true,
      };
    }
  },
});
