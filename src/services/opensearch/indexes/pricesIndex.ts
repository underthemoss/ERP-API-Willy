import { BaseIndex } from './baseIndex';
import { SearchSettingsConfig, ElasticsearchQuery } from 'searchkit';
import { UserAuthPayload } from '../../../authentication';
import {
  ERP_PRICEBOOK_SUBJECT_PERMISSIONS,
  ERP_WORKSPACE_SUBJECT_PERMISSIONS,
} from '../../../lib/authz';
import { logger } from '../../../lib/logger';
import { OpenSearchServiceError } from '../index';

export class PricesIndex extends BaseIndex {
  readonly indexName = 'es_erp_prices';

  getSearchSettings(): SearchSettingsConfig {
    return {
      fuzziness: 'AUTO',
      search_attributes: [
        { field: 'name', weight: 10 },
        { field: 'price_book.name', weight: 8 },
        { field: 'pimCategoryName', weight: 7 },
        { field: 'pimCategoryPath', weight: 6 },
        { field: 'priceType', weight: 6 },
        { field: 'category_lvl1', weight: 5 },
        { field: 'category_lvl2', weight: 4 },
        { field: 'category_lvl3', weight: 4 },
        { field: 'location', weight: 3 },
      ],
      result_attributes: [
        '_id',
        'workspaceId',
        'name',
        'priceType',
        'catalogRef',
        'pimCategoryId',
        'pimCategoryPath',
        'pimCategoryName',
        'pimProductId',
        'priceBookId',
        'businessContactId',
        'projectId',
        'location',
        'pricePerDayInCents',
        'pricePerWeekInCents',
        'pricePerMonthInCents',
        'unitCostInCents',
        'discounts',
        'pricingSpec',
        'parentPriceId',
        'parentPriceIdPercentageFactor',
        'createdBy',
        'createdAt',
        'updatedAt',
        'updatedBy',
        'price_book',
        'pim_category',
        'category_lvl1',
        'category_lvl2',
        'category_lvl3',
        'category_lvl4',
        'category_lvl5',
        'category_lvl6',
        'category_lvl7',
        'category_lvl8',
        'category_lvl9',
        'category_lvl10',
        'category_lvl11',
        'category_lvl12',
      ],
      facet_attributes: [
        {
          attribute: 'workspaceId',
          field: 'workspaceId.keyword',
          type: 'string',
        },
        {
          attribute: 'pimCategoryId',
          field: 'pimCategoryId.keyword',
          type: 'string',
        },
        {
          attribute: 'priceBookId',
          field: 'priceBookId.keyword',
          type: 'string',
        },
        {
          attribute: 'priceType',
          field: 'priceType.keyword',
          type: 'string',
        },
        {
          attribute: 'catalogRefKind',
          field: 'catalogRef.kind.keyword',
          type: 'string',
        },
        {
          attribute: 'catalogRefId',
          field: 'catalogRef.id.keyword',
          type: 'string',
        },
        {
          attribute: 'price_book_name',
          field: 'price_book.name.keyword',
          type: 'string',
        },
        {
          attribute: 'location',
          field: 'location.keyword',
          type: 'string',
        },
        {
          attribute: 'category_lvl1',
          field: 'pim_category.category_lvl1.keyword',
          type: 'string',
        },
        {
          attribute: 'category_lvl2',
          field: 'pim_category.category_lvl2.keyword',
          type: 'string',
        },
        {
          attribute: 'category_lvl3',
          field: 'pim_category.category_lvl3.keyword',
          type: 'string',
        },
        {
          attribute: 'category_lvl4',
          field: 'pim_category.category_lvl4.keyword',
          type: 'string',
        },
        {
          attribute: 'category_lvl5',
          field: 'pim_category.category_lvl5.keyword',
          type: 'string',
        },
        {
          attribute: 'category_lvl6',
          field: 'pim_category.category_lvl6.keyword',
          type: 'string',
        },
        {
          attribute: 'category_lvl7',
          field: 'pim_category.category_lvl7.keyword',
          type: 'string',
        },
        {
          attribute: 'category_lvl8',
          field: 'pim_category.category_lvl8.keyword',
          type: 'string',
        },
        {
          attribute: 'category_lvl9',
          field: 'pim_category.category_lvl9.keyword',
          type: 'string',
        },
        {
          attribute: 'category_lvl10',
          field: 'pim_category.category_lvl10.keyword',
          type: 'string',
        },
        {
          attribute: 'category_lvl11',
          field: 'pim_category.category_lvl11.keyword',
          type: 'string',
        },
        {
          attribute: 'category_lvl12',
          field: 'pim_category.category_lvl12.keyword',
          type: 'string',
        },
      ],
      highlight_attributes: [
        'name',
        'price_book.name',
        'pimCategoryName',
        'priceType',
      ],
      snippet_attributes: ['name'],
      sorting: {
        default: {
          field: '_score',
          order: 'desc',
        },
        _name_asc: {
          field: 'name.keyword',
          order: 'asc',
        },
        _name_desc: {
          field: 'name.keyword',
          order: 'desc',
        },
        _created_asc: {
          field: 'createdAt.keyword',
          order: 'asc',
        },
        _created_desc: {
          field: 'createdAt.keyword',
          order: 'desc',
        },
      },
    };
  }

