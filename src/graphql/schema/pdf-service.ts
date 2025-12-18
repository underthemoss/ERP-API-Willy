import { mutationField, nonNull, objectType, stringArg } from 'nexus';

/**
 * Result type for create_pdf mutation.
 */
export const CreatePdfResult = objectType({
  name: 'CreatePdfResult',
  definition(t) {
    t.nonNull.boolean('success');
    t.string('error_message');
  },
});

/**
 * Mutation: create_pdf
 * Generates and saves a PDF for a given entity and file path.
 * Currently only supports purchase orders (entity_id = purchase order id).
 */
export const createPdf = mutationField('createPdfFromPageAndAttachToEntityId', {
  type: 'CreatePdfResult',
  description: 'Generate and save a PDF for an entity by path and entity_id',
  args: {
    workspaceId: nonNull(stringArg()),
    path: nonNull(stringArg()),
    entity_id: nonNull(stringArg()),
    file_name: stringArg(),
  },
  async resolve(_, args, ctx) {
    const { workspaceId, path, entity_id, file_name } = args;
    if (!path) {
      return { success: false, error_message: 'path is required' };
    }
    if (!entity_id) {
      return { success: false, error_message: 'entity_id is required' };
    }
    if (!ctx.user) {
      return { success: false, error_message: 'Authentication required' };
    }
    try {
      // Currently only supports purchase orders
      await ctx.services.pdfService.generatePdFAndLinkToEntity(
        entity_id,
        ctx.user,
        ctx.userToken || '',
        path,
        workspaceId,
        file_name ?? undefined,
      );
      return { success: true, error_message: null };
    } catch (err: any) {
      return { success: false, error_message: err?.message || 'Unknown error' };
    }
  },
});
