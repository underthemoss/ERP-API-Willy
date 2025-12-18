/**
 * Search Service Types
 *
 * This service indexes documents from various collections to enable
 * fast cross-workspace document search similar to Algolia.
 */

export type SearchableCollection =
  | 'contacts'
  | 'projects'
  | 'sales_orders'
  | 'purchase_orders'
  | 'invoices'
  | 'notes';

// Re-export user state types
export type {
  SearchUserState,
  SearchUserStateFavorite,
  SearchUserStateRecent,
} from './search-user-state-model';

export interface SearchDocumentFields {
  // The original document ID from the source collection
  documentId: string;

  // The source collection this document came from
  collection: SearchableCollection;

  // The workspace this document belongs to
  workspaceId: string;

  // Searchable text content (concatenated searchable fields)
  searchableText: string;

  // Document title/name for display
  title: string;

  // Optional subtitle for additional context
  subtitle?: string;

  // Document type label (e.g., "Business Contact", "Sales Order")
  documentType: string;

  // Metadata for filtering and display
  metadata: Record<string, any>;

  // Timestamps
  createdAt: Date;
  updatedAt: Date;

  // Soft delete flag
  deleted?: boolean;
}

export interface SearchDocument extends SearchDocumentFields {
  _id: string;
}

export type CreateSearchDocumentInput = Omit<
  SearchDocumentFields,
  'createdAt' | 'updatedAt'
>;

export type UpdateSearchDocumentInput = Partial<
  Omit<SearchDocumentFields, 'documentId' | 'collection'>
>;

export interface SearchQuery {
  workspaceId: string;
  searchText?: string;
  collections?: SearchableCollection[];
  limit?: number;
  skip?: number;
}

export interface SearchResult {
  documents: SearchDocument[];
  total: number;
}
