import {
  objectType,
  extendType,
  stringArg,
  nonNull,
  enumType,
  intArg,
  list,
  arg,
} from 'nexus';
import { PaginationInfo } from './common';

export const SearchUserStateFavorite = objectType({
  name: 'SearchUserStateFavorite',
  sourceType: {
    module: require.resolve('../../services/search/search-user-state-model'),
    export: 'SearchUserStateFavorite',
  },
  definition(t) {
    t.nonNull.string('searchDocumentId');
    t.nonNull.string('addedAt', {
      resolve: (fav: any) => fav.addedAt.toISOString(),
    });
    t.field('searchDocument', {
      type: SearchDocument,
      resolve: async (fav: any, _args, ctx) => {
        return ctx.dataloaders.searchDocuments.getSearchDocumentsById.load(
          fav.searchDocumentId,
        );
      },
    });
  },
});

export const SearchUserStateRecent = objectType({
  name: 'SearchUserStateRecent',
  sourceType: {
    module: require.resolve('../../services/search/search-user-state-model'),
    export: 'SearchUserStateRecent',
  },
  definition(t) {
    t.nonNull.string('searchDocumentId');
    t.nonNull.string('accessedAt', {
      resolve: (recent: any) => recent.accessedAt.toISOString(),
    });
    t.field('searchDocument', {
      type: SearchDocument,
      resolve: async (recent: any, _args, ctx) => {
        return ctx.dataloaders.searchDocuments.getSearchDocumentsById.load(
          recent.searchDocumentId,
        );
      },
    });
  },
});

export const SearchUserState = objectType({
  name: 'SearchUserState',
  sourceType: {
    module: require.resolve('../../services/search/search-user-state-model'),
    export: 'SearchUserState',
  },
  definition(t) {
    t.nonNull.id('id', {
      resolve: (state: any) => state._id,
    });
    t.nonNull.string('userId');
    t.nonNull.string('workspaceId');
    t.nonNull.list.nonNull.field('favorites', {
      type: SearchUserStateFavorite,
    });
    t.nonNull.list.nonNull.field('recents', { type: SearchUserStateRecent });
    t.nonNull.string('createdAt', {
      resolve: (state: any) => state.createdAt.toISOString(),
    });
    t.nonNull.string('updatedAt', {
      resolve: (state: any) => state.updatedAt.toISOString(),
    });
  },
});

export const SearchableCollectionType = enumType({
  name: 'SearchableCollectionType',
  members: [
    'contacts',
    'projects',
    'sales_orders',
    'purchase_orders',
    'invoices',
    'notes',
  ],
  description: 'Collections that can be searched',
});

export const SearchDocument = objectType({
  name: 'SearchDocument',
  sourceType: {
    module: require.resolve('../../services/search/types'),
    export: 'SearchDocument',
  },
  definition(t) {
    t.nonNull.id('id', {
      resolve: (doc: any) => doc._id,
    });
    t.nonNull.string('documentId');
    t.nonNull.field('collection', { type: SearchableCollectionType });
    t.nonNull.string('workspaceId');
    t.nonNull.string('title');
    t.string('subtitle');
    t.nonNull.string('documentType');
    t.nonNull.field('metadata', {
      type: 'JSON',
      resolve: (doc: any) => doc.metadata || {},
    });
    t.nonNull.string('createdAt', {
      resolve: (doc: any) => doc.createdAt.toISOString(),
    });
    t.nonNull.string('updatedAt', {
      resolve: (doc: any) => doc.updatedAt.toISOString(),
    });
  },
});

export const SearchDocumentsResult = objectType({
  name: 'SearchDocumentsResult',
  definition(t) {
    t.nonNull.list.nonNull.field('documents', { type: SearchDocument });
    t.nonNull.int('total');
    t.nonNull.field('page', { type: PaginationInfo });
  },
});

