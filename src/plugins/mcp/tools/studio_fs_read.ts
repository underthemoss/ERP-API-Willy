import { z } from 'zod';
import { gql } from 'graphql-request';
import { createMcpTool } from './types';

gql`
  query McpStudioFsRead($input: StudioFsReadInput!) {
    studioFsRead(input: $input) {
      content
      mimeType
      etag
    }
  }
`;

export const studioFsReadTool = createMcpTool({
  name: 'studio_fs_read',
  description: 'Reads a file from the workspace filesystem.',
  inputSchema: {
    workspaceId: z.string().describe('Workspace ID'),
    path: z.string().describe('File path to read'),
    maxChars: z
      .number()
      .int()
      .positive()
      .optional()
      .describe('Optional maximum characters to return (defaults to 20000)'),
  },
  handler: async (sdk, args) => {
    try {
      const result = await sdk.McpStudioFsRead({
        input: { workspaceId: args.workspaceId, path: args.path },
      });

      const maxChars = args.maxChars ?? 20000;
      const fullContent = result.studioFsRead.content ?? '';
      const sizeBytes = Buffer.byteLength(fullContent, 'utf8');
      const truncated = fullContent.length > maxChars;
      const content = truncated ? fullContent.slice(0, maxChars) : fullContent;

      return {
        content: [
          {
            type: 'text' as const,
            text: JSON.stringify(
              {
                ...result.studioFsRead,
                content,
                sizeBytes,
                truncated,
              },
              null,
              2,
            ),
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text' as const,
            text: `Error reading studio FS: ${error instanceof Error ? error.message : 'Unknown error'}`,
          },
        ],
        isError: true,
      };
    }
  },
});
