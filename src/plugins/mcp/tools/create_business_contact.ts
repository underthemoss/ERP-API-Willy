import { z } from 'zod';
import { gql } from 'graphql-request';
import { createMcpTool } from './types';

/**
 * GraphQL operation for create_business_contact tool.
 * This is picked up by codegen to generate typed SDK methods.
 */
gql`
  mutation McpCreateBusinessContact($input: BusinessContactInput!) {
    createBusinessContact(input: $input) {
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
 * create_business_contact MCP tool definition
 *
 * Creates a new business contact in a workspace.
 */
export const createBusinessContactTool = createMcpTool({
  name: 'create_business_contact',
  description:
    'Creates a new business contact (company) in the workspace. Returns the created business with their brand info.',
  inputSchema: {
    workspaceId: z
      .string()
      .describe('The workspace ID to create the contact in'),
    name: z.string().describe('The business name'),
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
      const {
        workspaceId,
        name,
        phone,
        address,
        taxId,
        website,
        notes,
        profilePicture,
        brandId,
        accountsPayableContactId,
        resourceMapIds,
        placeId,
        latitude,
        longitude,
      } = args;

      const result = await sdk.McpCreateBusinessContact({
        input: {
          workspaceId,
          name,
          ...(phone && { phone }),
          ...(address && { address }),
          ...(taxId && { taxId }),
          ...(website && { website }),
          ...(notes && { notes }),
          ...(profilePicture && { profilePicture }),
          ...(brandId && { brandId }),
          ...(accountsPayableContactId && { accountsPayableContactId }),
          ...(resourceMapIds && { resourceMapIds }),
          ...(placeId && { placeId }),
          ...(latitude !== undefined && { latitude }),
          ...(longitude !== undefined && { longitude }),
        },
      });

      const contact = result.createBusinessContact;

      return {
        content: [
          {
            type: 'text' as const,
            text: JSON.stringify(
              {
                success: true,
                message: `Business contact "${contact?.name}" created successfully`,
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
            text: `Error creating business contact: ${error instanceof Error ? error.message : 'Unknown error'}`,
          },
        ],
        isError: true,
      };
    }
  },
});
