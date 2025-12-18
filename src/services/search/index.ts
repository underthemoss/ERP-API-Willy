import { type MongoClient } from 'mongodb';
import { EnvConfig } from '../../config';
import { logger } from '../../lib/logger';
import { SearchModel, createSearchModel } from './model';
import { DocumentIndexer, createDocumentIndexer } from './document-indexer';
import { SearchQuery, SearchResult, SearchUserState } from './types';
import { type AuthZ } from '../../lib/authz';
import { UserAuthPayload } from '../../authentication';
import { ERP_WORKSPACE_SUBJECT_PERMISSIONS } from '../../lib/authz/spicedb-generated-types';
import {
  SearchUserStateModel,
  createSearchUserStateModel,
} from './search-user-state-model';

export * from './types';
export * from './model';
export * from './search-user-state-model';

/**
 * SearchService
 *
 * Main service class that orchestrates the search functionality.
 * Provides methods for searching documents and managing the search index.
 */
export class SearchService {
  constructor(
    private searchModel: SearchModel,
    private documentIndexer: DocumentIndexer,
    private searchUserStateModel: SearchUserStateModel,
    private authZ: AuthZ,
  ) {}

  /**
   * Search documents across collections
   */
  async search(
    query: SearchQuery,
    user?: UserAuthPayload,
  ): Promise<SearchResult> {
    // auth
    if (!user) {
      throw new Error('User not authenticated');
    }

    // Check if user has permission to read contacts in the workspace
    const canReadContacts = await this.authZ.workspace.hasPermission({
      permission: ERP_WORKSPACE_SUBJECT_PERMISSIONS.USER_READ,
      resourceId: query.workspaceId,
      subjectId: user.id,
    });

    if (!canReadContacts) {
      // User doesn't have permission, return empty result
      return {
        documents: [],
        total: 0,
      };
    }

    return this.searchModel.search(query);
  }

  /**
   * Get a search document by its ID
   */
  async getById(id: string, user?: UserAuthPayload) {
    // auth
    if (!user) {
      throw new Error('User not authenticated');
    }

    const documents = await this.searchModel.batchGetSearchDocuments([id]);
    const document = documents[0];

    if (!document) {
      return null;
    }

    // Check if user has permission to read in the workspace
    const canRead = await this.authZ.workspace.hasPermission({
      permission: ERP_WORKSPACE_SUBJECT_PERMISSIONS.USER_READ,
      resourceId: document.workspaceId,
      subjectId: user.id,
    });

    if (!canRead) {
      return null;
    }

    return document;
  }

  /**
   * Get a search document by the original document ID (entity ID)
   */
  async getByDocumentId(documentId: string, user?: UserAuthPayload) {
    // auth
    if (!user) {
      throw new Error('User not authenticated');
    }

    const document =
      await this.searchModel.getSearchDocumentByDocumentId(documentId);

    if (!document) {
      return null;
    }

    // Check if user has permission to read in the workspace
    const canRead = await this.authZ.workspace.hasPermission({
      permission: ERP_WORKSPACE_SUBJECT_PERMISSIONS.USER_READ,
      resourceId: document.workspaceId,
      subjectId: user.id,
    });

    if (!canRead) {
      return null;
    }

    return document;
  }

  /**
   * Get multiple search documents by their IDs
   */
  async getBulkByIds(ids: readonly string[], user?: UserAuthPayload) {
    // auth
    if (!user) {
      throw new Error('User not authenticated');
    }

    // Fetch all documents
    const documents = await this.searchModel.batchGetSearchDocuments(ids);

    // Extract unique workspace IDs from documents
    const workspaceIds = new Set(
      documents.filter((doc) => doc !== null).map((doc) => doc!.workspaceId),
    );

    // Bulk check permissions for all workspaces
    const permissionChecks = await this.authZ.workspace.bulkHasPermissions(
      Array.from(workspaceIds).map((workspaceId) => ({
        resourceId: workspaceId,
        permission: ERP_WORKSPACE_SUBJECT_PERMISSIONS.USER_READ,
        subjectId: user.id,
      })),
    );

    // Create a set of authorized workspace IDs
    const authorizedWorkspaceIds = new Set(
      permissionChecks
        .filter((check) => check.hasPermission)
        .map((check) => check.resourceId),
    );

    // Filter documents based on permissions - return null for unauthorized
    return documents.map((doc) => {
      if (!doc) return null;
      return authorizedWorkspaceIds.has(doc.workspaceId) ? doc : null;
    });
  }

  /**
   * Get the search model for direct access if needed
   */
  getModel(): SearchModel {
    return this.searchModel;
  }

  /**
   * Get the document indexer for direct access if needed
   */
  getIndexer(): DocumentIndexer {
    return this.documentIndexer;
  }

