import { z } from 'zod';
import { gql } from 'graphql-request';
import { createMcpTool } from './types';

/**
 * GraphQL operation for list_projects tool.
 * This is picked up by codegen to generate typed SDK methods.
 */
gql`
  query McpListProjects($workspaceId: String!) {
    listProjects(workspaceId: $workspaceId) {
      id
      name
      project_code
      description
      status
      created_at
      updated_at
    }
  }
`;

/**
 * list_projects MCP tool definition
 */
export const listProjectsTool = createMcpTool({
  name: 'list_projects',
  description:
    'Lists all projects in a workspace that the authenticated user has access to',
  inputSchema: {
    workspaceId: z.string().describe('The workspace ID to list projects from'),
  },
  handler: async (sdk, args) => {
    try {
      const result = await sdk.McpListProjects({
        workspaceId: args.workspaceId,
      });

      // Format projects for better readability
      const formattedProjects = (result.listProjects || []).map((project) => ({
        id: project?.id,
        name: project?.name,
        projectCode: project?.project_code,
        description: project?.description,
        status: project?.status,
        createdAt: project?.created_at,
        updatedAt: project?.updated_at,
      }));

      return {
        content: [
          {
            type: 'text' as const,
            text: JSON.stringify(
              {
                count: formattedProjects.length,
                projects: formattedProjects,
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
            text: `Error listing projects: ${error instanceof Error ? error.message : 'Unknown error'}`,
          },
        ],
        isError: true,
      };
    }
  },
});
