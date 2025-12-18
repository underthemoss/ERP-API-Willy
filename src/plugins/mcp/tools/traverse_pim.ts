import { z } from 'zod';
import { gql } from 'graphql-request';
import { createMcpTool } from './types';

/**
 * GraphQL operations for traverse_pim tool.
 * These are picked up by codegen to generate typed SDK methods.
 */
gql`
  query McpGetPimCategory($id: ID!) {
    getPimCategoryById(id: $id) {
      id
      name
      path
      description
      has_products
      childrenCount
      productCount
    }
  }
`;

gql`
  query McpGetChildCategories(
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

gql`
  query McpGetCategoryProducts(
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

/**
 * traverse_pim MCP tool definition
 *
 * Traverses the PIM category hierarchy. Shows root categories if no categoryId
 * is provided, or shows children (subcategories and products) of a given category.
 */
export const traversePimTool = createMcpTool({
  name: 'traverse_pim',
  description:
    'Traverse the PIM (Product Information Management) category hierarchy to explore products. Call without categoryId to see root categories. Call with a categoryId to see its child categories and products. To fully explore the catalog, use this tool RECURSIVELY: start at root, then call again with each child category ID to drill deeper. Continue until you find the products you need.',
  inputSchema: {
    categoryId: z
      .string()
      .optional()
      .describe(
        'Category ID to traverse into. If not provided, shows root-level categories. Use the ID from a previous call to drill deeper into that category.',
      ),
  },
  handler: async (sdk, args) => {
    try {
      const { categoryId } = args;
      // Use large page size to get all children
      const pageSize = 1000;

      if (!categoryId) {
        // No categoryId - show root categories
        // Use path: "" (empty string) to get root-level categories
        // This matches how the frontend PimCategoriesTreeView does it
        const categoriesResult = await sdk.McpGetChildCategories({
          filter: {
            path: '',
          },
          page: {
            number: 1,
            size: pageSize,
          },
        });

        const categories = categoriesResult.listPimCategories?.items || [];

        return {
          content: [
            {
              type: 'text' as const,
              text: JSON.stringify(
                {
                  categoryId: null,
                  currentCategory: null,
                  isRoot: true,
                  childCategories: categories,
                  products: null, // No products at root level
                },
                null,
                2,
              ),
            },
          ],
        };
      }

      // categoryId provided - get category details, child categories, and products
      const [currentCategoryResult, childCategoriesResult, productsResult] =
        await Promise.all([
          sdk.McpGetPimCategory({ id: categoryId }),
          sdk.McpGetChildCategories({
            filter: {
              parentId: categoryId,
            },
            page: {
              number: 1,
              size: pageSize,
            },
          }),
          sdk.McpGetCategoryProducts({
            filter: {
              pimCategoryPlatformId: categoryId,
            },
            page: {
              number: 1,
              size: pageSize,
            },
          }),
        ]);

      const currentCategory = currentCategoryResult.getPimCategoryById;
      const childCategories =
        childCategoriesResult.listPimCategories?.items || [];
      const products = productsResult.listPimProducts?.items || [];

      return {
        content: [
          {
            type: 'text' as const,
            text: JSON.stringify(
              {
                categoryId,
                currentCategory,
                isRoot: false,
                childCategories,
                products,
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
            text: `Error traversing PIM: ${error instanceof Error ? error.message : 'Unknown error'}`,
          },
        ],
        isError: true,
      };
    }
  },
});
