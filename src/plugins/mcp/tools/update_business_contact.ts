import { z } from 'zod';
import { gql } from 'graphql-request';
import { createMcpTool } from './types';

/**
 * GraphQL operation for update_business_contact tool.
 * This is picked up by codegen to generate typed SDK methods.
 */
gql`
  mutation McpUpdateBusinessContact(
    $id: ID!
    $input: UpdateBusinessContactInput!
  ) {
    updateBusinessContact(id: $id, input: $input) {
      id
      name
      phone
      address
      taxId
      website
      notes
      profilePicture
      contactType
      workspaceId
      createdAt
      updatedAt
      brandId
      accountsPayableContactId
      resourceMapIds
      placeId
      latitude
      longitude
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
          role
          phone
        }
        page {
          totalItems
        }
      }
    }
  }
`;

/**
 * update_business_contact MCP tool definition
 *
 * Updates a business contact's details. All fields except id are optional -
 * only provided fields will be updated.
 */
export const updateBusinessContactTool = createMcpTool({
  name: 'update_business_contact',
  description:
    'Updates a business contact (company) in the workspace. Only provided fields will be updated. Returns the updated business with their brand info and employees list.',
  inputSchema: {
    id: z.string().describe('The ID of the business contact to update'),
    name: z.string().optional().describe('The business name'),
    phone: z.string().optional().describe('The business phone number'),
    address: z.string().optional().describe('The business address'),
    taxId: z.string().optional().describe('The business tax ID / EIN'),
    website: z.string().optional().describe('The business website URL'),
    notes: z.string().optional().describe('Notes about this business'),
    profilePicture: z
      .string()
      .optional()
      .describe('URL to the business logo or profile picture'),
    brandId: z
      .string()
      .optional()
      .describe('The ID of the brand associated with this business'),
    accountsPayableContactId: z
      .string()
      .optional()
      .describe('The ID of the accounts payable contact for this business'),
    resourceMapIds: z
      .array(z.string())
      .optional()
      .describe('Array of resource map IDs to associate with this business'),
    placeId: z
      .string()
      .optional()
      .describe('Google Places ID for the business location'),
    latitude: z.number().optional().describe('Latitude coordinate'),
    longitude: z.number().optional().describe('Longitude coordinate'),
  },
  handler: async (sdk, args) => {
    try {
      const { id, ...inputFields } = args;

      // Filter out undefined values to only send fields that were explicitly provided
      const input = Object.fromEntries(
        Object.entries(inputFields).filter(([_, value]) => value !== undefined),
      );

      if (Object.keys(input).length === 0) {
        return {
          content: [
            {
              type: 'text' as const,
              text: 'Error: No fields provided to update. Please provide at least one field to update.',
            },
          ],
          isError: true,
        };
      }

      const result = await sdk.McpUpdateBusinessContact({
        id,
        input,
      });

      const contact = result.updateBusinessContact;

      return {
        content: [
          {
            type: 'text' as const,
            text: JSON.stringify(
              {
                success: true,
                message: `Business contact "${contact?.name}" updated successfully`,
                contact,
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
            text: `Error updating business contact: ${error instanceof Error ? error.message : 'Unknown error'}`,
          },
        ],
        isError: true,
      };
    }
  },
});
