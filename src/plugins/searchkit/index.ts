import { FastifyPluginAsync } from 'fastify';
import {
  OpenSearchService,
  OpenSearchServiceError,
} from '../../services/opensearch';
import { AuthZ } from '../../lib/authz';
import { ANON_USER_AUTH_PAYLOAD } from '../../authentication';

interface SearchKitOptions {
  openSearchService: OpenSearchService;
  authZ: AuthZ;
}

const getIndexName = (body: unknown): string | undefined => {
  if (Array.isArray(body) && body[0]) {
    return body[0].indexName as string | undefined;
  }
  if (body && typeof body === 'object' && 'indexName' in body) {
    return (body as { indexName?: string }).indexName;
  }
  return undefined;
};

const searchKitPlugin: FastifyPluginAsync<SearchKitOptions> = async (
  fastify,
  opts,
) => {
  fastify.post(
    '/api/search/_msearch',
    { onRequest: [fastify.authenticate] },
    async (request, reply) => {
      const body = request.body;
      const indexName = getIndexName(body);

      if (!indexName) {
        return reply.code(400).send({ error: 'Missing index name' });
      }

      // Validate index exists
      const index = opts.openSearchService.getIndex(indexName);
      if (!index) {
        return reply.code(400).send({ error: 'Invalid index' });
      }

      fastify.log.info(
        { body, user: request?.user?.id, indexName },
        'Processing SearchKit request',
      );

      try {
        return await opts.openSearchService.handleInstantSearchRequest(
          indexName,
          body,
          request.user || ANON_USER_AUTH_PAYLOAD,
        );
      } catch (error) {
        if (error instanceof OpenSearchServiceError) {
          return reply.code(error.statusCode).send({
            error:
              error.statusCode === 403
                ? 'Forbidden'
                : error.statusCode === 400
                  ? 'Bad Request'
                  : 'Error',
            message: error.message,
          });
        }
        throw error;
      }
    },
  );
};

export default searchKitPlugin;
