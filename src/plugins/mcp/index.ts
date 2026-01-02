import { FastifyPluginAsync, FastifyRequest, FastifyReply } from 'fastify';
import fp from 'fastify-plugin';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { createMCPServer } from './server-factory';
import { getEnvConfig } from '../../config';

/**
 * Allowed origins for CORS - matches main application CORS config
 */
const ALLOWED_ORIGINS = [
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'http://localhost:5001',
  'https://staging-erp.estrack.com',
  'https://erp.estrack.com',
];

/**
 * Check if an origin is allowed by CORS policy
 */
function isAllowedOrigin(origin: string | undefined): boolean {
  if (!origin) return false;
  return ALLOWED_ORIGINS.includes(origin);
}

/**
 * Fastify plugin for MCP (Model Context Protocol) server.
 *
 * Exposes a stateless Streamable HTTP endpoint at /api/mcp
 * that can be called by MCP clients (Cline, Claude Desktop, etc.)
 *
 * This implementation is horizontally scalable without sticky sessions
 * because each request creates a fresh server instance.
 *
 * The MCP tools use the GraphQL API internally, ensuring consistent
 * authorization and business logic across all access methods.
 */
const mcpPlugin: FastifyPluginAsync = async (fastify) => {
  fastify.register(
    async (fastify) => {
      // Handle CORS preflight - must be before any authentication
      // OPTIONS requests don't include auth headers, so we handle them separately
      fastify.options('/', async (request, reply) => {
        const origin = request.headers.origin;
        if (isAllowedOrigin(origin)) {
          reply.header('Access-Control-Allow-Origin', origin);
          reply.header('Access-Control-Allow-Methods', 'POST, OPTIONS');
          reply.header(
            'Access-Control-Allow-Headers',
            'Content-Type, Accept, Authorization',
          );
          reply.header('Access-Control-Allow-Credentials', 'true');
          reply.header('Access-Control-Max-Age', '0');
        }
        return reply.status(204).send();
      });

      // Add authentication to all routes in this context (except OPTIONS above)
      fastify.addHook('preHandler', async (request, reply) => {
        if (request.method === 'OPTIONS') return;
        return fastify.authenticate(request, reply);
      });

      // POST /api/mcp - Main MCP endpoint for Streamable HTTP
      fastify.post(
        '/',
        async (request: FastifyRequest, reply: FastifyReply) => {
          // Set CORS headers directly on raw response
          // Must use reply.raw.setHeader() because transport.handleRequest bypasses Fastify
          const origin = request.headers.origin;
          if (isAllowedOrigin(origin)) {
            reply.raw.setHeader('Access-Control-Allow-Origin', origin!);
            reply.raw.setHeader('Access-Control-Allow-Credentials', 'true');
          }
          // Exit early if no authenticated user
          if (!request.user) {
            return reply.status(401).send({
              jsonrpc: '2.0',
              error: {
                code: -32000,
                message: 'Authentication required',
              },
              id: null,
            });
          }

          // Extract JWT token from Authorization header
          const authHeader = request.headers.authorization;
          if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return reply.status(401).send({
              jsonrpc: '2.0',
              error: {
                code: -32000,
                message: 'Bearer token required',
              },
              id: null,
            });
          }
          const jwtToken = authHeader.substring(7); // Remove 'Bearer ' prefix

          // Construct GraphQL URL using localhost and PORT from config
          const config = getEnvConfig();
          const graphqlUrl = `http://localhost:${config.PORT}`;

          try {
            // Create a fresh MCP server for this request (stateless mode)
            const server = createMCPServer({
              graphqlUrl,
              jwtToken,
            });

            // Create Streamable HTTP transport in stateless mode
            const transport = new StreamableHTTPServerTransport({
              sessionIdGenerator: undefined, // Stateless mode - no session tracking
            });

            // Connect server to transport
            await server.connect(transport);

            // Handle the request
            await transport.handleRequest(
              request.raw,
              reply.raw,
              request.body as Record<string, unknown>,
            );

            // Cleanup when response closes
            reply.raw.on('close', () => {
              transport.close();
              server.close();
            });
          } catch (error) {
            fastify.log.error({ error }, 'Error handling MCP request');

            if (!reply.sent) {
              return reply.status(500).send({
                jsonrpc: '2.0',
                error: {
                  code: -32603,
                  message: 'Internal server error',
                },
                id: null,
              });
            }
          }
        },
      );

      // GET /api/mcp - Not allowed for stateless mode
      fastify.get('/', async (request: FastifyRequest, reply: FastifyReply) => {
        return reply.status(405).send({
          jsonrpc: '2.0',
          error: {
            code: -32000,
            message:
              'Method not allowed. This MCP server operates in stateless mode.',
          },
          id: null,
        });
      });

      // DELETE /api/mcp - Not allowed for stateless mode
      fastify.delete(
        '/',
        async (request: FastifyRequest, reply: FastifyReply) => {
          return reply.status(405).send({
            jsonrpc: '2.0',
            error: {
              code: -32000,
              message:
                'Method not allowed. This MCP server operates in stateless mode.',
            },
            id: null,
          });
        },
      );
    },
    {
      prefix: '/api/mcp',
    },
  );
};

export default fp(mcpPlugin, {
  name: 'mcp',
  fastify: '5.x',
});
