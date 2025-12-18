import { type MongoClient, type Db, type Collection } from 'mongodb';

export type NoteDoc = {
  _id: string;
  company_id: string;
  workspace_id: string;
  parent_entity_id: string;
  value: object; // BlockNoteJS structured JSON
  created_at: Date;
  updated_at: Date;
  created_by: string;
  updated_by: string;
  deleted: boolean;
};

export type NotesUpdateInput = Omit<NoteDoc, '_id'>;

export class NotesModel {
  private client: MongoClient;
  private dbName: string = 'es-erp';
  private collectionName: string = 'notes';
  private db: Db;
  private collection: Collection<NoteDoc>;

  constructor(config: { mongoClient: MongoClient }) {
    this.client = config.mongoClient;
    this.db = this.client.db(this.dbName);
    this.collection = this.db.collection<NoteDoc>(this.collectionName);
  }

  async createNote(note: NoteDoc) {
    await this.collection.insertOne(note);
    return note;
  }

  async updateNote(id: string, note: NotesUpdateInput) {
    const result = await this.collection.findOneAndUpdate(
      { _id: id },
      { $set: { ...note, _id: id } },
      { returnDocument: 'after' },
    );
    return result;
  }

  async deleteNote(id: string) {
    const result = await this.collection.findOneAndUpdate(
      { _id: id },
      { $set: { deleted: true } },
    );
    return result;
  }

  async getNotesByParentEntityId(
    company_id: string,
    parent_entity_id: string,
  ): Promise<NoteDoc[]> {
    return await this.collection
      .find({
        company_id,
        parent_entity_id,
        deleted: { $ne: true },
      })
      .toArray();
  }

  async getNotesByIds(company_id: string, ids: string[]): Promise<NoteDoc[]> {
    if (!ids.length) return [];
    const docs = await this.collection
      .find({
        company_id,
        _id: { $in: ids },
        deleted: { $ne: true },
      })
      .toArray();
    return docs;
  }

  /**
   * Get all notes for a set of parent_entity_ids (for dataloader).
   */
  async getNotesByParentEntityIds(
    company_id: string,
    parentEntityIds: string[],
  ): Promise<NoteDoc[]> {
    if (!parentEntityIds.length) return [];
    return await this.collection
      .find({
        company_id,
        parent_entity_id: { $in: parentEntityIds },
        deleted: { $ne: true },
      })
      .toArray();
  }
}

export const createNotesModel = (config: { mongoClient: MongoClient }) => {
  const notesModel = new NotesModel(config);
  return notesModel;
};
