import {
  objectType,
  queryField,
  mutationField,
  stringArg,
  nonNull,
  arg,
  inputObjectType,
  list,
  extendType,
} from 'nexus';

export const Note = objectType({
  name: 'Note',
  definition(t) {
    t.nonNull.string('_id');
    t.nonNull.string('company_id');
    t.nonNull.string('workspace_id');
    t.nonNull.string('parent_entity_id');
    t.nonNull.field('value', { type: 'JSON' });
    t.nonNull.field('created_at', { type: 'DateTime' });
    t.nonNull.field('updated_at', { type: 'DateTime' });
    t.nonNull.string('created_by');
    t.nonNull.string('updated_by');
    t.nonNull.boolean('deleted');
    t.field('created_by_user', {
      type: 'User',
      async resolve(note, _args, ctx) {
        if (!note.created_by) return null;
        return ctx.dataloaders.users.getUsersById.load(note.created_by);
      },
    });
    t.nonNull.list.nonNull.field('sub_notes', {
      type: 'Note',
      async resolve(note, _args, ctx) {
        // Use dataloader to get child notes by parent_entity_id
        return ctx.dataloaders.notes.bulkListNotesByParentEntityId.load(
          note._id,
        );
      },
    });
  },
});

export const NoteInput = inputObjectType({
  name: 'NoteInput',
  definition(t) {
    t.nonNull.string('workspace_id');
    t.nonNull.string('parent_entity_id');
    t.nonNull.field('value', { type: 'JSON' });
  },
});

export const NoteUpdateInput = inputObjectType({
  name: 'NoteUpdateInput',
  definition(t) {
    t.nonNull.string('id');
    t.nonNull.field('value', { type: 'JSON' });
  },
});

export const getNoteById = queryField('getNoteById', {
  type: 'Note',
  args: {
    id: nonNull(stringArg()),
  },
  async resolve(_root, args, ctx) {
    return ctx.services.notesService.getNoteById(args.id, ctx.user);
  },
});

export const listNotesByEntityId = queryField('listNotesByEntityId', {
  type: nonNull(list(nonNull('Note'))),
  args: {
    parent_entity_id: nonNull(stringArg()),
  },
  async resolve(_root, args, ctx) {
    return ctx.services.notesService.listNotesByParentEntityId(
      args.parent_entity_id,
      ctx.user,
    );
  },
});

export const createNote = mutationField('createNote', {
  type: 'Note',
  args: {
    input: nonNull(arg({ type: 'NoteInput' })),
  },
  async resolve(_root, { input }, ctx) {
    // Add company_id from context
    if (!ctx.user?.companyId) {
      throw new Error('Missing company_id in user context');
    }
    const noteInput = {
      ...input,
      company_id: ctx.user.companyId as string,
    };
    return ctx.services.notesService.createNote(noteInput, ctx.user);
  },
});

export const updateNote = mutationField('updateNote', {
  type: 'Note',
  args: {
    id: nonNull(stringArg()),
    value: nonNull(arg({ type: 'JSON' })),
  },
  async resolve(_root, { id, value }, ctx) {
    // Fetch the existing note to get required fields
    const existing = await ctx.services.notesService.batchGetNotesById(
      [id],
      ctx.user,
    );
    const note = existing[0];
    if (!note) throw new Error('Note not found');
    return ctx.services.notesService.updateNote(
      id,
      {
        value,
        workspace_id: note.workspace_id,
        parent_entity_id: note.parent_entity_id,
        deleted: note.deleted,
      },
      ctx.user,
    );
  },
});

export const deleteNote = mutationField('deleteNote', {
  type: 'Note',
  args: {
    id: nonNull(stringArg()),
  },
  async resolve(_root, { id }, ctx) {
    return ctx.services.notesService.deleteNote(id, ctx.user);
  },
});

// Extend Project type with notes field
export const ProjectNotesExtension = extendType({
  type: 'Project',
  definition(t) {
    t.nonNull.list.nonNull.field('comments', {
      type: 'Note',
      async resolve(parent, _args, ctx) {
        return ctx.services.notesService.listNotesByParentEntityId(
          parent._id,
          ctx.user,
        );
      },
    });
  },
});

// Extend SalesOrder type with notes field
export const SalesOrderNotesExtension = extendType({
  type: 'SalesOrder',
  definition(t) {
    t.nonNull.list.nonNull.field('comments', {
      type: 'Note',
      async resolve(parent, _args, ctx) {
        return ctx.services.notesService.listNotesByParentEntityId(
          parent._id,
          ctx.user,
        );
      },
    });
  },
});

// Extend PurchaseOrder type with notes field
export const PurchaseOrderNotesExtension = extendType({
  type: 'PurchaseOrder',
  definition(t) {
    t.nonNull.list.nonNull.field('comments', {
      type: 'Note',
      async resolve(parent, _args, ctx) {
        return ctx.services.notesService.listNotesByParentEntityId(
          parent._id,
          ctx.user,
        );
      },
    });
  },
});

// Extend PriceBook type with note_items field (since 'notes' already exists as a string field)
export const PriceBookNotesExtension = extendType({
  type: 'PriceBook',
  definition(t) {
    t.nonNull.list.nonNull.field('comments', {
      type: 'Note',
      async resolve(parent, _args, ctx) {
        return ctx.services.notesService.listNotesByParentEntityId(
          parent.id,
          ctx.user,
        );
      },
    });
  },
});

// Extend File type with notes field
export const FileNotesExtension = extendType({
  type: 'File',
  definition(t) {
    t.nonNull.list.nonNull.field('comments', {
      type: 'Note',
      async resolve(parent, _args, ctx) {
        // File type uses _id internally
        const fileId = (parent as any)._id;
        return ctx.services.notesService.listNotesByParentEntityId(
          fileId,
          ctx.user,
        );
      },
    });
  },
});
