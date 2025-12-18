import { type MongoClient, type Db, type Collection } from 'mongodb';
import { generateId } from '../../lib/id-generator';
import {
  SearchDocument,
  CreateSearchDocumentInput,
  UpdateSearchDocumentInput,
  SearchQuery,
  SearchResult,
  SearchableCollection,
} from './types';

export class SearchModel {
  private client: MongoClient;
  public readonly dbName: string = 'es-erp';
  public readonly collectionName: string = 'search_documents';
  private db: Db;
  private collection: Collection<SearchDocument>;

  constructor(config: { mongoClient: MongoClient }) {
    this.client = config.mongoClient;
    this.db = this.client.db(this.dbName);
    this.collection = this.db.collection<SearchDocument>(this.collectionName);
  }

  /**
   * Upsert a search document (insert or update if exists)
   */
  async upsertSearchDocument(
    input: CreateSearchDocumentInput,
  ): Promise<SearchDocument> {
    const now = new Date();

    const result = await this.collection.findOneAndUpdate(
      {
        documentId: input.documentId,
        collection: input.collection,
      },
      {
        $set: {
          ...input,
          updatedAt: now,
        },
        $setOnInsert: {
          _id: generateId('SEARCH', input.workspaceId),
          createdAt: now,
        },
      },
      {
        upsert: true,
        returnDocument: 'after',
      },
    );

    if (!result) {
      throw new Error('Failed to upsert search document');
    }

    return result;
  }

  /**
   * Update an existing search document
   */
  async updateSearchDocument(
    documentId: string,
    collection: SearchableCollection,
    input: UpdateSearchDocumentInput,
  ): Promise<SearchDocument | null> {
    const now = new Date();

    const result = await this.collection.findOneAndUpdate(
      {
        documentId,
        collection,
      },
      {
        $set: {
          ...input,
          updatedAt: now,
        },
      },
      {
        returnDocument: 'after',
      },
    );

    return result;
  }

  /**
   * Soft delete a search document
   */
  async deleteSearchDocument(
    documentId: string,
    collection: SearchableCollection,
  ): Promise<void> {
    await this.collection.updateOne(
      {
        documentId,
        collection,
      },
      {
        $set: {
          deleted: true,
          updatedAt: new Date(),
        },
      },
    );
  }

  /**
   * Permanently remove a search document
   */
  async removeSearchDocument(
    documentId: string,
    collection: SearchableCollection,
  ): Promise<void> {
    await this.collection.deleteOne({
      documentId,
      collection,
    });
  }

  /**
   * Get a search document by document ID and collection
   */
  async getSearchDocument(
    documentId: string,
    collection: SearchableCollection,
  ): Promise<SearchDocument | null> {
    return this.collection.findOne({
      documentId,
      collection,
    });
  }

  /**
   * Get a search document by document ID (without specifying collection)
   */
  async getSearchDocumentByDocumentId(
    documentId: string,
  ): Promise<SearchDocument | null> {
    return this.collection.findOne({
      documentId,
      deleted: { $ne: true },
    });
  }

  /**
   * Search documents with full-text search and filtering
   * Supports both text search (for full words) and regex (for partial matching)
   */
  async search(query: SearchQuery): Promise<SearchResult> {
    const {
      workspaceId,
      searchText,
      collections,
      limit = 20,
      skip = 0,
    } = query;

    // Build the filter
    const filter: any = {
      workspaceId,
      deleted: { $ne: true },
    };

    if (collections && collections.length > 0) {
      filter.collection = { $in: collections };
    }

    // If search text is provided, use regex for partial matching
    // This allows searching for "constr" to find "construction"
    if (searchText && searchText.trim().length > 0) {
      const trimmedSearch = searchText.trim();

      // Escape special regex characters
      const escapedSearch = trimmedSearch.replace(
        /[.*+?^${}()|[\]\\]/g,
        '\\$&',
      );

      // Use regex for partial matching in both title and searchableText
      filter.$or = [
        { title: { $regex: escapedSearch, $options: 'i' } },
        { searchableText: { $regex: escapedSearch, $options: 'i' } },
      ];
    }

    // Sort by most recently updated
    const sort: any = { updatedAt: -1 };

    // Execute the search with pagination
    const [documents, total] = await Promise.all([
      this.collection.find(filter).sort(sort).skip(skip).limit(limit).toArray(),
      this.collection.countDocuments(filter),
    ]);

    return {
      documents,
      total,
    };
  }

  /**
   * Get multiple search documents by their IDs
   */
  async batchGetSearchDocuments(
    ids: readonly string[],
  ): Promise<Array<SearchDocument | null>> {
    const documents = await this.collection
      .find({ _id: { $in: ids } })
      .toArray();

    const mappedDocuments = new Map(
      documents.map((doc) => [String(doc._id), doc]),
    );

    return ids.map((id) => mappedDocuments.get(id) ?? null);
  }

  /**
   * Count documents by workspace and optionally by collection
   */
  async countDocuments(
    workspaceId: string,
    collection?: SearchableCollection,
  ): Promise<number> {
    const filter: any = {
      workspaceId,
      deleted: { $ne: true },
    };

    if (collection) {
      filter.collection = collection;
    }

    return this.collection.countDocuments(filter);
  }

  /**
   * Delete all search documents for a workspace
   */
  async deleteWorkspaceDocuments(workspaceId: string): Promise<number> {
    const result = await this.collection.deleteMany({ workspaceId });
    return result.deletedCount;
  }
}

export const createSearchModel = (config: { mongoClient: MongoClient }) => {
  return new SearchModel(config);
};
