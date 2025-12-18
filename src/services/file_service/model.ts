import { randomUUID } from 'crypto';
import { MongoClient, Db, Collection } from 'mongodb';
import { RESOURCE_TYPES } from '../../lib/authz';

export type FileDoc = {
  _id: string;
  workspace_id: string;
  parent_entity_id: string;
  parent_entity_type?: RESOURCE_TYPES;
  file_key: string;
  file_name: string;
  file_size: number;
  mime_type: string;
  metadata?: Record<string, any>;
  created_at: string;
  created_by: string;
  updated_at: string;
  updated_by: string;
  deleted: boolean;
};

export type FileUpsertInput = Omit<
  FileDoc,
  | '_id'
  | 'file_size'
  | 'mime_type'
  | 'created_at'
  | 'created_by'
  | 'updated_at'
  | 'updated_by'
  | 'deleted'
> & {
  metadata?: Record<string, any>;
};

export class FileServiceModel {
  private client: MongoClient;
  private db: Db;
  private collection: Collection<FileDoc>;
  constructor(config: { mongoClient: MongoClient }) {
    this.client = config.mongoClient;
    this.db = this.client.db('es-erp');
    this.collection = this.db.collection<FileDoc>('files');
  }

  // Adds a file document (no S3 logic, expects all fields provided)
  async addFile(file: Omit<FileDoc, '_id'>): Promise<FileDoc> {
    const now = new Date().toISOString();

    const fileDoc: FileDoc = {
      _id: randomUUID(),
      workspace_id: file.workspace_id,
      parent_entity_id: file.parent_entity_id,
      parent_entity_type: file.parent_entity_type,
      file_key: file.file_key,
      file_name: file.file_name,
      file_size: file.file_size,
      mime_type: file.mime_type,
      metadata: file.metadata,
      created_at: file.created_at ?? now,
      created_by: file.created_by,
      updated_at: file.updated_at ?? now,
      updated_by: file.updated_by,
      deleted: false,
    };

    await this.collection.insertOne(fileDoc);
    return fileDoc;
  }

  // Soft delete a file
  async removeFile(fileId: string, updatedBy: string): Promise<FileDoc | null> {
    const now = new Date().toISOString();
    const result = await this.collection.findOneAndUpdate(
      { _id: fileId, deleted: false },
      {
        $set: {
          deleted: true,
          updated_at: now,
          updated_by: updatedBy,
        },
      },
      { returnDocument: 'after' },
    );

    return result;
  }

  // Rename a file
  async renameFile(
    fileId: string,
    newFileName: string,
    updatedBy: string,
  ): Promise<FileDoc | null> {
    const now = new Date().toISOString();
    const result = await this.collection.findOneAndUpdate(
      { _id: fileId, deleted: false },
      {
        $set: {
          file_name: newFileName,
          updated_at: now,
          updated_by: updatedBy,
        },
      },
      { returnDocument: 'after' },
    );

    return result;
  }

  async getFilesByParentEntityId(query: {
    filter: { workspace_id: string; parent_entity_id: string };
    page?: { size?: number; number?: number };
  }): Promise<FileDoc[]> {
    const { filter, page } = query;
    const limit = page?.size ?? 10;
    const skip = page?.number ? (page.number - 1) * limit : 0;
    return this.collection
      .find({ ...filter, deleted: false }, { limit, skip })
      .toArray();
  }

  async getFileById(fileId: string): Promise<FileDoc | null> {
    return this.collection.findOne({
      _id: fileId,
      deleted: false,
    });
  }
}

export const createFileServiceModel = (config: {
  mongoClient: MongoClient;
}) => {
  return new FileServiceModel(config);
};
