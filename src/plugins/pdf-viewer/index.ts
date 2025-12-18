import { FastifyRequest, FastifyReply, FastifyPluginAsync } from 'fastify';
import fp from 'fastify-plugin';
import { type EnvConfig } from '../../config';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { logger } from '../../lib/logger';
import { FileService } from '../../services/file_service';
import { SYSTEM_USER_JWT_PAYLOAD } from '../../authentication';

interface GetPdfQuery {
  file_key: string;
  quote_id: string;
  workspace_id: string;
}

const plugin: FastifyPluginAsync<{
  envConfig: EnvConfig;
  fileService: FileService;
}> = async (fastify, opts) => {
  const { envConfig, fileService } = opts;

  // Initialize S3 client
  const s3Config: any = {
    region: envConfig.FILE_SERVICE_REGION || 'us-west-2',
    credentials: {
      accessKeyId: envConfig.FILE_SERVICE_KEY,
      secretAccessKey: envConfig.FILE_SERVICE_SECRET,
    },
  };

  if (envConfig.FILE_SERVICE_ENDPOINT) {
    s3Config.endpoint = envConfig.FILE_SERVICE_ENDPOINT;
    s3Config.forcePathStyle = true;
  }

  const s3Client = new S3Client(s3Config);
  const bucket = envConfig.FILE_SERVICE_BUCKET;

  // Route to serve PDF files by file_key
  fastify.get<{ Querystring: GetPdfQuery }>(
    '/api/pdf',
    {
      schema: {
        querystring: {
          type: 'object',
          required: ['file_key', 'quote_id', 'workspace_id'],
          properties: {
            file_key: { type: 'string' },
            quote_id: { type: 'string' },
            workspace_id: { type: 'string' },
          },
        },
      },
    },
    async (
      request: FastifyRequest<{ Querystring: GetPdfQuery }>,
      reply: FastifyReply,
    ) => {
      const { file_key, quote_id, workspace_id } = request.query;

      if (!file_key || !quote_id || !workspace_id) {
        return reply.code(400).send({
          error: 'file_key, quote_id, and workspace_id are required',
        });
      }

      try {
        // Validate that the file belongs to the quote
        logger.info(
          { file_key, quote_id, workspace_id },
          'Validating PDF access',
        );

        const files = await fileService.getFilesByParentEntity(
          {
            workspace_id,
            parent_entity_id: quote_id,
          },
          SYSTEM_USER_JWT_PAYLOAD,
        );

        const matchingFile = files.find((f: any) => f.file_key === file_key);

        if (!matchingFile) {
          logger.warn(
            { file_key, quote_id, workspace_id },
            'File validation failed',
          );
          return reply.code(403).send({ error: 'Invalid file credentials' });
        }

        logger.info({ file_key, quote_id }, 'Fetching PDF from S3');

        // Get the file from S3
        const command = new GetObjectCommand({
          Bucket: bucket,
          Key: file_key,
        });

        const response = await s3Client.send(command);

        if (!response.Body) {
          return reply.code(404).send({ error: 'File not found' });
        }

        // Set appropriate headers
        reply.header('Content-Type', response.ContentType || 'application/pdf');
        reply.header('Content-Length', response.ContentLength || 0);

        // Set Content-Disposition to inline so the PDF opens in browser
        reply.header('Content-Disposition', 'inline');

        // Stream the file to the response
        return reply.send(response.Body);
      } catch (error: any) {
        logger.error({ error, file_key }, 'Error fetching PDF from S3');

        if (error.name === 'NoSuchKey') {
          return reply.code(404).send({ error: 'File not found' });
        }

        return reply.code(500).send({ error: 'Failed to retrieve file' });
      }
    },
  );
};

export const pdfViewerPlugin = fp(plugin);
