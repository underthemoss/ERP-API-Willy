import { FastifyPluginAsync, FastifyRequest, FastifyReply } from 'fastify';
import fp from 'fastify-plugin';
import { EnvConfig } from '../../../config';
import { validateHMACSignature } from './utils/hmac';
import { postLoginHandler, PostLoginHandlerDeps } from './handlers/post-login';
import { HMACConfig, WebhookError } from './types';
import { logger } from '../../../lib/logger';

export interface Auth0WebhooksPluginOptions {
  envConfig: EnvConfig;
  services: PostLoginHandlerDeps;
}

/**
 * Fastify plugin for Auth0 webhooks
 * Registers REST API endpoints under /webhooks/auth0
 */
const auth0WebhooksPlugin: FastifyPluginAsync<
  Auth0WebhooksPluginOptions
> = async (fastify, opts) => {
  const { envConfig, services } = opts;
  if (!envConfig.AUTH0_WEBHOOK_HMAC_SECRET) {
    throw Error('AUTH0_WEBHOOK_HMAC_SECRET not provided');
  }

  // Get HMAC configuration from environment
  const hmacConfig: HMACConfig = {
    secret: envConfig.AUTH0_WEBHOOK_HMAC_SECRET,
    algorithm: 'sha256',
    headerName: 'x-webhook-signature',
  };

  // Middleware to validate HMAC signature
  const validateWebhookSignature = async (
    request: FastifyRequest,
    reply: FastifyReply,
  ) => {
    // Skip validation in test mode
    if (envConfig.IN_TEST_MODE) {
      return;
    }

    const isValid = validateHMACSignature(request, hmacConfig);

    if (!isValid) {
      logger.warn({
        msg: 'Invalid webhook signature',
        path: request.url,
        headers: request.headers,
      });

      const errorResponse: WebhookError = {
        error: 'Invalid webhook signature',
        code: 'INVALID_SIGNATURE',
      };

      reply.code(401).send(errorResponse);
      throw new Error('Invalid webhook signature');
    }
  };

  // Register webhook routes with prefix
  fastify.register(
    async (fastify) => {
      // Add preParsing hook to capture raw body for HMAC validation
      fastify.addHook('preParsing', async (request, reply, payload) => {
        // Store raw body for HMAC validation
        const chunks: Buffer[] = [];
        for await (const chunk of payload) {
          chunks.push(chunk);
        }
        const rawBody = Buffer.concat(chunks).toString('utf8');
        (request as any).rawBody = rawBody;

        // Return the raw body as a stream for Fastify to parse
        const { Readable } = require('stream');
        return Readable.from([rawBody]);
      });

      // Add preHandler hook for all routes in this context
      fastify.addHook('preHandler', validateWebhookSignature);

      // POST /webhooks/auth0/post-login/v1
      fastify.post(
        '/post-login/v1',
        {
          schema: {
            description: 'Webhook endpoint for post-login events',
            tags: ['webhooks', 'auth0'],
            body: {
              type: 'object',
              required: ['user_id', 'email', 'timestamp', 'event_type'],
              properties: {
                // User identification
                user_id: { type: 'string' },
                email: { type: 'string' },
                email_verified: { type: 'boolean' },

                // User profile
                name: { type: 'string' },
                given_name: { type: 'string' },
                family_name: { type: 'string' },
                nickname: { type: 'string' },
                picture: { type: 'string' },

                // Company and ES user information
                company_id: { type: 'string' },
                es_user_id: { type: 'string' },

                // Event metadata
                timestamp: { type: 'string' },
                event_type: { type: 'string' },

                // Connection info
                connection: { type: 'string' },
                connection_id: { type: 'string' },

                // Client info
                client_id: { type: 'string' },
                client_name: { type: 'string' },

                // Session info
                session_id: { type: 'string' },
                ip: { type: 'string' },
                user_agent: { type: 'string' },

                // Location information
                location: {
                  type: 'object',
                  properties: {
                    city: { type: 'string' },
                    country_code: { type: 'string' },
                    country_code3: { type: 'string' },
                    country_name: { type: 'string' },
                    continent_code: { type: 'string' },
                    subdivision_code: { type: 'string' },
                    subdivision_name: { type: 'string' },
                    latitude: { type: ['number', 'null'] },
                    longitude: { type: ['number', 'null'] },
                    timezone: { type: 'string' },
                  },
                },

                // Optional metadata
                user_metadata: { type: 'object' },
                app_metadata: { type: 'object' },
              },
            },
            response: {
              200: {
                type: 'object',
                properties: {
                  success: { type: 'boolean' },
                  message: { type: 'string' },
                  data: {
                    type: 'object',
                    additionalProperties: true,
                  },
                },
              },
              401: {
                type: 'object',
                properties: {
                  error: { type: 'string' },
                  code: { type: 'string' },
                },
              },
              500: {
                type: 'object',
                properties: {
                  error: { type: 'string' },
                  code: { type: 'string' },
                  details: { type: 'string' },
                },
              },
            },
          },
        },
        await postLoginHandler(services),
      );

      // Add more webhook endpoints here as needed
      // fastify.post('/pre-registration/v1', preRegistrationHandler);
      // fastify.post('/post-change-password/v1', postChangePasswordHandler);
    },
    {
      prefix: '/webhooks/auth0',
    },
  );

  logger.info('Auth0 webhooks plugin registered');
};

export default fp(auth0WebhooksPlugin, {
  name: 'auth0-webhooks',
  fastify: '5.x',
});