  /**
   * Get user's search state (favorites and recents) for a workspace
   */
  async getUserState(
    workspaceId: string,
    user?: UserAuthPayload,
  ): Promise<SearchUserState> {
    if (!user) {
      throw new Error('User not authenticated');
    }

    // Check if user has permission to read in the workspace
    const canRead = await this.authZ.workspace.hasPermission({
      permission: ERP_WORKSPACE_SUBJECT_PERMISSIONS.USER_READ,
      resourceId: workspaceId,
      subjectId: user.id,
    });

    if (!canRead) {
      throw new Error('User does not have permission to access this workspace');
    }

    return this.searchUserStateModel.getUserState(user.id, workspaceId);
  }

  /**
   * Toggle a search document as favorite
   */
  async toggleFavorite(
    workspaceId: string,
    searchDocumentId: string,
    user?: UserAuthPayload,
  ): Promise<SearchUserState> {
    if (!user) {
      throw new Error('User not authenticated');
    }

    // Check if user has permission to read in the workspace
    const canRead = await this.authZ.workspace.hasPermission({
      permission: ERP_WORKSPACE_SUBJECT_PERMISSIONS.USER_READ,
      resourceId: workspaceId,
      subjectId: user.id,
    });

    if (!canRead) {
      throw new Error('User does not have permission to access this workspace');
    }

    return this.searchUserStateModel.toggleFavorite(
      user.id,
      workspaceId,
      searchDocumentId,
    );
  }

  /**
   * Add a search document to recents
   */
  async addRecent(
    workspaceId: string,
    searchDocumentId: string,
    user?: UserAuthPayload,
  ): Promise<SearchUserState> {
    if (!user) {
      throw new Error('User not authenticated');
    }

    // Check if user has permission to read in the workspace
    const canRead = await this.authZ.workspace.hasPermission({
      permission: ERP_WORKSPACE_SUBJECT_PERMISSIONS.USER_READ,
      resourceId: workspaceId,
      subjectId: user.id,
    });

    if (!canRead) {
      throw new Error('User does not have permission to access this workspace');
    }

    return this.searchUserStateModel.addRecent(
      user.id,
      workspaceId,
      searchDocumentId,
    );
  }

  /**
   * Remove a search document from recents
   */
  async removeRecent(
    workspaceId: string,
    searchDocumentId: string,
    user?: UserAuthPayload,
  ): Promise<SearchUserState> {
    if (!user) {
      throw new Error('User not authenticated');
    }

    // Check if user has permission to read in the workspace
    const canRead = await this.authZ.workspace.hasPermission({
      permission: ERP_WORKSPACE_SUBJECT_PERMISSIONS.USER_READ,
      resourceId: workspaceId,
      subjectId: user.id,
    });

    if (!canRead) {
      throw new Error('User does not have permission to access this workspace');
    }

    return this.searchUserStateModel.removeRecent(
      user.id,
      workspaceId,
      searchDocumentId,
    );
  }

  /**
   * Clear all recent searches
   */
  async clearRecents(
    workspaceId: string,
    user?: UserAuthPayload,
  ): Promise<SearchUserState> {
    if (!user) {
      throw new Error('User not authenticated');
    }

    // Check if user has permission to read in the workspace
    const canRead = await this.authZ.workspace.hasPermission({
      permission: ERP_WORKSPACE_SUBJECT_PERMISSIONS.USER_READ,
      resourceId: workspaceId,
      subjectId: user.id,
    });

    if (!canRead) {
      throw new Error('User does not have permission to access this workspace');
    }

    return this.searchUserStateModel.clearRecents(user.id, workspaceId);
  }
}

/**
 * Factory function to create and start the search service
 * This is the root entry point for the search service.
 * It creates the service and initializes MongoDB indexes.
 * Note: Search index updates are no longer real-time (CDC removed).
 *
 * @param opts.mongoClient - MongoDB client instance
 * @param opts.envConfig - Environment configuration (unused but kept for compatibility)
 * @param opts.authZ - Authorization service
 * @returns Promise that resolves to the started SearchService
 */
export async function createSearchService(opts: {
  mongoClient: MongoClient;
  envConfig: EnvConfig;
  authZ: AuthZ;
}): Promise<SearchService> {
  const { mongoClient, authZ } = opts;

  logger.info('Creating Search Service...');

  // Create model and indexer
  const searchModel = createSearchModel({ mongoClient });
  const documentIndexer = createDocumentIndexer(searchModel);
  const searchUserStateModel = createSearchUserStateModel({ mongoClient });

  const searchService = new SearchService(
    searchModel,
    documentIndexer,
    searchUserStateModel,
    authZ,
  );

  logger.info(
    'Search Service created successfully (search index will use stale data)',
  );

  return searchService;
}
