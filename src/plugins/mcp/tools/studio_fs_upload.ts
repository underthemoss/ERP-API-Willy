import { z } from 'zod';
import { gql } from 'graphql-request';
import { createMcpTool } from './types';

gql`
  mutation McpStudioFsUpload($input: StudioFsUploadInput!) {
    studioFsUpload(input: $input) {
      etag
    }
  }
`;

export const studioFsUploadTool = createMcpTool({
  name: 'studio_fs_upload',
  description: 'Uploads a base64-encoded file to the workspace filesystem.',
  inputSchema: {
    workspaceId: z.string().describe('Workspace ID'),
    path: z.string().describe('File path to write'),
    bytes: z.string().describe('Base64-encoded file contents'),
    mimeType: z
      .string()
      .optional()
      .describe('Optional MIME type (e.g., application/pdf)'),
    expectedEtag: z
      .string()
      .optional()
      .describe('Required for updates; omit for create'),
  },
  handler: async (sdk, args) => {
    try {
      const result = await sdk.McpStudioFsUpload({
        input: {
          workspaceId: args.workspaceId,
          path: args.path,
          bytes: args.bytes,
          mimeType: args.mimeType,
          expectedEtag: args.expectedEtag,
        },
      });

      return {
        content: [
          {
            type: 'text' as const,
            text: JSON.stringify(result.studioFsUpload, null, 2),
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text' as const,
            text: `Error uploading studio FS: ${error instanceof Error ? error.message : 'Unknown error'}`,
          },
        ],
        isError: true,
      };
    }
  },
});