  getBaseFilters(_user: UserAuthPayload): ElasticsearchQuery[] {
    // No base filters - authorization is enforced via authorizeFilters
    // which requires priceBookId or workspaceId filter
    return [];
  }

  /**
   * Authorize the user to apply the given filters.
   * For prices, we require at least one of:
   * - priceBookId: user must have read permission on the price book
   * - workspaceId: user must have read_prices permission on the workspace
   * Throws OpenSearchServiceError if unauthorized or if neither filter is provided.
   */
  async authorizeFilters(
    user: UserAuthPayload,
    filters: Record<string, unknown>,
  ): Promise<void> {
    const priceBookIds = this.normalizeFilterValue(filters.priceBookId);
    const workspaceIds = this.normalizeFilterValue(filters.workspaceId);

    // Require at least one of priceBookId or workspaceId filter
    if (priceBookIds.length === 0 && workspaceIds.length === 0) {
      logger.warn(
        { userId: user.id },
        'User attempted to search prices without priceBookId or workspaceId filter',
      );
      throw new OpenSearchServiceError(
        'Price search requires a priceBookId or workspaceId filter',
        400,
      );
    }

    // Check priceBookId filter authorization
    if (priceBookIds.length > 0) {
      const priceBookChecks = await this.authZ.priceBook.bulkHasPermissions(
        priceBookIds.map((priceBookId) => ({
          permission: ERP_PRICEBOOK_SUBJECT_PERMISSIONS.USER_READ,
          resourceId: priceBookId,
          subjectId: user.id,
        })),
      );

      const unauthorizedPriceBooks = priceBookChecks.filter(
        (check) => !check.hasPermission,
      );
      if (unauthorizedPriceBooks.length > 0) {
        logger.warn(
          {
            userId: user.id,
            unauthorizedPriceBookIds: unauthorizedPriceBooks.map(
              (c) => c.resourceId,
            ),
          },
          'User attempted to filter prices by unauthorized price book',
        );
        throw new OpenSearchServiceError(
          'User does not have permission to access the requested price book(s)',
          403,
        );
      }
    }

    // Check workspaceId filter authorization
    if (workspaceIds.length > 0) {
      const workspaceChecks = await this.authZ.workspace.bulkHasPermissions(
        workspaceIds.map((wsId) => ({
          permission: ERP_WORKSPACE_SUBJECT_PERMISSIONS.USER_READ_PRICES,
          resourceId: wsId,
          subjectId: user.id,
        })),
      );

      const unauthorizedWorkspaces = workspaceChecks.filter(
        (check) => !check.hasPermission,
      );
      if (unauthorizedWorkspaces.length > 0) {
        logger.warn(
          {
            userId: user.id,
            unauthorizedWorkspaceIds: unauthorizedWorkspaces.map(
              (c) => c.resourceId,
            ),
          },
          'User attempted to filter prices by unauthorized workspace',
        );
        throw new OpenSearchServiceError(
          'User does not have permission to access prices in the requested workspace(s)',
          403,
        );
      }
    }
  }

  /**
   * Normalize a filter value to an array of strings
   */
  private normalizeFilterValue(value: unknown): string[] {
    if (!value) return [];
    if (Array.isArray(value)) {
      return value.filter((v): v is string => typeof v === 'string');
    }
    if (typeof value === 'string') {
      return [value];
    }
    return [];
  }
}
