import { type MongoClient } from 'mongodb';
import {
  NotesModel,
  createNotesModel,
  NotesUpdateInput,
  NoteDoc,
} from './model';
import { generateId } from '../../lib/id-generator';
import { UserAuthPayload } from '../../authentication';
import { AuthZ, ERP_WORKSPACE_SUBJECT_PERMISSIONS } from '../../lib/authz';

export class NotesService {
  private model: NotesModel;
  private authz: AuthZ;
  constructor(config: { model: NotesModel; authz: AuthZ }) {
    this.model = config.model;
    this.authz = config.authz;
  }

  /**
   * Get a single note by ID with workspace authorization.
   */
  getNoteById = async (
    id: string,
    user?: UserAuthPayload,
  ): Promise<NoteDoc | null> => {
    if (!user) {
      throw new Error('User not authenticated');
    }

    const notes = await this.model.getNotesByIds(user.companyId, [id]);
    const note = notes[0];

    if (!note) {
      return null;
    }

    // Check if user has access to the workspace
    const hasAccess = await this.authz.workspace.hasPermission({
      resourceId: note.workspace_id,
      permission: ERP_WORKSPACE_SUBJECT_PERMISSIONS.USER_READ,
      subjectId: user.id,
    });

    if (!hasAccess) {
      throw new Error('Unauthorized to access note in this workspace');
    }

    return note;
  };

  /**
   * Batch get notes by IDs (for dataloader).
   */
  batchGetNotesById = async (
    ids: string[],
    user?: UserAuthPayload,
  ): Promise<(NoteDoc | null)[]> => {
    if (!user) {
      return ids.map(() => null);
    }
    const docs = await this.model.getNotesByIds(user.companyId, ids);
    const docsById: Record<string, NoteDoc> = {};
    for (const doc of docs) {
      docsById[doc._id] = doc;
    }
    return ids.map((id) => docsById[id] ?? null);
  };

  /**
   * List notes by parent_entity_id.
   */
  listNotesByParentEntityId = async (
    parent_entity_id: string,
    user?: UserAuthPayload,
  ): Promise<NoteDoc[]> => {
    if (!user) {
      return [];
    }
    return await this.model.getNotesByParentEntityId(
      user.companyId,
      parent_entity_id,
    );
  };

  /**
   * Bulk list notes by parent_entity_id (for dataloader).
   * Accepts an array of parent_entity_ids and returns an array of arrays of notes.
   */
  bulkListNotesByParentEntityId = async (
    parentEntityIds: string[],
    user?: UserAuthPayload,
  ): Promise<NoteDoc[][]> => {
    if (!user) {
      return parentEntityIds.map(() => []);
    }
    // Fetch all notes for all parentEntityIds
    const allNotes = await this.model.getNotesByParentEntityIds(
      user.companyId,
      parentEntityIds,
    );
    // Group notes by parent_entity_id
    const notesByParent: Record<string, NoteDoc[]> = {};
    for (const note of allNotes) {
      if (!notesByParent[note.parent_entity_id]) {
        notesByParent[note.parent_entity_id] = [];
      }
      notesByParent[note.parent_entity_id].push(note);
    }
    return parentEntityIds.map((id) => notesByParent[id] || []);
  };

  /**
   * Create a note.
   */
  createNote = async (
    input: Omit<
      NoteDoc,
      | '_id'
      | 'created_at'
      | 'updated_at'
      | 'created_by'
      | 'updated_by'
      | 'deleted'
      | 'company_id'
    >,
    user?: UserAuthPayload,
  ) => {
    if (!user) {
      throw new Error('User not authenticated');
    }
    const now = new Date();
    const note: NoteDoc = {
      _id: generateId('NOTE', user.companyId),
      company_id: user.companyId,
      workspace_id: input.workspace_id,
      parent_entity_id: input.parent_entity_id,
      value: input.value,
      created_at: now,
      updated_at: now,
      created_by: user.id,
      updated_by: user.id,
      deleted: false,
    };
    return await this.model.createNote(note);
  };

  /**
   * Update a note.
   */
  updateNote = async (
    id: string,
    input: Omit<
      NotesUpdateInput,
      'updated_by' | 'updated_at' | 'created_by' | 'created_at' | 'company_id'
    >,
    user?: UserAuthPayload,
  ) => {
    if (!user) {
      throw new Error('User not authenticated');
    }
    const note = await this.model.getNotesByIds(user.companyId, [id]);
    if (!note[0]) {
      throw new Error('Note not found');
    }
    const now = new Date();
    return await this.model.updateNote(id, {
      ...note[0],
      ...input,
      company_id: user.companyId,
      updated_at: now,
      updated_by: user.id,
    });
  };

  /**
   * Delete a note (soft delete).
   */
  deleteNote = async (id: string, user?: UserAuthPayload) => {
    if (!user) {
      throw new Error('User not authenticated');
    }
    const note = await this.model.getNotesByIds(user.companyId, [id]);
    if (!note[0]) {
      throw new Error('Note not found');
    }
    await this.model.deleteNote(id);
    return { ...note[0], deleted: true };
  };
}

export const createNotesService = async (config: {
  mongoClient: MongoClient;
  authz: AuthZ;
}) => {
  const model = createNotesModel(config);
  const notesService = new NotesService({
    model,
    authz: config.authz,
  });
  return notesService;
};

export type { NoteDoc };
