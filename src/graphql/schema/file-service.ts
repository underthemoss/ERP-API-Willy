import { GraphQLError } from 'graphql';
import {
  objectType,
  extendType,
  stringArg,
  nonNull,
  enumType,
  arg,
  idArg,
} from 'nexus';
import { RESOURCE_TYPES } from '../../lib/authz';

export const ResourceTypes = enumType({
  sourceType: {
    export: 'RESOURCE_TYPES',
    module: require.resolve('../../lib/authz'),
  },
  name: 'ResourceTypes',
  members: RESOURCE_TYPES,
});

export const FileUrlType = enumType({
  name: 'FileUrlType',
  members: [
    { name: 'INLINE', value: 'inline' },
    { name: 'ATTACHMENT', value: 'attachment' },
  ],
});

export const File = objectType({
  name: 'File',
  sourceType: {
    export: 'FileDoc',
    module: require.resolve('../../services/file_service'),
  },
  definition(t) {
    t.nonNull.string('id', { resolve: (file) => file._id });
    t.nonNull.string('workspace_id');
    t.nonNull.string('parent_entity_id');
    t.nonNull.string('file_key');
    t.nonNull.string('file_name');
    t.nonNull.int('file_size');
    t.nonNull.string('mime_type');
    t.field('metadata', { type: 'JSON' });
    t.nonNull.string('created_at');
    t.nonNull.string('created_by');
    t.nonNull.string('updated_at');
    t.nonNull.string('updated_by');
    t.nonNull.boolean('deleted');
    t.nonNull.string('url', {
      args: {
        type: FileUrlType,
      },
      async resolve(file, args, ctx) {
        return ctx.services.fileService.getSignedReadUrl({
          key: file.file_key,
          file_name: file.file_name,
          type: args.type || undefined,
        });
      },
    });
    t.field('created_by_user', {
      type: 'User',
      async resolve(file, _args, ctx) {
        if (!file.created_by) return null;
        return ctx.dataloaders.users.getUsersById.load(file.created_by);
      },
    });
    t.field('updated_by_user', {
      type: 'User',
      async resolve(file, _args, ctx) {
        if (!file.updated_by) return null;
        return ctx.dataloaders.users.getUsersById.load(file.updated_by);
      },
    });
  },
});

export const SignedUploadUrl = objectType({
  name: 'SignedUploadUrl',
  definition(t) {
    t.nonNull.string('url');
    t.nonNull.string('key');
  },
});

export const SupportedContentTypeEnum = enumType({
  name: 'SupportedContentType',
  members: [
    { name: 'IMAGE_JPEG', value: 'IMAGE_JPEG' },
    { name: 'IMAGE_PNG', value: 'IMAGE_PNG' },
    { name: 'APPLICATION_PDF', value: 'APPLICATION_PDF' },
    { name: 'TEXT_CSV', value: 'TEXT_CSV' },
    // add more as needed, must match service
  ],
});

export const FileServiceQuery = extendType({
  type: 'Query',
  definition(t) {
    t.nonNull.field('getSignedUploadUrl', {
      type: 'SignedUploadUrl',
      args: {
        contentType: nonNull(SupportedContentTypeEnum),
        originalFilename: stringArg(),
      },
      async resolve(_root, args, ctx) {
        if (!ctx.user) {
          throw new GraphQLError('Not authorised');
        }
        return ctx.services.fileService.getSignedUploadUrl(args.contentType, {
          originalFilename: args.originalFilename || undefined,
        });
      },
    });

    t.nonNull.list.nonNull.field('listFilesByEntityId', {
      type: 'File',
      args: {
        parent_entity_id: nonNull(stringArg()),
        workspace_id: nonNull(stringArg()),
      },
      async resolve(_root, args, ctx) {
        if (!ctx.user) {
          throw new GraphQLError('Not authorised');
        }
        return ctx.services.fileService.getFilesByParentEntity(
          {
            workspace_id: args.workspace_id,
            parent_entity_id: args.parent_entity_id,
          },
          ctx.user,
        );
      },
    });
  },
});

export const FileServiceMutation = extendType({
  type: 'Mutation',
  definition(t) {
    t.field('getSignedReadUrl', {
      type: 'String',
      args: {
        fileId: nonNull(idArg()),
        type: arg({ type: FileUrlType }),
      },
      resolve: async (_root, args, ctx) => {
        const file = await ctx.services.fileService.getFileById(
          args.fileId,
          ctx.user,
        );

        if (!file) {
          throw new GraphQLError('File not found');
        }

        return ctx.services.fileService.getSignedReadUrl({
          key: file.file_key,
          file_name: file.file_name,
          type: args.type || undefined,
        });
      },
    });

    t.nonNull.field('addFileToEntity', {
      type: 'File',
      args: {
        workspace_id: nonNull(stringArg()),
        parent_entity_id: nonNull(stringArg()),
        parent_entity_type: arg({ type: ResourceTypes }),
        file_key: nonNull(stringArg()),
        file_name: nonNull(stringArg()),
        metadata: arg({ type: 'JSON' }),
      },
      async resolve(_root, args, ctx) {
        if (!ctx.user) {
          throw new GraphQLError('Not authorised');
        }
        const fileDoc = await ctx.services.fileService.addFile(
          {
            workspace_id: args.workspace_id,
            parent_entity_id: args.parent_entity_id,
            parent_entity_type: args.parent_entity_type || undefined,
            file_key: args.file_key,
            file_name: args.file_name,
            metadata: args.metadata,
            created_by: ctx.user.id,
          },
          ctx.user,
        );
        return fileDoc;
      },
    });

    t.nonNull.field('removeFileFromEntity', {
      type: 'File',
      args: {
        file_id: nonNull(stringArg()),
      },
      async resolve(_root, args, ctx) {
        const fileDoc = await ctx.services.fileService.removeFile(
          args.file_id,
          ctx.user,
        );
        if (!fileDoc) {
          throw new GraphQLError('File not found or already deleted');
        }
        return fileDoc;
      },
    });

    t.nonNull.field('renameFile', {
      type: 'File',
      args: {
        file_id: nonNull(stringArg()),
        new_file_name: nonNull(stringArg()),
      },
      async resolve(_root, args, ctx) {
        const fileDoc = await ctx.services.fileService.renameFile(
          args.file_id,
          args.new_file_name,
          ctx.user,
        );
        if (!fileDoc) {
          throw new GraphQLError('File not found or already deleted');
        }
        return fileDoc;
      },
    });
  },
});
