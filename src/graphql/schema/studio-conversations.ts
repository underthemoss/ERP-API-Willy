import {
  arg,
  enumType,
  extendType,
  inputObjectType,
  nonNull,
  objectType,
  stringArg,
} from 'nexus';
import { PageInfoInput, PaginationInfo } from './common';

export const StudioConversationRoleEnum = enumType({
  name: 'StudioConversationRole',
  members: [
    { name: 'SYSTEM', value: 'system' },
    { name: 'USER', value: 'user' },
    { name: 'ASSISTANT', value: 'assistant' },
    { name: 'TOOL', value: 'tool' },
  ],
});

export const StudioConversation = objectType({
  name: 'StudioConversation',
  definition(t) {
    t.nonNull.string('id');
    t.nonNull.string('workspaceId');
    t.string('title');
    t.string('pinnedCatalogPath');
    t.field('workingSet', { type: 'JSONObject' });
    t.nonNull.int('messageCount');
    t.field('lastMessageAt', { type: 'DateTime' });
    t.nonNull.field('createdAt', { type: 'DateTime' });
    t.nonNull.field('updatedAt', { type: 'DateTime' });
    t.nonNull.string('createdBy');
    t.nonNull.string('updatedBy');
  },
});

export const StudioConversationMessage = objectType({
  name: 'StudioConversationMessage',
  definition(t) {
    t.nonNull.string('id');
    t.nonNull.string('conversationId');
    t.nonNull.field('role', { type: StudioConversationRoleEnum });
    t.nonNull.string('content');
    t.nonNull.field('createdAt', { type: 'DateTime' });
    t.string('createdBy');
    t.field('metadata', { type: 'JSONObject' });
  },
});

export const ListStudioConversationsFilter = inputObjectType({
  name: 'ListStudioConversationsFilter',
  definition(t) {
    t.nonNull.string('workspaceId');
    t.string('searchTerm');
  },
});

export const StudioConversationListResult = objectType({
  name: 'StudioConversationListResult',
  definition(t) {
    t.nonNull.list.nonNull.field('items', { type: StudioConversation });
    t.nonNull.field('page', { type: PaginationInfo });
  },
});

export const StudioConversationMessageListResult = objectType({
  name: 'StudioConversationMessageListResult',
  definition(t) {
    t.nonNull.list.nonNull.field('items', { type: StudioConversationMessage });
    t.nonNull.field('page', { type: PaginationInfo });
  },
});

export const CreateStudioConversationInput = inputObjectType({
  name: 'CreateStudioConversationInput',
  definition(t) {
    t.nonNull.string('workspaceId');
    t.string('title');
    t.string('pinnedCatalogPath');
    t.field('workingSet', { type: 'JSONObject' });
  },
});

export const UpdateStudioConversationInput = inputObjectType({
  name: 'UpdateStudioConversationInput',
  definition(t) {
    t.string('title');
    t.string('pinnedCatalogPath');
    t.field('workingSet', { type: 'JSONObject' });
  },
});

export const AddStudioConversationMessageInput = inputObjectType({
  name: 'AddStudioConversationMessageInput',
  definition(t) {
    t.nonNull.string('conversationId');
    t.nonNull.field('role', { type: StudioConversationRoleEnum });
    t.nonNull.string('content');
    t.field('metadata', { type: 'JSONObject' });
  },
});

export const StudioConversationsQuery = extendType({
  type: 'Query',
  definition(t) {
    t.field('getStudioConversationById', {
      type: StudioConversation,
      args: { id: nonNull(stringArg()) },
      resolve: (_root, { id }, ctx) =>
        ctx.services.studioConversationsService.getConversationById(
          id,
          ctx.user,
        ),
    });

    t.field('listStudioConversations', {
      type: StudioConversationListResult,
      args: {
        filter: nonNull(arg({ type: ListStudioConversationsFilter })),
        page: arg({ type: PageInfoInput }),
      },
      resolve: (_root, { filter, page }, ctx) =>
        ctx.services.studioConversationsService.listConversations(
          {
            filter: {
              workspaceId: filter.workspaceId,
              searchTerm: filter.searchTerm || undefined,
            },
            page: page
              ? (Object.fromEntries(
                  Object.entries(page).map(([key, value]) => [
                    key,
                    value === null ? undefined : value,
                  ]),
                ) as any)
              : undefined,
          },
          ctx.user,
        ),
    });

    t.field('listStudioConversationMessages', {
      type: StudioConversationMessageListResult,
      args: {
        conversationId: nonNull(stringArg()),
        page: arg({ type: PageInfoInput }),
      },
      resolve: (_root, { conversationId, page }, ctx) =>
        ctx.services.studioConversationsService.listMessages(
          {
            conversationId,
            page: page
              ? (Object.fromEntries(
                  Object.entries(page).map(([key, value]) => [
                    key,
                    value === null ? undefined : value,
                  ]),
                ) as any)
              : undefined,
          },
          ctx.user,
        ),
    });
  },
});

export const StudioConversationsMutation = extendType({
  type: 'Mutation',
  definition(t) {
    t.nonNull.field('createStudioConversation', {
      type: StudioConversation,
      args: {
        input: nonNull(arg({ type: CreateStudioConversationInput })),
      },
      resolve: (_root, { input }, ctx) =>
        ctx.services.studioConversationsService.createConversation(
          {
            workspaceId: input.workspaceId,
            title: input.title ?? null,
            pinnedCatalogPath: input.pinnedCatalogPath ?? null,
            workingSet: (input.workingSet as any) ?? null,
          },
          ctx.user,
        ),
    });

    t.nonNull.field('updateStudioConversation', {
      type: StudioConversation,
      args: {
        id: nonNull(stringArg()),
        input: nonNull(arg({ type: UpdateStudioConversationInput })),
      },
      resolve: (_root, { id, input }, ctx) =>
        ctx.services.studioConversationsService.updateConversation(
          id,
          {
            title: input.title ?? null,
            pinnedCatalogPath: input.pinnedCatalogPath ?? null,
            workingSet: (input.workingSet as any) ?? null,
          },
          ctx.user,
        ),
    });

    t.nonNull.boolean('deleteStudioConversation', {
      args: { id: nonNull(stringArg()) },
      resolve: (_root, { id }, ctx) =>
        ctx.services.studioConversationsService.deleteConversation(
          id,
          ctx.user,
        ),
    });

    t.nonNull.field('addStudioConversationMessage', {
      type: StudioConversationMessage,
      args: {
        input: nonNull(arg({ type: AddStudioConversationMessageInput })),
      },
      resolve: (_root, { input }, ctx) =>
        ctx.services.studioConversationsService.addMessage(
          {
            conversationId: input.conversationId,
            role: input.role as any,
            content: input.content,
            metadata: (input.metadata as any) ?? null,
          },
          ctx.user,
        ),
    });
  },
});
