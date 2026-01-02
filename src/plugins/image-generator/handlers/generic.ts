import { FastifyRequest, FastifyReply } from 'fastify';
import {
  ImageGeneratorService,
  ImageSize,
} from '../../../services/image_generator';
import { ImagePromptBuilder } from '../../../services/image_generator/prompt-builder';
import { logger } from '../../../lib/logger';
import {
  UserAuthPayload,
  SYSTEM_USER_JWT_PAYLOAD,
} from '../../../authentication';

interface EntityImageParams {
  entityId: string;
}

interface EntityImageQuerystring {
  size?: ImageSize;
}

export interface EntityImageHandlerConfig<TEntity> {
  entityType: string;
  fetchEntity: (id: string, user: UserAuthPayload) => Promise<TEntity | null>;
  buildPrompt: (entity: TEntity) => string;
}

/**
 * Creates a generic image handler for any entity type
 */
export function createEntityImageHandler<TEntity>(
  imageGeneratorService: ImageGeneratorService,
  config: EntityImageHandlerConfig<TEntity>,
) {
  return async (
    request: FastifyRequest<{
      Params: EntityImageParams;
      Querystring: EntityImageQuerystring;
    }>,
    reply: FastifyReply,
  ) => {
    try {
      const { entityId } = request.params;

      // Use system user for anonymous requests to fetch entity data
      const user = request.user ?? SYSTEM_USER_JWT_PAYLOAD;

      // Fetch entity - authorization handled by service layer
      const entity = await config.fetchEntity(entityId, user);

      if (!entity) {
        return reply
          .code(404)
          .send({ error: `${config.entityType} not found` });
      }

      // Build prompt from entity data
      const prompt = config.buildPrompt(entity);

      // Generate prompt hash for cache invalidation
      const promptHash = ImagePromptBuilder.generatePromptHash(prompt);

      // Check If-None-Match header for cache revalidation
      // Browser automatically sends this with the cached ETag value
      const clientETag = request.headers['if-none-match'];
      const currentETag = `"${promptHash}"`;

      if (clientETag === currentETag) {
        // Image hasn't changed, return 304 Not Modified
        return reply.code(304).send();
      }

      // Get size from query parameter (defaults to 'list')
      const size = request.query.size || 'list';

      // Validate size parameter
      const validSizes: ImageSize[] = ['list', 'card', 'preview', 'full'];
      if (!validSizes.includes(size)) {
        return reply.code(400).send({
          error:
            'Invalid size parameter. Must be one of: list, card, preview, full',
        });
      }

      // Fetch or generate the image
      const { imageBody, contentLength } =
        await imageGeneratorService.fetchImageForEntity(
          config.entityType,
          entityId,
          promptHash,
          prompt,
          size,
        );

      // CORS headers
      const origin = request.headers.origin;
      if (origin) {
        reply.header('Access-Control-Allow-Origin', origin);
        reply.header('Access-Control-Allow-Credentials', 'true');
      }

      // ETag for cache validation - browser handles this automatically
      reply.header('ETag', currentETag);

      // Cache for 1 hour, then revalidate using ETag
      // Browser will automatically send If-None-Match on revalidation
      reply.header('Cache-Control', 'public, max-age=3600, must-revalidate');
      reply.header('Content-Type', 'image/png');
      reply.header('Content-Length', contentLength.toString());

      return reply.send(imageBody);
    } catch (err) {
      // Check if it's an authorization error
      if (
        err instanceof Error &&
        /unauthorized|not authorized/i.test(err.message)
      ) {
        return reply.code(403).send({ error: 'Forbidden' });
      }

      logger.error(
        {
          err,
          entityId: request.params.entityId,
          entityType: config.entityType,
        },
        'Failed to serve entity image',
      );
      return reply.code(500).send({ error: 'Failed to generate image' });
    }
  };
}
