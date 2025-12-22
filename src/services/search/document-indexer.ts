import { SearchModel } from './model';
import { SearchableCollection, CreateSearchDocumentInput } from './types';
import { logger } from '../../lib/logger';
import { ProjectDoc } from '../projects/model';
import { ContactDoc } from '../contacts/model';
import { SalesOrderDoc } from '../sales_orders/sales-order-model';
import { PurchaseOrderDoc } from '../purchase_orders/purchase-order-model';
import { InvoiceDoc } from '../invoices/model';
import { NoteDoc } from '../notes/model';

/**
 * DocumentIndexer
 *
 * Indexes documents into the search collection.
 * Each document type has its own indexing logic to extract searchable content.
 * Only collections with workspaceId field are indexed.
 */
export class DocumentIndexer {
  constructor(private searchModel: SearchModel) {}

  /**
   * Check if a collection is supported for search indexing
   * Only collections with workspaceId field are supported
   */
  private isSupportedCollection(collection: string): boolean {
    const supportedCollections: SearchableCollection[] = [
      'contacts',
      'projects',
      'sales_orders',
      'purchase_orders',
      'invoices',
      'notes',
    ];
    return supportedCollections.includes(collection as SearchableCollection);
  }

  /**
   * Index a document based on its collection type
   */
  private async indexDocument(
    collection: SearchableCollection,
    document: any,
  ): Promise<void> {
    let searchInput: CreateSearchDocumentInput | null = null;

    switch (collection) {
      case 'contacts':
        searchInput = this.indexContact(document);
        break;
      case 'projects':
        searchInput = this.indexProject(document);
        break;
      case 'sales_orders':
        searchInput = this.indexSalesOrder(document);
        break;
      case 'purchase_orders':
        searchInput = this.indexPurchaseOrder(document);
        break;
      case 'invoices':
        searchInput = this.indexInvoice(document);
        break;
      case 'notes':
        searchInput = this.indexNote(document);
        break;
      default:
        logger.warn(
          { collection },
          'Unsupported collection for search indexing',
        );
        return;
    }

    if (searchInput) {
      await this.searchModel.upsertSearchDocument(searchInput);
    }
  }

  /**
   * Handle document deletion
   */
  private async handleDelete(
    collection: SearchableCollection,
    documentId: string,
  ): Promise<void> {
    await this.searchModel.deleteSearchDocument(documentId, collection);
  }

  /**
   * Index a contact document
   */
  private indexContact(doc: ContactDoc): CreateSearchDocumentInput | null {
    if (!doc._id || !doc.workspaceId) {
      return null;
    }

    // Build searchable fields based on contact type
    const searchableFields: string[] = [doc._id, doc.name];

    if (doc.phone) searchableFields.push(doc.phone);
    if (doc.notes) searchableFields.push(doc.notes);

    // Add type-specific fields
    if (doc.contactType === 'BUSINESS') {
      if (doc.address) searchableFields.push(doc.address);
      if (doc.website) searchableFields.push(doc.website);
    } else {
      searchableFields.push(doc.email);
      if (doc.personType) {
        searchableFields.push(doc.personType);
      }
    }

    const documentType =
      doc.contactType === 'BUSINESS' ? 'Business Contact' : 'Person Contact';

    const email = doc.contactType === 'PERSON' ? doc.email : undefined;
    const businessId =
      doc.contactType === 'PERSON' ? doc.businessId : undefined;
    const personType =
      doc.contactType === 'PERSON' ? doc.personType : undefined;

    return {
      documentId: doc._id,
      collection: 'contacts',
      workspaceId: doc.workspaceId,
      searchableText: searchableFields.filter(Boolean).join(' '),
      title: doc.name || 'Unnamed Contact',
      subtitle: email || doc.phone,
      documentType,
      metadata: {
        contactType: doc.contactType,
        email,
        phone: doc.phone,
        businessId,
        personType,
      },
    };
  }

  /**
   * Index a project document
   */
  private indexProject(doc: ProjectDoc): CreateSearchDocumentInput | null {
    if (!doc._id || !doc.workspaceId) {
      return null;
    }

    const searchableFields: string[] = [doc._id];

    if (doc.name) searchableFields.push(doc.name);
    if (doc.projectCode) searchableFields.push(doc.projectCode);
    if (doc.description) searchableFields.push(doc.description);

    return {
      documentId: doc._id,
      collection: 'projects',
      workspaceId: doc.workspaceId,
      searchableText: searchableFields.join(' '),
      title: doc.name || doc.projectCode || 'Unnamed Project',
      subtitle: doc.projectCode,
      documentType: 'Project',
      metadata: {
        projectCode: doc.projectCode,
        status: doc.status,
      },
    };
  }

