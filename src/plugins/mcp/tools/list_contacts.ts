import { z } from 'zod';
import { gql } from 'graphql-request';
import { ContactType } from '../generated/graphql';
import { createMcpTool } from './types';

/**
 * GraphQL operation for list_contacts tool.
 * This is picked up by codegen to generate typed SDK methods.
 *
 * Enhanced query that goes deeper into the graph to provide:
 * - BusinessContact: brand info, employees list
 * - PersonContact: parent business details
 */
gql`
  query McpListContacts($filter: ListContactsFilter!, $page: ListContactsPage) {
    listContacts(filter: $filter, page: $page) {
      items {
        ... on BusinessContact {
          id
          name
          phone
          address
          website
          taxId
          contactType
          createdAt
          updatedAt
          resourceMapIds
          resource_map_entries {
            id
            value
            tagType
            parent_id
            hierarchy_id
            hierarchy_name
            path
            location {
              kind
              latLng {
                lat
                lng
                accuracyMeters
              }
              address {
                line1
                city
                state
                postalCode
                country
              }
              plusCode {
                code
                localArea
              }
            }
          }
          brand {
            name
            domain
            logos {
              url
              type
            }
          }
          employees {
            items {
              id
              name
              email
              personType
              phone
            }
            page {
              totalItems
            }
          }
        }
        ... on PersonContact {
          id
          name
          phone
          email
          personType
          contactType
          createdAt
          updatedAt
          resourceMapIds
          resource_map_entries {
            id
            value
            tagType
            parent_id
            hierarchy_id
            hierarchy_name
            path
            location {
              kind
              latLng {
                lat
                lng
                accuracyMeters
              }
              address {
                line1
                city
                state
                postalCode
                country
              }
              plusCode {
                code
                localArea
              }
            }
          }
          business {
            id
            name
            phone
            address
            website
          }
        }
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
 * list_contacts MCP tool definition
 *
 * Enhanced with:
 * - Additional filters: contactType, businessId
 * - Deeper graph traversal: brand, employees, parent business
 */
export const listContactsTool = createMcpTool({
  name: 'list_contacts',
  description:
    'Lists all contacts in a workspace that the authenticated user has access to. Returns business contacts (companies) with their brand and employees, and person contacts (individuals) with their employer details.',
  inputSchema: {
    workspaceId: z.string().describe('The workspace ID to list contacts from'),
    contactType: z
      .enum(['BUSINESS', 'PERSON'])
      .optional()
      .describe(
        'Filter by contact type: BUSINESS (companies) or PERSON (individuals)',
      ),
    businessId: z
      .string()
      .optional()
      .describe('Filter person contacts by their employer business ID'),
    page: z.number().optional().default(1).describe('Page number'),
    pageSize: z
      .number()
      .optional()
      .default(50)
      .describe('Number of contacts per page'),
  },
  handler: async (sdk, args) => {
    try {
      const { workspaceId, contactType, businessId, page, pageSize } = args;

      // Map string contactType to GraphQL enum
      const contactTypeEnum = contactType
        ? contactType === 'BUSINESS'
          ? ContactType.Business
          : ContactType.Person
        : undefined;

      const result = await sdk.McpListContacts({
        filter: {
          workspaceId,
          ...(contactTypeEnum && { contactType: contactTypeEnum }),
          ...(businessId && { businessId }),
        },
        page: { number: page || 1, size: pageSize || 50 },
      });

      // Return contacts directly from GraphQL response
      // The inline fragments ensure proper type discrimination
      const contacts = result.listContacts?.items || [];

      return {
        content: [
          {
            type: 'text' as const,
            text: JSON.stringify(
              {
                count: contacts.length,
                totalItems: result.listContacts?.page?.totalItems,
                totalPages: result.listContacts?.page?.totalPages,
                currentPage: result.listContacts?.page?.number,
                filters: {
                  workspaceId,
                  contactType: contactType || 'ALL',
                  businessId: businessId || null,
                },
                contacts,
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
            text: `Error listing contacts: ${error instanceof Error ? error.message : 'Unknown error'}`,
          },
        ],
        isError: true,
      };
    }
  },
});
