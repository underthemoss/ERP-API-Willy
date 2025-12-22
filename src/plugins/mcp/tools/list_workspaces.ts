import { gql } from 'graphql-request';
import { createMcpTool } from './types';

/**
 * GraphQL operation for list_workspaces tool.
 * This is picked up by codegen to generate typed SDK methods.
 */
gql`
  query McpListWorkspaces {
    listWorkspaces {
      items {
        id
        name
        description
        accessType
        archived
        domain
        orgBusinessContactId
        orgBusinessContact {
          id
          name
        }
        createdAt
        updatedAt
      }
    }
  }
`;

/**
 * list_workspaces MCP tool definition
 */
export const listWorkspacesTool = createMcpTool({
  name: 'list_workspaces',
  description: 'Lists all workspaces that the authenticated user has access to',
  inputSchema: {},
  handler: async (sdk) => {
    try {
      const result = await sdk.McpListWorkspaces();

      // Format workspaces for better readability
      const formattedWorkspaces = (result.listWorkspaces?.items || []).map(
        (workspace) => ({
          id: workspace?.id,
          name: workspace?.name,
          description: workspace?.description,
          accessType: workspace?.accessType,
          archived: workspace?.archived,
          domain: workspace?.domain,
          orgBusinessContactId: workspace?.orgBusinessContactId,
          orgBusinessContact: workspace?.orgBusinessContact
            ? {
                id: workspace?.orgBusinessContact?.id,
                name: workspace?.orgBusinessContact?.name,
              }
            : null,
          createdAt: workspace?.createdAt,
          updatedAt: workspace?.updatedAt,
        }),
      );

      return {
        content: [
          {
            type: 'text' as const,
            text: JSON.stringify(
              {
                count: formattedWorkspaces.length,
                workspaces: formattedWorkspaces,
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
            text: `Error listing workspaces: ${error instanceof Error ? error.message : 'Unknown error'}`,
          },
        ],
        isError: true,
      };
    }
  },
});