export const Query = extendType({
  type: 'Query',
  definition(t) {
    t.nonNull.field('searchDocuments', {
      type: SearchDocumentsResult,
      args: {
        workspaceId: nonNull(stringArg()),
        searchText: stringArg(),
        collections: list(nonNull(arg({ type: SearchableCollectionType }))),
        page: intArg({ default: 1 }),
        pageSize: intArg({ default: 20 }),
      },
      resolve: async (root, args, ctx) => {
        if (!ctx.user) {
          throw new Error('Unauthorized');
        }

        // Note: Search is scoped to the workspaceId provided in args
        // By default, search across all collections if none specified
        const limit = Math.min(args.pageSize || 20, 100); // Cap at 100
        const skip = ((args.page || 1) - 1) * limit;

        const result = await ctx.services.searchService.search(
          {
            workspaceId: args.workspaceId,
            searchText: args.searchText || undefined,
            collections: args.collections || undefined, // undefined = search all collections
            limit,
            skip,
          },
          ctx.user,
        );

        const totalPages = Math.ceil(result.total / limit);

        return {
          documents: result.documents,
          total: result.total,
          page: {
            number: args.page || 1,
            size: limit,
            totalItems: result.total,
            totalPages,
          },
        };
      },
    });

    t.field('getSearchDocumentById', {
      type: SearchDocument,
      args: {
        id: nonNull(stringArg()),
      },
      resolve: async (root, args, ctx) => {
        if (!ctx.user) {
          throw new Error('Unauthorized');
        }

        // Authorization handled in service layer
        const document = await ctx.services.searchService.getById(
          args.id,
          ctx.user,
        );

        return document;
      },
    });

    t.field('getSearchDocumentByDocumentId', {
      type: SearchDocument,
      args: {
        documentId: nonNull(stringArg()),
      },
      resolve: async (root, args, ctx) => {
        if (!ctx.user) {
          throw new Error('Unauthorized');
        }

        // Authorization handled in service layer
        const document = await ctx.services.searchService.getByDocumentId(
          args.documentId,
          ctx.user,
        );

        return document;
      },
    });

    t.nonNull.list.field('getBulkSearchDocumentsById', {
      type: SearchDocument,
      args: {
        ids: nonNull(list(nonNull(stringArg()))),
      },
      resolve: async (root, args, ctx) => {
        if (!ctx.user) {
          throw new Error('Unauthorized');
        }

        // Authorization handled in service layer
        const documents = await ctx.services.searchService.getBulkByIds(
          args.ids,
          ctx.user,
        );

        return documents;
      },
    });

    t.field('getSearchUserState', {
      type: SearchUserState,
      args: {
        workspaceId: nonNull(stringArg()),
      },
      resolve: async (root, args, ctx) => {
        if (!ctx.user) {
          throw new Error('Unauthorized');
        }

        return ctx.services.searchService.getUserState(
          args.workspaceId,
          ctx.user,
        );
      },
    });
  },
});

export const Mutation = extendType({
  type: 'Mutation',
  definition(t) {
    t.nonNull.field('toggleSearchFavorite', {
      type: SearchUserState,
      args: {
        workspaceId: nonNull(stringArg()),
        searchDocumentId: nonNull(stringArg()),
      },
      resolve: async (root, args, ctx) => {
        if (!ctx.user) {
          throw new Error('Unauthorized');
        }

        return ctx.services.searchService.toggleFavorite(
          args.workspaceId,
          args.searchDocumentId,
          ctx.user,
        );
      },
    });

    t.nonNull.field('addSearchRecent', {
      type: SearchUserState,
      args: {
        workspaceId: nonNull(stringArg()),
        searchDocumentId: nonNull(stringArg()),
      },
      resolve: async (root, args, ctx) => {
        if (!ctx.user) {
          throw new Error('Unauthorized');
        }

        return ctx.services.searchService.addRecent(
          args.workspaceId,
          args.searchDocumentId,
          ctx.user,
        );
      },
    });

    t.nonNull.field('removeSearchRecent', {
      type: SearchUserState,
      args: {
        workspaceId: nonNull(stringArg()),
        searchDocumentId: nonNull(stringArg()),
      },
      resolve: async (root, args, ctx) => {
        if (!ctx.user) {
          throw new Error('Unauthorized');
        }

        return ctx.services.searchService.removeRecent(
          args.workspaceId,
          args.searchDocumentId,
          ctx.user,
        );
      },
    });

    t.nonNull.field('clearSearchRecents', {
      type: SearchUserState,
      args: {
        workspaceId: nonNull(stringArg()),
      },
      resolve: async (root, args, ctx) => {
        if (!ctx.user) {
          throw new Error('Unauthorized');
        }

        return ctx.services.searchService.clearRecents(
          args.workspaceId,
          ctx.user,
        );
      },
    });
  },
});
