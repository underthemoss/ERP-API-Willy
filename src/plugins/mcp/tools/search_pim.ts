import { z } from 'zod';
import { gql } from 'graphql-request';
import { createMcpTool } from './types';

/**
 * GraphQL operations for search_pim tool.
 * These are picked up by codegen to generate typed SDK methods.
 *
 * Searches both PIM products and categories.
 */
gql`
  query McpSearchPimProducts(
    $filter: ListPimProductsFilter
    $page: ListPimProductsPage
  ) {
    listPimProducts(filter: $filter, page: $page) {
      items {
        id
        name
        make
        model
        year
        sku
        upc
        manufacturer_part_number
        pim_category_id
        pim_category_platform_id
        pim_category_path
      }
      page {
        totalItems
        totalPages
        number
      }
    }
  }
`;

gql`
  query McpSearchPimCategories(
    $filter: ListPimCategoriesFilter
    $page: ListPimCategoriesPage
  ) {
    listPimCategories(filter: $filter, page: $page) {
      items {
        id
        name
        path
        description
        has_products
        childrenCount
        productCount
      }
      page {
        totalItems
        totalPages
        number
      }
    }
  }
`;

/**
 * search_pim MCP tool definition
 *
 * Searches both PIM products and categories by search term.
 * Returns matching products and categories in a single response.
 */
export const searchPimTool = createMcpTool({
  name: 'search_pim',
  description:
    'Search PIM (Product Information Management) for both products and categories. Returns matching products (equipment, items) and categories (product groupings/classifications). Use this to find equipment, products, and categories in the catalog.',
  inputSchema: {
    searchTerm: z
      .string()
      .describe(
        'Search term to find products by name, make, or model, and categories by name or path',
      ),
    categoryId: z
      .string()
      .optional()
      .describe('Optional: Filter products to a specific category ID'),
    page: z.number().optional().default(1).describe('Page number'),
    pageSize: z
      .number()
      .optional()
      .default(20)
      .describe('Number of results per page for each type (max 100)'),
  },
  handler: async (sdk, args) => {
    try {
      const { searchTerm, categoryId, page, pageSize } = args;

      const effectivePageSize = Math.min(pageSize || 20, 100);

      // Execute both searches in parallel
      const [productsResult, categoriesResult] = await Promise.all([
        sdk.McpSearchPimProducts({
          filter: {
            searchTerm,
            ...(categoryId && { pimCategoryPlatformId: categoryId }),
          },
          page: {
            number: page || 1,
            size: effectivePageSize,
          },
        }),
        sdk.McpSearchPimCategories({
          filter: {
            searchTerm,
          },
          page: {
            number: page || 1,
            size: effectivePageSize,
          },
        }),
      ]);

      const products = productsResult.listPimProducts?.items || [];
      const categories = categoriesResult.listPimCategories?.items || [];

      return {
        content: [
          {
            type: 'text' as const,
            text: JSON.stringify(
              {
                searchTerm,
                categoryId: categoryId || null,
                products: {
                  count: products.length,
                  totalItems: productsResult.listPimProducts?.page?.totalItems,
                  totalPages: productsResult.listPimProducts?.page?.totalPages,
                  currentPage: productsResult.listPimProducts?.page?.number,
                  items: products,
                },
                categories: {
                  count: categories.length,
                  totalItems:
                    categoriesResult.listPimCategories?.page?.totalItems,
                  totalPages:
                    categoriesResult.listPimCategories?.page?.totalPages,
                  currentPage: categoriesResult.listPimCategories?.page?.number,
                  items: categories,
                },
              },
              null,
              2,
            ),
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text' as const,
            text: `Error searching PIM: ${error instanceof Error ? error.message : 'Unknown error'}`,
          },
        ],
        isError: true,
      };
    }
  },
});