  /**
   * Index a sales order document
   * Sales orders are searchable by order numbers and IDs
   */
  private indexSalesOrder(
    doc: SalesOrderDoc,
  ): CreateSearchDocumentInput | null {
    const workspaceId = doc.workspace_id;
    if (!doc._id || !workspaceId) {
      return null;
    }

    const searchableFields: string[] = [doc._id];

    if (doc.sales_order_number) searchableFields.push(doc.sales_order_number);
    if (doc.purchase_order_number) {
      searchableFields.push(doc.purchase_order_number);
    }
    if (doc.buyer_id) searchableFields.push(doc.buyer_id);
    if (doc.project_id) searchableFields.push(doc.project_id);

    return {
      documentId: doc._id,
      collection: 'sales_orders',
      workspaceId,
      searchableText: searchableFields.join(' '),
      title: doc.sales_order_number || 'Unnamed Sales Order',
      subtitle: doc.purchase_order_number,
      documentType: 'Sales Order',
      metadata: {
        salesOrderNumber: doc.sales_order_number,
        purchaseOrderNumber: doc.purchase_order_number,
        status: doc.status,
        buyerId: doc.buyer_id,
        projectId: doc.project_id,
      },
    };
  }

  /**
   * Index a purchase order document
   * Purchase orders are searchable by order number and IDs
   */
  private indexPurchaseOrder(
    doc: PurchaseOrderDoc,
  ): CreateSearchDocumentInput | null {
    const workspaceId = doc.workspace_id;
    if (!doc._id || !workspaceId) {
      return null;
    }

    const searchableFields: string[] = [doc._id];

    if (doc.purchase_order_number) {
      searchableFields.push(doc.purchase_order_number);
    }
    if (doc.seller_id) searchableFields.push(doc.seller_id);
    if (doc.project_id) searchableFields.push(doc.project_id);

    return {
      documentId: doc._id,
      collection: 'purchase_orders',
      workspaceId,
      searchableText: searchableFields.join(' '),
      title: doc.purchase_order_number || 'Unnamed Purchase Order',
      subtitle: undefined,
      documentType: 'Purchase Order',
      metadata: {
        purchaseOrderNumber: doc.purchase_order_number,
        status: doc.status,
        sellerId: doc.seller_id,
        projectId: doc.project_id,
      },
    };
  }

  /**
   * Index an invoice document
   * Invoices are searchable by invoice number and IDs
   */
  private indexInvoice(doc: InvoiceDoc): CreateSearchDocumentInput | null {
    if (!doc._id || !doc.workspaceId) {
      return null;
    }

    const searchableFields: string[] = [doc._id];

    if (doc.invoiceNumber) searchableFields.push(doc.invoiceNumber);
    if (doc.buyerId) searchableFields.push(doc.buyerId);
    if (doc.sellerId) searchableFields.push(doc.sellerId);

    return {
      documentId: doc._id,
      collection: 'invoices',
      workspaceId: doc.workspaceId,
      searchableText: searchableFields.join(' '),
      title: doc.invoiceNumber || 'Unnamed Invoice',
      subtitle: undefined,
      documentType: 'Invoice',
      metadata: {
        invoiceNumber: doc.invoiceNumber,
        status: doc.status,
        buyerId: doc.buyerId,
        sellerId: doc.sellerId,
        subTotalInCents: doc.subTotalInCents,
        totalTaxesInCents: doc.totalTaxesInCents,
        finalSumInCents: doc.finalSumInCents,
      },
    };
  }

  /**
   * Index a note document
   * Notes are searchable by their plainText content and IDs
   */
  private indexNote(doc: NoteDoc): CreateSearchDocumentInput | null {
    if (!doc._id || !doc.workspace_id) {
      return null;
    }

    const searchableFields: string[] = [];

    // Add note ID for searchability
    searchableFields.push(doc._id);

    // Extract plain text from the value field
    if (
      doc.value &&
      typeof doc.value === 'object' &&
      'plainText' in doc.value
    ) {
      const plainText = (doc.value as any).plainText;
      if (plainText && typeof plainText === 'string') {
        searchableFields.push(plainText);
      }
    }

    // Add parent entity ID for cross-referencing
    if (doc.parent_entity_id) {
      searchableFields.push(doc.parent_entity_id);
    }

    // Create a preview for the title (first 100 characters)
    const preview = searchableFields[0]
      ? searchableFields[0].substring(0, 100)
      : 'Empty Note';

    return {
      documentId: doc._id,
      collection: 'notes',
      workspaceId: doc.workspace_id,
      searchableText: searchableFields.join(' '),
      title: preview,
      subtitle: undefined,
      documentType: 'Note',
      metadata: {
        parentEntityId: doc.parent_entity_id,
        companyId: doc.company_id,
        createdBy: doc.created_by,
        updatedBy: doc.updated_by,
      },
    };
  }
}

export const createDocumentIndexer = (searchModel: SearchModel) => {
  return new DocumentIndexer(searchModel);
};
