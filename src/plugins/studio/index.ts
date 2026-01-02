import { FastifyPluginAsync } from 'fastify';
import fp from 'fastify-plugin';
import {
  StudioFsError,
  type StudioFsNodeInfo,
  type StudioFsService,
} from '../../services/studio_fs';

export interface StudioPluginOptions {
  studioFsService: StudioFsService;
}

type FsRootPayload = {
  id: string;
  name: string;
  path: string;
  type: 'workspace' | 'catalogs' | 'sources';
};

type FsNodePayload = {
  name: string;
  path: string;
  type: 'file' | 'directory';
  size?: number;
  mime?: string;
  revision?: string;
  modifiedAt?: string;
};

type CatalogProductListItemPayload = {
  id: string;
  name: string;
  path: string;
  origin?: 'system' | 'workspace';
  kind?: 'material' | 'service' | 'assembly';
  status?: 'draft' | 'active' | 'archived';
  categoryPath?: string;
  tags: string[];
  tagsCount: number;
  revision: string;
  modifiedAt: string;
};

const toFsRootPayload = (rootPath: string): FsRootPayload => {
  const slug = rootPath.replace(/^\//, '');
  const name =
    slug
      .split('-')
      .filter(Boolean)
      .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
      .join(' ') || 'Root';
  const type = slug === 'catalogs' ? 'catalogs' : 'workspace';

  return {
    id: slug || 'root',
    name,
    path: rootPath,
    type,
  };
};

const toFsNodePayload = (node: StudioFsNodeInfo): FsNodePayload => ({
  name: node.name,
  path: node.path,
  type: node.type === 'FOLDER' ? 'directory' : 'file',
  size: node.sizeBytes ?? undefined,
  mime: node.mimeType ?? undefined,
  revision: node.etag,
  modifiedAt:
    node.updatedAt instanceof Date
      ? node.updatedAt.toISOString()
      : node.updatedAt,
});

const studioPlugin: FastifyPluginAsync<StudioPluginOptions> = async (
  fastify,
  opts,
) => {
  const { studioFsService } = opts;

  const handleError = (reply: any, error: unknown) => {
    if (error instanceof StudioFsError) {
      return reply.code(error.statusCode).send({
        error: error.message,
        code: error.code,
      });
    }
    throw error;
  };

  fastify.register(
    async (fastify) => {
      fastify.addHook('preHandler', fastify.authenticate);

      fastify.get('/fs/roots', async (request, reply) => {
        try {
          const { workspaceId } = request.query as { workspaceId?: string };
          const roots = await studioFsService.roots(
            workspaceId || '',
            request.user,
          );
          return {
            roots: roots.map((root) => toFsRootPayload(root)),
          };
        } catch (error) {
          return handleError(reply, error);
        }
      });

      fastify.post('/fs/list', async (request, reply) => {
        try {
          const { workspaceId, path } = request.body as {
            workspaceId?: string;
            path?: string;
          };
          const items = await studioFsService.list(
            { workspaceId: workspaceId || '', path: path || '' },
            request.user,
          );
          return {
            items: items.map((item) => toFsNodePayload(item)),
          };
        } catch (error) {
          return handleError(reply, error);
        }
      });

      fastify.post('/fs/read', async (request, reply) => {
        try {
          const { workspaceId, path } = request.body as {
            workspaceId?: string;
            path?: string;
          };
          const result = await studioFsService.read(
            { workspaceId: workspaceId || '', path: path || '' },
            request.user,
          );
          return {
            content: result.content,
            mime: result.mimeType ?? null,
            mimeType: result.mimeType ?? null,
            etag: result.etag,
          };
        } catch (error) {
          return handleError(reply, error);
        }
      });

      fastify.post('/fs/write', async (request, reply) => {
        try {
          const { workspaceId, path, content, mimeType, expectedEtag } =
            request.body as {
              workspaceId?: string;
              path?: string;
              content?: string;
              mimeType?: string | null;
              expectedEtag?: string | null;
            };
          return await studioFsService.write(
            {
              workspaceId: workspaceId || '',
              path: path || '',
              content: content || '',
              mimeType: mimeType ?? null,
              expectedEtag: expectedEtag ?? null,
            },
            request.user,
          );
        } catch (error) {
          return handleError(reply, error);
        }
      });

      fastify.post('/fs/upload', async (request, reply) => {
        try {
          const { workspaceId, path, bytes, mimeType, expectedEtag } =
            request.body as {
              workspaceId?: string;
              path?: string;
              bytes?: string;
              mimeType?: string | null;
              expectedEtag?: string | null;
            };
          return await studioFsService.upload(
            {
              workspaceId: workspaceId || '',
              path: path || '',
              bytes: bytes || '',
              mimeType: mimeType ?? null,
              expectedEtag: expectedEtag ?? null,
            },
            request.user,
          );
        } catch (error) {
          return handleError(reply, error);
        }
      });

      fastify.post('/fs/mkdir', async (request, reply) => {
        try {
          const { workspaceId, path } = request.body as {
            workspaceId?: string;
            path?: string;
          };
          return await studioFsService.mkdir(
            { workspaceId: workspaceId || '', path: path || '' },
            request.user,
          );
        } catch (error) {
          return handleError(reply, error);
        }
      });

      fastify.post('/fs/move', async (request, reply) => {
        try {
          const { workspaceId, from, to } = request.body as {
            workspaceId?: string;
            from?: string;
            to?: string;
          };
          return await studioFsService.move(
            { workspaceId: workspaceId || '', from: from || '', to: to || '' },
            request.user,
          );
        } catch (error) {
          return handleError(reply, error);
        }
      });

      fastify.post('/fs/delete', async (request, reply) => {
        try {
          const { workspaceId, path } = request.body as {
            workspaceId?: string;
            path?: string;
          };
          return await studioFsService.delete(
            { workspaceId: workspaceId || '', path: path || '' },
            request.user,
          );
        } catch (error) {
          return handleError(reply, error);
        }
      });

      fastify.post('/catalogs', async (request, reply) => {
        try {
          const { workspaceId, slug, name } = request.body as {
            workspaceId?: string;
            slug?: string;
            name?: string | null;
          };
          const result = await studioFsService.createCatalog(
            {
              workspaceId: workspaceId || '',
              slug: slug || '',
              name: name ?? null,
            },
            request.user,
          );
          const resolvedSlug =
            result.catalogPath.split('/').filter(Boolean).pop() || '';
          return {
            path: result.catalogPath,
            slug: resolvedSlug,
            catalogPath: result.catalogPath,
          };
        } catch (error) {
          return handleError(reply, error);
        }
      });

      fastify.post('/catalogs/validate', async (request, reply) => {
        try {
          const { workspaceId, catalogPath, path } = request.body as {
            workspaceId?: string;
            catalogPath?: string;
            path?: string;
          };
          const resolvedPath = catalogPath || path || '';
          const result = await studioFsService.validateCatalog(
            {
              workspaceId: workspaceId || '',
              catalogPath: resolvedPath,
            },
            request.user,
          );
          return {
            valid: result.errors.length === 0,
            errors: result.errors,
            warnings: result.warnings,
          };
        } catch (error) {
          return handleError(reply, error);
        }
      });

      fastify.post('/catalogs/preview', async (request, reply) => {
        try {
          const { workspaceId, catalogPath, path } = request.body as {
            workspaceId?: string;
            catalogPath?: string;
            path?: string;
          };
          const resolvedPath = catalogPath || path || '';
          return await studioFsService.previewCatalog(
            {
              workspaceId: workspaceId || '',
              catalogPath: resolvedPath,
            },
            request.user,
          );
        } catch (error) {
          return handleError(reply, error);
        }
      });

      fastify.post('/catalogs/compile', async (request, reply) => {
        try {
          const { workspaceId, catalogPath, path } = request.body as {
            workspaceId?: string;
            catalogPath?: string;
            path?: string;
          };
          const resolvedPath = catalogPath || path || '';
          return await studioFsService.compileCatalog(
            {
              workspaceId: workspaceId || '',
              catalogPath: resolvedPath,
            },
            request.user,
          );
        } catch (error) {
          return handleError(reply, error);
        }
      });

      // Catalog product listing (for /app/:workspaceId/products)
      // Returns parsed product summaries (id/name/kind/tags) with pagination in one call.
      const listCatalogProductsHandler = async (request: any, reply: any) => {
        try {
          const { workspaceId, catalogPath, query, kind, status, page } =
            request.body as {
              workspaceId?: string;
              catalogPath?: string | null;
              query?: string | null;
              kind?: 'material' | 'service' | 'assembly' | null;
              status?: 'draft' | 'active' | 'archived' | null;
              page?: { number?: number; size?: number } | null;
            };

          const result = await studioFsService.listCatalogProducts(
            {
              workspaceId: workspaceId || '',
              catalogPath: catalogPath ?? null,
              filter: {
                text: query ?? null,
                kind: kind ?? null,
                status: status ?? null,
              },
              page: {
                number: page?.number ?? null,
                size: page?.size ?? null,
              },
            },
            request.user,
          );

          const items: CatalogProductListItemPayload[] = result.items.map(
            (item) => ({
              id: item.id,
              name: item.name,
              path: item.path,
              origin: item.origin ?? 'workspace',
              kind: item.kind,
              status: item.status,
              categoryPath: item.categoryPath,
              tags: item.tags ?? [],
              tagsCount: item.tagsCount,
              revision: item.etag,
              modifiedAt: item.updatedAt.toISOString(),
            }),
          );

          return {
            catalogPath: result.catalogPath,
            items,
            page: result.page,
          };
        } catch (error) {
          return handleError(reply, error);
        }
      };

      fastify.post('/catalog/products/list', listCatalogProductsHandler);
      fastify.post('/catalog/products', listCatalogProductsHandler);
    },
    { prefix: '/api/studio' },
  );
};

export default fp(studioPlugin, {
  name: 'studio',
  fastify: '5.x',
});
