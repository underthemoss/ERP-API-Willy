import { FastifyPluginAsync } from 'fastify';
import fp from 'fastify-plugin';
import rateLimit from '@fastify/rate-limit';
import { type StudioConversationsService } from '../../services/studio_conversations';
import { chatHandler } from './handlers/chat';
import { fetchUrlHandler, closeBrowser } from './handlers/fetch-url';

export interface AgentPluginOptions {
  openaiApiKey?: string;
  studioConversationsService: StudioConversationsService;
}

/**
 * Fastify plugin for AI Agent chat
 * Registers REST API endpoints under /api/agent
 *
 * Supports streaming responses via Server-Sent Events (SSE)
 */
const agentPlugin: FastifyPluginAsync<AgentPluginOptions> = async (
  fastify,
  opts,
) => {
  const { openaiApiKey, studioConversationsService } = opts;

  if (!openaiApiKey) {
    fastify.log.warn(
      'OPENAI_API_KEY not configured - agent plugin will not work',
    );
  }

  // Register cleanup hook for browser instances
  fastify.addHook('onClose', async () => {
    fastify.log.info('Closing Puppeteer browser instances');
    await closeBrowser();
  });

  fastify.register(
    async (fastify) => {
      // Add authentication to all routes in this context
      fastify.addHook('preHandler', fastify.authenticate);

      // Configure rate limiting (generous limits for abuse detection)
      await fastify.register(rateLimit, {
        max: 100, // 100 requests
        timeWindow: '1 minute',
        keyGenerator: (request) => {
          // Rate limit per authenticated user
          return request.user?.id || request.ip;
        },
        errorResponseBuilder: () => ({
          error: 'Too many requests, please try again later',
        }),
      });

      // POST /api/agent/chat - Chat completion with optional streaming
      fastify.post(
        '/chat',
        chatHandler(openaiApiKey, studioConversationsService),
      );

      // POST /api/agent/fetch-url - Fetch and extract content from URLs
      fastify.post('/fetch-url', fetchUrlHandler());
    },
    {
      prefix: '/api/agent',
    },
  );
};

export default fp(agentPlugin, {
  name: 'agent',
  fastify: '5.x',
});
