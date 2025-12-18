import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { GraphQLClient } from 'graphql-request';
import { getSdk } from './generated/graphql';
import { mcpTools } from './tools';

export interface MCPServerContext {
  /**
   * The base URL of the GraphQL endpoint (e.g., http://localhost:4000)
   */
  graphqlUrl: string;
  /**
   * The JWT token for authentication
   */
  jwtToken: string;
}

/**
 * Creates a new MCP server instance with tools for the authenticated user.
 * Each request creates a fresh server instance (stateless mode).
 *
 * The MCP tools use the GraphQL API to perform operations, ensuring
 * consistent authorization and business logic.
 */
export function createMCPServer(context: MCPServerContext) {
  const { graphqlUrl, jwtToken } = context;

  // Create GraphQL client with authentication
  const graphqlClient = new GraphQLClient(`${graphqlUrl}/graphql`, {
    headers: {
      Authorization: `Bearer ${jwtToken}`,
    },
  });

  // Get the typed SDK
  const sdk = getSdk(graphqlClient);

  const server = new McpServer(
    {
      name: 'es-erp-api',
      version: '1.0.0',
    },
    {
      capabilities: {
        tools: {},
        logging: {},
      },
    },
  );

  // Register all MCP tools
  for (const tool of mcpTools) {
    server.registerTool(
      tool.name,
      {
        description: tool.description,
        inputSchema: tool.inputSchema,
      },
      (args) => {
        const validatedArgs = tool.validateInput(args);
        return tool.handler(sdk, validatedArgs);
      },
    );
  }

  return server;
}
